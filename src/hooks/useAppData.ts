"use client";

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useStudyTopicStore } from "@/store/useStudyTopicStore";
import { useExamStore } from "@/store/useExamStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useStudySessionStore } from "@/store/useStudySessionStore";
import { isAppwriteConfigured } from "@/lib/appwrite";
import {
  semesterService,
  courseService,
  studyTopicService,
  examService,
  scheduleService,
  studySessionService,
} from "@/services/database";


export function useAppData() {
  const { appwriteUser } = useAuthStore();
  const { setSemesters, activeSemesterId, setLoading: setSemLoading } = useSemesterStore();
  const { setCourses, setLoading: setCourseLoading } = useCourseStore();
  const { setTopics, setLoading: setTopicLoading } = useStudyTopicStore();
  const { setExams, setLoading: setExamLoading } = useExamStore();
  const { setSchedules, setLoading: setSchedLoading } = useScheduleStore();
  const { setSessions } = useStudySessionStore();

  const loadSemesters = useCallback(async () => {
    // Skip if Appwrite env vars aren't configured yet
    if (!appwriteUser || !isAppwriteConfigured) return;
    try {
      setSemLoading(true);
      const semesters = await semesterService.list(appwriteUser.$id);
      setSemesters(semesters);
    } catch (e) {
      console.error("Failed to load semesters", e);
    } finally {
      setSemLoading(false);
    }
  }, [appwriteUser, setSemesters, setSemLoading]);

  const loadSemesterData = useCallback(async () => {
    // Skip if Appwrite env vars aren't configured yet
    if (!appwriteUser || !activeSemesterId || !isAppwriteConfigured) return;
    const uid = appwriteUser.$id;
    const sid = activeSemesterId;

    try {
      setCourseLoading(true);
      setTopicLoading(true);
      setExamLoading(true);
      setSchedLoading(true);

      const [courses, topics, exams, schedules, sessions] = await Promise.all([
        courseService.list(uid, sid),
        studyTopicService.list(uid, sid),
        examService.list(uid, sid),
        scheduleService.list(uid, sid),
        studySessionService.list(uid, sid),
      ]);

      // Sync overdue topics (client-side check)
      const now = new Date();
      const syncedTopics = topics.map((t) => {
        if (
          t.status !== "completed" &&
          t.status !== "overdue" &&
          new Date(t.deadline) < now
        ) {
          return { ...t, status: "overdue" as const };
        }
        return t;
      });

      setCourses(courses);
      setTopics(syncedTopics);
      setExams(exams);
      setSchedules(schedules);
      setSessions(sessions);
    } catch (e) {
      console.error("Failed to load semester data", e);
    } finally {
      setCourseLoading(false);
      setTopicLoading(false);
      setExamLoading(false);
      setSchedLoading(false);
    }
  }, [
    appwriteUser, activeSemesterId,
    setCourses, setCourseLoading,
    setTopics, setTopicLoading,
    setExams, setExamLoading,
    setSchedules, setSchedLoading,
    setSessions,
  ]);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    loadSemesterData();
  }, [loadSemesterData]);

  return { loadSemesters, loadSemesterData };
}
