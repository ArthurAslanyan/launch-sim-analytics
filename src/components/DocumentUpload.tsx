import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ExtractedGameData {
  game_name: string | null;
  target_market: string[] | null;
  grid_size: string | null;
  pay_mechanic: string | null;
  volatility: string | null;
  rtp: number | null;
  features: string[] | null;
  jackpot_types: string[] | null;
  has_progression: boolean | null;
  has_persistent_feature: boolean | null;
  has_collect_mechanic: boolean | null;
  feature_descriptions: string | null;
  usp: string | null;
}

type ExtractionStatus = "idle" | "reading" | "extracting" | "done" | "error";

interface DocumentUploadProps {
  onExtracted: (data: ExtractedGameData) => void;
}

function ConfidenceBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const styles = {
    High: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Low: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[level])}>
      {level}
    </span>
  );
}

function getConfidence(value: unknown): "High" | "Medium" | "Low" {
  if (value === null || value === undefined || value === "") return "Low";
  if (Array.isArray(value) && value.length === 0) return "Low";
  if (typeof value === "string" && value.length < 3) return "Medium";
  return "High";
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function DocumentUpload({ onExtracted }: DocumentUploadProps) {
  const [status, setStatus] = useState<ExtractionStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [extracted, setExtracted] = useState<ExtractedGameData | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [showRawJson, setShowRawJson] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf", "txt"].includes(ext || "")) {
      toast({ title: "Unsupported file type", description: "Please upload DOCX, PDF, or TXT files.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setError("");
    setExtracted(null);
    setStatus("reading");

    try {
      let text = "";
      if (ext === "txt") {
        text = await readFileAsText(file);
      } else {
        // For DOCX/PDF, read as text (basic extraction)
        // This extracts raw text content
        text = await readFileAsText(file);
        if (!text || text.length < 20) {
          // Binary file - convert to base64 and send raw bytes info
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          // Try to extract any readable text from binary
          const decoder = new TextDecoder("utf-8", { fatal: false });
          text = decoder.decode(bytes);
          // Clean non-printable characters
          text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
        }
      }

      if (!text || text.trim().length < 10) {
        setError("Could not read document content. Please try a TXT file or fill the form manually.");
        setStatus("error");
        return;
      }

      setStatus("extracting");

      const { data, error: fnError } = await supabase.functions.invoke("extract-game-brief", {
        body: { documentText: text.slice(0, 15000) },
      });

      if (fnError || data?.error) {
        const msg = data?.error || fnError?.message || "Extraction failed";
        setError(msg);
        setStatus("error");
        toast({ title: "Extraction failed", description: msg, variant: "destructive" });
        return;
      }

      const result = data.extracted as ExtractedGameData;
      setExtracted(result);
      setRawJson(JSON.stringify(result, null, 2));
      setStatus("done");
      onExtracted(result);
      toast({ title: "Document analyzed", description: "Form fields have been auto-filled. Review and edit as needed." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus("error");
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  }, [onExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const fields: { key: keyof ExtractedGameData; label: string }[] = [
    { key: "game_name", label: "Game Name" },
    { key: "target_market", label: "Target Markets" },
    { key: "grid_size", label: "Grid Layout" },
    { key: "pay_mechanic", label: "Pay Mechanic" },
    { key: "volatility", label: "Volatility" },
    { key: "rtp", label: "RTP (%)" },
    { key: "features", label: "Features" },
    { key: "jackpot_types", label: "Jackpot Types" },
    { key: "has_progression", label: "Progression" },
    { key: "has_persistent_feature", label: "Persistent Feature" },
    { key: "has_collect_mechanic", label: "Collect Mechanic" },
    { key: "feature_descriptions", label: "Feature Descriptions" },
    { key: "usp", label: "USP" },
  ];

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {status === "idle" || status === "error" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.pdf,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">Upload Game Brief</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or click — DOCX, PDF or TXT
          </p>
        </div>
      ) : null}

      {/* Status indicators */}
      {(status === "reading" || status === "extracting") && (
        <div className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">
              {status === "reading" ? "Reading document…" : "Analyzing document…"}
            </p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Extraction Failed</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">You can fill the form manually below.</p>
          </div>
        </div>
      )}

      {/* Extracted Results */}
      {status === "done" && extracted && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold">Review Extracted Data</span>
            <FileText className="ml-auto h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{fileName}</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT: Extracted fields */}
            <div className="space-y-3">
              {fields.map(({ key, label }) => {
                const val = extracted[key];
                const confidence = getConfidence(val);
                const displayVal = val === null || val === undefined
                  ? "—"
                  : Array.isArray(val)
                    ? val.join(", ") || "—"
                    : typeof val === "boolean"
                      ? val ? "Yes" : "No"
                      : String(val);

                return (
                  <div key={key} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <p className={cn("truncate text-sm", val === null && "italic text-muted-foreground")}>
                        {displayVal}
                      </p>
                    </div>
                    <ConfidenceBadge level={confidence} />
                  </div>
                );
              })}

              {/* Validation warnings */}
              {!extracted.grid_size && (
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Grid Layout is required — please select manually
                </div>
              )}
              {(!extracted.features || extracted.features.length === 0) && (
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  No features detected — consider adding manually
                </div>
              )}
              {!extracted.pay_mechanic && (
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Pay mechanic not detected — please select manually
                </div>
              )}
            </div>

            {/* RIGHT: Raw JSON */}
            <div>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {showRawJson ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                Raw Extracted JSON
              </button>
              {showRawJson && (
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {rawJson}
                </pre>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setStatus("idle"); setExtracted(null); }}
            >
              Upload Different File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
