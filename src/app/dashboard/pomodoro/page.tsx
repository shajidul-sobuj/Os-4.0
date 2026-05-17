"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ID } from "appwrite";
import { Play, Pause, RotateCcw, Timer, Coffee } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useStudyTopicStore } from "@/store/useStudyTopicStore";
import { useStudySessionStore } from "@/store/useStudySessionStore";
import { StudySession } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

type PomodoroMode = "focus" | "short-break" | "long-break";

const MODES: Record<PomodoroMode, { label: string; mins: number; color: string }> = {
  focus: { label: "Focus", mins: 25, color: "text-indigo-400" },
  "short-break": { label: "Short Break", mins: 5, color: "text-emerald-400" },
  "long-break": { label: "Long Break", mins: 15, color: "text-blue-400" },
};

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function PomodoroPage() {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [secsLeft, setSecsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sessionsToday, setSessionsToday] = useState(0);

  const { appwriteUser } = useAuthStore();
  const { activeSemesterId } = useSemesterStore();
  const { courses } = useCourseStore();
  const { topics } = useStudyTopicStore();
  const { addSession } = useStudySessionStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);

  const activeCourses = courses.filter((c) => c.semesterId === activeSemesterId);
  const topicsForCourse = topics.filter((t) => t.semesterId === activeSemesterId && t.courseId === selectedCourse && t.status !== "completed");

  const totalSecs = MODES[mode].mins * 60;
  const progress = ((totalSecs - secsLeft) / totalSecs) * 100;
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === "focus") {
      const duration = MODES.focus.mins;
      setSessionsToday((n) => n + 1);
      if (appwriteUser && activeSemesterId) {
        const session: StudySession = {
          $id: ID.unique(), $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString(),
          $collectionId: "", $databaseId: "", $permissions: [], $sequence: "0",
          userId: appwriteUser.$id, semesterId: activeSemesterId,
          courseId: selectedCourse || undefined,
          topicId: selectedTopic || undefined,
          duration, pomodoroType: "25/5",
          date: new Date().toISOString(),
        };
        addSession(session);
        toast.success(`🍅 Pomodoro complete! +5 XP · ${duration}m logged`);
      }
    } else {
      toast.success("Break over! Ready for another focus session?");
    }
  }, [mode, appwriteUser, activeSemesterId, selectedCourse, selectedTopic, addSession]);

  useEffect(() => {
    if (isRunning) {
      if (!startedAtRef.current) startedAtRef.current = new Date();
      timerRef.current = setInterval(() => {
        setSecsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, handleComplete]);

  function switchMode(m: PomodoroMode) {
    setMode(m);
    setIsRunning(false);
    setSecsLeft(MODES[m].mins * 60);
    startedAtRef.current = null;
  }

  function reset() {
    setIsRunning(false);
    setSecsLeft(MODES[mode].mins * 60);
    startedAtRef.current = null;
  }

  // Circular SVG progress
  const radius = 90;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Pomodoro Timer</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Stay focused. Sessions are auto-logged.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timer */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-8 flex flex-col items-center">
            {/* Mode selector */}
            <div className="flex gap-2 mb-8">
              {(Object.keys(MODES) as PomodoroMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === m ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Circle timer */}
            <div className="relative w-56 h-56 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r={radius} fill="none"
                  stroke={mode === "focus" ? "#6366f1" : mode === "short-break" ? "#4ade80" : "#60a5fa"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold font-mono text-zinc-100">{pad(mins)}:{pad(secs)}</span>
                <span className={`text-sm font-medium mt-1 ${MODES[mode].color}`}>{MODES[mode].label}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={reset} className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 h-12 w-12">
                <RotateCcw className="w-4 h-4 text-zinc-400" />
              </Button>
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className={`h-16 w-16 rounded-full text-lg ${isRunning ? "bg-zinc-700 hover:bg-zinc-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => switchMode("short-break")} className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 h-12 w-12">
                <Coffee className="w-4 h-4 text-emerald-400" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Stats */}
        <div className="space-y-4">
          {/* Session context */}
          <Card className="bg-zinc-900/50 border-zinc-800/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Session Context</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Course (optional)</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => { setSelectedCourse(e.target.value); setSelectedTopic(""); }}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                >
                  <option value="">No specific course</option>
                  {activeCourses.map((c) => <option key={c.$id} value={c.$id}>{c.code}</option>)}
                </select>
              </div>
              {selectedCourse && (
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Topic (optional)</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                  >
                    <option value="">No specific topic</option>
                    {topicsForCourse.map((t) => <option key={t.$id} value={t.$id}>{t.title}</option>)}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's stats */}
          <Card className="bg-zinc-900/50 border-zinc-800/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Today</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Sessions completed</span>
                <span className="text-lg font-bold text-indigo-400">{sessionsToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Focus time</span>
                <span className="text-sm font-semibold text-zinc-200">{formatDuration(sessionsToday * 25)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">XP earned</span>
                <span className="text-sm font-semibold text-amber-400">+{sessionsToday * 5} XP</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
