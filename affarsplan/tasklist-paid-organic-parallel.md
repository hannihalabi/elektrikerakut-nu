# Detaljplan: organisk trafik + betald trafik parallellt

Mål: Elektrikerakut.nu ska generera relevanta, kostnadseffektiva leads redan under
uppbyggnadsfasen (via Google Ads) samtidigt som det organiska fundamentet
(`tasklist-google.md` och `tasklist-bing.md`) byggs upp till att bära trafiken själv.
Betald trafik är en bro, inte en permanent ersättning — målet är att sänka
betalt-beroendet i takt med att organisk ranking tar över.

**Utgångsläge (2026-08-18):** domänen är ~9 dagar gammal, 271 sidor, 126 indexerade
hos Google, 102 väntar på crawl, startsidan indexerad men syns inte på 10 sidor
för "elektriker akut". Detta är normalt för en nystartad domän — se
`tasklist-google.md` §7–8 för det organiska mätramverket redan på plats.

---

## Fas 0: Förutsättningar innan första kronan spenderas (vecka 1)

Blockerande — inget Ads-konto ska skapas förrän dessa är klara, annars mäter ni fel
saker och riskerar att betala för leads ni inte kan se om de konverterar.

- [ ] Verifiera att `/api/events` loggar `REQUEST_SUBMITTED`, `MATCH_STARTED` och
      `MATCH_FOUND` korrekt för varje sessionsflöde (redan byggt, se `siteEvents`-tabellen
      och `/admin/statistik` — bekräfta bara att inget saknas innan Ads-trafik börjar strömma in).
- [ ] Bestäm ett **leadvärde**: vad är en `MATCH_FOUND` värd för er affärsmodell
      (partnerprovision, avgift, eller motsvarande)? Detta styr max tillåtet CPA (cost
      per acquisition) i Ads och är obligatoriskt att ha innan budget sätts.
- [ ] Sätt upp **Google Ads-konto** kopplat till samma domän som Search Console
      (`sc-domain:elektrikerakut.nu`) — länka kontona för att dela sökordsdata.
- [ ] Installera **Google Ads-konverteringsspårning** (gtag-konverteringstagg) på
      bekräftelsesteget efter `MATCH_STARTED` → `MATCH_FOUND`, separat från den egna
      `siteEvents`-loggningen. Utan detta kan Ads inte optimera mot faktiska leads.
- [ ] Bekräfta att alla annonslänkade sidor (startsida, `/eljour`, lokala
      eljourssidor) har korrekt canonical, laddar snabbt och saknar blockerande
      JavaScript-fel — Ads Quality Score straffar dåliga landningssidor precis som
      organisk ranking gör.

---

## Fas 1: Pilotkampanj (vecka 1–2, litet budgettak)

Syfte: samla riktiga data om kostnad per klick och konverteringsgrad innan ni
skalar upp. Inte volym än — precision.

- [ ] Skapa **en (1) sökkampanj**, geo-targeted till Stockholms län (samma
      täckningsområde som `serviceAreas` i `app/eljour/areas.ts`, 116 orter). Lägg
      inte pengar på trafik ni ändå inte kan matcha.
- [ ] Sökordsgrupper, uppdelade efter avsikt (håll dem separata — olika avsikt ska
      inte dela annonstext eller landningssida):
  - **Akut/högintent**: "elektriker akut", "akut elektriker stockholm", "elfel
    akut", "jour elektriker" → landningssida: startsidan (matchningsformuläret,
    redan optimerat för snabb konvertering).
  - **Problemspecifik**: "jordfelsbrytaren löser ut", "strömavbrott hemma",
    "eluttag fungerar inte" → landningssida: motsvarande Elguiden-artikel om den
    finns, annars startsidan.
  - **Lokal**: "elektriker + [ort]" för de 5–10 mest folkrika täckningsorterna
    (Stockholm, Södermalm, Vasastan, Solna, Nacka, Huddinge) → landningssida:
    respektive `/eljour/[ort]`-sida.
- [ ] Sätt **negativa sökord** tidigt: "utbildning", "jobb", "lön", "kurs",
      "certifiering" — ni säljer förmedling till konsumenter, inte till
      elektriker som söker arbete.
- [ ] Daglig budget: håll den låg och fast under piloten (t.ex. motsvarande
      10–15 klick/dag baserat på uppskattat CPC) — målet är statistisk signal,
      inte maximal volym.
- [ ] Kör piloten **minst 10–14 dagar** innan några beslut fattas — kortare
      period ger för lite data för att skilja slump från mönster.

---

## Fas 2: Utvärdera och justera (vecka 3)

- [ ] Räkna faktisk **kostnad per `MATCH_FOUND`** och jämför mot leadvärdet från
      Fas 0. Om CPA > leadvärde: pausa den sökordsgruppen, inte hela kontot.
- [ ] Identifiera vilken av de tre sökordsgrupperna (akut/problemspecifik/lokal)
      som gav billigast och flest kvalificerade leads — omfördela budget dit.
- [ ] Jämför landningssidornas prestanda: startsida vs. lokala sidor vs.
      Elguiden-artiklar. En sida med hög klickfrekvens men låg konvertering
      pekar på ett formulär- eller förtroendeproblem värt att åtgärda (se
      `tasklist-google.md` §7 för samma mönster på organisk sida).
- [ ] Gå igenom sökfrågerapporten (Search Terms Report) i Ads — lägg till nya
      negativa sökord för irrelevanta frågor som ändå utlöste annonsen.

---

## Fas 3: Skala det som fungerar (löpande, från vecka 4)

- [ ] Höj budget stegvis (max +30–50 % per vecka) på de sökordsgrupper som visat
      CPA under leadvärdet — undvik att chocka algoritmen med stora hopp.
- [ ] Lägg till fler lokala kampanjer för nästa skikt av orter i takt med att
      de första visar lönsamhet, snarare än att annonsera alla 116 samtidigt.
- [ ] Testa annonstexter mot varandra (minst 2 varianter per grupp) — byt ut
      förloraren var 2:a vecka, behåll vinnaren som baseline.
- [ ] Så snart en lokal `/eljour/[ort]`-sida börjar generera organisk trafik
      (synlig i Search Console Prestanda-rapport, se `tasklist-google.md` §7),
      överväg att sänka eller pausa betald budget för just den orten — det är
      här paid och organic ska avlasta varandra, inte konkurrera om samma klick.

---

## Hur de två spåren samverkar (den viktiga delen)

Paid och organiskt är inte två separata projekt — de ska informera varandra varje vecka:

| Signal från paid | Åtgärd i organiskt spår |
|---|---|
| Sökordsgrupp med hög volym men dyr CPC | Prioritera den frasen i Elguiden-innehåll eller lokal sidtext — sänker beroendet av att betala för den trafiken |
| Landningssida med hög avvisningsfrekvens | Samma sida behöver troligen SEO-förbättring också (titel, H1, innehåll) — fixa en gång, vinn på båda kanaler |
| Sökfråga som konverterar bra men saknar egen guide | Ny Elguiden-artikel-kandidat (se `tasklist-google.md` §4) |

| Signal från organiskt | Åtgärd i paid-spår |
|---|---|
| En lokal sida börjar ranka organiskt (Search Console visar ökande visningar) | Sänk paid-budget för den orten, flytta pengarna till orter utan organisk synlighet |
| Sida med många visningar men låg CTR (organiskt) | Testa samma förbättrade rubrikformulering som Ads-annonstext — billigt A/B-test innan ni ändrar meta-titeln permanent |

- [ ] **Varje vecka**: gemensam avstämning av Ads-kostnad/lead vs. Search Console
      klick/visningar för samma sökordsgrupper — samma kadens som befintlig
      organisk uppföljning i `tasklist-google.md` §7 och `tasklist-bing.md` §8.
- [ ] **Varje månad**: bedöm om paid-budgeten som helhet kan sänkas därför att
      organisk trafik tagit över tillräckligt mycket av volymen.
- [ ] Dokumentera varje budgetändring, ny sökordsgrupp och pausat/aktiverat
      spår med datum — samma logg-disciplin som redan gäller för SEO-ändringar.

---

## Explicit ansvarsgräns

Detta dokument täcker **strategi och arbetsordning**. Faktisk uppsättning av
Google Ads-kontot, kampanjer och betalningsuppgifter görs manuellt av er i Google
Ads-gränssnittet — det är inte något som kan eller bör automatiseras via
kodbasen. Det tekniska jag kan hjälpa till med är: konverteringsspårning på
sajten, landningssidors prestanda och kvalitet, samt att koppla `siteEvents`-
data till en gemensam rapport om ni vill se paid- och organisk data sida vid sida
i `/admin/statistik`.
