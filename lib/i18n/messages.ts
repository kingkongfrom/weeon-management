import type { Locale } from "@/lib/i18n/config";

/**
 * Ops-console message catalog. Mirrors the `weeon-teachers` i18n shape so the
 * five repos share one translation convention. Spanish is the source of truth;
 * `Messages` is inferred from `es`, so a missing English key fails typecheck.
 */
const es = {
  meta: {
    appName: "Weeon Ops",
    description: "Consola de operaciones de Weeon School.",
    dashboardTitle: "Panel",
  },
  common: {
    close: "Cerrar",
    cancel: "Cancelar",
    save: "Guardar",
    loading: "Cargando",
  },
  nav: {
    ariaMain: "Navegación principal",
    sectionPrimary: "Principal",
    sectionAdmin: "Administración",
    analytics: "Analítica",
    onboarding: "Incorporación",
    tenants: "Colegios",
    access: "Control de acceso",
    accessShort: "Acceso",
    security: "Seguridad",
  },
  header: {
    ariaBrand: "Weeon Ops",
  },
  shell: {
    skipToContent: "Ir al contenido",
    expandMenu: "Expandir menú",
    collapseMenu: "Contraer menú",
  },
  drawer: {
    ariaAccount: "Ajustes de la cuenta",
    ariaClose: "Cerrar ajustes",
    ariaSettings: "Cuenta",
    title: "Mi cuenta",
    roleFallback: "Administrador de operaciones",
    nameFallback: "Personal de plataforma",
    profilePhoto: "Foto de perfil",
    uploadPhoto: "Subir foto",
    changePhoto: "Cambiar",
    removePhoto: "Quitar",
    savingPhoto: "Guardando…",
    photoError: "No se pudo procesar la imagen.",
    orgName: "Weeon School",
    darkMode: "Modo oscuro",
    language: "Idioma",
    version: (value: string) => `Versión ${value}`,
  },
  signOut: {
    label: "Cerrar sesión",
  },
} as const;

export type Messages = {
  -readonly [K in keyof typeof es]: (typeof es)[K] extends (...args: never[]) => string
    ? (typeof es)[K]
    : {
        -readonly [P in keyof (typeof es)[K]]: (typeof es)[K][P] extends (...args: never[]) => string
          ? (typeof es)[K][P]
          : string;
      };
};

const en: Messages = {
  meta: {
    appName: "Weeon Ops",
    description: "Weeon School operations console.",
    dashboardTitle: "Dashboard",
  },
  common: {
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    loading: "Loading",
  },
  nav: {
    ariaMain: "Main navigation",
    sectionPrimary: "Primary",
    sectionAdmin: "Admin",
    analytics: "Analytics",
    onboarding: "Onboarding",
    tenants: "Tenants",
    access: "Access control",
    accessShort: "Access",
    security: "Security",
  },
  header: {
    ariaBrand: "Weeon Ops",
  },
  shell: {
    skipToContent: "Skip to content",
    expandMenu: "Expand menu",
    collapseMenu: "Collapse menu",
  },
  drawer: {
    ariaAccount: "Account settings",
    ariaClose: "Close settings",
    ariaSettings: "Account",
    title: "My account",
    roleFallback: "Ops administrator",
    nameFallback: "Platform staff",
    profilePhoto: "Profile photo",
    uploadPhoto: "Upload photo",
    changePhoto: "Change",
    removePhoto: "Remove",
    savingPhoto: "Saving…",
    photoError: "The image could not be processed.",
    orgName: "Weeon School",
    darkMode: "Dark mode",
    language: "Language",
    version: (value: string) => `Version ${value}`,
  },
  signOut: {
    label: "Sign out",
  },
};

export const messages: Record<Locale, Messages> = { es, en };

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
