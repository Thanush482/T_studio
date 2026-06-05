import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/faceswap")({
  head: () => ({ meta: [{ title: "Face Swap — T_AI Studio" }] }),
  component: () => (
    <ComingSoon
      title="Face Swap"
      subtitle="Place a face from one photo onto another. This feature is launching soon."
    />
  ),
});
