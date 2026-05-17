"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings, User, ExternalLink, Save, Database } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { appwriteUser } = useAuthStore();
  const [cfHandle, setCfHandle] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    try {
      setIsSaving(true);
      // In production: await userService.updateProfile(docId, { cfHandle, university, department });
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Manage your profile and integrations.</p>
      </div>

      {/* Profile */}
      <Card className="bg-zinc-900/50 border-zinc-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
              {appwriteUser?.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div>
              <p className="font-medium text-zinc-100">{appwriteUser?.name ?? "—"}</p>
              <p className="text-sm text-zinc-500">{appwriteUser?.email ?? "—"}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">University</label>
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g., DIU" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., CSE" className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Codeforces Integration */}
      <Card className="bg-zinc-900/50 border-zinc-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-emerald-400" />Codeforces Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Codeforces Handle</label>
            <div className="flex gap-2">
              <Input value={cfHandle} onChange={(e) => setCfHandle(e.target.value)} placeholder="e.g., tourist" className="bg-zinc-900 border-zinc-800 flex-1" />
              <Button
                variant="outline"
                className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-xs"
                onClick={async () => {
                  if (!cfHandle) return;
                  const res = await fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`);
                  const data = await res.json();
                  if (data.status === "OK") {
                    const u = data.result[0];
                    toast.success(`Found: ${u.handle} · Rating: ${u.rating ?? "Unrated"}`);
                  } else {
                    toast.error("Handle not found on Codeforces");
                  }
                }}
              >
                Verify
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40">
            <Database className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-zinc-400 font-medium">Sync upcoming contests</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Once Appwrite Functions are configured, submissions will sync every 6 hours automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appwrite Config */}
      <Card className="bg-zinc-900/50 border-zinc-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />Backend Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Appwrite Endpoint", value: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, ok: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT },
              { label: "Project ID", value: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? "Configured" : "Not set", ok: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID },
              { label: "Database ID", value: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ? "Configured" : "Not set", ok: !!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <span className="text-xs text-zinc-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span className="text-xs text-zinc-500 font-mono">{item.value?.slice(0, 30) ?? "Not configured"}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
