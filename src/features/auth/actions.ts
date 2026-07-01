"use server";

import { redirect } from "next/navigation";

import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard?auth=demo");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("email", email);

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard?auth=demo");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("name") ?? "").trim();

  if (!email || !password || !displayName) {
    redirect("/register?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/register?error=weak_password");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${env.nextPublicSiteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect("/register?error=signup_failed");
  }

  if (!data.session) {
    redirect("/login?signup=check_email");
  }

  redirect("/dashboard");
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
    redirectTo: `${env.nextPublicSiteUrl}/auth/callback?next=/profile`,
  });

  if (error) {
    redirect("/forgot-password?error=reset_failed");
  }

  redirect("/login?reset=sent");
}
