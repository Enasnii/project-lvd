import React from "react";
import ProductRequestForm from "./ProductRequestForm";
import SiteHeader from "../SiteHeader";

export const metadata = {
  title: "Product aanvragen",
  description: "Vraag een product aan of vraag een offerte aan."
};

export default function Page() {
  return (
    <main className="container page-shell">
      <SiteHeader />
      <div className="request-page-content">
        <h1 className="text-3xl font-bold mb-4">Product aanvragen</h1>
        <p className="text-gray-700 mb-6">
          Heb je interesse in een product of wil je iets op maat laten maken? Vul het formulier in en upload eventueel een foto. We nemen zo snel mogelijk contact met je op.
        </p>

        <ProductRequestForm />

        <div className="mt-8 text-sm text-gray-600">
          <p>Na het versturen ontvang je een bevestiging op het scherm. We bewaren je aanvraag veilig zodat we die vanuit het adminpanel kunnen behandelen.</p>
        </div>
      </div>
    </main>
  );
}
