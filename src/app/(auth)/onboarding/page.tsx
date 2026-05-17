"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { onboardingSchema, OnboardingSchemaType } from "@/validations/auth";
import { useAuthStore } from "@/store/useAuthStore";
// In a real implementation, you'd save this to Appwrite DB:
// import { databaseService } from "@/services/database";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { appwriteUser } = useAuthStore();

  const form = useForm<OnboardingSchemaType>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      university: "",
      department: "",
      cfHandle: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  async function onSubmit(data: OnboardingSchemaType) {
    if (!appwriteUser) return;
    try {
      setIsLoading(true);
      // TODO: Save to Appwrite Users collection here.
      // await databaseService.createUserProfile(appwriteUser.$id, {
      //   name: appwriteUser.name,
      //   email: appwriteUser.email,
      //   ...data,
      //   xp: 0,
      //   level: 1,
      // });
      
      toast.success("Profile setup complete!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Complete your profile</CardTitle>
        <CardDescription>
          Tell us a bit more about your academic background.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Stanford University" disabled={isLoading} {...field} className="bg-zinc-950 border-zinc-800" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Computer Science" disabled={isLoading} {...field} className="bg-zinc-950 border-zinc-800" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="cfHandle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codeforces Handle (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="tourist" disabled={isLoading} {...field} className="bg-zinc-950 border-zinc-800" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input readOnly disabled {...field} className="bg-zinc-950/50 border-zinc-800 text-zinc-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
