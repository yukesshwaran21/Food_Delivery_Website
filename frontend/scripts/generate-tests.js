
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Read the requirement filename from the command line.
const requirementName = process.argv[2];

if (!requirementName || !/^[a-z0-9-]+\.md$/i.test(requirementName)) {
  console.error(
    "Usage: npm run test:generate -- cart.md"
  );
  process.exit(1);
}

const featureName = requirementName.replace(/\.md$/i, "");

const requirementPath = path.join(
  projectRoot,
  "test-requirements",
  requirementName
);

const outputPath = path.join(
  projectRoot,
  "tests",
  `${featureName}.spec.js`
);

const MODEL = "gemini-3.5-flash-lite";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from frontend/.env");
  }

  const requirement = await fs.readFile(requirementPath, "utf8");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  console.log(`Generating tests with Gemini: ${MODEL}`);
  console.log(`Requirement: ${requirementName}`);
  console.log(`Output: ${outputPath}`);

  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: MODEL,
        contents: `
Generate JavaScript Playwright tests for this requirement:

${requirement}
        `,
        config: {
          systemInstruction: `
You are a senior QA automation engineer specializing in Playwright.

Rules:
- Import { test, expect } from "@playwright/test".
- Write independent tests.
- Prefer getByRole(), getByLabel(), and getByTestId().
- Use the configured Playwright baseURL.
- Cover positive, negative, and boundary cases where relevant.
- Assert observable application behavior.
- Do not invent selectors, routes, or application features.
- Use TODO comments when UI details are unknown.
- Do not use eval, require, child_process, or process.env.
- Do not perform file operations or external side effects.
- Return only JavaScript source code, without Markdown fences.
          `.trim(),
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      });

      break;
    } catch (error) {
      const message = String(error.message || error);
      const retryable =
        /\b503\b|\b429\b|\b500\b|\b502\b|\b504\b/.test(message);

      if (!retryable || attempt === 3) {
        throw error;
      }

      const delay = attempt * 5000;

      console.log(
        `Temporary API error. Retrying in ${delay / 1000} seconds (attempt ${attempt}/3)...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (!response) {
    throw new Error("Gemini did not return a response.");
  }

  let code = response.text?.trim();

  if (!code) {
    throw new Error("Gemini returned an empty response.");
  }

  // Remove Markdown fences.
  code = code
    .replace(/^```(?:javascript|js)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Basic safety checks.
  const forbidden = [
    /\bchild_process\b/,
    /\bprocess\s*\.\s*env\b/,
    /\beval\s*\(/,
    /\bnew\s+Function\b/,
    /\b(?:writeFileSync|execSync|spawnSync)\b/,
  ];

  if (forbidden.some((pattern) => pattern.test(code))) {
    throw new Error(
      "Generated code failed a basic safety check. Review it manually."
    );
  }

  if (!/from\s*["']@playwright\/test["']/.test(code)) {
    throw new Error(
      "Generated code is missing the Playwright test import."
    );
  }

  // Prevent overwriting the output for this specific feature.
  try {
    await fs.access(outputPath);
    throw new Error(
      `${featureName}.spec.js already exists. Rename or move it before regenerating.`
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, code, "utf8");

  console.log("Test generation completed.");
  console.log(`Generated file: ${outputPath}`);
  console.log("Review the generated code before executing it.");
}

main().catch((error) => {
  console.error("Test generation failed:", error.message);
  process.exitCode = 1;
});
