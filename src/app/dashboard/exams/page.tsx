"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, isFuture } from "date-fns";
import { ID } from "appwrite";
import * as z from "zod";
import { Plus, Trash2, BookMarked, TrendingUp, Calculator } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useExamStore } from "@/store/useExamStore";
import { Exam } from "@/types";
import { calculateCgpa, calculateGradePoint } from "@/lib/calculations/calculateCgpa";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const examSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  type: z.enum(["quiz", "midterm", "final", "other"]),
  name: z.string().min(2),
  date: z.string().min(1),
  maxMarks: z.coerce.number().min(1),
  obtainedMarks: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).max(100),
});
type ExamFormData = z.infer<typeof examSchema>;

export default function ExamsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [whatIfMarks, setWhatIfMarks] = useState<Record<string, number>>({});

  const { appwriteUser } = useAuthStore();
  const { activeSemesterId } = useSemesterStore();
  const { courses } = useCourseStore();
  const { exams, addExam, deleteExam, isLoading: examsLoading } = useExamStore();

  const activeCourses = courses.filter((c) => c.semesterId === activeSemesterId);
  const activeExams = exams.filter((e) => e.semesterId === activeSemesterId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ExamFormData>({ resolver: zodResolver(examSchema) as any, defaultValues: { courseId: "", type: "quiz", name: "", date: "", maxMarks: 100, weight: 10 } });

  // Group exams by course
  const examsByCourse = useMemo(() => {
    const map: Record<string, Exam[]> = {};
    activeExams.forEach((e) => {
      if (!map[e.courseId]) map[e.courseId] = [];
      map[e.courseId].push(e);
    });
    return map;
  }, [activeExams]);

  // Real CGPA based on graded exams
  const cgpaData = useMemo(() => {
    const courseGrades: Record<string, number> = {};
    activeCourses.forEach((course) => {
      const cExams = activeExams.filter((e) => e.courseId === course.$id && e.obtainedMarks != null);
      if (cExams.length === 0) return;
      const pct = cExams.reduce((acc, e) => acc + (e.obtainedMarks! / e.maxMarks) * e.weight, 0);
      courseGrades[course.$id] = calculateGradePoint(pct);
    });
    const graded = activeCourses.filter((c) => courseGrades[c.$id] != null);
    return { cgpa: calculateCgpa(graded, courseGrades), courseGrades };
  }, [activeCourses, activeExams]);

  // What-if CGPA
  const whatIfCgpa = useMemo(() => {
    const courseGrades: Record<string, number> = {};
    activeCourses.forEach((course) => {
      const cExams = activeExams.filter((e) => e.courseId === course.$id);
      if (cExams.length === 0) return;
      const pct = cExams.reduce((acc, e) => {
        const obtained = whatIfMarks[e.$id] ?? e.obtainedMarks ?? 0;
        return acc + (obtained / e.maxMarks) * e.weight;
      }, 0);
      courseGrades[course.$id] = calculateGradePoint(pct);
    });
    const covered = activeCourses.filter((c) => courseGrades[c.$id] != null);
    return calculateCgpa(covered, courseGrades);
  }, [activeCourses, activeExams, whatIfMarks]);

  async function onSubmit(data: ExamFormData) {
    if (!appwriteUser || !activeSemesterId) { toast.error("Select a semester first"); return; }
    try {
      setIsLoading(true);
      const newExam: Exam = {
        $id: ID.unique(), $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString(),
        $collectionId: "", $databaseId: "", $permissions: [], $sequence: "0",
        userId: appwriteUser.$id, semesterId: activeSemesterId,
        status: isFuture(new Date(data.date)) ? "upcoming" : "completed",
        ...data,
        obtainedMarks: data.obtainedMarks,
      };
      addExam(newExam);
      toast.success("Exam added successfully");
      setIsOpen(false);
      form.reset();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add exam");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Exams & CGPA</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Track exam results and calculate your GPA.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />Add Exam
        </Button>
      </div>

      {/* CGPA Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-950/60 to-zinc-900/60 border-indigo-500/20 md:col-span-1">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400 mb-1">Current CGPA</p>
            <p className="text-5xl font-bold text-indigo-400">{cgpaData.cgpa > 0 ? cgpaData.cgpa.toFixed(2) : "—"}</p>
            <p className="text-xs text-zinc-500 mt-2">Based on graded exams</p>
          </CardContent>
        </Card>

        {/* What-If Simulator */}
        <Card className="bg-zinc-900/50 border-zinc-800/60 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />What-If CGPA Simulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500 mb-4">Enter hypothetical marks to see predicted CGPA.</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeExams.map((exam) => {
                const course = courses.find((c) => c.$id === exam.courseId);
                return (
                  <div key={exam.$id} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 truncate flex-1">{course?.code} · {exam.name}</span>
                    <span className="text-xs text-zinc-600">/ {exam.maxMarks}</span>
                    <Input
                      type="number"
                      min={0}
                      max={exam.maxMarks}
                      placeholder={String(exam.obtainedMarks ?? "")}
                      value={whatIfMarks[exam.$id] ?? ""}
                      onChange={(e) => setWhatIfMarks((prev) => ({ ...prev, [exam.$id]: Number(e.target.value) }))}
                      className="w-20 h-7 text-xs bg-zinc-800 border-zinc-700"
                    />
                  </div>
                );
              })}
              {activeExams.length === 0 && <p className="text-xs text-zinc-600">Add exams to use the simulator.</p>}
            </div>
            {activeExams.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Predicted CGPA</span>
                <span className="text-2xl font-bold text-amber-400">{whatIfCgpa > 0 ? whatIfCgpa.toFixed(2) : "—"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exams by course */}
      {examsLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse" />)}
        </div>
      ) : activeCourses.length === 0 ? (
        <EmptyState icon={BookMarked} title="No courses yet" description="Add courses first, then track your exams." />
      ) : (
        <div className="space-y-4">
          {activeCourses.map((course) => {
            const cExams = examsByCourse[course.$id] ?? [];
            const gp = cgpaData.courseGrades[course.$id];
            return (
              <Card key={course.$id} className="bg-zinc-900/50 border-zinc-800/60">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                    <CardTitle className="text-sm font-semibold text-zinc-200">{course.code} — {course.title}</CardTitle>
                    <span className="text-xs text-zinc-500">{course.credit} cr</span>
                  </div>
                  {gp != null && (
                    <span className="text-sm font-bold" style={{ color: gp >= 3.5 ? "#4ade80" : gp >= 3 ? "#facc15" : "#f87171" }}>
                      GP: {gp.toFixed(2)}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  {cExams.length === 0 ? (
                    <p className="text-xs text-zinc-600 py-2">No exams added for this course.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800">
                            <th className="text-left py-1.5 pr-4">Name</th>
                            <th className="text-left py-1.5 pr-4">Type</th>
                            <th className="text-left py-1.5 pr-4">Date</th>
                            <th className="text-right py-1.5 pr-4">Marks</th>
                            <th className="text-right py-1.5 pr-4">Weight</th>
                            <th className="text-left py-1.5 pr-4">Status</th>
                            <th className="py-1.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {cExams.map((exam) => (
                            <tr key={exam.$id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                              <td className="py-2 pr-4 text-zinc-200 font-medium">{exam.name}</td>
                              <td className="py-2 pr-4 text-zinc-400 capitalize">{exam.type}</td>
                              <td className="py-2 pr-4 text-zinc-400">{format(new Date(exam.date), "MMM d, yyyy")}</td>
                              <td className="py-2 pr-4 text-right text-zinc-200">
                                {exam.obtainedMarks != null ? `${exam.obtainedMarks}/${exam.maxMarks}` : `—/${exam.maxMarks}`}
                              </td>
                              <td className="py-2 pr-4 text-right text-zinc-400">{exam.weight}%</td>
                              <td className="py-2 pr-4"><StatusBadge status={exam.status} /></td>
                              <td className="py-2">
                                <button onClick={() => { deleteExam(exam.$id); toast.success("Exam removed"); }} className="p-1 hover:text-rose-400 text-zinc-600 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Exam Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader><DialogTitle>Add Exam</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-2">
              <FormField control={form.control as any} name="courseId" render={({ field }) => (
                <FormItem><FormLabel>Course</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select course...</option>
                      {activeCourses.map((c) => <option key={c.$id} value={c.$id}>{c.code} — {c.title}</option>)}
                    </select>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control as any} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none">
                        <option value="quiz">Quiz</option>
                        <option value="midterm">Midterm</option>
                        <option value="final">Final</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Quiz 1" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control as any} name="date" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control as any} name="maxMarks" render={({ field }) => (
                  <FormItem><FormLabel>Max Marks</FormLabel>
                    <FormControl><Input type="number" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="obtainedMarks" render={({ field }) => (
                  <FormItem><FormLabel>Obtained</FormLabel>
                    <FormControl><Input type="number" placeholder="Optional" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="weight" render={({ field }) => (
                  <FormItem><FormLabel>Weight %</FormLabel>
                    <FormControl><Input type="number" {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Exam"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
