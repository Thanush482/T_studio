import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — T_AI Studio" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-md px-6 py-10 text-sm leading-relaxed text-foreground">
      <Link to="/" className="text-xs text-primary underline">← Back</Link>
      <h1 className="mt-4 font-display text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-xs text-muted-foreground">Template — review with legal counsel before launch.</p>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>We collect your account info, prompts, uploaded images, and generated outputs to deliver the service.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Storage & retention</h2>
        <p>Generated content is stored in your private library. Inactive generations may be purged after 30 days. Deleted accounts are erased within 90 days.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Your rights</h2>
        <p>Under DPDP & GDPR you may request access, correction, or deletion of your data by emailing privacy@taistudio.app.</p>
        <h2 className="font-display text-base font-semibold text-foreground">Sharing</h2>
        <p>We do not sell your data. We share with AI inference vendors strictly to process your requests.</p>
      </div>
    </article>
  );
}