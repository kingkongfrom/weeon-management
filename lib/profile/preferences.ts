// Ops-console personal preferences (avatar).
//
// These are per-browser settings, not tenant or ops-staff records: the ops
// directory lives in `lib/auth/policy.ts` and has no avatar/profile column.
// Persisting locally keeps this additive and avoids touching the shared
// Supabase schema owned by `weeon-tenants`.
//
// Language is NOT stored here — it lives in the `weeon.ops.locale` cookie so
// the server can render the matching catalog (see `lib/i18n/`).

export const PROFILE_AVATAR_STORAGE_KEY = "weeon.ops.avatar";

/**
 * Stored avatar as a data URL (already downscaled by `readAvatarFile`), or an
 * empty string when unset. Kept in localStorage because ops staff have no
 * server-side profile row in this repo.
 */
export function readAvatarPreference(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY) ?? "";
}

export function writeAvatarPreference(dataUrl: string) {
  if (typeof window === "undefined") return;
  if (dataUrl) {
    window.localStorage.setItem(PROFILE_AVATAR_STORAGE_KEY, dataUrl);
  } else {
    window.localStorage.removeItem(PROFILE_AVATAR_STORAGE_KEY);
  }
}

/**
 * Read an image file and return a square, downscaled data URL so the avatar
 * fits comfortably in localStorage (which caps around 5 MB). Rendered with the
 * same circular `object-cover` treatment as tenant logos.
 */
export async function readAvatarFile(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    element.src = source;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return source;

  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  context.drawImage(
    image,
    (size - width) / 2,
    (size - height) / 2,
    width,
    height,
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}
