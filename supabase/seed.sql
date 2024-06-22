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
	('1d3b70d6-ce1b-4d66-9936-4f5fd38c43aa', 'welcome', 'welcome! as someone who reaches out to a lot of people, i love when i can learn more about them from their website. 

with that, i figured what better way to get to know me than a peek inside my notes. in addition to the boring basics (i.e. about me), i''ve shared some of my favorite products, books, music, foods, etc. 

you can also interact with the site by adding your own note (visible only to you and me). ', '2024-06-22 22:46:44+00', true, NULL, NULL, 'pinned', '📌'),
	('46b61917-2133-4206-855c-baa16508bb07', 'reading list', 'i read a lot of books!

### currently reading
- barbarians at the gate

### so far this year
- elon musk
- steve jobs
- jony ive
- the ride of a lifetime
- who is michael ovitz
- setting the table
- unreasonable hospitality
- einstein
- leonardo da vinci
- delivering happiness
- wonder boy
- napoleon
- four seasons
- grinding it out
- shoe dog
- amp it up
- the fund

### up next
- titan
- the power broker
- churchill
- the passage of power
- sam walton: made in america', '2024-06-14 15:05:32+00', true, NULL, 'reading-list', 'yesterday', '📚'),
	('1001a77a-55ee-4a21-bf79-762d87a9576b', 'hobbies', '- skiing
- coding
- reading', '2024-06-22 19:44:00.423+00', false, 'd3f7c92c-ae43-4393-a71e-5e175d8b1e85', 'new-note-1001a77a-55ee-4a21-bf79-762d87a9576b', 'today', '⛷️'),
	('e7f4603e-c5df-4689-9a7b-d7674ad9909f', '', '', '2024-06-19 20:41:17.392+00', false, 'f690ead7-a3ef-49fd-8616-b05d82beb6d6', 'new-note-e7f4603e-c5df-4689-9a7b-d7674ad9909f', 'today', '👋🏼'),
	('34c07bc5-f111-4810-b267-18ddbe732bed', 'groceries', 'i hate cooking, so generally make things like yogurt bowls and [girl dinners](https://www.nytimes.com/2023/07/08/style/girl-dinner.html)

### go-to items
- mangos & blueberries
- greek yogurt
- [steep hill granola](https://www.steephillfoods.com/perfectnut) (the absolute best small-batch, locally made granola that is sadly going out of business 😢)
- chia seeds, hemp seeds, goji berries, cacao nibs, coconut flakes, etc. etc. 
- parmesan, manchego
- prosciutto, salami
- tuna, sardines, anchovies (😝)
- seed crackers
- asian pear
- dates
- coke zero
- perrier', '2024-06-14 22:47:45.808451+00', true, NULL, 'groceries', '7', '🍎'),
	('65d8e406-8ceb-4f2a-918f-80e1f5a9cb61', 'quick links', 'i am omni-channel!

- [email](mailto:hi@basecase.vc): inbox zero, always
- [twitter](https://x.com/alanaagoyal): semi-frequent thoughts + updates on the amazing founders i work with
- [github](https://github.com/alanagoyal): so many green squares!
- [linkedin](https://www.linkedin.com/in/alanagoyal/): mostly for stalking people
- [instagram](https://www.instagram.com/alanaagoyal/): quarterly photo dumps of people + places + things i like', '2024-06-16 21:51:06+00', true, NULL, 'quick-links', 'today', '📎'),
	('f240198f-80d0-4f2e-9ca6-1f6a34ae974b', '', '', '2024-06-22 04:18:17.441+00', false, 'b97a37bb-70ee-42f0-8f80-d15edbe66cab', 'new-note-f240198f-80d0-4f2e-9ca6-1f6a34ae974b', 'today', '👋🏼'),
	('02a00112-d0a2-4586-a43a-195b0f4105bf', 'on repeat', 'i listen to a lot of music!

### edm/house
- [sultan + shepherd dj set - malibu ranch](https://www.youtube.com/watch?v=QNtfijAcotU&t=2690s&ab_channel=ThisNeverHappened)
- [chris luno sunset mix - thailand](https://www.youtube.com/watch?v=fIWRqMLhWbI&ab_channel=ThisNeverHappened)
- [ben böhmer - live at the roundhouse, london](https://www.youtube.com/watch?v=guOFgrp7JoI&ab_channel=BenB%C3%B6hmer)
- [massane live set - portes du soleil, french alps](https://www.youtube.com/watch?v=LyOqMMQskU4&t=3191s&ab_channel=ThisNeverHappened)
- [lane 8 sunrise set - grand lake, colorado](https://www.youtube.com/watch?v=n_LcVqqHSY8&t=1638s&ab_channel=ThisNeverHappened)

### hip-hop/rap
- drake
- 21 savage
- future
- travis scott
- schoolboy q (back in the day)

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
	('151936ee-eba1-4321-9a8f-84f07de8b275', 'queen ', 'hi bitch ', '2024-06-19 00:29:26.118+00', false, '5a3c799e-e0b6-4d94-8232-bfc0f5b2f926', 'new-note-151936ee-eba1-4321-9a8f-84f07de8b275', 'today', '👋🏼'),
	('c4d6e1c0-3b5d-472b-902d-8def8aaed07f', '', '', '2024-06-22 20:43:05.607+00', false, '2c72e032-6b4c-46bd-9362-465f4eb098ca', 'new-note-c4d6e1c0-3b5d-472b-902d-8def8aaed07f', 'today', '👋🏼'),
	('fd234e08-7ac1-4332-a3fe-06ece731c314', 'about me', 'a brief overview of my current + past work

### current
- founder & managing partner of [basecase capital](https://basecase.vc/)
- partner to a number of incredible companies, including [ashby](https://www.ashbyhq.com/), [astral](https://astral.sh/), [baseten](https://www.baseten.co/), [braintrust](https://braintrust.dev/), [browserbase](https://browserbase.com/), [default](https://default.com/), [graphite](https://graphite.dev/), [resend](https://resend.com/), [supabase](https://supabase.com/), [vercel](https://vercel.com/), & others 
- builder & maintainer of a few little open-source projects, including [branded](https://branded.ai), [draftmysafe](https://draftmysafe.com), & others


### past
- joined [samsara](https://www.samsara.com/) as the first product manager on the platform & infrastructure team
- interned at [greylock](https://greylock.com) and was lucky enough to help out with their incubation of [abnormal security](https://https://abnormalsecurity.com/)
- launched the [home equity platform at blend](https://blend.com/home-equity-opportunities/)
- helped build the self-service product at [appdynamics](https://www.appdynamics.com/free-trial/)
- interned on the research and development team at [natera](https://www.natera.com/)
- studied computer science at [columbia university](https://www.columbia.edu/)', '2024-06-17 19:00:00+00', true, NULL, 'about-me', 'pinned', '🙋🏼‍♀️'),
	('767f8b2b-2f20-4c65-8c9d-c219bd689fa1', 'favorite products', 'i love trying new things and admire the craftsmanship that goes into building great products!

### development stack
- [supabase](https://supabase.com/): let''s not pretend we''re rolling our own postgres over here
- [next.js](https://nextjs.org/): the only app framework you need
- [vercel](https://vercel.com/): have literally never hosted a project elsewhere
- [shadcn/ui](ui.shadcn.com/): simply could not build an app without these ui components
- [resend](https://resend.com/): dead simple email api
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
- [asics gel 1130](https://www.stadiumgoods.com/en-us/shopping/asics-gel-1130): wear these almost every day', '2024-06-18 00:48:49.104221+00', true, NULL, 'favorite-products', 'today', '🫶🏼');


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
