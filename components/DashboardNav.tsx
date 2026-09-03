import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tenants", label: "Tenants" },
];

export function DashboardNav({ active }: { active?: string }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line-soft bg-paper-2/60 p-4">
      <Link href="/dashboard" className="mb-6 rounded-lg px-3 py-2 text-sm font-semibold">
        Weeon · Ops
      </Link>
      <nav className="flex flex-col gap-1 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              active === l.href
                ? "rounded-lg bg-brand-soft px-3 py-2 font-medium text-brand"
                : "rounded-lg px-3 py-2 text-ink-2/80 hover:bg-paper-2"
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-6 text-xs text-ink-2/50">
        Internal tool · ops.weeon.school
      </div>
    </aside>
  );
}
