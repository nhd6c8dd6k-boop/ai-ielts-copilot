import { z } from "zod";

import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const accountabilityBetaActiveLimit = 10;
const defaultTimezone = "UTC";

export type AccountabilitySkill =
  | "writing"
  | "reading"
  | "listening"
  | "speaking"
  | "not_sure";
export type AccountabilityTaskSkill =
  | "writing"
  | "reading"
  | "listening"
  | "speaking"
  | "review";
export type AccountabilityEnrollmentStatus =
  | "waitlisted"
  | "active"
  | "completed"
  | "withdrawn";
export type AccountabilityReminderPreference = "crisp" | "email" | "none";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

export const accountabilityJoinSchema = z
  .object({
    targetBand: z.enum(["6.0", "6.5", "7.0", "7.5", "8.0+"]),
    examDate: z.string().date().nullable().optional(),
    examDateUnknown: z.boolean().default(false),
    weakestSkill: z.enum([
      "writing",
      "reading",
      "listening",
      "speaking",
      "not_sure",
    ]),
    dailyMinutes: z.union([
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
    ]),
    reminderPreference: z.enum(["crisp", "email", "none"]),
  })
  .refine((input) => input.examDateUnknown || Boolean(input.examDate), {
    path: ["examDate"],
    message: "Choose an exam date or select that you have not booked yet.",
  });

export const accountabilityFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  helpedMost: z.string().trim().max(1000).optional().default(""),
  difficulty: z.string().trim().max(1000).optional().default(""),
  willingness: z.enum(["yes", "maybe", "no"]),
});

export type AccountabilityJoinInput = z.infer<typeof accountabilityJoinSchema>;

export type AccountabilityTask = {
  id: string;
  dayNumber: number;
  skill: AccountabilityTaskSkill;
  taskType: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  targetPath: string;
  sourceContentId: string | null;
  completionMode: "manual" | "attempt";
  completedAt: string | null;
  linkedAttemptId: string | null;
  locked: boolean;
  status: "completed" | "today" | "available" | "upcoming";
};

export type AccountabilityEnrollment = {
  id: string;
  userId: string;
  status: AccountabilityEnrollmentStatus;
  targetBand: string;
  examDate: string | null;
  examDateUnknown: boolean;
  weakestSkill: AccountabilitySkill;
  dailyMinutes: number;
  reminderPreference: AccountabilityReminderPreference;
  startedAt: string | null;
  completedAt: string | null;
  currentDay: number;
  feedbackRating: number | null;
  feedbackText: string | null;
  feedbackDifficulty: string | null;
  feedbackWillingness: "yes" | "maybe" | "no" | null;
  reminderSentAt: string | null;
  reminderChannel: AccountabilityReminderPreference | null;
  createdAt: string;
  updatedAt: string;
  tasks: AccountabilityTask[];
  todayTask: AccountabilityTask | null;
  completedCount: number;
  unlockedDay: number;
  isFeatureEnabled: boolean;
};

export type AdminAccountabilityParticipant = {
  id: string;
  userId: string;
  email: string;
  status: AccountabilityEnrollmentStatus;
  targetBand: string;
  examDate: string | null;
  weakestSkill: AccountabilitySkill;
  dailyMinutes: number;
  reminderPreference: AccountabilityReminderPreference;
  reminderSentAt: string | null;
  startedAt: string | null;
  currentDay: number;
  completedTasks: number;
  taskCount: number;
  lastActivityAt: string | null;
  feedbackRating: number | null;
  tasks: AccountabilityTask[];
  reminderMessage: string;
};

export type PublishedContent = {
  writing: ContentItem[];
  reading: ContentItem[];
  listening: ContentItem[];
  speaking: ContentItem[];
};

type ContentItem = {
  id: string | null;
  title: string;
  path: string;
};

type PlannedTask = {
  day_number: number;
  skill: AccountabilityTaskSkill;
  task_type: string;
  title: string;
  description: string;
  estimated_minutes: number;
  target_path: string;
  source_content_id: string | null;
  completion_mode: "manual" | "attempt";
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  status: AccountabilityEnrollmentStatus;
  target_band: string;
  exam_date: string | null;
  exam_date_unknown: boolean;
  weakest_skill: AccountabilitySkill;
  daily_minutes: number;
  reminder_preference: AccountabilityReminderPreference;
  started_at: string | null;
  completed_at: string | null;
  current_day: number;
  feedback_rating: number | null;
  feedback_text: string | null;
  feedback_difficulty: string | null;
  feedback_willingness: "yes" | "maybe" | "no" | null;
  reminder_sent_at: string | null;
  reminder_channel: AccountabilityReminderPreference | null;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  enrollment_id: string;
  day_number: number;
  skill: AccountabilityTaskSkill;
  task_type: string;
  title: string;
  description: string;
  estimated_minutes: number;
  target_path: string;
  source_content_id: string | null;
  completion_mode: "manual" | "attempt";
  completed_at: string | null;
  linked_attempt_id: string | null;
};

export function isAccountabilityBetaEnabled() {
  const value = env.accountabilityBetaEnabled?.trim().toLowerCase();

  if (!value) {
    return process.env.NODE_ENV !== "production";
  }

  return ["1", "true", "yes", "on"].includes(value);
}

export async function getAccountabilityBetaState(
  admin: SupabaseAdmin,
  userId: string,
) {
  if (!isAccountabilityBetaEnabled()) {
    return { enabled: false, enrollment: null };
  }

  const enrollment = await getUserEnrollment(admin, userId);

  return {
    enabled: true,
    enrollment: enrollment ? await hydrateEnrollment(admin, enrollment) : null,
  };
}

export async function joinAccountabilityBeta(
  admin: SupabaseAdmin,
  userId: string,
  input: AccountabilityJoinInput,
) {
  if (!isAccountabilityBetaEnabled()) {
    throw new Error("accountability_beta_disabled");
  }

  const content = await getPublishedContent(admin);
  const plannedTasks = buildSevenDayPlan(input, content);
  const { data, error } = await admin.rpc("join_accountability_beta", {
    p_user_id: userId,
    p_target_band: input.targetBand,
    p_exam_date: input.examDateUnknown ? null : input.examDate ?? null,
    p_exam_date_unknown: input.examDateUnknown,
    p_weakest_skill: input.weakestSkill,
    p_daily_minutes: input.dailyMinutes,
    p_reminder_preference: input.reminderPreference,
    p_tasks: plannedTasks,
    p_active_limit: accountabilityBetaActiveLimit,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = Array.isArray(data) ? data[0] : data;
  const enrollmentId = result?.enrollment_id as string | undefined;

  if (!enrollmentId) {
    throw new Error("accountability_beta_join_failed");
  }

  const enrollment = await getEnrollmentById(admin, enrollmentId);

  if (!enrollment) {
    throw new Error("accountability_beta_enrollment_not_found");
  }

  return hydrateEnrollment(admin, enrollment);
}

export async function completeAccountabilityTask(
  admin: SupabaseAdmin,
  userId: string,
  taskId: string,
) {
  const enrollment = await getUserEnrollment(admin, userId);

  if (!enrollment || enrollment.status !== "active") {
    throw new Error("accountability_beta_no_active_enrollment");
  }

  const task = await getTaskForEnrollment(admin, enrollment.id, taskId);

  if (!task) {
    throw new Error("accountability_beta_task_not_found");
  }

  if (task.completed_at) {
    return hydrateEnrollment(admin, enrollment);
  }

  const unlockedDay = getUnlockedDay(enrollment.started_at);

  if (task.day_number > unlockedDay) {
    throw new Error("accountability_beta_task_locked");
  }

  const { error } = await admin
    .from("accountability_beta_tasks")
    .update({
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", task.id)
    .eq("enrollment_id", enrollment.id)
    .is("completed_at", null);

  if (error) {
    throw new Error(error.message);
  }

  await maybeCompleteEnrollment(admin, enrollment.id);

  const nextEnrollment = await getEnrollmentById(admin, enrollment.id);

  if (!nextEnrollment) {
    throw new Error("accountability_beta_enrollment_not_found");
  }

  return hydrateEnrollment(admin, nextEnrollment);
}

export async function withdrawAccountabilityEnrollment(
  admin: SupabaseAdmin,
  userId: string,
) {
  const enrollment = await getUserEnrollment(admin, userId);

  if (!enrollment || !["active", "waitlisted"].includes(enrollment.status)) {
    throw new Error("accountability_beta_no_open_enrollment");
  }

  const { error } = await admin
    .from("accountability_beta_enrollments")
    .update({
      status: "withdrawn",
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollment.id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const updated = await getEnrollmentById(admin, enrollment.id);

  if (!updated) {
    throw new Error("accountability_beta_enrollment_not_found");
  }

  return hydrateEnrollment(admin, updated);
}

export async function submitAccountabilityFeedback(
  admin: SupabaseAdmin,
  userId: string,
  input: z.infer<typeof accountabilityFeedbackSchema>,
) {
  const enrollment = await getUserEnrollment(admin, userId);

  if (!enrollment || !["active", "completed"].includes(enrollment.status)) {
    throw new Error("accountability_beta_no_enrollment");
  }

  const { error } = await admin
    .from("accountability_beta_enrollments")
    .update({
      status: "completed",
      completed_at: enrollment.completed_at ?? new Date().toISOString(),
      feedback_rating: input.rating,
      feedback_text: input.helpedMost,
      feedback_difficulty: input.difficulty,
      feedback_willingness: input.willingness,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollment.id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const updated = await getEnrollmentById(admin, enrollment.id);

  if (!updated) {
    throw new Error("accountability_beta_enrollment_not_found");
  }

  return hydrateEnrollment(admin, updated);
}

export async function markAccountabilityAttemptCompleted({
  admin,
  userId,
  skill,
  contentId,
  attemptId,
}: {
  admin: SupabaseAdmin;
  userId: string;
  skill: "reading" | "listening" | "writing";
  contentId: string;
  attemptId: string;
}) {
  if (!isAccountabilityBetaEnabled()) {
    return;
  }

  const enrollment = await getUserEnrollment(admin, userId);

  if (!enrollment || enrollment.status !== "active") {
    return;
  }

  const unlockedDay = getUnlockedDay(enrollment.started_at);
  const { data: tasks } = await admin
    .from("accountability_beta_tasks")
    .select("id,day_number")
    .eq("enrollment_id", enrollment.id)
    .eq("skill", skill)
    .eq("completion_mode", "attempt")
    .eq("source_content_id", contentId)
    .is("completed_at", null)
    .lte("day_number", unlockedDay)
    .order("day_number", { ascending: true })
    .limit(1);
  const task = tasks?.[0] as Pick<TaskRow, "id" | "day_number"> | undefined;

  if (!task) {
    return;
  }

  await admin
    .from("accountability_beta_tasks")
    .update({
      completed_at: new Date().toISOString(),
      linked_attempt_id: attemptId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", task.id)
    .is("completed_at", null);
  await maybeCompleteEnrollment(admin, enrollment.id);
}

export async function getAdminAccountabilityParticipants(admin: SupabaseAdmin) {
  const { data: enrollments, error } = await admin
    .from("accountability_beta_enrollments")
    .select(
      "id,user_id,status,target_band,exam_date,exam_date_unknown,weakest_skill,daily_minutes,reminder_preference,started_at,completed_at,current_day,feedback_rating,feedback_text,feedback_difficulty,feedback_willingness,reminder_sent_at,reminder_channel,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (enrollments ?? []) as EnrollmentRow[];
  const userIds = rows.map((row) => row.user_id);
  const [{ data: users }, { data: tasks }] = await Promise.all([
    userIds.length
      ? admin.from("users").select("id,email").in("id", userIds)
      : Promise.resolve({ data: [] }),
    rows.length
      ? admin
          .from("accountability_beta_tasks")
          .select(
            "id,enrollment_id,day_number,skill,task_type,title,description,estimated_minutes,target_path,source_content_id,completion_mode,completed_at,linked_attempt_id",
          )
          .in(
            "enrollment_id",
            rows.map((row) => row.id),
          )
          .order("day_number", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);
  const emailByUserId = new Map(
    ((users ?? []) as Array<{ id: string; email: string | null }>).map(
      (user) => [user.id, user.email ?? "(missing email)"],
    ),
  );
  const tasksByEnrollmentId = new Map<string, TaskRow[]>();

  for (const task of ((tasks ?? []) as TaskRow[])) {
    const existing = tasksByEnrollmentId.get(task.enrollment_id) ?? [];
    existing.push(task);
    tasksByEnrollmentId.set(task.enrollment_id, existing);
  }

  return rows.map((row): AdminAccountabilityParticipant => {
    const rowTasks = tasksByEnrollmentId.get(row.id) ?? [];
    const hydratedTasks = rowTasks.map((task) =>
      mapTaskRow(task, getUnlockedDay(row.started_at)),
    );
    const completedTasks = hydratedTasks.filter((task) => task.completedAt).length;
    const lastActivityAt =
      hydratedTasks
        .map((task) => task.completedAt)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1) ??
      row.updated_at ??
      row.created_at;
    const todayTask =
      getTodayTask(hydratedTasks) ??
      hydratedTasks.find((task) => !task.completedAt) ??
      hydratedTasks[0] ??
      null;

    return {
      id: row.id,
      userId: row.user_id,
      email: emailByUserId.get(row.user_id) ?? "(missing email)",
      status: row.status,
      targetBand: row.target_band,
      examDate: row.exam_date,
      weakestSkill: row.weakest_skill,
      dailyMinutes: row.daily_minutes,
      reminderPreference: row.reminder_preference,
      reminderSentAt: row.reminder_sent_at,
      startedAt: row.started_at,
      currentDay: getUnlockedDay(row.started_at),
      completedTasks,
      taskCount: hydratedTasks.length,
      lastActivityAt,
      feedbackRating: row.feedback_rating,
      tasks: hydratedTasks,
      reminderMessage: buildReminderMessage({
        email: emailByUserId.get(row.user_id) ?? "",
        task: todayTask,
      }),
    };
  });
}

export async function activateWaitlistedAccountabilityUser(
  admin: SupabaseAdmin,
  enrollmentId: string,
) {
  const { data: enrollment } = await admin
    .from("accountability_beta_enrollments")
    .select(
      "id,user_id,status,target_band,exam_date,exam_date_unknown,weakest_skill,daily_minutes,reminder_preference,started_at,completed_at,current_day,feedback_rating,feedback_text,feedback_difficulty,feedback_willingness,reminder_sent_at,reminder_channel,created_at,updated_at",
    )
    .eq("id", enrollmentId)
    .maybeSingle();
  const row = enrollment as EnrollmentRow | null;

  if (!row || row.status !== "waitlisted") {
    throw new Error("accountability_beta_waitlist_not_found");
  }

  const content = await getPublishedContent(admin);
  const plannedTasks = buildSevenDayPlan(
    {
      targetBand: row.target_band as AccountabilityJoinInput["targetBand"],
      examDate: row.exam_date,
      examDateUnknown: row.exam_date_unknown,
      weakestSkill: row.weakest_skill,
      dailyMinutes: row.daily_minutes as AccountabilityJoinInput["dailyMinutes"],
      reminderPreference: row.reminder_preference,
    },
    content,
  );

  const { data, error } = await admin.rpc(
    "activate_accountability_beta_waitlisted",
    {
      p_enrollment_id: enrollmentId,
      p_tasks: plannedTasks,
      p_active_limit: accountabilityBetaActiveLimit,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const result = Array.isArray(data) ? data[0] : data;
  const reason = result?.reason as string | undefined;

  if (reason === "full") {
    throw new Error("accountability_beta_full");
  }

  if (reason !== "activated") {
    throw new Error("accountability_beta_waitlist_not_found");
  }
}

export async function markAccountabilityReminderSent(
  admin: SupabaseAdmin,
  enrollmentId: string,
  adminUserId: string,
  channel: AccountabilityReminderPreference,
) {
  const { error } = await admin
    .from("accountability_beta_enrollments")
    .update({
      reminder_sent_at: new Date().toISOString(),
      reminder_channel: channel,
      reminder_sent_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function logAccountabilityAdminAction(
  admin: SupabaseAdmin,
  adminUserId: string,
  action: string,
  enrollmentId: string,
  metadata: Record<string, unknown> = {},
) {
  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: "accountability_beta",
    target_id: enrollmentId,
    metadata,
  });
}

async function getPublishedContent(admin: SupabaseAdmin): Promise<PublishedContent> {
  const [writing, reading, listening, speaking] = await Promise.all([
    admin
      .from("writing_tasks")
      .select("id,slug,title,topic,task_type,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("reading_sets")
      .select("id,title,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("listening_sets")
      .select("id,title,published_at,created_at")
      .eq("status", "published")
      .eq("audio_status", "ready")
      .not("audio_url", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("speaking_topics")
      .select("id,slug,title,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    writing: ((writing.data ?? []) as Array<{
      id: string;
      slug: string;
      title: string | null;
      topic: string;
      task_type: number;
    }>).map((task) => ({
      id: task.id,
      title: task.title ?? `Writing Task ${task.task_type}: ${task.topic}`,
      path: `/practice/writing/${task.slug}`,
    })),
    reading: ((reading.data ?? []) as Array<{ id: string; title: string }>).map(
      (set) => ({
        id: set.id,
        title: set.title,
        path: `/practice/reading/${set.id}`,
      }),
    ),
    listening: ((listening.data ?? []) as Array<{
      id: string;
      title: string;
    }>).map((set) => ({
      id: set.id,
      title: set.title,
      path: `/practice/listening/${set.id}`,
    })),
    speaking: ((speaking.data ?? []) as Array<{
      id: string;
      slug: string;
      title: string;
    }>).map((topic) => ({
      id: topic.id,
      title: topic.title,
      path: `/practice/speaking/${topic.slug}`,
    })),
  };
}

function buildSevenDayPlan(
  input: AccountabilityJoinInput,
  content: PublishedContent,
): PlannedTask[] {
  const builders: Record<AccountabilitySkill, () => PlannedTask[]> = {
    writing: () => buildWritingPlan(input.dailyMinutes, content),
    reading: () => buildReadingPlan(input.dailyMinutes, content),
    listening: () => buildListeningPlan(input.dailyMinutes, content),
    speaking: () => buildSpeakingPlan(input.dailyMinutes, content),
    not_sure: () => buildBalancedPlan(input.dailyMinutes, content),
  };

  return builders[input.weakestSkill]();
}

function buildWritingPlan(minutes: number, content: PublishedContent) {
  const writing = pick(content.writing, 0, "/practice/writing", "Writing practice");
  const writingSecond = pick(content.writing, 1, writing.path, writing.title);
  const reading = pick(content.reading, 0, "/practice/reading", "Reading practice");

  return [
    attemptTask(1, "writing", "diagnostic", "Complete one Writing Task 2 response.", "Submit one IELTS Writing response and read the criteria-based feedback.", minutes, writing),
    manualTask(2, "writing", "review_feedback", "Rewrite two weaker sentences.", "Review your Sentence Improvements and rewrite two sentences in a stronger form.", Math.min(minutes, 30), "/practice/writing"),
    attemptTask(3, "reading", "secondary_skill", "Complete one Reading practice set.", "Build balance by completing one IELTS-style Reading passage.", minutes, reading),
    attemptTask(4, "writing", "focused_practice", "Complete another Writing task.", "Choose a Writing Task 1 or Task 2 prompt and complete a focused response.", minutes, writingSecond),
    manualTask(5, "writing", "review_introduction", "Write a stronger introduction.", "Review your last Writing feedback and draft a stronger introduction or overview.", Math.min(minutes, 30), "/practice/writing"),
    attemptTask(6, "writing", "timed_task", "Complete one timed Writing task.", "Set a timer and complete one Writing task without pausing.", minutes, writingSecond),
    manualTask(7, "review", "reflection", "Review your Writing progress.", "Choose one Writing weakness, rewrite a short paragraph, and write what improved.", Math.min(minutes, 30), "/accountability-beta"),
  ];
}

function buildReadingPlan(minutes: number, content: PublishedContent) {
  const reading = pick(content.reading, 0, "/practice/reading", "Reading practice");
  const readingSecond = pick(content.reading, 1, reading.path, reading.title);
  const listening = pick(content.listening, 0, "/practice/listening", "Listening practice");

  return [
    attemptTask(1, "reading", "diagnostic", "Complete one Reading passage.", "Finish one IELTS-style Reading passage and check your result.", minutes, reading),
    manualTask(2, "reading", "review_incorrect", "Review your incorrect Reading answers.", "Review your incorrect answers and note one recurring mistake.", Math.min(minutes, 30), "/practice/reading"),
    attemptTask(3, "listening", "secondary_skill", "Complete one Listening practice set.", "Build balance with one IELTS-style Listening practice set.", minutes, listening),
    attemptTask(4, "reading", "focused_practice", "Complete another Reading passage.", "Complete a second Reading practice set with careful timing.", minutes, readingSecond),
    manualTask(5, "reading", "question_type_review", "Review one recurring Reading mistake.", "Look back at incorrect answers and write down one pattern to avoid tomorrow.", Math.min(minutes, 30), "/practice/reading"),
    attemptTask(6, "reading", "timed_task", "Complete one timed Reading practice.", "Set a timer and complete one Reading set without pausing.", minutes, readingSecond),
    manualTask(7, "review", "reflection", "Complete a final Reading review.", "Review your latest Reading set and write one action you will keep practising.", Math.min(minutes, 30), "/accountability-beta"),
  ];
}

function buildListeningPlan(minutes: number, content: PublishedContent) {
  const listening = pick(content.listening, 0, "/practice/listening", "Listening practice");
  const listeningSecond = pick(content.listening, 1, listening.path, listening.title);
  const reading = pick(content.reading, 0, "/practice/reading", "Reading practice");

  return [
    attemptTask(1, "listening", "diagnostic", "Complete one Listening practice set.", "Finish one IELTS-style Listening set and review your result.", minutes, listening),
    manualTask(2, "listening", "transcript_review", "Review the transcript and incorrect answers.", "Replay difficult parts and compare them with the transcript after submitting.", Math.min(minutes, 30), "/practice/listening"),
    attemptTask(3, "reading", "secondary_skill", "Complete one Reading passage.", "Build balance with one IELTS-style Reading passage.", minutes, reading),
    attemptTask(4, "listening", "focused_practice", "Complete another Listening set.", "Complete a second Listening practice set and focus on keywords.", minutes, listeningSecond),
    manualTask(5, "listening", "keyword_review", "Replay one difficult section.", "Replay one difficult section and note the keywords you missed.", Math.min(minutes, 30), "/practice/listening"),
    attemptTask(6, "listening", "timed_task", "Complete one timed Listening practice.", "Complete one Listening set in one sitting.", minutes, listeningSecond),
    manualTask(7, "review", "reflection", "Complete a final Listening review.", "Review your latest Listening result and write one listening habit to keep.", Math.min(minutes, 30), "/accountability-beta"),
  ];
}

function buildSpeakingPlan(minutes: number, content: PublishedContent) {
  const speaking = pick(content.speaking, 0, "/practice/speaking", "Speaking preparation");
  const speakingSecond = pick(content.speaking, 1, speaking.path, speaking.title);

  return [
    manualTask(1, "speaking", "part_2_cue_card", "Prepare and answer one Part 2 cue card.", "Use the cue card points, prepare for one minute, then answer aloud.", Math.min(minutes, 30), speaking.path, speaking.id),
    manualTask(2, "speaking", "sample_review", "Review one Band 7 sample answer.", "Note three useful phrases from a Band 7 sample answer.", Math.min(minutes, 30), speaking.path, speaking.id),
    attemptTask(3, "reading", "secondary_skill", "Complete one Reading practice set.", "Build balance with one IELTS-style Reading passage.", minutes, pick(content.reading, 0, "/practice/reading", "Reading practice")),
    manualTask(4, "speaking", "part_1_answers", "Prepare three Part 1 answers.", "Write or speak three short Part 1 answers using natural phrases.", Math.min(minutes, 30), speakingSecond.path, speakingSecond.id),
    manualTask(5, "speaking", "part_3_discussion", "Prepare one Part 3 discussion topic.", "Choose one discussion question and practise giving an opinion with a reason and example.", Math.min(minutes, 30), speakingSecond.path, speakingSecond.id),
    manualTask(6, "speaking", "spoken_repeat", "Practise one answer aloud for two minutes.", "Repeat one answer aloud and notice where your ideas become unclear.", Math.min(minutes, 30), speaking.path, speaking.id),
    manualTask(7, "review", "reflection", "Repeat your Day 1 cue card.", "Answer the Day 1 cue card again and write what improved.", Math.min(minutes, 30), "/accountability-beta"),
  ];
}

function buildBalancedPlan(minutes: number, content: PublishedContent) {
  return [
    attemptTask(1, "writing", "writing_baseline", "Complete one Writing task.", "Start with one Writing response to understand your current baseline.", minutes, pick(content.writing, 0, "/practice/writing", "Writing practice")),
    attemptTask(2, "reading", "reading_baseline", "Complete one Reading passage.", "Complete one Reading practice set and review incorrect answers.", minutes, pick(content.reading, 0, "/practice/reading", "Reading practice")),
    attemptTask(3, "listening", "listening_baseline", "Complete one Listening set.", "Complete one Listening practice set and review missed keywords.", minutes, pick(content.listening, 0, "/practice/listening", "Listening practice")),
    manualTask(4, "speaking", "speaking_preparation", "Prepare one Speaking topic.", "Choose one Speaking topic and practise one sample answer aloud.", Math.min(minutes, 30), pick(content.speaking, 0, "/practice/speaking", "Speaking preparation").path),
    manualTask(5, "review", "review_patterns", "Review your first three tasks.", "Write down one recurring mistake and one habit you want to keep.", Math.min(minutes, 30), "/accountability-beta"),
    attemptTask(6, "writing", "timed_available_task", "Complete one timed Writing task.", "Choose one skill to practise under time pressure. Writing is suggested because it gives the clearest feedback loop.", minutes, pick(content.writing, 1, "/practice/writing", "Writing practice")),
    manualTask(7, "review", "reflection", "Choose one skill and reflect.", "Repeat one task or review one result, then write what helped most this week.", Math.min(minutes, 30), "/accountability-beta"),
  ];
}

function attemptTask(
  day: number,
  skill: AccountabilityTaskSkill,
  taskType: string,
  title: string,
  description: string,
  minutes: number,
  content: ContentItem,
): PlannedTask {
  return {
    day_number: day,
    skill,
    task_type: taskType,
    title,
    description,
    estimated_minutes: minutes,
    target_path: content.path,
    source_content_id: content.id,
    completion_mode: "attempt",
  };
}

function manualTask(
  day: number,
  skill: AccountabilityTaskSkill,
  taskType: string,
  title: string,
  description: string,
  minutes: number,
  targetPath: string,
  sourceContentId: string | null = null,
): PlannedTask {
  return {
    day_number: day,
    skill,
    task_type: taskType,
    title,
    description,
    estimated_minutes: minutes,
    target_path: targetPath,
    source_content_id: sourceContentId,
    completion_mode: "manual",
  };
}

function pick(items: ContentItem[], index: number, fallbackPath: string, fallbackTitle: string) {
  return items[index % Math.max(items.length, 1)] ?? {
    id: null,
    title: fallbackTitle,
    path: fallbackPath,
  };
}

export function buildAccountabilityPlanForTest(
  input: AccountabilityJoinInput,
  content: PublishedContent,
) {
  return buildSevenDayPlan(input, content);
}

export function getAccountabilityUnlockedDayForTest(startedAt: string | null) {
  return getUnlockedDay(startedAt);
}

async function getUserEnrollment(admin: SupabaseAdmin, userId: string) {
  const { data, error } = await admin
    .from("accountability_beta_enrollments")
    .select(
      "id,user_id,status,target_band,exam_date,exam_date_unknown,weakest_skill,daily_minutes,reminder_preference,started_at,completed_at,current_day,feedback_rating,feedback_text,feedback_difficulty,feedback_willingness,reminder_sent_at,reminder_channel,created_at,updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as EnrollmentRow | null;
}

async function getEnrollmentById(admin: SupabaseAdmin, enrollmentId: string) {
  const { data, error } = await admin
    .from("accountability_beta_enrollments")
    .select(
      "id,user_id,status,target_band,exam_date,exam_date_unknown,weakest_skill,daily_minutes,reminder_preference,started_at,completed_at,current_day,feedback_rating,feedback_text,feedback_difficulty,feedback_willingness,reminder_sent_at,reminder_channel,created_at,updated_at",
    )
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as EnrollmentRow | null;
}

async function hydrateEnrollment(
  admin: SupabaseAdmin,
  enrollment: EnrollmentRow,
): Promise<AccountabilityEnrollment> {
  const { data, error } = await admin
    .from("accountability_beta_tasks")
    .select(
      "id,enrollment_id,day_number,skill,task_type,title,description,estimated_minutes,target_path,source_content_id,completion_mode,completed_at,linked_attempt_id",
    )
    .eq("enrollment_id", enrollment.id)
    .order("day_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const unlockedDay = getUnlockedDay(enrollment.started_at);
  const tasks = ((data ?? []) as TaskRow[]).map((task) =>
    mapTaskRow(task, unlockedDay),
  );
  const completedCount = tasks.filter((task) => task.completedAt).length;
  const todayTask = getTodayTask(tasks);

  return {
    id: enrollment.id,
    userId: enrollment.user_id,
    status: enrollment.status,
    targetBand: enrollment.target_band,
    examDate: enrollment.exam_date,
    examDateUnknown: enrollment.exam_date_unknown,
    weakestSkill: enrollment.weakest_skill,
    dailyMinutes: enrollment.daily_minutes,
    reminderPreference: enrollment.reminder_preference,
    startedAt: enrollment.started_at,
    completedAt: enrollment.completed_at,
    currentDay: unlockedDay,
    feedbackRating: enrollment.feedback_rating,
    feedbackText: enrollment.feedback_text,
    feedbackDifficulty: enrollment.feedback_difficulty,
    feedbackWillingness: enrollment.feedback_willingness,
    reminderSentAt: enrollment.reminder_sent_at,
    reminderChannel: enrollment.reminder_channel,
    createdAt: enrollment.created_at,
    updatedAt: enrollment.updated_at,
    tasks,
    todayTask,
    completedCount,
    unlockedDay,
    isFeatureEnabled: true,
  };
}

function mapTaskRow(task: TaskRow, unlockedDay: number): AccountabilityTask {
  const locked = task.day_number > unlockedDay;
  const status = task.completed_at
    ? "completed"
    : locked
      ? "upcoming"
      : task.day_number === unlockedDay
        ? "today"
        : "available";

  return {
    id: task.id,
    dayNumber: task.day_number,
    skill: task.skill,
    taskType: task.task_type,
    title: task.title,
    description: task.description,
    estimatedMinutes: task.estimated_minutes,
    targetPath: task.target_path,
    sourceContentId: task.source_content_id,
    completionMode: task.completion_mode,
    completedAt: task.completed_at,
    linkedAttemptId: task.linked_attempt_id,
    locked,
    status,
  };
}

async function getTaskForEnrollment(
  admin: SupabaseAdmin,
  enrollmentId: string,
  taskId: string,
) {
  const { data, error } = await admin
    .from("accountability_beta_tasks")
    .select(
      "id,enrollment_id,day_number,skill,task_type,title,description,estimated_minutes,target_path,source_content_id,completion_mode,completed_at,linked_attempt_id",
    )
    .eq("id", taskId)
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TaskRow | null;
}

function getTodayTask(tasks: AccountabilityTask[]) {
  return (
    tasks.find((task) => !task.completedAt && !task.locked) ??
    tasks.find((task) => task.status === "today") ??
    null
  );
}

function getUnlockedDay(startedAt: string | null) {
  if (!startedAt) {
    return 0;
  }

  const start = startOfUtcDay(new Date(startedAt));
  const now = startOfUtcDay(new Date());
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000);

  return Math.min(Math.max(diffDays + 1, 1), 7);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function maybeCompleteEnrollment(admin: SupabaseAdmin, enrollmentId: string) {
  const { count } = await admin
    .from("accountability_beta_tasks")
    .select("id", { count: "exact", head: true })
    .eq("enrollment_id", enrollmentId)
    .is("completed_at", null);

  if (count === 0) {
    await admin
      .from("accountability_beta_enrollments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollmentId)
      .eq("status", "active");
  }
}

function buildReminderMessage({
  email,
  task,
}: {
  email: string;
  task: AccountabilityTask | null;
}) {
  const firstName = email.split("@")[0]?.split(/[._-]/)[0] || "there";
  const taskTitle = task?.title ?? "Open your 7-day IELTS plan.";
  const estimated = task ? `\n\nEstimated time: ${task.estimatedMinutes} minutes.` : "";

  return `Hi ${firstName}, your IELTS task for today is ready:\n\n${taskTitle}.${estimated}\n\nOpen your plan:\n${absoluteUrl("/accountability-beta")}`;
}

export function getAccountabilityDefaultTimezone() {
  return defaultTimezone;
}
