import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T_AI Studio — AI Image & Video Creation" },
      { name: "description", content: "Generate, edit and transform images and videos with AI. A mobile-first creative studio." },
      { property: "og:title", content: "T_AI Studio" },
      { property: "og:description", content: "AI image & video creation studio." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative mx-auto flex max-w-md flex-col items-center px-6 pt-16 pb-12 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.24_295/0.25),transparent_60%)]" />
        <div className="mb-6 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[0_0_60px_-10px_oklch(0.62_0.24_295/0.6)]" style={{ animationDelay: "0.2s" }}>
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
          T_AI <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Studio</span>
        </h1>
        <p className="mt-3 text-base text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Generate, edit and transform images with AI — right from your phone.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button asChild size="lg" className="h-12 text-base animate-glow-pulse">
            <Link to="/signup">Get started — free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 text-base">
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>

        <p className="mt-10 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Link to="/legal/terms" className="underline">Terms</Link> ·{" "}
          <Link to="/legal/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </div>
  );
}
