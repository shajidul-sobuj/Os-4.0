// Central Appwrite database service for all CRUD operations.
// Every feature uses this — never call databases.* directly from components.

import { ID, Query } from "appwrite";
import { databases, appwriteConfig } from "@/lib/appwrite";
import type {
  User, Semester, Course, Schedule, StudyTopic, Assignment,
  Exam, StudySession, Habit, CpLog, MistakeJournal,
} from "@/types";

const DB = appwriteConfig.databaseId;
const C = appwriteConfig; // short alias

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function listAll<T>(collectionId: string, queries: string[] = []): Promise<T[]> {
  const res = await databases.listDocuments(DB, collectionId, queries);
  return res.documents as unknown as T[];
}

async function createDoc<T>(collectionId: string, data: Record<string, unknown>): Promise<T> {
  const doc = await databases.createDocument(DB, collectionId, ID.unique(), data);
  return doc as unknown as T;
}

async function updateDoc<T>(collectionId: string, docId: string, data: Record<string, unknown>): Promise<T> {
  const doc = await databases.updateDocument(DB, collectionId, docId, data);
  return doc as unknown as T;
}

async function deleteDoc(collectionId: string, docId: string): Promise<void> {
  await databases.deleteDocument(DB, collectionId, docId);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const userService = {
  async getProfile(userId: string): Promise<User | null> {
    const docs = await listAll<User>(C.usersCollectionId, [Query.equal("userId", userId)]);
    return docs[0] ?? null;
  },
  async createProfile(data: Omit<User, keyof import("appwrite").Models.Document>): Promise<User> {
    return createDoc<User>(C.usersCollectionId, data as Record<string, unknown>);
  },
  async updateProfile(docId: string, data: Partial<User>): Promise<User> {
    return updateDoc<User>(C.usersCollectionId, docId, data as Record<string, unknown>);
  },
};

// ─── Semesters ────────────────────────────────────────────────────────────────

export const semesterService = {
  async list(userId: string): Promise<Semester[]> {
    return listAll<Semester>(C.semestersCollectionId, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
    ]);
  },
  async create(data: { userId: string; name: string; startDate: string; endDate: string; isActive: boolean }): Promise<Semester> {
    return createDoc<Semester>(C.semestersCollectionId, data);
  },
  async setActive(docId: string, isActive: boolean): Promise<Semester> {
    return updateDoc<Semester>(C.semestersCollectionId, docId, { isActive });
  },
  async update(docId: string, data: Partial<Semester>): Promise<Semester> {
    return updateDoc<Semester>(C.semestersCollectionId, docId, data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc(C.semestersCollectionId, docId);
  },
};

// ─── Courses ──────────────────────────────────────────────────────────────────

export const courseService = {
  async list(userId: string, semesterId: string): Promise<Course[]> {
    return listAll<Course>(C.coursesCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
    ]);
  },
  async create(data: Omit<Course, keyof import("appwrite").Models.Document>): Promise<Course> {
    return createDoc<Course>(C.coursesCollectionId, data as Record<string, unknown>);
  },
  async update(docId: string, data: Partial<Course>): Promise<Course> {
    return updateDoc<Course>(C.coursesCollectionId, docId, data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc(C.coursesCollectionId, docId);
  },
};

// ─── Schedules ────────────────────────────────────────────────────────────────

export const scheduleService = {
  async list(userId: string, semesterId: string): Promise<Schedule[]> {
    return listAll<Schedule>(C.schedulesCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
    ]);
  },
  async create(data: Omit<Schedule, keyof import("appwrite").Models.Document>): Promise<Schedule> {
    return createDoc<Schedule>(C.schedulesCollectionId, data as Record<string, unknown>);
  },
  async update(docId: string, data: Partial<Schedule>): Promise<Schedule> {
    return updateDoc<Schedule>(C.schedulesCollectionId, docId, data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc(C.schedulesCollectionId, docId);
  },
};

// ─── Study Topics ─────────────────────────────────────────────────────────────

export const studyTopicService = {
  async list(userId: string, semesterId: string): Promise<StudyTopic[]> {
    return listAll<StudyTopic>(C.studyTopicsCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
      Query.orderDesc("$createdAt"),
    ]);
  },
  async create(data: Omit<StudyTopic, keyof import("appwrite").Models.Document>): Promise<StudyTopic> {
    return createDoc<StudyTopic>(C.studyTopicsCollectionId, data as Record<string, unknown>);
  },
  async updateStatus(docId: string, status: StudyTopic["status"], completedAt?: string): Promise<StudyTopic> {
    return updateDoc<StudyTopic>(C.studyTopicsCollectionId, docId, { status, ...(completedAt ? { completedAt } : {}) });
  },
  async update(docId: string, data: Partial<StudyTopic>): Promise<StudyTopic> {
    return updateDoc<StudyTopic>(C.studyTopicsCollectionId, docId, data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc(C.studyTopicsCollectionId, docId);
  },
  /** Marks all past-deadline pending/in-progress topics as overdue */
  async syncOverdue(userId: string, semesterId: string): Promise<void> {
    const now = new Date().toISOString();
    const topics = await listAll<StudyTopic>(C.studyTopicsCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
      Query.notEqual("status", "completed"),
      Query.notEqual("status", "overdue"),
      Query.lessThan("deadline", now),
    ]);
    await Promise.all(topics.map((t) => studyTopicService.updateStatus(t.$id, "overdue")));
  },
};

// ─── Assignments ──────────────────────────────────────────────────────────────

export const assignmentService = {
  async list(userId: string, semesterId: string): Promise<Assignment[]> {
    return listAll<Assignment>(C.assignmentsCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
    ]);
  },
  async create(data: Omit<Assignment, keyof import("appwrite").Models.Document>): Promise<Assignment> {
    return createDoc<Assignment>(C.assignmentsCollectionId, data as Record<string, unknown>);
  },
  async update(docId: string, data: Partial<Assignment>): Promise<Assignment> {
    return updateDoc<Assignment>(C.assignmentsCollectionId, docId, data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc(C.assignmentsCollectionId, docId);
  },
};

// ─── Exams ────────────────────────────────────────────────────────────────────

export const examService = {
  async list(userId: string, semesterId: string): Promise<Exam[]> {
    return listAll<Exam>(C.examsCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
      Query.orderAsc("date"),
    ]);
  },
  async create(data: Omit<Exam, keyof import("appwrite").Models.Document>): Promise<Exam> {
    return createDoc<Exam>(C.examsCollectionId, data as Record<string, unknown>);
  },
  async update(docId: string, data: Partial<Exam>): Promise<Exam> {
    return updateDoc<Exam>(C.examsCollectionId, docId, data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc(C.examsCollectionId, docId);
  },
};

// ─── Study Sessions ───────────────────────────────────────────────────────────

export const studySessionService = {
  async list(userId: string, semesterId: string): Promise<StudySession[]> {
    return listAll<StudySession>(C.studySessionsCollectionId, [
      Query.equal("userId", userId),
      Query.equal("semesterId", semesterId),
      Query.orderDesc("date"),
    ]);
  },
  async create(data: Omit<StudySession, keyof import("appwrite").Models.Document>): Promise<StudySession> {
    return createDoc<StudySession>(C.studySessionsCollectionId, data as Record<string, unknown>);
  },
};

// ─── Habits ───────────────────────────────────────────────────────────────────

export const habitService = {
  async list(userId: string): Promise<Habit[]> {
    return listAll<Habit>("habits", [Query.equal("userId", userId)]);
  },
  async create(data: { userId: string; title: string }): Promise<Habit> {
    return createDoc<Habit>("habits", { ...data, streak: 0 });
  },
  async complete(docId: string, streak: number, lastCompleted: string): Promise<Habit> {
    return updateDoc<Habit>("habits", docId, { streak, lastCompleted });
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc("habits", docId);
  },
};

// ─── Mistake Journal ──────────────────────────────────────────────────────────

export const mistakeService = {
  async list(userId: string): Promise<MistakeJournal[]> {
    return listAll<MistakeJournal>("mistake_journal", [
      Query.equal("userId", userId),
      Query.orderDesc("date"),
    ]);
  },
  async create(data: Omit<MistakeJournal, keyof import("appwrite").Models.Document>): Promise<MistakeJournal> {
    return createDoc<MistakeJournal>("mistake_journal", data as Record<string, unknown>);
  },
  async delete(docId: string): Promise<void> {
    return deleteDoc("mistake_journal", docId);
  },
};
