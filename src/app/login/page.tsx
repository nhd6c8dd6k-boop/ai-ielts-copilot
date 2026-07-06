import Link from "next/link";
import type { ReactNode } from "react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/features/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const loginMessages: Record<string, string> = {
  invalid_credentials: "邮箱或密码不正确，请检查后重试。",
  missing_fields: "请输入邮箱和密码。",
};

const resetMessages: Record<string, string> = {
  demo: "当前未配置 Supabase，已进入本地演示模式。",
  sent: "重置密码邮件已发送，请检查邮箱。",
  updated: "Password updated successfully. Please log in again.",
};

const signupMessages: Record<string, string> = {
  check_email: "注册成功，请先在邮箱中完成验证。",
};

const checkoutMessages: Record<string, string> = {
  login_required: "请先登录，再继续完成会员订阅。",
};

const adminMessages: Record<string, string> = {
  login_required: "请先登录管理员账号，再访问运营后台。",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = getParam(params, "error");
  const reset = getParam(params, "reset");
  const signup = getParam(params, "signup");
  const checkout = getParam(params, "checkout");
  const admin = getParam(params, "admin");
  const redirectTo = getSafeRedirectPath(getParam(params, "redirect"), "/dashboard");
  const isPracticeRedirect = redirectTo.startsWith("/practice/");

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <Badge className="mb-3 w-fit bg-slate-50">
              <LocalizedText k="auth.loginBadge" fallback="Account login" />
            </Badge>
            <CardTitle>
              <LocalizedText
                k="auth.loginTitle"
                fallback="Log in to AI IELTS Copilot"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <AuthMessage tone="error" text={loginMessages[error]} /> : null}
            {reset ? <AuthMessage text={resetMessages[reset]} /> : null}
            {signup ? <AuthMessage text={signupMessages[signup]} /> : null}
            {checkout ? <AuthMessage text={checkoutMessages[checkout]} /> : null}
            {admin ? <AuthMessage text={adminMessages[admin]} /> : null}
            {isPracticeRedirect ? (
              <AuthMessage
                text={
                  <LocalizedText
                    k="auth.practiceRedirectHint"
                    fallback="Free during beta. You will return to the selected practice after signing in."
                  />
                }
              />
            ) : null}
            <form action={signInAction} className="space-y-4">
              <input type="hidden" name="redirect" value={redirectTo} />
              <div className="space-y-2">
                <Label htmlFor="email">
                  <LocalizedText k="auth.email" fallback="Email" />
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  <LocalizedText k="auth.password" fallback="Password" />
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="At least 8 characters"
                />
              </div>
              <Button className="w-full" type="submit">
                {isPracticeRedirect ? (
                  <LocalizedText
                    k="auth.loginPractice"
                    fallback="Log in and start practice"
                  />
                ) : (
                  <LocalizedText
                    k="auth.loginDashboard"
                    fallback="Log in to dashboard"
                  />
                )}
              </Button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm">
              <Link
                href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-slate-600 hover:text-slate-950"
              >
                <LocalizedText
                  k="auth.createAccount"
                  fallback="Create account"
                />
              </Link>
              <Link
                href="/forgot-password"
                className="text-slate-600 hover:text-slate-950"
              >
                <LocalizedText
                  k="auth.forgotPassword"
                  fallback="Forgot password?"
                />
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function getParam(
  params: Awaited<LoginPageProps["searchParams"]>,
  key: string,
) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

function AuthMessage({
  text,
  tone = "success",
}: {
  text?: ReactNode;
  tone?: "success" | "error";
}) {
  if (!text) {
    return null;
  }

  return (
    <div
      className={
        tone === "error"
          ? "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          : "rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800"
      }
    >
      {text}
    </div>
  );
}
