"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ID } from "appwrite";
import { Plus, Trash2, NotebookPen, AlertCircle, Code2, GraduationCap, Zap } from "lucide-react";
import { format } from "date-fns";

import { useAuthStore } from "@/store/useAuthStore";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type MistakeCategory = "academic" | "cp" | "exam" | "productivity";

interface Mistake {
  id: string;
  title: string;
  description: string;
  category: MistakeCategory;
  date: string;
}

const CATEGORIES: Record<MistakeCategory, { label: string; icon: React.ElementType; color: string }> = {
  academic: { label: "Academic", icon: GraduationCap, color: "text-blue-400" },
  cp: { label: "Competitive Programming", icon: Code2, color: "text-emerald-400" },
  exam: { label: "Exam", icon: AlertCircle, color: "text-rose-400" },
  productivity: { label: "Productivity", icon: Zap, color: "text-amber-400" },
};

export default function MistakesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [filterCat, setFilterCat] = useState<MistakeCategory | "all">("all");
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "academic" as MistakeCategory });

  const { appwriteUser } = useAuthStore();

  function handleAdd() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const newMistake: Mistake = { id: ID.unique(), ...form, date: new Date().toISOString() };
    setMistakes((prev) => [newMistake, ...prev]);
    toast.success("Mistake logged. Learn from it! 💪");
    setForm({ title: "", description: "", category: "academic" });
    setIsOpen(false);
  }

  const filtered = filterCat === "all" ? mistakes : mistakes.filter((m) => m.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Mistake Journal</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Track and learn from your mistakes.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />Log Mistake
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === "all" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
        >All ({mistakes.length})</button>
        {(Object.keys(CATEGORIES) as MistakeCategory[]).map((cat) => {
          const { label, icon: Icon, color } = CATEGORIES[cat];
          const count = mistakes.filter((m) => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === cat ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
            >
              <Icon className={`w-3 h-3 ${color}`} />{label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No mistakes logged" description="Log mistakes to learn and grow. Everyone makes them!" action={
          <Button onClick={() => setIsOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-3.5 w-3.5" />Log First Mistake</Button>
        } />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((mistake) => {
            const cat = CATEGORIES[mistake.category];
            return (
              <Card key={mistake.id} className="bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700/60 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <cat.icon className={`w-4 h-4 flex-shrink-0 ${cat.color}`} />
                      <span className="text-xs text-zinc-500">{cat.label}</span>
                      <span className="text-xs text-zinc-700">·</span>
                      <span className="text-xs text-zinc-600">{format(new Date(mistake.date), "MMM d, yyyy")}</span>
                    </div>
                    <button
                      onClick={() => { setMistakes((prev) => prev.filter((m) => m.id !== mistake.id)); toast.success("Entry removed"); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-zinc-600 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-zinc-100 mb-1">{mistake.title}</p>
                  {mistake.description && <p className="text-xs text-zinc-500 leading-relaxed">{mistake.description}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader><DialogTitle>Log a Mistake</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORIES) as MistakeCategory[]).map((cat) => {
                  const { label, icon: Icon, color } = CATEGORIES[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${form.category === cat ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${color}`} />{label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">What went wrong?</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g., Forgot to review notes before quiz" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Details / How to fix (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What will you do differently next time?"
                rows={3}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <Button onClick={handleAdd} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!form.title.trim()}>
              Log Mistake
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
