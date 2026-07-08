import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { synthesizeSpeech } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2, Mic, Wand2, UserRound, Volume2, Square, Upload, Copy, Music4 } from "lucide-react";
import { Input } from "@/components/ui/input";

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tts"><Volume2 className="mr-1 h-4 w-4" />Speak</TabsTrigger>
          <TabsTrigger value="change"><Wand2 className="mr-1 h-4 w-4" />Change</TabsTrigger>
          <TabsTrigger value="clone"><UserRound className="mr-1 h-4 w-4" />Clone</TabsTrigger>
          <TabsTrigger value="sfx"><Music4 className="mr-1 h-4 w-4" />SFX</TabsTrigger>
          <TabsTrigger value="audio"><Mic className="mr-1 h-4 w-4" />Transcribe</TabsTrigger>
        </TabsList>

        <TabsContent value="tts" className="mt-4">
          <TextToSpeech />
        </TabsContent>
        <TabsContent value="change" className="mt-4">
          <HfPanel
            kind="change"
            title="Voice Change"
            desc="Upload a source voice and (optionally) a reference target voice. Powered by your Hugging Face RVC Space."
            needsSource
            needsRef
            promptLabel="Or describe the target style (used if no reference)"
          />
        </TabsContent>
        <TabsContent value="clone" className="mt-4">
          <HfPanel
            kind="clone"
            title="Voice Clone"
            desc="Upload a short reference (5–15s) and type what you want it to say. Powered by your Hugging Face Chatterbox / Fish Audio Space."
            needsRef
            promptLabel="Text to speak"
            promptRequired
          />
        </TabsContent>
        <TabsContent value="sfx" className="mt-4">
          <HfPanel
            kind="sfx"
            title="Sound Effects"
            desc="Describe a sound and generate it. Powered by your Hugging Face AudioLDM 2 / Tango Space."
            promptLabel="Describe the sound"
            promptRequired
            showDuration
          />
        </TabsContent>
        <TabsContent value="audio" className="mt-4">
          <Transcribe />
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

function HfPanel({
  kind,
  title,
  desc,
  needsSource,
  needsRef,
  promptLabel,
  promptRequired,
  showDuration,
}: {
  kind: "clone" | "change" | "sfx";
  title: string;
  desc: string;
  needsSource?: boolean;
  needsRef?: boolean;
  promptLabel?: string;
  promptRequired?: boolean;
  showDuration?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [apiName, setApiName] = useState("/predict");
  const [duration, setDuration] = useState(5);
  const [source, setSource] = useState<File | null>(null);
  const [ref, setRef] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (needsSource && !source) return toast.error("Please upload a source audio file.");
    if (needsRef && !ref) return toast.error("Please upload a reference audio file.");
    if (promptRequired && !prompt.trim()) return toast.error("Please enter a prompt.");
    setBusy(true);
    setAudioUrl(null);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("apiName", apiName || "/predict");
      fd.append("prompt", prompt);
      if (source) fd.append("file", source);
      if (ref) fd.append("refFile", ref);
      if (showDuration) fd.append("extra", JSON.stringify({ duration }));
      const res = await fetch("/api/hf", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.text()) || `Failed (${res.status})`);
      const json = (await res.json()) as { audioUrl?: string; error?: string };
      if (!json.audioUrl) throw new Error(json.error || "No audio returned");
      setAudioUrl(json.audioUrl);
      toast.success("Done");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>

      {promptLabel && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{promptLabel}</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        </div>
      )}

      {needsSource && (
        <FileField label="Source audio" file={source} onFile={setSource} />
      )}
      {needsRef && (
        <FileField label={kind === "change" ? "Target reference (optional)" : "Reference voice sample"} file={ref} onFile={setRef} />
      )}

      {showDuration && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration (seconds)</label>
          <Input
            type="number"
            min={1}
            max={30}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 5)}
          />
        </div>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Advanced</summary>
        <div className="mt-2 space-y-1">
          <label className="text-xs">Gradio API endpoint name</label>
          <Input value={apiName} onChange={(e) => setApiName(e.target.value)} placeholder="/predict" />
          <p className="text-[11px]">Change if your Space exposes a different function (e.g. <code>/generate</code>, <code>/infer</code>).</p>
        </div>
      </details>

      <Button onClick={run} disabled={busy} className="w-full">
        {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>) : (<><Wand2 className="mr-2 h-4 w-4" />Generate</>)}
      </Button>

      {audioUrl && (
        <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
          <audio controls src={audioUrl} className="w-full" />
          <a href={audioUrl} download className="text-xs text-primary underline">Download</a>
        </div>
      )}
    </div>
  );
}

function FileField({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.click()}>
          <Upload className="mr-1 h-3 w-3" />Choose file
        </Button>
        <span className="truncate text-xs text-muted-foreground">{file?.name ?? "No file"}</span>
      </div>
      <input
        ref={ref}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function Transcribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const transcribe = async (blob: Blob, mime: string) => {
    if (blob.size < 1024) {
      toast.error("Recording is empty — please try again.");
      return;
    }
    setIsTranscribing(true);
    setTranscript("");
    try {
      const fd = new FormData();
      const ext = mime.includes("mp4") ? "mp4" : mime.includes("mpeg") || mime.includes("mp3") ? "mp3" : mime.includes("wav") ? "wav" : mime.includes("ogg") ? "ogg" : "webm";
      fd.append("file", new File([blob], `recording.${ext}`, { type: mime || "audio/webm" }));
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Transcription failed (${res.status})`);
      }
      const json = (await res.json()) as { text?: string };
      setTranscript(json.text ?? "");
      if (!json.text?.trim()) toast.message("No speech detected in the recording.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const type = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setAudioUrl(URL.createObjectURL(blob));
        await transcribe(blob, type);
      };
      rec.start();
      recorderRef.current = rec;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access is needed to record.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
    await transcribe(file, file.type);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="font-display text-base font-semibold">Speech to text</h3>
        <p className="text-xs text-muted-foreground">Record your voice or upload an audio file, and we'll transcribe it.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isRecording ? (
          <Button variant="destructive" onClick={stopRecording} className="w-full">
            <Square className="mr-2 h-4 w-4" />Stop recording
          </Button>
        ) : (
          <Button onClick={startRecording} disabled={isTranscribing} className="w-full">
            <Mic className="mr-2 h-4 w-4" />Record
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording || isTranscribing}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />Upload audio
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full" />
      )}

      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />Transcribing…
        </div>
      )}

      {transcript && (
        <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
          <p className="whitespace-pre-wrap text-sm">{transcript}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(transcript);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy className="mr-1 h-3 w-3" />Copy
          </Button>
        </div>
      )}
    </div>
  );
}