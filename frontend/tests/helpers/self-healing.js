
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[data-testid]",
].join(",");

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

async function getCandidates(page) {
  return page.locator(INTERACTIVE_SELECTOR).evaluateAll((elements) =>
    elements.map((element, fullIndex) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0;

      const text = (
        element.innerText ||
        element.value ||
        element.getAttribute("aria-label") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);

      return {
        fullIndex,
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role") || "",
        text,
        ariaLabel: element.getAttribute("aria-label") || "",
        title: element.getAttribute("title") || "",
        testId: element.getAttribute("data-testid") || "",
        id: element.id || "",
        placeholder: element.getAttribute("placeholder") || "",
        disabled:
          "disabled" in element
            ? Boolean(element.disabled)
            : element.getAttribute("aria-disabled") === "true",
        visible,
      };
    })
  );
}

export async function selfHealClick(
  page,
  originalSelector,
  elementDescription
) {
  // Always try the original locator first.
  try {
    await page.locator(originalSelector).click({
      timeout: 3000,
    });

    console.log(`Original locator succeeded: ${originalSelector}`);
    return { healed: false, selector: originalSelector };
  } catch (originalError) {
    console.warn(
      `Original locator failed: ${originalSelector}`
    );

    if (!ai) {
      throw new Error(
        `Self-healing requires GEMINI_API_KEY. ` +
          `Original locator failed: ${originalSelector}`
      );
    }

    const candidates = (await getCandidates(page)).filter(
      (candidate) => candidate.visible && !candidate.disabled
    );

    if (candidates.length === 0) {
      throw new Error(
        "Self-healing failed: no visible, enabled UI candidates found."
      );
    }

    const prompt = `
You are assisting with Playwright locator recovery.

Intended action: click.
Original locator: ${originalSelector}
Intended element description: ${elementDescription}

The original locator failed. Select an alternative ONLY when
the candidate metadata strongly supports that it is the same
intended element.

Candidates:
${JSON.stringify(candidates, null, 2)}

Rules:
- Do not choose a candidate merely because it is a button.
- Prefer matching accessible name, role, text, test ID, or title.
- Reject unrelated actions, such as Delete, Logout, or Checkout,
  when the intended action is adding an item to a cart.
- If the intended element cannot be identified confidently,
  return candidateIndex as null.
- Return JSON only in this format:
{
  "candidateIndex": 0,
  "confidence": 0.95,
  "reason": "Brief explanation"
}

candidateIndex must equal the candidate's fullIndex.
Confidence must be between 0 and 1.
`;

    let response;

    try {
      response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      });
    } catch (error) {
      throw new Error(
        `AI locator recovery failed: ${error.message}. ` +
          `Original locator: ${originalSelector}`
      );
    }

    let decision;

    try {
      decision = JSON.parse(response.text);
    } catch {
      throw new Error(
        "AI locator recovery returned invalid JSON. Test stopped."
      );
    }

    const confidence = Number(decision.confidence);
    const selectedIndex = decision.candidateIndex;

    if (
      !Number.isInteger(selectedIndex) ||
      !Number.isFinite(confidence) ||
      confidence < 0.85
    ) {
      throw new Error(
        `AI could not identify a sufficiently confident replacement. ` +
          `Reason: ${decision.reason || "No reliable match"}`
      );
    }

    const selected = candidates.find(
      (candidate) => candidate.fullIndex === selectedIndex
    );

    if (!selected) {
      throw new Error(
        "AI selected a candidate that is no longer available."
      );
    }

    // Recheck the candidate after the API call; the page may have changed.
    const locator = page
      .locator(INTERACTIVE_SELECTOR)
      .nth(selected.fullIndex);

    if (!(await locator.isVisible()) || !(await locator.isEnabled())) {
      throw new Error(
        "Selected replacement is no longer visible or enabled."
      );
    }

    const current = await locator.evaluate((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (
        element.innerText ||
        element.value ||
        element.getAttribute("aria-label") ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180),
      ariaLabel: element.getAttribute("aria-label") || "",
      testId: element.getAttribute("data-testid") || "",
      id: element.id || "",
    }));

    if (
      current.tag !== selected.tag ||
      normalizeText(current.text) !== normalizeText(selected.text) ||
      current.ariaLabel !== selected.ariaLabel ||
      current.testId !== selected.testId ||
      current.id !== selected.id
    ) {
      throw new Error(
        "UI changed during recovery. Refusing to click an unverified element."
      );
    }

    console.warn("Self-healing locator selected:", {
      originalSelector,
      replacement: selected,
      confidence,
      reason: decision.reason,
    });

    // Reuse the existing Playwright assertion/action flow.
    try {
      await locator.click({ timeout: 3000 });
    } catch (error) {
      throw new Error(
        `Replacement locator failed to click: ${error.message}`
      );
    }

    return {
      healed: true,
      originalSelector,
      replacement: selected,
      confidence,
      reason: decision.reason,
    };
  }
}
