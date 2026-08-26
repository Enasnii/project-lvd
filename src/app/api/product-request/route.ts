import { NextRequest, NextResponse } from "next/server";
import { createProductRequest, uploadRequestImage } from '@/lib/product-requests-store';

export const runtime = "nodejs";

async function parseForm(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const product = String(formData.get("product") ?? "").trim();
  const quantityStr = String(formData.get("quantity") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const image = formData.get("image") as File | null;

  const quantity = Number(quantityStr) || 0;
  return { name, email, phone, product, quantity, date, message, image };
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, product, quantity, date, message, image } = await parseForm(request);

    // Basic validation
    const errors: string[] = [];
    if (!name) errors.push("Naam is verplicht.");
    if (!email) errors.push("E-mailadres is verplicht.");
    if (!product) errors.push("Productnaam of omschrijving is verplicht.");
    if (!quantity || quantity < 1) errors.push("Aantal is verplicht en moet minstens 1 zijn.");

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    let imageUrl = '';
    if (image) {
      const maxBytes = 10 * 1024 * 1024;
      if (image.size > maxBytes) {
        return NextResponse.json({ error: "Bestand is te groot. Maximaal 10MB." }, { status: 400 });
      }
      imageUrl = await uploadRequestImage(image);
    }

    await createProductRequest({ name, email, phone, product, quantity, date, message, imageUrl });
    return NextResponse.json({ message: "Bedankt voor je aanvraag! We hebben je aanvraag opgeslagen." });
  } catch (err) {
    console.error("Error in product-request route:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Interne serverfout" }, { status: 500 });
  }
}
