import Link from "next/link";
import { Mail } from "lucide-react";

const supportEmail = "982765506@qq.com";
const xiaohongshuAccount = "1112899125";

export function SupportFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm leading-6 text-slate-600 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-medium text-slate-950">
              Need help or want to report a bug?
            </p>
            <p className="mt-1">
              遇到问题或想反馈？欢迎联系：
              <a
                href={`mailto:${supportEmail}`}
                className="ml-1 font-medium text-teal-800 underline-offset-4 hover:underline"
              >
                {supportEmail}
              </a>
            </p>
            <p className="mt-1">小红书账号：{xiaohongshuAccount}</p>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <p className="max-w-md text-slate-500 md:text-right">
              当前是 Beta 测试版，欢迎反馈问题和建议。This is a beta
              version. Your feedback helps us improve the practice experience.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Support & Beta Feedback
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { supportEmail, xiaohongshuAccount };
