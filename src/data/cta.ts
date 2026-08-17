import type { SectionId } from "./site";
import type { Article } from "./articles";

// The site monetizes through a newsletter and affiliate links, not consulting.
// No CTA may offer advice, review a reader's situation, or imply a
// professional engagement — that would be practicing without a credential.

export type Cta = {
  eyebrow: string;
  heading: string;
  body: string[];
  /** Newsletter form action. Swap for your provider's endpoint (Buttondown, Kit, Beehiiv...). */
  formAction: string;
  buttonLabel: string;
  /** Shown under the form whenever the section's columns carry affiliate links. */
  affiliateNote?: string;
};

const NEWSLETTER_ACTION = "https://example.com/subscribe"; // TODO: replace with your provider endpoint

const SECTION_CTA: Record<SectionId, { heading: string; body: string[]; affiliateNote?: string }> = {
  selfemployed: {
    heading: "Deadlines don't send reminders",
    body: [
      "One email when a rule that affects self-employed filers actually changes — estimated payment dates, S-Corp elections, deduction limits.",
      "No sales calls, no spam. Unsubscribe in one click.",
    ],
    affiliateNote:
      "Some links to bookkeeping and payroll tools are affiliate links. They cost you nothing extra, and no tool is recommended for paying us.",
  },
  crossborder: {
    heading: "Cross-border rules move quietly",
    body: [
      "FBAR and Form 8938 thresholds, treaty positions and foreign-account reporting — summarized when something changes.",
      "No sales calls, no spam. Unsubscribe in one click.",
    ],
  },
  property: {
    heading: "Basis mistakes surface years later",
    body: [
      "Depreciation, exchanges and capital gains rules, tracked as they change so your records stay defensible.",
      "No sales calls, no spam. Unsubscribe in one click.",
    ],
    affiliateNote:
      "Some links to rental bookkeeping tools are affiliate links. They cost you nothing extra, and no tool is recommended for paying us.",
  },
  personal: {
    heading: "The numbers change every year",
    body: [
      "Standard deduction, bracket and contribution limits for the coming tax year, with the IRS source attached.",
      "No sales calls, no spam. Unsubscribe in one click.",
    ],
  },
};

// `article` is kept in the signature for future per-column targeting.
export function resolveCta(article: Article): Cta {
  const s = SECTION_CTA[article.section];
  return {
    eyebrow: "Newsletter",
    heading: s.heading,
    body: s.body,
    formAction: NEWSLETTER_ACTION,
    buttonLabel: "Subscribe",
    affiliateNote: s.affiliateNote,
  };
}
