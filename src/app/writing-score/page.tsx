import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supportEmail, xiaohongshuAccount } from "@/lib/support";

export const metadata: Metadata = {
  title: "免费 IELTS Writing AI 评分",
  description:
    "免费使用 IELTS Writing Task 1 / Task 2 AI 评分，获得预估分数、四项标准反馈、语法建议和提分方向。",
};

const outcomes = [
  "预估 band score 和四项评分反馈",
  "指出 Task Response / Coherence / Lexical Resource / Grammar 的主要扣分点",
  "给出更自然的表达、语法修正和下一步练习建议",
];

const proofPoints = [
  {
    icon: PenLine,
    title: "直接练真题型",
    body: "选择 Task 1 或 Task 2，在接近机考的写作界面里完成一篇作文。",
  },
  {
    icon: Sparkles,
    title: "提交后看反馈",
    body: "获得 AI 生成的预估分数、四项标准点评、语法建议、词汇升级和参考范文。",
  },
  {
    icon: Target,
    title: "知道下一步改什么",
    body: "比单纯背模板更清楚：你现在最该补的是结构、展开、词汇还是句子准确度。",
  },
];

const audiences = [
  "第一次备考雅思机考",
  "写作长期卡在 5.5-6.5",
  "想先免费试用再决定是否系统练习",
];

export default function WritingScoreLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="border-b border-slate-200 bg-[#f7faf9]">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  免费练习
                </Badge>
                <Badge className="bg-white">
                  面向中国雅思考生
                </Badge>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                免费测一次 IELTS Writing，看看你现在大概能拿几分
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                上传前先练一篇 Task 1 或 Task 2。AI IELTS Copilot 会给出预估
                band、四项评分反馈、语法问题和下一步提分建议。注册后即可开始练习。
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {outcomes.map((item) => (
                  <div
                    key={item}
                    className="flex min-w-0 gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register?redirect=%2Fpractice%2Fwriting">
                    免费开始写作评分
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/practice/writing">先看看题目</Link>
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  约 40 分钟完成一次 Task 2
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  AI 分数仅作练习参考，不代表官方成绩
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
                  <BrandLogo
                    className="text-white"
                    textClassName="text-white"
                  />
                </div>
                <div className="p-5">
                  <Image
                    src="/brand/full-logo.png"
                    alt="AI IELTS Copilot"
                    width={1536}
                    height={1024}
                    priority
                    sizes="(min-width: 1024px) 380px, calc(100vw - 3rem)"
                    className="mx-auto h-auto w-full max-w-[24rem]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge>适合谁</Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                不确定写作问题在哪里时，先拿一份反馈
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {audiences.map((audience) => (
                <div
                  key={audience}
                  className="rounded-lg border border-slate-200 bg-[#fbfbf8] p-5 text-sm font-medium text-slate-800"
                >
                  {audience}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {proofPoints.map((point) => {
              const Icon = point.icon;

              return (
                <div
                  key={point.title}
                  className="rounded-lg border border-slate-200 bg-white p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {point.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {point.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f7faf9]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
            <div>
              <Badge className="bg-teal-50 text-teal-800">马上开始</Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                今天先完成一篇，明天就知道重点该练什么
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                如果你正在准备投放广告，可以把广告直接链接到这个页面：
                <span className="font-medium text-slate-950">
                  {" "}
                  https://www.aiieltscopilot.com/writing-score
                </span>
              </p>
              <Button asChild className="mt-7" size="lg">
                <Link href="/register?redirect=%2Fpractice%2Fwriting">
                  免费注册并开始
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">
                想咨询 Pro 开通或合作推广
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 font-medium text-slate-950 transition-colors hover:bg-slate-50"
                >
                  <Mail className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  {supportEmail}
                </a>
                <div className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3">
                  <MessageCircle
                    className="h-4 w-4 text-teal-700"
                    aria-hidden="true"
                  />
                  小红书：{xiaohongshuAccount}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
