"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ID } from "appwrite";
import * as z from "zod";
import { Plus, Trash2, CalendarDays } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { Schedule } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const scheduleSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  day: z.string().min(1, "Select a day"),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  room: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function RoutinePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { appwriteUser } = useAuthStore();
  const { activeSemesterId } = useSemesterStore();
  const { courses } = useCourseStore();
  const { schedules, addSchedule, deleteSchedule } = useScheduleStore();

  const activeCourses = courses.filter((c) => c.semesterId === activeSemesterId);
  const activeSchedules = schedules.filter((s) => s.semesterId === activeSemesterId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema) as any, defaultValues: { courseId: "", day: "Sunday", startTime: "09:00", endTime: "10:30", room: "" } });

  const getDaySchedules = (day: string) =>
    activeSchedules
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  async function onSubmit(data: ScheduleFormData) {
    if (!appwriteUser || !activeSemesterId) { toast.error("Select a semester first"); return; }
    try {
      setIsLoading(true);
      const newSchedule: Schedule = {
        $id: ID.unique(), $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString(),
        $collectionId: "", $databaseId: "", $permissions: [], $sequence: "0",
        userId: appwriteUser.$id, semesterId: activeSemesterId, ...data,
      };
      addSchedule(newSchedule);
      toast.success("Class added to routine");
      setIsOpen(false);
      form.reset();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add class");
    } finally {
      setIsLoading(false);
    }
  }

  const today = DAYS[new Date().getDay()];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Weekly Routine</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Your class schedule for the semester.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />Add Class
        </Button>
      </div>

      {activeSchedules.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No classes scheduled" description="Add your class routine for the semester." action={
          <Button onClick={() => setIsOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-3.5 w-3.5" />Add First Class</Button>
        } />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day) => {
            const dayClasses = getDaySchedules(day);
            const isToday = day === today;
            return (
              <div key={day}>
                <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isToday ? "border-indigo-500/40" : "border-zinc-800/60"}`}>
                  <h3 className={`text-sm font-semibold ${isToday ? "text-indigo-400" : "text-zinc-400"}`}>{day}</h3>
                  {isToday && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">Today</span>}
                </div>
                {dayClasses.length === 0 ? (
                  <p className="text-xs text-zinc-700 py-2">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map((cls) => {
                      const course = courses.find((c) => c.$id === cls.courseId);
                      return (
                        <Card key={cls.$id} className="bg-zinc-900/50 border-zinc-800/60 group">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: course?.color ?? "#6366f1" }} />
                                  <span className="text-xs font-medium text-zinc-200 truncate">{course?.code ?? "—"}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate">{course?.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{cls.startTime}–{cls.endTime}</p>
                                {cls.room && <p className="text-[10px] text-zinc-600">Room {cls.room}</p>}
                              </div>
                              <button
                                onClick={() => { deleteSchedule(cls.$id); toast.success("Class removed"); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-zinc-600 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader><DialogTitle>Add Class to Routine</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-2">
              <FormField control={form.control as any} name="courseId" render={({ field }) => (
                <FormItem><FormLabel>Course</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                      <option value="">Select course...</option>
                      {activeCourses.map((c) => <option key={c.$id} value={c.$id}>{c.code} — {c.title}</option>)}
                    </select>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="day" render={({ field }) => (
                <FormItem><FormLabel>Day</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control as any} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start Time</FormLabel>
                    <FormControl><Input type="time" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End Time</FormLabel>
                    <FormControl><Input type="time" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control as any} name="room" render={({ field }) => (
                <FormItem><FormLabel>Room (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., Lab 204" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Class"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
