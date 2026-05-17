"use client";

import { useCourseStore } from "@/store/useCourseStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCourseDialog } from "@/features/courses/AddCourseDialog";
import { BookOpen, Settings } from "lucide-react";

export default function CoursesPage() {
  const { courses } = useCourseStore();
  const { activeSemesterId } = useSemesterStore();

  const activeCourses = courses.filter(c => c.semesterId === activeSemesterId);

  if (!activeSemesterId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-zinc-500">
        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-medium text-zinc-400 mb-2">No Semester Selected</h2>
        <p>Please select or create a semester to manage courses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
          <p className="text-zinc-400">Manage your courses for the current semester.</p>
        </div>
        <AddCourseDialog />
      </div>

      {activeCourses.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <BookOpen className="w-12 h-12 mb-4 opacity-20" />
            <p>You haven't added any courses yet.</p>
            <p className="text-sm mt-1">Click "Add Course" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeCourses.map((course) => (
            <Card key={course.$id} className="bg-zinc-900/50 border-zinc-800 flex flex-col overflow-hidden group">
              <div 
                className="h-2 w-full transition-all group-hover:h-3" 
                style={{ backgroundColor: course.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-zinc-400" style={{ color: course.color }}>{course.code}</p>
                    <CardTitle className="text-lg mt-1">{course.title}</CardTitle>
                  </div>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-2 flex-1">
                <div className="flex items-center text-sm text-zinc-400 mt-2">
                  <span className="font-medium mr-2">{course.credit} Credits</span>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                  <div className="text-center">
                    <div className="font-medium text-zinc-300">{course.assignmentWeight}%</div>
                    <div>Assgn</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-zinc-300">{course.quizWeight}%</div>
                    <div>Quiz</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-zinc-300">{course.midWeight}%</div>
                    <div>Mid</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-zinc-300">{course.finalWeight}%</div>
                    <div>Final</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
