import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-24 text-center">
      <h1 className="text-6xl font-black tracking-tight">404</h1>
      <p className="mt-3 text-sm text-ink-2/70">
        That page is not part of the operations console.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-brand hover:underline"
      >
        Back to the overview
      </Link>
    </main>
  );
}
