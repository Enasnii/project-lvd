# Stickerbedrijf website

Een volledige, productie-klare Next.js-app voor een stickerbedrijf met:
- een publieke prijslijstpagina
- een beveiligd admin-dashboard op /admin
- productbeheer, prijswijzigingen en afbeeldings-URLs
- een veilige single-user login-oplossing via server-side environment variables

## Stack
- Next.js App Router
- React + TypeScript
- PostgreSQL in Docker
- lokale bestandsopslag op Ubuntu/Docker volume

## Lokale ontwikkeling
1. Installeer dependencies:
   `npm install`
2. Start de ontwikkelserver:
   `npm run dev`
3. Open http://localhost:3000

## Omgevingsvariabelen
Gebruik deze variabelen in Docker of lokaal:
- POSTGRES_URL
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- ADMIN_USERNAME
- ADMIN_PASSWORD
- APP_STORAGE_DIR

Voorbeeldwaarden:
- POSTGRES_URL=postgres://appuser:change-me@db:5432/lvd
- ADMIN_USERNAME=admin
- ADMIN_PASSWORD=change-me
- APP_STORAGE_DIR=/app/storage

## Docker / self-hosting
1. Zet de variabelen in een `.env`-bestand.
2. Start de stack met `docker compose up --build`.
3. De app gebruikt PostgreSQL in Docker en persistent opslag in `/home/insane/lddesign-storage`.

## Beveiliging
- Admin-routes zijn beschermd met een auth-cookie.
- Inloggegevens worden niet naar de browser-bundle gestuurd.
- Credential-validatie gebeurt server-side.

## Opmerking
Productdata wordt opgeslagen in PostgreSQL. Pages, portfolio, productaanvragen en uploads worden lokaal in de Docker bind mount opgeslagen, zodat data blijft bestaan bij recreatie van containers.
