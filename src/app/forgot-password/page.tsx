import Link from "next/link";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/features/auth/actions";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const resetErrors: Record<string, string> = {
  missing_email: "请输入注册邮箱。",
  reset_failed: "重置邮件发送失败，请稍后重试。",
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const error = getParam(params, "error");

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <Badge className="mb-3 w-fit bg-slate-50">
              <LocalizedText k="auth.forgotBadge" fallback="Account security" />
            </Badge>
            <CardTitle>
              <LocalizedText k="auth.resetPassword" fallback="Reset password" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {resetErrors[error] ?? "重置失败，请稍后重试。"}
              </div>
            ) : null}
            <form action={resetPasswordAction} className="space-y-4">
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
              <Button className="w-full" type="submit">
                <LocalizedText
                  k="auth.sendResetEmail"
                  fallback="Send reset email"
                />
              </Button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
              <LocalizedText k="auth.remembered" fallback="Remembered it?" />{" "}
              <Link href="/login" className="font-medium text-slate-950">
                <LocalizedText k="auth.backToLogin" fallback="Back to login" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function getParam(
  params: Awaited<ForgotPasswordPageProps["searchParams"]>,
  key: string,
) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}
