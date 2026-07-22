"use server";

import { redirect } from "next/navigation";

import {
  appendInternalSearchParam,
  getSafeRedirectPath,
} from "@/lib/auth/redirect";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const redirectTo = getSafeRedirectPath(
    String(formData.get("redirect") ?? ""),
    "/dashboard",
  );
  const redirectParam = `redirect=${encodeURIComponent(redirectTo)}`;

  if (!isSupabaseConfigured()) {
    redirect(appendInternalSearchParam(redirectTo, "auth", "demo"));
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=missing_fields&${redirectParam}`);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=invalid_credentials&${redirectParam}`);
  }

  if (data.user?.id && env.supabaseServiceRoleKey) {
    await createSupabaseAdminClient()
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  redirect(redirectTo);
}

export async function signUpAction(formData: FormData) {
  const redirectTo = getSafeRedirectPath(
    String(formData.get("redirect") ?? ""),
    "/dashboard",
  );
  const redirectParam = `redirect=${encodeURIComponent(redirectTo)}`;

  if (!isSupabaseConfigured()) {
    redirect(appendInternalSearchParam(redirectTo, "auth", "demo"));
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("name") ?? "").trim();

  if (!email || !password || !displayName) {
    redirect(`/register?error=missing_fields&${redirectParam}`);
  }

  if (password.length < 8) {
    redirect(`/register?error=weak_password&${redirectParam}`);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${env.nextPublicSiteUrl}/auth/callback?next=${encodeURIComponent(
        redirectTo,
      )}`,
    },
  });

  if (error) {
    redirect(`/register?error=signup_failed&${redirectParam}`);
  }

  if (!data.session) {
    redirect(`/login?signup=check_email&${redirectParam}`);
  }

  redirect(redirectTo);
}

export async function resetPasswordAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?reset=demo");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=missing_email");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.nextPublicSiteUrl}/reset-password`,
  });

  if (error) {
    redirect("/forgot-password?error=reset_failed");
  }

  redirect("/login?reset=sent");
}
