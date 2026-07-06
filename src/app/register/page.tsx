import Link from "next/link";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction } from "@/features/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

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
  const redirectTo = getSafeRedirectPath(getParam(params, "redirect"), "/dashboard");
  const isPracticeRedirect = redirectTo.startsWith("/practice/");

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <Badge className="mb-3 w-fit bg-slate-50">
              <LocalizedText k="auth.registerBadge" fallback="Start free" />
            </Badge>
            <CardTitle>
              <LocalizedText
                k="auth.registerTitle"
                fallback="Create your learning account"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {registerMessages[error] ?? "注册失败，请稍后重试。"}
              </div>
            ) : null}
            {isPracticeRedirect ? (
              <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                <LocalizedText
                  k="auth.practiceRedirectHint"
                  fallback="Free during beta. You will return to the selected practice after signing in."
                />
              </div>
            ) : null}
            <form action={signUpAction} className="space-y-4">
              <input type="hidden" name="redirect" value={redirectTo} />
              <div className="space-y-2">
                <Label htmlFor="name">
                  <LocalizedText k="auth.name" fallback="Name" />
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Your name"
                />
              </div>
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>
              <Button className="w-full" type="submit">
                <LocalizedText
                  k="auth.createAccount"
                  fallback="Create account"
                />
              </Button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
              <LocalizedText
                k="auth.haveAccount"
                fallback="Already have an account?"
              />{" "}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                className="font-medium text-slate-950"
              >
                <LocalizedText k="auth.goLogin" fallback="Log in" />
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
