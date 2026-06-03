import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report Abuse — T_AI Studio" }] }),
  component: ReportPage,
});

const CATEGORIES = [
  { value: "deepfake", label: "Non-consensual deepfake / impersonation" },
  { value: "csam", label: "Child safety" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "identity_theft", label: "Identity / likeness misuse" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "other", label: "Other" },
];

function ReportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      reporter_email: String(fd.get("email") ?? ""),
      reporter_name: String(fd.get("name") ?? "") || undefined,
      reported_generation_id: String(fd.get("generation_id") ?? "") || undefined,
      category: String(fd.get("category") ?? "other"),
      description: String(fd.get("description") ?? ""),
      evidence_url: String(fd.get("evidence_url") ?? "") || undefined,
    };
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to submit report");
      }
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to="/" className="text-xs text-primary underline">← Back</Link>
      <h1 className="mt-4 font-display text-2xl font-bold">Report abuse</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about content that violates our policies. We respond to verified reports within 72 hours; child safety and NCII cases within 24 hours.
      </p>

      {done ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm">
          <p className="font-display text-base font-semibold">Report received.</p>
          <p className="mt-2 text-muted-foreground">Thanks — our trust &amp; safety team will review and contact you at the email you provided.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Your email</Label>
            <Input id="email" name="email" type="email" required maxLength={254} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name (optional)</Label>
            <Input id="name" name="name" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              required
              defaultValue="deepfake"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="generation_id">Generation ID (if known)</Label>
            <Input id="generation_id" name="generation_id" placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evidence_url">Evidence URL (optional)</Label>
            <Input id="evidence_url" name="evidence_url" type="url" placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">What happened?</Label>
            <Textarea id="description" name="description" required minLength={10} maxLength={5000} rows={5} />
          </div>
          <Button type="submit" disabled={submitting} className="h-11 w-full">
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            False or abusive reports may themselves violate our Terms.
          </p>
        </form>
      )}
    </div>
  );
}