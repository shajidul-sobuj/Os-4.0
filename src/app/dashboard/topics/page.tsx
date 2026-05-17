"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ID } from "appwrite";
import * as z from "zod";
import { Plus, CheckCircle2, Trash2, Clock, BookOpen, Timer, AlertTriangle, CheckSquare } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useStudyTopicStore } from "@/store/useStudyTopicStore";
import { StudyTopic, Course } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { countdown } from "@/lib/utils";

const topicSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  title: z.string().min(2, "Title is required"),
  priority: z.enum(["low", "medium", "high"]),
  estimatedHours: z.coerce.number().min(0.5, "At least 0.5 hours"),
});
type TopicFormData = z.infer<typeof topicSchema>;

const FILTERS = ["all", "pending", "in-progress", "completed", "overdue"] as const;
type Filter = (typeof FILTERS)[number];



function TopicCard({ topic, courses, onComplete, onDelete }: {
  topic: StudyTopic;
  courses: Course[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const course = courses.find((c) => c.$id === topic.courseId);
  const isOverdue = topic.status === "overdue";
  const isDone = topic.status === "completed";
  const dueStr = countdown(topic.deadline);

  return (
    <Card className={`border transition-colors ${isOverdue ? "bg-rose-950/20 border-rose-500/20" : isDone ? "bg-emerald-950/10 border-emerald-500/15 opacity-70" : "bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700/60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {course && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
                  {course.code}
                </span>
              )}
              <PriorityBadge priority={topic.priority} />
              <StatusBadge status={topic.status} />
            </div>
            <p className={`text-sm font-medium ${isDone ? "line-through text-zinc-500" : "text-zinc-100"}`}>{topic.title}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{topic.estimatedHours}h
              </span>
              {!isDone && (
                <span className={`flex items-center gap-1 ${isOverdue ? "text-rose-400 font-medium" : ""}`}>
                  <Timer className="w-3 h-3" />{dueStr}
                </span>
              )}
              {isDone && topic.completedAt && (
                <span>Completed {format(new Date(topic.completedAt), "MMM d")}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isDone && (
              <button
                onClick={() => onComplete(topic.$id)}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 transition-colors"
                title="Mark complete"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(topic.$id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TopicsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { appwriteUser } = useAuthStore();
  const { activeSemesterId } = useSemesterStore();
  const { courses } = useCourseStore();
  const { topics, addTopic, updateTopicStatus, deleteTopic, isLoading: topicsLoading } = useStudyTopicStore();

  const activeCourses = courses.filter((c) => c.semesterId === activeSemesterId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<TopicFormData>({ resolver: zodResolver(topicSchema) as any, defaultValues: { courseId: "", title: "", priority: "medium", estimatedHours: 2 } });

  const filteredTopics = topics
    .filter((t) => t.semesterId === activeSemesterId)
    .filter((t) => filter === "all" || t.status === filter.replace(" ", "-"));

  const counts = {
    all: topics.filter((t) => t.semesterId === activeSemesterId).length,
    pending: topics.filter((t) => t.semesterId === activeSemesterId && t.status === "pending").length,
    "in-progress": topics.filter((t) => t.semesterId === activeSemesterId && t.status === "in-progress").length,
    completed: topics.filter((t) => t.semesterId === activeSemesterId && t.status === "completed").length,
    overdue: topics.filter((t) => t.semesterId === activeSemesterId && t.status === "overdue").length,
  };

  async function onSubmit(data: TopicFormData) {
    if (!appwriteUser || !activeSemesterId) { toast.error("Select a semester first"); return; }
    try {
      setIsLoading(true);
      const now = new Date();
      const deadline = addDays(now, 2);
      deadline.setHours(23, 59, 59, 999);
      // In production: await studyTopicService.create({...})
      const newTopic: StudyTopic = {
        $id: ID.unique(), $createdAt: now.toISOString(), $updatedAt: now.toISOString(),
        $collectionId: "", $databaseId: "", $permissions: [], $sequence: "0",
        userId: appwriteUser.$id, semesterId: activeSemesterId,
        ...data,
        status: "pending",
        createdAt: now.toISOString(),
        deadline: deadline.toISOString(),
      };
      addTopic(newTopic);
      toast.success("Topic added! Deadline: 2 days from now.");
      setIsOpen(false);
      form.reset();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add topic");
    } finally {
      setIsLoading(false);
    }
  }

  function handleComplete(id: string) {
    updateTopicStatus(id, "completed");
    toast.success("Topic marked as complete! +10 XP");
  }

  function handleDelete(id: string) {
    deleteTopic(id);
    toast.success("Topic deleted");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Study Topics</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Topics auto-expire in 2 days from creation.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />Add Topic
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800/60 w-fit flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-[10px] opacity-70">({counts[f as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      {/* Topic list */}
      {topicsLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse" />
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <EmptyState
          icon={filter === "overdue" ? AlertTriangle : CheckSquare}
          title={filter === "overdue" ? "No overdue topics" : "No topics found"}
          description={filter === "all" ? "Add a topic to get started." : `No topics in '${filter}' status.`}
          action={filter === "all" ? <Button onClick={() => setIsOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-3.5 w-3.5" />Add First Topic</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredTopics.map((t) => (
            <TopicCard key={t.$id} topic={t} courses={courses} onComplete={handleComplete} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add Topic Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Study Topic</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-2">
              <FormField control={form.control as any} name="courseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select course...</option>
                      {activeCourses.map((c) => (
                        <option key={c.$id} value={c.$id}>{c.code} — {c.title}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Review Chapter 5 — Sorting Algorithms" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control as any} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="estimatedHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl><Input type="number" step="0.5" min="0.5" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <p className="text-xs text-zinc-500 bg-zinc-900 rounded-lg px-3 py-2">
                📅 Deadline: <strong className="text-zinc-300">{format(addDays(new Date(), 2), "EEEE, MMM d")} at 11:59 PM</strong>
              </p>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Topic"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
