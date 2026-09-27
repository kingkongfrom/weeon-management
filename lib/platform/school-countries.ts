/**
 * Country picker for school onboarding.
 *
 * Only Costa Rica's catalog is wired up today; the rest are listed as
 * "coming soon" so the onboarding UI already expresses the LATAM roadmap. The
 * code label/placeholder here must mirror the provider registry in
 * `weeon-tenants/lib/geo/school-codes.ts` — that side owns validation.
 */

export type SchoolCountry = {
  code: string; // ISO 3166-1 alpha-2
  name: string; // Spanish display name
  flag: string;
  codeLabel: string;
  codePlaceholder: string;
  supported: boolean;
};

export const SCHOOL_COUNTRIES: SchoolCountry[] = [
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", codeLabel: "Código SABER", codePlaceholder: "200167-00", supported: true },
  { code: "MX", name: "México", flag: "🇲🇽", codeLabel: "CCT", codePlaceholder: "09DCT0001A", supported: false },
  { code: "CL", name: "Chile", flag: "🇨🇱", codeLabel: "RBD", codePlaceholder: "12345", supported: false },
  { code: "PE", name: "Perú", flag: "🇵🇪", codeLabel: "Código de local", codePlaceholder: "0000000", supported: false },
  { code: "CO", name: "Colombia", flag: "🇨🇴", codeLabel: "Código DANE", codePlaceholder: "000000000", supported: false },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", codeLabel: "Código", codePlaceholder: "", supported: false },
];

export const DEFAULT_SCHOOL_COUNTRY = "CR";

export function getSchoolCountry(code: string): SchoolCountry | undefined {
  return SCHOOL_COUNTRIES.find((c) => c.code === code);
}

/** Admin role captured at onboarding (mirrors weeon-tenants ADMIN_ROLES). */
export const ADMIN_ROLES = [
  { value: "direccion", label: "Dirección" },
  { value: "secretariado", label: "Secretariado" },
] as const;
