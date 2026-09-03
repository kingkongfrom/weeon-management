interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "warn" | "danger" | "trial" | "ink";
}

const toneText: Record<NonNullable<StatCardProps["tone"]>, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  trial: "text-trial",
  ink: "text-ink",
};

export function StatCard({ label, value, hint, tone = "ink" }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-1 rounded-2xl p-5">
      <span className="text-xs font-medium text-ink-2/60">{label}</span>
      <span className={`text-3xl font-semibold tabular-nums ${toneText[tone]}`}>
        {value}
      </span>
      {hint ? (
        <span className="text-xs text-ink-2/50">{hint}</span>
      ) : null}
    </div>
  );
}
