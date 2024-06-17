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

INSERT INTO "public"."notes" ("id", "title", "content", "created_at", "public", "session_id", "slug", "category") VALUES
	('46b61917-2133-4206-855c-baa16508bb07', 'reading list 📚', '### so far this year
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

### currently reading
- merchants of debt

### up next
- barbarians at the gate
- a mind at play
- titan
- the power broker
- churchill
- the passage of power
- sam walton: made in america', '2024-06-14 15:05:32+00', true, NULL, 'reading-list', '7'),
	('51e25beb-cec2-4159-961d-08f09c5a95c1', 'hi alana 👋🏼', '# hello
*alana* is the best', '2024-06-17 16:56:18.051+00', false, 'd3f7c92c-ae43-4393-a71e-5e175d8b1e85', 'new-note-a408de7c-9951-4c51-bf84-cf1dfa7f165e', 'today'),
	('1d3b70d6-ce1b-4d66-9936-4f5fd38c43aa', 'todo 📌', '- fix this', '2024-06-15 22:46:44+00', true, NULL, 'todo', 'today'),
	('fd234e08-7ac1-4332-a3fe-06ece731c314', 'about me 🤗', '### current
- founder & managing partner of [basecase capital](https://basecase.vc/)
- partner to a number of incredible companies, including [ashby](https://www.ashbyhq.com/), [astral](https://astral.sh/), [baseten](https://www.baseten.co/), [braintrust](https://braintrust.dev/), [browserbase](https://browserbase.com/), [default](https://default.com/), [graphite](https://graphite.dev/), [resend](https://resend.com/), [supabase](https://supabase.com/), [vercel](https://vercel.com/), & others 
- builder & maintainer of a few little open-source projects, including [branded](https://branded.ai), [draftmysafe](https://draftmysafe.com), & others that have been paused by ant @ supabase due to inactivity 😅


### past
- joined [samsara](https://www.samsara.com/) as the first product manager on the platform & infrastructure team and managed a bunch of incredible teams like data platform, alerts & automations, admin tooling, & more
- interned at greylock during their incubation of [abnormal security](https://https://abnormalsecurity.com/) as was lucky enough to help out on all things product & go-to-market
- launched the [home equity platform at blend](https://blend.com/home-equity-opportunities/)
- helped build the self-service product at [appdynamics](https://www.appdynamics.com/free-trial/)
- worked on the research and development team at [natera](https://www.natera.com/)
- studied cs at columbia university and made friends with all the best ta’s', '2024-06-16 19:00:00+00', true, NULL, NULL, 'pinned'),
	('34c07bc5-f111-4810-b267-18ddbe732bed', 'groceries 🍎', '- mangos
- blueberries
- greek yogurt
- steep hill granola
- parmesan
- manchego
- prosciutto
- salami
- seed crackers
- coke zero
- perrier', '2024-06-14 22:47:45.808451+00', true, NULL, 'groceries', '7'),
	('e5c549ec-cded-451d-89cb-4f085031b059', 'favorite pizza 🍕', 'pepperoni 
margarita', '2024-06-16 22:59:16.084+00', false, '5a3c799e-e0b6-4d94-8232-bfc0f5b2f926', 'new-note-cddfefca-ae4e-4bc4-9dc5-b2dcca35d002', 'yesterday'),
	('02a00112-d0a2-4586-a43a-195b0f4105bf', 'on repeat 🎧', '### dj sets
- [sultan + shepherd dj set - malibu ranch](https://www.youtube.com/watch?v=QNtfijAcotU&t=2690s&ab_channel=ThisNeverHappened)
- [chris luno sunset mix - thailand](https://www.youtube.com/watch?v=fIWRqMLhWbI&ab_channel=ThisNeverHappened)
- [massane live set - portes du soleil, french alps](https://www.youtube.com/watch?v=LyOqMMQskU4&t=3191s&ab_channel=ThisNeverHappened)
- [lane 8 sunrise set - grand lake, colorado](https://www.youtube.com/watch?v=n_LcVqqHSY8&t=1638s&ab_channel=ThisNeverHappened)

### other favorite artists
- morgan wallen
- ariana grande', '2024-06-14 22:48:41.026439+00', true, NULL, 'on-repeat', '7'),
	('fcf7d40d-1313-4ca0-9608-5df4cf23879f', '', '', '2024-06-16 23:27:54.729+00', false, 'cad4d737-f597-4eb6-97ee-4c3aaf4c9274', 'new-note-4757b30b-8058-4cc4-9e5e-78c957236480', 'today');


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
