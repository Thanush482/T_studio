import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — T_AI Studio" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-md px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-primary underline">← Back</Link>
      <h1 className="mt-4 font-display text-2xl font-bold">Terms of Service</h1>
      <p className="mt-1 text-xs text-muted-foreground">Template — review with legal counsel before launch.</p>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>By using T_AI Studio you agree to these Terms. You must be 18+ and have rights to any content you upload.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Prohibited use</h2>
        <p>You must not generate or upload: non-consensual deepfakes; sexual content involving minors; impersonations of real public figures; fake government documents; or any content that violates law.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Watermarking</h2>
        <p>All AI outputs are watermarked and labelled as AI-generated. You agree not to remove or obscure these markings.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Compliance</h2>
        <p>T_AI Studio complies with India's DPDP Act, the IT Act, GDPR where applicable, and the EU AI Act labelling rules.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Termination</h2>
        <p>We may suspend accounts that abuse the service or violate these Terms.</p>
      </div>
    </article>
  );
}