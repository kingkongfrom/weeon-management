import Link from "next/link";
import { architecture, product, siteCopy } from "@/lib/site-copy";

export default function LandingPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line-soft bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold">{product.shortName}</div>
          <nav className="text-sm">
            <Link href="/dashboard" className="text-brand hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">
          {siteCopy.hero.kicker}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight">
          {siteCopy.hero.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2/80">
          {siteCopy.hero.lead}
        </p>

        <section className="mt-12">
          <p className="text-sm text-ink-2/60">
            {product.shortName} is <strong className="text-ink">one of four
            repositories</strong> in the Weeon / EduNova ecosystem. Each app
            shares the same Supabase backend; this one is the internal,
            cross-tenant operations console.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {architecture.productDocs.map((r) => (
              <div key={r.repo} className="card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{r.name}</h3>
                  <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-ink-2/70">
                    {r.repo}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-2/70">{r.surface}</p>
              </div>
            ))}
          </div>

          <div className="card mt-8 rounded-2xl p-5">
            <p className="text-sm text-ink-2/70">
              Full map of the four repos, who works where, and what schema /
              RLS rules apply to each:
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a
                className="rounded-lg bg-brand-soft px-3 py-1.5 font-medium text-brand hover:brightness-95"
                href="/dashboard"
              >
                Open platform dashboard
              </a>
              <Link
                className="rounded-lg border border-line-soft px-3 py-1.5 text-ink-2/80 hover:bg-paper-2"
                href="/docs/repositories.md"
              >
                docs/repositories.md
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
