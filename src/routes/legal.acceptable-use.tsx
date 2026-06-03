import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/acceptable-use")({
  head: () => ({ meta: [{ title: "Acceptable Use — T_AI Studio" }] }),
  component: AcceptableUsePage,
});

function AcceptableUsePage() {
  return (
    <article className="mx-auto max-w-md px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-primary underline">← Back</Link>
      <h1 className="mt-4 font-display text-2xl font-bold">Acceptable Use Policy</h1>
      <p className="mt-1 text-xs text-muted-foreground">Template — review with legal counsel before launch.</p>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>T_AI Studio is a creative tool. To keep it safe for everyone, the following uses are strictly prohibited and will result in account termination and, where appropriate, referral to law enforcement.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Never allowed</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Non-consensual intimate imagery (NCII) or deepfake pornography of any person.</li>
          <li>Any sexual or suggestive content involving minors.</li>
          <li>Face or voice cloning of real public figures (celebrities, politicians, officials) without explicit consent.</li>
          <li>Fake government IDs, currency, passports, or other official documents.</li>
          <li>Content designed to defraud, harass, defame, or impersonate a real person.</li>
          <li>Hate symbols, terrorist propaganda, or content glorifying violence.</li>
          <li>Removing or obscuring T_AI Studio watermarks or AI-generated labels.</li>
        </ul>
        <h2 className="font-display text-base font-semibold text-foreground">Consent</h2>
        <p>Before using face-editing or face-swap tools you must confirm you have the subject's permission. We log this consent with your account.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Reporting</h2>
        <p>If you see content that violates this policy, please use our <Link to="/report" className="text-primary underline">abuse reporting form</Link>. We respond to verified reports within 72 hours.</p>
      </div>
    </article>
  );
}