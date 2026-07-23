'use server';

import { cookies } from 'next/headers';

export async function setAdminAuthCookie() {
  cookies().set('sticker-admin-auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8
  });
}

export async function clearAdminAuthCookie() {
  cookies().set('sticker-admin-auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export async function isAdminAuthenticated() {
  return cookies().get('sticker-admin-auth')?.value === 'true';
}
