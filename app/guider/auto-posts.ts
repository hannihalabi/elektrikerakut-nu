import type { GuidePost } from "./posts";

type AutoGuideTemplate = Omit<GuidePost, "publishedAt" | "slug"> & {
  slugBase: string;
};

function section(heading: string, paragraphs: string[], steps?: string[]) {
  return { heading, paragraphs, steps };
}

export const autoGuideTemplates: AutoGuideTemplate[] = [
  {
    slugBase: "jordfelsbrytare-funkar-inte",
    title: "Jordfelsbrytaren går inte att återställa – vad betyder det?",
    description: "När jordfelsbrytaren inte vill ligga kvar kan det vara ett tydligt tecken på ett fel som behöver hittas innan elen används igen.",
    category: "Jordfelsbrytare",
    readTime: "4 min läsning",
    updatedLabel: "Uppdaterad automatiskt",
    accent: "green",
    intro: "En jordfelsbrytare som vägrar återställas försöker skydda anläggningen från ett fel som fortfarande finns kvar. Det är inte ett läge där man ska fortsätta prova gång på gång.",
    safetyNote: "Försök inte kringgå jordfelsbrytaren. Om den inte går att återställa eller löser ut direkt igen behöver installationen bedömas av rätt kompetens.",
    sections: [
      section("Börja enkelt och säkert", ["Stäng av eller koppla ur tydliga belastningar på den berörda gruppen och försök återställa en gång till. Om den fortfarande inte går i, lämna den frånslagen och gå vidare med felsökning utan att öppna någon utrustning."], ["Stäng av synliga laster på gruppen.", "Försök återställa en gång.", "Låt brytaren vara frånslagen om felet kvarstår."]),
      section("Vanliga orsaker", ["En ansluten apparat, fukt, skadad kabel eller ett problem i den fasta installationen kan göra att jordfelsbrytaren inte går att slå till. Ibland är det en viss produkt som utlöser felet, ibland är det en del av elanläggningen."]),
      section("Tecken på att du ska sluta", ["Bränd lukt, missfärgning, värme eller synliga skador är tydliga skäl att avbryta all egen felsökning. Du ska inte skruva isär uttag eller apparater för att försöka hitta felet själv."]),
      section("Nästa steg", ["En registrerad elinstallatör kan avgöra om felet sitter i en apparat eller i installationen. Det är särskilt viktigt om samma brytare löser ut igen så snart du återställer den."]),
    ],
    sourceLabel: "Elsäkerhetsverket: Om jordfelsbrytare",
    sourceUrl: "https://www.elsakerhetsverket.se/privatpersoner/din-elanlaggning/om-du-ager-din-bostad/jordfelsbrytaren-din-sakerhet/om-jordfelsbrytare/",
  },
  {
    slugBase: "uttag-blir-varmt",
    title: "Ett eluttag blir varmt när du använder det",
    description: "Värme vid ett vanligt vägguttag är ett varningstecken som inte ska ignoreras, särskilt inte om samma plats används ofta.",
    category: "Eluttag",
    readTime: "3 min läsning",
    updatedLabel: "Uppdaterad automatiskt",
    accent: "red",
    intro: "Ett vägguttag eller en stickpropp ska normalt inte bli varm i vanlig drift. Om du känner tydlig värme finns det skäl att ta saken på allvar innan något hinner skadas ytterligare.",
    safetyNote: "Använd inte ett uttag som känns varmt, luktar bränt eller har missfärgning. Vid rök eller brand: lämna platsen och ring 112.",
    sections: [
      section("Kontrollera vad som är anslutet", ["Titta på vilken produkt som var inkopplad när värmen uppstod och om samma sak händer med en annan apparat. Om problemet följer just den produkten kan felet ligga där, men om uttaget blir varmt oavsett belastning är det mer oroande."]),
      section("Sluta belasta uttaget", ["Koppla ur produkten om det kan göras säkert och använd inte uttaget igen tills orsaken är klarlagd. Att fortsätta använda samma plats kan förvärra skadan och göra nästa steg farligare."]),
      section("När det är dags för hjälp", ["Ett varmt uttag, en lös stickpropp eller återkommande gnistor är skäl att kontakta ett registrerat elinstallationsföretag. Det gäller särskilt i kök, badrum eller andra miljöer där fukt eller hög belastning kan spela in."]),
    ],
    sourceLabel: "Elsäkerhetsverket: Dina elprodukter",
    sourceUrl: "https://www.elsakerhetsverket.se/privatpersoner/dina-elprodukter/anvanda-elprodukter/",
  },
  {
    slugBase: "brant-lukt-rum",
    title: "Det luktar bränt i ett rum men du ser inget fel",
    description: "Bränd lukt utan synlig skada kan komma från ett uttag, en apparat eller en dold installation och ska hanteras försiktigt.",
    category: "Akut elsäkerhet",
    readTime: "4 min läsning",
    updatedLabel: "Uppdaterad automatiskt",
    accent: "red",
    intro: "Bränd lukt är en signal du ska ta på allvar även om du inte ser rök eller lågor. En dold kontaktpunkt kan bli varm långt innan något syns tydligt på utsidan.",
    safetyNote: "Om lukten är stark, tilltar eller följs av rök ska du lämna området och ringa 112 vid akut fara.",
    sections: [
      section("Lokalisera utan att öppna", ["Försök avgöra om lukten kommer från en specifik produkt, från ett uttag eller från elcentralens närhet. Öppna inte kapslingar eller apparater i jakt på källan."]),
      section("Bryt belastningen säkert", ["Stäng av eller dra ur uppenbart misstänkta produkter om det kan göras utan risk. Låt därefter den berörda gruppen vara avstängd tills en fackman har tittat på saken."]),
      section("Anteckna vad som hände", ["Skriv ned när lukten uppstod, vilka produkter som var igång och om säkringar eller jordfelsbrytare löste ut. Den informationen hjälper den som ska undersöka felet."]),
    ],
    sourceLabel: "Elsäkerhetsverket: Så förebygger du elolyckor hemma",
    sourceUrl: "https://www.elsakerhetsverket.se/privatpersoner/om-du-drabbas-av-en-elolycka/sa-forebygger-du-elolyckor-hemma/",
  },
  {
    slugBase: "utomhusuttag-regn",
    title: "Utomhusuttag som strular i regn",
    description: "Fukt kan göra att ett utomhusuttag eller en ansluten produkt beter sig annorlunda när vädret slår om.",
    category: "Utomhus",
    readTime: "4 min läsning",
    updatedLabel: "Uppdaterad automatiskt",
    accent: "blue",
    intro: "Utomhusuttag och skarvsladdar utsätts för väder på ett sätt som inomhusprodukter inte gör. Om problemet dyker upp vid regn eller fukt är det en stark signal om att något behöver kontrolleras.",
    safetyNote: "Använd inte blöta kablar eller uttag som ser skadade ut. Dra inte in vanliga inomhussladdar genom dörr eller fönster för att kringgå felet.",
    sections: [
      section("Börja från torr plats", ["Kontrollera från insidan om jordfelsbrytare eller säkring har löst ut. Om du återställer och felet kommer tillbaka ska du låta kretsen vara frånslagen."], ["Kontrollera centralen från torr plats.", "Återställ bara en gång om det känns säkert.", "Låt gruppen vara avstängd om felet återkommer."]),
      section("Undvik provisorier", ["Byt inte till fel sorts kabel eller adapter för att få igång utrustningen. En tillfällig lösning kan dölja problemet snarare än lösa det."]),
      section("Låt rätt part bedöma", ["Om felet återkommer vid fukt eller regn bör en registrerad elinstallatör bedöma installationen. Då kan både kapsling, placering och skydd kontrolleras ordentligt."]),
    ],
    sourceLabel: "Elsäkerhetsverket: Trädgårds- och uterumsprodukter",
    sourceUrl: "https://www.elsakerhetsverket.se/privatpersoner/dina-elprodukter/produkter/tradgard-och-uterum/",
  },
  {
    slugBase: "badrum-elfel",
    title: "El i badrummet ska tåla fukt och vardag",
    description: "Badrum ställer högre krav på elinstallation, placering och produkter eftersom vatten och el finns nära varandra.",
    category: "Badrum",
    readTime: "5 min läsning",
    updatedLabel: "Uppdaterad automatiskt",
    accent: "amber",
    intro: "I badrum ska du vara extra försiktig med både placering och användning av el. Fukt och vatten gör att fel kan få snabbare och allvarligare följder än i andra rum.",
    safetyNote: "Dra inte in skarvsladdar i badrum och försök inte flytta fasta elpunkter själv.",
    sections: [
      section("Tänk zoner", ["Närhet till dusch och badkar påverkar vad som får sitta var. Om du planerar en förändring ska zonindelning och kapslingsklass bedömas innan något beställs eller monteras."]),
      section("Kontrollera skicket", ["Ett löst, sprucket eller fuktpåverkat uttag ska inte användas. I badrum är det särskilt viktigt att inte chansa med en lösning som ser nästan okej ut."]),
      section("Ta hjälp vid ombyggnad", ["Vid nyinstallation eller flytt av uttag och belysning i badrum ska ett registrerat elinstallationsföretag göra arbetet. Det gäller också om du är osäker på hur den befintliga installationen är uppbyggd."]),
    ],
    sourceLabel: "Elsäkerhetsverket: Installation av el i bad- och duschrum",
    sourceUrl: "https://www.elsakerhetsverket.se/privatpersoner/din-elanlaggning/bygga-och-renovera/installation-av-el-i-bad-och-duschrum/",
  },
];

export function createAutoGuidePost(now: Date, templateIndex: number): GuidePost {
  const template = autoGuideTemplates[templateIndex % autoGuideTemplates.length];
  const updatedLabel = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(now);
  return {
    ...template,
    slug: template.slugBase,
    publishedAt: now.toISOString(),
    updatedLabel: `Uppdaterad ${updatedLabel}`,
  };
}
