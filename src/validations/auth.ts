import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const onboardingSchema = z.object({
  university: z.string().min(2, { message: "University name is required" }),
  department: z.string().min(2, { message: "Department is required" }),
  cfHandle: z.string().optional(),
  timezone: z.string(),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;
export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type OnboardingSchemaType = z.infer<typeof onboardingSchema>;
