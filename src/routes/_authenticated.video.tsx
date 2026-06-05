import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/video")({
  head: () => ({ meta: [{ title: "AI Video — T_AI Studio" }] }),
  component: () => (
    <ComingSoon
      title="AI Video"
      subtitle="Describe a short video and we'll generate it. This feature is launching soon."
    />
  ),
});
