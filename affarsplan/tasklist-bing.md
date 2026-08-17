# Checklista: synlighet utanför Google

Mål: Elektrikerakut.nu ska kunna upptäckas, crawlas och följas i Bing, Copilot, Safari-användares valda sökmotorer och andra söktjänster — utan att skapa vilseledande lokala företagsuppgifter.

## 1. Sätt upp Bing Webmaster Tools

- [ ] Skapa eller logga in på ett Microsoft-konto för verksamheten.
- [ ] Lägg till `https://elektrikerakut.nu` i [Bing Webmaster Tools](https://www.bing.com/webmasters/).
- [ ] Verifiera webbplatsen. Använd helst import från Google Search Console om kontot erbjuder det; annars DNS-verifiering.
- [ ] Skicka in sitemap: `https://elektrikerakut.nu/sitemap.xml`.
- [ ] Kontrollera att Bing hittar rätt antal publika URL:er och att tekniska URL:er inte behandlas som landningssidor.

## 2. Gör en första Bing-granskning

- [ ] Kör **Site Scan** mot hemsidan eller sitemap i Bing Webmaster Tools.
- [ ] Åtgärda fel med HTTP-status, robots.txt, noindex, canonical och omdirigeringar först.
- [ ] Öppna **URL Inspection** för startsidan, `/eljour`, tre lokala eljourssidor och tre guider.
- [ ] Skriv ned indexstatus, senaste crawl och eventuella SEO- eller markup-varningar.
- [ ] Begär indexering av viktiga, färdiggranskade sidor — inte av alla URL:er samtidigt.

## 3. Inför IndexNow

- [ ] Skapa en IndexNow-nyckel för `elektrikerakut.nu`.
- [ ] Publicera verifieringsfilen enligt IndexNow-specifikationen på domänen.
- [x] Bygg en säker serverfunktion som skickar nya, uppdaterade och borttagna URL:er till IndexNow.
- [ ] Koppla funktionen till publicering av nya Elguide-artiklar och ändringar i lokala eljourssidor.
- [x] Logga varje skickad URL, datum, svarskod och eventuell felorsak i admin.
- [ ] Kontrollera IndexNow-rapporten i Bing Webmaster Tools efter första publiceringen.

## 4. Utöka URL-kartan i admin

- [x] Lägg till en separat panel för **Bing-status** bredvid Google Search Console-statusen.
- [x] Visa Bing-indexering, senaste crawl, upptäcktsdatum, HTTP-fel och SEO-varningar per URL.
- [x] Visa IndexNow-historik: skickad URL, åtgärd, datum och mottaget svar.
- [x] Skapa filter för “Indexerad”, “Crawlad men ej indexerad”, “Robots blockerar”, “Canonical”, “Redirect” och “Bör granskas”.
- [x] Prioritera kärnsidor och lokala eljourssidor före guider när åtgärdslistan skapas.

## 5. Förbättra innehållet för alla sökmotorer

- [ ] Se till att varje lokal eljourssida har ett eget syfte, egna lokala frågor och användbar områdesspecifik information.
- [ ] Slå ihop, förbättra eller avindexera sidor som saknar ett tydligt eget värde.
- [ ] Länka lokala sidor från `/eljour` och från relevanta guider där det hjälper användaren.
- [ ] Uppdatera sitemapens `lastmod` när innehållet faktiskt ändras.
- [ ] Kontrollera att titlar, H1, metabeskrivningar och canonical URL är konsekventa.
- [ ] Behåll tydliga säkerhetsråd, källor och transparens om att Elektrikerakut är en förmedlingstjänst.

## 6. Strukturerad data och förtroende

- [ ] Lägg till korrekt JSON-LD för organisationen och webbplatsen.
- [ ] Använd tjänste- och FAQ-strukturerad data endast när innehållet syns på sidan och är relevant.
- [ ] Använd inte LocalBusiness-data med påhittade adresser, kontor eller telefonnummer för områdessidor.
- [ ] Säkerställ att företagsnamn, kontaktuppgifter, integritetspolicy och villkor är konsekventa över hela webbplatsen.

## 7. Lokal synlighet utanför traditionell sök

- [ ] Skapa eller uppdatera en korrekt profil i Bing Places för verklig verksamhetsadress och kontaktuppgifter.
- [ ] Skapa eller uppdatera Apple Business Connect med samma verkliga uppgifter, om verksamheten uppfyller tjänstens krav.
- [ ] Kontrollera att Google Business Profile, Bing Places och Apple Business Connect inte påstår att ni har lokala kontor där ni inte har dem.
- [ ] Samla genuina omnämnanden och relevanta länkar från verkliga partners, branschregister och lokala källor.

## 8. Löpande uppföljning

- [ ] Följ Google Search Console och Bing Webmaster Tools varje vecka under uppbyggnadsfasen.
- [ ] Följ antal indexerade URL:er, crawlproblem, visningar, klick och söktermer per sökmotor.
- [ ] Granska sidor som varit “crawlad men ej indexerad” i mer än 30 dagar.
- [ ] Mät om förbättringar ger fler relevanta förfrågningar — inte bara fler indexerade URL:er.
- [ ] Dokumentera ändringar och datum i admin så att resultat kan kopplas till rätt åtgärd.
