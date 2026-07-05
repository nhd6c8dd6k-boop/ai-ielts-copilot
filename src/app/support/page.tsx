import { Mail, MessageCircle } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import {
  SupportFooter,
  supportEmail,
  xiaohongshuAccount,
} from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Badge>Beta Support</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Support & Beta Feedback
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          AI IELTS Copilot is currently in beta. If you find a bug, have
          trouble using the site, or want to suggest an improvement, please
          contact us.
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600">
          AI IELTS Copilot 目前处于 Beta 测试阶段。如果你遇到 bug、使用问题，
          或者有改进建议，欢迎通过邮箱或小红书联系。
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="pt-3">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={`mailto:${supportEmail}`}
                className="text-base font-medium text-teal-800 underline-offset-4 hover:underline"
              >
                {supportEmail}
              </a>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use email for bug reports, login issues, payment questions, or
                longer feedback.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="pt-3">小红书</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium text-slate-950">
                {xiaohongshuAccount}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                也可以通过小红书账号反馈使用体验、题目建议或 Beta 测试问题。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SupportFooter />
    </div>
  );
}
