import crypto from "crypto";

export function generateOnboardingToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function buildSetupLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://my.onesolutionscompanies.com";
  return `${base}/set-password?token=${token}`;
}
