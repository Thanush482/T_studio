import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ReportSchema = z.object({
  reporter_email: z.string().email().max(254),
  reporter_name: z.string().min(1).max(200).optional(),
  reported_generation_id: z.string().uuid().optional(),
  category: z.enum(["deepfake", "copyright", "identity", "harassment", "csam", "other"]),
  description: z.string().min(10).max(5000),
  evidence_url: z.string().url().max(2000).optional(),
});

export const Route = createFileRoute("/api/public/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const json = await request.json();
          const parsed = ReportSchema.safeParse(json);
          if (!parsed.success) {
            return Response.json({ error: "Invalid report", details: parsed.error.flatten() }, { status: 400 });
          }
          const { error } = await supabaseAdmin.from("abuse_reports").insert(parsed.data);
          if (error) {
            console.error("abuse_reports insert failed", error);
            return Response.json({ error: "Failed to save report" }, { status: 500 });
          }
          return Response.json({ ok: true });
        } catch (e) {
          console.error(e);
          return Response.json({ error: "Bad request" }, { status: 400 });
        }
      },
    },
  },
});