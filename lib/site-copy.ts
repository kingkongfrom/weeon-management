// Static copy shared across the skeleton UI.
// Keep brand/product language here so screens stay consistent.

export const product = {
  shortName: "Weeon Management",
  repo: "weeon-management",
  origin: "https://ops.weeon.school",
  audience: "Weeon / EduNova staff (internal only)",
};

export const architecture = {
  productDocs: [
    {
      name: "Marketing site",
      repo: "weeon-marketing",
      url: "https://github.com/kingkongfrom/weeon-marketing",
      surface: "Public marketing site (https://weeon.school)",
      route: "/",
    },
    {
      name: "School web admin (ERP)",
      repo: "weeon-admin",
      url: "https://github.com/kingkongfrom/weeon-admin",
      surface: "School ERP for one tenant (https://app.weeon.school)",
      route: "/",
    },
    {
      name: "Mobile apps",
      repo: "weeon-school",
      url: "https://github.com/kingkongfrom/weeon-school",
      surface: "Teacher / student / parent apps (Android + iOS)",
      route: "/",
    },
    {
      name: "Platform operations (this repo)",
      repo: "weeon-management",
      url: "https://github.com/kingkongfrom/weeon-management",
      surface: "Internal cross-tenant dashboard (https://ops.weeon.school)",
      route: "/",
    },
  ] as const,
};

export const siteCopy = {
  meta: {
    title: "Weeon Ops",
    description:
      "Internal operations console for Weeon. Sign in to review every school, subscription health, and platform access.",
  },
  hero: {
    kicker: "Internal — Weeon staff only",
    title: "Weeon Management",
    lead: "The platform operations console. Manage every tenant in the EduNova / Weeon ecosystem, how many users each tenant has, per-tenant stats, and the health signals the organization needs to run efficiently.",
  },
} as const;
