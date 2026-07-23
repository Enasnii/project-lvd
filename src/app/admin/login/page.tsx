"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { setAdminAuthCookie } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
    const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Gurbetabe123';

    if (username.trim() !== validUsername || password.trim() !== validPassword) {
      setError('Onjuiste inloggegevens.');
      return;
    }

    await setAdminAuthCookie();
    router.push('/admin');
  }

  return (
    <main className="container" style={{ paddingBottom: '3rem' }}>
      <nav>
        <div><strong>Stickerbedrijf Admin</strong></div>
        <div className="nav-links">
          <Link href="/">Terug naar site</Link>
        </div>
      </nav>
      <section className="hero">
        <h1>Admin login</h1>
        <p>Voer je gebruikersnaam en wachtwoord in om toegang te krijgen tot het beheer.</p>
        <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: 420 }}>
          <label>Gebruikersnaam
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>Wachtwoord
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn btn-primary" type="submit">Inloggen</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}
