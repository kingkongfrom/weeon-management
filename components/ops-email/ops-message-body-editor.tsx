"use client";

import { RichTextEditor } from "@/components/ops-email/rich-text-editor";
import type { RichTextDoc } from "@/lib/comms/model";

export function OpsMessageBodyEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: RichTextDoc;
  onChange: (doc: RichTextDoc) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      editorClassName="min-h-[16rem]"
      enableInlineEmbeds={false}
      className={disabled ? "pointer-events-none opacity-60" : undefined}
    />
  );
}
