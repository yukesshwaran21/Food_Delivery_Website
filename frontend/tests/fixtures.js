
import "dotenv/config";
import { test as base, expect } from "@playwright/test";
import { GoogleGenAI } from "@google/genai";
import { sanitizePii } from "../scripts/sanitize-pii.js";

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const CANDIDATE_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[data-testid]",
  "img.add-icon",
  ".remove-btn",
  ".quantity-btn",
].join(",");

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const actionMethods = new Set([
  "click",
  "dblclick",
  "fill",
  "clear",
  "check",
  "uncheck",
  "selectOption",
  "hover",
  "press",
  "focus",
  "tap",
]);

const chainMethods = new Set([
  "locator",
  "getByRole",
  "getByText",
  "getByLabel",
  "getByPlaceholder",
  "getByTestId",
  "getByAltText",
  "filter",
  "first",
  "last",
  "nth",
]);

function describeCall(previous, method, args) {
  const safeArgs = args.map((arg) => {
    if (typeof arg === "string") {
      return JSON.stringify(arg.slice(0, 150));
    }

    if (arg && typeof arg === "object") {
      return JSON.stringify(arg);
    }

    return String(arg);
  });

  return `${previous}.${method}(${safeArgs.join(", ")})`;
}

async function getCandidates(page) {
  return page.locator(CANDIDATE_SELECTOR).evaluateAll((elements) => {
    function cssPath(element) {
      if (element.id) {
        const escaped = CSS.escape(element.id);
        const selector = `#${escaped}`;

        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      }

      const parts = [];
      let current = element;

      while (current && current.nodeType === 1) {
        let part = current.tagName.toLowerCase();

        if (current.parentElement) {
          const siblings = Array.from(
            current.parentElement.children
          ).filter((child) => child.tagName === current.tagName);

          if (siblings.length > 1) {
            part += `:nth-of-type(${
              siblings.indexOf(current) + 1
            })`;
          }
        }

        parts.unshift(part);

        if (current.id) break;

        current = current.parentElement;
      }

      return parts.join(" > ");
    }

    return elements.map((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return {
        selector: cssPath(element),
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role") || "",
        text: (
          element.innerText ||
          element.value ||
          element.getAttribute("aria-label") ||
          ""
        ).replace(/\s+/g, " ").trim().slice(0, 120),
        ariaLabel: element.getAttribute("aria-label") || "",
        testId: element.getAttribute("data-testid") || "",
        title: element.getAttribute("title") || "",
        id: element.id || "",
        visible:
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0,
        disabled:
          "disabled" in element
            ? Boolean(element.disabled)
            : element.getAttribute("aria-disabled") === "true",
      };
    });
  });
}

async function healAction(page, description, method, args, originalError) {
  if (!ai) {
    throw originalError;
  }

  const candidates = (await getCandidates(page))
    .filter((candidate) => candidate.visible && !candidate.disabled)
    .slice(0, 100);

  if (!candidates.length) {
    throw originalError;
  }

  console.warn(`[Self-healing] Failed action: ${description}`);
  console.warn("[Self-healing] Asking Gemini for a replacement...");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: JSON.stringify({
      task: "Choose a replacement UI element for a failed Playwright action.",
      failedLocator: sanitizePii(description),
      action: method,
      candidates: JSON.parse(sanitizePii(JSON.stringify(candidates))),
      rules: [
        "Choose only an element that represents the same intended target.",
        "Do not choose an unrelated button or action.",
        "Do not infer a replacement from tag name alone.",
        "Return null if there is insufficient evidence.",
        "Return JSON with candidateIndex, confidence, and reason.",
      ],
    }),
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  let decision;

  try {
    decision = JSON.parse(response.text);
  } catch {
    throw new Error("Self-healing stopped: Gemini returned invalid JSON.");
  }

  const index = decision.candidateIndex;
  const confidence = Number(decision.confidence);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= candidates.length ||
    !Number.isFinite(confidence) ||
    confidence < 0.90
  ) {
    throw new Error(
      `Self-healing rejected the replacement: ${
        decision.reason || "No reliable candidate."
      }`
    );
  }

  const selected = candidates[index];

  // Recheck the chosen element immediately before retrying.
  const replacement = page.locator(selected.selector);

  if (
    (await replacement.count()) !== 1 ||
    !(await replacement.isVisible()) ||
    !(await replacement.isEnabled())
  ) {
    throw new Error(
      "Self-healing stopped: the replacement is no longer unique, visible, and enabled."
    );
  }

  const current = await replacement.evaluate((element) => ({
    tag: element.tagName.toLowerCase(),
    text: (
      element.innerText ||
      element.value ||
      element.getAttribute("aria-label") ||
      ""
    ).replace(/\s+/g, " ").trim().slice(0, 120),
    ariaLabel: element.getAttribute("aria-label") || "",
    testId: element.getAttribute("data-testid") || "",
    id: element.id || "",
  }));

  if (
    current.tag !== selected.tag ||
    current.text !== selected.text ||
    current.ariaLabel !== selected.ariaLabel ||
    current.testId !== selected.testId ||
    current.id !== selected.id
  ) {
    throw new Error(
      "Self-healing stopped: the candidate changed during recovery."
    );
  }

  console.warn("[Self-healing] Replacement selected:", {
    selector: selected.selector,
    confidence,
    reason: decision.reason,
  });

  // Preserve the original action arguments, but limit retry time.
  const retryArgs = [...args];
  const optionsIndex = [
    "click",
    "dblclick",
    "check",
    "uncheck",
    "hover",
    "focus",
    "tap",
  ].includes(method) ? 0 : 1;

  const existingOptions = retryArgs[optionsIndex];

  if (
    existingOptions === null ||
    typeof existingOptions === "object"
  ) {
    retryArgs[optionsIndex] = {
      ...(existingOptions || {}),
      timeout: 3000,
    };
  }

  try {
    await replacement[method](...retryArgs);
    console.warn("[Self-healing] Action recovered successfully.");

    return {
      healed: true,
      selector: selected.selector,
      confidence,
    };
  } catch (error) {
    throw new Error(
      `Self-healing retry failed: ${error.message}`
    );
  }
}

function wrapLocator(locator, page, description) {
  return new Proxy(locator, {
    get(target, property) {
      const value = Reflect.get(target, property, target);

      if (typeof value !== "function") {
        return value;
      }

      if (chainMethods.has(property)) {
        return (...args) => {
          const child = value.apply(target, args);

          return wrapLocator(
            child,
            page,
            describeCall(description, property, args)
          );
        };
      }

      if (actionMethods.has(property)) {
        return async (...args) => {
          const optionsIndex = [
            "click",
            "dblclick",
            "check",
            "uncheck",
            "hover",
            "focus",
            "tap",
          ].includes(property) ? 0 : 1;

          const originalArgs = [...args];
          const existingOptions = originalArgs[optionsIndex];

          if (
            existingOptions === null ||
            typeof existingOptions === "object"
          ) {
            originalArgs[optionsIndex] = {
              ...(existingOptions || {}),
              timeout: 3000,
            };
          }

          try {
            return await value.apply(target, originalArgs);
          } catch (error) {
            return healAction(
              page,
              description,
              property,
              args,
              error
            );
          }
        };
      }

      return value.bind(target);
    },
  });
}

function wrapPage(page) {
  return new Proxy(page, {
    get(target, property) {
      const value = Reflect.get(target, property, target);

      if (
        typeof value === "function" &&
        ["locator", "getByRole", "getByText", "getByLabel",
         "getByPlaceholder", "getByTestId", "getByAltText"].includes(
          property
        )
      ) {
        return (...args) =>
          wrapLocator(
            value.apply(target, args),
            target,
            `page.${property}(${args.map(String).join(", ")})`
          );
      }

      return typeof value === "function"
        ? value.bind(target)
        : value;
    },
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(wrapPage(page));
  },
});

export { expect };
