import { randomBytes } from "node:crypto";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // base62

// Sinh ma ngan ngau nhien base62. 7 ky tu base62 ~ 62^7 ~ 3.5 nghin ty kha nang,
// du thua cho mot URL shortener thuong va kho doan.
export function generateShortCode(length = 7): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

// Chi chap nhan URL http/https hop le. Tra ve URL da chuan hoa hoac null.
export function normalizeUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const u = new URL(input);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
