import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-24 text-center">
      <h1 className="text-6xl font-black tracking-tight text-foreground">404</h1>
      <p className="mt-3 text-sm text-foreground/70">
        That page is not part of the operations console.
      </p>
      <Link
        href="/dashboard/tenants"
        className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
      >
        Back to tenants
      </Link>
    </main>
  );
}
