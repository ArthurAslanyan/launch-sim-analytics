import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { GameConcept, SimulationResults } from "@/lib/simulation";
import { exportToPDF, exportToDOCX, type ExportOptions } from "@/lib/reportExport";
import { FileDown, FileText, Loader2 } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: GameConcept;
  results: SimulationResults;
}

const SECTION_LABELS: Record<string, string> = {
  gameSummary: "Game Summary",
  performanceScore: "Performance Score",
  population: "Player Metrics",
  archetypeFit: "Archetype Fit",
  sessionJourney: "Session Journey",
  recommendation: "Recommendation",
  featureInteraction: "Feature Interaction",
  stopReasons: "Stop Reasons",
  dataInterpretation: "Data Interpretation",
  similarGames: "Similar Games",
  gambleImpact: "Gamble Impact",
  symbolSwapImpact: "Symbol Swap Impact",
};

export function ExportDialog({ open, onOpenChange, game, results }: ExportDialogProps) {
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [filename, setFilename] = useState(() => {
    const date = new Date().toISOString().split("T")[0];
    const safe = (game.gameName || "Report").replace(/\s+/g, "_");
    return `LaunchIndex_${safe}_${date}`;
  });
  const [exporting, setExporting] = useState(false);

  const [sections, setSections] = useState<ExportOptions["sections"]>({
    gameSummary: true,
    performanceScore: true,
    population: true,
    archetypeFit: true,
    sessionJourney: true,
    recommendation: true,
    featureInteraction: true,
    stopReasons: false,
    dataInterpretation: true,
    similarGames: false,
    gambleImpact: !!results.gambleImpact && (results.gambleImpact.notes?.length ?? 0) > 0,
    symbolSwapImpact:
      !!results.symbolSwapImpact && (results.symbolSwapImpact.notes?.length ?? 0) > 0,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const options: ExportOptions = { format, filename, sections };
      if (format === "pdf") {
        await exportToPDF(game, results, options);
      } else {
        await exportToDOCX(game, results, options);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose format, customize filename, and select sections to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  format === "pdf"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <FileDown className="h-5 w-5" />
                PDF
              </button>
              <button
                type="button"
                onClick={() => setFormat("docx")}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  format === "docx"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <FileText className="h-5 w-5" />
                DOCX
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {format === "pdf"
                ? "PDF — Read-only, perfect for sharing with stakeholders."
                : "DOCX — Editable Word document for internal collaboration."}
            </p>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="LaunchIndex_GameName_2026-05-11"
            />
            <p className="text-xs text-muted-foreground">
              File extension (.{format}) will be added automatically.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <Label>Include Sections</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-3">
              {(Object.keys(sections) as Array<keyof typeof sections>).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={sections[key]}
                    onCheckedChange={(checked) =>
                      setSections({ ...sections, [key]: !!checked })
                    }
                  />
                  <span>{SECTION_LABELS[key] ?? key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || !filename.trim()}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
