do $$
begin
  if not exists (
    select 1 from public.writing_tasks
    where task_type = 2
      and topic = 'Education'
      and prompt = 'Some people believe that online learning is more effective than traditional classroom learning. Others think that face-to-face teaching is still the best way to learn. Discuss both views and give your own opinion.'
  ) then
    insert into public.writing_tasks (
      task_type,
      topic,
      prompt,
      band_target,
      sample_answer_band_7,
      sample_answer_band_8,
      sample_answer_band_9,
      scoring_notes,
      source_type,
      status,
      published_at
    )
    values (
      2,
      'Education',
      'Some people believe that online learning is more effective than traditional classroom learning. Others think that face-to-face teaching is still the best way to learn. Discuss both views and give your own opinion.',
      7,
      null,
      null,
      null,
      '[{"title":"Task 2 - Online Learning and Traditional Classrooms"},{"suggested_time_minutes":40},{"minimum_words":250}]'::jsonb,
      'admin_original',
      'published',
      now()
    );
  end if;
end $$;
