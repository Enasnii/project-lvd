'use server';

import { cookies } from 'next/headers';
import { cookieName, createAdminSessionToken, sessionLifetimeSeconds, verifyAdminSessionToken } from './admin-session';

export async function authenticateAdmin(username: string, password: string) {
  const validUsername = process.env.ADMIN_USERNAME || process.env.NEXT_PUBLIC_ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!validUsername || !validPassword || username.trim() !== validUsername || password.trim() !== validPassword) return false;
  cookies().set(cookieName, await createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionLifetimeSeconds
  });
  return true;
}

export async function clearAdminAuthCookie() {
  cookies().set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function isAdminAuthenticated() {
  return verifyAdminSessionToken(cookies().get(cookieName)?.value);
}
