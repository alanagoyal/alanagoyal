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

INSERT INTO "public"."notes" ("id", "title", "content", "created_at", "public", "session_id", "slug", "category", "emoji", "pinned") VALUES
	('46b61917-2133-4206-855c-baa16508bb07', 'reading list', '### currently reading
- [the creative act](https://www.amazon.com/Creative-Act-Way-Being/dp/B09Z7MH5C3) by rick rubin

### so far this year
- [barbarians at the gate](https://www.amazon.com/Barbarians-Gate-Fall-RJR-Nabisco/dp/0061655554/) by bryan burrough & john helyar
- [the fund](https://www.amazon.com/Fund-Bridgewater-Associates-Unraveling-Street-ebook/dp/B0BST4LN26) by rob copeland
- [amp it up](https://www.amazon.com/Amp-Up-Leadership-Hypergrowth-Companies/dp/1119836115/) by frank slootman
- [shoe dog](https://www.amazon.com/Shoe-Dog-Memoir-Creator-NIKE/dp/1501135910/) by phil knight
- [grinding it out](https://www.amazon.com/Grinding-Out-Making-McDonalds/dp/125013028X/) by ray kroc
- [four seasons](https://www.amazon.com/Four-Seasons-Story-Business-Philosophy/dp/B0020BUX3G) by isadore sharp
- [napoleon](https://www.amazon.com/Napoleon-Life-Andrew-Roberts/dp/0143127853/) by andrew roberts
- [wonder boy](https://www.amazon.com/Wonder-Boy-Zappos-Happiness-Silicon/dp/B09X423F24) by angel au-yeung & david jeans
- [delivering happiness](https://www.amazon.com/Delivering-Happiness-Profits-Passion-Purpose/dp/0446576220/) by tony hsieh
- [leonardo da vinci](https://www.amazon.com/Leonardo-Vinci-Walter-Isaacson/dp/1501139150/) by walter isaacson
- [einstein](https://www.amazon.com/Einstein-His-Life-Universe-Isaacson/dp/0743264746/) by walter isaacson
- [unreasonable hospitality](https://www.amazon.com/Unreasonable-Hospitality-Remarkable-Giving-People-ebook/dp/B0B13W5GPT) by will guidara
- [setting the table](https://www.amazon.com/Setting-Table-Transforming-Hospitality-Business/dp/0060742755/) by danny meyer
- [who is michael ovitz](https://www.amazon.com/Who-Michael-Ovitz/dp/1591845548/) by michael ovitz
- [the ride of a lifetime](https://www.amazon.com/Ride-Lifetime-Lessons-Learned-Company/dp/0399592091/) by robert iger
- [jony ive](https://www.amazon.com/Jony-Ive-Genius-Behind-Products/dp/159184617X/) by leander kahney
- [steve jobs](https://www.amazon.com/Steve-Jobs-Walter-Isaacson/dp/1451648537/) by walter isaacson
- [elon musk](https://www.amazon.com/Elon-Musk-SpaceX-Fantastic-Future/dp/006230125X/) by ashlee vance

### up next
- [my name is barbra](https://www.amazon.com/My-Name-Barbra-Streisand/dp/0525429522) by barbra streisand
- [life](https://www.amazon.com/Life-Keith-Richards-ebook/dp/B00499BTS0) by keith richards
- [titan](https://www.amazon.com/Titan-Life-John-Rockefeller-Sr/dp/1400077303/) by ron chernow
- [the power broker](https://www.amazon.com/Power-Broker-Robert-Moses-Fall/dp/0394720245/) by robert caro
- [churchill](https://www.amazon.com/Churchill-Paul-Johnson/dp/0143117998/) by paul johnson
- [the passage of power](https://www.amazon.com/Passage-Power-Years-Lyndon-Johnson/dp/0375713255/) by robert caro
- [sam walton: made in america](https://www.amazon.com/Sam-Walton-Made-America/dp/0553562835/) by sam walton', '2024-06-14 15:05:32+00', true, NULL, 'reading-list', '7', '📚', false),
	('65d8e406-8ceb-4f2a-918f-80e1f5a9cb61', 'quick links', '- [email](mailto:hi@basecase.vc): inbox zero, always
- [twitter](https://x.com/alanaagoyal): unoriginal thoughts
- [github](https://github.com/alanagoyal): so many green squares
- [linkedin](https://www.linkedin.com/in/alanagoyal/): mostly for stalking people
- [instagram](https://www.instagram.com/alanaagoyal/): quarterly photo dumps', '2024-06-20 21:51:06+00', true, NULL, 'quick-links', 'today', '📎', true),
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
- perrier', '2024-06-14 22:47:45.808451+00', true, NULL, 'groceries', '30', '🍎', false),
	('fd234e08-7ac1-4332-a3fe-06ece731c314', 'about me', '### currently
- founder & managing partner of [basecase capital](https://basecase.vc/)
- partner to a number of incredible companies, including [ashby](https://www.ashbyhq.com/), [astral](https://astral.sh/), [baseten](https://www.baseten.co/), [braintrust](https://braintrust.dev/), [browserbase](https://browserbase.com/), [default](https://default.com/), [graphite](https://graphite.dev/), [resend](https://resend.com/), [supabase](https://supabase.com/), [vercel](https://vercel.com/), & others 
- builder & maintainer of a few little open-source projects, including [branded](https://branded.ai), [draftmysafe](https://draftmysafe.com), & others


### previously
- joined [samsara](https://www.samsara.com/) as the first new grad product manager
- worked on data platform, reports infra, alerts & automations, & admin tooling with some [very](https://www.linkedin.com/in/ehzhang/) [incredible](https://www.linkedin.com/in/cassandra-rommel/) [engineers](https://www.linkedin.com/in/jonathancobian/)
- interned at [greylock](https://greylock.com) and was lucky enough to help out with their incubation of [abnormal security](https://https://abnormalsecurity.com/)
- launched the [home equity platform at blend](https://blend.com/home-equity-opportunities/)
- shipped the first [free trial at appdynamics](https://www.appdynamics.com/free-trial/)
- interned on the research & development team at [natera](https://www.natera.com/)
- studied computer science at [columbia university](https://www.columbia.edu/) and made some [life](https://www.linkedin.com/in/domgor/) [long](https://www.linkedin.com/in/mattkronengold/) [friends](https://www.linkedin.com/in/katie-pfleger-b135a0124/)', '2024-06-30 19:00:00+00', true, NULL, 'about-me', 'today', '📍', true),
	('3fd3a1e4-bfc9-4bdb-a7c4-52e48653918c', 'principles', '- act with urgency
- respond immediately
- if it''s under an hour, walk
- ship something everyday
- people remember how you make them feel
- it''s a marathon, not a sprint
- exercise everyday
- make friends on the internet
- great outfits are meant to be repeated
- work harder than you think you should', '2024-06-18 15:51:40+00', true, NULL, 'principles', 'today', '📖', false),
	('fd73a76e-80aa-4c25-874e-813493180f86', 'bookmarks', '- "sometimes magic is just someone spending more time on something than anyone else might reasonably expect" - will guidara, *[unreasonable hospitality](https://www.amazon.com/Unreasonable-Hospitality-Remarkable-Power-Giving/dp/0593418571/)*
- "anyone can get a first meeting" - michael ovitz, *[who is michael ovitz](https://www.amazon.com/Who-Michael-Ovitz/dp/1591845548/)*
- "happiness is not a tangible thing, it''s a byproduct of achievement" - ray kroc, *[grinding it out](https://www.amazon.com/Grinding-Out-Making-McDonalds/dp/125013028X/)*
- "there''s aesthetic value in doing things the right way" - danny meyer, *[setting the table](https://www.amazon.com/Setting-Table-Transforming-Hospitality-Business/dp/0060742755/)*
- "intensity is the price of excellence" - warren buffett
_ "when there is doubt, there is no doubt” - frank slootman, [amp it up](https://www.amazon.com/Amp-Hypergrowth-Expectations-Increasing-Elevating-ebook/dp/B09QHBZDDZ?dib=eyJ2IjoiMSJ9.PhxwO_YuI9_eX4BIneCrV09NLi3BBYjTI6QUAZGsMOyt5Xa9bbDyGzqyWU_Eph-tKTRNuJynyyrdEtLlkMQ-bthvZlvKCtxS_PUlkpiE4Sk1UTvxm93AYQPWNV6buM6f.56zD--mVSOQ0FDa04ZpqyTqqOZcYzlzkFjYuooMzq1M&dib_tag=se&hydadcr=21907_13324190&keywords=amp+it+up+by+frank+slootman&qid=1719450095&sr=8-1)"
- "you measure yourself by the people who measure themselves by you" - phil knight, *[shoe dog](https://www.amazon.com/Shoe-Dog-Memoir-Creator-NIKE/dp/1501135910/)*
- "impatience is an argument with reality" - rick rubin, *[the creative act](https://www.amazon.com/Creative-Act-Way-Being/dp/B09Z7MH5C3)*', '2024-06-17 18:21:08+00', true, NULL, 'bookmarks', 'today', '🔖', false),
	('02a00112-d0a2-4586-a43a-195b0f4105bf', 'on repeat', '### edm/house
- [sultan + shepherd dj set - malibu ranch](https://www.youtube.com/watch?v=QNtfijAcotU&t=2690s&ab_channel=ThisNeverHappened)
- [chris luno sunset mix - thailand](https://www.youtube.com/watch?v=fIWRqMLhWbI&ab_channel=ThisNeverHappened)
- [ben böhmer - live at the roundhouse, london](https://www.youtube.com/watch?v=guOFgrp7JoI&ab_channel=BenB%C3%B6hmer)
- [massane live set - portes du soleil, french alps](https://www.youtube.com/watch?v=LyOqMMQskU4&t=3191s&ab_channel=ThisNeverHappened)
- [lane 8 sunrise set - grand lake, colorado](https://www.youtube.com/watch?v=n_LcVqqHSY8&t=1638s&ab_channel=ThisNeverHappened)
- [jerro - chromatic warehouse mix](https://www.youtube.com/watch?v=CvjxoDEK7qQ&ab_channel=Jerro)

### hip-hop/rap
- drake
- 21 savage
- future
- travis scott
- metro boomin
- migos

### indie/rock
- tame impala
- arcade fire
- vampire weekend (kind of)

### pop
- ariana grande (eternal sunshine)
- olivia rodrigo
- dua lipa
- troye sivan

### country
- morgan wallen (obsessed, the only country artist i listen to)', '2024-06-14 22:48:41.026439+00', true, NULL, 'on-repeat', '7', '🎧', false),
	('fe5659af-d561-475d-be44-8214141d24d0', 'how this works', '### stack
- i used [v0 by vercel](https://www.vercel.com/) to generate the ui - literally took a screenshot of apple notes and v0 gave me back react code 😃
- i store the notes and note metadata in [supabase](https://supabase.com/)
- the note content is stored in markdown and rendered with [react markdown](https://github.com/remarkjs/react-markdown) 
- new notes are saved with a session_id (based on local storage) so you can see and interact with your own notes, but no one else can see your notes
- the app is built with the [next.js](https://nextjs.org/) app router and hosted on [vercel](https://vercel.com/)
- it''s fully open-source and availablel on [github](https://github.com/alanagoyal/alanagoyal), so feel free to fork it or submit a pull request - there are a ton of ways it can be improved

### gratitude
- [john pham](https://x.com/JohnPhamous) for endless feedback on speed & accessability
- [eden halperin](https://x.com/eden_halperin) for feedback on ui/ux
- [guillermo rauch](https://x.com/rauchg) & [grace yun](https://x.com/jueungraceyun) for help with the og image
- [andrew smith](https://x.com/silentworks) & [terry sutton](https://x.com/saltcod) for help with supabase ssr
- [ankur goyal](https://x.com/ankrgyl) & [hassan el mghari](https://x.com/nutlope) for help fixing annoying bugs 😅
- [indragie karunaratne](https://x.com/indragie) & [paul dornier](https://x.com/PaulDornier_) for usability feedback', '2024-06-01 16:53:44+00', true, NULL, 'how-this-works', '30', '🔨', false),
	('6d0fcd93-a025-4218-a8bc-088ab63b999d', 'my heroes', 'people who''ve inspired/had an impact on me:
- [jae woo lee](https://www.cs.columbia.edu/~jae/) (computer science professor, columbia)
- [elad gil](https://x.com/eladgil) (co-founder, mixerlabs & color health)
- [sanjit biswas](https://www.linkedin.com/in/sanjitbiswas/) (co-founder, samsara)
- [guillermo rauch](https://x.com/rauchg) (ceo, vercel)
- [jessica livingston](https://www.linkedin.com/in/jessicalivingston1/) (co-founder, y combinator)

', '2024-07-04 01:34:11.363+00', false, '1fefd3e5-4cfd-415d-9d0f-39207a4d41f5', 'new-note-6d0fcd93-a025-4218-a8bc-088ab63b999d', 'today', '🦸🏼‍♀️', false),
	('81ac6e7d-fab1-4add-a38d-458de369e1c1', 'fav spots', '### sf
- [akikos](https://www.akikosrestaurant.com/)
- [kokkari](https://kokkari.com/)
- [flour + water](https://www.flourandwater.com/)
- [zuni cafe](https://zunicafe.com/)
- [cotogna](https://www.cotognasf.com/)
- [sorrel](https://sorrelrestaurant.com/)
- [saint frank](https://www.saintfrankcoffee.com/)
- [sightglass](https://www.sightglasscoffee.com/)

### nyc
- [balthazar](https://balthazarny.com/)
- [cipriani](https://www.cipriani.com/)
- [le crocodile](https://lecrocodilenyc.com/)
- [le coucou](https://lecoucou.com/)
- [raf''s](https://rafs.nyc/)
- [sant ambroeus](https://www.santambroeus.com/)
- [librae bakery](https://www.libraebakery.com/)
- [la cabra](https://lacabra.dk/en-us/)
- [nobu fifty seven](https://www.noburestaurants.com/new-york-fifty-seven/home/)', '2024-07-01 01:49:41+00', true, NULL, 'fav-spots', 'yesterday', '🍽️', false),
	('fab15c47-bf48-4a13-9b54-006c4fdbec57', 'I love you', 'This is a really cool app!', '2024-07-04 02:18:36.619+00', false, '740fafe4-c2c3-435d-8ec2-737c3417ccf2', 'new-note-fab15c47-bf48-4a13-9b54-006c4fdbec57', 'today', '😍', false),
	('767f8b2b-2f20-4c65-8c9d-c219bd689fa1', 'fav products', '### development stack
- [supabase](https://supabase.com/): let''s not pretend we''re rolling our own postgres over here
- [next.js](https://nextjs.org/): the only app framework you need
- [vercel](https://vercel.com/): have literally never hosted a project elsewhere
- [shadcn/ui](ui.shadcn.com/): simply could not build an app without these ui components
- [resend](https://resend.com/): dead simple email api
- [braintrust](https://braintrust.dev): helps me build ai products that don''t suck
- [cursor](https://cursor.com/): the best ai ide i''ve used
- [cleanshotx](https://cleanshot.com/): sick screenshots

### productivity stack
- [airtable](https://airtable.com): love an extensible crm
- [dropbox paper](https://www.dropbox.com/paper/): die hard fan, won''t let them shut it down
- [superhuman](https://superhuman.com): tried to live without it, but can''t
- [texts](https://texts.com): amazing when it works

### other
- [waymo](https://waymo.com): almost exclusively in waymos these days
- [peloton](https://peloton.com): devout rider/runner (favorite instructors: olivia amato, alex toussaint, cody rigsby)
- [kindle](https://www.amazon.com/b/?node=6669702011): biggest life hack if you want to read more is to have the kindle app on your phone and set it to continuous scroll so it feels just like scrolling twitter
- [apple airpods max](https://www.apple.com/airpods-max/): big headphone gal
- [asics gel 1130](https://www.stadiumgoods.com/en-us/shopping/asics-gel-1130): wear these almost every day
- [reusable glass straws](https://www.amazon.com/Antner-Reusable-Drinking-Cleaning-Included/dp/B0B1B2RL2S): helps me drink more water', '2024-06-11 00:48:49+00', true, NULL, 'fav-products', 'yesterday', '🫶🏼', false);


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
