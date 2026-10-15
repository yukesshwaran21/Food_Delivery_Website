const piiFieldPattern =
  /(["']?(?:fullName|firstName|lastName|customerName|email|phone|mobile|address|userName|username)["']?\s*[:=]\s*)(["'`])([^"'`]*?)\2/gi;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phonePattern = /(?<!\d)\+?\d[\d\s().-]{7,}\d(?!\d)/g;

export function sanitizePii(value) {
  return String(value ?? "")
    .replace(
      piiFieldPattern,
      (_match, prefix, quote) => `${prefix}${quote}{{PLACEHOLDER}}${quote}`
    )
    .replace(emailPattern, "{{PLACEHOLDER}}")
    .replace(phonePattern, "{{PLACEHOLDER}}");
}
