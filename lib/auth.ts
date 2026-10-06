import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextRequest, NextResponse } from "next/server"

export const ADMIN_COOKIE = "fg_admin"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "liga-fallguys"
}

function secret() {
  return process.env.ADMIN_SECRET || adminPassword()
}

export function passwordsMatch(input: string, expected: string) {
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) {
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}

export function signSession() {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000
  const body = `admin.${exp}`
  const sig = createHmac("sha256", secret()).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifySession(token: string | undefined) {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [role, exp, sig] = parts
  if (role !== "admin") return false
  const expiresAt = Number(exp)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  const expected = createHmac("sha256", secret())
    .update(`${role}.${exp}`)
    .digest("base64url")
  const given = Buffer.from(sig)
  const target = Buffer.from(expected)
  if (given.length !== target.length) return false
  return timingSafeEqual(given, target)
}

export function isAdmin(request: NextRequest) {
  return verifySession(request.cookies.get(ADMIN_COOKIE)?.value)
}

export function setAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, signSession(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  })
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
