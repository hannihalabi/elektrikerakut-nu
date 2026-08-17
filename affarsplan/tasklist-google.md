# Checklista: synlighet i Google Search

Mål: Elektrikerakut.nu ska vara tekniskt lätt för Google att förstå, ha tydliga och användbara landningssidor samt följas upp utifrån indexering, synlighet och relevanta förfrågningar — inte bara antal indexerade URL:er.

## 1. Säkerställ Google Search Console

- [x] Kontrollera att domänegendomen `sc-domain:elektrikerakut.nu` är verifierad och används som primär egendom.
- [ ] Kontrollera att sitemap `https://elektrikerakut.nu/sitemap.xml` är inskickad och läses utan fel.
- [ ] Kontrollera att alla viktiga publika URL:er finns i sitemap och att redirect-, noindex- och tekniska URL:er inte prioriteras där.
- [x] Kontrollera att Google kan läsa `https://elektrikerakut.nu/robots.txt` och att den pekar på sitemap.
- [ ] Ge endast nödvändiga personer och system åtkomst till Search Console.

## 2. Arbeta med indexering i URL-kartan

- [x] Hämta aktuell indexeringsstatus i Admin → URL-karta.
- [ ] Börja med kärnsidor och lokala eljourssidor som är “Crawlad men ej indexerad”.
- [ ] Bedöm varje “Exkluderad” URL utifrån Googles exakta täckningsstatus innan något ändras.
- [ ] Låt avsiktliga canonical-, redirect- och noindex-sidor vara exkluderade.
- [ ] Kontrollera att varje viktig URL svarar med HTTP 200, har rätt canonical och kan indexeras.
- [ ] Begär ny indexering först när sidan har förbättrats på riktigt.

## 3. Förbättra lokala eljourssidor

- [ ] Definiera ett tydligt eget syfte för varje område och kommun.
- [ ] Lägg till verkligt användbar lokal information, exempelvis område, postnummerlogik, relevanta frågor och närliggande områden.
- [ ] Undvik att bara byta ortsnamn i samma textmall.
- [ ] Kontrollera att titel, H1, inledning och internlänkar matchar användarens lokala sökintention.
- [ ] Slå ihop, förbättra eller avindexera sidor som inte kan ge ett eget användarvärde.
- [ ] Länka från `/eljour` till lokala sidor och mellan närliggande områden när det hjälper användaren.

## 4. Utveckla Elguiden

- [ ] Prioritera guider utifrån verkliga frågor om elfel, säkerhet och nästa steg.
- [ ] Säkerställ att varje guide besvarar en tydlig fråga och inte överlappar en befintlig artikel.
- [ ] Lägg till tydliga säkerhetsgränser: vad användaren kan kontrollera själv och när en elektriker eller 112 behövs.
- [ ] Använd källor från myndigheter eller primära expertkällor där fakta och säkerhet kräver det.
- [ ] Länka mellan relevanta guider och till rätt eljoursida utan att tvinga in irrelevanta länkar.
- [ ] Uppdatera befintliga guider när information, regler eller rekommendationer förändras.

## 5. Teknisk SEO

- [ ] Kontrollera canonical-taggar på startsida, guider och alla lokala sidor.
- [ ] Kontrollera att varje indexerbar sida har unik titel och metabeskrivning.
- [ ] Kontrollera mobilvisning, Core Web Vitals, laddningstid och bildoptimering.
- [ ] Kontrollera att JavaScript inte döljer huvudinnehåll, länkar eller formulär för crawlers.
- [ ] Rätta 404-, 5xx- och redirectkedjor som syns i Search Console.
- [ ] Uppdatera sitemapens `lastmod` endast när sidan faktiskt har ändrats.

## 6. Förtroende och strukturerad data

- [ ] Lägg till korrekt JSON-LD för Organisation och WebSite.
- [ ] Använd FAQ- eller tjänstestrukturerad data endast när innehållet visas för användaren på sidan.
- [ ] Var konsekvent med namn, domän, kontaktuppgifter, integritetspolicy och villkor.
- [ ] Beskriv Elektrikerakut som förmedlingstjänst där det är relevant.
- [ ] Använd inte påhittade kontor, adresser, recensioner eller LocalBusiness-uppgifter för områden utan fysisk etablering.
- [ ] Bygg trovärdighet genom riktiga partneruppgifter, transparens och relevanta externa omnämnanden.

## 7. Följ upp synlighet och leads

- [ ] Följ Prestanda-rapporten i Search Console varje vecka: klick, visningar, CTR och genomsnittlig position.
- [ ] Identifiera sökfrågor med många visningar men låg CTR och förbättra titel och metabeskrivning.
- [ ] Identifiera sidor med ökande visningar men få leads och förbättra nästa steg samt formulärflöde.
- [ ] Följ indexeringsrapporten och URL-kartan efter större innehålls- eller teknikändringar.
- [ ] Dokumentera ändring, datum, berörda URL:er och utfall i admin eller arbetslogg.
- [ ] Utvärdera månad för månad om organisk trafik leder till relevanta förfrågningar och matchningar.

## 8. Återkommande rutin

- [ ] Varje vecka: kontrollera indexeringsproblem, säkerhetsvarningar och viktiga söktermer.
- [ ] Varje månad: granska “Crawlad men ej indexerad”-sidor som stått still i minst 30 dagar.
- [ ] Varje månad: uppdatera minst några prioriterade guider eller lokala sidor med substantiella förbättringar.
- [ ] Varje kvartal: granska internlänkning, sitemap, structured data och innehåll som överlappar.
- [ ] Vid varje publicering: kontrollera att URL, canonical, titel, H1, internlänkar, bild-alttext och sitemap är korrekta.
