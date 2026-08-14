import { isValidEmail, validatePassword } from "@/lib/validation";

/**
 * Log in with this address (any password that passes the policy) to preview
 * the MFA code step — no real backend exists, this is a demo-only trigger.
 */
export const MFA_TEST_ACCOUNT_EMAIL = "mfa@northlightagency.com";

const MOCK_LATENCY_MS = 500;

function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FieldErrors {
  [field: string]: string | undefined;
}

export type AuthResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; errors: FieldErrors };

export async function mockRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  await delay();
  const errors: FieldErrors = {};
  if (!input.name.trim()) errors.name = "Name is required";
  if (!isValidEmail(input.email)) errors.email = "Enter a valid email address";
  const passwordCheck = validatePassword(input.password);
  if (!passwordCheck.valid) errors.password = passwordCheck.errors.join(", ");

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true };
}

export async function mockLogin(input: {
  email: string;
  password: string;
}): Promise<AuthResult<{ mfaRequired: boolean }>> {
  await delay();
  const errors: FieldErrors = {};
  if (!isValidEmail(input.email)) errors.email = "Enter a valid email address";
  const passwordCheck = validatePassword(input.password);
  if (!passwordCheck.valid) errors.password = "Incorrect email or password";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const mfaRequired = input.email.trim().toLowerCase() === MFA_TEST_ACCOUNT_EMAIL;
  return { ok: true, mfaRequired };
}

export async function mockVerifyMfaCode(code: string): Promise<AuthResult> {
  await delay(400);
  if (!/^[0-9]{6}$/.test(code.trim())) {
    return { ok: false, errors: { code: "Enter the 6-digit code from your authenticator app" } };
  }
  if (code === "000000") {
    return { ok: false, errors: { code: "Invalid code — try again" } };
  }
  return { ok: true };
}

export async function mockForgotPassword(email: string): Promise<AuthResult> {
  await delay();
  // Always resolve ok regardless of whether the address is registered —
  // the UI must show a generic message either way to avoid account enumeration.
  void email;
  return { ok: true };
}

export async function mockChangePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthResult> {
  await delay();
  const errors: FieldErrors = {};
  if (!input.currentPassword) errors.currentPassword = "Enter your current password";
  const passwordCheck = validatePassword(input.newPassword);
  if (!passwordCheck.valid) errors.newPassword = passwordCheck.errors.join(", ");

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true };
}

export async function mockReauthenticate(password: string): Promise<AuthResult> {
  await delay(400);
  if (!password) return { ok: false, errors: { password: "Enter your password to continue" } };
  return { ok: true };
}
