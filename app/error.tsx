"use client";

import { useEffect } from "react";

import { reportRenderError } from "@/lib/observability/report-render-error";

/** Route-segment error boundary. Minimal + dependency-free on purpose. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportRenderError(error, "error-boundary");
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
      <p style={{ opacity: 0.7 }}>You can retry. If it keeps happening, contact the team.</p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 8,
          padding: "10px 18px",
          borderRadius: 12,
          border: "none",
          background: "#2b59ff",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
      {error.digest ? (
        <p style={{ opacity: 0.4, fontSize: 12, fontFamily: "monospace" }}>ref: {error.digest}</p>
      ) : null}
    </div>
  );
}
