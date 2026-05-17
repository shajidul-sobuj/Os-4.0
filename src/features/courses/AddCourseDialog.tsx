"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ID } from "appwrite";

import { courseSchema, CourseSchemaType } from "@/validations/course";
import { useCourseStore } from "@/store/useCourseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function AddCourseDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addCourse } = useCourseStore();
  const { appwriteUser } = useAuthStore();
  const { activeSemesterId } = useSemesterStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema) as any,
    defaultValues: { code: "", title: "", credit: 3, color: "#6366f1", assignmentWeight: 20, quizWeight: 20, midWeight: 20, finalWeight: 40 },
  });

  async function onSubmit(data: CourseSchemaType) {
    if (!appwriteUser || !activeSemesterId) { toast.error("Please select a semester first."); return; }
    try {
      setIsLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newCourse: any = { $id: ID.unique(), userId: appwriteUser.$id, semesterId: activeSemesterId, ...data };
      addCourse(newCourse);
      toast.success("Course added successfully");
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to add course");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setOpen(true)}>Add Course</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>Add a course to your active semester. Weights must sum to 100%.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control as any} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Course Code</FormLabel><FormControl><Input placeholder="CSE 321" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control as any} name="credit" render={({ field }) => (
                  <FormItem><FormLabel>Credit</FormLabel><FormControl><Input type="number" step="0.5" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control as any} name="title" render={({ field }) => (
                <FormItem><FormLabel>Course Title</FormLabel><FormControl><Input placeholder="Software Engineering" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control as any} name="color" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input type="color" disabled={isLoading} {...field} className="w-12 h-10 p-1 bg-zinc-900 border-zinc-800 cursor-pointer" />
                      <Input type="text" disabled={isLoading} {...field} className="flex-1 bg-zinc-900 border-zinc-800" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="pt-2 border-t border-zinc-800">
                <h4 className="text-sm font-medium mb-3">Grading Weights (%)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <FormField control={form.control as any} name="assignmentWeight" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Assgn.</FormLabel><FormControl><Input type="number" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control as any} name="quizWeight" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Quiz</FormLabel><FormControl><Input type="number" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control as any} name="midWeight" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Mid</FormLabel><FormControl><Input type="number" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control as any} name="finalWeight" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Final</FormLabel><FormControl><Input type="number" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl></FormItem>
                  )} />
                </div>
                {form.formState.errors.finalWeight && (
                  <p className="mt-2 text-xs text-red-500">{form.formState.errors.finalWeight.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Course"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
