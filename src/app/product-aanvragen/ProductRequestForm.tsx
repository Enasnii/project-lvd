"use client";

import React, { useState } from "react";

export default function ProductRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB client-side check

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Naam is verplicht.";
    if (!email.trim()) e.email = "E-mailadres is verplicht.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = "Ongeldig e-mailadres.";
    if (!product.trim()) e.product = "Productnaam of omschrijving is verplicht.";
    if (!quantity || Number(quantity) < 1) e.quantity = "Aantal is verplicht en moet minstens 1 zijn.";
    if (file && file.size > MAX_FILE_SIZE) e.file = "Bestand is te groot (max 10MB).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setServerMessage(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("product", product);
      formData.append("quantity", String(quantity));
      formData.append("date", date || "");
      formData.append("message", message);
      if (file) formData.append("image", file);

      const res = await fetch("/api/product-request", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setServerMessage(data?.error || "Er is iets misgegaan.");
      } else {
        setStatus("success");
        setServerMessage(data?.message || "Bedankt voor je aanvraag! We hebben je bericht ontvangen en nemen zo snel mogelijk contact met je op.");
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setProduct("");
        setQuantity(1);
        setDate("");
        setMessage("");
        setFile(null);
        setErrors({});
      }
    } catch (err) {
      setStatus("error");
      setServerMessage("Er is iets misgegaan bij het versturen. Probeer het later opnieuw.");
      console.error(err);
    }
  }

  return (
    <div className="form-card shadow-md">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block font-medium mb-1">Naam *</label>
          <input className="w-full border px-3 py-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">E-mailadres *</label>
          <input type="email" className="w-full border px-3 py-2 rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Telefoonnummer</label>
          <input className="w-full border px-3 py-2 rounded" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Productnaam of omschrijving *</label>
          <textarea className="w-full border px-3 py-2 rounded" value={product} onChange={(e) => setProduct(e.target.value)} rows={3} />
          {errors.product && <p className="text-red-600 text-sm mt-1">{errors.product}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Aantal *</label>
          <input type="number" min={1} className="w-full border px-3 py-2 rounded" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Gewenste leverdatum</label>
          <input type="date" className="w-full border px-3 py-2 rounded" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Extra toelichting / bericht</label>
          <textarea className="w-full border px-3 py-2 rounded" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Afbeelding uploaden (jpg, png, webp) — optioneel</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
            }}
          />
          {errors.file && <p className="text-red-600 text-sm mt-1">{errors.file}</p>}
          <p className="text-sm text-gray-600 mt-1">Maximaal 10MB. De afbeelding wordt meegestuurd als bijlage in de e-mail.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Versturen..." : "Verstuur aanvraag"}
          </button>

          {status === "success" && <p className="text-green-600">{serverMessage}</p>}
          {status === "error" && <p className="text-red-600">{serverMessage}</p>}
        </div>
      </form>
    </div>
  );
}
