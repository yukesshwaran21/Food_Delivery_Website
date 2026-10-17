import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const reportDirectory = process.env.CI_REPORT_DIRECTORY || "test-results/ci";
const outputFile = join(
  reportDirectory,
  "ollama-failure-report.md"
);
const ollamaUrl = (
  process.env.OLLAMA_URL || "http://127.0.0.1:11434"
).replace(/\/$/, "");
const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";
const logFiles = ["lint.log", "unit.log", "integration.log", "e2e.log", "build.log"];

async function readIfPresent(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

async function loadEvidence() {
  const logs = await Promise.all(
    logFiles.map(async (fileName) => {
      const content = await readIfPresent(join(reportDirectory, fileName));
      return content ? `### ${fileName}\n${content}` : "";
    })
  );
  const results = await readIfPresent(join(reportDirectory, "..", "results.json"));
  return [
    logs.filter(Boolean).join("\n\n"),
    results ? `### Playwright JSON results\n${results}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 120000);
}

function buildPrompt(evidence) {
  return `
You are diagnosing a failed CI run for a JavaScript food delivery application.
Use only the CI evidence below. Do not invent failures, test names, files,
stack traces, or fixes. Distinguish a test failure from a skipped test caused
by an earlier failure. Report every failed command and failed test that is
present in the evidence.

Return Markdown with exactly these headings:
## Failed checks
## Failed tests
## Possible fixes
## Evidence gaps

Under "Failed checks", include the command and its exit evidence.
Under "Failed tests", include the test file, test title, and useful error
details when available. If there are no individual test details, say so.
Under "Possible fixes", give a concrete, code-oriented fix for each failure,
but label suggestions as hypotheses when the evidence is incomplete.
Under "Evidence gaps", mention skipped tests, missing logs, or unavailable
diagnostics. Never describe a skipped test as passed.

CI evidence:
${evidence}
`.trim();
}

async function generateReport(prompt) {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama API request failed (${response.status}): ${(await response.text()).slice(0, 500)}`
    );
  }

  const result = await response.json();
  const report = result.response?.trim();
  if (!report) throw new Error("Ollama returned an empty CI failure report.");
  return report;
}

async function main() {
  const evidence = await loadEvidence();
  if (!evidence) throw new Error("No CI failure evidence was found.");

  const report = await generateReport(buildPrompt(evidence));
  await writeFile(
    outputFile,
    `# Ollama CI Failure Report\n\n${report}\n`,
    "utf8"
  );
  console.log(`Wrote Ollama CI failure report to ${outputFile}.`);
}

main().catch((error) => {
  console.error(`Ollama CI failure report failed: ${error.message}`);
  process.exitCode = 1;
});
