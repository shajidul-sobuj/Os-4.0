"use client";

import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isToday, isFuture } from "date-fns";
import {
  Flame, BookOpen, CalendarDays, CheckSquare, Clock,
  TrendingUp, AlertTriangle, GraduationCap, Trophy, Zap,
} from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useStudyTopicStore } from "@/store/useStudyTopicStore";
import { useExamStore } from "@/store/useExamStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useStudySessionStore } from "@/store/useStudySessionStore";
import { calculateCgpa, calculateGradePoint } from "@/lib/calculations/calculateCgpa";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCardSkeleton, TopicCardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Countdown helper ──────────────────────────────────────────────────────────
function countdown(dateStr: string): string {
  const target = new Date(dateStr);
  const now = new Date();
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const mins = differenceInMinutes(target, now) % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return "Past due";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, iconColor = "text-indigo-400", iconBg = "bg-indigo-500/10",
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  iconColor?: string; iconBg?: string;
}) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-zinc-400 font-medium">{label}</span>
          <div className={`${iconBg} rounded-lg p-2`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        </div>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, href, count }: { title: string; href: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">{title}
        {count != null && <span className="ml-2 text-xs text-zinc-500 normal-case">({count})</span>}
      </h2>
      <Link href={href} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { appwriteUser } = useAuthStore();
  const { semesters, activeSemesterId } = useSemesterStore();
  const { courses, isLoading: coursesLoading } = useCourseStore();
  const { topics, isLoading: topicsLoading } = useStudyTopicStore();
  const { exams, isLoading: examsLoading } = useExamStore();
  const { schedules } = useScheduleStore();
  const { sessions } = useStudySessionStore();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeSemester = semesters.find((s) => s.$id === activeSemesterId);
  const todayDay = DAYS[now.getDay()];

  // Semester progress
  const semesterProgress = useMemo(() => {
    if (!activeSemester) return 0;
    const start = new Date(activeSemester.startDate).getTime();
    const end = new Date(activeSemester.endDate).getTime();
    const current = now.getTime();
    return Math.max(0, Math.min(100, Math.round(((current - start) / (end - start)) * 100)));
  }, [activeSemester, now]);

  // Today's classes
  const todaysClasses = useMemo(() =>
    schedules
      .filter((s) => s.semesterId === activeSemesterId && s.day === todayDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, activeSemesterId, todayDay]
  );

  // Active topics
  const pendingTopics = useMemo(() =>
    topics.filter((t) => t.semesterId === activeSemesterId && t.status === "pending")
      .slice(0, 3),
    [topics, activeSemesterId]
  );
  const overdueTopics = useMemo(() =>
    topics.filter((t) => t.semesterId === activeSemesterId && t.status === "overdue")
      .slice(0, 3),
    [topics, activeSemesterId]
  );

  // Upcoming exams (next 14 days)
  const upcomingExams = useMemo(() =>
    exams
      .filter((e) => e.semesterId === activeSemesterId && e.status === "upcoming" && isFuture(new Date(e.date)))
      .slice(0, 4),
    [exams, activeSemesterId]
  );

  // Study time today
  const todayStudyMins = useMemo(() =>
    sessions
      .filter((s) => s.semesterId === activeSemesterId && isToday(new Date(s.date)))
      .reduce((acc, s) => acc + s.duration, 0),
    [sessions, activeSemesterId]
  );

  // Streak (simplified — days with at least one session)
  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => new Date(s.date).toDateString()));
    // Count consecutive days from today backwards
    let count = 0;
    let d = new Date();
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [sessions]);

  // CGPA (simple: all completed exams in active semester)
  const cgpa = useMemo(() => {
    const gradedExams = exams.filter((e) => e.semesterId === activeSemesterId && e.obtainedMarks != null);
    if (gradedExams.length === 0) return null;
    const courseGrades: Record<string, number> = {};
    courses.forEach((course) => {
      const courseExams = gradedExams.filter((e) => e.courseId === course.$id);
      if (courseExams.length === 0) return;
      const weightedScore = courseExams.reduce((acc, e) => {
        if (e.obtainedMarks == null) return acc;
        return acc + (e.obtainedMarks / e.maxMarks) * e.weight;
      }, 0);
      courseGrades[course.$id] = calculateGradePoint(weightedScore);
    });
    const activeCourses = courses.filter((c) => c.semesterId === activeSemesterId && courseGrades[c.$id] != null);
    return calculateCgpa(activeCourses, courseGrades);
  }, [exams, courses, activeSemesterId]);

  const isLoading = coursesLoading || topicsLoading || examsLoading;

  return (
    <div className="space-y-7">
      {/* Date & Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {appwriteUser?.name ? `Hey, ${appwriteUser.name.split(" ")[0]}! 👋` : "Dashboard"}
        </h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {format(now, "EEEE, MMMM d, yyyy")}
          {activeSemester && (
            <span className="ml-2 text-zinc-600">
              · {activeSemester.name} · {semesterProgress}% complete
            </span>
          )}
        </p>
      </div>

      {/* Stats row */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Flame} label="Study Streak" value={`${streak} days`}
            sub={streak === 0 ? "Start studying to build streak" : "Keep it up!"}
            iconColor="text-orange-400" iconBg="bg-orange-500/10" />
          <StatCard icon={GraduationCap} label="Current CGPA"
            value={cgpa != null ? cgpa.toFixed(2) : "N/A"}
            sub={cgpa != null ? "Based on graded exams" : "No graded exams yet"}
            iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
          <StatCard icon={AlertTriangle} label="Overdue Topics"
            value={overdueTopics.length + topics.filter(t => t.semesterId === activeSemesterId && t.status === "overdue").length}
            sub={overdueTopics.length > 0 ? "Action needed!" : "All clear"}
            iconColor="text-rose-400" iconBg="bg-rose-500/10" />
          <StatCard icon={Clock} label="Study Today"
            value={`${Math.floor(todayStudyMins / 60)}h ${todayStudyMins % 60}m`}
            sub="Via Pomodoro sessions"
            iconColor="text-blue-400" iconBg="bg-blue-500/10" />
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Classes */}
          <div>
            <SectionHeader title={`${todayDay}'s Classes`} href="/dashboard/routine" count={todaysClasses.length} />
            {todaysClasses.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No classes today" description="Enjoy your free day or catch up on study topics." />
            ) : (
              <div className="space-y-2">
                {todaysClasses.map((cls) => {
                  const course = courses.find((c) => c.$id === cls.courseId);
                  return (
                    <Card key={cls.$id} className="bg-zinc-900/50 border-zinc-800/60">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: course?.color ?? "#6366f1" }} />
                          <div>
                            <p className="text-sm font-medium text-zinc-100">{course?.code ?? "—"} · {course?.title ?? "Unknown"}</p>
                            <p className="text-xs text-zinc-500">{cls.room && `Room ${cls.room} · `}{cls.startTime} – {cls.endTime}</p>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500">{cls.startTime}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Topics */}
          {overdueTopics.length > 0 && (
            <div>
              <SectionHeader title="Overdue Topics 🚨" href="/dashboard/topics" count={topics.filter(t => t.semesterId === activeSemesterId && t.status === "overdue").length} />
              <div className="space-y-2">
                {overdueTopics.map((topic) => {
                  const course = courses.find((c) => c.$id === topic.courseId);
                  return (
                    <Card key={topic.$id} className="bg-rose-950/20 border-rose-500/20">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{topic.title}</p>
                          <p className="text-xs text-zinc-500">{course?.code} · Deadline: {format(new Date(topic.deadline), "MMM d")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={topic.priority} />
                          <StatusBadge status={topic.status} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Topics */}
          <div>
            <SectionHeader title="Study Topics" href="/dashboard/topics" count={topics.filter(t => t.semesterId === activeSemesterId && t.status === "pending").length} />
            {isLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <TopicCardSkeleton key={i} />)}</div>
            ) : pendingTopics.length === 0 ? (
              <EmptyState icon={CheckSquare} title="No pending topics" description="Great work! Add topics via the Study Topics page." />
            ) : (
              <div className="space-y-2">
                {pendingTopics.map((topic) => {
                  const course = courses.find((c) => c.$id === topic.courseId);
                  const dueIn = countdown(topic.deadline);
                  const isNearDue = differenceInHours(new Date(topic.deadline), now) < 12;
                  return (
                    <Card key={topic.$id} className="bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{topic.title}</p>
                          <p className="text-xs text-zinc-500">{course?.code} · {topic.estimatedHours}h estimated</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={topic.priority} />
                          <span className={`text-xs font-medium ${isNearDue ? "text-rose-400" : "text-zinc-500"}`}>{dueIn}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">

          {/* Upcoming Exams */}
          <div>
            <SectionHeader title="Upcoming Exams" href="/dashboard/exams" count={upcomingExams.length} />
            {upcomingExams.length === 0 ? (
              <EmptyState icon={BookOpen} title="No upcoming exams" description="Add exams to track countdowns." />
            ) : (
              <div className="space-y-2">
                {upcomingExams.map((exam) => {
                  const course = courses.find((c) => c.$id === exam.courseId);
                  const daysLeft = differenceInDays(new Date(exam.date), now);
                  return (
                    <Card key={exam.$id} className="bg-zinc-900/50 border-zinc-800/60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-zinc-100 truncate">{exam.name}</p>
                          <span className={`text-xs font-bold ml-2 flex-shrink-0 ${daysLeft <= 3 ? "text-rose-400" : daysLeft <= 7 ? "text-amber-400" : "text-zinc-500"}`}>
                            {daysLeft === 0 ? "Today!" : `${daysLeft}d`}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">{course?.code} · {exam.type} · {format(new Date(exam.date), "MMM d")}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Semester Progress */}
          {activeSemester && (
            <Card className="bg-zinc-900/50 border-zinc-800/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300">Semester Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{format(new Date(activeSemester.startDate), "MMM d")}</span>
                  <span className="font-medium text-zinc-300">{semesterProgress}%</span>
                  <span>{format(new Date(activeSemester.endDate), "MMM d")}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${semesterProgress}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-100">{courses.filter(c => c.semesterId === activeSemesterId).length}</p>
                    <p className="text-[10px] text-zinc-500">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-100">{topics.filter(t => t.semesterId === activeSemesterId && t.status === "completed").length}</p>
                    <p className="text-[10px] text-zinc-500">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-100">{topics.filter(t => t.semesterId === activeSemesterId).length}</p>
                    <p className="text-[10px] text-zinc-500">Topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card className="bg-zinc-900/50 border-zinc-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-300">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/topics">
                <Button variant="outline" size="sm" className="w-full justify-start border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs h-9">
                  <CheckSquare className="mr-2 h-3.5 w-3.5 text-indigo-400" />Add Study Topic
                </Button>
              </Link>
              <Link href="/dashboard/exams">
                <Button variant="outline" size="sm" className="w-full justify-start border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs h-9">
                  <BookOpen className="mr-2 h-3.5 w-3.5 text-emerald-400" />Log Exam Result
                </Button>
              </Link>
              <Link href="/dashboard/pomodoro">
                <Button variant="outline" size="sm" className="w-full justify-start border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs h-9">
                  <TrendingUp className="mr-2 h-3.5 w-3.5 text-orange-400" />Start Pomodoro
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
