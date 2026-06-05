import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/bodyswap")({
  head: () => ({ meta: [{ title: "Outfit Swap — T_AI Studio" }] }),
  component: () => (
    <ComingSoon
      title="Outfit Swap"
      subtitle="Try a garment on a model photo. This feature is launching soon."
    />
  ),
});
