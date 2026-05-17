import { Models } from "appwrite";

/** Minimal base fields for locally-created mock Appwrite documents (before they're persisted). */
export const mockDocBase = { $sequence: 0 } as const;

export interface User extends Models.Document {
  name: string;
  email: string;
  university?: string;
  department?: string;
  cfHandle?: string;
  timezone?: string;
  xp: number;
  level: number;
  currentSemesterId?: string;
}

export interface Semester extends Models.Document {
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  finalCgpa?: number;
}

export interface Course extends Models.Document {
  userId: string;
  semesterId: string;
  code: string;
  title: string;
  credit: number;
  color: string;
  assignmentWeight: number;
  quizWeight: number;
  midWeight: number;
  finalWeight: number;
}

export interface Schedule extends Models.Document {
  userId: string;
  semesterId: string;
  courseId: string;
  day: string; // e.g., 'Monday', 'Tuesday'
  startTime: string; // e.g., '10:00'
  endTime: string; // e.g., '11:30'
  room?: string;
}

export type TopicStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type TopicPriority = 'low' | 'medium' | 'high';

export interface StudyTopic extends Models.Document {
  userId: string;
  semesterId: string;
  courseId: string;
  title: string;
  priority: TopicPriority;
  status: TopicStatus;
  estimatedHours: number;
  createdAt: string;
  deadline: string;
  completedAt?: string;
}

export interface Assignment extends Models.Document {
  userId: string;
  semesterId: string;
  courseId: string;
  title: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded';
  marks?: number;
  submissionLink?: string;
}

export interface Exam extends Models.Document {
  userId: string;
  semesterId: string;
  courseId: string;
  type: 'quiz' | 'midterm' | 'final' | 'other';
  name: string;
  date: string;
  maxMarks: number;
  obtainedMarks?: number;
  weight: number;
  status: 'upcoming' | 'completed' | 'graded';
}

export interface StudySession extends Models.Document {
  userId: string;
  semesterId: string;
  courseId?: string;
  topicId?: string;
  duration: number; // in minutes
  pomodoroType: string;
  date: string;
}

export interface Habit extends Models.Document {
  userId: string;
  title: string;
  streak: number;
  lastCompleted?: string;
}

export interface CpLog extends Models.Document {
  userId: string;
  platform: string;
  topic: string;
  difficulty: string;
  solvedAt: string;
}

export interface CfSubmission extends Models.Document {
  userId: string;
  problemId: string;
  verdict: string;
  submittedAt: string;
}

export interface CfContest extends Models.Document {
  contestId: string;
  name: string;
  startTime: string;
  duration: number;
}

export interface MistakeJournal extends Models.Document {
  userId: string;
  title: string;
  category: string;
  description: string;
  date: string;
}
