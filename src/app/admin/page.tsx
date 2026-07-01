import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminConsole } from "@/app/admin/admin-console";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminDashboardData } from "@/server/services/admin-dashboard";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <AdminConsole mode="demo" />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?admin=login_required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return <AdminAccessDenied />;
  }

  if (!env.supabaseServiceRoleKey) {
    return <AdminConfigurationMissing />;
  }

  const data = await getAdminDashboardData();

  return <AdminConsole mode="admin" adminEmail={user.email} data={data} />;
}

function AdminAccessDenied() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="没有后台访问权限"
        description="运营后台仅限 admin 角色使用。普通学生账号可以继续使用学习和练习功能。"
      />

      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>Access restricted</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            如果你是项目管理员，请先在 Supabase 的 profiles 表中将当前账号
            role 设置为 admin。
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard">返回学习看板</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function AdminConfigurationMissing() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="后台服务端密钥未配置"
        description="真实后台 CRUD 需要 Supabase service role key，仅在服务器环境变量中配置，不要暴露到浏览器。"
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Missing SUPABASE_SERVICE_ROLE_KEY</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            请在 Vercel 或本地 `.env.local` 中配置 SUPABASE_SERVICE_ROLE_KEY
            后重新部署。配置后后台会读取真实内容、用户、Prompt 和操作日志。
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
