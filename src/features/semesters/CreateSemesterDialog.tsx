"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ID } from "appwrite";

import { semesterSchema, SemesterSchemaType } from "@/validations/semester";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useAuthStore } from "@/store/useAuthStore";

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

interface CreateSemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSemesterDialog({ open, onOpenChange }: CreateSemesterDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addSemester } = useSemesterStore();
  const { appwriteUser } = useAuthStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<SemesterSchemaType>({ resolver: zodResolver(semesterSchema) as any, defaultValues: { name: "", startDate: "", endDate: "", isActive: true } });

  async function onSubmit(data: SemesterSchemaType) {
    if (!appwriteUser) return;
    try {
      setIsLoading(true);
      const newSemester: any = { $id: ID.unique(), userId: appwriteUser.$id, ...data };
      addSemester(newSemester);
      toast.success("Semester created successfully");
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to create semester");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Create New Semester</DialogTitle>
          <DialogDescription>Add a new semester to track your courses and tasks.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester Name</FormLabel>
                  <FormControl><Input placeholder="Fall 2026" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl><Input type="date" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl><Input type="date" disabled={isLoading} {...field} className="bg-zinc-900 border-zinc-800" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Semester"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
