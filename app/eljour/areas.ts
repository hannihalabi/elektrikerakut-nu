export type ServiceArea = {
  name: string;
  slug: string;
  municipality: string;
  postcodePrefix: string;
};

export type LocalAreaContent = {
  title: string;
  description: string;
  formIntro: string;
  coverageHeading: string;
  coverageText: string;
  requestHeading: string;
  requestText: string;
  faqQuestion: string;
  faqAnswer: string;
};

const areaNames = [
  ["Stockholm", "Stockholms stad", "10"], ["Södermalm", "Stockholms stad", "11"], ["Vasastan", "Stockholms stad", "11"], ["Kungsholmen", "Stockholms stad", "11"], ["Östermalm", "Stockholms stad", "11"], ["Norrmalm", "Stockholms stad", "11"], ["Gamla Stan", "Stockholms stad", "11"], ["Hammarby Sjöstad", "Stockholms stad", "12"], ["Liljeholmen", "Stockholms stad", "11"], ["Hornstull", "Stockholms stad", "11"], ["Aspudden", "Stockholms stad", "12"], ["Midsommarkransen", "Stockholms stad", "12"], ["Hägersten", "Stockholms stad", "12"], ["Fruängen", "Stockholms stad", "12"], ["Västertorp", "Stockholms stad", "12"], ["Mälarhöjden", "Stockholms stad", "12"], ["Gröndal", "Stockholms stad", "11"], ["Telefonplan", "Stockholms stad", "12"], ["Årsta", "Stockholms stad", "12"], ["Enskede", "Stockholms stad", "12"], ["Enskede Gård", "Stockholms stad", "12"], ["Gamla Enskede", "Stockholms stad", "12"], ["Stureby", "Stockholms stad", "12"], ["Bandhagen", "Stockholms stad", "12"], ["Högdalen", "Stockholms stad", "12"], ["Rågsved", "Stockholms stad", "12"], ["Älvsjö", "Stockholms stad", "12"], ["Örby", "Stockholms stad", "12"], ["Solberga", "Stockholms stad", "12"], ["Farsta", "Stockholms stad", "12"], ["Sköndal", "Stockholms stad", "12"], ["Hökarängen", "Stockholms stad", "12"], ["Tallkrogen", "Stockholms stad", "12"], ["Gubbängen", "Stockholms stad", "12"], ["Bagarmossen", "Stockholms stad", "12"], ["Kärrtorp", "Stockholms stad", "12"], ["Björkhagen", "Stockholms stad", "12"], ["Hammarbyhöjden", "Stockholms stad", "12"], ["Johanneshov", "Stockholms stad", "12"], ["Skarpnäck", "Stockholms stad", "12"], ["Skärholmen", "Stockholms stad", "12"], ["Sätra", "Stockholms stad", "12"], ["Bredäng", "Stockholms stad", "12"], ["Vårberg", "Stockholms stad", "12"], ["Bromma", "Stockholms stad", "16"], ["Spånga", "Stockholms stad", "16"], ["Kista", "Stockholms stad", "16"], ["Akalla", "Stockholms stad", "16"], ["Husby", "Stockholms stad", "16"], ["Rinkeby", "Stockholms stad", "16"], ["Tensta", "Stockholms stad", "16"], ["Hässelby", "Stockholms stad", "16"], ["Vällingby", "Stockholms stad", "16"], ["Solhem", "Stockholms stad", "16"], ["Solna", "Solna stad", "17"], ["Sundbyberg", "Sundbybergs stad", "17"], ["Duvbo", "Sundbybergs stad", "17"], ["Rissne", "Sundbybergs stad", "17"], ["Hallonbergen", "Sundbybergs stad", "17"], ["Ursvik", "Sundbybergs stad", "17"], ["Danderyd", "Danderyds kommun", "18"], ["Täby", "Täby kommun", "18"], ["Sollentuna", "Sollentuna kommun", "19"], ["Järva", "Stockholms stad", "16"], ["Järfälla", "Järfälla kommun", "17"], ["Barkarby", "Järfälla kommun", "17"], ["Jakobsberg", "Järfälla kommun", "17"], ["Kallhäll", "Järfälla kommun", "17"], ["Upplands Väsby", "Upplands Väsby kommun", "19"], ["Vallentuna", "Vallentuna kommun", "18"], ["Åkersberga", "Österåkers kommun", "18"], ["Lidingö", "Lidingö stad", "18"], ["Nacka", "Nacka kommun", "13"], ["Saltsjöbaden", "Nacka kommun", "13"], ["Boo", "Nacka kommun", "13"], ["Tyresö", "Tyresö kommun", "13"], ["Haninge", "Haninge kommun", "13"], ["Handen", "Haninge kommun", "13"], ["Vega", "Haninge kommun", "13"], ["Vendelsö", "Haninge kommun", "13"], ["Huddinge", "Huddinge kommun", "14"], ["Flemingsberg", "Huddinge kommun", "14"], ["Stuvsta", "Huddinge kommun", "14"], ["Trångsund", "Huddinge kommun", "14"], ["Skogås", "Huddinge kommun", "14"], ["Botkyrka", "Botkyrka kommun", "14"], ["Tumba", "Botkyrka kommun", "14"], ["Tullinge", "Botkyrka kommun", "14"], ["Salem", "Salems kommun", "14"], ["Ekerö", "Ekerö kommun", "17"], ["Vårby", "Huddinge kommun", "14"], ["Märsta", "Sigtuna kommun", "19"], ["Sigtuna", "Sigtuna kommun", "19"], ["Kungsängen", "Upplands-Bro kommun", "19"], ["Bro", "Upplands-Bro kommun", "19"], ["Österåker", "Österåkers kommun", "18"], ["Vaxholm", "Vaxholms stad", "18"], ["Rindö", "Vaxholms stad", "18"], ["Långbro", "Stockholms stad", "12"],
  ["Norrtälje", "Norrtälje kommun", "76"], ["Rimbo", "Norrtälje kommun", "76"], ["Hallstavik", "Norrtälje kommun", "76"], ["Älmsta", "Norrtälje kommun", "76"],
  ["Nykvarn", "Nykvarns kommun", "15"],
  ["Nynäshamn", "Nynäshamns kommun", "14"], ["Ösmo", "Nynäshamns kommun", "14"], ["Sorunda", "Nynäshamns kommun", "14"],
  ["Södertälje", "Södertälje kommun", "15"], ["Järna", "Södertälje kommun", "15"], ["Hölö", "Södertälje kommun", "15"], ["Mölnbo", "Södertälje kommun", "15"],
  ["Värmdö", "Värmdö kommun", "13"], ["Gustavsberg", "Värmdö kommun", "13"], ["Hemmesta", "Värmdö kommun", "13"], ["Djurö", "Värmdö kommun", "13"], ["Ingarö", "Värmdö kommun", "13"]
] as const;

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const serviceAreas: ServiceArea[] = areaNames.map(([name, municipality, postcodePrefix]) => ({ name, municipality, postcodePrefix, slug: slugify(name) }));
export const areaSlugs = serviceAreas.map((area) => area.slug);
export function getServiceArea(slug: string) { return serviceAreas.find((area) => area.slug === slug); }

/**
 * Page-specific editorial copy. The wording deliberately describes only the
 * matching service and geographic data that we can substantiate for each
 * location; it does not imply a local office, a named partner or a response
 * time that has not been confirmed for that request.
 */
export function getLocalAreaContent(area: ServiceArea, nearbyNames: string[]): LocalAreaContent {
  const nearby = nearbyNames.length > 1
    ? `${nearbyNames.slice(0, -1).join(", ")} och ${nearbyNames.at(-1)}`
    : nearbyNames[0] ?? area.municipality;

  return {
    title: `Eljour ${area.name}: hjälp vid akuta elfel`,
    description: `Eljour för ${area.name}. Beskriv elfelet och ange ditt postnummer så kontrollerar Elektrikerakut.nu registrerade elföretag som kan ta emot en förfrågan i ${area.municipality}.`,
    formIntro: `Matchningen är för ${area.name}. Ditt postnummer används tillsammans med problemet du väljer för att kontrollera aktuell täckning i området.`,
    coverageHeading: `Eljour för ${area.name} och närliggande områden`,
    coverageText: `${area.name} ligger i ${area.municipality}. Den här sidan är den lokala ingången för förfrågningar med postnummer som börjar på ${area.postcodePrefix}. Om din adress ligger närmare ${nearby} ska du välja den sidan i stället, så att förfrågan får rätt geografisk utgångspunkt från början.`,
    requestHeading: `Så hjälper du oss att bedöma din förfrågan i ${area.name}`,
    requestText: `Välj det alternativ som bäst beskriver situationen, skriv ditt femsiffriga postnummer och lämna ett telefonnummer. Om elfelet innebär fara, till exempel brandlukt, synlig skada eller misstänkt strömförande delar, ska du hålla avstånd och vid omedelbar fara ringa 112. När uppgifterna är inskickade kan vi bedöma om en registrerad partner kan ta emot uppdraget i ${area.name}.`,
    faqQuestion: `Gäller den här eljourssidan just ${area.name}?`,
    faqAnswer: `Ja. Sidan är kopplad till ${area.name} i ${area.municipality} och använder postnummerprefixet ${area.postcodePrefix} som lokal kontroll. Bor du i ett intilliggande område väljer du helst dess egen sida, så att platsuppgiften i förfrågan blir så träffsäker som möjligt.`,
  };
}
