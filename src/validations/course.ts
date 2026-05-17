import * as z from "zod";

export const courseSchema = z.object({
  code: z.string().min(2, { message: "Course code is required" }),
  title: z.string().min(2, { message: "Course title is required" }),
  credit: z.coerce.number().min(0, { message: "Credit must be positive" }),
  color: z.string().min(4, { message: "Color code is required" }),
  assignmentWeight: z.coerce.number().min(0).max(100),
  quizWeight: z.coerce.number().min(0).max(100),
  midWeight: z.coerce.number().min(0).max(100),
  finalWeight: z.coerce.number().min(0).max(100),
}).refine(data => {
  const sum = data.assignmentWeight + data.quizWeight + data.midWeight + data.finalWeight;
  return sum === 100;
}, {
  message: "Weights must sum exactly to 100",
  path: ["finalWeight"],
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
