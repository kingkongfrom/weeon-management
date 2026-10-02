"use client";

import { Cloud, HardDrive, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  isDropboxConfigured,
  isGoogleDriveConfigured,
} from "@/lib/comms/cloud-import/config";
import { pickDropboxFiles } from "@/lib/comms/cloud-import/dropbox-client";
import { fetchGoogleDriveImportsAsFiles } from "@/lib/comms/cloud-import/google-drive-fetch";
import { pickGoogleDriveFiles } from "@/lib/comms/cloud-import/google-drive-client";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { opsEmailTone } from "@/lib/ops-email/messages-tone";

type BusySource = "dropbox" | "google-drive" | null;

function mapCloudError(
  error: unknown,
  messages: ReturnType<typeof useT>["opsEmail"],
): string {
  const code = error instanceof Error ? error.message : "";
  if (code.includes("not_configured")) return messages.cloudNotConfigured;
  if (code === "attachment_type_not_allowed") return messages.attachmentTypeNotAllowed;
  if (code === "attachment_too_large") return messages.attachmentTooLarge;
  if (code === "dropbox_folder_not_supported") return messages.dropboxFolderNotSupported;
  if (
    code === "google_auth_failed" ||
    code === "google_picker_unavailable" ||
    code === "gapi_unavailable"
  ) {
    return messages.cloudAuthFailed;
  }
  if (code === "google_drive_fetch_failed" || code === "google_drive_not_configured") {
    return messages.googleDriveImportFailed;
  }
  if (
    code === "dropbox_fetch_failed" ||
    code === "invalid_dropbox_url" ||
    code === "dropbox_no_link" ||
    code === "dropbox_empty_file" ||
    code.startsWith("dropbox_http_") ||
    code === "dropbox_timeout" ||
    code === "dropbox_unavailable"
  ) {
    return messages.dropboxImportFailed;
  }
  return messages.cloudImportFailed;
}

function SourceButton({
  label,
  title,
  ready,
  busy,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  title: string;
  ready: boolean;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled || !ready}
      onClick={onClick}
      className={cn(
        "inline-flex min-w-[4.5rem] flex-col items-center gap-1 text-xs font-semibold transition-colors",
        ready
          ? cn(opsEmailTone.accentText, "hover:brightness-110")
          : "cursor-not-allowed text-foreground/30",
        disabled && ready && "opacity-50",
      )}
    >
      {busy ? <Loader2 className="h-8 w-8 animate-spin" /> : icon}
      {label}
    </button>
  );
}

export function OpsCloudImportSources({
  remainingSlots,
  disabled,
  onLocalFiles,
  onError,
}: {
  remainingSlots: number;
  disabled?: boolean;
  onLocalFiles: (files: File[]) => void;
  onError: (message: string) => void;
}) {
  const t = useT();
  const o = t.opsEmail;
  const [busySource, setBusySource] = useState<BusySource>(null);
  const dropboxReady = isDropboxConfigured();
  const googleReady = isGoogleDriveConfigured();
  const busy = busySource !== null;

  async function runDropboxPick() {
    if (disabled || busy || remainingSlots <= 0 || !dropboxReady) return;
    setBusySource("dropbox");
    onError("");
    try {
      const files = await pickDropboxFiles(remainingSlots);
      if (files.length > 0) onLocalFiles(files);
    } catch (error) {
      onError(mapCloudError(error, o));
    } finally {
      setBusySource(null);
    }
  }

  async function runGoogleDrivePick() {
    if (disabled || busy || remainingSlots <= 0 || !googleReady) return;
    setBusySource("google-drive");
    onError("");
    try {
      const refs = await pickGoogleDriveFiles(remainingSlots);
      if (refs.length === 0) return;
      const files = await fetchGoogleDriveImportsAsFiles(refs);
      if (files.length > 0) onLocalFiles(files);
    } catch (error) {
      onError(mapCloudError(error, o));
    } finally {
      setBusySource(null);
    }
  }

  const notConfiguredHint = o.cloudNotConfigured;

  return (
    <>
      <SourceButton
        label={o.googleDrive}
        title={googleReady ? o.googleDrive : notConfiguredHint}
        ready={googleReady}
        busy={busySource === "google-drive"}
        disabled={disabled || remainingSlots <= 0 || busy}
        onClick={() => void runGoogleDrivePick()}
        icon={<HardDrive className="h-8 w-8 text-[#4285F4]" strokeWidth={1.75} />}
      />
      <SourceButton
        label={o.dropbox}
        title={dropboxReady ? o.dropbox : notConfiguredHint}
        ready={dropboxReady}
        busy={busySource === "dropbox"}
        disabled={disabled || remainingSlots <= 0 || busy}
        onClick={() => void runDropboxPick()}
        icon={<Cloud className="h-8 w-8" strokeWidth={1.75} />}
      />
    </>
  );
}
