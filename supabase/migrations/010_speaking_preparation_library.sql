create table if not exists public.speaking_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  part int not null check (part in (1, 2, 3)),
  title text not null,
  description text not null,
  status public.content_status not null default 'draft',
  target_band numeric(2, 1),
  source_type public.content_source_type not null default 'admin_original',
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.speaking_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.speaking_topics(id) on delete cascade,
  question_order int not null default 1,
  question text not null,
  answer_tip text,
  cue_card_points jsonb not null default '[]'::jsonb,
  preparation_ideas jsonb not null default '[]'::jsonb,
  suggested_structure jsonb not null default '[]'::jsonb,
  direct_answer text,
  main_reason text,
  example text,
  alternative_perspective text,
  sample_band_6 text not null,
  sample_band_7 text not null,
  sample_band_8 text not null,
  useful_phrases jsonb not null default '[]'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  sentence_patterns jsonb not null default '[]'::jsonb,
  common_mistakes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, question_order)
);

create index if not exists speaking_topics_status_part_idx
on public.speaking_topics(status, part, title);

create index if not exists speaking_topics_slug_idx
on public.speaking_topics(slug);

create index if not exists speaking_questions_topic_order_idx
on public.speaking_questions(topic_id, question_order);

drop trigger if exists set_speaking_topics_updated_at on public.speaking_topics;
create trigger set_speaking_topics_updated_at
before update on public.speaking_topics
for each row execute function public.set_updated_at();

drop trigger if exists set_speaking_questions_updated_at on public.speaking_questions;
create trigger set_speaking_questions_updated_at
before update on public.speaking_questions
for each row execute function public.set_updated_at();

alter table public.speaking_topics enable row level security;
alter table public.speaking_questions enable row level security;

drop policy if exists "Published speaking topics are readable" on public.speaking_topics;
create policy "Published speaking topics are readable"
on public.speaking_topics for select
using (status = 'published' or auth.uid() = created_by);

drop policy if exists "Published speaking questions are readable" on public.speaking_questions;
create policy "Published speaking questions are readable"
on public.speaking_questions for select
using (
  exists (
    select 1
    from public.speaking_topics
    where public.speaking_topics.id = public.speaking_questions.topic_id
      and (
        public.speaking_topics.status = 'published'
        or public.speaking_topics.created_by = auth.uid()
      )
  )
);

insert into public.speaking_topics
  (slug, part, title, description, status, target_band, source_type, published_at)
values
  (
    'part-1-hometown',
    1,
    'Hometown',
    'Short IELTS-style questions about where you come from, local features, and personal connection.',
    'published',
    7.0,
    'admin_original',
    now()
  ),
  (
    'part-1-work-or-study',
    1,
    'Work or Study',
    'Familiar Part 1 questions about daily routines, subjects, jobs, and future plans.',
    'published',
    7.0,
    'admin_original',
    now()
  ),
  (
    'part-2-person-who-inspired-you',
    2,
    'Describe a person who inspired you',
    'Cue card practice for describing a person, their qualities, and their influence on you.',
    'published',
    7.0,
    'admin_original',
    now()
  ),
  (
    'part-2-memorable-journey',
    2,
    'Describe a memorable journey',
    'Cue card practice for telling a clear story with details, sequence, and reflection.',
    'published',
    7.0,
    'admin_original',
    now()
  ),
  (
    'part-3-technology-and-society',
    3,
    'Technology and Society',
    'Abstract discussion questions about digital habits, social change, and responsible technology use.',
    'published',
    7.0,
    'admin_original',
    now()
  ),
  (
    'part-3-education',
    3,
    'Education',
    'Part 3 discussion practice about learning, schools, skills, and the role of teachers.',
    'published',
    7.0,
    'admin_original',
    now()
  )
on conflict (slug) do update
set
  part = excluded.part,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  target_band = excluded.target_band,
  source_type = excluded.source_type,
  published_at = coalesce(public.speaking_topics.published_at, excluded.published_at);

with topic_rows as (
  select id, slug from public.speaking_topics
  where slug in (
    'part-1-hometown',
    'part-1-work-or-study',
    'part-2-person-who-inspired-you',
    'part-2-memorable-journey',
    'part-3-technology-and-society',
    'part-3-education'
  )
),
seed_questions as (
  select
    'part-1-hometown'::text as slug,
    1 as question_order,
    $$Where is your hometown?$$ as question,
    $$Mention the location, one distinctive feature, and your personal connection.$$ as answer_tip,
    '[]'::jsonb as cue_card_points,
    '[]'::jsonb as preparation_ideas,
    '[]'::jsonb as suggested_structure,
    null::text as direct_answer,
    null::text as main_reason,
    null::text as example,
    null::text as alternative_perspective,
    $$My hometown is a medium-sized city in southern China. It is not very famous, but it is comfortable to live in. There are many small restaurants and parks, so people can relax after work. I grew up there, so I feel close to it.$$ as sample_band_6,
    $$My hometown is a medium-sized city in southern China, and I would describe it as practical rather than touristy. It has busy local markets, quiet riverside parks, and a lot of family-run restaurants. I still feel a strong connection to it because most of my childhood memories are tied to those places.$$ as sample_band_7,
    $$I come from a medium-sized city in southern China. It is not the kind of place that appears in travel magazines, but it has a very lived-in charm. What I appreciate most is the balance between convenience and familiarity: you can find modern shopping areas, but neighbourhood life still feels personal. Whenever I go back, I feel instantly grounded.$$ as sample_band_8,
    '[{"phrase":"feel a strong connection to","meaning":"to have an emotional link with something","example":"I still feel a strong connection to my hometown because my family lives there."},{"phrase":"a lived-in charm","meaning":"a warm, real feeling, not polished or artificial","example":"The old streets have a lived-in charm that makes the city memorable."},{"phrase":"family-run restaurants","meaning":"restaurants owned and managed by a family","example":"My hometown has many family-run restaurants that serve simple local food."},{"phrase":"quiet riverside parks","meaning":"parks beside a river that feel peaceful","example":"People often walk in the quiet riverside parks after dinner."},{"phrase":"feel instantly grounded","meaning":"to feel calm, stable, and connected","example":"I feel instantly grounded whenever I return home."}]'::jsonb as useful_phrases,
    '[{"insteadOf":"very nice","try":["pleasant","comfortable","welcoming"],"meaning":"positive and easy to enjoy","example":"It is a welcoming city for families.","context":"Use for places with a warm atmosphere."},{"insteadOf":"very busy","try":["lively","fast-paced","packed with activity"],"meaning":"full of people or movement","example":"The central market is lively in the evening.","context":"Use when describing active streets or neighbourhoods."},{"insteadOf":"old place","try":["historic area","older neighbourhood","traditional district"],"meaning":"an area with older buildings or culture","example":"The older neighbourhood has narrow streets and small shops.","context":"Use for places with history; avoid if the area is simply poor or broken."}]'::jsonb as vocabulary,
    '[{"pattern":"One thing I really appreciate about ___ is that ___.","example":"One thing I really appreciate about my hometown is that life moves at a comfortable pace.","suitableUse":"Explaining a personal reason."},{"pattern":"It is not exactly ___, but it is ___.","example":"It is not exactly famous, but it is a very liveable city.","suitableUse":"Adding contrast naturally."},{"pattern":"Whenever I go back, I ___.","example":"Whenever I go back, I usually visit the market near my old school.","suitableUse":"Connecting the place to personal experience."}]'::jsonb as sentence_patterns,
    '[{"incorrect":"My hometown is at China.","better":"My hometown is in China.","why":"Use in with countries and cities."},{"incorrect":"It has many delicious.","better":"It has many delicious local dishes.","why":"Delicious needs a noun after it."},{"incorrect":"My hometown is very beautiful, very beautiful.","better":"My hometown is beautiful because it has tree-lined streets and quiet parks.","why":"Avoid repetition; add a reason or detail."}]'::jsonb as common_mistakes
  union all
  select
    'part-1-hometown',
    2,
    $$Has your hometown changed much in recent years?$$,
    $$Give one clear change and say whether you think it is positive or negative.$$,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    null::text,
    null::text,
    null::text,
    null::text,
    $$Yes, it has changed a lot. There are more apartment buildings and shopping centres now. Public transport is also better than before. I think these changes are mostly good, but sometimes the city feels more crowded and less quiet.$$,
    $$Yes, it has changed quite noticeably. The biggest change is probably transport, because the city has added new metro lines and better bus routes. That has made daily life more convenient, although some older neighbourhoods have become more crowded and commercial.$$,
    $$It has changed dramatically, especially in terms of transport and housing. When I was younger, most people relied on buses or bicycles, but now the metro connects many parts of the city. I see that as a positive development overall, though I do miss the slower, more familiar feeling of the old neighbourhoods.$$,
    '[{"phrase":"changed quite noticeably","meaning":"changed in a way people can easily see","example":"My hometown has changed quite noticeably in the last decade."},{"phrase":"the biggest change is probably","meaning":"a natural way to introduce one main change","example":"The biggest change is probably public transport."},{"phrase":"more crowded and commercial","meaning":"busier and more focused on shops or business","example":"Some old streets have become more crowded and commercial."},{"phrase":"a positive development overall","meaning":"mostly a good change","example":"Better transport is a positive development overall."},{"phrase":"miss the slower feeling","meaning":"feel nostalgic for a calmer past","example":"I miss the slower feeling of the old neighbourhoods."}]'::jsonb,
    '[{"insteadOf":"changed a lot","try":["changed noticeably","developed rapidly","become more modern"],"meaning":"changed in a clear way","example":"The city has developed rapidly over the past few years.","context":"Use for visible urban change."},{"insteadOf":"many cars","try":["heavier traffic","more private vehicles","busy roads"],"meaning":"more vehicles on roads","example":"One downside is heavier traffic during rush hour.","context":"Use when discussing transport problems."},{"insteadOf":"good for people","try":["more convenient for residents","beneficial for daily life","practical for commuters"],"meaning":"helpful in everyday life","example":"The new metro is practical for commuters.","context":"Use for public facilities or transport."}]'::jsonb,
    '[{"pattern":"The most noticeable change is ___.","example":"The most noticeable change is the new metro system.","suitableUse":"Starting a focused answer."},{"pattern":"This has made ___ much more ___.","example":"This has made commuting much more convenient.","suitableUse":"Explaining impact."},{"pattern":"Although ___, I still think ___.","example":"Although the city is busier now, I still think the changes are positive.","suitableUse":"Balancing advantages and disadvantages."}]'::jsonb,
    '[{"incorrect":"The traffic is more convenient.","better":"Transport is more convenient, but traffic is heavier.","why":"Traffic refers to vehicles on roads; it is not usually convenient."},{"incorrect":"There has many new buildings.","better":"There are many new buildings.","why":"Use there are for existence."},{"incorrect":"My city changed more and more.","better":"My city has changed a lot in recent years.","why":"Use present perfect for changes connected to now."}]'::jsonb
  union all
  select
    'part-1-work-or-study',
    1,
    $$Do you work or are you a student?$$,
    $$Say what you do, add one detail about your routine, and explain how you feel about it.$$,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    null::text,
    null::text,
    null::text,
    null::text,
    $$I am a university student. I study business, and most of my classes are in the morning. I also spend time doing group projects. It can be tiring sometimes, but I think it is useful for my future career.$$,
    $$I am currently a university student majoring in business. My schedule is quite packed, especially when we have presentations or group assignments. Even though it can be stressful, I enjoy it because I am learning practical skills such as research, communication, and teamwork.$$,
    $$I am studying business at university at the moment. The workload can be demanding, particularly around presentation deadlines, but I like the fact that the course is practical rather than purely theoretical. It pushes me to work with different people, explain ideas clearly, and think about real business problems.$$,
    '[{"phrase":"majoring in business","meaning":"studying business as the main subject","example":"I am majoring in business at university."},{"phrase":"my schedule is quite packed","meaning":"I have many things to do","example":"My schedule is quite packed during exam season."},{"phrase":"practical rather than purely theoretical","meaning":"connected to real use, not only ideas","example":"I prefer courses that are practical rather than purely theoretical."},{"phrase":"presentation deadlines","meaning":"dates when presentations must be completed","example":"Presentation deadlines can be stressful."},{"phrase":"real business problems","meaning":"problems that companies may actually face","example":"We often discuss real business problems in class."}]'::jsonb,
    '[{"insteadOf":"very busy","try":["packed","demanding","intense"],"meaning":"requiring a lot of time or energy","example":"The course is demanding but rewarding.","context":"Use for study or work routines."},{"insteadOf":"good for future","try":["useful for my career","relevant to my goals","valuable in the long term"],"meaning":"helpful later","example":"The teamwork experience is valuable in the long term.","context":"Use when explaining benefits."},{"insteadOf":"learn many things","try":["gain practical skills","build knowledge","develop confidence"],"meaning":"improve ability through study or work","example":"Group projects help me develop confidence.","context":"Use for education and career topics."}]'::jsonb,
    '[{"pattern":"I am currently ___, and most of my time is spent ___.","example":"I am currently a student, and most of my time is spent preparing assignments.","suitableUse":"Introducing work or study."},{"pattern":"What I find challenging is ___.","example":"What I find challenging is managing deadlines.","suitableUse":"Adding a realistic difficulty."},{"pattern":"Even though ___, I enjoy it because ___.","example":"Even though it can be stressful, I enjoy it because I learn practical skills.","suitableUse":"Balancing challenge and benefit."}]'::jsonb,
    '[{"incorrect":"I am study business.","better":"I study business. / I am studying business.","why":"Use study for present simple, or am studying for current activity."},{"incorrect":"I have many works.","better":"I have a lot of work.","why":"Work is usually uncountable when talking about tasks."},{"incorrect":"My major is very challenge.","better":"My major is very challenging.","why":"Use the adjective challenging."}]'::jsonb
  union all
  select
    'part-1-work-or-study',
    2,
    $$What part of your study or work do you enjoy most?$$,
    $$Choose one part, explain why you enjoy it, and give a short example.$$,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    null::text,
    null::text,
    null::text,
    null::text,
    $$I enjoy group projects most because I can share ideas with other students. Sometimes we have different opinions, but that helps me think more carefully. I also like giving presentations because it improves my confidence.$$,
    $$The part I enjoy most is working on group projects. I like hearing different perspectives and turning a rough idea into a clear presentation. For example, last semester my team analysed a small local cafe, and I enjoyed connecting classroom theories with a real situation.$$,
    $$I would say I enjoy project-based work the most. It is satisfying to take a broad question, divide it into manageable parts, and then build a presentation with a team. A recent project about a local cafe was especially useful because it made the theory feel concrete rather than abstract.$$,
    '[{"phrase":"different perspectives","meaning":"different ways of looking at something","example":"Group work exposes me to different perspectives."},{"phrase":"a rough idea","meaning":"an idea that is not fully developed yet","example":"We turned a rough idea into a clear presentation."},{"phrase":"project-based work","meaning":"learning or working through projects","example":"I prefer project-based work to lectures."},{"phrase":"manageable parts","meaning":"smaller parts that are easier to handle","example":"We divided the task into manageable parts."},{"phrase":"feel concrete rather than abstract","meaning":"feel real and practical, not only theoretical","example":"The case study made the theory feel concrete rather than abstract."}]'::jsonb,
    '[{"insteadOf":"I like it very much","try":["I find it rewarding","I genuinely enjoy it","It suits my personality"],"meaning":"a more natural way to express enjoyment","example":"I find presentations rewarding because they build confidence.","context":"Use for personal preference."},{"insteadOf":"many ideas","try":["different perspectives","fresh suggestions","practical solutions"],"meaning":"useful thoughts from other people","example":"My classmates often bring fresh suggestions.","context":"Use for teamwork."},{"insteadOf":"real thing","try":["real situation","practical case","concrete example"],"meaning":"something connected to real life","example":"The project gave us a concrete example.","context":"Use when linking study to reality."}]'::jsonb,
    '[{"pattern":"The part I enjoy most is ___.","example":"The part I enjoy most is preparing group presentations.","suitableUse":"Directly answering preference questions."},{"pattern":"For example, last semester ___.","example":"For example, last semester we analysed a local cafe.","suitableUse":"Adding a quick example."},{"pattern":"It suits me because ___.","example":"It suits me because I like exchanging ideas with others.","suitableUse":"Explaining a personal fit."}]'::jsonb,
    '[{"incorrect":"I enjoy to work with classmates.","better":"I enjoy working with classmates.","why":"Use enjoy + verb-ing."},{"incorrect":"We discussed about the project.","better":"We discussed the project.","why":"Discuss does not need about."},{"incorrect":"It makes me more confidence.","better":"It makes me more confident. / It improves my confidence.","why":"Use confident as an adjective, confidence as a noun."}]'::jsonb
  union all
  select
    'part-2-person-who-inspired-you',
    1,
    $$Describe a person who inspired you.$$,
    null::text,
    '["who this person is","how you know this person","what this person has done","and explain why this person inspired you"]'::jsonb,
    '["Choose someone you know well enough to describe naturally.","Focus on one or two specific qualities rather than listing many adjectives.","Include a short story that shows the person''s influence on you."]'::jsonb,
    '["Introduction","Background","What the person did","Why it influenced you","Personal reflection"]'::jsonb,
    null::text,
    null::text,
    null::text,
    null::text,
    $$I would like to describe my high school English teacher. She inspired me because she was patient and always encouraged students to speak, even when we made mistakes. At first, I was shy and afraid of answering questions in class. She often gave simple advice and told me that confidence grows with practice. Because of her, I started reading short articles and speaking English with classmates. She did not do anything dramatic, but she made learning feel possible. I still remember her because she helped me become more confident.$$,
    $$I would like to talk about my high school English teacher, who had a strong influence on the way I learn. She was not only knowledgeable but also very patient. When I was younger, I was afraid of speaking English because I worried about making mistakes. Instead of correcting us harshly, she created a relaxed classroom atmosphere and encouraged us to try. One thing I remember clearly is that she asked us to give short presentations every month. At first, I found it uncomfortable, but gradually I became more confident. She inspired me because she showed me that progress comes from consistent practice, not from being perfect at the beginning.$$,
    $$The person who inspired me most was my high school English teacher. What made her memorable was not just her knowledge, but the way she made students feel capable. I used to avoid speaking English because I was self-conscious about my pronunciation and grammar. She never embarrassed students for making mistakes; instead, she treated mistakes as a normal part of learning. I remember giving a short presentation about a book, and afterwards she pointed out what I had done well before suggesting one improvement. That approach changed my attitude completely. She inspired me because she helped me understand that confidence is built through repeated, manageable practice rather than sudden talent.$$,
    '[{"phrase":"had a strong influence on","meaning":"affected someone in an important way","example":"My teacher had a strong influence on the way I learn."},{"phrase":"created a relaxed atmosphere","meaning":"made a place feel comfortable","example":"She created a relaxed atmosphere in class."},{"phrase":"self-conscious about","meaning":"worried about how other people judge you","example":"I was self-conscious about my pronunciation."},{"phrase":"treated mistakes as normal","meaning":"did not make mistakes seem shameful","example":"She treated mistakes as a normal part of learning."},{"phrase":"manageable practice","meaning":"practice that feels possible and not overwhelming","example":"Confidence grows through repeated, manageable practice."}]'::jsonb,
    '[{"insteadOf":"very good teacher","try":["supportive teacher","patient mentor","encouraging role model"],"meaning":"a more specific description of a person","example":"She was an encouraging role model for many students.","context":"Use for people who influence you positively."},{"insteadOf":"helped me a lot","try":["boosted my confidence","changed my attitude","guided me patiently"],"meaning":"describe the exact kind of help","example":"Her feedback boosted my confidence.","context":"Use when explaining influence."},{"insteadOf":"learn English better","try":["develop my communication skills","improve my spoken English","build better study habits"],"meaning":"more precise learning outcomes","example":"She helped me build better study habits.","context":"Use for education stories."}]'::jsonb,
    '[{"pattern":"What made ___ memorable was not just ___, but ___.","example":"What made her memorable was not just her knowledge, but her patience.","suitableUse":"Explaining deeper qualities."},{"pattern":"At first, I ___, but gradually ___.","example":"At first, I felt nervous, but gradually I became more confident.","suitableUse":"Showing change over time."},{"pattern":"That experience taught me that ___.","example":"That experience taught me that confidence comes from practice.","suitableUse":"Ending with reflection."}]'::jsonb,
    '[{"incorrect":"She let me became confident.","better":"She helped me become confident.","why":"Use help someone do something."},{"incorrect":"I was afraid to make mistake.","better":"I was afraid of making mistakes.","why":"Use afraid of + verb-ing, and mistakes is plural here."},{"incorrect":"She is very patient teacher.","better":"She is a very patient teacher.","why":"Use an article before singular countable nouns."}]'::jsonb
  union all
  select
    'part-2-memorable-journey',
    1,
    $$Describe a memorable journey you took.$$,
    null::text,
    '["where you went","who you went with","what happened during the journey","and explain why it was memorable"]'::jsonb,
    '["Choose a journey with one clear moment or problem.","Use time markers to keep the story easy to follow.","End with why the journey still matters to you."]'::jsonb,
    '["Introduction","When and where","What happened","A memorable moment","Why you remember it"]'::jsonb,
    null::text,
    null::text,
    null::text,
    null::text,
    $$A memorable journey I took was a train trip to a coastal city with two friends. We went there during a short holiday. The journey took about five hours, and we talked, ate snacks, and looked at the scenery. The most memorable part was arriving near sunset because the sea looked beautiful from the station. It was not a luxury trip, but I remember it clearly because it was simple and relaxing.$$,
    $$One memorable journey I took was a train trip to a small coastal city with two close friends. We went during a short break after exams, so everyone was in a good mood. The train ride lasted around five hours, but it did not feel boring because we talked, shared snacks, and watched the scenery change from city buildings to open fields. The best moment was arriving just before sunset. We could see the sea from the station platform, and it felt like the start of a real holiday. I remember it because it was simple, affordable, and exactly what we needed after a stressful semester.$$,
    $$A journey that has stayed with me was a train trip to a small coastal city with two close friends after our final exams. It was not an expensive or carefully planned trip, which is probably why it felt so refreshing. During the five-hour ride, we watched the scenery gradually shift from dense city blocks to farmland and then to glimpses of the sea. I still remember stepping onto the platform just before sunset and seeing the water turn orange in the distance. That moment made the whole trip feel peaceful. It was memorable because it gave us a sense of freedom after months of pressure.$$,
    '[{"phrase":"has stayed with me","meaning":"I still remember it clearly","example":"That journey has stayed with me for years."},{"phrase":"a short break after exams","meaning":"a brief holiday after tests","example":"We went on a short break after exams."},{"phrase":"the scenery changed from ___ to ___","meaning":"the view became different during travel","example":"The scenery changed from city buildings to open fields."},{"phrase":"exactly what we needed","meaning":"perfect for the situation","example":"The trip was exactly what we needed after a stressful semester."},{"phrase":"a sense of freedom","meaning":"a feeling of being relaxed and independent","example":"The journey gave us a sense of freedom."}]'::jsonb,
    '[{"insteadOf":"beautiful view","try":["coastal scenery","open fields","sunset over the water"],"meaning":"more specific visual detail","example":"The sunset over the water was unforgettable.","context":"Use for travel descriptions."},{"insteadOf":"happy trip","try":["refreshing journey","relaxing break","memorable getaway"],"meaning":"a pleasant travel experience","example":"It was a refreshing journey after exams.","context":"Use for positive travel memories."},{"insteadOf":"not expensive","try":["affordable","low-cost","budget-friendly"],"meaning":"not costing too much","example":"It was a budget-friendly trip with friends.","context":"Use for travel plans or student life."}]'::jsonb,
    '[{"pattern":"It was not ___, but it was ___.","example":"It was not a luxury trip, but it was very relaxing.","suitableUse":"Making a balanced description."},{"pattern":"What I remember most is ___.","example":"What I remember most is seeing the sea at sunset.","suitableUse":"Highlighting a key memory."},{"pattern":"The journey felt memorable because ___.","example":"The journey felt memorable because it gave us a break from pressure.","suitableUse":"Explaining significance."}]'::jsonb,
    '[{"incorrect":"I went to travel with my friends.","better":"I travelled with my friends. / I went on a trip with my friends.","why":"Travel is usually used as a verb without to after went."},{"incorrect":"The scenery was very beauty.","better":"The scenery was very beautiful.","why":"Use beautiful as the adjective."},{"incorrect":"We arrived at sunset time.","better":"We arrived around sunset.","why":"Around sunset sounds more natural."}]'::jsonb
  union all
  select
    'part-3-technology-and-society',
    1,
    $$How has technology changed the way people communicate?$$,
    null::text,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    $$Technology has made communication faster and more convenient.$$,
    $$People can now keep in touch across long distances instantly, but this can also make conversations feel less personal.$$,
    $$For example, families living in different countries can video call regularly, while many friends rely on short messages instead of meeting face to face.$$,
    $$However, technology does not replace all forms of communication; in serious or emotional situations, face-to-face conversation is still more effective.$$,
    $$Technology has changed communication a lot because people can contact each other very quickly. We use messaging apps, video calls, and social media every day. This is useful for families and friends who live far away. However, sometimes people spend too much time sending short messages and do not have deep conversations.$$,
    $$Technology has made communication much faster and more flexible. People can now stay in touch with friends, family, and colleagues even if they live in different countries. For instance, video calls allow grandparents to see their grandchildren regularly. At the same time, communication can become more superficial because many people rely on quick messages rather than meaningful conversations.$$,
    $$Technology has transformed communication by removing many of the barriers of distance and time. A person can now collaborate with colleagues overseas, speak to relatives through video calls, or join online communities built around shared interests. The main benefit is convenience, but there is a trade-off: constant digital contact can make communication feel fragmented and less thoughtful. In my view, technology works best when it supports relationships rather than replacing deeper, face-to-face interaction.$$,
    '[{"phrase":"removing barriers of distance and time","meaning":"making communication easier across places and schedules","example":"Messaging apps remove barriers of distance and time."},{"phrase":"stay in touch with","meaning":"keep communicating with someone","example":"I use video calls to stay in touch with relatives."},{"phrase":"more superficial","meaning":"less deep or meaningful","example":"Some online conversations are more superficial."},{"phrase":"there is a trade-off","meaning":"there is both a benefit and a cost","example":"There is a trade-off between convenience and privacy."},{"phrase":"supports relationships rather than replacing them","meaning":"helps real relationships without becoming the whole relationship","example":"Technology should support relationships rather than replacing them."}]'::jsonb,
    '[{"insteadOf":"talk with people easily","try":["communicate instantly","stay connected","keep in touch"],"meaning":"communicate quickly or regularly","example":"Students can communicate instantly with group members.","context":"Use for digital communication."},{"insteadOf":"bad for relationship","try":["less personal","more superficial","fragmented"],"meaning":"not as deep or connected","example":"Online messages can feel less personal.","context":"Use for disadvantages of technology."},{"insteadOf":"internet group","try":["online community","digital network","shared-interest group"],"meaning":"a group connected online","example":"Many people join online communities around hobbies.","context":"Use for social media or forums."}]'::jsonb,
    '[{"pattern":"The main benefit is ___, but there is a trade-off: ___.","example":"The main benefit is convenience, but there is a trade-off: conversations may become less personal.","suitableUse":"Balanced Part 3 answers."},{"pattern":"For instance, ___ allows people to ___.","example":"For instance, video calling allows people to maintain long-distance relationships.","suitableUse":"Adding examples."},{"pattern":"In my view, ___ works best when ___.","example":"In my view, technology works best when it supports real relationships.","suitableUse":"Giving an opinion."}]'::jsonb,
    '[{"incorrect":"Technology makes people communicate convenient.","better":"Technology makes communication convenient. / Technology helps people communicate conveniently.","why":"Use the noun communication, or use conveniently as an adverb."},{"incorrect":"People contact with friends.","better":"People contact friends. / People keep in touch with friends.","why":"Contact does not need with."},{"incorrect":"It has many informations.","better":"It has a lot of information.","why":"Information is uncountable."}]'::jsonb
  union all
  select
    'part-3-technology-and-society',
    2,
    $$Should children be taught to use technology responsibly at school?$$,
    null::text,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    $$Yes, schools should teach responsible technology use.$$,
    $$Children use digital tools from a young age, so they need guidance on privacy, screen time, and reliable information.$$,
    $$For example, a school lesson could show students how to check whether an online source is trustworthy before using it for homework.$$,
    $$Parents also have an important role, but schools can provide a more consistent foundation for all students.$$,
    $$Yes, I think schools should teach children how to use technology responsibly. Children use phones and computers very often, but they may not understand online safety. Schools can teach them about privacy, fake information, and time management. Parents should also help, but not all parents know enough about technology.$$,
    $$Yes, I think this should be part of modern education. Children use digital devices for learning, entertainment, and communication, so they need practical guidance. Schools can teach them how to protect personal information, manage screen time, and judge whether online information is reliable. Parents are important too, but schools can make sure every child receives the same basic knowledge.$$,
    $$I definitely think responsible technology use should be taught at school. Digital skills are no longer optional, but using technology well involves more than knowing which buttons to press. Students need to understand privacy, online behaviour, misinformation, and the effect of screen time on concentration. For example, a simple classroom activity could compare reliable and unreliable websites. Parents should reinforce these habits at home, but schools are well placed to provide a consistent and structured foundation.$$,
    '[{"phrase":"responsible technology use","meaning":"using digital tools safely and thoughtfully","example":"Schools should teach responsible technology use."},{"phrase":"judge whether information is reliable","meaning":"decide if information can be trusted","example":"Students need to judge whether information is reliable."},{"phrase":"misinformation","meaning":"false or misleading information","example":"Children should learn how misinformation spreads online."},{"phrase":"reinforce these habits","meaning":"support and repeat good habits","example":"Parents can reinforce these habits at home."},{"phrase":"a structured foundation","meaning":"a clear basic framework for learning","example":"Schools provide a structured foundation for digital skills."}]'::jsonb,
    '[{"insteadOf":"fake news","try":["misinformation","unreliable sources","false claims"],"meaning":"wrong or misleading online information","example":"Students should learn to identify misinformation.","context":"Use for media literacy."},{"insteadOf":"use phone too much","try":["excessive screen time","poor digital habits","constant device use"],"meaning":"using devices more than is healthy","example":"Excessive screen time may affect concentration.","context":"Use for technology disadvantages."},{"insteadOf":"teach every child same thing","try":["provide a consistent foundation","offer shared guidance","set common standards"],"meaning":"make sure all students learn basic skills","example":"Schools can provide a consistent foundation.","context":"Use when comparing school and family roles."}]'::jsonb,
    '[{"pattern":"This should be part of modern education because ___.","example":"This should be part of modern education because digital tools are used every day.","suitableUse":"Directly answering education policy questions."},{"pattern":"Students need to understand not only ___, but also ___.","example":"Students need to understand not only how to use apps, but also how to protect privacy.","suitableUse":"Developing a detailed point."},{"pattern":"Parents can ___, but schools can ___.","example":"Parents can reinforce habits, but schools can provide structured guidance.","suitableUse":"Comparing responsibilities."}]'::jsonb,
    '[{"incorrect":"Children should learn technology responsible.","better":"Children should learn to use technology responsibly.","why":"Use responsibly as an adverb."},{"incorrect":"School can teaches students.","better":"Schools can teach students.","why":"After can, use the base verb teach."},{"incorrect":"The internet has many fake informations.","better":"The internet contains a lot of misinformation.","why":"Information is uncountable; misinformation is more precise."}]'::jsonb
  union all
  select
    'part-3-education',
    1,
    $$What skills should schools focus on besides academic knowledge?$$,
    null::text,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    $$Schools should also focus on communication and problem-solving skills.$$,
    $$Academic knowledge is important, but students also need skills that help them work with others and adapt to real situations.$$,
    $$For example, group projects can teach students how to divide tasks, listen to different opinions, and present ideas clearly.$$,
    $$Some people may argue that schools should focus mainly on exams, but life after school requires more than test scores.$$,
    $$Schools should teach communication skills, teamwork, and problem-solving. Academic subjects are important, but students also need to use knowledge in real life. For example, group projects can help students share ideas and become more confident. These skills are useful for future jobs.$$,
    $$Besides academic knowledge, schools should focus on communication, teamwork, and problem-solving. These skills help students apply what they learn in real situations. For instance, a group project can train students to divide responsibilities, listen to different opinions, and explain their ideas clearly. Exam results matter, but they are not enough for work and adult life.$$,
    $$I think schools should place more emphasis on transferable skills such as communication, collaboration, and independent problem-solving. Academic knowledge gives students a foundation, but these wider skills determine whether they can use that knowledge effectively. For example, group projects can teach students how to negotiate roles, respond to feedback, and present ideas in a clear way. Exams still have value, but they should not be the only measure of a student''s development.$$,
    '[{"phrase":"transferable skills","meaning":"skills useful in many situations","example":"Communication is a transferable skill."},{"phrase":"apply what they learn","meaning":"use knowledge in real situations","example":"Projects help students apply what they learn."},{"phrase":"divide responsibilities","meaning":"share tasks among people","example":"Team members need to divide responsibilities fairly."},{"phrase":"respond to feedback","meaning":"listen to advice and improve","example":"Students learn to respond to feedback."},{"phrase":"not the only measure","meaning":"not the only way to judge something","example":"Exams are not the only measure of development."}]'::jsonb,
    '[{"insteadOf":"useful skills","try":["transferable skills","practical abilities","life skills"],"meaning":"skills that help outside school","example":"Schools should teach more transferable skills.","context":"Use for education and work topics."},{"insteadOf":"work together","try":["collaborate","coordinate tasks","share responsibilities"],"meaning":"cooperate with others","example":"Students learn to collaborate through projects.","context":"Use for teamwork."},{"insteadOf":"say ideas","try":["express ideas clearly","present viewpoints","communicate effectively"],"meaning":"explain thoughts well","example":"Students need to express ideas clearly.","context":"Use for communication skills."}]'::jsonb,
    '[{"pattern":"Besides ___, schools should also focus on ___.","example":"Besides academic knowledge, schools should also focus on teamwork.","suitableUse":"Answering broad education questions."},{"pattern":"These skills matter because ___.","example":"These skills matter because students need them in real workplaces.","suitableUse":"Explaining importance."},{"pattern":"Exams still have value, but ___.","example":"Exams still have value, but they should not be the only measure.","suitableUse":"Adding balance."}]'::jsonb,
    '[{"incorrect":"Students need learn teamwork.","better":"Students need to learn teamwork.","why":"Use need to + verb."},{"incorrect":"Knowledge can use in work.","better":"Knowledge can be used at work.","why":"Use passive form when the subject receives the action."},{"incorrect":"Schools should teach students how to communication.","better":"Schools should teach students how to communicate.","why":"Use the verb communicate after how to."}]'::jsonb
  union all
  select
    'part-3-education',
    2,
    $$Do you think online learning can replace traditional classrooms?$$,
    null::text,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    $$Not completely; online learning is useful, but classrooms still have important advantages.$$,
    $$Online learning offers flexibility, but traditional classrooms provide social interaction, direct support, and a clearer learning routine.$$,
    $$For example, students can replay online lessons, but they may concentrate better in a classroom where a teacher can notice confusion immediately.$$,
    $$In the future, a blended model may be more realistic than replacing classrooms completely.$$,
    $$I do not think online learning can completely replace classrooms. Online classes are convenient because students can study at home and watch lessons again. However, classrooms are better for discussion and asking questions. Some students also need a teacher to help them stay focused.$$,
    $$I do not think online learning can fully replace traditional classrooms, although it is a useful option. Online courses are flexible and allow students to review lessons at their own pace. However, classrooms provide face-to-face interaction, immediate feedback, and a stronger sense of routine. A balanced approach, where online resources support classroom learning, seems more realistic.$$,
    $$I doubt online learning can completely replace traditional classrooms, at least for most students. Its main strength is flexibility: learners can access materials from anywhere and revisit difficult lessons. However, education is not only about receiving information. Classrooms offer social interaction, immediate clarification, and a structured environment that helps many students concentrate. In the long run, I think a blended model is more practical than a total replacement.$$,
    '[{"phrase":"fully replace traditional classrooms","meaning":"take the place of normal classrooms completely","example":"Online learning cannot fully replace traditional classrooms."},{"phrase":"review lessons at their own pace","meaning":"study again at a comfortable speed","example":"Students can review lessons at their own pace."},{"phrase":"face-to-face interaction","meaning":"direct communication in person","example":"Classrooms provide face-to-face interaction."},{"phrase":"immediate clarification","meaning":"quick explanation when something is unclear","example":"Teachers can offer immediate clarification."},{"phrase":"a blended model","meaning":"a mix of online and classroom learning","example":"A blended model may be the most practical solution."}]'::jsonb,
    '[{"insteadOf":"online study","try":["online learning","remote learning","digital courses"],"meaning":"learning through the internet","example":"Remote learning is convenient for adult learners.","context":"Use for education technology."},{"insteadOf":"normal class","try":["traditional classroom","face-to-face lesson","in-person class"],"meaning":"a class where students and teachers meet physically","example":"Face-to-face lessons encourage discussion.","context":"Use when comparing online and offline learning."},{"insteadOf":"mix way","try":["blended model","hybrid approach","balanced approach"],"meaning":"combining two methods","example":"A hybrid approach can combine flexibility and interaction.","context":"Use for solutions."}]'::jsonb,
    '[{"pattern":"I do not think ___ can fully replace ___, although ___.","example":"I do not think online learning can fully replace classrooms, although it is useful.","suitableUse":"Giving a balanced opinion."},{"pattern":"Its main strength is ___; however, ___.","example":"Its main strength is flexibility; however, students may miss direct interaction.","suitableUse":"Contrasting benefits and limits."},{"pattern":"In the long run, ___ may be more practical than ___.","example":"In the long run, a blended model may be more practical than a total replacement.","suitableUse":"Discussing future trends."}]'::jsonb,
    '[{"incorrect":"Online learning can instead classroom.","better":"Online learning can replace classrooms.","why":"Use replace as the verb."},{"incorrect":"Students can study more freedom.","better":"Students can study with more freedom. / Students have more flexibility.","why":"Freedom is a noun; flexibility is more natural here."},{"incorrect":"Teacher can find students confused quickly.","better":"Teachers can notice when students are confused quickly.","why":"Use notice when someone is confused."}]'::jsonb
)
insert into public.speaking_questions (
  topic_id,
  question_order,
  question,
  answer_tip,
  cue_card_points,
  preparation_ideas,
  suggested_structure,
  direct_answer,
  main_reason,
  example,
  alternative_perspective,
  sample_band_6,
  sample_band_7,
  sample_band_8,
  useful_phrases,
  vocabulary,
  sentence_patterns,
  common_mistakes
)
select
  topic_rows.id,
  seed_questions.question_order,
  seed_questions.question,
  seed_questions.answer_tip,
  seed_questions.cue_card_points,
  seed_questions.preparation_ideas,
  seed_questions.suggested_structure,
  seed_questions.direct_answer,
  seed_questions.main_reason,
  seed_questions.example,
  seed_questions.alternative_perspective,
  seed_questions.sample_band_6,
  seed_questions.sample_band_7,
  seed_questions.sample_band_8,
  seed_questions.useful_phrases,
  seed_questions.vocabulary,
  seed_questions.sentence_patterns,
  seed_questions.common_mistakes
from seed_questions
join topic_rows on topic_rows.slug = seed_questions.slug
on conflict (topic_id, question_order) do update
set
  question = excluded.question,
  answer_tip = excluded.answer_tip,
  cue_card_points = excluded.cue_card_points,
  preparation_ideas = excluded.preparation_ideas,
  suggested_structure = excluded.suggested_structure,
  direct_answer = excluded.direct_answer,
  main_reason = excluded.main_reason,
  example = excluded.example,
  alternative_perspective = excluded.alternative_perspective,
  sample_band_6 = excluded.sample_band_6,
  sample_band_7 = excluded.sample_band_7,
  sample_band_8 = excluded.sample_band_8,
  useful_phrases = excluded.useful_phrases,
  vocabulary = excluded.vocabulary,
  sentence_patterns = excluded.sentence_patterns,
  common_mistakes = excluded.common_mistakes;
