"use client";

import { RichTextEditor } from "@/components/ops-email/rich-text-editor";
import type { RichTextDoc } from "@/lib/comms/model";
import { cn } from "@/lib/cn";

export function OpsMessageBodyEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  editorClassName = "min-h-[16rem]",
  className,
}: {
  value: RichTextDoc;
  onChange: (doc: RichTextDoc) => void;
  placeholder?: string;
  disabled?: boolean;
  editorClassName?: string;
  className?: string;
}) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      editorClassName={editorClassName}
      enableInlineEmbeds={false}
      className={disabled ? cn("pointer-events-none opacity-60", className) : className}
    />
  );
}
