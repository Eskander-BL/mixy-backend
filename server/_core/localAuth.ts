import { COOKIE_NAME_LOCAL, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import type { User } from "../../drizzle/schema";

const PAYLOAD_TYPE = "mixy_local" as const;

type LocalPayload = {
  typ: typeof PAYLOAD_TYPE;
  uid: string;
};

function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

/**
 * Session JWT (cookie httpOnly) pour comptes email + mot de passe (guest enregistré).
 */
export async function createLocalSessionToken(userId: number): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  return new SignJWT({ typ: PAYLOAD_TYPE, uid: String(userId) } satisfies LocalPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecretKey());
}

export async function setLocalSessionCookie(
  req: Request,
  res: Response,
  userId: number
): Promise<void> {
  const token = await createLocalSessionToken(userId);
  const opts = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME_LOCAL, token, { ...opts, maxAge: ONE_YEAR_MS });
}

export function clearLocalSessionCookie(req: Request, res: Response) {
  const opts = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME_LOCAL, { ...opts, maxAge: -1 });
}

export async function getUserFromLocalSessionCookie(
  req: Request
): Promise<User | null> {
  const raw = parseCookies(req.headers.cookie).get(COOKIE_NAME_LOCAL);
  if (!raw) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(raw, getSecretKey(), { algorithms: ["HS256"] });
    const p = payload as Record<string, unknown>;
    if (p.typ !== PAYLOAD_TYPE || typeof p.uid !== "string") {
      return null;
    }
    const userId = Number.parseInt(p.uid, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      return null;
    }
    const user = await db.getUserById(userId);
    if (!user?.passwordHash) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) {
    return new Map();
  }
  const parsed = parseCookieHeader(cookieHeader);
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") {
      map.set(key, value);
    }
  }
  return map;
}
