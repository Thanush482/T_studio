import { Clock } from "lucide-react";

export function ComingSoon({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Clock className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xs text-sm text-muted-foreground">{subtitle}</p>}
      <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Coming soon
      </span>
    </div>
  );
}
