import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildLoginRedirectHref,
  buildRegisterRedirectHref,
} from "@/lib/auth/redirect";

type SignInToPracticeProps = {
  returnTo: string;
};

export function SignInToPractice({ returnTo }: SignInToPracticeProps) {
  return (
    <AppShell>
      <Card>
        <CardContent className="flex min-h-[520px] items-center justify-center px-4 py-12">
          <div className="max-w-lg text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <Badge className="mt-5 bg-teal-50 text-teal-800">
              Free during beta
            </Badge>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              Sign in to start free practice
            </h1>
            <p className="mt-2 text-base font-medium text-slate-700">
              登录后即可免费开始练习
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Beta 阶段免费使用。登录后可以保存练习记录、查看结果，并使用
              Writing AI 反馈。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={buildLoginRedirectHref(returnTo)}>Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={buildRegisterRedirectHref(returnTo)}>
                  Create account
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
