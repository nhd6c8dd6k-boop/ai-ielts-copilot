"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ResetStatus = "checking" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<ResetStatus>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      if (!isSupabaseConfigured()) {
        setStatus("invalid");
        setMessage("Supabase is not configured for password reset.");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        setStatus("invalid");
        setMessage("This reset link is invalid or has expired.");
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          code,
        );

        if (exchangeError) {
          if (!isActive) return;
          setStatus("invalid");
          setMessage("This reset link is invalid or has expired.");
          return;
        }

        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isActive) {
        return;
      }

      if (!session) {
        setStatus("invalid");
        setMessage("Please open the latest reset password email link.");
        return;
      }

      setStatus("ready");
    }

    void prepareRecoverySession();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!password) {
      setMessage("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setIsSubmitting(false);
      setMessage("Password update failed. Please request a new reset link.");
      return;
    }

    await supabase.auth.signOut();
    setStatus("success");
    setMessage("Password updated successfully. Please log in again.");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <Badge className="mb-3 w-fit bg-slate-50">账号安全</Badge>
            <CardTitle>设置新密码</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "checking" ? (
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded-md bg-slate-100" />
                <div className="h-10 rounded-md bg-slate-100" />
                <div className="h-10 rounded-md bg-slate-100" />
              </div>
            ) : null}

            {message ? (
              <div
                className={
                  status === "success"
                    ? "flex gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800"
                    : "flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                }
              >
                {status === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{message}</span>
              </div>
            ) : null}

            {status === "ready" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="Repeat your new password"
                  />
                </div>
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update password"}
                </Button>
              </form>
            ) : null}

            {status === "invalid" ? (
              <Button asChild className="w-full">
                <Link href="/forgot-password">Request a new reset link</Link>
              </Button>
            ) : null}

            {status === "success" ? (
              <Button asChild className="w-full">
                <Link href="/login?reset=updated">Go to login</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
