import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/train")({
  head: () => ({ meta: [{ title: "Train AI Model — T_AI Studio" }] }),
  component: () => (
    <ComingSoon
      title="Train your AI model"
      subtitle="Upload photos of one subject and train your own AI model. This feature is launching soon."
    />
  ),
});
