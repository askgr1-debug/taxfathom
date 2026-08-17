// Shared JSON-LD entities.
//
// The point of this file is ONE thing: give the Organization, the Person and
// the WebSite stable `@id`s so every page points at the SAME node instead of
// emitting near-duplicate copies. Search and answer engines merge nodes by
// `@id` — that is what turns a pile of pages into a single recognized entity,
// which is the fastest lever a new site has for authority (SEO + GEO/AEO).

import { site, author, sections } from "./site";

/** Canonical node ids, derived from the production base URL. */
export function ids(base: string) {
  const b = base.replace(/\/$/, "");
  return {
    org: `${b}/#organization`,
    site: `${b}/#website`,
    person: `${b}/about/#person`,
  };
}

/** Everything the site covers — concrete `knowsAbout` beats a vague blurb. */
function topics(): string[] {
  const set = new Set<string>();
  for (const s of sections) {
    for (const part of s.topics.split("·")) {
      const t = part.trim();
      if (t) set.add(t);
    }
  }
  return [...set];
}

export function organizationEntity(base: string) {
  const id = ids(base);
  return {
    "@type": "Organization",
    "@id": id.org,
    name: site.name,
    url: base,
    description: site.description,
    logo: {
      "@type": "ImageObject",
      url: new URL("/favicon.svg", base).toString(),
    },
    founder: { "@id": id.person },
    knowsAbout: topics(),
  };
}

export function personEntity(base: string) {
  const id = ids(base);
  return {
    "@type": "Person",
    "@id": id.person,
    name: author.name,
    url: new URL("/about/", base).toString(),
    description: author.bio,
    ...(author.sameAs.length ? { sameAs: author.sameAs } : {}),
    knowsAbout: topics(),
  };
}

export function websiteEntity(base: string) {
  const id = ids(base);
  return {
    "@type": "WebSite",
    "@id": id.site,
    name: site.name,
    url: base,
    inLanguage: "en-US",
    description: site.description,
    publisher: { "@id": id.org },
  };
}
