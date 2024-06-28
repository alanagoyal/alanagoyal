SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1 (Ubuntu 15.1-1.pgdg20.04+1)
-- Dumped by pg_dump version 15.7 (Ubuntu 15.7-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notes" ("id", "title", "content", "created_at", "public", "session_id", "slug", "category", "emoji") VALUES
	('46b61917-2133-4206-855c-baa16508bb07', 'reading list', '### currently reading
- [barbarians at the gate](https://www.amazon.com/Barbarians-Gate-Fall-RJR-Nabisco/dp/0061655554/)

### so far this year
- [elon musk](https://www.amazon.com/Elon-Musk-SpaceX-Fantastic-Future/dp/006230125X/)
- [steve jobs](https://www.amazon.com/Steve-Jobs-Walter-Isaacson/dp/1451648537/)
- [jony ive](https://www.amazon.com/Jony-Ive-Genius-Behind-Products/dp/159184617X/)
- [the ride of a lifetime](https://www.amazon.com/Ride-Lifetime-Lessons-Learned-Company/dp/0399592091/)
- [who is michael ovitz](https://www.amazon.com/Who-Michael-Ovitz/dp/1591845548/)
- [setting the table](https://www.amazon.com/Setting-Table-Transforming-Hospitality-Business/dp/0060742755/)
- [unreasonable hospitality](https://www.amazon.com/Unreasonable-Hospitality-Remarkable-Power-Giving/dp/0593418571/)
- [einstein](https://www.amazon.com/Einstein-His-Life-Universe-Isaacson/dp/0743264746/)
- [leonardo da vinci](https://www.amazon.com/Leonardo-Vinci-Walter-Isaacson/dp/1501139150/)
- [delivering happiness](https://www.amazon.com/Delivering-Happiness-Profits-Passion-Purpose/dp/0446576220/)
- [wonder boy](https://www.amazon.com/Wonder-Boy-Constance-Wu/dp/B0B9W2TPBF/)
- [napoleon](https://www.amazon.com/Napoleon-Life-Andrew-Roberts/dp/0143127853/)
- [four seasons](https://www.amazon.com/Four-Seasons-Deserted-Island-Menu/dp/1645175797/)
- [grinding it out](https://www.amazon.com/Grinding-Out-Making-McDonalds/dp/125013028X/)
- [shoe dog](https://www.amazon.com/Shoe-Dog-Memoir-Creator-NIKE/dp/1501135910/)
- [amp it up](https://www.amazon.com/Amp-Up-Leadership-Hypergrowth-Companies/dp/1119836115/)
- [the fund](https://www.amazon.com/Fund-Guide-Successful-Fundraising/dp/1534452296/)

### up next
- [titan](https://www.amazon.com/Titan-Life-John-Rockefeller-Sr/dp/1400077303/)
- [the power broker](https://www.amazon.com/Power-Broker-Robert-Moses-Fall/dp/0394720245/)
- [churchill](https://www.amazon.com/Churchill-Paul-Johnson/dp/0143117998/)
- [the passage of power](https://www.amazon.com/Passage-Power-Years-Lyndon-Johnson/dp/0375713255/)
- [sam walton: made in america](https://www.amazon.com/Sam-Walton-Made-America/dp/0553562835/)', '2024-06-14 15:05:32+00', true, NULL, 'reading-list', 'yesterday', '📚'),
	('65d8e406-8ceb-4f2a-918f-80e1f5a9cb61', 'quick links', '- [email](mailto:hi@basecase.vc): inbox zero, always
- [twitter](https://x.com/alanaagoyal): semi-frequent thoughts + updates on the amazing founders i work with
- [github](https://github.com/alanagoyal): so many green squares!
- [linkedin](https://www.linkedin.com/in/alanagoyal/): mostly for stalking people
- [instagram](https://www.instagram.com/alanaagoyal/): quarterly photo dumps of people + places + things i like', '2024-06-28 21:51:06+00', true, NULL, 'quick-links', 'today', '📎'),
	('34c07bc5-f111-4810-b267-18ddbe732bed', 'groceries', 'i hate cooking, so generally make things like yogurt bowls and [girl dinners](https://www.nytimes.com/2023/07/08/style/girl-dinner.html) 
- mangos, blueberries
- greek yogurt
- [steep hill granola](https://www.steephillfoods.com/perfectnut) (the most amazing small-batch granola that is sadly going out of business 😢)
- chia seeds, hemp seeds, cacao nibs, coconut flakes, goji berries, etc. etc.
- parmesan, manchego
- prosciutto, salami
- [fishwife tinned seafood co](https://eatfishwife.com/products/the-2023-big-fish-pack?variant=44738899575036&currency=USD) tuna, sardines, anchovies (don''t knock it ''till you try it)
- seed crackers
- dates
- coke zero
- perrier', '2024-06-14 22:47:45.808451+00', true, NULL, 'groceries', '7', '🍎'),
	('a21c0d86-065b-4934-b7f6-bfb421a6fa22', 'test', 'hey alana, was surprised you''re not listening to taylor swift xD', '2024-06-25 23:46:03.646+00', false, '03f13195-b7bf-4ded-9c82-4f0187713bb5', 'new-note-a21c0d86-065b-4934-b7f6-bfb421a6fa22', 'today', '😱'),
	('3fd3a1e4-bfc9-4bdb-a7c4-52e48653918c', 'principles', '* act with urgency
* respond immediately
* if it''s under an hour, walk
* ship something everyday
* people remember how you make them feel
* it''s a marathon, not a sprint
* great outfits are meant to be repeated
* exercise everyday
* make friends on the internet
* work harder than you think you should', '2024-06-27 15:51:40.749565+00', true, NULL, 'principles', 'today', '📖'),
	('fd234e08-7ac1-4332-a3fe-06ece731c314', 'about me', '### currently
- founder & managing partner of [basecase capital](https://basecase.vc/)
- partner to a number of incredible companies, including [ashby](https://www.ashbyhq.com/), [astral](https://astral.sh/), [baseten](https://www.baseten.co/), [braintrust](https://braintrust.dev/), [browserbase](https://browserbase.com/), [default](https://default.com/), [graphite](https://graphite.dev/), [resend](https://resend.com/), [supabase](https://supabase.com/), [vercel](https://vercel.com/), & others 
- builder & maintainer of a few little open-source projects, including [branded](https://branded.ai), [draftmysafe](https://draftmysafe.com), & others


### previously
- joined [samsara](https://www.samsara.com/) as the first product manager on the platform & infrastructure team
- interned at [greylock](https://greylock.com) and was lucky enough to help out with their incubation of [abnormal security](https://https://abnormalsecurity.com/)
- launched the [home equity platform at blend](https://blend.com/home-equity-opportunities/)
- shipped the first self-service product at [appdynamics](https://www.appdynamics.com/free-trial/)
- interned on the research and development team at [natera](https://www.natera.com/)
- studied computer science at [columbia university](https://www.columbia.edu/)', '2024-06-17 19:00:00+00', true, NULL, NULL, 'pinned', '🙋🏼‍♀️'),
	('fd73a76e-80aa-4c25-874e-813493180f86', 'bookmarks', '- "sometimes magic is just someone spending more time on something than anyone else might reasonably expect" - will guidara, *[unreasonable hospitality](https://www.amazon.com/Unreasonable-Hospitality-Remarkable-Power-Giving/dp/0593418571/)*
- "anyone can get a first meeting" - michael ovitz, *[who is michael ovitz](https://www.amazon.com/Who-Michael-Ovitz/dp/1591845548/)*
- "happiness is not a tangible thing, it''s a byproduct of achievement" - ray kroc, *[grinding it out](https://www.amazon.com/Grinding-Out-Making-McDonalds/dp/125013028X/)*
- "there''s aesthetic value in doing things the right way" - danny meyer, *[setting the table](https://www.amazon.com/Setting-Table-Transforming-Hospitality-Business/dp/0060742755/)*
- "intensity is the price of excellence" - warren buffett
_ "when there is doubt, there is no doubt” - frank slootman, [amp it up](https://www.amazon.com/Amp-Hypergrowth-Expectations-Increasing-Elevating-ebook/dp/B09QHBZDDZ?dib=eyJ2IjoiMSJ9.PhxwO_YuI9_eX4BIneCrV09NLi3BBYjTI6QUAZGsMOyt5Xa9bbDyGzqyWU_Eph-tKTRNuJynyyrdEtLlkMQ-bthvZlvKCtxS_PUlkpiE4Sk1UTvxm93AYQPWNV6buM6f.56zD--mVSOQ0FDa04ZpqyTqqOZcYzlzkFjYuooMzq1M&dib_tag=se&hydadcr=21907_13324190&keywords=amp+it+up+by+frank+slootman&qid=1719450095&sr=8-1)"
- "you measure yourself by the people who measure themselves by you" - phil knight, *[shoe dog](https://www.amazon.com/Shoe-Dog-Memoir-Creator-NIKE/dp/1501135910/)*', '2024-06-23 18:21:08.13833+00', true, NULL, 'bookmarks', '7', '📁'),
	('02a00112-d0a2-4586-a43a-195b0f4105bf', 'on repeat', '### edm/house
- [sultan + shepherd dj set - malibu ranch](https://www.youtube.com/watch?v=QNtfijAcotU&t=2690s&ab_channel=ThisNeverHappened)
- [chris luno sunset mix - thailand](https://www.youtube.com/watch?v=fIWRqMLhWbI&ab_channel=ThisNeverHappened)
- [ben böhmer - live at the roundhouse, london](https://www.youtube.com/watch?v=guOFgrp7JoI&ab_channel=BenB%C3%B6hmer)
- [massane live set - portes du soleil, french alps](https://www.youtube.com/watch?v=LyOqMMQskU4&t=3191s&ab_channel=ThisNeverHappened)
- [lane 8 sunrise set - grand lake, colorado](https://www.youtube.com/watch?v=n_LcVqqHSY8&t=1638s&ab_channel=ThisNeverHappened)
- [jerro - chromatic radio](https://www.youtube.com/watch?v=lv_DHi5TNGs&ab_channel=Jerro) (in the cold ft. familiar faces is 🤌🏼)

### hip-hop/rap
- drake
- 21 savage
- future
- travis scott

### indie/rock
- tame impala
- arcade fire
- vampire weekend (kind of)

### pop
- ariana grande (eternal sunshine)
- olivia rodrigo
- dua lipa

### country
- morgan wallen (obsessed, the only country artist i listen to)', '2024-06-14 22:48:41.026439+00', true, NULL, 'on-repeat', 'yesterday', '🎧'),
	('767f8b2b-2f20-4c65-8c9d-c219bd689fa1', 'favorite products', '### development stack
- [supabase](https://supabase.com/): let''s not pretend we''re rolling our own postgres over here
- [next.js](https://nextjs.org/): the only app framework you need
- [vercel](https://vercel.com/): have literally never hosted a project elsewhere
- [shadcn/ui](ui.shadcn.com/): simply could not build an app without these ui components
- [resend](https://resend.com/): dead simple email api
- [braintrust](https://braintrust.dev): prompts, playgrounds, logging, datasets, and evals in one platform
- [cursor](https://cursor.com/): the best ai ide i''ve found
- [cleanshotx](https://cleanshot.com/): sick screenshots

### productivity stack
- [airtable](https://airtable.com): love an extensible crm
- [dropbox paper](https://www.dropbox.com/paper/): die hard fan, won''t let them shut it down
- [superhuman](https://superhuman.com): tried to live without it, but can''t
- [texts](https://texts.com): amazing when it works

### other
- [waymo](https://waymo.com): almost exclusively in waymos these days (unelss in another city or going on the freeway)
- [peloton](https://peloton.com): devout rider/runner (favorite instructors: olivia amato, alex toussaint, cody rigsby)
- [apple airpods max](https://www.apple.com/airpods-max/): big headphone gal
- [asics gel 1130](https://www.stadiumgoods.com/en-us/shopping/asics-gel-1130): wear these almost every day
- [reusable glass straws](https://www.amazon.com/Antner-Reusable-Drinking-Cleaning-Included/dp/B0B1B2RL2S?crid=2S11278VGM141&dib=eyJ2IjoiMSJ9.yQ0Skv0xdy3dGcg_ycRsAtDn9800tQNGa-uFfWhqAFledx6UmVjBaX9RATxEDrqgt08TEc9m4orpvKbKEFwwYZxUIC8lfr7lV2DBhhwCr4n_5KiJDpdPzhPs3e83a4GnAbqlr1SkRV51g6dg3z4vz2cGoOFFRKHrQNormt64F_jAJ354xTTjRcFMOEo6QG9sEX_rcYd33L3IS6WrTiXMcR7GZVvKDGVgWDmHmklabT4.W3HtTu23h9Uuyvz-FiHGbAOSg5NEw4wD7Snt8j6yqSk&dib_tag=se&keywords=amazon+glass+straws&qid=1719503962&sprefix=amazon+straws,aps,125&sr=8-4&th=1)', '2024-06-11 00:48:49+00', true, NULL, 'favorite-products', 'yesterday', '🫶🏼');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
