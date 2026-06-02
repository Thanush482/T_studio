import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Crown, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — T_AI Studio" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, credits, tier, avatar_url").maybeSingle();
      const { data: u } = await supabase.auth.getUser();
      return { ...data, email: u.user?.email };
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground">
          {(profile?.display_name ?? profile?.email ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-display text-lg font-semibold">{profile?.display_name ?? "Creator"}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</p>
        <p className="font-display text-2xl font-bold uppercase">{profile?.tier ?? "free"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{profile?.credits ?? 0} credits remaining</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Plans</h2>
        <PlanCard name="Pro" price="₹999/mo" perks={["500 credits / month", "Faster queue", "HD output"]} />
        <PlanCard name="Premium" price="₹1,998/mo" perks={["1500 credits / month", "Priority queue", "Commercial license"]} />
        <p className="text-xs text-muted-foreground">Payments will go live soon.</p>
      </section>

      <section className="space-y-2">
        <Link to="/legal/terms" className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
          <Shield className="h-4 w-4 text-primary" /> Terms of Service
        </Link>
        <Link to="/legal/privacy" className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
          <Shield className="h-4 w-4 text-primary" /> Privacy Policy
        </Link>
      </section>

      <Button onClick={signOut} variant="outline" className="h-11 w-full">
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

function PlanCard({ name, price, perks }: { name: string; price: string; perks: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <p className="font-display font-semibold">{name}</p>
        </div>
        <p className="font-display font-bold">{price}</p>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {perks.map((p) => <li key={p}>• {p}</li>)}
      </ul>
    </div>
  );
}