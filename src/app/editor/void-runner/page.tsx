import Link from "next/link";
import { ArrowLeft, Box, Layers, Music2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoidRunnerEditorPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#10131F] to-[#080A12] text-[#F5F7FF]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#7C5CFF]/20 bg-[#10131F]/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/play/void-runner"
            className="inline-flex items-center gap-1 text-sm text-[#9AA4BC] hover:text-[#65E8FF]"
          >
            <ArrowLeft className="h-4 w-4" /> Play
          </Link>
          <h1 className="font-display text-lg tracking-wide text-[#F5F7FF]">VOID RUNNER EDITOR</h1>
          <span className="rounded border border-[#7C5CFF]/30 bg-[#171B2A] px-2 py-0.5 text-xs text-[#9AA4BC]">
            Foundation
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled title="Coming soon">
            <Save className="h-4 w-4" /> Save draft
          </Button>
          <Button size="sm" disabled title="Coming soon">
            Publish
          </Button>
        </div>
      </header>

      <div className="grid min-h-[70vh] lg:grid-cols-[220px_1fr_260px]">
        <aside className="border-r border-[#7C5CFF]/15 bg-[#10131F] p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9AA4BC]">
            Objects
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              "Platform",
              "Spike",
              "Jump Pad",
              "Form Portal",
              "Checkpoint",
              "Finish",
              "Collectible",
            ].map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-[#F5F7FF] hover:border-[#65E8FF]/30 hover:bg-[#171B2A]"
                  disabled
                >
                  <Box className="h-4 w-4 text-[#65E8FF]" />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="relative flex flex-col items-center justify-center bg-[#080A12] p-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(124,92,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="relative z-10 max-w-md space-y-3 text-center">
            <Layers className="mx-auto h-10 w-10 text-[#7C5CFF]" />
            <h2 className="text-xl font-semibold text-[#F5F7FF]">Level canvas scaffold</h2>
            <p className="text-sm text-[#9AA4BC]">
              Place objects on a beat-synced timeline, preview VOID SIGNAL-style runs, and export
              JSON matching the Void Runner Zod schema. Full paint tools ship in a later pass.
            </p>
            <Button href="/play/void-runner" variant="secondary">
              Test VOID SIGNAL
            </Button>
          </div>
        </main>

        <aside className="border-l border-[#7C5CFF]/15 bg-[#10131F] p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9AA4BC]">
            Level
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[#9AA4BC]">Name</dt>
              <dd className="text-[#F5F7FF]">Untitled</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#9AA4BC]">BPM</dt>
              <dd className="font-mono text-[#65E8FF]">132</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#9AA4BC]">Start form</dt>
              <dd className="font-mono text-[#458BFF]">CUBE</dd>
            </div>
          </dl>
          <div className="mt-6 rounded-xl border border-[#65E8FF]/20 bg-[#171B2A] p-3 text-xs text-[#9AA4BC]">
            <Music2 className="mb-2 h-4 w-4 text-[#65E8FF]" />
            Song timeline and undo/redo are planned. Schema:{" "}
            <code className="text-[#F5F7FF]">voidLevelSchema</code>
          </div>
        </aside>
      </div>
    </div>
  );
}
