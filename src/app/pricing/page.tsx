import { Apple, Check, Globe2, ShieldCheck, Smartphone } from "lucide-react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/features/payments/checkout-button";

const plans = [
  {
    name: "Free",
    plan: "free",
    price: "¥0",
    cadence: "",
    description: "适合先体验核心功能。",
    features: [
      "Reading 每天 3 次",
      "Listening 每天 2 次",
      "Writing 题目每天 3 次",
      "写作批改每天 2 次",
    ],
  },
  {
    name: "Pro Monthly",
    plan: "pro_monthly",
    price: "¥49",
    cadence: "/ 月",
    description: "适合正在备考的学生。",
    features: [
      "AI 功能每天最多 100 次",
      "完整写作预估评分",
      "自适应学习建议",
      "结果复盘和弱项追踪",
    ],
  },
  {
    name: "Pro Yearly",
    plan: "pro_yearly",
    price: "¥399",
    cadence: "/ 年",
    description: "适合长期系统备考。",
    features: [
      "年度更优惠",
      "AI 功能每天最多 100 次",
      "完整学习历史",
      "优先生成队列",
      "后续新功能优先体验",
    ],
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge>人民币定价 · 国内支付优先</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            适合中国雅思考生的订阅方案
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            国内用户优先使用微信支付或支付宝，iPhone/Safari 用户可使用
            Apple Pay 快捷支付，海外用户保留 Stripe 国际支付。MVP
            阶段建议采用月卡/年卡一次性购买，减少自动续费合规复杂度。
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {plan.description}
                  </p>
                </div>
                {plan.plan === "pro_yearly" ? (
                  <Badge className="bg-teal-50 text-teal-800">推荐</Badge>
                ) : null}
              </div>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-semibold tracking-tight text-slate-950">
                  {plan.price}
                </span>
                {plan.cadence ? (
                  <span className="pb-1 text-sm text-slate-500">
                    {plan.cadence}
                  </span>
                ) : null}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-slate-600">
                    <Check
                      className="mt-0.5 h-4 w-4 text-teal-700"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-2">
                {plan.plan === "free" ? (
                  <CheckoutButton plan={plan.plan}>免费开始</CheckoutButton>
                ) : (
                  <>
                    <CheckoutButton plan={plan.plan} channel="wechat">
                      微信支付
                    </CheckoutButton>
                    <CheckoutButton
                      plan={plan.plan}
                      channel="alipay"
                      variant="outline"
                    >
                      支付宝
                    </CheckoutButton>
                    <CheckoutButton
                      plan={plan.plan}
                      channel="apple_pay"
                      variant="secondary"
                    >
                      Apple Pay
                    </CheckoutButton>
                    <CheckoutButton
                      plan={plan.plan}
                      channel="stripe"
                      variant="ghost"
                    >
                      国际卡 / Stripe
                    </CheckoutButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "国内转化优先",
              description: "人民币价格和微信/支付宝更符合中国学生的购买习惯。",
              icon: Smartphone,
            },
            {
              title: "国际化保留",
              description: "Stripe 继续作为海外学生和国际卡支付通道。",
              icon: Globe2,
            },
            {
              title: "快捷支付补充",
              description: "Apple Pay 适合 iPhone、Safari 和已绑定卡的用户快速付款。",
              icon: Apple,
            },
            {
              title: "合规渐进",
              description: "先做月卡/年卡购买，后续再评估自动续费和发票流程。",
              icon: ShieldCheck,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="mt-4 text-sm font-semibold text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
