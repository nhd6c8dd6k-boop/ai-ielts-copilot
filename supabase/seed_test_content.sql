do $$
declare
  reading_set_id uuid;
  listening_set_id uuid;
  question_id uuid;
begin
  if not exists (
    select 1 from public.reading_sets
    where title = 'Test Reading Set - Urban Green Spaces'
  ) then
    insert into public.reading_sets (
      title,
      topic,
      band,
      length_words,
      passage,
      source_type,
      status,
      published_at
    )
    values (
      'Test Reading Set - Urban Green Spaces',
      'Environment',
      6,
      600,
      'Urban green spaces are no longer viewed simply as pleasant decoration between roads and buildings. In many modern cities, parks, community gardens and tree-lined streets are becoming part of public health planning. As temperatures rise and populations grow denser, local authorities are beginning to ask how small areas of nature can make daily life more manageable for residents.

One clear benefit is temperature control. Concrete and asphalt absorb heat during the day and release it slowly at night, which can make city centres several degrees warmer than surrounding rural areas. Trees reduce this effect by providing shade and by releasing water vapour through their leaves. A street with mature trees may feel noticeably cooler than a similar street without them. For people who walk to work, wait for buses or live in older apartments without air conditioning, this difference is not merely comfortable; it can affect health during heatwaves.

Green spaces also influence how people move through a city. When parks are connected by safe paths, residents are more likely to walk or cycle for short journeys. This can reduce traffic, but the more immediate effect is often personal. Regular walking improves fitness without requiring expensive equipment or gym membership. Some studies suggest that people are more willing to exercise when the route is attractive and feels safe. A small park near a housing block may therefore have a greater impact than a large park that requires a long journey to reach.

There are social benefits as well. Community gardens, weekend markets and outdoor exercise classes can give neighbours a reason to meet. This matters because loneliness is increasingly recognised as a public health issue. However, the success of these places depends on design and maintenance. A poorly lit park with broken benches may be avoided, while a clean space with clear entrances and active use can feel welcoming. In this sense, green space is not automatically beneficial; it has to be managed as carefully as a library or sports centre.

Critics argue that new parks can sometimes raise local rents and push out the residents they were meant to help. This process, often called green gentrification, is a genuine risk when environmental improvement is linked to luxury development. City planners therefore need policies that protect affordable housing while improving public space. Some cities have tried to involve residents in planning decisions, asking them what facilities are needed before construction begins.

Overall, urban green spaces work best when they are treated as everyday infrastructure rather than optional beauty. A successful park is not only a place for leisure; it can cool streets, support exercise, strengthen community ties and make dense urban living more humane. The challenge is to provide these benefits fairly, so that cleaner and healthier neighbourhoods are available to all residents, not only those who can afford them.',
      'admin_original',
      'published',
      now()
    )
    returning id into reading_set_id;

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'reading',
      reading_set_id,
      'multiple_choice',
      1,
      'According to the passage, why are urban green spaces increasingly included in public health planning?',
      '["A. They make cities look more traditional", "B. They can reduce heat and support everyday wellbeing", "C. They replace the need for public transport", "D. They are cheaper than maintaining roads"]'::jsonb,
      '{"skill": "main idea"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'B. They can reduce heat and support everyday wellbeing',
      '文章第一段和第二段说明，城市绿地可以帮助应对高温、人口密度和居民健康问题，因此被纳入公共健康规划。',
      'The passage says green spaces help cities manage heat, density and daily health needs, so option B best matches the main point.',
      '["public health planning", "wellbeing", "daily life", "heat control"]'::jsonb,
      '[{"word":"dense","meaning_zh":"密集的"},{"word":"heatwave","meaning_zh":"热浪"}]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'reading',
      reading_set_id,
      'true_false_not_given',
      2,
      'Trees can make some streets feel cooler by providing shade and releasing water vapour.',
      '["True", "False", "Not Given"]'::jsonb,
      '{"skill": "detail"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'True',
      '第二段明确提到树木通过遮阴和释放水汽降低热感。',
      'Paragraph 2 directly states that trees provide shade and release water vapour, making streets feel cooler.',
      '["shade", "cooler", "water vapour"]'::jsonb,
      '[{"word":"vapour","meaning_zh":"蒸汽，水汽"}]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'reading',
      reading_set_id,
      'sentence_completion',
      3,
      'Complete the sentence. Connected parks and safe paths may encourage residents to walk or cycle for ______.',
      null,
      '{"skill": "sentence completion"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'short journeys||short trips',
      '第三段说，当公园由安全路径连接时，居民更可能为短途出行步行或骑车。',
      'Paragraph 3 says connected parks and safe paths make people more likely to walk or cycle for short journeys.',
      '["short journeys", "short trips", "walk or cycle"]'::jsonb,
      '[{"word":"journey","meaning_zh":"旅程，出行"}]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'reading',
      reading_set_id,
      'short_answer',
      4,
      'What public health issue can community activities in green spaces help reduce?',
      null,
      '{"skill": "short answer"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'loneliness||social isolation',
      '第四段指出，社区花园、市场和户外课程能让邻居见面，而孤独感越来越被认为是公共健康问题。',
      'The passage links community activities to reducing loneliness, which is described as a public health issue.',
      '["loneliness", "social isolation", "community ties"]'::jsonb,
      '[{"word":"loneliness","meaning_zh":"孤独感"}]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'reading',
      reading_set_id,
      'gap_filling',
      5,
      'Fill the gap. New parks can sometimes increase local ______ and push out existing residents.',
      null,
      '{"skill": "gap filling"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'rents||rent',
      '第五段说新公园有时会提高当地租金，并挤出现有居民。',
      'Paragraph 5 states that new parks may raise local rents and displace residents.',
      '["rents", "green gentrification", "affordable housing"]'::jsonb,
      '[{"word":"gentrification","meaning_zh":"士绅化，高档化改造"},{"word":"affordable","meaning_zh":"负担得起的"}]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'reading',
      reading_set_id,
      'short_answer',
      6,
      'According to the final paragraph, what should urban green spaces be treated as?',
      null,
      '{"skill": "short answer"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'everyday infrastructure||infrastructure',
      '最后一段明确说，城市绿地最有效时应被视为日常基础设施，而不是可有可无的美化。',
      'The final paragraph says green spaces work best when treated as everyday infrastructure.',
      '["everyday infrastructure", "optional beauty", "public space"]'::jsonb,
      '[{"word":"infrastructure","meaning_zh":"基础设施"}]'::jsonb
    );
  end if;

  if not exists (
    select 1 from public.listening_sets
    where title = 'Test Listening Set - Library Membership'
  ) then
    insert into public.listening_sets (
      title,
      section,
      topic,
      band,
      script,
      audio_url,
      audio_status,
      source_type,
      status,
      published_at
    )
    values (
      'Test Listening Set - Library Membership',
      1,
      'Daily Life',
      6,
      'Receptionist: Good morning, Riverside Community Library. How can I help you?

Student: Hello. I have just moved to the area and I would like to join the library.

Receptionist: Of course. Membership is free for local residents. I need to take a few details first. Could I have your full name?

Student: It is Daniel Park. That is Daniel with one L, and Park like the public park.

Receptionist: Thank you. And what is your current address?

Student: Flat 8, 24 Market Street. The postcode is BS2 4LN.

Receptionist: Great. Do you have a phone number we can use for reminders?

Student: Yes, it is 07746 238 915.

Receptionist: Thank you. We send notices by email as well. What email address would you like to use?

Student: daniel.park.study@example.com.

Receptionist: Now, most new members choose a standard card. It lets you borrow eight books at a time. Students can also borrow two DVDs, but there is a small charge for each DVD.

Student: I mainly need books and a quiet place to study, so the standard card is fine.

Receptionist: No problem. The card will be ready this afternoon after 3 p.m. You can collect it from the front desk. Please bring photo ID when you come.

Student: Great. Are there study rooms available?

Receptionist: Yes, but they must be booked online. Each booking is for two hours. The busiest time is usually Saturday morning, so weekdays are easier.

Student: That sounds useful. Thank you for your help.

Receptionist: You are welcome. We will see you later today.',
      null,
      'pending',
      'admin_original',
      'published',
      now()
    )
    returning id into listening_set_id;

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'listening',
      listening_set_id,
      'form_completion',
      1,
      'Complete the form. Full name: Daniel ______',
      null,
      '{"skill": "form completion"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'Park',
      '对话中学生说自己的全名是 Daniel Park。',
      'The student gives his full name as Daniel Park.',
      '["full name", "Daniel Park"]'::jsonb,
      '[]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'listening',
      listening_set_id,
      'form_completion',
      2,
      'Complete the form. Address: Flat 8, 24 ______ Street',
      null,
      '{"skill": "form completion"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'Market',
      '学生地址是 Flat 8, 24 Market Street。',
      'The address given is Flat 8, 24 Market Street.',
      '["address", "Market Street"]'::jsonb,
      '[]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'listening',
      listening_set_id,
      'short_answer',
      3,
      'What time will the library card be ready?',
      null,
      '{"skill": "short answer"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      '3 p.m.||3pm||after 3 p.m.||after 3pm',
      '工作人员说卡会在今天下午 3 点之后准备好。',
      'The receptionist says the card will be ready this afternoon after 3 p.m.',
      '["ready", "after 3 p.m.", "this afternoon"]'::jsonb,
      '[]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'listening',
      listening_set_id,
      'multiple_choice',
      4,
      'Which type of card does Daniel choose?',
      '["A. A DVD card", "B. A standard card", "C. A visitor card", "D. A family card"]'::jsonb,
      '{"skill": "multiple choice"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'B. A standard card',
      'Daniel 说主要需要书和安静学习空间，所以 standard card 就可以。',
      'Daniel says the standard card is fine because he mainly needs books and study space.',
      '["standard card", "membership", "borrow books"]'::jsonb,
      '[]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'listening',
      listening_set_id,
      'sentence_completion',
      5,
      'Complete the sentence. Study rooms must be booked ______.',
      null,
      '{"skill": "sentence completion"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'online',
      '工作人员说学习室必须在线预订。',
      'The receptionist says study rooms must be booked online.',
      '["booked online", "study rooms"]'::jsonb,
      '[]'::jsonb
    );

    insert into public.generated_questions (
      set_type, set_id, question_type, question_number, prompt, options, metadata
    )
    values (
      'listening',
      listening_set_id,
      'short_answer',
      6,
      'Which time is usually the busiest for study rooms?',
      null,
      '{"skill": "short answer"}'::jsonb
    )
    returning id into question_id;

    insert into public.generated_answers (
      question_id, correct_answer, explanation_zh, explanation_en, synonyms, vocabulary
    )
    values (
      question_id,
      'Saturday morning||on Saturday morning',
      '工作人员说最忙的时间通常是周六上午。',
      'The busiest time is usually Saturday morning.',
      '["busiest time", "Saturday morning"]'::jsonb,
      '[]'::jsonb
    );
  end if;
end $$;
