import { Course } from "@/types";

export function calculateGradePoint(percentage: number): number {
  if (percentage >= 80) return 4.0;
  if (percentage >= 75) return 3.75;
  if (percentage >= 70) return 3.5;
  if (percentage >= 65) return 3.25;
  if (percentage >= 60) return 3.0;
  if (percentage >= 55) return 2.75;
  if (percentage >= 50) return 2.5;
  if (percentage >= 45) return 2.25;
  if (percentage >= 40) return 2.0;
  return 0.0;
}

export function calculateCoursePercentage(
  obtainedMarks: {
    assignment: number;
    quiz: number;
    mid: number;
    final: number;
  },
  weights: {
    assignment: number;
    quiz: number;
    mid: number;
    final: number;
  }
): number {
  // Assuming obtained marks are given as percentages for that component
  // E.g., if you got 80% on assignments, and assignment weight is 20%, you get 16% total.
  // Wait, the prompt says: sum((obtained/max) * weight)
  // Let's assume the passed in values are already (obtained/max) * 100
  
  const assignmentTotal = (obtainedMarks.assignment / 100) * weights.assignment;
  const quizTotal = (obtainedMarks.quiz / 100) * weights.quiz;
  const midTotal = (obtainedMarks.mid / 100) * weights.mid;
  const finalTotal = (obtainedMarks.final / 100) * weights.final;

  return assignmentTotal + quizTotal + midTotal + finalTotal;
}

export function calculateCgpa(
  courses: Course[],
  courseGrades: Record<string, number> // map of courseId to gradePoint
): number {
  let totalCredits = 0;
  let totalPoints = 0;

  courses.forEach(course => {
    const gradePoint = courseGrades[course.$id] || 0;
    if (gradePoint > 0) {
      totalCredits += course.credit;
      totalPoints += (gradePoint * course.credit);
    }
  });

  if (totalCredits === 0) return 0;
  
  return Number((totalPoints / totalCredits).toFixed(2));
}
