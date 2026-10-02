export type OpsEmailFolder = "inbox" | "sent" | "favorite" | "draft" | "trash";

export function parseOpsEmailFolder(value: string | undefined): OpsEmailFolder {
  if (
    value === "inbox" ||
    value === "favorite" ||
    value === "draft" ||
    value === "drafts" ||
    value === "trash"
  ) {
    if (value === "drafts") return "draft";
    return value;
  }
  return "sent";
}

export function parseOpsEmailLabelId(value: string | undefined): string | null {
  if (!value) return null;
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}
