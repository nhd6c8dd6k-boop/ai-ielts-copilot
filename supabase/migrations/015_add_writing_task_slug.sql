alter table public.writing_tasks
add column if not exists slug text;

do $$
declare
  task record;
  title_slug text;
  topic_slug text;
  base_slug text;
  candidate_slug text;
  suffix int;
begin
  for task in
    select id, title, topic, task_type, created_at
    from public.writing_tasks
    where slug is null or btrim(slug) = ''
    order by created_at, id
  loop
    title_slug := regexp_replace(
      lower(coalesce(nullif(btrim(task.title), ''), '')),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    title_slug := regexp_replace(title_slug, '-+', '-', 'g');
    title_slug := regexp_replace(title_slug, '(^-|-$)', '', 'g');
    title_slug := left(title_slug, 100);
    title_slug := regexp_replace(title_slug, '-$', '');

    topic_slug := regexp_replace(
      lower(coalesce(nullif(btrim(task.topic), ''), '')),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    topic_slug := regexp_replace(topic_slug, '-+', '-', 'g');
    topic_slug := regexp_replace(topic_slug, '(^-|-$)', '', 'g');
    topic_slug := left(topic_slug, 80);
    topic_slug := regexp_replace(topic_slug, '-$', '');

    if title_slug <> ''
      and lower(coalesce(task.title, '')) <> lower(coalesce(task.topic, ''))
      and task.title !~* '^\s*(task\s*[12]\s*:?|writing\s+task\s*[12])'
    then
      base_slug := title_slug;
    elsif topic_slug <> '' then
      base_slug := concat('ielts-writing-task-', task.task_type, '-', topic_slug);
    else
      base_slug := concat(
        'ielts-writing-task-',
        task.task_type,
        '-',
        left(replace(task.id::text, '-', ''), 8)
      );
    end if;

    base_slug := regexp_replace(
      base_slug,
      '[^a-z0-9]+',
      '-',
      'g'
    );
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := regexp_replace(base_slug, '(^-|-$)', '', 'g');
    base_slug := left(base_slug, 100);
    base_slug := regexp_replace(base_slug, '-$', '');

    candidate_slug := base_slug;
    suffix := 2;

    while exists (
      select 1
      from public.writing_tasks existing
      where existing.slug = candidate_slug
        and existing.id <> task.id
    ) loop
      candidate_slug := concat(base_slug, '-', suffix);
      suffix := suffix + 1;
    end loop;

    update public.writing_tasks
    set slug = candidate_slug
    where id = task.id;
  end loop;
end $$;

alter table public.writing_tasks
alter column slug set not null;

create unique index if not exists writing_tasks_slug_idx
on public.writing_tasks(slug);
