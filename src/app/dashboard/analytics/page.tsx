"use client";

import { useMemo } from "react";
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart2, Clock, CheckSquare, Flame } from "lucide-react";

import { useSemesterStore } from "@/store/useSemesterStore";
import { useCourseStore } from "@/store/useCourseStore";
import { useStudyTopicStore } from "@/store/useStudyTopicStore";
import { useStudySessionStore } from "@/store/useStudySessionStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

const CHART_COLORS = ["#6366f1", "#4ade80", "#f59e0b", "#f87171", "#60a5fa", "#a78bfa", "#34d399"];

export default function AnalyticsPage() {
  const { activeSemesterId } = useSemesterStore();
  const { courses } = useCourseStore();
  const { topics } = useStudyTopicStore();
  const { sessions } = useStudySessionStore();

  const activeSessions = sessions.filter((s) => s.semesterId === activeSemesterId);
  const activeTopics = topics.filter((t) => t.semesterId === activeSemesterId);

  // Weekly study chart — last 7 days
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dayMins = activeSessions
        .filter((s) => isSameDay(new Date(s.date), day))
        .reduce((acc, s) => acc + s.duration, 0);
      return { day: format(day, "EEE"), mins: dayMins, hours: +(dayMins / 60).toFixed(1) };
    });
  }, [activeSessions]);

  // Course distribution
  const courseData = useMemo(() => {
    return courses
      .filter((c) => c.semesterId === activeSemesterId)
      .map((course) => {
        const mins = activeSessions
          .filter((s) => s.courseId === course.$id)
          .reduce((acc, s) => acc + s.duration, 0);
        return { name: course.code, mins, color: course.color };
      })
      .filter((d) => d.mins > 0);
  }, [courses, activeSessions, activeSemesterId]);

  // Topic completion stats
  const topicStats = useMemo(() => ({
    completed: activeTopics.filter((t) => t.status === "completed").length,
    pending: activeTopics.filter((t) => t.status === "pending").length,
    overdue: activeTopics.filter((t) => t.status === "overdue").length,
    inProgress: activeTopics.filter((t) => t.status === "in-progress").length,
  }), [activeTopics]);

  const totalStudyMins = activeSessions.reduce((acc, s) => acc + s.duration, 0);
  const todayMins = activeSessions.filter((s) => isSameDay(new Date(s.date), new Date())).reduce((acc, s) => acc + s.duration, 0);
  const totalSessions = activeSessions.length;

  // Streak
  const streak = useMemo(() => {
    const days = new Set(activeSessions.map((s) => new Date(s.date).toDateString()));
    let count = 0;
    let d = new Date();
    while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1); }
    return count;
  }, [activeSessions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Your study insights and productivity trends.</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Clock, label: "Total Study Time", value: formatDuration(totalStudyMins), sub: "This semester", color: "text-indigo-400" },
          { icon: Flame, label: "Current Streak", value: `${streak} days`, sub: streak === 0 ? "Start today!" : "Keep going!", color: "text-orange-400" },
          { icon: CheckSquare, label: "Topics Completed", value: `${topicStats.completed}`, sub: `of ${activeTopics.length} total`, color: "text-emerald-400" },
          { icon: BarChart2, label: "Pomodoros", value: `${totalSessions}`, sub: `${formatDuration(todayMins)} today`, color: "text-blue-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-zinc-900/50 border-zinc-800/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500 font-medium">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly study bar chart */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">Study Hours — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(v: unknown) => [`${v}h`, "Study hours"]}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course distribution pie chart */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">Study Distribution by Course</CardTitle>
          </CardHeader>
          <CardContent>
            {courseData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-sm text-zinc-600">
                No sessions with course context yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={courseData} dataKey="mins" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                    {courseData.map((entry, idx) => (
                      <Cell key={entry.name} fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                    formatter={(v: unknown) => [formatDuration(Number(v)), "Study time"]}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#71717a" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topic status breakdown */}
      <Card className="bg-zinc-900/50 border-zinc-800/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-300">Topic Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Completed", count: topicStats.completed, color: "bg-emerald-500", text: "text-emerald-400" },
              { label: "In Progress", count: topicStats.inProgress, color: "bg-blue-500", text: "text-blue-400" },
              { label: "Pending", count: topicStats.pending, color: "bg-amber-500", text: "text-amber-400" },
              { label: "Overdue", count: topicStats.overdue, color: "bg-rose-500", text: "text-rose-400" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className={`text-2xl font-bold ${item.text}`}>{item.count}</div>
                <div className="text-xs text-zinc-500 mt-1">{item.label}</div>
                <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${activeTopics.length > 0 ? (item.count / activeTopics.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
