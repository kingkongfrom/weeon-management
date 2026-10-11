"use client";

import { useEffect } from "react";

import { reportRenderError } from "@/lib/observability/report-render-error";

/** Root error boundary — renders its own html/body (replaces the root layout). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportRenderError(error, "global-error");
  }, [error]);

  return (
    <html lang="en">
      <body>
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
        </div>
      </body>
    </html>
  );
}
