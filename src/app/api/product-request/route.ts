import { NextRequest, NextResponse } from "next/server";

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

    // Check SMTP config and destination
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL ?? SMTP_USER ?? "no-reply@example.com";
    const TO_EMAIL = process.env.MAIL_TO ?? process.env.TO_EMAIL ?? "moheca3784@kikaga.com"; // allow overriding via env

    // Build plain text and html body
    const text = `Nieuwe productaanvraag\n\nNaam: ${name}\nE-mail: ${email}\nTelefoon: ${phone}\nProduct / omschrijving: ${product}\nAantal: ${quantity}\nGewenste leverdatum: ${date}\nBericht:\n${message}`;

    const html = `
      <h2>Nieuwe productaanvraag</h2>
      <p><strong>Naam:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Telefoon:</strong> ${phone}</p>
      <p><strong>Product / omschrijving:</strong> ${product}</p>
      <p><strong>Aantal:</strong> ${quantity}</p>
      <p><strong>Gewenste leverdatum:</strong> ${date}</p>
      <p><strong>Bericht:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
      <p>De eventuele afbeelding is als bijlage toegevoegd aan deze e-mail.</p>
    `;

    // Prepare attachments
    const attachments: Array<any> = [];
    if (image) {
      const maxBytes = 10 * 1024 * 1024; // 10MB server-side
      if (image.size > maxBytes) {
        return NextResponse.json({ error: "Bestand is te groot. Maximaal 10MB." }, { status: 400 });
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      attachments.push({
        filename: image.name || "image",
        content: buffer,
        contentType: image.type || "application/octet-stream"
      });
    }

    // Dynamically import nodemailer so server doesn't break if package not installed
    const nodemailer = await import("nodemailer");

    let transporter: any = null;
    let info: any = null;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      // Use provided SMTP
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      const mailOptions = {
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `Productaanvraag van ${name}`,
        text,
        html,
        attachments
      } as any;

      info = await transporter.sendMail(mailOptions);

      return NextResponse.json({ message: "Bedankt voor je aanvraag! We hebben je bericht verzonden.", _info: { messageId: info.messageId } });
    }

    // If SMTP not configured: in development, send with a test account (Ethereal) so messages can be previewed.
    if (process.env.NODE_ENV !== 'production') {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const mailOptions = {
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `[TEST] Productaanvraag van ${name}`,
        text,
        html,
        attachments
      } as any;

      info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info) ?? null;

      return NextResponse.json({ message: "Test-e-mail verstuurd (Ethereal). Bekijk preview-url in response.", previewUrl, _info: { messageId: info.messageId } });
    }

    console.error("SMTP settings missing and not in development; cannot send email.");
    return NextResponse.json({ error: "E-mailservice niet geconfigureerd. Stel SMTP_HOST, SMTP_PORT, SMTP_USER en SMTP_PASS in." }, { status: 500 });
  } catch (err) {
    console.error("Error in product-request route:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Interne serverfout" }, { status: 500 });
  }
}
