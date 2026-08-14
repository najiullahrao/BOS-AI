// Simplified RFC 5322 address-spec pattern — permissive enough for real-world
// addresses without the full grammar's edge cases (quoted strings, comments).
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_POLICY_HINT = "Minimum 10 characters, at least 1 number and 1 letter.";

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("At least 1 letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least 1 number");
  }
  return { valid: errors.length === 0, errors };
}

export function isValidSixDigitCode(value: string): boolean {
  return /^[0-9]{6}$/.test(value.trim());
}
