import { useMemo, useState } from "react";
import { RefreshCw, Shuffle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ToolPanel, { ToolSection, FieldLabel, CopyField } from "../ToolPanel";
import { pickRandomStatuses, STATUS_CATEGORIES, STATUS_IDEAS } from "../../lib/statusIdeas";
import { cn } from "@/lib/utils";

export default function StatusIdeasTool() {
  const [category, setCategory] = useState("all");
  const [seed, setSeed] = useState(0);
  const [custom, setCustom] = useState("");

  const ideas = useMemo(() => {
    void seed;
    return pickRandomStatuses(8, category);
  }, [category, seed]);

  const poolCount =
    category === "all" ? STATUS_IDEAS.length : STATUS_IDEAS.filter((s) => s.category === category).length;

  return (
    <ToolPanel fill>
      <ToolSection
        title="Custom status ideas"
        description="Funny, chill, and creative Discord custom status lines you can copy"
      >
        <FieldLabel>Category</FieldLabel>
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                setSeed((n) => n + 1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                category === c.id
                  ? "bg-[var(--nx-accent-soft)] border-[var(--nx-border-accent)] text-[var(--nx-text-heading)]"
                  : "border-[var(--nx-border)] text-[var(--nx-text-muted)] hover:bg-[var(--nx-hover-bg)]"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button type="button" variant="secondary" size="sm" onClick={() => setSeed((n) => n + 1)}>
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </Button>
          <span className="text-xs text-[var(--nx-text-faint)] self-center">{poolCount} ideas in pool</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideas.map((idea) => (
            <div
              key={`${idea.text}-${seed}`}
              className="p-3 rounded-lg border border-[var(--nx-border)] bg-[var(--nx-bg-input)]"
            >
              <p className="text-sm text-[var(--nx-text-heading)] mb-3 leading-snug">{idea.text}</p>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="nx-badge capitalize">{idea.category}</span>
              </div>
              <CopyField value={idea.text} />
            </div>
          ))}
        </div>
      </ToolSection>

      <ToolSection title="Write your own" description="Draft a status and copy it">
        <FieldLabel hint="Discord custom status max is typically short — keep it punchy">Status</FieldLabel>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom status"
            maxLength={128}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCustom(pickRandomStatuses(1, category)[0]?.text || "")}
          >
            <RefreshCw className="w-4 h-4" />
            Random
          </Button>
        </div>
        <div className="mt-3">
          <CopyField label="Copy" value={custom} placeholder="Status" />
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
