"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ID } from "appwrite";
import { Plus, Trash2, CheckCircle2, Flame } from "lucide-react";
import { isSameDay } from "date-fns";

import { useAuthStore } from "@/store/useAuthStore";
import { useHabitStore } from "@/store/useHabitStore";
import { Habit } from "@/types";
import { calculateNewStreak } from "@/lib/calculations/streak";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function HabitsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { appwriteUser } = useAuthStore();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabitStore();

  function handleAdd() {
    if (!newTitle.trim() || !appwriteUser) return;
    const newHabit: Habit = {
      $id: ID.unique(), $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString(),
      $collectionId: "", $databaseId: "", $permissions: [], $sequence: "0",
      userId: appwriteUser.$id, title: newTitle.trim(), streak: 0,
    };
    addHabit(newHabit);
    toast.success("Habit added!");
    setNewTitle("");
    setIsOpen(false);
  }

  function handleComplete(habit: Habit) {
    if (habit.lastCompleted && isSameDay(new Date(habit.lastCompleted), new Date())) {
      toast("Already completed today!");
      return;
    }
    const { newStreak, newLastCompleted } = calculateNewStreak(
      habit.streak, habit.lastCompleted ?? null
    );
    updateHabit(habit.$id, { streak: newStreak, lastCompleted: newLastCompleted });
    toast.success(`Habit done! 🔥 ${newStreak}-day streak! +2 XP`);
  }

  const todayStr = new Date().toDateString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Daily Habits</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Build consistency, one day at a time.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />Add Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState icon={Flame} title="No habits yet" description="Add daily habits to track and build streaks." action={
          <Button onClick={() => setIsOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-3.5 w-3.5" />Add First Habit</Button>
        } />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const doneToday = habit.lastCompleted ? isSameDay(new Date(habit.lastCompleted), new Date()) : false;
            return (
              <Card key={habit.$id} className={`border transition-colors ${doneToday ? "bg-emerald-950/20 border-emerald-500/20" : "bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700/60"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-sm font-medium ${doneToday ? "text-emerald-300" : "text-zinc-100"}`}>{habit.title}</p>
                    <button onClick={() => { deleteHabit(habit.$id); toast.success("Habit removed"); }} className="p-1 hover:text-rose-400 text-zinc-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Flame className={`w-4 h-4 ${habit.streak > 0 ? "text-orange-400" : "text-zinc-600"}`} />
                      <span className={`text-sm font-bold ${habit.streak > 0 ? "text-orange-400" : "text-zinc-600"}`}>{habit.streak}</span>
                      <span className="text-xs text-zinc-500">day streak</span>
                    </div>
                    <button
                      onClick={() => handleComplete(habit)}
                      disabled={doneToday}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${doneToday ? "bg-emerald-500/10 text-emerald-400 cursor-default" : "bg-zinc-800 hover:bg-indigo-500/20 hover:text-indigo-400 text-zinc-400"}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {doneToday ? "Done!" : "Mark Done"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Daily Habit</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Solve 2 CP problems"
              className="bg-zinc-900 border-zinc-800"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!newTitle.trim()}>
              Add Habit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
