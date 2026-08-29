'use server';

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'sticker-admin-auth';

export async function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? '',
    password: process.env.ADMIN_PASSWORD ?? ''
  };
}

export async function verifyAdminCredentials(username: string, password: string) {
  const { username: expectedUser, password: expectedPassword } = await getAdminCredentials();
  return username.trim() === expectedUser && password.trim() === expectedPassword;
}

export async function setAdminAuthCookie(response?: NextResponse) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 8
  };

  if (response) {
    response.cookies.set(ADMIN_COOKIE_NAME, 'true', cookieOptions);
    return;
  }

  cookies().set(ADMIN_COOKIE_NAME, 'true', cookieOptions);
}

export async function clearAdminAuthCookie(response?: NextResponse) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0
  };

  if (response) {
    response.cookies.set(ADMIN_COOKIE_NAME, '', cookieOptions);
    return;
  }

  cookies().set(ADMIN_COOKIE_NAME, '', cookieOptions);
}

export async function isAdminAuthenticated() {
  return cookies().get(ADMIN_COOKIE_NAME)?.value === 'true';
}
