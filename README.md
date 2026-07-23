# Stickerbedrijf website

Een volledige, productie-klare Next.js-app voor een stickerbedrijf met:
- een publieke prijslijstpagina
- een beveiligd admin-dashboard op /admin
- productbeheer, prijswijzigingen en afbeeldings-URLs
- een eenvoudige, veilige single-user login-oplossing via environment variables

## Stack
- Next.js App Router
- React + TypeScript
- Local browser storage voor demo-data op Vercel (geen database nodig)
- Geen externe image-hosting vereist; gebruik directe afbeeldings-URLs



## Omgevingsvariabelen
Stel deze variabelen in in Vercel > Project > Settings > Environment Variables:
- NEXT_PUBLIC_ADMIN_USERNAME
- NEXT_PUBLIC_ADMIN_PASSWORD
- BLOB_READ_WRITE_TOKEN

Voorbeeldwaarden:
- NEXT_PUBLIC_ADMIN_USERNAME=admin
- NEXT_PUBLIC_ADMIN_PASSWORD=sterk-wachtwoord-123
- BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

## Deployen op Vercel
1. Upload deze map naar GitHub of GitLab.
2. Maak een nieuwe Vercel-app aan en verbind de repository.
3. Stel de environment variables hierboven in.
4. Zorg dat de Root Directory in Vercel op de hoofdmap van dit project staat.
5. Deploy.

## Beveiliging
- Admin-routes zijn beschermd met een auth-cookie.
- Inloggegevens worden niet hardcoded in de code; ze komen uit environment variables.
- Server-side inputvalidatie wordt gedaan in de admin-flow.

## Opmerking
Voor productie met meerdere admins of echte persistence is het verstandig om over te stappen op Supabase of Vercel Postgres plus een echte image-oplossing zoals Vercel Blob of Cloudinary.
