const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length === 0 || email.length > 254) return false;
  const [local] = email.split("@");
  if (local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".") || email.includes("..")) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}