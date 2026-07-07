"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { supportEmail, xiaohongshuAccount } from "@/lib/support";

type LegalPageKind = "privacy" | "terms";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalContent = {
  badge: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const privacyContent: Record<"en" | "zh", LegalContent> = {
  en: {
    badge: "Beta legal information",
    title: "Privacy Policy",
    description:
      "This lightweight Privacy Policy explains how AI IELTS Copilot handles user information during beta testing.",
    lastUpdated: "Last updated: July 7, 2026",
    sections: [
      {
        title: "Information we collect",
        bullets: [
          "Account information such as your email address, display name, profile preferences, and authentication status.",
          "Practice activity such as Reading, Listening, and Writing attempts, scores, answers, timing, and dashboard history.",
          "Writing submissions, AI writing feedback, estimated bands, grammar notes, vocabulary suggestions, and related result data.",
          "Basic technical logs used to debug errors, improve reliability, prevent abuse, and understand product issues.",
          "AI usage information such as token usage, generation type, and estimated cost, so we can monitor beta usage and operating costs.",
        ],
      },
      {
        title: "Passwords and authentication",
        paragraphs: [
          "AI IELTS Copilot uses Supabase Auth for account registration, login, logout, and password reset. We do not store plaintext passwords in our application database.",
        ],
      },
      {
        title: "How we use information",
        bullets: [
          "To provide Reading, Listening, Writing, result review, dashboard, and profile features.",
          "To generate and display AI Writing feedback when you submit a Writing practice response.",
          "To save your practice history and help you review scores, answers, explanations, and progress.",
          "To improve product quality, investigate bugs, protect the service from abuse, and manage AI usage costs.",
          "To verify beta reward eligibility, such as whether a registered user has completed one practice session.",
        ],
      },
      {
        title: "AI Writing feedback",
        paragraphs: [
          "When you submit a Writing response for AI feedback, your task prompt, visual data when available, essay, and related context may be sent to an AI provider for processing. Please do not include sensitive personal information in your essays.",
          "AI feedback is for study guidance only. Estimated bands are not official IELTS scores and should not be treated as exam results.",
        ],
      },
      {
        title: "Third-party services",
        paragraphs: [
          "AI IELTS Copilot uses third-party services to operate the beta product, including Supabase for authentication, database, and storage; Vercel for hosting; and OpenAI technology for AI feedback and generation features.",
        ],
      },
      {
        title: "No sale of personal information",
        paragraphs: [
          "We do not sell your personal information. We use information to operate, secure, and improve AI IELTS Copilot.",
        ],
      },
      {
        title: "Retention and deletion",
        paragraphs: [
          "We keep account and practice data while your account is active or while it is needed to operate the beta product. You can contact us to request account or data deletion.",
        ],
      },
      {
        title: "Beta product changes",
        paragraphs: [
          "AI IELTS Copilot is currently in beta. Features, data fields, retention practices, and service providers may change as the product improves.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          `For privacy questions or deletion requests, contact ${supportEmail}. You can also reach us on Xiaohongshu: ${xiaohongshuAccount}.`,
        ],
      },
    ],
  },
  zh: {
    badge: "Beta 法务说明",
    title: "隐私政策",
    description:
      "这是一份 Beta 阶段的简版隐私政策，用来说明 AI IELTS Copilot 如何处理用户信息。",
    lastUpdated: "最后更新：2026 年 7 月 7 日",
    sections: [
      {
        title: "我们收集的信息",
        bullets: [
          "账号信息，例如邮箱、显示名称、个人资料偏好和登录状态。",
          "练习记录，例如 Reading、Listening、Writing 的练习次数、分数、答案、用时和 Dashboard 历史记录。",
          "Writing 提交内容、AI 写作反馈、预估 Band、语法建议、词汇建议和相关结果数据。",
          "基础技术日志，用于排查错误、提升稳定性、防止滥用和理解产品问题。",
          "AI 使用信息，例如 token 使用量、调用类型和预估成本，用于管理 Beta 阶段的使用量和运营成本。",
        ],
      },
      {
        title: "密码与登录",
        paragraphs: [
          "AI IELTS Copilot 使用 Supabase Auth 处理注册、登录、退出和密码重置。我们不会在应用数据库中保存用户明文密码。",
        ],
      },
      {
        title: "我们如何使用信息",
        bullets: [
          "提供 Reading、Listening、Writing、结果复盘、Dashboard 和个人资料功能。",
          "当你提交 Writing 练习时，生成并展示 AI 写作反馈。",
          "保存练习历史，帮助你查看分数、答案、解析和学习进度。",
          "改进产品质量、排查 bug、保护服务不被滥用，并管理 AI 使用成本。",
          "核实 Beta 测试福利资格，例如注册用户是否完成过一次练习。",
        ],
      },
      {
        title: "AI Writing feedback",
        paragraphs: [
          "当你提交 Writing 作文获取 AI feedback 时，题目、可视化数据、作文内容和相关上下文可能会发送给 AI 服务提供方处理。请不要在作文中填写敏感个人信息。",
          "AI feedback 仅用于学习参考。预估 Band 不是官方 IELTS 分数，也不代表真实考试结果。",
        ],
      },
      {
        title: "第三方服务",
        paragraphs: [
          "AI IELTS Copilot 会使用第三方服务来运行 Beta 产品，包括用于登录、数据库和存储的 Supabase，用于部署托管的 Vercel，以及用于 AI feedback 和生成能力的 OpenAI 技术。",
        ],
      },
      {
        title: "不会出售个人信息",
        paragraphs: [
          "我们不会出售你的个人信息。我们使用这些信息是为了运行、保护和改进 AI IELTS Copilot。",
        ],
      },
      {
        title: "保留与删除",
        paragraphs: [
          "只要你的账号仍然活跃，或产品运行仍需要相关数据，我们会保留账号和练习数据。你可以联系我们请求删除账号或数据。",
        ],
      },
      {
        title: "Beta 产品变更",
        paragraphs: [
          "AI IELTS Copilot 目前处于 Beta 阶段。随着产品改进，功能、数据字段、数据保留方式和服务提供方可能会调整。",
        ],
      },
      {
        title: "联系方式",
        paragraphs: [
          `如有隐私问题或删除数据请求，请联系 ${supportEmail}。也可以通过小红书联系：${xiaohongshuAccount}。`,
        ],
      },
    ],
  },
};

const termsContent: Record<"en" | "zh", LegalContent> = {
  en: {
    badge: "Beta legal information",
    title: "Terms of Use",
    description:
      "These lightweight Terms explain the basic rules for using AI IELTS Copilot during beta testing.",
    lastUpdated: "Last updated: July 7, 2026",
    sections: [
      {
        title: "Beta service",
        paragraphs: [
          "AI IELTS Copilot is currently a beta product. Features may change, be interrupted, contain errors, or be removed as we improve the service.",
        ],
      },
      {
        title: "Independent practice tool",
        paragraphs: [
          "AI IELTS Copilot is an independent IELTS-style practice tool. It is not affiliated with, endorsed by, sponsored by, or officially connected to IELTS, Cambridge, British Council, IDP, or OpenAI.",
        ],
      },
      {
        title: "Practice content",
        paragraphs: [
          "The practice content on AI IELTS Copilot is original IELTS-style material created for study and beta testing. We do not provide official IELTS questions, Cambridge materials, exam recalls, or leaked exam content.",
        ],
      },
      {
        title: "AI Writing feedback",
        paragraphs: [
          "AI Writing feedback is for study support only. It may contain mistakes, miss important details, or provide suggestions that are not suitable for every learner.",
          "Estimated bands are not official IELTS scores, do not guarantee exam performance, and should not be treated as professional or official assessment.",
        ],
      },
      {
        title: "User responsibilities",
        bullets: [
          "Do not abuse, disrupt, overload, or attempt to break the service.",
          "Do not try to access another user's account, results, data, or admin-only areas.",
          "Do not copy, resell, redistribute, or republish large amounts of practice content without permission.",
          "Do not submit unlawful, harmful, abusive, or sensitive personal content.",
          "Use your own account information and keep your login credentials secure.",
        ],
      },
      {
        title: "Beta tester reward",
        paragraphs: [
          "The first 10 registered users who complete one practice session may receive 1 month of Pro access when paid plans launch. This is a promotional beta reward, may require manual verification, and does not mean paid Pro access is available now.",
        ],
      },
      {
        title: "No guarantees",
        bullets: [
          "We do not guarantee any specific IELTS score or exam result.",
          "We do not guarantee that the service will be error-free, uninterrupted, or always available.",
          "We do not guarantee that AI feedback or automatic scoring will always be accurate.",
        ],
      },
      {
        title: "Account and data deletion",
        paragraphs: [
          `To request account or data deletion, contact ${supportEmail}. You can also contact us on Xiaohongshu: ${xiaohongshuAccount}.`,
        ],
      },
    ],
  },
  zh: {
    badge: "Beta 法务说明",
    title: "使用条款",
    description:
      "这是一份 Beta 阶段的简版使用条款，用来说明使用 AI IELTS Copilot 的基本规则。",
    lastUpdated: "最后更新：2026 年 7 月 7 日",
    sections: [
      {
        title: "Beta 服务",
        paragraphs: [
          "AI IELTS Copilot 目前是 Beta 产品。随着我们继续改进，功能可能会调整、中断、出现错误或被移除。",
        ],
      },
      {
        title: "独立练习工具",
        paragraphs: [
          "AI IELTS Copilot 是一个独立的 IELTS-style 练习工具。它不隶属于 IELTS、Cambridge、British Council、IDP 或 OpenAI，也不代表这些机构的官方授权、赞助或认可。",
        ],
      },
      {
        title: "练习内容",
        paragraphs: [
          "AI IELTS Copilot 上的练习内容是用于学习和 Beta 测试的原创 IELTS-style 材料。我们不提供官方 IELTS 题目、Cambridge 材料、考试回忆或泄露考试内容。",
        ],
      },
      {
        title: "AI Writing feedback",
        paragraphs: [
          "AI Writing feedback 仅用于学习辅助。它可能存在错误、遗漏重要信息，或给出不适合所有学习者的建议。",
          "预估 Band 不是官方 IELTS 分数，不保证真实考试表现，也不应被视为专业或官方评分。",
        ],
      },
      {
        title: "用户责任",
        bullets: [
          "不要滥用、干扰、攻击或试图破坏服务。",
          "不要尝试访问其他用户的账号、结果、数据或仅限管理员访问的区域。",
          "未经允许，不要大量复制、转售、再分发或公开发布练习内容。",
          "不要提交违法、有害、辱骂性或包含敏感个人信息的内容。",
          "请使用自己的账号信息，并妥善保管登录凭据。",
        ],
      },
      {
        title: "Beta 测试福利",
        paragraphs: [
          "前 10 名注册并完成一次练习的用户，在正式付费版上线后可获得 1 个月 Pro 体验。这是 Beta 阶段的推广福利，可能需要人工核实，也不代表当前已经开放付费 Pro。",
        ],
      },
      {
        title: "不作保证",
        bullets: [
          "我们不保证任何具体 IELTS 分数或考试结果。",
          "我们不保证服务完全无错误、不中断或永远可用。",
          "我们不保证 AI feedback 或自动判分始终准确。",
        ],
      },
      {
        title: "账号和数据删除",
        paragraphs: [
          `如需请求删除账号或数据，请联系 ${supportEmail}。也可以通过小红书联系：${xiaohongshuAccount}。`,
        ],
      },
    ],
  },
};

const contentByKind = {
  privacy: privacyContent,
  terms: termsContent,
} satisfies Record<LegalPageKind, Record<"en" | "zh", LegalContent>>;

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const { language, t } = useI18n();
  const content = contentByKind[kind][language];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <Badge>{content.badge}</Badge>
        <div className="mt-5 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            {content.description}
          </p>
          <p className="mt-4 text-sm font-medium text-slate-500">
            {content.lastUpdated}
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {content.sections.map((section, index) => (
            <section
              key={section.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-lg font-semibold text-slate-950">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-sm leading-7 text-slate-600"
                >
                  {renderContactLinks(paragraph)}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-lg border border-teal-100 bg-teal-50 p-5 text-sm leading-6 text-teal-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {language === "zh"
              ? "如果你对这些说明有疑问，欢迎联系我们。"
              : "If you have questions about these terms, please contact us."}
          </p>
          <Link
            href="/support"
            className="font-semibold text-teal-900 underline-offset-4 hover:underline"
          >
            {t("footer.support", "Support & Beta Feedback")}
          </Link>
        </div>
      </main>
      <SupportFooter />
    </div>
  );
}

function renderContactLinks(text: string) {
  const parts = text.split(supportEmail);

  if (parts.length === 1) {
    return text;
  }

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <a
              href={`mailto:${supportEmail}`}
              className="font-medium text-teal-800 underline-offset-4 hover:underline"
            >
              {supportEmail}
            </a>
          ) : null}
        </span>
      ))}
    </>
  );
}
