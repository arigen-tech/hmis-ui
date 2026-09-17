
/**
 * Sanitize a raw input string to a positive whole number (integer > 0).
 * - Strips all non-digit characters
 * - Returns "" for empty input (so the field can be cleared)
 * - Enforces a minimum of 1
 */
export const sanitizePositiveInt = (value) => {
  const raw = String(value ?? "").replace(/\D/g, "");
  if (raw === "") return "";
  return String(Math.max(0, parseInt(raw, 10)));
};

/**
 * Keydown guard that blocks non-digit characters.
 * Allows control/navigation keys (Backspace, Tab, Arrow keys, Delete, etc.)
 */
export const blockNonDigitKeys = (e) => {
  const blockedKeys = ["e", "E", "+", "-", ".", ","];
  const isBlockedKey = blockedKeys.includes(e.key);
  const isSingleChar = e.key.length === 1;
  const isNonDigit = isSingleChar && !/\d/.test(e.key);

  if (isBlockedKey || isNonDigit) {
    e.preventDefault();
  }
};

