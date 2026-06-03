import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/takedown")({
  head: () => ({ meta: [{ title: "Takedown — T_AI Studio" }] }),
  component: TakedownPage,
});

function TakedownPage() {
  return (
    <article className="mx-auto max-w-md px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-primary underline">← Back</Link>
      <h1 className="mt-4 font-display text-2xl font-bold">Content Takedown</h1>
      <p className="mt-1 text-xs text-muted-foreground">Template — review with legal counsel before launch.</p>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>If content generated on T_AI Studio depicts you, your likeness, or infringes your copyright, you can request removal.</p>
        <h2 className="font-display text-base font-semibold text-foreground">How to submit</h2>
        <p>File a report through the <Link to="/report" className="text-primary underline">abuse reporting form</Link>. Include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your name and contact email.</li>
          <li>A link or screenshot of the content.</li>
          <li>Proof of identity or rights ownership.</li>
          <li>A short description of why the content should be removed.</li>
        </ul>
        <h2 className="font-display text-base font-semibold text-foreground">Our response</h2>
        <p>We acknowledge reports within 24 hours and resolve verified takedown requests within 72 hours. Urgent cases (NCII, child safety) are prioritised and actioned within 24 hours.</p>
        <h2 className="font-display text-base font-semibold text-foreground">India Grievance Officer</h2>
        <p>As required by India's IT Rules 2021, our Grievance Officer can be reached at <span className="text-foreground">grievance@tai-studio.app</span>.</p>
      </div>
    </article>
  );
}