import Link from "next/link";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/features/auth/actions";

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

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <Badge className="mb-3 w-fit bg-slate-50">账号登录</Badge>
            <CardTitle>登录 AI IELTS Copilot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <AuthMessage tone="error" text={loginMessages[error]} /> : null}
            {reset ? <AuthMessage text={resetMessages[reset]} /> : null}
            {signup ? <AuthMessage text={signupMessages[signup]} /> : null}
            {checkout ? <AuthMessage text={checkoutMessages[checkout]} /> : null}
            {admin ? <AuthMessage text={adminMessages[admin]} /> : null}
            <form action={signInAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
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
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="至少 8 位"
                />
              </div>
              <Button className="w-full" type="submit">
                登录并进入学习看板
              </Button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm">
              <Link href="/register" className="text-slate-600 hover:text-slate-950">
                创建账号
              </Link>
              <Link
                href="/forgot-password"
                className="text-slate-600 hover:text-slate-950"
              >
                忘记密码
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
  text?: string;
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
