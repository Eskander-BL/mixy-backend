import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SCRYPT_PREFIX = "scrypt$";

function normalizePassword(password: string) {
  return password.normalize("NFKC");
}

/**
 * Hachage mot de passe (scrypt) — format stocké: `scrypt$<salt_hex>$<hash_hex>`.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(normalizePassword(plain), salt, 64)) as Buffer;
  return `${SCRYPT_PREFIX}${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !stored.startsWith(SCRYPT_PREFIX)) {
    return false;
  }
  const without = stored.slice(SCRYPT_PREFIX.length);
  const [saltHex, hashHex] = without.split("$");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(normalizePassword(plain), salt, 64)) as Buffer;
  if (expected.length !== derived.length) {
    return false;
  }
  return timingSafeEqual(expected, derived);
}
