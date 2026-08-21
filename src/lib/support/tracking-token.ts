import crypto from "crypto";

export function generateTrackingToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
}

export function hashTrackingToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
