import { Resend } from "resend";

import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

export type EmailLocale = "en" | "zh";

export type EmailDeliveryResult =
  | {
      status: "sent";
      providerMessageId?: string;
    }
  | {
      status: "skipped";
      reason:
        | "already_active_pro"
        | "not_configured"
        | "missing_recipient"
        | "unsupported_environment";
    }
  | {
      status: "failed";
      errorCode?: string;
    };

type EmailSenderPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

type EmailSender = (
  payload: EmailSenderPayload,
) => Promise<{ id?: string | null }>;

type EmailRuntimeConfig = {
  deliveryEnabled?: string;
  apiKey?: string;
  fromEmail?: string;
  replyToEmail?: string;
  siteUrl?: string;
};

export async function sendProActivatedEmail(
  input: {
    to?: string | null;
    displayName?: string | null;
    locale: EmailLocale;
    expiresAt?: string | Date | null;
  },
  options: {
    sender?: EmailSender;
    config?: EmailRuntimeConfig;
  } = {},
): Promise<EmailDeliveryResult> {
  const recipient = input.to?.trim();

  if (!recipient) {
    return { status: "skipped", reason: "missing_recipient" };
  }

  const config = getEmailRuntimeConfig(options.config);

  if (config.deliveryEnabled !== "true") {
    return { status: "skipped", reason: "unsupported_environment" };
  }

  if (!config.apiKey || !config.fromEmail) {
    return { status: "skipped", reason: "not_configured" };
  }

  try {
    const template = buildProActivatedEmail({
      displayName: input.displayName,
      locale: input.locale,
      expiresAt: input.expiresAt,
      siteUrl: config.siteUrl,
    });
    const sender = options.sender ?? createResendSender(config.apiKey);
    const result = await sender({
      from: config.fromEmail,
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: config.replyToEmail,
    });

    return {
      status: "sent",
      providerMessageId: result.id ?? undefined,
    };
  } catch (error) {
    console.error("pro_activation_email_failed", {
      code: getEmailErrorCode(error),
    });

    return {
      status: "failed",
      errorCode: getEmailErrorCode(error),
    };
  }
}

export function shouldSendProActivationEmail(wasActivePro: boolean) {
  return !wasActivePro;
}

export function buildProActivatedEmail({
  displayName,
  locale,
  expiresAt,
  siteUrl = absoluteUrl("/"),
}: {
  displayName?: string | null;
  locale: EmailLocale;
  expiresAt?: string | Date | null;
  siteUrl?: string;
}) {
  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  const writingUrl = `${cleanSiteUrl}/practice/writing`;
  const profileUrl = `${cleanSiteUrl}/profile`;
  const supportUrl = `${cleanSiteUrl}/support`;
  const expiryText = formatEmailDate(expiresAt, locale);
  const safeDisplayName = displayName?.trim();
  const greeting =
    locale === "zh"
      ? safeDisplayName
        ? `你好，${safeDisplayName}`
        : "你好，"
      : safeDisplayName
        ? `Hi ${safeDisplayName},`
        : "Hi,";

  if (locale === "zh") {
    const subject = "你的 AI IELTS Copilot Pro 会员已开通";
    const preview = "你的 Pro 权限现已生效。";
    const text = [
      greeting,
      "",
      "你的 AI IELTS Copilot Pro 会员现已开通。",
      "",
      "会员计划",
      "Pro",
      "",
      "状态",
      "已生效",
      "",
      "有效期至",
      expiryText,
      "",
      "你现在可以使用：",
      "",
      "- Reading 无限练习",
      "- Listening 无限练习",
      "- 每天最多 10 次 AI Writing feedback",
      "",
      `开始练习：${writingUrl}`,
      `查看账户：${profileUrl}`,
      `需要帮助：${supportUrl}`,
      "",
      "感谢你对 AI IELTS Copilot 的支持。",
      "",
      "AI IELTS Copilot",
      "",
      "AI 评分仅供学习参考，并非官方 IELTS 成绩。",
    ].join("\n");

    return {
      subject,
      text,
      html: renderEmailHtml({
        title: subject,
        preview,
        greeting,
        body:
          "你的 AI IELTS Copilot Pro 会员现已开通。感谢你对 AI IELTS Copilot 的支持。",
        labels: {
          plan: "会员计划",
          status: "状态",
          expires: "有效期至",
          benefits: "你现在可以使用：",
          writing: "开始练习",
          profile: "查看账户",
          support: "需要帮助",
          footer: "AI 评分仅供学习参考，并非官方 IELTS 成绩。",
        },
        status: "已生效",
        expiryText,
        benefits: [
          "Reading 无限练习",
          "Listening 无限练习",
          "每天最多 10 次 AI Writing feedback",
        ],
        writingUrl,
        profileUrl,
        supportUrl,
      }),
    };
  }

  const subject = "Your AI IELTS Copilot Pro membership is now active";
  const preview = "Your Pro access has been activated.";
  const text = [
    greeting,
    "",
    "Your AI IELTS Copilot Pro membership is now active.",
    "",
    "Plan",
    "Pro",
    "",
    "Status",
    "Active",
    "",
    "Access until",
    expiryText,
    "",
    "Your Pro access includes:",
    "",
    "- Unlimited Reading practice",
    "- Unlimited Listening practice",
    "- Up to 10 AI Writing feedbacks per day",
    "",
    `Start practising: ${writingUrl}`,
    `Manage your account: ${profileUrl}`,
    `Need help? Contact support: ${supportUrl}`,
    "",
    "Thank you for supporting AI IELTS Copilot.",
    "",
    "AI IELTS Copilot",
    "",
    "AI scores are for study guidance and are not official IELTS results.",
  ].join("\n");

  return {
    subject,
    text,
    html: renderEmailHtml({
      title: subject,
      preview,
      greeting,
      body:
        "Your AI IELTS Copilot Pro membership is now active. Thank you for supporting AI IELTS Copilot.",
      labels: {
        plan: "Plan",
        status: "Status",
        expires: "Access until",
        benefits: "Your Pro access includes:",
        writing: "Start practising",
        profile: "Manage your account",
        support: "Need help? Contact support",
        footer:
          "AI scores are for study guidance and are not official IELTS results.",
      },
      status: "Active",
      expiryText,
      benefits: [
        "Unlimited Reading practice",
        "Unlimited Listening practice",
        "Up to 10 AI Writing feedbacks per day",
      ],
      writingUrl,
      profileUrl,
      supportUrl,
    }),
  };
}

function getEmailRuntimeConfig(config?: EmailRuntimeConfig) {
  return {
    deliveryEnabled:
      config?.deliveryEnabled ?? env.emailDeliveryEnabled ?? "false",
    apiKey: config?.apiKey ?? env.resendApiKey,
    fromEmail: config?.fromEmail ?? env.resendFromEmail,
    replyToEmail: config?.replyToEmail ?? env.resendReplyToEmail,
    siteUrl: config?.siteUrl ?? absoluteUrl("/"),
  };
}

function createResendSender(apiKey: string): EmailSender {
  return async (payload) => {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });

    if (response.error) {
      throw response.error;
    }

    return { id: response.data?.id };
  };
}

function formatEmailDate(value: string | Date | null | undefined, locale: EmailLocale) {
  if (!value) {
    return locale === "zh" ? "暂无到期时间" : "No scheduled expiration";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "zh" ? "暂无到期时间" : "No scheduled expiration";
  }

  if (locale === "zh") {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function renderEmailHtml({
  title,
  preview,
  greeting,
  body,
  labels,
  status,
  expiryText,
  benefits,
  writingUrl,
  profileUrl,
  supportUrl,
}: {
  title: string;
  preview: string;
  greeting: string;
  body: string;
  labels: {
    plan: string;
    status: string;
    expires: string;
    benefits: string;
    writing: string;
    profile: string;
    support: string;
    footer: string;
  };
  status: string;
  expiryText: string;
  benefits: string[];
  writingUrl: string;
  profileUrl: string;
  supportUrl: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f8faf8;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preview)}</span>
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;padding:28px;">
        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(body)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;">${escapeHtml(labels.plan)}</td>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700;">Pro</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;">${escapeHtml(labels.status)}</td>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700;">${escapeHtml(status)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;">${escapeHtml(labels.expires)}</td>
            <td style="padding:10px 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700;">${escapeHtml(expiryText)}</td>
          </tr>
        </table>
        <p style="margin:0 0 10px;font-size:15px;font-weight:700;">${escapeHtml(labels.benefits)}</p>
        <ul style="margin:0 0 24px;padding-left:20px;color:#334155;font-size:15px;line-height:1.7;">
          ${benefits.map((benefit) => `<li>${escapeHtml(benefit)}</li>`).join("")}
        </ul>
        <p style="margin:0 0 8px;font-size:15px;"><a href="${escapeAttribute(writingUrl)}" style="color:#0f766e;font-weight:700;">${escapeHtml(labels.writing)}</a></p>
        <p style="margin:0 0 8px;font-size:15px;"><a href="${escapeAttribute(profileUrl)}" style="color:#0f766e;font-weight:700;">${escapeHtml(labels.profile)}</a></p>
        <p style="margin:0 0 24px;font-size:15px;"><a href="${escapeAttribute(supportUrl)}" style="color:#0f766e;font-weight:700;">${escapeHtml(labels.support)}</a></p>
        <p style="margin:0;border-top:1px solid #e2e8f0;padding-top:16px;font-size:12px;line-height:1.6;color:#64748b;">${escapeHtml(labels.footer)}</p>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}

function getEmailErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "unknown";
  }

  const record = error as Record<string, unknown>;
  const code = record.name ?? record.code ?? record.statusCode ?? record.message;

  return typeof code === "string" || typeof code === "number"
    ? String(code)
    : "unknown";
}
