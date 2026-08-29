"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SiteHeader from '../../SiteHeader';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Onjuiste inloggegevens.');
        return;
      }

      router.push('/admin');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Inloggen mislukt.');
    }
  }

  return (
    <main className="container" style={{ paddingBottom: '3rem' }}>
      <SiteHeader />
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
