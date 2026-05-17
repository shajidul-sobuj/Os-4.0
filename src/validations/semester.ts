import * as z from "zod";

export const semesterSchema = z.object({
  name: z.string().min(2, { message: "Semester name is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  isActive: z.boolean().default(false),
});

export type SemesterSchemaType = z.infer<typeof semesterSchema>;
