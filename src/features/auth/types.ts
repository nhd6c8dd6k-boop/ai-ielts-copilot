export type UserRole = "student" | "admin";

export type SubscriptionPlan = "free" | "pro_monthly" | "pro_yearly";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";
