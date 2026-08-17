// TaxAtlas — site identity, sections and author.
//
// IMPORTANT: this site carries no professional tax credential. Nothing here
// may describe the author as a CPA, EA, "tax advisor" or "accountant" — those
// titles are regulated by state boards and by Circular 230. Authority comes
// from citing primary sources (IRS publications, the Internal Revenue Code,
// Treasury regulations) on every factual claim instead.

export const site = {
  name: "TaxAtlas",
  wordmark: "TAX ATLAS",
  tagline: "A plain-English map of the U.S. tax code",
  url: "https://taxatlas.com",
  locale: "en-US",
  description:
    "Plain-English columns on U.S. federal tax rules for the self-employed, cross-border filers, property owners and individual taxpayers. Every claim is cited to an IRS publication or the Internal Revenue Code.",
} as const;

// `credential` MUST stay null unless the author actually holds a U.S. license
// (see the note at the top). The day job is a Korean tax accounting firm and
// the author is an employee there, not a licensed Korean tax accountant — so
// no title of any kind goes in `role`, and the firm is never named.
export const author = {
  name: "Jaehyung Ahn",
  /** Shown under the byline. Describe what you do, never a title you don't hold. */
  role: "Writer, TaxAtlas",
  credential: null as string | null,
  bio: "I work at a tax accounting firm in South Korea. TaxAtlas is a personal project, unconnected to my employer, and everything here is my own work. What I bring to it is a habit built at that job: read the primary source, not a summary of it. Every column is written from the IRS publication, Code section or regulation itself, with the citation attached so you can check it against the source.",
  /**
   * Public profiles, used for Person sameAs in structured data — this is what
   * a search engine follows to verify the author exists. Keep the profile's
   * display name matching `name` above, or the link corroborates nothing.
   * If the LinkedIn vanity path changes again, change it here too.
   */
  sameAs: ["https://www.linkedin.com/in/jaehyung-ahn-74a19726b"] as string[],
} as const;

/**
 * Sections are the top-level axis of the site (the equivalent of a newspaper
 * desk). Launch order is deliberate: Self-Employed first because it has
 * year-round search demand and real affiliate inventory; Personal last
 * because it is the most competitive segment on the open web.
 */
export const sections = [
  {
    id: "selfemployed",
    label: "Self-Employed",
    eyebrow: "SELF-EMPLOYED",
    description: "Running a business as one person, or a few.",
    topics: "Schedule C · S-Corp · QBI · estimated taxes · 1099",
    examples: "Entity choice · quarterly payments · deductions",
    launchPhase: 1,
  },
  {
    id: "crossborder",
    label: "Cross-Border",
    eyebrow: "CROSS-BORDER",
    description: "U.S. tax when money or people cross a border.",
    topics: "FBAR · FATCA · FEIE · treaties · foreign accounts",
    examples: "Foreign accounts · expat filing · treaty relief",
    launchPhase: 2,
  },
  {
    id: "property",
    label: "Property",
    eyebrow: "PROPERTY",
    description: "Real estate, rentals and investment assets.",
    topics: "Rental income · depreciation · 1031 · capital gains",
    examples: "Rental deductions · exchanges · basis",
    launchPhase: 3,
  },
  {
    id: "personal",
    label: "Personal",
    eyebrow: "PERSONAL",
    description: "Individual returns, credits and retirement accounts.",
    topics: "Deductions · credits · IRA/401(k) · withholding",
    examples: "Filing status · credits · retirement accounts",
    launchPhase: 4,
  },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export function getSection(id: SectionId) {
  return sections.find((s) => s.id === id) ?? sections[0];
}

/** Topic filter order shown on the hub. "All" is always first. */
export const categories = [
  "All",
  "Entity choice",
  "Deductions",
  "Deadlines",
  "Payroll",
  "Foreign assets",
  "Rentals",
  "Capital gains",
  "Credits",
  "Retirement",
  "IRS notices",
] as const;
