import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const W_PATH =
  "M 22.808 12.124 L 20.215 21.124 L 17.297 21.124 L 15.97 15.851 C 15.882 15.499 15.832 15.115 15.82 14.699 L 15.768 14.699 C 15.727 15.156 15.668 15.529 15.592 15.816 L 14.168 21.124 L 11.285 21.124 L 8.745 12.124 L 11.575 12.124 L 12.814 17.995 C 12.873 18.271 12.917 18.605 12.946 18.997 L 12.999 18.997 C 13.028 18.587 13.081 18.241 13.157 17.96 L 14.704 12.124 L 17.35 12.124 L 18.738 17.995 C 18.773 18.142 18.814 18.482 18.861 19.015 L 18.923 19.015 C 18.952 18.675 18.999 18.335 19.063 17.995 L 20.232 12.124 Z";

/** Apple touch icon — same W letterform as weeon-admin. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #5e25cc 0%, #2b59ff 100%)",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32">
          <path fill="#ffffff" d={W_PATH} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
