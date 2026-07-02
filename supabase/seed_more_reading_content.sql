do $$
declare
  set_record record;
  q_record record;
  reading_set_id uuid;
  question_id uuid;
begin
  for set_record in
    select *
    from (
      values
        (
          'Urban Green Spaces and Public Health',
          'Environment',
          6,
          $passage$
Urban green spaces are no longer viewed simply as pleasant decoration between roads and buildings. In many modern cities, parks, community gardens and tree-lined streets are becoming part of public health planning. As temperatures rise and populations grow denser, local authorities are beginning to ask how small areas of nature can make daily life more manageable for residents.

One clear benefit is temperature control. Concrete and asphalt absorb heat during the day and release it slowly at night, which can make city centres several degrees warmer than surrounding rural areas. Trees reduce this effect by providing shade and by releasing water vapour through their leaves. A street with mature trees may feel noticeably cooler than a similar street without them. For people who walk to work, wait for buses or live in older apartments without air conditioning, this difference is not merely comfortable; it can affect health during heatwaves.

Green spaces also influence how people move through a city. When parks are connected by safe paths, residents are more likely to walk or cycle for short journeys. This can reduce traffic, but the more immediate effect is often personal. Regular walking improves fitness without requiring expensive equipment or gym membership. Some studies suggest that people are more willing to exercise when the route is attractive and feels safe.

There are social benefits as well. Community gardens, weekend markets and outdoor exercise classes can give neighbours a reason to meet. This matters because loneliness is increasingly recognised as a public health issue. However, the success of these places depends on design and maintenance. A poorly lit park with broken benches may be avoided, while a clean space with clear entrances and active use can feel welcoming.

Critics argue that new parks can sometimes raise local rents and push out the residents they were meant to help. This process, often called green gentrification, is a genuine risk when environmental improvement is linked to luxury development. City planners therefore need policies that protect affordable housing while improving public space.

Overall, urban green spaces work best when they are treated as everyday infrastructure rather than optional beauty. A successful park can cool streets, support exercise, strengthen community ties and make dense urban living more humane. The challenge is to provide these benefits fairly, so that cleaner and healthier neighbourhoods are available to all residents.
$passage$,
          jsonb_build_array(
            jsonb_build_object('question_type','multiple_choice','question_number',1,'prompt','According to the passage, why are urban green spaces increasingly included in public health planning?','options',jsonb_build_array('A. They make cities look more traditional','B. They can reduce heat and support everyday wellbeing','C. They replace the need for public transport','D. They are cheaper than maintaining roads'),'correct_answer','B. They can reduce heat and support everyday wellbeing||B','explanation_zh','文章说明城市绿地可以缓解高温、支持日常健康和公共生活，因此被纳入公共健康规划。','explanation_en','The passage links green spaces with heat reduction, walking, social contact and health, so option B is the best answer.','synonyms',jsonb_build_array('public health planning','wellbeing','heat control'),'vocabulary',jsonb_build_array(jsonb_build_object('word','dense','meaning_zh','密集的'),jsonb_build_object('word','heatwave','meaning_zh','热浪'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',2,'prompt','Trees can make some streets feel cooler by providing shade and releasing water vapour.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','True','explanation_zh','第二段明确提到树木通过遮阴和释放水汽使街道感觉更凉爽。','explanation_en','Paragraph 2 directly states both mechanisms: shade and water vapour.','synonyms',jsonb_build_array('shade','cooler','water vapour'),'vocabulary',jsonb_build_array(jsonb_build_object('word','vapour','meaning_zh','水汽'))),
            jsonb_build_object('question_type','sentence_completion','question_number',3,'prompt','Complete the sentence. Connected parks and safe paths may encourage residents to walk or cycle for ______.','options',null,'correct_answer','short journeys||short trips','explanation_zh','第三段说安全路径连接的公园会让居民更可能为短途出行步行或骑车。','explanation_en','The answer is stated in paragraph 3: people may walk or cycle for short journeys.','synonyms',jsonb_build_array('short journeys','short trips'),'vocabulary',jsonb_build_array(jsonb_build_object('word','journey','meaning_zh','出行，旅程'))),
            jsonb_build_object('question_type','short_answer','question_number',4,'prompt','What public health issue can community activities in green spaces help reduce?','options',null,'correct_answer','loneliness||social isolation','explanation_zh','第四段指出社区活动让邻居见面，有助于减少孤独感。','explanation_en','The passage describes loneliness as a public health issue that community activities may reduce.','synonyms',jsonb_build_array('loneliness','social isolation'),'vocabulary',jsonb_build_array(jsonb_build_object('word','loneliness','meaning_zh','孤独感'))),
            jsonb_build_object('question_type','gap_filling','question_number',5,'prompt','Fill the gap. New parks can sometimes increase local ______ and push out existing residents.','options',null,'correct_answer','rents||rent','explanation_zh','第五段说新公园有时会提高当地租金并挤出现有居民。','explanation_en','Paragraph 5 mentions that new parks can raise local rents.','synonyms',jsonb_build_array('rents','green gentrification'),'vocabulary',jsonb_build_array(jsonb_build_object('word','gentrification','meaning_zh','士绅化'))),
            jsonb_build_object('question_type','short_answer','question_number',6,'prompt','According to the final paragraph, what should urban green spaces be treated as?','options',null,'correct_answer','everyday infrastructure||infrastructure','explanation_zh','最后一段说城市绿地最有效时应被视为日常基础设施。','explanation_en','The final paragraph states that green spaces should be treated as everyday infrastructure.','synonyms',jsonb_build_array('everyday infrastructure','public space'),'vocabulary',jsonb_build_array(jsonb_build_object('word','infrastructure','meaning_zh','基础设施')))
          )
        ),
        (
          'The Future of Online Education',
          'Education',
          6,
          $passage$
Online education has moved from being an emergency solution to becoming a regular part of many students' learning lives. Universities, language schools and private tutors now use digital platforms not only to deliver lessons, but also to manage homework, feedback and communication. For IELTS candidates, this shift is especially visible. A student can join a speaking class from a small town, complete a reading task on a phone, and receive written comments from a teacher in another country.

The main advantage of online education is flexibility. Students who travel long distances to school or work part time can study at times that fit their schedule. Recorded lessons are useful because learners can pause difficult explanations and review them later. This is particularly helpful in language learning, where repeated exposure to vocabulary and pronunciation often matters more than hearing something once in a classroom.

However, flexibility does not automatically lead to progress. Online learners need self-discipline because the structure of a physical classroom is partly removed. A student may register for an impressive course but still fail to complete it if there is no routine. Teachers have noticed that short, regular tasks often work better than long video lectures. When a platform asks learners to do a ten-minute activity every day, the habit can become easier to maintain.

Another issue is interaction. Some people assume that online classes are lonely, but this depends on design. A live lesson with discussion rooms, shared documents and quick polls can be highly interactive. On the other hand, a long recording with no feedback can feel passive. Good online courses therefore combine explanation, practice and response. Students need to know whether they are improving, not just whether they have watched a video.

Access remains a challenge. Fast internet, quiet space and suitable devices are not available to everyone. If online education is treated as the only future, it may disadvantage learners who already face economic pressure. Schools and governments need to consider equipment loans, community study spaces and low-bandwidth materials.

The future of education is unlikely to be fully online or fully face-to-face. A blended model may become the most practical option. In such a system, online tools provide convenience and data, while classroom meetings support motivation, discussion and personal guidance. The real question is not whether technology will replace teachers, but how it can help teachers spend more time on the parts of learning that require human judgement.
$passage$,
          jsonb_build_array(
            jsonb_build_object('question_type','multiple_choice','question_number',1,'prompt','What is the main advantage of online education mentioned in the passage?','options',jsonb_build_array('A. It removes the need for teachers','B. It gives students more flexibility','C. It is always cheaper than classroom learning','D. It guarantees faster progress'),'correct_answer','B. It gives students more flexibility||B','explanation_zh','第二段直接指出在线教育的主要优势是灵活性。','explanation_en','Paragraph 2 states that the main advantage is flexibility.','synonyms',jsonb_build_array('flexibility','fit their schedule'),'vocabulary',jsonb_build_array(jsonb_build_object('word','flexibility','meaning_zh','灵活性'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',2,'prompt','Recorded lessons can help language learners review difficult explanations.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','True','explanation_zh','第二段说明录播课可以暂停并回看困难解释。','explanation_en','The passage says students can pause difficult explanations and review them later.','synonyms',jsonb_build_array('recorded lessons','review later'),'vocabulary',jsonb_build_array(jsonb_build_object('word','exposure','meaning_zh','接触，暴露'))),
            jsonb_build_object('question_type','sentence_completion','question_number',3,'prompt','Complete the sentence. Online learners need self-discipline because the structure of a physical ______ is partly removed.','options',null,'correct_answer','classroom','explanation_zh','第三段说在线学习者需要自律，因为实体课堂的结构被部分移除了。','explanation_en','The answer is taken from paragraph 3.','synonyms',jsonb_build_array('physical classroom','structure'),'vocabulary',jsonb_build_array(jsonb_build_object('word','self-discipline','meaning_zh','自律'))),
            jsonb_build_object('question_type','short_answer','question_number',4,'prompt','What type of tasks may work better than long video lectures?','options',null,'correct_answer','short, regular tasks||short regular tasks','explanation_zh','第三段说教师发现短而规律的任务通常比长视频课更有效。','explanation_en','The passage contrasts short, regular tasks with long video lectures.','synonyms',jsonb_build_array('short tasks','regular practice'),'vocabulary',jsonb_build_array(jsonb_build_object('word','routine','meaning_zh','日常安排，惯例'))),
            jsonb_build_object('question_type','gap_filling','question_number',5,'prompt','Fill the gap. A good online course should combine explanation, practice and ______.','options',null,'correct_answer','response||feedback','explanation_zh','第四段说明优秀在线课程应结合讲解、练习和回应。','explanation_en','Paragraph 4 says good online courses combine explanation, practice and response. Feedback is also acceptable because the paragraph discusses feedback.','synonyms',jsonb_build_array('response','feedback'),'vocabulary',jsonb_build_array(jsonb_build_object('word','interactive','meaning_zh','互动的'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',6,'prompt','The author believes all future education should be fully online.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','False','explanation_zh','最后一段说未来不太可能完全在线或完全线下，而是混合模式更实际。','explanation_en','The final paragraph argues for a blended model, not fully online education.','synonyms',jsonb_build_array('blended model','fully online'),'vocabulary',jsonb_build_array(jsonb_build_object('word','blended','meaning_zh','混合的')))
          )
        ),
        (
          'How Sleep Affects Memory',
          'Health / Psychology',
          7,
          $passage$
Sleep is often described as a period of rest, but the brain remains remarkably active during the night. One of its most important tasks is memory consolidation, the process by which new information becomes more stable and easier to retrieve later. This is why students who study late into the night may not always perform better than those who sleep properly after studying. The sleeping brain appears to organise, strengthen and sometimes even reinterpret what has been learned.

Researchers usually divide memory into several types. Declarative memory involves facts and events, such as remembering a historical date or the meaning of a new word. Procedural memory involves skills, such as playing a piece of music or using a new keyboard shortcut. Both types can benefit from sleep, although they may depend on different sleep stages. Deep sleep seems particularly important for facts, while rapid eye movement sleep may help with emotional material and creative connections.

During sleep, the brain is thought to replay patterns of activity that occurred during learning. This replay does not mean that a person consciously repeats a lesson. Instead, groups of neurons fire in similar sequences, allowing the brain to strengthen useful connections and weaken less important ones. In this way, sleep can act like an editor, keeping the most relevant information while reducing mental noise.

The timing of sleep also matters. A short nap after learning can improve recall, especially when the learner has been concentrating intensely. However, naps are not a complete replacement for a full night of sleep. Long-term memory, mood and attention all suffer when sleep is repeatedly restricted. In classrooms and workplaces, tired people may seem present, but their ability to notice details and solve problems is reduced.

There is also evidence that sleep supports emotional balance. Memories connected with stress or embarrassment may feel less intense after a good night of sleep. This does not erase the memory, but it may make it easier to think about calmly. For students preparing for high-pressure exams, this emotional effect is important. Anxiety can interfere with recall, so sleep may help indirectly by making the mind more stable.

Modern habits often work against healthy sleep. Bright screens, late caffeine and irregular schedules can delay the natural signals that prepare the body for rest. For learners, the solution is not simply to study less, but to plan study sessions so that sleep becomes part of the learning strategy. A consistent bedtime, a short review before sleep and fewer digital distractions may improve memory more than an extra hour of exhausted reading.
$passage$,
          jsonb_build_array(
            jsonb_build_object('question_type','multiple_choice','question_number',1,'prompt','What is memory consolidation?','options',jsonb_build_array('A. Forgetting unimportant facts immediately','B. Making new information more stable and easier to retrieve','C. Learning only during rapid eye movement sleep','D. Replacing classroom study with naps'),'correct_answer','B. Making new information more stable and easier to retrieve||B','explanation_zh','第一段定义 memory consolidation 为让新信息更稳定、更容易之后提取的过程。','explanation_en','The definition is given in paragraph 1.','synonyms',jsonb_build_array('memory consolidation','stable','retrieve'),'vocabulary',jsonb_build_array(jsonb_build_object('word','retrieve','meaning_zh','提取，找回'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',2,'prompt','Declarative memory includes facts and events.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','True','explanation_zh','第二段明确说 declarative memory 涉及事实和事件。','explanation_en','Paragraph 2 directly states this.','synonyms',jsonb_build_array('facts and events','declarative memory'),'vocabulary',jsonb_build_array(jsonb_build_object('word','declarative','meaning_zh','陈述性的'))),
            jsonb_build_object('question_type','sentence_completion','question_number',3,'prompt','Complete the sentence. During sleep, groups of neurons may fire in similar ______.','options',null,'correct_answer','sequences','explanation_zh','第三段说神经元群会以相似序列放电。','explanation_en','The word "sequences" is used in paragraph 3.','synonyms',jsonb_build_array('patterns','sequences'),'vocabulary',jsonb_build_array(jsonb_build_object('word','neuron','meaning_zh','神经元'))),
            jsonb_build_object('question_type','short_answer','question_number',4,'prompt','What can a short nap after learning improve?','options',null,'correct_answer','recall','explanation_zh','第四段说学习后的短午睡可以提升 recall。','explanation_en','Paragraph 4 states that a short nap after learning can improve recall.','synonyms',jsonb_build_array('recall','remembering'),'vocabulary',jsonb_build_array(jsonb_build_object('word','recall','meaning_zh','回忆能力'))),
            jsonb_build_object('question_type','gap_filling','question_number',5,'prompt','Fill the gap. Anxiety can interfere with ______, so sleep may help indirectly.','options',null,'correct_answer','recall','explanation_zh','第五段指出焦虑会干扰回忆，因此睡眠可通过稳定情绪间接帮助。','explanation_en','The sentence appears in paragraph 5.','synonyms',jsonb_build_array('anxiety','recall'),'vocabulary',jsonb_build_array(jsonb_build_object('word','interfere','meaning_zh','干扰'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',6,'prompt','The passage recommends using sleep as part of a learning strategy.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','True','explanation_zh','最后一段明确说应把睡眠作为学习策略的一部分。','explanation_en','The final paragraph says sleep should become part of the learning strategy.','synonyms',jsonb_build_array('learning strategy','consistent bedtime'),'vocabulary',jsonb_build_array(jsonb_build_object('word','consistent','meaning_zh','稳定的，一贯的'))),
            jsonb_build_object('question_type','short_answer','question_number',7,'prompt','Name one modern habit that can delay the body''s natural sleep signals.','options',null,'correct_answer','bright screens||late caffeine||irregular schedules','explanation_zh','最后一段列出亮屏、晚喝咖啡因和不规律作息都会延迟睡眠信号。','explanation_en','Any one of the three habits listed in the final paragraph is acceptable.','synonyms',jsonb_build_array('bright screens','late caffeine','irregular schedules'),'vocabulary',jsonb_build_array(jsonb_build_object('word','caffeine','meaning_zh','咖啡因')))
          )
        ),
        (
          'Renewable Energy in Small Communities',
          'Technology / Environment',
          7,
          $passage$
Renewable energy is often discussed through the example of large wind farms or national solar projects, but some of the most interesting changes are taking place in small communities. Villages, islands and remote towns are experimenting with local energy systems that combine solar panels, small turbines, batteries and careful management of demand. These projects are not always dramatic, but they can change how residents think about electricity.

For communities far from major power stations, local renewable energy can improve reliability. A storm or technical fault on a long transmission line may leave a remote area without power for many hours. If the community has its own generation and storage, essential services such as clinics, water pumps and communication equipment may continue operating. This does not mean that every small community can become completely independent, but even partial independence can reduce risk.

Cost is another motivation. Diesel fuel is expensive to transport to islands or mountain settlements, and its price can change quickly. Solar and wind systems require investment at the beginning, but their operating costs are usually lower. Over time, the savings can be used for maintenance, school equipment or other local needs. However, the financial benefits depend on planning. A poorly designed system may produce too much electricity at the wrong time and too little when demand is high.

This is why batteries and demand management are important. Batteries store electricity for evening use, while demand management encourages people to run energy-hungry appliances when supply is strong. For example, a community laundry may operate during sunny hours, or water may be pumped to a storage tank when wind speeds are high. Such arrangements require cooperation, because energy use becomes a shared responsibility rather than a private habit.

Local ownership can also influence attitudes. When residents help choose the site of a turbine or invest in a solar cooperative, they may be more willing to accept changes to the landscape. In contrast, a project imposed by an outside company can create resistance, even if it uses clean technology. Trust is therefore as important as engineering. Public meetings, transparent budgets and local jobs can make renewable projects feel less like experiments and more like community assets.

Small renewable systems will not solve every energy problem. They still need technical support, replacement parts and careful safety rules. Nevertheless, they show that the energy transition is not only a matter for national governments. When designed well, community-scale renewables can make electricity cleaner, more reliable and more meaningful to the people who use it.
$passage$,
          jsonb_build_array(
            jsonb_build_object('question_type','multiple_choice','question_number',1,'prompt','Which communities are mentioned as examples of places using local renewable systems?','options',jsonb_build_array('A. Capital cities and suburbs','B. Villages, islands and remote towns','C. Only farming regions','D. Large industrial centres'),'correct_answer','B. Villages, islands and remote towns||B','explanation_zh','第一段直接提到 villages, islands and remote towns。','explanation_en','The examples are listed in paragraph 1.','synonyms',jsonb_build_array('small communities','remote towns'),'vocabulary',jsonb_build_array(jsonb_build_object('word','remote','meaning_zh','偏远的'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',2,'prompt','Local renewable energy can help essential services continue during some power failures.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','True','explanation_zh','第二段说本地发电和储能可让诊所、水泵、通信设备等继续运转。','explanation_en','Paragraph 2 states that essential services may continue operating.','synonyms',jsonb_build_array('essential services','power failures'),'vocabulary',jsonb_build_array(jsonb_build_object('word','transmission line','meaning_zh','输电线路'))),
            jsonb_build_object('question_type','sentence_completion','question_number',3,'prompt','Complete the sentence. Solar and wind systems require investment at the ______.','options',null,'correct_answer','beginning','explanation_zh','第三段说太阳能和风能系统一开始需要投资。','explanation_en','The phrase is "investment at the beginning".','synonyms',jsonb_build_array('initial investment','at the beginning'),'vocabulary',jsonb_build_array(jsonb_build_object('word','investment','meaning_zh','投资'))),
            jsonb_build_object('question_type','short_answer','question_number',4,'prompt','What can store electricity for evening use?','options',null,'correct_answer','batteries','explanation_zh','第四段说电池可以储存电力供夜间使用。','explanation_en','Paragraph 4 states that batteries store electricity for evening use.','synonyms',jsonb_build_array('batteries','storage'),'vocabulary',jsonb_build_array(jsonb_build_object('word','appliance','meaning_zh','家用电器'))),
            jsonb_build_object('question_type','gap_filling','question_number',5,'prompt','Fill the gap. Energy use becomes a shared responsibility rather than a private ______.','options',null,'correct_answer','habit','explanation_zh','第四段末句说能源使用变成共同责任，而不是私人习惯。','explanation_en','The exact word in the passage is habit.','synonyms',jsonb_build_array('shared responsibility','private habit'),'vocabulary',jsonb_build_array(jsonb_build_object('word','cooperation','meaning_zh','合作'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',6,'prompt','Projects imposed by outside companies always receive strong local support.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','False','explanation_zh','第五段说外部公司强加的项目可能产生抵触，而不是总能得到支持。','explanation_en','The passage says outside projects can create resistance.','synonyms',jsonb_build_array('imposed','resistance'),'vocabulary',jsonb_build_array(jsonb_build_object('word','transparent','meaning_zh','透明的'))),
            jsonb_build_object('question_type','short_answer','question_number',7,'prompt','According to the final paragraph, what kind of support do small renewable systems still need?','options',null,'correct_answer','technical support||replacement parts||careful safety rules','explanation_zh','最后一段列出技术支持、替换零件和安全规则。任一答案均可。','explanation_en','Any one of the three needs listed in the final paragraph is acceptable.','synonyms',jsonb_build_array('technical support','replacement parts','safety rules'),'vocabulary',jsonb_build_array(jsonb_build_object('word','transition','meaning_zh','转型')))
          )
        ),
        (
          'The History of Public Libraries',
          'Culture / History',
          6,
          $passage$
Public libraries are sometimes imagined as quiet rooms filled with old books, but their history is closely connected to social change. The idea that ordinary people should have access to shared knowledge developed slowly. In earlier centuries, books were expensive and many collections belonged to religious institutions, universities or wealthy individuals. Access was often limited to people with education, money or social status.

The growth of public libraries in the nineteenth century was linked to urbanisation and expanding literacy. As more people moved to cities and learned to read, reformers argued that libraries could support education, moral improvement and civic life. A library was not only a place to borrow books; it was a symbol that knowledge should not belong only to a small elite. Some early libraries charged subscription fees, while others were funded by local taxes or private donations.

Architecture played a role in the message libraries sent. Large reading rooms, high windows and central desks suggested order, seriousness and public purpose. At the same time, rules could be strict. Readers might need to request a book from a librarian rather than browse shelves themselves. Silence was enforced, and opening hours sometimes suited middle-class users more than workers. Public access existed, but it was shaped by social expectations.

During the twentieth century, libraries became more welcoming and practical. Open shelves allowed visitors to explore subjects freely. Children's rooms, newspaper areas and local history collections expanded the library's role. In many towns, the library became one of the few indoor public spaces where people could spend time without buying anything. This made libraries important not just for study, but also for community life.

Technology has repeatedly changed library services. Card catalogues gave way to digital search systems, and many libraries now lend e-books, provide internet access and teach digital skills. Some people predicted that the internet would make libraries unnecessary. Instead, many libraries adapted by helping users find reliable information in an environment where there is too much material rather than too little.

The modern public library is therefore a mixture of tradition and adaptation. It preserves books, archives and local memory, but it also offers study spaces, workshops and digital support. Its value lies not only in the objects it stores, but in the principle it represents: knowledge is a public resource. As long as communities need fair access to information, libraries will continue to have a role, even if their tools keep changing.
$passage$,
          jsonb_build_array(
            jsonb_build_object('question_type','multiple_choice','question_number',1,'prompt','In earlier centuries, who often controlled book collections?','options',jsonb_build_array('A. Sports clubs and markets','B. Religious institutions, universities or wealthy individuals','C. Railway companies','D. Children''s schools only'),'correct_answer','B. Religious institutions, universities or wealthy individuals||B','explanation_zh','第一段说明早期许多藏书属于宗教机构、大学或富人。','explanation_en','Paragraph 1 lists these groups as owners of many collections.','synonyms',jsonb_build_array('collections','wealthy individuals'),'vocabulary',jsonb_build_array(jsonb_build_object('word','institution','meaning_zh','机构'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',2,'prompt','The growth of public libraries was linked to urbanisation and expanding literacy.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','True','explanation_zh','第二段第一句明确说明公共图书馆增长与城市化和识字率提高有关。','explanation_en','This is directly stated in paragraph 2.','synonyms',jsonb_build_array('urbanisation','literacy'),'vocabulary',jsonb_build_array(jsonb_build_object('word','literacy','meaning_zh','识字能力'))),
            jsonb_build_object('question_type','sentence_completion','question_number',3,'prompt','Complete the sentence. Early libraries were sometimes funded by local taxes or private ______.','options',null,'correct_answer','donations','explanation_zh','第二段末句说一些早期图书馆由地方税收或私人捐赠资助。','explanation_en','The missing word is donations.','synonyms',jsonb_build_array('private donations','funded'),'vocabulary',jsonb_build_array(jsonb_build_object('word','donation','meaning_zh','捐赠'))),
            jsonb_build_object('question_type','short_answer','question_number',4,'prompt','What allowed visitors to explore subjects freely in the twentieth century?','options',null,'correct_answer','open shelves','explanation_zh','第四段说开放书架让访问者可以自由探索主题。','explanation_en','Paragraph 4 states that open shelves allowed free exploration.','synonyms',jsonb_build_array('open shelves','browse freely'),'vocabulary',jsonb_build_array(jsonb_build_object('word','shelf','meaning_zh','书架'))),
            jsonb_build_object('question_type','gap_filling','question_number',5,'prompt','Fill the gap. Many libraries now lend e-books, provide internet access and teach digital ______.','options',null,'correct_answer','skills','explanation_zh','第五段说很多图书馆现在借电子书、提供网络并教授数字技能。','explanation_en','The phrase in paragraph 5 is digital skills.','synonyms',jsonb_build_array('digital skills','internet access'),'vocabulary',jsonb_build_array(jsonb_build_object('word','catalogue','meaning_zh','目录'))),
            jsonb_build_object('question_type','true_false_not_given','question_number',6,'prompt','The author says the internet made public libraries unnecessary.','options',jsonb_build_array('True','False','Not Given'),'correct_answer','False','explanation_zh','第五段说有人曾预测互联网会让图书馆不再需要，但许多图书馆通过适应继续发挥作用。','explanation_en','The author rejects the idea by explaining how libraries adapted.','synonyms',jsonb_build_array('unnecessary','adapted'),'vocabulary',jsonb_build_array(jsonb_build_object('word','reliable','meaning_zh','可靠的'))),
            jsonb_build_object('question_type','short_answer','question_number',7,'prompt','According to the final paragraph, what principle does the public library represent?','options',null,'correct_answer','knowledge is a public resource||public resource','explanation_zh','最后一段说图书馆代表的原则是知识是一种公共资源。','explanation_en','The answer is directly stated in the final paragraph.','synonyms',jsonb_build_array('public resource','fair access'),'vocabulary',jsonb_build_array(jsonb_build_object('word','principle','meaning_zh','原则')))
          )
        )
    ) as seed(title, topic, band, passage, questions)
  loop
    if exists (
      select 1
      from public.reading_sets
      where title = set_record.title
    ) then
      continue;
    end if;

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
      set_record.title,
      set_record.topic,
      set_record.band,
      600,
      trim(set_record.passage),
      'admin_original',
      'published',
      now()
    )
    returning id into reading_set_id;

    for q_record in
      select *
      from jsonb_to_recordset(set_record.questions) as question(
        question_type text,
        question_number int,
        prompt text,
        options jsonb,
        correct_answer text,
        explanation_zh text,
        explanation_en text,
        synonyms jsonb,
        vocabulary jsonb
      )
    loop
      insert into public.generated_questions (
        set_type,
        set_id,
        question_type,
        question_number,
        prompt,
        options,
        metadata
      )
      values (
        'reading',
        reading_set_id,
        q_record.question_type,
        q_record.question_number,
        q_record.prompt,
        q_record.options,
        jsonb_build_object('seed', 'seed_more_reading_content', 'original', true)
      )
      returning id into question_id;

      insert into public.generated_answers (
        question_id,
        correct_answer,
        explanation_zh,
        explanation_en,
        synonyms,
        vocabulary
      )
      values (
        question_id,
        q_record.correct_answer,
        q_record.explanation_zh,
        q_record.explanation_en,
        coalesce(q_record.synonyms, '[]'::jsonb),
        coalesce(q_record.vocabulary, '[]'::jsonb)
      );
    end loop;
  end loop;
end $$;
