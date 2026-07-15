import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
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
              <LocalizedText k="pricing.free" fallback="Free" />
            </Badge>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              <LocalizedText
                k="auth.signInToPractice"
                fallback="Sign in to start free practice"
              />
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              <LocalizedText
                k="auth.signInPracticeDescription"
                fallback="Sign in to save your practice record, view results, and use Writing AI feedback."
              />
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={buildLoginRedirectHref(returnTo)}>
                  <LocalizedText k="auth.signIn" fallback="Sign in" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={buildRegisterRedirectHref(returnTo)}>
                  <LocalizedText
                    k="auth.createAccount"
                    fallback="Create account"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
