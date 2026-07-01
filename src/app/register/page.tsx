import Link from "next/link";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction } from "@/features/auth/actions";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const registerMessages: Record<string, string> = {
  missing_fields: "请填写姓名、邮箱和密码。",
  weak_password: "密码至少需要 8 位。",
  signup_failed: "注册失败，请稍后重试或换一个邮箱。",
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const error = getParam(params, "error");

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <Badge className="mb-3 w-fit bg-slate-50">免费开始</Badge>
            <CardTitle>创建学习账号</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {registerMessages[error] ?? "注册失败，请稍后重试。"}
              </div>
            ) : null}
            <form action={signUpAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="你的名字"
                />
              </div>
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="至少 8 位"
                />
              </div>
              <Button className="w-full" type="submit">
                创建账号
              </Button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
              已经有账号？{" "}
              <Link href="/login" className="font-medium text-slate-950">
                去登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function getParam(
  params: Awaited<RegisterPageProps["searchParams"]>,
  key: string,
) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}
