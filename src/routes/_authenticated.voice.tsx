import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { synthesizeSpeech } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2, Mic, Wand2, UserRound, Volume2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({
    meta: [
      { title: "Voice Studio — T_AI Studio" },
      { name: "description", content: "Turn text into speech, change your voice, and clone voices with AI." },
    ],
  }),
  component: VoicePage,
});

function VoicePage() {
  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm text-muted-foreground">Voice Studio</p>
        <h1 className="font-display text-2xl font-bold">Create with your voice</h1>
      </header>

      <Tabs defaultValue="tts">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tts"><Volume2 className="mr-1 h-4 w-4" />Speak</TabsTrigger>
          <TabsTrigger value="change"><Wand2 className="mr-1 h-4 w-4" />Change</TabsTrigger>
          <TabsTrigger value="clone"><UserRound className="mr-1 h-4 w-4" />Clone</TabsTrigger>
          <TabsTrigger value="audio"><Mic className="mr-1 h-4 w-4" />Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="tts" className="mt-4">
          <TextToSpeech />
        </TabsContent>
        <TabsContent value="change" className="mt-4">
          <Placeholder
            title="Voice Change"
            desc="Upload a recorded voice and transform it — old, young, child, male, female, or a stylised character voice."
          />
        </TabsContent>
        <TabsContent value="clone" className="mt-4">
          <Placeholder
            title="Voice Clone"
            desc="Clone any voice from a short sample (with the owner's explicit consent) and have it speak any text you write."
          />
        </TabsContent>
        <TabsContent value="audio" className="mt-4">
          <Placeholder
            title="Audio & Sound FX"
            desc="Generate music tracks and sound effects from a text description."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const VOICES = [
  { id: "alloy", label: "Alloy — neutral" },
  { id: "echo", label: "Echo — warm male" },
  { id: "fable", label: "Fable — expressive" },
  { id: "onyx", label: "Onyx — deep male" },
  { id: "nova", label: "Nova — bright female" },
  { id: "shimmer", label: "Shimmer — soft female" },
];

function TextToSpeech() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<(typeof VOICES)[number]["id"]>("alloy");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const speak = useServerFn(synthesizeSpeech);

  const mutation = useMutation({
    mutationFn: async () => speak({ data: { text, voice: voice as "alloy" } }),
    onSuccess: (res) => setAudioUrl(res.audioUrl),
    onError: (e: Error) => toast.error(e.message ?? "Something went wrong"),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">What should we say?</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type any text and pick a voice…"
          rows={5}
          maxLength={4000}
        />
        <p className="text-xs text-muted-foreground">{text.length}/4000</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Voice</label>
        <Select value={voice} onValueChange={(v) => setVoice(v as typeof voice)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {VOICES.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={!text.trim() || mutation.isPending}
        className="w-full"
      >
        {mutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
        ) : (
          <><Volume2 className="mr-2 h-4 w-4" />Generate speech</>
        )}
      </Button>

      {audioUrl && (
        <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
          <audio controls src={audioUrl} className="w-full" />
          <a
            href={audioUrl}
            download="tai-studio-speech.mp3"
            className="text-xs text-primary underline"
          >
            Download MP3
          </a>
        </div>
      )}
    </div>
  );
}

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Coming soon
      </span>
    </div>
  );
}