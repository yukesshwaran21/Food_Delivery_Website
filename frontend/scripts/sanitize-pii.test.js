import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizePii } from "./sanitize-pii.js";

test("sanitizes PII before test data is sent to AI", () => {
  const result = sanitizePii(
    'fullName: "Alex Doe", email: alex@example.com, phone: "+1 555-123-4567"'
  );

  assert.doesNotMatch(result, /Alex Doe|alex@example.com|555-123-4567/);
  assert.equal(result.match(/\{\{PLACEHOLDER\}\}/g)?.length, 3);
});
