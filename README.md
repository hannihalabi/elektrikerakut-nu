# Elektrikerakut.nu

Snabb matchningstjänst för akuta elproblem i Stockholm, byggd med Next.js för Vercel.

## Lokal utveckling

1. Kopiera `.env.example` till `.env.local` och fyll i Postgres- och adminuppgifter.
2. Installera beroenden med `npm install`.
3. Kör databasmigreringen med `npm run db:migrate`.
4. Starta med `npm run dev`.

## Kvalitetskontroller

- `npm run lint`
- `npm test`

Partneransökningar sparas i Postgres. `/admin` skyddas med en signerad, tidsbegränsad och `httpOnly`-baserad session.
