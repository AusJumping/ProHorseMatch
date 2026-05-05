--
-- PostgreSQL database dump
--

\restrict abhvcTv76bsbgfc3gtn0Q5QXn8vdZx8WhgCCO1mT7vHAeSb7RzDbU4PvDa948M7

-- Dumped from database version 16.12 (9893e46)
-- Dumped by pg_dump version 16.10

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
-- Name: prevent_test_user_creation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_test_user_creation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.email IN ('owner@example.com', 'customer@example.com') THEN
    RAISE EXCEPTION 'Test user accounts are not allowed';
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    owner_id integer NOT NULL,
    horse_id integer NOT NULL,
    last_message_id integer,
    last_message_time timestamp without time zone,
    unread_count integer DEFAULT 0,
    new_conversation_email_sent boolean DEFAULT false,
    last_reminder_sent timestamp without time zone,
    customer_last_message_time timestamp without time zone,
    owner_last_message_time timestamp without time zone
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    location_country text,
    location_radius_km integer,
    preferred_disciplines text[],
    preferred_levels text[],
    preferred_breeds text[],
    age_range_min integer,
    age_range_max integer,
    height_range_min real,
    height_range_max real,
    preferred_sexes text[],
    breeding_preferences text,
    preferred_characteristics text[],
    price_range_min integer,
    price_range_max integer,
    currency text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discount_code_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_code_usage (
    id integer NOT NULL,
    discount_code_id integer,
    user_id integer,
    used_at timestamp without time zone DEFAULT now(),
    subscription_id text
);


--
-- Name: discount_code_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_code_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_code_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_code_usage_id_seq OWNED BY public.discount_code_usage.id;


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_codes (
    id integer NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value integer NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0,
    active boolean DEFAULT true,
    valid_from timestamp without time zone DEFAULT now(),
    valid_until timestamp without time zone,
    applicable_plans text[],
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: discount_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_codes_id_seq OWNED BY public.discount_codes.id;


--
-- Name: horse_deletion_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horse_deletion_responses (
    id integer NOT NULL,
    horse_id integer NOT NULL,
    user_id integer NOT NULL,
    horse_name text NOT NULL,
    sold_through_app boolean,
    sold_elsewhere boolean,
    unsold boolean,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: horse_deletion_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horse_deletion_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horse_deletion_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horse_deletion_responses_id_seq OWNED BY public.horse_deletion_responses.id;


--
-- Name: horses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horses (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    name text NOT NULL,
    location_country text NOT NULL,
    location_radius_km integer,
    disciplines text[] NOT NULL,
    levels text[] NOT NULL,
    breeds text[] NOT NULL,
    age integer NOT NULL,
    height_hands real,
    height_cm integer,
    sex text NOT NULL,
    sire text,
    dam text,
    dam_sire text,
    characteristics text[],
    currency text NOT NULL,
    description text,
    photos text[] NOT NULL,
    videos text[],
    created_at timestamp without time zone DEFAULT now(),
    price_min integer,
    price_max integer,
    colour text DEFAULT 'Bay'::text NOT NULL,
    additional_info text,
    social_media_promotion boolean DEFAULT false,
    education_level text,
    other_disciplines text[]
);


--
-- Name: horses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horses_id_seq OWNED BY public.horses.id;


--
-- Name: login_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    logged_in_at timestamp without time zone DEFAULT now()
);


--
-- Name: login_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_events_id_seq OWNED BY public.login_events.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    horse_id integer NOT NULL,
    is_liked boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    owner_id integer NOT NULL,
    horse_id integer NOT NULL,
    content text NOT NULL,
    sender_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_read boolean DEFAULT false
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owners (
    id integer NOT NULL,
    business_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: owners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.owners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: owners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.owners_id_seq OWNED BY public.owners.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    notify_matches boolean DEFAULT true,
    notify_messages boolean DEFAULT true,
    notify_updates boolean DEFAULT true,
    notify_digest boolean DEFAULT true
);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_searches (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    disciplines text[],
    levels text[],
    breeds text[],
    age_min integer,
    age_max integer,
    height_min real,
    height_max real,
    sexes text[],
    characteristics text[],
    price_min integer,
    price_max integer,
    currency text,
    location_country text,
    location_radius_km integer,
    email_notifications boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    sire text,
    dam_sire text
);


--
-- Name: saved_searches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.saved_searches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: saved_searches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.saved_searches_id_seq OWNED BY public.saved_searches.id;


--
-- Name: search_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_notifications (
    id integer NOT NULL,
    saved_search_id integer NOT NULL,
    horse_id integer NOT NULL,
    sent_at timestamp without time zone DEFAULT now()
);


--
-- Name: search_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.search_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: search_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.search_notifications_id_seq OWNED BY public.search_notifications.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    business_name text,
    contact_name text,
    is_searching boolean DEFAULT false,
    is_selling boolean DEFAULT false,
    location_country text,
    location_radius_km integer,
    preferred_disciplines text[],
    preferred_levels text[],
    preferred_breeds text[],
    age_range_min integer,
    age_range_max integer,
    height_range_min real,
    height_range_max real,
    preferred_sexes text[],
    breeding_preferences text,
    preferred_characteristics text[],
    price_range_min integer,
    price_range_max integer,
    currency text,
    created_at timestamp without time zone DEFAULT now(),
    stripe_customer_id text,
    stripe_subscription_id text,
    subscription_status text,
    subscription_plan text,
    subscription_end_date timestamp without time zone,
    username text NOT NULL,
    email_verified boolean DEFAULT false,
    verification_token text,
    verification_token_expires timestamp without time zone,
    subscription_reminder_sent_at timestamp without time zone,
    email_unsubscribed boolean DEFAULT false NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discount_code_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_usage ALTER COLUMN id SET DEFAULT nextval('public.discount_code_usage_id_seq'::regclass);


--
-- Name: discount_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes ALTER COLUMN id SET DEFAULT nextval('public.discount_codes_id_seq'::regclass);


--
-- Name: horse_deletion_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horse_deletion_responses ALTER COLUMN id SET DEFAULT nextval('public.horse_deletion_responses_id_seq'::regclass);


--
-- Name: horses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horses ALTER COLUMN id SET DEFAULT nextval('public.horses_id_seq'::regclass);


--
-- Name: login_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_events ALTER COLUMN id SET DEFAULT nextval('public.login_events_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: owners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owners ALTER COLUMN id SET DEFAULT nextval('public.owners_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: saved_searches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches ALTER COLUMN id SET DEFAULT nextval('public.saved_searches_id_seq'::regclass);


--
-- Name: search_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_notifications ALTER COLUMN id SET DEFAULT nextval('public.search_notifications_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, customer_id, owner_id, horse_id, last_message_id, last_message_time, unread_count, new_conversation_email_sent, last_reminder_sent, customer_last_message_time, owner_last_message_time) FROM stdin;
21	323	111	32	53	2025-11-16 11:15:35.23	1	t	\N	2025-11-16 11:15:35.23	\N
25	381	107	30	89	2026-02-10 20:08:20.243	1	t	\N	2025-12-09 19:26:53.903	2026-02-10 20:08:20.243
42	413	92	64	92	2026-02-24 03:19:56.526	1	t	\N	2026-02-23 08:11:47.956	2026-02-24 03:19:56.526
41	413	91	75	90	2026-02-23 07:55:15.715	0	t	\N	2026-02-23 07:55:15.715	\N
43	734	170	36	94	2026-04-22 02:38:02.435	2	t	\N	2026-04-22 02:38:02.435	\N
19	238	116	52	56	2025-11-30 07:33:00.128	0	t	\N	2025-11-29 06:02:44.241	2025-11-30 07:33:00.128
14	238	196	47	43	2025-10-18 21:42:32.183	0	t	\N	2025-10-18 12:00:58.195	2025-10-18 21:42:32.183
46	238	91	75	97	2026-04-28 10:18:13.913	1	t	\N	2026-04-28 10:18:13.913	\N
44	736	92	81	98	2026-04-29 22:12:03.702	1	t	\N	2026-04-23 12:18:31.596	2026-04-29 22:12:03.702
45	736	107	30	99	2026-04-30 10:24:15.006	1	t	\N	2026-04-23 12:29:45.789	2026-04-30 10:24:15.006
47	752	92	61	101	2026-05-04 09:12:51.004	1	t	\N	2026-05-01 03:22:08.548	2026-05-04 09:12:51.004
48	238	688	108	102	2026-05-04 10:45:01.135	1	t	\N	2026-05-04 10:45:01.135	\N
32	358	92	61	84	2026-02-05 05:27:44.871	0	t	\N	2026-01-21 10:43:11.773	2026-02-05 05:27:44.871
36	490	92	64	81	2026-02-05 01:29:26.94	0	t	\N	2026-02-04 09:05:57.836	2026-02-05 01:29:26.94
35	395	116	49	88	2026-02-07 01:17:09.415	1	t	\N	2026-02-04 09:00:18.101	2026-02-07 01:17:09.415
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, password, location_country, location_radius_km, preferred_disciplines, preferred_levels, preferred_breeds, age_range_min, age_range_max, height_range_min, height_range_max, preferred_sexes, breeding_preferences, preferred_characteristics, price_range_min, price_range_max, currency, created_at) FROM stdin;
1	Jane Doe	customer@example.com	password123	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-15 01:25:24.767751
2	Australian Jumping	info@australianjumping.com.au	KHZiggy99$	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-05-15 01:30:28.335395
\.


--
-- Data for Name: discount_code_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discount_code_usage (id, discount_code_id, user_id, used_at, subscription_id) FROM stdin;
\.


--
-- Data for Name: discount_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discount_codes (id, code, description, discount_type, discount_value, max_uses, used_count, active, valid_from, valid_until, applicable_plans, created_at) FROM stdin;
1	PROMO6MONTHSFREE	6 months free subscription promotion	months_free	6	\N	0	t	2025-06-10 21:06:34.739353	\N	{beta-seller,beta-searching}	2025-06-10 21:06:34.739353
\.


--
-- Data for Name: horse_deletion_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horse_deletion_responses (id, horse_id, user_id, horse_name, sold_through_app, sold_elsewhere, unsold, created_at) FROM stdin;
1	19	50	Test	t	f	f	2025-07-21 10:34:40.228604
2	20	50	test	t	f	f	2025-07-21 21:44:08.351171
3	21	89	Rene The Wonderhorse	t	f	f	2025-07-29 01:23:19.598263
4	23	31	Test	t	f	f	2025-08-19 09:05:53.209507
5	29	31	Test	t	f	f	2025-09-10 09:56:39.160281
6	31	108	Diamond B Big Shot	f	t	f	2025-09-24 06:54:12.415378
7	42	221	Test	t	f	f	2025-10-14 08:34:23.818617
8	24	92	Wilark Quinto	f	f	t	2025-10-21 00:27:48.425565
9	26	92	HL Kalina	f	t	f	2025-10-21 00:27:54.9008
10	40	205	Bloomfield Vera Wang	f	t	f	2025-11-15 05:08:24.67398
11	44	196	Brookside Eltona	f	t	f	2025-11-20 22:54:44.013274
12	45	196	Akina Shiva	f	t	f	2025-11-20 22:54:58.188911
13	46	196	Laurel Glen Grande	f	t	f	2025-11-20 22:55:03.611949
14	33	116	Daisy Xtreme	f	t	f	2025-11-23 20:18:42.370674
15	63	31	test	t	f	f	2025-12-12 06:11:53.029425
16	35	116	Python Xtreme	f	t	f	2026-01-26 01:06:20.633175
17	50	116	Smudge Xtreme	f	t	f	2026-01-26 01:06:29.630963
18	60	92	Coruba GNZ	f	f	t	2026-02-05 01:30:20.913167
19	59	92	Belrock Nadal	f	f	t	2026-02-05 01:30:25.706825
20	39	92	Miss Clijsters	f	f	t	2026-02-05 01:30:31.718427
21	38	92	Jazdan Fascination	f	t	f	2026-02-05 01:30:38.375799
22	27	92	Copper Head Road	f	f	t	2026-02-05 01:30:52.992143
23	51	256	Greengrove Caspian	f	f	t	2026-02-05 09:14:44.435898
24	66	92	Kolora Stud Ozzie	f	t	f	2026-02-24 03:20:25.060357
25	71	92	Bellara Park George	f	f	t	2026-03-04 00:41:56.08252
26	85	92	Ablue Moons TNT	f	f	t	2026-03-19 03:08:30.376903
27	100	92	Ballyhoe Alendro	f	t	f	2026-04-14 08:19:26.400933
28	72	92	Princess Keikilani	f	f	t	2026-04-14 08:19:44.691331
29	70	92	Oaks Constantino	f	t	f	2026-04-14 08:19:50.142715
30	68	92	Patangas Miami	f	t	f	2026-04-14 08:19:55.363449
31	58	92	Pearls N Diamonds	f	t	f	2026-04-14 08:20:01.997874
32	98	92	Here Goes Hugo	f	t	f	2026-04-29 22:31:55.131842
33	99	92	Palazzio	f	t	f	2026-04-29 22:31:59.788568
34	94	92	Orangevale Ventriloquist	f	t	f	2026-04-29 22:32:06.642034
35	92	92	Orangevale Bugatti	f	f	t	2026-04-29 22:32:11.867771
36	91	92	Orangevale Boston Avenue	f	f	t	2026-04-29 22:32:16.914832
37	90	92	Orangevale Negroni	f	f	t	2026-04-29 22:32:21.804152
38	83	92	Buckwell Park Kappuccino	f	f	t	2026-04-29 22:32:30.25613
\.


--
-- Data for Name: horses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.horses (id, owner_id, name, location_country, location_radius_km, disciplines, levels, breeds, age, height_hands, height_cm, sex, sire, dam, dam_sire, characteristics, currency, description, photos, videos, created_at, price_min, price_max, colour, additional_info, social_media_promotion, education_level, other_disciplines) FROM stdin;
67	92	Cassage S	Australia	\N	{Eventing}	{2*}	{Warmblood}	13	16	163	Mare	Calgary GNZ	Vis A Vis 	Copabella Visage	{Calm,Brave,Bold}	AUD	Introduction: Viva is a fabulous warmblood performance horse. She was produced to 3* level and 140 showjumping by her previous owner and competed to 2* and 130 by his current owner. Viva has the talent to continue up the levels of eventing or showjumping and she also has the experience to teach a confident young rider or amateur. She is a much loved member of the family and is only for sale, to the best of homes, due to her rider changing disciplines to straight dressage.\n\nBreeding:\nViva is by Calgary GNZ out of a mare by Copabella Visage - both of these stallions are known for their bravery, jumping talent and intelligence. Both stallions have competed to World Cup level and stamp their descendants with their fabulous attributes. With the passing of Visage recently, Viva is extremely valuable simply as a broodmare.\nEducation, skills and experience: Viva’s has been bought on slowly and correctly. She is currently competing and placing at 2* level. Viva could easily compete 120-130 showjumping tomorrow! She is established on the flat, training elementary dressage. She has attended competitions all over Queensland.\n\nDressage\nViva has three even balanced paces. She is established on the flat and consistently produces calm and accurate tests. Viva willingly collects - when ridden correctly - she is balanced, light and soft to ride. Viva has all laterals established. In dressage, Viva is always a stand out.\n\nShowjumping\nViva always ‘wants to jump clean’ and has the breeding, scope and technique to jump 140!bShe is straightforward, bold, brave and trustworthy around the course - currently jumping 130 level successfully. Viva is that very rare combination of brave and careful. With her current rider, Viva has shown herself willing to take the occasional miss, sort herself out and happily carry on.\n\nCross Country\nOn cross country, Viva is super calm in the start box and bold and honest across the course. She absolutely loves jumping and is not phased by water, ditches, skinnies, angle fences or any fill. Viva is very clever and quick with her feet. She has an efficient and clean jump that is easy to sit and makes her very rideable. Viva can always be trusted to bring her rider home safely. \nGeneral demeanor under saddle: \nViva is a wonderful example of the modern performance horse - she is  compact, athletic and refined. Her paces display elasticity and activity suitable to progress up the levels.\n\nViva is a willing and responsive mare who is honest and aims to please. She is straightforward and trustworthy to ride, compete, take off the property, and she works well in a group or on her own. Viva loves trail riding with the family, is good with dogs and copes with the noise and nonsense of children within her vicinity.\n\nViva does not have any vices or quirks. She is generally non-reactive and unflappable unless something major happens and, even then, she is completely safe. She does not require working down before an event or after a spell but can be tail swishy for a few minutes after a spell and can be hot/ need working down at a competition but only when in season and is still very safe.\n\nViva is ridden in a snaffle on the flat and a Trust hackamore combination bit for jumping as she can be fussy in the contact. She has a fitted saddle as she does have a bit of a ‘sway back’ conformation. Her bits and saddle pad are included in the sale price.\n\nCurrent workload/ fitness: Viva is in work 3-5 days a week. She does not require regular work to be safe and reliable.\nHandling and general behaviour: Viva LOVES people! She is safe, well mannered and easy to manage - easy and straightforward to handle - lead, rug, tack up, wash, shoe, float/ truck etc. Viva can have a bit of a play when it is ‘catching’ time but a treat and routine quickly solves that! Viva is super easy to travel and take out.\nFeeding and management: Viva loves her food - she is currently fed Studgro, Fibre Complete, Copra and hay. Her stabling and paddocking management is entirely flexible.\n\nMedical history: Viva did separate some fibres in her flexor tendon four years ago. She fully recovered, was cleared by vets and has successfully competed to 2* for the last three years. \n\nRider Suitability: A capable and confident junior, young rider or adult for eventing or straight showjumping. She is safe and lovely but she is a warmblood performance horse who is sharp when jumping and who has a decent amount of blood - which is what allows her to succeed at the upper levels of the sport.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1768898041/horses/y0ymudfxcewu0dw4ijoi.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1768898052/horses/xkc9lrtpfxrgdfrnv2m0.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1768898079/horses/fsafgdyqzthvmgomnw0d.jpg}	{}	2026-01-20 08:36:17.298033	50000	60000	Bay	Reason for sale: Viva  is an absolute delight! She has been owned by her current rider for the last 3 years. This is a very sad and genuine sale of a much loved member of the family. Viva will only be sold to the most suitable home. She is only for sale due to her rider’s change of discipline.	t	\N	\N
69	116	SCOTCH XTREME	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	5	16.2	165	Gelding	Numero Uno Xtreme	Sol Xtreme	Corofino II	{Brave,Bold,Scope}	NZD	A talented young horse ready to excel in his chosen discipline!! Eventing, Show Jumping, Show Hunter, Dressage or an All-rounder...This exquisite gelding could do it all. \n\nOffered for sale by his breeders, Scotch has been purposely bred and produced to excel in the top levels of the sport. After having a great foundation to his ridden life at Xtreme Sport Horses, he is now ready to hit the ground running and his competition career.\n\nScotch Xtreme is a stunning gelding, a real powerhouse type! \nHe is impressive on the flat with is wonderful movement and a canter everyone compliments. \nHe is a really balanced horse with a lovely natural sit, and holds a beautiful rhythm throughout his work. \n\nBred to jump, this boy knows his job! Scotch is a brave, bold and uncomplicated to jump, showing a lot of exciting potential for either the show jumping ring or eventing circuit. \n\nScotch comes from one of our very successful lines, you can find out more about his lineage and family on our website:\nhttps://www.xtremesporthorses.com/for-sale/5-year-olds/scotchxtreme	{https://res.cloudinary.com/dcorxaflu/image/upload/v1769390210/horses/lkqqnrijmhiso3aaf5dw.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390245/horses/mxtovtownylzt17feppq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390253/horses/re1aiygbnhe3mwai3z3s.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390263/horses/hkvwooof2hiynaxh5kex.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390274/horses/trjqczxyoidcgl6zdlzm.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390288/horses/hlza3pau8adjvb8y82qf.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390296/horses/zlnf0qbjxljepdrwir8o.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390305/horses/fxg66glwtuawf61qwun0.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1769390311/horses/gavafmrqjfpplzxhi9z1.jpg}	{}	2026-01-26 01:27:13.155621	70000	80000	Brown	\N	t	\N	\N
14	50	Oaks Mollymook	Australia	\N	{Jumping}	{"Not Applicable"}	{Warmblood}	1	\N	\N	Filly	Yalambi's Monte Cristo	Oaks Cheetah	Casting	{}	AUD	We are thrilled with this filly and her twin brother that we plan to run on. Molly is light on her feet, active and athletic with a great attitude to life.\n\nMonte Cristo is bred in the purple by Cristallo I (x Cornet Oblensky) out of a Toulon mare, he is now ready for futurities and showing the talent he was bred for.\n\nMollymook’s dam, Oaks Cheetah, is  half-sister to international jumper, Ventriloquist and is turning heads in the Rising Stars rings. As well as looking like a true competitor, this filly will be an asset to any breeder of showjumpers.	{/uploads/file-1752469066801-651184776.jpg}	{}	2025-07-14 04:58:04.82456	20000	30000	Bay	\N	f	\N	\N
57	116	Huck Xtreme	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	5	16.3	166	Gelding	Corofino II	Clover Xtreme	Cassiano	{Brave,Scope,Honest,Bold}	NZD	Huck Xtreme\n\nExceptional Young Prospect for the Future  Huck Xtreme is a quality young horse with all the attributes to develop into a top level horse for the future, whether that be in the show jumping ring or on the eventing circuit.  Exceptionally well put together, he is athletic, powerful, and has a real presence about him with that 'look at me' factor!  He is a loose, expressive mover with a lovely natural uphill carriage, producing lovely balanced work on the flat. To jump this boy is so impressive. He has a wonderful technique over a fence, is brave and uncomplicated and has made light work of every question we have given him to date.  Huck combines movement and scope with a fantastic brain! He is intelligent, trainable, and a genuine pleasure to have on the team. His kind, willing temperament makes him a very rewarding horse to produce.  Professionally started and produced at Xtreme Sport Horses, Huck has had an excellent introduction to his ridden career. He has gained off site experience through different outings and is now ready to step up and continue on with a competitive career.  If you’re looking to add a top quality young horse with talent, trainability, and an exciting future ahead to your team, Huck Xtreme is your boy.  For more information, please head to our website	{https://res.cloudinary.com/dcorxaflu/image/upload/v1765244628/horses/q7jcnxnnhpqneab5rdds.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765244203/horses/xac0dzgqj49dy7hrfrkj.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765244191/horses/y7ert7eqzlaixbezxrzj.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765244612/horses/uzmhgcubx5mkf6jfejtx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765244620/horses/v8kwl5jzvftrgz4veuqi.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765244638/horses/pqsuzf47b23qjznl1n9p.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765244670/horses/phcaj7nw6sfcjmpoxoez.jpg}	{}	2025-12-09 01:45:40.393547	70000	80000	Bay	\N	f	\N	\N
93	92	Orangevale Valedictorian	Australia	\N	{Dressage}	{"Young Horse"}	{Warmblood}	3	16.2	165	Gelding	Remi Vigeron (Viscount)	Red Temptation	N/A	{Honest,Calm,Brave}	AUD	Height: 16.2-16.3hh\nAge: 3\nGender: gelding\nBreed: Hanoverian\nRemi Vigeron (Viscount) x Red Temptation\nDiscipline: Dressage\nEducation: Broken in and ready for his second prep\nRider suitability: Capable and confident YR, Amateur through to professional rider.\nLocation: Iredale via Helidon, Queensland\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nQuality, scope and presence\nExceptional bloodlines ensuring all the attributes for future success\nTemperament, trainability, conformation and movement\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772673659/horses/rwiebdtylj2g0yweknzx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772673685/horses/stp4qya9zzsiaohd8lzt.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772673686/horses/xoliym9jsew4fzjuhnzn.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772673687/horses/xk0iwxb2ccowedhgmgj7.jpg}	{}	2026-03-05 01:22:06.599707	30000	35000	Chestnut	Introduction: Orangevale Valedictorian (Cheesel) is a beautifully bred, modern young Hanoverian gelding with an exceptional temperament and genuine dressage talent. At just 3 years old and standing approximately 16.2–16.3hh, he represents an exciting opportunity to secure a young horse with quality movement, outstanding rideability and a proven dam line renowned for producing competitive yet amateur-friendly horses.\n\nBreeding: Cheesel is by Remi Vigeron out of the Thoroughbred mare Red Temptation, who is approved Hanoverian and a highly influential producer. This is the last foal from his dam, making him particularly special within the Orangevale breeding program.\n\nHis bloodlines are well known for producing horses with extraordinary temperaments combined with genuine dressage ability, making them suitable for Young Riders, amateurs and professionals alike. Cheesel is a sibling to Geisha Temptress, further reinforcing the strength, consistency and quality of this maternal line.\n\nConformation & Type: Cheesel is a modern, athletic gelding with a correct frame, good balance and three quality paces. He presents as an attractive, well-put-together young horse with the type and movement desired for competitive dressage while retaining the kind nature that makes him a pleasure to work with.\n\nEducation & Training: Cheesel was professionally broken in by Matthew Lord late last year and was noted to be exceptionally straightforward and easy to start. He has been taken out of the arena environment and worked out on the road, demonstrating a calm, sensible attitude to new experiences.\n\nFollowing his break-in, he was turned out to mature, allowing him time to physically and mentally develop. He is now ready to commence his second preparation, which will begin with Matthew Lord when schedules allow. Updated videos will be produced at that time prior to public listing.\n\nTemperament: Cheesel is consistently described as a ‘good egg’—sweet, genuine and kind with a beautiful nature. He took to being broken in with ease, nothing worries him, and he has shown an excellent work ethic and willingness from the outset.\n\nVices or Quirks: None.\n\nHealth & Management: No known medical issues. He is currently barefoot, wormed and vaccinated. No recent vet checks or x-rays due to age.\n\nRider / Owner Suitability: This is a quality young horse with the conformation, movement and talent to suit a professional dressage program. Equally, his outstanding temperament makes him a genuine option for a capable amateur or Young Rider wanting a kind, trainable horse with real upside. 	t	Started under saddle	\N
75	91	Kitara Krug	Australia	0	{Jumping}	{Junior,"Young Rider"}	{Warmblood}	10	16.1	164	Gelding	Emerald	Not Specified	Budweiser	{Brave,Careful,Scope}	AUD	ompeting successfully at 1.30m level\n\n“Parker” is a brave, scopey and naturally careful gelding with a proven record in junior and amateur competition, and more recently stepping confidently into open 1.30m classes.\n\nHe combines quality breeding with genuine rideability. By Emerald, known for producing athletic, modern jumpers, and out of a Budweiser-line mare. \n\nA pleasant, enjoyable horse to have in the stable, he is easy to manage at home and at shows. \n\nWith his competitive mileage and willing attitude, Parker would be well suited to a capable junior or young rider looking to step confidently into the bigger tracks, while still being competitive in open company.\n\nA playful personality paired with serious ability – a super horse with plenty to offer his next rider.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1771827847/horses/uhmmbvbzd8kgnplaqnkc.jpg}	{}	2026-02-26 06:25:33.392095	65000	80000	Chestnut	\N	t	\N	\N
55	116	Frodo Xtreme	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	5	16.1	164	Gelding	Numero Uno Xtreme	Fancy Xtreme	Corofino II	{Scope,Brave}	NZD	Frodo Xtreme\n16.1hh Gelding\n\nOffered for sale by his breeder Xtreme Sport Horses, Frodo is an exquisite young horse that is ready for his next chapter. \n\nPurpose bred for the modern sport, this boy is a powerhouse with impressive movement and a natural shape that would make him look right at home in a dressage arena. \nHe has had an excellent foundation jumping, proving to be brave, scopey with a great technique and holds a lovely natural rhythm. \n\nFrodo has a temperament you will easily fall in love with. His forward thinking attitude can be seen through all of his work, and his excellent trainability makes him a pleasurable young horse to produce. \n\nAn asset to any new team, Frodo has had his brilliant start with Xtreme Sport Horses and is ready to begin his competitive career with his new rider. \n\nWe are located 1 hr north of Wellington International Airport. \n\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1765239200/horses/zm44ubsco0dargqyg4pr.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765239243/horses/fmqxj35a3dvu3sexmwns.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765239262/horses/uzjz5yc5mix8zn8gpc9q.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765239271/horses/rqpygsxotkmrdeqafldi.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765239294/horses/iarwrt9ybuadlzps9gsz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765240143/horses/pnr1gpkqkpzlu9gekycq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765240160/horses/creq7v1zjtj7myeup7jg.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765240239/horses/qohg20eyf4rf7dgpvi06.jpg}	{https://res.cloudinary.com/dcorxaflu/video/upload/v1765240294/horses/ajqnghpwkopji3nvj5hm.mp4}	2025-12-09 00:38:56.497717	70000	80000	Bay	\N	f	\N	\N
77	567	Bourton Park Koko	Australia	\N	{Jumping}	{"Young Horse"}	{Warmblood}	6	15.3	155	Mare	Wild Kard	Scandalous II	Voltaire II	{Careful,Calm,Bold}	AUD	Rising 6yo Wild Kard (Kannon) x NZ imp (Voltaire II). 15.3hh \nKoko has a lovely quiet temperament and very easy to do everything with. After a late start to mature, she has begun her showjumping training. Jumping up to 80cm at home, ready to go on with. \n\nA straight forward young horse ready for someone to bring up through the levels. Will make a super child's/junior horse for the future, however requires a knowledgeable home now to continue to develop her to reach her full potential. \n$20k, Bayles Victoria \n0400382298	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772083775/horses/rp9zwe6drmdbe3fdjvgz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772083811/horses/i0ubdsq2ozz2unff5q6x.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772083858/horses/n7wdptbzfzwctr0zt0as.jpg}	{}	2026-02-26 05:38:20.339283	20000	20000	Bay	\N	f	\N	\N
110	761	Lil Miss Honey Bee	Australia	0	{Jumping}	{"Under 1m"}	{Other}	13	14.2	144	Mare	Unknown 			{}	AUD	‘Lil Miss Honey Bee’\n14.2hh 13yo QH x Paint Performance Mare\nProven Performance & Results\n• Overall Champion – PCQ State Showjumping Championships 2026 (Maryborough) 13 & Under 26 – 80cm Class\n• Top 10 at State Championships – last 2 consecutive years\n• Many, many wins & placings across the Far North Queensland show circuit\n• Overall Champion at countless gymkhanas\n⸻\n⚡ Ability & Attributes\n• Competitive, fast and quick in jump-offs\n• Capable showjumper. Competed up to 1m with current rider.\n• Extremely handy at sporting events\n• Forward-moving and loves her job\n• Well-travelled and thrives in competition environments\n• Loves the beach\n• Loads and floats perfectly\n⸻\n⚠️ Suitability\nRequires a confident, capable rider to bring out her best and enjoy her competitive nature.\n⸻\nThis mare is worth her weight in gold and more.\nShe has been an incredibly successful and much-loved competition partner.\n\nThis will be a very hard sale — the right competition home is absolutely paramount. Only for sale as rider moving on to bigger mount.\n⸻\nLocated: Innisfail, North QLD\n\nSerious enquiries only.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777887451/horses/mdpkqdkwv3xfh0zblolg.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777887461/horses/e3eobz7zbh6vkwju1kyo.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777887463/horses/bmaunkucw5qvanqjrvzq.jpg}	{}	2026-05-04 09:45:01.629821	25000	30000	Other	\N	t	Well educated	{}
102	92	Bellhaven Coverboy	Australia	0	{Jumping}	{1.20m}	{Warmblood}	7	17.3	176	Gelding	Numero Uno		Monte Bellini	{}	AUD	Asking price: $42k\nHeight: 17.3hh\nAge: 7\nGender: Gelding\nColour: Bay\nBreed: Warmblood by Numuro Uno out of a Monte Bellini mare\nDiscipline: Showjumping, eventing \nRider suitability: Capable and confident 19 year old plus - simply due to age and size\nLocation: Freshwater Creek, VIC\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nWon to 1* level and straight dressage\nShowjumped to 120\nSafe, sound and ready to excel\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1776155029/horses/emvwqbbwzdygc6wyucdn.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1776154932/horses/st73frgaauwokixrytfk.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1776154929/horses/tlofm6vdvh67knniubqx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1776154931/horses/iyaxauhf77j6cvwnrbzr.jpg}	{}	2026-04-14 08:23:09.476218	40000	45000	Bay	Introduction: Bellhaven Coverboy, known as Monte, is a 7-year-old bay Warmblood gelding by Numuro Uno out of a Monte Bellini mare, standing approximately 17.3hh. He is a quality young performance horse with a solid education and proven ability across eventing and showjumping. He is a modern, athletic type with scope and presence.\n\nEducation, skills and experience: Monte is a well-educated gelding with competition experience across both eventing and showjumping. He has competed successfully winning at 1* eventing level and straight dressage competitions with scores up to 77%. He has also showjumped up to 120cm. While dressage is not his preferred phase, he is capable and established on the flat. He is also experienced in trail riding and is well exposed, showing no concern for dogs, livestock or general farm machinery.\n\nGeneral demeanour under saddle: Under saddle, Monte is generally calm and reliable, although not completely unflappable. He is tolerant of rider mistakes and is particularly rideable to a fence, showing confidence and consistency in his jumping phases. He is a genuine and straightforward horse to ride.\n\nCurrent workload / fitness: Monte is currently in work and is being ridden three or more times per week while actively competing. He does not require regular riding to remain reliable and is considered safe to hop on after a spell.\n\nHandling: Monte is easy to catch and safe to handle, wash, groom, lead and saddle. He ties up calmly, loads and travels well, stands quietly and unloads without issue. He is reliable for the farrier and vet. He is very straightforward but does require a capable handler due to his size.\n\nBehaviour: Monte’s only quirk is being occasionally horse shy at competitions, which continues to improve with experience and exposure.\n\nFeeding and management: Monte currently paddocked alone and has access to ad lib hay and is hard feed once daily.\n\nMedical history: Monte has no current or past medical issues. He has never been vetted or x-rayed. He is given 4Cyte as a preventative measure and is up to date with dental, vaccinations and shoeing. A vet check is welcome at the buyer’s expense.\n\nRider Suitability: Monte is best suited to a capable rider and would particularly suit a young rider or adult rider working under regular professional instruction. He is a large, quality horse who benefits from a confident and capable rider.\n\nReason for sale: Monte is offered for sale as the owner has 12 horses in work and needing to make room. He is ideally suited to a long-term home looking to compete in either showjumping or eventing and continue his progress.\n	t	Well educated	{Eventing}
28	98	Gracie	Australia	0	{Dressage}	{Elementary}	{Warmblood}	9	16.3	166	Mare	Argentille Picasso	Argentille Brittany	Argentille Biathlon	{Forward,Scope,Honest,Calm}	AUD	Argentille Graciela has a gorgeous temperament, with the athletic determination and ability you would expect from a high class performance bred horse. Brought along slowly under three incredible trainers, 'Gracie' has very strong results in Prelim through to elementary and is competition ready for her next partner. She will have you grinning from ear to ear as you test her dressage moves and play with her gears. 64%-74% during the 2025 season with novice level rider. 68% elementary under professional in first outing for elementary and the 2025 season.\nGracie would suit a confident, capable rider who is looking to advance in their dressage journey or enjoy a stylish, quality horse with a solid foundation. Best partnered with someone who is looking for a performance horse wanting to explore dressage training, clinics, competitions etc. Not jumping. Eye catching and heart stealing she loves her 'people/person' - with elegant conformation and a lovely way of going. She has natural athleticism, with a big scopey trot and slow flowing canter.\n\nLocated on a property with excellent equine facilities in Bywong, NSW, where genuinely interested buyers are welcome to meet, ride Gracie. Further video footage and further information can be provided upon request. I am committed to finding Gracie the perfect home, Gracie is not fulfilling her potential with me. The right person will find an incredibly rewarding partner in this special horse. \n\nPlease note:- Gracie is currently out of work due to summer break and my personal capabilities.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1757485443/horses/vhahq1mpzthwugmktdak.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757485439/horses/b4xobqlme0p12g2exwg9.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757485442/horses/oorrzwtu9az7shtyxtfm.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757485445/horses/idgvpmlwdperkyymgrxt.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757487788/horses/zp3ippmjzqpot4eop5is.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757487802/horses/j3b3pge2rlodjun8e9uk.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757488556/horses/ig1h7mqvskkbelp9sdu5.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757487855/horses/omgavmm89rzq2izryuic.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757488459/horses/wm2pbmejt3bnmkx1if92.png,https://res.cloudinary.com/dcorxaflu/image/upload/v1757488492/horses/iwykfq3if71hvqqwec8y.png,https://res.cloudinary.com/dcorxaflu/image/upload/v1757488502/horses/g2r38epx7kvdztlsbdl8.png}	{}	2025-09-10 02:12:59.767249	35000	40000	Brown	\N	f	\N	\N
76	611	Beatrix	Australia	0	{Jumping}	{Amateur,Children}	{Warmblood}	12	16.2	165	Mare	Mount Robinsons Gwaihir 	Tornado Two Step	Unknown	{Careful,Brave,Forward}	AUD	Beatrix\nBea is a 12y/o 16.2hh warmblood X mare. Bea has taken me up the heights from 80cm-1.15m. She has a soft mouth, a forward canter and three beautiful paces. Bea is very brave, easy to c/f/s. Bea will happily go on trails with or without company. She would best suit a confident balanced rider. Only for sale due to university commitments, Bea is a very special horse and will only go to the best of homes\nLocated: Central Coast NSW\nContact for more info!	{https://res.cloudinary.com/dcorxaflu/image/upload/v1771929553/horses/q7tzirxi4ufin53sqhw8.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1771929577/horses/xhnlqpkq6yctfplovq4h.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1771929627/horses/hegxloj8bhm6o5ldcn00.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1771929682/horses/fo6uakb00yaigfseyvqe.jpg}	{}	2026-02-24 10:47:34.655012	25000	30000	Bay	No notable injuries or issues	t	\N	\N
74	567	Bourton Park Trouble	Australia	0	{Jumping}	{Amateur,"Young Horse",Junior}	{Warmblood}	8	17	173	Gelding	Woodleigh Don Juan	TB	Unknown	{Bold,Honest,Scope}	AUD	🌟 Bourton Park Trouble 🌟\n\n17hh rising 8yo chestnut gelding by Woodleigh Don Juan x TB mare.\n\nA lovely big horse with an adjustable canter and soft snaffle mouth. Competing up to 1m, showing a neat, careful shape over a fence. Training laterals and flying changes. Well-behaved at shows and a genuinely cool guy to have around.\n\nDespite his size, he’s got a good bit of energy and is still refining his jump technique as he gains strength and experience, so would best suit a confident, capable amateur looking for a quality horse to produce for the future. \nBayles, Victoria \n0400382298\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1771744292/horses/sbo7oph35atc2iyg4zwu.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1771744316/horses/k7cwzzwdyutkxpxmwrlj.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1771744333/horses/pq76am33chmdtvk84cma.jpg}	{}	2026-02-22 07:24:07.163191	30000	30000	Chestnut	\N	t	\N	\N
32	111	Cacharina TS	Australia	\N	{Jumping}	{"Not Applicable"}	{Warmblood}	4	16.1	164	Mare	Cachassini II	So Elegant	El Bundy	{Careful,Sensitive,Forward}	AUD	Cacharina TS is 164cm a quality, beautiful, dark brown 4yo mare DOB: 29/12/20\nBy Cachassini II out of a Reg Hanoverian Stud book mare So Elegant who jumped to 1.30m herself\nThis model of a mare has been broken and ridden and had only one jumping competition (Videos of her first rounds in the ring) She is a half sister to former Australian Grand Prix horse Cavalier Du Rouet ridden at World Cup level by Stephen Dingwall. He was her first foal and this mare is her second.\nShe would be a great addition to any competition mare herd.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1757565643/horses/sjpz1uipwgsg7lfzra89.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566018/horses/bvalouxyoxyxhw7uhsvh.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566056/horses/ja9g5e3xtulnvrhwcshn.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566072/horses/eimdrjorsathzz3akefp.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566087/horses/eotyutooaiitoypxjtf0.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566112/horses/ke33lnyasleknwanxvwf.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566198/horses/xv4svqczpgsuqbxgy5op.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757566213/horses/fbpa6e5mehnm69btjia2.jpg}	{https://res.cloudinary.com/dcorxaflu/video/upload/v1757565748/horses/kgsoqkajnuk0qrrlipnn.mp4,https://res.cloudinary.com/dcorxaflu/video/upload/v1757566150/horses/ap8wawgku9uiydj8ake3.mp4,https://res.cloudinary.com/dcorxaflu/video/upload/v1757566283/horses/wwuwlpe6xkbfasw1rzig.mp4}	2025-09-11 05:05:54.247867	15000	25000	Brown	\N	f	\N	\N
30	107	Skittles V 	Australia	\N	{Jumping}	{"Young Horse"}	{Warmblood}	4	16.3	166	Gelding	GFS Fire and Ice 	Ark D’Monarsh	James 007	{Scope,Brave,Careful,Honest}	AUD	Skittles V 4yo 16.3 Gelding   \n\nWell educated on the flat with great jumping technique and ability. \n\nSuitable for a variety of riders and has been ridden by teenage girl. \n\nCompeting to 95cm and jumped 4 clear rounds at his second show over the last two weekends at Waratah. \n\nGenuine reason for sale offered on behalf of owner. \n\nPlease privately message for further enquires and videos. \n\nSydney, NSW 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1757493827/horses/lln0lofskd2kixzfnhii.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757493834/horses/cclu5inb8nii4j0sexdm.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1757493845/horses/tnen2dpqrcuviyxckkp2.jpg}	{https://res.cloudinary.com/dcorxaflu/video/upload/v1757493532/horses/bcrmiibe5naosg7f7b09.mov,https://res.cloudinary.com/dcorxaflu/video/upload/v1757493587/horses/qe1nsihsjbbjpie9depo.mov}	2025-09-10 08:44:15.758987	45000	50000	Other	\N	f	\N	\N
34	116	Gulliver Xtreme	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	6	17	173	Gelding	Numero Uno Xtreme	Casa Rosa MVNZ	Pico Bello	{Brave,Calm,Scope}	NZD	A modern type, Gulliver is an impressive and exciting gelding that defines class and quality.  After being professionally started and produced at the stud, Gulliver has had a positive start to his ridden career which has led to a solid foundation in his education. He is now ready to begin the next chapter with his new rider and begin his competitive career.\n\nHe has superb powerful movement, with excellent hock and knee action.\nHis jump is even more impressive! With an incredible technique, an impressive backend and plenty of scope, Gulliver is howing to be a very serious horse for the future.\n\nHe has the most loveable teddy bear temperament! He has a kind, gentle personality and is always looking to give the right answer, no matter the question. He is a straightforward, brave horse with a sensible old soul personality that makes him an absolute pleasure to have in the team!\n\nIf you're looking for your next superstar, a beautifully bred youngster to develop through the grades, or just your next best friend Gulliver is the whole package!\n\nMore information on him, his family and Xtreme Sport Horses can be found on our website.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1759096781/horses/d5cmtjqblr91jeoiaa12.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759096120/horses/typzwtqzstpvsfafifqm.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759096242/horses/qbhzh63a0iatchfjj77z.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759096293/horses/davds7toiqzpy4a16vxg.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759096790/horses/q8v5avea6dt3sujebyfd.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759096818/horses/abcsrijhqgsfls4xdw9r.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759097438/horses/uoqlaiawxohsm8k6pqf2.jpg}	{https://res.cloudinary.com/dcorxaflu/video/upload/v1759094418/horses/syrpwatfjxkkb8xzjojn.mp4}	2025-09-28 21:57:17.954163	80000	80000	Other	\N	f	\N	\N
73	92	Kentaur Ariel	Australia	\N	{Jumping}	{"Not Applicable","Young Rider"}	{Warmblood}	11	16.2	165	Mare	Absolute Ego Z	Kentaur Pino Colada	Pico Bello	{Careful,Brave}	AUD	Ari is an absolute dream to ride and handle! She is talented, careful and has outstanding movement. This sale presents a fabulous opportunity for someone to purchase a well bred, well educated mare who will suit a range of riders across a range of disciplines.\n\nFrom her breeders - Kentaur Ariel is a superb investment for an ambitious rider. Correct in type with a fantastic, sweet personality and trainability to match. She is a manageable powerhouse suitable for both amateurs and professionals.\nBloodlines: Ari is undoubtedly exceptionally well bred, being sired Absolute Ego Z - an exciting stallion by Air Jordan Z and out of a Lux Z/Calvin Z mare. Bred in purple, this stallion offers commercial up-to-date bloodlines. Strong Argentinus attributes are being passed onto his progeny. His unlimited scope and rideability make this a particularly desirable combination.\n\nAri is out of Kentaur Pina Colada - an exciting mare by Pico Bello and out of Belcam Aida. She is showing a lot of promise in the jumping ring with a super back end and unlimited scope.\nConformation: Ari is a wonderful example of the modern performance horse - compact, athletic and refined. Her paces display elasticity, power and activity.\n\nEducation, riding and experience: Ari would be competent to compete at novice level dressage and produce a lovely dressage test. She has automatic flying changes and laterals established. This also makes her rideable, adjustable and competitive on course!\n\nAri is competitive, quick and rideable around the course. She is the quintessential ‘careful’ horse that will do anything to keep the rails up but doesn’t like to be missed in a competition environment and may stop in that scenario.\n\nAri is a dream to take out, show, attend clinics, trail ride and ride around the farm. She is always safe with absolutely no dirt. Ari is currently in work 3 days a week. \n\nAri is patient and well mannered on the ground to rug, wash, shoe etc. She is great for the farrier and to clip. Ari is very easy to load, travel and unload - in either a float or truck. She loves cuddles and affection.\n\nBehaviour: Ari is happy in big city and Royal Show environments. She travels well - loads and unloads without fuss and eats and drinks well when away from home. \n\nAri is sensible and reliable to ride and handle. She does not have any vices under-saddle or on the ground. Ari may turn her head to look at something loud - like side show alley - but she is not spooky.\n\nFeeding and management: Ari is fed a simple diet - hay  - and when in work, a small am and pm feed. She is currently paddocked full time. Ari is happy to be stabled at competitions and is happy in a herd environment or on her own with a horse in sight.\n\nMedical history: Ari does not have any medical issues. She has ‘clean’ xrays and vet check, from April 2025, available to view by serious potential purchasers.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1771660033/horses/ntcdb6gx7znesjurt1jo.jpg}	{}	2026-02-21 07:49:04.625172	25000	35000	Bay	Rider Suitability: Ari would suit - and be an asset to - any rider from a ‘novice under instruction’ through to a competitive and capable rider. \n\nGiven Ari’s propensity to stop when missed, we will not sell her to a novice rider to showjump. She would, however, be very suitable to showjump with a confident rider who has a good eye.\n\nReason for sale: Ari is very sadly for sale due to the purchase of a very brave, showjumping schoolmaster. 	t	\N	\N
36	170	Sterntaler Dynamite	Australia	\N	{Jumping}	{"Young Horse","Not Applicable"}	{Warmblood}	3	\N	\N	Gelding	Dia Blue PS	Cartier SS	Yallambi's Carpino Z	{Calm,Scope,Careful}	AUD	Sterntaler Dynamite is a 3 yo gelding currently 16.2 hh , This quality young horse has got a pedigree littered with 150/ 160 jumpers . Dyno is by Diablue PS ( 7 yo stallion currently jumping 140 - watch his youtube video in link below ) who has Diaron/ Diarado/ Diamant de Semilly on his sire side and Stakkariella / Stakkato and Chacco Blue on his dam side . Dyno's dam is Cartier SS. She is by Yalambi Carpino Z (160 Jumper) who has plenty of 160 jumpers in his pedigree as well. Carpino Z is also the sire of Billy Raymond's gelding Carprino , 3 times World cup Winner. Dyno is a very delightful, willing youngster that truly stands out in the crowd. He has been broken in and had about 10 rides and taking it all in his stride . He has a very uphill canter and a powerful stride. This young horse is destined for great things in the Jump arena. More Pictures and videos are available on request. Find Diablue video here   https://youtu.be/YAmStGfeNRc	{https://res.cloudinary.com/dcorxaflu/image/upload/v1759617665/horses/ypmrduoz5doxtzgyvbtv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759617681/horses/fuehtey0zwzj3muxhw4x.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759617704/horses/u2pnimmvwwu49zhkbyxw.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759617715/horses/qpo3nukjacr526bdbgam.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759617727/horses/wxjttx4mhq5pe2hbkf39.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1759617738/horses/cqbzjyxnmoscgkdnfczz.jpg}	{}	2025-10-04 22:49:32.297562	30000	30000	Chestnut	\N	f	\N	\N
79	92	SPD Dancing Diva	Australia	0	{Dressage}	{Preliminary}	{"Riding Pony"}	9	14	142	Mare	Noble Dancer IMP	Diva Toscana IMP		{Honest}	AUD	Introduction: SPB Dancing Diva, affectionately known as ‘Diva,’ is a 9-year-old 14hh palomino splash dun mare located in Tamborine, QLD. She is a striking 100% German Riding Pony by Noble Dancer IMP out of Diva Toscana IMP and is registered with ACE, EA, Part Welsh, Show Horse Council, Part Arabian, Dilute and Pinto registries.\n\nDiva is a beautifully bred, quality performance pony with proven results at State level. She combines athleticism, education and presence, making her a genuine competition prospect for a serious rider.\n\nEducation, Skills & Experience: Diva is well educated and has experience across dressage, showing, 60-70cm showjumping and has also schooled cross-country. She has competed successfully, demonstrating her quality and consistency in the competition arena.\nShe is established in her flatwork. She willingly collects, is responsive under saddle and has the foundations required for continued progression in dressage and show disciplines.\n\nOutside the arena, Diva has been trail ridden and is safe and quiet to ride near cattle and sheep. She has been lunged, ridden bareback and is safe for beginners on the lead and novices under instruction. She is not concerned by children in her vicinity, busy roads, farm machinery, livestock, dogs or fireworks. She is also comfortable being stabled full-time in a busy city stable environment.\n\nTemperament & Rideability: Under saddle, Diva is willing and responsive with a natural ability to collect. She is generally calm and reliable, though not completely unflappable, and benefits from a confident rider who can maintain focus and consistency.\n\nShe can occasionally be sassy at the beginning of a ride and may hump slightly or show typical ‘marey’ behaviour, including kicking out at other horses. This is not a constant issue and she remains completely safe. She requires a rider who is not fazed by minor antics and can simply redirect her attention back to the job at hand.\n\nDiva does not require regular riding to remain safe and sensible and is currently in light work one to two times per week.\n\nHandling & Ground Manners: Diva is exceptionally easy to handle. She is easy to catch, well mannered on the ground and leads calmly and willingly. She ties up happily without fuss, self-loads or loads easily onto a float or truck and stands quietly while travelling.\n\nShe is easy and calm to clip, easy to wash and reliable for the farrier and veterinarian. She is tolerant of handler mistakes, unflappable and straightforward to manage in day-to-day situations.\n\nRider Suitability: Diva is best suited to a capable rider at a minimum. This is defined as someone who has been riding and competing regularly for at least five years, has independent hands and a balanced position and is confident in all situations.\n\nShe would suit a competitive child under 14, junior rider, young rider, amateur adult or mature rider who is under regular professional instruction. Due to her quality and ability, she is ideally suited to a serious competition home, with a dressage-focused home preferred.\n\nFeeding & Management: As a pony type, Diva can gain weight on rich pasture and is therefore managed carefully. She is currently kept in a paddock with short grass and receives one biscuit of grass or grassy lucerne hay daily, along with a small hard feed of lucerne chaff, copra and vitamin and mineral supplements.\n\nWhen in full work, she may also receive pellets such as Pryde’s Easi-Sport, Johnson’s Alfalfa Pellets or Hygain Zero. She is currently barefoot and has been for over a year due to being in lighter work, although she is shod when in full work.\n\nHer management is entirely flexible. She can be paddocked alone, stabled part-time or happily stabled full-time in a busy environment.\n\nVeterinary & Care: Diva has small cosmetic scars but no significant medical concerns. She is currently vaccinated for Tetanus and Strangles, with boosters due. Her dental is also due. She is maintained barefoot and up to date with farrier care.\n\nReason for Sale: Diva has been owned since she was a two-year-old and is very much loved. Her rider is now pursuing higher level showjumping at 120cm and above, whereas Diva is more suited to showing, dressage and showjumping under 1m.\n\nThis sale is solely to enable the purchase of a larger, higher-level showjumper.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772527405/horses/koafashmzz1snrlnc4vv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772527420/horses/ou1rmwn2w6aki37snzzn.jpg}	{}	2026-03-03 08:45:21.520022	40000	45000	Palomino	Diva is a top-quality, beautifully bred German Riding Pony with proven State-level results. She is educated, athletic and versatile, with the talent to excel in dressage and showing and enjoy lower-level showjumping or eventing.\n\nShe is offered to a serious, knowledgeable competition home where her quality and ability will be appreciated and developed further.	t		\N
103	92	Embrook Stables Charlie	Australia	0	{Jumping}	{1.20m}	{Warmblood}	13	16.2	165	Gelding	Charlemagne Ego Z	Belcam Ala	Belcam Agassi	{}	AUD	Asking price: $25k - Charlie will only be sold to the perfect home or he will be retained.\nHeight: 16.2hh\nAge: 13 (2.11.2012)\nGender: gelding\nColour: grey\nBreed: WB - Charlemagne Ego Z x Belcam Ala (Belcam Agassi)\nDiscipline: Showjumping\nRider suitability: Very capable/ experienced and CONFIDENT - he is not a junior’s schoolmaster\nLocation: Palm Grove, NSW (north of Sydney)\nPlease see Owner’s Response Certificate for more information.\n\nSignificant Results\nWon to 135 level with a professional rider\nWon to 125 level with capable junior riders\nPlaced 5th and 8th Overall at the NSW State Interschool Championships 2025\nPlaced 8th - 120 Juniors - Tamworth World Cup Show 2025\nDESA Club Champion 2024\n\nIntroduction: Embrook Stables Charlie is a 13-year-old Warmblood gelding (Charlemagne Ego Z x Belcam Ala) standing 16.2hh and EA registered, the sort of grey that walks into the ring with presence and purpose. He has been produced with professional guidance and shows it in the way he goes—scopey, careful and educated.\n\nEducation, skills and experience: Showjumping is his speciality. Charlie was competed by Clem Smith and the team at Yandoo prior to being purchased by PHS. He has competed successfully to 1.35m with a professional rider, and to 1.25m with a capable junior. His record includes placings at National level, the Australian Showjumping Titles and was 5th and 8th overall in his Championship SJ classes at Interschool State in 2025. He is an incredibly careful showjumper. \n\nOn the flat he feels every inch the educated warmblood: he collects willingly, offers established lateral work and automatic flying changes, and is light in the bridle, happily ridden in a snaffle (currently a Trust Innosense full cheek, port mouth). \n\nGeneral demeanour under saddle: Charlie is described as a direct reflection of his rider - confident and relaxed with a composed, accurate pilot, or tense if ridden by someone nervous or unbalanced. If he feels worried and pressure builds - such as being repeatedly ‘missed’ during a jump round or going somewhere ‘scarey’ - he may refuse to go forward and may jack up. The best way to describe him is ‘talented and a really nice bloke, but can be a bit of an anxious pleaser’...\n\nCurrent workload / fitness: He does not require daily riding to remain sensible. He is currently in work five days each week with a professional rider in preparation for sale. \n\nHandling: On the ground Charlie is sensible, easy to catch, wash, groom, saddle, shoe and vet. He is a reliable loader and a quiet traveller.  Charlie is used to farm life, tractors, trains and livestock. He is not bothered by dogs. He is not worried by fireworks and the chaos of Ag Shows.\n\nFeeding and management: Charlie is fed ad lib hay - due to lack of grass - speedibeet and chaff. He is given supplements for preventative purposes.\n\nMedical history: Sound and in work, he has thin soles managed successfully with a six-week farrier cycle, 3D pads and putty. Recent X‑rays are available, with angles improved under the current shoeing plan. He is vaccinated for tetanus and strangles, and up to date with dental care.\n\nRider Suitability: Charlie is NOT a junior’s schoolmaster. He is a well-educated, careful jumper who thrives with regular riding by an experienced rider or a very capable and confident rider under regular professional guidance - someone with feel, a steady eye to a fence and the composure to give him the confidence to do his job. \n\nReason for sale: This is a very sad sale for us. Charlie’s rider has four other horses in work and is studying law. She does not have the time to ride a fifth and Charlie is the least straight forward. Charlie thrives in a professional style environment - he loves being stabled at night and jumping on good surfaces. We feel that there is a home out there that can provide Charlie with the lifestyle and rider that can bring out his very best.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777500888/horses/qzrhkwopqxttaoncvdab.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777500900/horses/elyxdzji48fiqps1xajw.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777501093/horses/lmunttze00vsznf824ys.jpg}	{}	2026-04-29 22:31:30.767692	25000	25000	Grey	Significant Results\nWon to 135 level with a professional rider\nWon to 125 level with capable junior riders\nPlaced 5th and 8th Overall at the NSW State Interschool Championships 2025\nPlaced 8th - 120 Juniors - Tamworth World Cup Show 2025\nDESA Club Champion 2024\n	t	Well educated	{}
106	92	Canyon Sirius	Australia	\N	{Jumping}	{"Under 1m"}	{Other}	9	13	132	Gelding	Canyon Toscanini 	Canyon Serenade 		{}	AUD	Asking price: $38k including fitted saddle, bridles & custom gear - neg to the perfect home\nHeight: 13hh\nAge: 9\nGender: Gelding\nColour: liver chestnut\nBreed: Registered Partbred Welsh & Registered Australian Pony\nCanyon Toscanini x Canyon Serenade \nDiscipline: dressage/ showing, eventing, showjumping, pony club/  adult rider club\nRider suitability: Novice rider\nLocation: Moss Vale, NSW\nPlease see Owner’s Response Certificate for more information.\nHighlights\nSafe, calm and unflappable to ride and handle\nWilling, responsive and automatically ‘collects’\nPlaced at Sydney Royal and major Interschool events\nNo lunging, no workdown and no ear plugs\nFree of vices, medical and management issues\n\nIntroduction: Canyon Sirius, known as Simon, is a 9-year-old liver chestnut Australian Riding Pony gelding standing approximately 13hh. By Canyon Toscanini out of Canyon Serenade, he is registered with APSB, WPCS and EA. Located in Moss Vale, NSW, he is a highly educated and versatile pony with a strong interschool and allround performance background.\n\nEducation, skills and experience: Simon has a superior level of education and experience across dressage, showing, showjumping, eventing and pony club activities. He has competed successfully, including placings at Sydney Royal led classes and at Tamworth Interschools in both showjumping and eventing. He is a genuine allrounder, with experience in trail riding, cross country schooling, lunging, bareback riding and swimming, and is well exposed to a wide range of environments including roads, farm machinery, livestock and busy stabling situations.\n\nGeneral demeanour under saddle: Under saddle, Simon is a willing, responsive and adaptable pony who adjusts well to the competence of his rider. He is soft and light in the bridle, willingly collects and is tolerant of rider mistakes. He is generally calm and reliable, with the ability to transition from a quiet child’s mount to a more forward performance pony when required. He is straightforward and genuine.\n\nCurrent workload / fitness: Simon is currently in work and being ridden three or more times per week while actively competing. He does require regular riding, ideally four or more times per week, to remain consistent and may benefit from lunging prior to riding after a spell.\n\nHandling:  Simon is easy to catch and straightforward to handle. He ties up calmly, is easy to clip and wash, and is good for the vet. He is tolerant of handler mistakes and generally easy to manage in day-to-day situations.\n\nBehaviour:  Simon is a kind, genuine pony with no vices. As with most performance ponies, if overfed on ‘hot’ feed and also under worked, he may become hot or less reliable under saddle - however, this is easily prevented with a grain and soy free feed.\n\nFeeding and management:  Simon is a good doer and is currently managed on a fibre-based diet including Digestive EQ, pellets and supplements. His management is flexible, and he can be kept in a herd, on his own or in full-time stabling.\n\nMedical history:  Simon has no past or present medical issues. He is vaccinated for tetanus and strangles, had his dental completed in June 2025 and is currently barefoot. A vet check is welcome at the buyer’s expense.\n\nRider Suitability: Simon is suitable for a novice rider under regular professional instruction and would suit a child, junior or young rider looking for a versatile and capable pony. He is an ideal interschool mount, offering both confidence and performance, provided he is managed and ridden consistently.\n\nReason for sale: Simon is offered for sale due to being outgrown and a reduction in numbers. He is ideally suited to a home looking for a genuine, allround pony to enjoy across a variety of disciplines and as a valued family member.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777503358/horses/jklbqwzuuse8nhwhuy0t.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777503360/horses/e4hauewnucxidfb2xspz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777503362/horses/hwysclugffa7f9vixs5u.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777503363/horses/glwquevydy5aeck1fxby.jpg}	{}	2026-04-29 22:56:57.035256	35000	40000	Chestnut	\N	t	Well educated	{Eventing}
84	92	DNH Quaterboy	Australia	\N	{Eventing}	{EvA60}	{Other}	9	14	142	Gelding	Quaterback's Junior (GRP by Quarterback) 	Nottingham Royal Romance	Willowcroft bloodlines	{Forward,Brave,Schoolmaster,Bold}	AUD	Asking price: $15k firm\nHeight: 13.2hh\nAge: 9\nBreed: German Riding Pony\nACE Registered\nSire: Quaterback's Junior (GRP by Quarterback)  \nDam: Nottingham Royal Romance (Aust RP -  Willowcroft bloodlines). \nDiscipline: Eventing, showjumping, pony club/ adult rider club, pleasure/ trail riding\nRider suitability: Confident novice rider\nLocation: Canberra, ACT\nPlease see the Owner’s Response Certificate, in the horses portfolio, for more information.\n\nHighlights\nSuper successful pony in dressage, showing, eventing, showjumping and sporting\nRidden by his current rider, since he was green broken and rider was 8yo\nSafe, sound and competitive\n\nRecent Results\nChampion - E Grade  -  Murrumbateman SJ Festival 2025\n1st place - E Grade CLPC ODE 2025 - Dressage Test Results (72%) \nChampion - 11-12 Year Old Hall PC Gymkhana 2025\n11th place EVA65 - first ever EA Horse Trials - Harden Horse Trials 2025	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772586473/horses/ufukchlmm67ifwcoc2t1.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586478/horses/wy2rmgyjsqrkp3pqkkyq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586484/horses/ndvv341ditxptegiktwc.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586489/horses/gou24kbufi0nkvyijepq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586500/horses/bkfly5me5qylzd5aodfz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586507/horses/hrkfrqpa1o1mrlvfjujz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586516/horses/ixbxiou1wsumjnimu4wf.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586532/horses/zorgw4nfijutqwqrgy0w.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772586539/horses/dsr3w8erfkyseas06hke.jpg}	{}	2026-03-04 01:10:24.602928	15000	20000	Chestnut	Introduction: Flash is a beautiful large German Riding Pony gelding. He is a super competitive and fun pony for a keen intermediate rider. Flash has won and placed in dressage, showjumping and eventing and is ready to teach his next young rider!\n\nBloodlines: Flash is by Quarterback’s Junior, who is by the Grand Prix stallion Quarterback. Quarterback’s Junior is a versatile young stallion who was Champion at his 30 day test and victorious at the National IG Welsh championships, earning the title, “National Champion Stallion." Quarterback’s Junior is proving himself to being a versatile young stallion and has won in the riding pony classes and jumper pony classes. He has qualified many foals for the German National Foal Championships in Lienen. \n\nEducation, skills and experience: Flash was broken in at age 5 and has been ridden by his current owner since he was a ‘green broken’ 6 year old and his rider was only 8 - bearing in mind that she was a capable 8 year old in a knowledgeable horsey home!\n\nFlash is training 80cm showjumping and he is very competitive at 60-70. Flash lives for the jump-off – agile, clever, and quick on his feet. Flash has competed EVA65 and loves cross country! \n\nWhile jumping is his clear passion, Flash can produce a lovely dressage test scoring up to 73%! He has proven himself at preliminary level dressage and is training novice.\n\nFlash really is the ultimate allrounder! He will win or place in every event from hacking and dressage to showjumping and sporting. Flash has even done some cattle work at pony club camps and enjoyed the experience!\n\nGeneral demeanor under saddle: Flash is a willing and responsive pony. This is what makes him a competitive performance pony. Flash loves his job!\n\nFlash collects easily for a rider with an independent seat and understanding of contact. He is light and happy in a snaffle at all times, in all disciplines.\n\nFlash is not spooky - unless the rider is tense and nervous - and has no vices. He is great on trails and roads. He attends pony club. Flash is familiar with dogs and kids. He is tolerant and safe in all situations. \n\nCurrent workload/ fitness: Flash is ridden 3-4 plus days a week. He is perfectly safe to hop straight on, after a spell, but he can do a harmless cheeky pigroot if he isn’t lunged for 5 minutes is he has had a few weeks off.\n\nHandling and behaviour: Flash is easy to catch, handle, saddle, wash and float. He is patient, kind and reliable in all ways.\n\nFeeding and management: Flash is hard fed when in work. He is not an ‘overweight’ type but maintains condition and fitness easily.  Flash can be stabled or paddocked. Flash is a pleasure to take to shows, travels well, eats and drinks happily. \n\nMedical history: Flash doesn’t have any medical concerns or issues.\n\nRider Suitability: Flash is a super fun, competitive pony with loads of personality and ability. Not for a beginner due to his level of education, willingness and talent. He would be a very reliable mount for a confident novice rider - child, teen or small adult - looking for a second or third competitive pony. He is smart so does need a knowledgeable home.\n\nReason for sale: Flash is very sadly for sale due to being outgrown. He is a valuable part of his family and will only be sold to the right home and rider.  	t	\N	\N
80	92	Ivy Bank Jasper	Australia	0	{Dressage}	{"Young Horse"}	{Warmblood}	4	16	163	Gelding	 Ivy Bank Eclipse 	HPS Gala Queen		{Bold}	AUD	Jasper has completed a solid education over the past year, undergoing professional training that includes short preparations followed by longer spells. He has been educated across multiple disciplines and confidently ridden by various riders, including a 14-year-old. His experience includes trail riding, swimming in dams, and participating in local dressage competitions. Jasper showcases his versatility by attending jumping clinics and cross-country schooling.\n\nIn dressage, Jasper has demonstrated his potential with two local competition outings, where he won the Preparatory tests, showcasing his consistent performance and ability to excel in this discipline.\n\nJasper shows huge potential over fences, as he is incredibly willing and unfazed by most situations. He takes everything in stride, demonstrating no stop at a fence, whether it is scary fill or a young rider placing him in an awkward spot.\n\nUnder saddle, Jasper is forward and sharp, yet he remains willing and responsive. He is soft and light in the bridle and willingly collects when asked. His tolerant nature allows him to be forgiving of rider mistakes, and he is generally calm and reliable, although not completely unflappable.\n\nCurrently, Jasper is in light work, being ridden one to two times a week. He does not require regular riding to remain reliable and safe; however, he benefits from a quick lunge, before riding, after a spell.\n\nJasper can be described as a bit 'in your face' in a friendly manner. He leads calmly and willingly, ties up happily without fuss, and self-loads into a float or truck very easily. He stands quietly when traveling and unloads calmly. Jasper is easy to wash and is reliable for handling during farrier visits and for the vet.\n\nJasper is currently grass-fed only and can get excited about treats or hard feed. He can be pushy at feed time but shows no aggression towards humans. Management is flexible, as he can be kept in a herd situation or in a paddock on his own, and is comfortable being stabled for 12 hours each day.\n\nJasper has no past or present medical issues, indicating his soundness and overall health. He is currently vaccinated for Tetanus and Strangles, with the last dental appointment having been in December 2025.\n\nJasper is best suited for a capable rider, defined as someone who has been riding and competing regularly for at least five years. This rider should possess independent hands and a balanced position, with the ability to walk, trot, and canter on various horses, both young and educated. He would also suit a junior rider under 18, a young rider aged 18-24, an amateur adult rider, or a mature rider.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772528040/horses/rfcmjjjhlxys3vxno89y.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772528076/horses/nymwftybohhwkh3mycoz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772528087/horses/asixcks9hrxvxwgnhiwk.jpg}	{}	2026-03-03 08:57:30.215681	30000	40000	Palomino	Ivy Bank Jasper is being offered for sale by his breeder/trainer as a quality performance horse. The seller is looking for a keen young or amateur rider or a professional rider who can help Jasper progress through the grades in their chosen discipline.	t		\N
104	92	Ru	Australia	0	{Jumping}	{1.20m}	{Thoroughbred}	12	16	163	Gelding	Rothesay	Fantasy Lass		{}	AUD	Asking price: $45k\nHeight: 16hh\nAge: 12\nGender: Gelding\nColour: Black/ brown\nBreed: Thoroughbred\nDiscipline: Showjumping, pony club/ adult rider club\nRider suitability: Capable - simply due to talent\nLocation: Purga, QLD\nPlease see Owner’s Response Certificate for more information.\nHighlights\nSnaffle mouth – soft and rideable\nNaturally brave to fill and adjustable in front of the fence\nBalanced and educated on the flat\nCompeted successfully in showjumping and eventing\n\nSignificant Results\nPlaced in every class entered - Canberra Royal 2026\nPlaced in every class entered Brisbane Royal 2025\n2nd Place Six Bar Brisbane Royal 2025\n\nIntroduction:  Ru is a 12-year-old black/brown Thoroughbred gelding by Rothersay out of Fantasy Lass, standing approximately 16hh. Located in Purga, Queensland, he is EA and TSHA registered and presents as an eye-catching, talented performance horse with a strong record and proven ability in showjumping and eventing.\n\nEducation, skills and experience:  Ru is a well-educated gelding currently competing in showjumping up to 1.20m, with experience to 1.30m and scope to progress further. He has competed and placed at major events including Canberra and Brisbane Royal, and has also been successful at feature classes such as the OTT feature at Charters Towers and the Nutrien Ag Series in North Queensland. He is balanced and established on the flat, with additional experience in trail riding, cross country schooling, lunging and general exposure to a wide variety of environments including roads, machinery, livestock, dogs and busy stabling situations.\n\nGeneral demeanour under saddle: Under saddle, Ru is willing, responsive and rideable, putting in as much effort as required by his rider. He is soft and light in the bridle, willingly collects and is generally calm and reliable, although not completely unflappable. He is described as naturally brave, adjustable and careful over a fence, making him a genuine and confidence-inspiring ride in his jumping phases.\n\nCurrent workload / fitness:  Ru is currently in full work and is ridden five or more times per week while actively competing. He does not require constant riding to remain safe and is suitable to hop on after a spell.\n\nHandling:  Ru is easy to handle and well mannered in all routine situations. He is easy to catch, leads calmly, ties up without fuss, loads and travels well and is easy to wash and clip. He is reliable for the farrier, good for the vet and tolerant of handler mistakes.\n\nBehaviour:  Ru has no vices or quirks and presents as a sensible, reliable horse both in and out of work. He is comfortable in a variety of environments and is accustomed to both competition settings and busy stable environments.\n\nFeeding and management:  Ru is currently fed twice daily on a grain mix with chaff, along with lucerne hay. He is adaptable in his management and can be kept in a herd, on his own, or in a combination of paddock and stabling environments, including full-time stabling.\n\nMedical history: Ru has no past or present medical issues. He was last vaccinated in January 2026 for tetanus, strangles and Hendra, and his dental was also completed in January 2026. He is currently shod and a vet check is welcome at the buyer’s expense.\n\nRider Suitability:  Ru is best suited to a capable rider and would suit a junior, young rider or amateur adult looking for a competitive and genuine horse. He is a particularly appealing option for a rider wanting to progress through the ranks on a talented and experienced horse, while also being suitable for Thoroughbred classes.\n\nReason for sale:  Ru is offered for sale due to the owner saving to purchase a house. He is ideally suited to a confident and capable rider looking to continue his progression in showjumping and take advantage of his ability and experience. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777502306/horses/ziq163oo2j9pgaglgto2.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777502145/horses/bprvkbsmpzagvjuhwwbv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777502147/horses/ogcllrgtbe869izxvoqs.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777502149/horses/uzyoydmumy28tdxoj3xx.jpg}	{}	2026-04-29 22:37:27.208928	45000	45000	Black	\N	t	Schoolmaster	{Eventing}
107	478	Raywood Sultan	Australia	0	{Jumping}	{"",Unbroken}	{Warmblood}	0	16.1	164	Colt	Suntaro TZ	Skansen Whimsical	Welfenadel 	{}	AUD	November 2025 Bay Warmblood Colt\nExpected to mature over 16hh\nRaywood Sultan is a striking warmblood colt bred to excel in showjumping, dressage, and the show ring. With exceptional bloodlines and natural presence, Sully shows all the ingredients of a future competitive mount for a professional, ambitious amateur, or junior rider.\nSired by Suntaro TZ, a successful 1.20 showjumper and Novice training Elementary dressage competition stallion, carrying the renowned bloodlines of Sun and Fun, Sunny Boy, Sandro Hit, and Donnerhall. His Dam, Skansen Whimsical, by Welfenadel (a relative of Weltmeyer), also brings outstanding dressage and jumping heritage. Sully combines athleticism, movement and temperament, presenting as a serious all-round sport prospect with a bright future. He is bred to perform and shows great promise as a competitive mount.\nLocated Coomealla NSW. \n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777782040/horses/x3rgbkihcgi6aradgmtx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777782043/horses/iikexhlbpgjedwtysry3.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777782044/horses/hfbyhpsj1bx35bavjhtz.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777782183/horses/pr7njmztpzt86gi3r5ur.jpg}	{}	2026-05-03 04:25:06.450293	5000	10000	Bay	\N	t	Handled only	{Jumping,Dressage}
108	688	Oaks Charleville 	Australia	0	{Jumping}	{1.10m,1.20m}	{Warmblood}	14	17.1	174	Gelding	Charlemagne ego Z	Vedette s	Cassini I	{Schoolmaster,Sensitive,Scope,Honest,Careful}	AUD	Charlie has been there and done it all. Completed to World Cup level. Beautiful to ride, snaffle mouth, great canter. Not for a beginner as he can be cold backed- never bucks. Very sound and good on X-ray. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777844768/horses/fsfpgeeyqpngbs9hyvvg.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777844781/horses/zsd5jao1tumdrjwj6rnj.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777844785/horses/mxue1qy2yrjfgw4dq1ms.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777844787/horses/mn56dq6wbbuyqo9hxr23.jpg}	{}	2026-05-03 22:05:06.11401	40000	75000	Brown	1st caboolture WC mini Prix\nAustralia champs young rider team \n8th Shepparton WC 2023\n10th sale WC 2023\n5th Waratah WC Mini Prix 2023\n	t	High level of education	{}
86	92	Berringa Second Chance	Australia	0	{Jumping}	{Children}	{Other}	15	15.3	155	Gelding	Unknown			{Schoolmaster,Forward,Brave,Bold}	AUD	Asking price: $12k neg\nHeight: 15.3/16hh\nAge: 15\nBreed: Paint/Arab/SH/WB\nDiscipline: Showjumping, pony club/ adult rider club, pleasure/ trail riding\nRider suitability: Confident and capable - simply as he is forward with a decent jump\nLocation: Mt Evelyn, VIC\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\n104 point and shoot showjumper\nLoads of fun, willing and competitive\nSafe, sound and loves his humans!\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772588783/horses/pqyvmy0w3o7idglhv36d.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772588789/horses/v8ym9hkfnoaojwln6ubv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772588793/horses/t1idt8osrw10pfz0pvv5.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772588802/horses/p48jgamthgpc4lyvflti.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772588808/horses/fmujtwulssk1lxg6dmxk.jpg}	{}	2026-03-04 01:48:12.98439	10000	15000	Chestnut	Berringa Second Chance, affectionately known as “Chance,” is a fun, forward and experienced gelding who has been a much-loved partner for junior and adult riders alike. He has been ridden consistently by junior riders, competing at pony club and interschools, and has proven himself to be reliable, athletic and enjoyable. Chance’s sale presents an opportunity to purchase an established, well-educated horse who would thrive in a jumping-focused home and genuinely enjoys having a job.\n\nEducation, skills and experience: Chance is a well-educated horse who has spent the majority of his recent career focused on showjumping, with competition experience up to 105cm and schooling courses of 110–115cm. He is forgiving of rider errors, turns on a dime and is honest to a fence, offering automatic flying changes when jumping.\n\nOn the flat, Chance is capable and correctly educated, with leg yield, shoulder-in, walk-to-canter and canter-to-walk transitions established. He willingly works into a contact, has three good paces and is soft and light in the bridle. When jumps are present, he can become hotter and more forward, which is why he is best suited to a rider who enjoys a responsive showjumper or who has a flatwork arena without jumps in it.\n\nChance has also done extensive trail riding, low-level cross-country schooling, and is unbothered by traffic, farm machinery, livestock, dogs and general busy environments.\n\nGeneral demeanour under saddle: Under saddle, Chance is forward, willing and responsive. He is tolerant of rider mistakes, soft in the contact and enjoys being ridden. He is particularly fun to jump!\n\nCurrent workload / fitness: Chance is currently in regular work, being ridden five or more times per week. He enjoys frequent riding but does not require constant work to remain safe and reliable, and is generally the same horse day-to-day.\n\nHandling: Chance is straightforward and well mannered to handle. He is easy to catch, leads calmly, ties up without fuss and is tolerant of handler mistakes. He self-loads, travels quietly, unloads calmly and is easy to clip, wash, shoe and manage. He is reliable for both the farrier and vet.\n\nBehaviour: Chance is an affectionate and genuine horse who enjoys people and having a job. He can occasionally be a little looky in new environments but he is generally consistent and settles quickly with reassurance. Chance may neigh if separated from a companion when out and he did (with previous owners, 18 months ago and hasn’t happened with current owner) occasionally kick out in the canter transition - however, he still gets on with the job. He has no vices and is very safe at all times.\n\nFeeding and management: Chance is a very good doer and thrives on a high-fibre, low-starch diet. He is fed hay and hard feed twice daily due to limited pasture, and does best on a plain, grain-free regime. He can live in a herd or alone, but we don’t think he would not suit a fully stabled lifestyle. He is comfortable being yarded at shows provided he has company and access to hay.\n\nMedical history: Chance has no significant medical issues. He may snort or cough briefly at the beginning of rides, as many horses do. He has a small, old slab fracture to an upper molar, which his dentist is not concerned about. He has a few minor cosmetic scars and a very old splint, that do not affect him, and are very common. He is currently vaccinated for tetanus and strangles, with dental care up to date. A veterinary examination is welcome at the buyer’s expense.\n\nRider Suitability: Chance best suits a Capable Rider, who is confident riding forward and responsive horses. He has previously been ridden successfully by confident junior riders. Chance would not suit a nervous or passive rider, particularly when jumping. He thrives with a rider who enjoys a forward ride and allows him to move freely to a fence.\n\nReason for sale: Chance is offered for sale due to a change in personal circumstances. This is a regretful sale, and his owner is seeking a knowledgeable, caring home where he will be genuinely valued and enjoyed as someone’s “number one” horse.\n	t	\N	\N
43	196	Brookside Eldorado	Australia	\N	{Jumping}	{"Young Horse"}	{Warmblood}	0	\N	\N	Colt	Brookside Esperance	Akina Shiva	Balou Du Rouet	{Scope,Bold}	AUD	"Brookside Eldorado"\nChestnut colt 03/10/2025\nSire: Brookside Esperance (Emerald/Baluga/Vivant/Colman)\nDam: Akina Shiva (Balou Du Rouet/Collins)\n\nThis stunning, blingy colt is from the same Dam as the Donovans 1.5m jumper, Espionage, who is now owned by Gemma Creighton. Espionage's' sire is Emerald, making this beautiful colt a very close relative of a proven jumper.\n\nEldorado is correct, leggy and shows an easy, athletic and balanced canter. He is alreay jumping things in the paddock, and is a curious and social boy. This fabulous colt ticks all the boxes, and will be for sale to a competitive home.\n\nAll our horses come with registration, microchip, freezebrand, basic handling, and are regularly wormed, vaccinated, and seen by a farrier and vet. We raise our foals on Barastoc feeds, unlimited meadow hay, and in open grazing paddocks.\n\nInspection welcome	{https://res.cloudinary.com/dcorxaflu/image/upload/v1760670557/horses/heloyaw46sgcxicntf12.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1760670863/horses/aigy2mmfsr6akdy5rqxn.png}	{}	2025-10-17 03:17:40.179409	15000	20000	Chestnut	\N	f	\N	\N
97	92	Manetheren Arkenstone	Australia	\N	{Jumping}	{Amateur}	{"Warmblood Cross"}	13	16.3	166	Gelding	Manetheren Arkenstone	Palace Charm	Palace Music	{Honest,Schoolmaster,Calm}	AUD	Asking price: $37k neg\nHeight: 16.3hh\nAge: 13\nBreed: WB x\nManetheren Aragorn x Palace Charm\nDiscipline: dressage/ showing, eventing, showjumping\nRider suitability: Capable rider\nLocation: Camden, NSW\nPlease see Owner’s Response Certificate for more information via the PHS website.\n\nHighlights\nSafe, sound and straightforward\nWell educated on the flat and willing to collect\nWilling and brave showjumping and cross country\nCompetitive but happily adjusts to rider confidence and confidence\n\nSignificant Results\nSSJC 1m – 2nd place, 2025\nSSJC 1m – 5th place, 2025\nPreviously competed to 120cm with a prior owner\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1773888639/horses/yqyprzak8i1dzbuwx4mi.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773888658/horses/xynfttntydsw3qz9e2hg.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773888663/horses/l5lz62kh8d5drhhk69t5.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773888668/horses/j7aoh0hk0g3omngmmp5p.jpg}	{}	2026-03-19 02:55:05.330916	35000	40000	Palomino	Introduction: Manetheren Arkenstone, affectionately known as “Jinx,” is a 13-year-old 16.3hh palomino Warmblood x Thoroughbred gelding located in Camden, NSW. He is EA registered and beautifully bred by Manetheren Aragorn out of Palace Charm. Jinx is a genuine, much-loved horse with a kind nature who enjoys being around people and other animals, and he is offered for sale to the very best of homes as his owner moves on to producing a young horse.\n\nEducation, Skills & Experience: Jinx is a well-educated horse with established flatwork including leg yields, shoulder-in and quality transitions, along with three balanced and comfortable paces. He has extensive competition experience, competing successfully at agricultural shows, events at SIEC, showjumping days, dressage days and cross country clinics, and has also been exposed to pony club, eventing, horse trials, mustering and polocrosse with a previous owner. He has placed up to 1m with his current rider and previously competed to 120cm, and is currently training around 110cm at home. Jinx is confident on cross country and careful in the showjumping ring, making him a versatile and competitive mount.\n\nTemperament & Rideability: Jinx is a willing, responsive and kind horse who always tries to please and look after his rider. He is very well mannered under saddle and adapts to the rider’s level, stepping up with more experienced riders while remaining tolerant of mistakes. He is responsive off the leg and very sensible. If something major happens, like a kangaroo jumping out in front of him, he may move slowly away from it. He has no vices at all - he does not spook, spin, bolt or rear. He is a safe, confidence-giving and enjoyable ride.\n\nRider Suitability: Jinx is best suited to an intermediate rider or above, defined as someone with at least three years of consistent riding and competition experience who has an independent seat and balanced position. He would suit a junior rider, young rider or amateur adult, as well as a mature rider looking for a quality, experienced horse. He is an excellent option for riders wanting a genuine schoolmaster type to progress in eventing or showjumping.\n\nHandling & Ground Manners: Jinx is easy to handle and well mannered on the ground. He is easy to catch, leads calmly, ties up without fuss and is straightforward for clipping, washing, the farrier and the vet. He loads and travels well and is tolerant of handler mistakes, although due to his size he benefits from a confident handler. He is a kind, sensible horse to have around the stable or paddock and is easy to manage day to day.\n\nFeeding & Management: Jinx performs best on a higher performance diet when in full work, although his energy levels are easily managed and he can be “fed down” to a simple hay or grass diet when not in heavy work. He can be kept in a herd or paddocked alone and adapts well to different management systems. He is happy to be stabled at competitions or for short periods but would not be suited to full-time stabling.\n\nVeterinary & Care: Jinx does not have any issues that affect performance. His vaccinations are up to date as of September 2025, his dental was completed in September 2025 and he is currently shod. Past vet checks are available, and a vet check can be conducted at the buyer’s expense, with the owner open to negotiation should any unexpected findings arise.\n\nReason for Sale: Jinx is a much-loved member of the family and is only offered for sale as his owner is focusing on bringing on a young horse. This is not a decision made lightly, and finding the right home is the highest priority.\n\nSummary: Jinx is a genuine, experienced and versatile performance horse with the ability to excel across eventing and showjumping while also being enjoyable for general riding and trail work. He would suit a rider looking for a safe, capable and competitive partner, whether that be a young rider wanting to step up the levels or an adult amateur seeking a quality allrounder. He is offered to a knowledgeable home that will value his temperament, experience and willingness, and provide him with an enjoyable life.\n	t	Well educated	\N
82	92	Black Layce	Australia	0	{Jumping}	{Children}	{"Stock Horse X"}	14	14	142	Mare	Not Specified			{Schoolmaster,Brave,Bold,Honest}	AUD	Asking price: $30k neg\nHeight: 14hh\nAge: 14\nBreed: ASH x RP\nRegistrations: EA\nDiscipline: Eventing, showjumping, pony club/ adult rider club, pleasure/ trail riding, dressage/ showing\nRider suitability: Novice\nLocation: Warrandyte, VIC\nPlease see the Owner’s Response Certificate for more information.\n\nHighlights\nSafe, sound and straightforward enough for a novice 10-12 year old rider\nWell educated on the flat and willing to collect\nWilling and brave showjumping and cross country\nCompetitive but happily adjusts to rider confidence and confidence\n\nSignificant Results\n2025 Australian Champion\n2025 Victorian State Champion\n2025 National Champion Pony Club\n2024 National  Reserve Champion Interschools\n2023 National Champion Interschools\nAll showjumping 70-90cm\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772585695/horses/tly6j2gwrss6ptqvjvwa.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585702/horses/cez4hjr8mor8gzikvrue.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585707/horses/bcjy984dvseaboxxe5uv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585713/horses/cqhszhgop3yzm0liq8j5.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585718/horses/rstltcdisqywdwysmtce.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585726/horses/rjxbi3ly9qw3kl6g5zoy.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585731/horses/hd9jb0dvkfcinjrtjy7d.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585735/horses/p6ringq51vldbgks6xse.jpg}	{}	2026-03-04 00:56:38.21138	25000	30000	Black	Introduction: Layce is the ultimate competitive showjumper schoolmaster. She is a delight to ride, handle and compete. Layce has been a National Champion showjumper for her last two junior riders - from the tender age of 10 - and has many years left to continue this legacy with a new best friend.\n\nWith Layce’s owner very sadly having outgrown her, this sale presents an opportunity for another young rider to benefit from Layce’s talent and kindness - she will step back down for her next rider while they develop their partnership.\n\nEducation, riding and experience: Layce is well established on the flat and would be competent to compete at preliminary level dressage. She is responsive and willing, making her rideable, adjustable and competitive on course.\n\nLayce is competing 70–90cm with 95cm jump-offs. She is honest, trustworthy and brave, consistently careful around the course — the kind of scope and technique that builds confidence for a developing rider. Layce has schooled cross-country and is brave and calm. She enjoys trail riding and spending time with her person.\n\nLayce is a true ‘junior’s schoolmaster’ — tolerant of rider mistakes and always aiming to please. She enjoys her job and will be more forward when asked, but is always 100% safe. Layce is proven to ‘come back’ and ‘go slow’ when asked to or for a less experienced rider. She is currently in work and competing.\n\nHandling: Layce is patient and well-mannered on the ground for rugging, washing and shoeing. She is great for the farrier and easy to load, travel and unload in either a float or truck. She loves cuddles and affection. She does require a patient and calm vet and clipper.\n\nBehaviour: Layce has travelled all over the country and is happy in big city and large show environments. She travels well — loads and unloads without fuss and eats and drinks well when away from home.\n\n\nLayce is sensible and reliable to ride and handle. She has no vices under-saddle or on the ground. When fresh - overfed or after a spell - she can be a bit looky or spooky and may bunny-hop if a rider becomes tense, but she remains consistently safe and trustworthy.\n\nFeeding and management: Layce is fed a simple diet of chaff, CEN grain free and hay. She is easy to manage and can be stabled or paddocked alone or in a herd but does require a companion in sight.\n\nMedical history: Layce does not have any medical issues\n\nRider suitability: Layce would suit a calm, balanced rider seeking a safe, straightforward and competitive pony. She was her rider’s first proper performance horse and stepped back down beautifully into that roll. We know that she will do the same for her next rider.\n\nReason for sale: Layce is very sadly for sale due to her owner outgrowing her.\n	t		\N
96	92	Diplomatic Grace	Australia	\N	{Eventing}	{EvA80}	{Thoroughbred}	13	15.2	154	Mare	Monaco COnsul			{Honest}	AUD	Asking price: $8k\nHeight: 15.2hh\nAge: 13\nBreed: TB\nDiscipline: Eventing, showjumping, pony club/ adult rider club, pleasure/ trail riding, dressage/ showing\nRider suitability: Capable and confident however she has ‘no dirt’ or vices\nLocation: Reidsdale, 2622\n\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nSafe, sound and kind\n80-90cm showjumping\nEVA60-80 eventing\nNovice dressage\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1773460444/horses/ipiouheqz3zu0vqgt4ss.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773460445/horses/zs43ciotiovjfzglxkz8.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773460447/horses/igghdfc7cjrwfaomrope.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773460453/horses/ghsrvr53bt1omudidiru.jpg}	{}	2026-03-14 03:55:40.611461	5000	10000	Bay	Introduction: Diplomatic Grace, affectionately known as ‘Gracie’, is a lovely 13-year-old 15.2hh bay TB mare. She has been with her current owner for the past 18 months and during this time she has enjoyed a varied life including showjumping, eventing, pony club activities and trail riding. She is a kind, willing mare who enjoys having a job and thrives with a confident rider.\n\nEducation, Skills & Experience: Gracie is established in her basic flatwork and jumping education and has begun some lateral work, continuing to improve with consistent riding. Her canter is adjustable and becoming more uphill, her walk is relaxed on a loose rein, and while her trot can occasionally become tense it is improving.\n\nGracie is an honest and enjoyable jumper. She has competed around 80cm SJ and EVA60 with her current rider and training around 95cm. With her previous owner, Gracie competed 90cm showjumping, EVA80 eventing and Novice dressage.\n\nGracie has attended pony club camps including Pony Club State Camp at SIEC, confidently completed stockman’s challenge obstacles and happily rides through water crossings, dams and on trails.\n\nTemperament & Rideability: Gracie is a kind mare who goes best with a rider who has independent hands and a balanced seat. She is forward and responsive and is generally sensible unless something significant occurs.\n\nShe can occasionally become horse shy when standing still in busy warm-up areas due to a previous incident but relaxes once given space. She may also become tense in the dressage arena if the rider becomes nervous, but improves greatly with a calm and confident rider who supports her through those moments.\n\nRider Suitability: Gracie is best suited to a capable rider who has at least five years of riding and competition experience and who can ride with a soft, consistent contact. A confident novice to intermediate rider could also enjoy her in a lower pressure home focused on pleasure riding, pony club or jumping rather than competitive dressage. She would suit a junior rider, young rider or amateur adult working under regular professional instruction.\n\nHandling & Ground Manners: Gracie has good ground manners and is respectful to handle. She leads calmly, ties up well and lunges quietly, and is reliable for the farrier and good for the vet. She is usually easy to catch and generally loads well on the float, occasionally taking a few minutes depending on the handler. She can pull faces when the girth is done up but she is tolerant of handler mistakes and straightforward to manage day to day.\n\nFeeding & Management: Gracie currently lives on grass only. She is given hay before riding. During winter or when pasture quality drops she benefits from additional feeding such as lucerne chaff and pellets. She is paddocked 24/7 and happiest living out, although she can be stabled overnight or at competitions. She lives well in a herd but can also live alone provided another horse is within sight.\n\nVeterinary & Care: Gracie does not have any issues that affect her performance or rideability. Past veterinary reports and X-rays are available and a vet check can be arranged at the buyer’s expense - please see the Owner’s Response Certificate in her Portfolio. Her vaccinations for Tetanus and Strangles are up to date as of March 2026, her teeth were last done in January 2026 and she is currently shod. \n\nReason for Sale: This is a very difficult sale for her owner. They feel their riding confidence, particularly in dressage, does not allow Gracie to work at her most relaxed and happy, and they are also looking to move to a smaller horse.\n\nSummary: Gracie is a kind, willing and versatile mare who enjoys a varied lifestyle including jumping, eventing, pony club and trail riding. She has proven competition experience and offers an honest, fun ride for a confident rider. The ideal home would love her as much as her current owner does. The seller would appreciate occasional updates as Gracie settles into her new home.	t	Basic education	\N
109	92	Widgee Total Sunrise	Australia	\N	{Dressage}	{Unbroken}	{Warmblood}	2	16.2	165	Gelding	Widgee Total Eclipse	Silhouette		{}	AUD	Widgee Total Sunrise\nProudly presented by Performance Horse Sales AU NZ\nAll enquiries to PHS on +61428239317\n\nAsking price: $15k\nHeight: to mature 16.2hh\nAge: 2\nGender: gelding\nColour: chestnut\nBreed: Warmblood\nDiscipline: dressage/ showing, eventing, showjumping\nRider suitability: Not yet under saddle\nLocation: Exeter, NSW\n\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nLovely temperament\nExcellent conformation\nBred to exceed in any of the Olympic disciplines\nHealthy, sane and sound\n\nIntroduction: Widgee Total Sunrise aka Spencer is a 2-year-old chestnut Warmblood gelding by Advanced Dressage Stallion - Widgee Total Eclipse - out of Silhouette, expected to mature around 16.2hh. Located in Exeter, NSW, he is a striking young horse with plenty of presence and is showing early signs of athletic potential for a future in dressage, showjumping or eventing. He presents as a well-handled young prospect with a trainable temperament and quality breeding.\n\nEducation, skills and experience: Spencer has been handled only to date and is ready to be slowly started under saddle. He has been floated multiple times and leads confidently, with a solid foundation of basic handling for his age. While he has not yet commenced ridden work, he presents as a blank canvas for someone looking to produce a quality young horse for an English discipline.\n\nGeneral demeanour under saddle: Spencer is not yet under saddle, however he is described as level-headed, trainable and straightforward to work with. He has no known vices or quirks and appears to have the temperament to progress well with correct education.\n\nCurrent workload / fitness: As a two-year-old, Spencer is not currently in work and has not yet commenced ridden training.\n\nHandling: Spencer is well mannered on the ground and leads calmly and willingly. He has not been clipped and can occasionally be tricky to catch, however he is easily caught with food and is straightforward once a halter is on.\n\nBehaviour: Spencer has no known behavioural issues or quirks and presents as a sensible young horse with a willing attitude.\n\nFeeding and management: Spencer currently lives on grass only and can be managed in a herd environment. His day-to-day management requirements are straightforward.\n\nMedical history: Spencer has no past or present medical issues. He was last vaccinated on 1 May 2026 for tetanus and Hendra, had his dental completed on 1 February 2025 and is currently barefoot. A vet check is welcome at the buyer’s expense.\n\nRider Suitability: Spencer is best suited to an experienced rider or home with access to professional training, as he is still unstarted and will require further education. Once broken in, he may suit a young rider, amateur adult or mature rider.\n\nReason for sale: Spencer is offered for sale due to financial reasons and lack of time for two horses. His owners are seeking a capable long-term home where he can be professionally started, educated and given the opportunity to reach his potential.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777885809/horses/zkve6gmtwaxzpnzywapx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777885811/horses/yrty7whykwk1ms925sfy.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777885814/horses/crlwtht5xgws6hieuctq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777885816/horses/ws1zqd4qafqkj4oabix4.jpg}	{}	2026-05-04 09:11:41.375804	15000	15000	Chestnut	\N	t	Handled only	{Eventing,Jumping}
47	196	Brookside Clovelly	Australia	\N	{Jumping}	{"Young Horse"}	{Warmblood}	2	16.1	164	Filly	Diamond B Chinook	Oaks Trick or Treat	Vivant	{Calm,Brave,Scope,Bold}	AUD	"Brookside Clovelly" 2023 Bay Filly\n\nBranded, Microchip, AWHA Rego, Farrier, Vacx, Wormed, Floats, Ties\n\nSire: Diamond B Chinook (Contendro I/Vivant/Pro Ratio)\nThis beautiful young stallion is showing scope and quality, and brings together some beautiful lines for both jumping and eventing.\n\nDam: Oaks Trick or Treat (Vivant/Treat) AKA "Minimouse CMB"\nThe full sister of the world cup jumper in WA, Maximouse CMB, Mini is a wonderful producer of fantastic, correct foals, with wonderful temperaments.\n\nClovelly is a superb quality filly, with an absolutely brilliant temperament. She will suit a wide variety of homes and sporting pursuits, as well as being a wonderful future breeding prospect.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1760672952/horses/lwiqciswqbsne5tq9hn1.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1760672957/horses/rh9rsf7733kcsx2h6ktt.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1760672964/horses/vnfd0uoxncpon2fwqghl.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1760672968/horses/rkwcvgchleanvfd5h8rh.png}	{}	2025-10-17 03:49:44.882452	15000	20000	Bay	\N	f	\N	\N
48	242	Fillies Syrah 	Australia	\N	{Eventing}	{EvA60}	{Warmblood}	10	16	163	Mare	Capone	Mataiva Realtime	Rubin magic	{Calm,Brave}	AUD	Why wait for next season, when you can have it right now? Due December 2025 \n\nFillies Syrah (Capone/ Caprilli/ Calyspo 1/ Ruben Magic/ Rubinstein 1) \n16.0hh \n10 years old \nWarmblood mare IN FOAL to Brookside Esperance (Emerald /Baluga /Vivant /Colthaga) \n\nSyrah is due December 2025\n\nAbout Syrah \n- easy to do everything with, self loads, etc\n- easy breeder\n- sound to ride\n- excellent temperament \n- great doer, recent photos from last week \n\nThis foal will be a super jumper/ eventer prospect! Save yourself doing all the vet work and buy a great horse that’s ready to foal, 2 for 1 deal.\n\nSerious enquires only\n$12🥕🥕🥕 \n\nLocated Adelaide Hills, South Australia\n\n⭐️ TRANSPORT OPTIONS AVAILABLE \n\n⭐️ SALE PRICE INCLUDES A FREE SERVICE FEE TO Brookside Clarendon	{https://res.cloudinary.com/dcorxaflu/image/upload/v1760914029/horses/bbqmpv8pf15gwlzitpdn.jpg}	{}	2025-10-19 22:50:42.450768	5000	15000	Chestnut	Up to date with everything, vaccines, teeth, etc 	f	\N	\N
81	92	KTL Icon	Australia	0	{Jumping}	{"Not Applicable"}	{Warmblood}	7	17	173	Gelding	Yalambis Incognito	Slingshot		{Scope,Honest,Brave}	AUD	Height: 17hh\nAge: 7\nBreed: Australian Warmblood (Yalambi’s Incognito x Sling Shot [imp])\nRegistrations: ACE, EA\nDiscipline: Showjumping, dressage/ showing, eventing\nLocation: Yellingbo, Victoria\nRider suitability: Capable Rider (under regular professional instruction)\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nEstablished education with competition experience\nKind, sensible and sound\nLightly campaigned as age appropriate\nSchooled XC, training 115 showjumping, and Novice Dressage\n\nResults\nDressage scores of up to 8s at Novice level\n8th place – 1.04m Boneo Showjumping, January 2025\n3rd place – 95cm Boneo Showjumping, August 2025	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772585413/horses/ykj9bbarrkvvztzda5hw.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585423/horses/syiwm7tgzdzkswqimbbn.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585428/horses/gofjtm7keoxgd4zh30l5.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585434/horses/u9ac2hxyt211uhy6odpb.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585444/horses/t6pkn1wbthfhavco9uhk.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772585455/horses/wngmxr4uonsmbkx99pca.jpg}	{}	2026-03-04 00:51:35.78481	15000	20000	Bay	Introduction: KTL Icon is an impressive 7-year-old Australian Warmblood gelding standing at 17hh, combining size, presence and a kind, trainable nature. By Yalambi’s Incognito out of the imported mare Sling Shot, Icon offers established education and genuine versatility across showjumping and dressage. He has been produced with care and given time to mature. He is now ready for a capable rider and home to continue his development.\n\nEducation, skills and experience: Icon has an established level of education and is well schooled on the flat and over fences. He has been exposed to a wide range of environments and activities, including trail riding and low-level cross country schooling, and is sensible and confident in new situations. He is safe for novices under instruction and is currently in consistent work, ridden five or more times per week.\n\nIcon is soft and light in the bridle and willingly puts in as much effort as asked of him. He has a correct foundation and shows promise in dressage - with flying changes and laterals established. Due to his size and stage of development, he does need to be ridden correctly to achieve consistent collection and contact. However, he is tolerant of rider mistakes and continues to improve each ride. Icon has competed in Preliminary  and Novice dressage and scored up to 8's for  his movement. \n\nShowjumping: Icon has competed successfully in showjumping. He is currently training 1.15m and  ready to step up to 1.10m with plenty of scope  to continue up the heights. He has also been  jumped at home by novice and smaller riders who have found him very straightforward. \n\nIcon is super brave, doesn't care about fill and is forgiving - he will tackle any jump even with a miss - of which he's had plenty! He has never had a stop! Icon is adjustable, light in the bridge and responsive. These attributes give his rider LOADS of  confidence around a course.\n\nGeneral demeanor under saddle: Icon is generally calm, reliable and willing to work. He is tolerant of rider mistakes and is not worried about ‘atmosphere’. \n\nCurrent workload/ fitness: Icon is currently in work five or more days per week. He does not require constant riding to remain safe and reliable but benefits from consistent work and management.\n\nHandling and general behaviour: Icon is very easy to handle. He is easy to catch, well mannered on the ground, leads calmly, ties up happily and loads and travels extremely well. He is easy to clip, wash, and is reliable for the farrier and vet. He is tolerant of handler mistakes and is straightforward to manage in busy environments.\nWhen fresh, particularly if overfed, underworked and something major happens - Icon can be reactive - however, these behaviours are not malicious and are prevented with appropriate feeding and regular work. Please see owner’s response document for more information.\n\nFeeding and management: Icon is a good doer and feed sensitive. His diet is carefully managed depending on workload and pasture availability. He often requires little to no hard feed, with grass hay sufficing. When in heavier work, he may receive a small amount of Easi Response to support energy levels. \n\nMedical history: Past X-rays are available. He is up to date with vaccinations (May 2025), dental (May 2025) and farrier work. Pre sale vet check on the 22.1.26 is in portfolio - Icon was declared to be sound on straight line, lunge and no pain response was elicited from flexion tests. Vet checks are welcome at the buyer’s expense.\n\nRider Suitability: Capable Rider defined as someone who has been riding and competing regularly for at least five years, with independent hands and a balanced seat. Icon would suit:\nA capable and confident junior rider (under 18) with support\nA young rider (18–24)\nAn amateur adult or mature rider\nRegular professional instruction is recommended to continue his development. He would not suit a nervous or novice rider due to his size and age.\n\nReason for sale: Offered for sale as part of a breeder’s program, with most horses being routinely marketed.\nIdeal home: A loving, knowledgeable home with a capable rider who will continue to develop Icon and appreciate his kind nature, versatility and quality.\n	t		\N
105	92	Drumeden Serenade	Australia	0	{Dressage}	{Novice}	{Other}	9	13	132	Mare	Beckwith Command 'N'  Conquer	Willowcroft China Doll		{}	AUD	Asking price: $25k which includes all her gear - fitted saddle,  bridles/bits, rugs and false tail.\nHeight: 13hh\nAge: 9\nGender: mare\nColour: bay\nBreed: Riding Pony \nBeckwith Command 'N'  Conquer x Willowcroft China Doll\nDiscipline: dressage/ showing, pony club/ adult rider club\nRider suitability: Intermediate rider with 3 years riding experience\nLocation: Kitchener, NSW\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nSafe, calm and unflappable to ride and handle\nWilling, responsive and automatically ‘collects’\nCompeted safely and willingly at Sydney Royal\nNo lunging, no workdown and no ear plugs\nFree of vices, quirks, medical and management issues\n\nIntroduction: Drumeden Serenade, known as Serena, is a 9-year-old bay Riding Pony mare standing approximately 13hh. By Beckworth Command ‘n’ Conquer out of Willowcroft China Doll, she is a registered Riding Pony and is also registered Part Welsh, Arabian Riding Pony and Saddle Pony. Located in Kitchener, NSW, she is a well-educated, experienced pony with a strong record in showing and dressage.\n\nEducation, skills and experience:  Serena has an established level of education and is currently training novice level dressage, including shoulder-in, leg yield and walk to canter. She has competed very successfully locally and qualified and competed at Sydney Royal Easter Show. She has also undertaken low-level jump and cross country schooling, trail riding and beach outings, and is highly exposed to a variety of environments including busy roads, farm life, livestock, dogs and busy stabling situations.\n\nGeneral demeanour under saddle: Under saddle, Serena is a very quiet, willing and responsive pony who is soft and light in the bridle and willingly collects. She is tolerant of rider mistakes, non-reactive and unflappable, making her a safe and confidence-inspiring ride. She works well off seat aids, requiring minimal leg, with excellent brakes and a soft snaffle mouth. Like any educated pony, she does appreciate consistent contact on the reins. \n\nCurrent workload / fitness:  Serena is currently in work and is being ridden three or more times per week while actively competing. She does not require regular riding to remain safe and is suitable to hop straight on after a spell.\n\nHandling:  Serena is unflappable, calm and extremely easy to handle. She is easy to catch, well mannered on the ground, leads quietly and ties up without fuss. She loads and travels well, stands quietly, unloads calmly and is easy to clip, wash and manage. She is reliable for the farrier and good for the vet, and is tolerant of handler mistakes.\n\nBehaviour:  Serena is free from vices or behavioural quirks. She may occasionally look at a puddle and walk around it but she won’t look at anything else! She always remains calm and manageable, with no spook or shy. She is a kind, genuine pony both in and out of work. She is reliable, sensible and well accustomed to a variety of environments, making her a straightforward pony to own and manage. \n\nFeeding and management:  Serena is currently fed CEN CF50, lupins, CEN oil and lucerne chaff, along with Rhodes and lucerne hay. Her management is flexible, and she can be kept in a herd, on her own or in a combination of stabling and paddock environments, including full-time stabling if required.\n\nMedical history:  Serena has no past or present medical issues, injuries or medication requirements. She had her dental completed on 30 January 2026 and is currently barefoot. She is vaccinated for tetanus and strangles. A vet check is welcome at the buyer’s expense.\n\nRider Suitability:  Serena is best suited to an intermediate rider with three years regular riding experience. She would suit a confident child, junior, young rider or even a mature rider looking for a safe and educated pony. She is also suitable for novices under instruction and has proven to be safe for child riders, making her a versatile option across a range of rider levels.\n\nReason for sale:  Serena is offered for sale due to her rider being sadly outgrown - she has been owned and loved by her family for six years. She is ideally suited to a dressage or show home where her education, temperament and competition experience can continue to be developed and enjoyed.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1777502461/horses/zmbfkzwmr4xiij1jqg2l.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777502456/horses/jtaisnpcecj7fdeypjci.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777502457/horses/utlmzice6mizbj9o14ty.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777502459/horses/ulufwqrsuhwlhbl9bigs.jpg}	{}	2026-04-29 22:42:59.026901	25000	25000	Bay	\N	t	Well educated	{}
49	116	Wolf Xtreme	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	6	17.1	174	Gelding	Numero Uno Xtreme	Calypso Xtreme	Corofino II	{Scope,Brave,Honest,Bold}	NZD	Schooling with ease up to 1.25m and ready to commence his competition career, Wolf is a serious horse for the future.\n\nAn exceptional young horse with the X-Factor!!\n\nCombining talent, temperament and ridability, we have no doubt that this boy has a very bright future, with potential to dominate on the international circuit.\n\nHe is well established on the flat, with elevated and powerful movement. He would look rught at home in a dressage arena.\nHe has the most incredible scopey jump, with an excellent technique making everything look effortless. \n\nThe gentleman of the team, he was such an incredible temperament. He is bave, sensible, uncomplicated and great ride-ability. \n\nThis boy is quality and a serious horse for someone wanting a competitive youngster to bring through the grades. \n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1761130266/horses/pf3ppzswozbehzws8rfp.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761130323/horses/rgwwu0nqfbtnmz6kwmho.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761130363/horses/sdrkme4qixlmydnbkplx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761130467/horses/djkjsuqpt4cc6mg6ndix.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761130547/horses/oybztrzrhcjyacjdbsc8.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761130635/horses/v4z0hxxzbdpyqjmdgthq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761130707/horses/gkxjnydytblhf8laohol.jpg}	{}	2025-10-22 10:50:28.890347	80000	100000	Bay	\N	f	\N	\N
95	658	KTL D'Artagnan	Australia	0	{Jumping}	{Unbroken}	{Warmblood}	0	17	173	Colt	Diablue PS	Cera Mrs Ed	Catoki 	{}	AUD	Stunning chestnut colt by Diablue PS out of Cera Mrs Ed (Catoki x Colman). EMH 17hh. He will be a top jumper and makes an exciting stallion prospect.\n\nThis boy has exceptional breeding being by the exciting stallion Diablue PS. His dam, Cera Mrs Ed, is by the legendary Catoki out of Cera Chiraz who is sister to three licensed stallions, full sister to one in Europe; L.B. Crumble (jumping 1.55m with Christina Liebherr).\n\nFred has a fantastic temperament. He floats, leads, ties up and has his feet done regularly. He is an energetic but respectful young horse. Due to be weaned end of May 2026.\n\nhttps://www.horsetelex.com/horses/pedigree/2744779/ktl-d-artagnan	{https://res.cloudinary.com/dcorxaflu/image/upload/v1773097823/horses/wp3ywskbw9crghpmm394.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773097883/horses/en4dg73gdh4fkiysexpe.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1773097909/horses/aguwrjmqnlsgjdlccxwi.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1774299787/horses/i0zpooqz1dftvjj7psie.jpg}	{https://res.cloudinary.com/dcorxaflu/video/upload/v1772695583/horses/zxz8eykgwsm77z8mua7k.mp4}	2026-03-05 07:32:40.162415	30000	35000	Chestnut	DOB 3/12/2025	t	Handled only	\N
54	294	Fielding’s King Arthur	Australia	\N	{Eventing}	{"Not Applicable"}	{Other}	2	\N	\N	Gelding	Cushavon Tiernan Ri	Sweet Sophia	Artie Schiller	{Brave,Honest,Calm}	AUD	Born 30 October 2023, Fielding’s King Arthur is a beautifully bred young Irish Sport Horse gelding combining substance, scope and temperament.\nBy the Registered Irish Draught stallion Cushavon Tiernan Ri (RID) from a quality Thoroughbred mare - Sweet Sophia (by Artie Schiller (USA)), Arthur offers the proven cross of Irish bone and Thoroughbred blood, bred to excel in any English discipline.\nArthur has been professionally handled from birth and completed his first season of show preparation (May-Sept 2025). \n \nArthur Walks and trots in hand correctly. Clips, bathes, plaits, rugs, sprays and floats. Stands quietly in the wash bay, breezeway and next to the float.\nArthur has attended two outings - led classes; winning Champion, first and second place ribbons against seasoned competition. He was praised for his manners, presence and correct Irish type.\nCurrently enjoying a short break after his show prep at Cushavon Park, an ideal time for a new home to step in and continue his development.\nArthur represents a rare opportunity to secure a correctly bred, well-handled young Irish Sport Horse gelding with the temperament, manners and type to shine.\nWhile he would excel in a variety of disciplines, we would especially love to see him go to a dedicated eventing home where his natural balance, bravery and brain can be developed to his full potential. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1762495699/horses/mr3ujkulpsnasoubxw6u.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1762495714/horses/qgxrllrxkuv7nuqsejpy.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1762495777/horses/cedrw10otgercaqwdy7l.jpg}	{}	2025-11-07 06:11:26.911395	15000	20000	Bay	DNA typed and registered with IDSHS	f	\N	\N
53	116	Sharkie Xtreme	New Zealand	0	{Eventing}	{"Young Horse"}	{Warmblood}	5	16.3	166	Gelding	Numero Uno Xtreme	Tharness Xtreme	Thano	{Brave,Honest,Bold}	NZD	Sharkie Xtreme\n5yo Gelding\nBy Numero Uno Xtreme and out of Thaness Xtreme (Thano XX)\n\nSharkie is a world class youngster with a very exciting futurue ahead of him. The definiation of class, he is wonderfully put together, athletic and uphill.\n\nWith a 'look at me' presence, he has beautiful big movement with an uphill carriage. He is balanced with naturual power and engagement. \n\nHe has proven to have an impressive jump with a fabulous technique over the fence, showing his quality and class. \n\nComplimenting his ability, Sharkie has a sweet gentleman like temperament. He is a very level headed horse that is sensible with great trainability. He is a joy to have on the team in every aspect, on the ground and under saddle. \n\nIf you're looking for a serious horse for the future, please get in touch!\n\n- Half brother to Cash Xtreme (3* Eventer in NZ)\n\nMore of his and his families information can be found on our website. \n\nWe are located only 1 hour from Wellington International Airport, making it a quick and easy trip to pop over to meet him. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1761699288/horses/ybbmtodpwkrijbqegkau.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761699425/horses/obngmackispsmmjjpavl.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761700792/horses/zte6uzlu4kdsgnoo2gtr.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761702297/horses/cqnxm88haufltkmiid9v.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761702741/horses/z5jwma3jluluydqyedzc.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761702822/horses/dfzwuycb3ifefx8ix9n3.jpg}	{}	2025-10-29 01:53:51.837176	70000	80000	Bay	\N	f	\N	\N
52	116	Vixen Xtreme	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	6	16.3	166	Mare	Numero Uno Xtreme	Viva OL Xtreme	Copabella Visage	{Careful,Scope,Brave}	NZD	Vixen Xtreme\n6yo Mare\nBy Numero Uno Xtreme and out of Viva Ol Xtreme (Copabella Visage)\n\nA mare with international quality! Vixen Xtreme is a serious future horse for a capable rider with big aspirations.\n\nA perfect example of the modern day sport horse, Vixen is a combination of great breeding, abiltiy, scope, trainability and athleticism.  \n\nShe goes beautifully on the flat, showcasing her impressive uphill movement and natural rhythm. \n\nSpectacular over a fence, Vixen has been bred to jump and she's proving to be a very serious horse for the future with her technique and scope. She is careful whilst being brave, adjustable and and has so much quality!  \n\nShe is the half sister to Vision Xtreme who is recently sold to Australia.\n\nThis is an exciting opportunity to purchase a mare of this calibre and quality. \n\nWe are located about an hour from Wellington International Airport. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1761698010/horses/k9eluei4wsctiijotmbn.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761697638/horses/ykb9cnfwfqtlcavwibti.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761697372/horses/tup567fj2jhorjx0jaya.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761697397/horses/gyv2hai2edxdaff06tmt.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761697532/horses/u472uwlmuiuzvxmytmu5.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761697572/horses/itqnbntaansyf8h8oc24.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1761697951/horses/o5bi9rzvxcyt3yqquelt.jpg}	{https://res.cloudinary.com/dcorxaflu/video/upload/v1761698413/horses/m1ivvvw827oquaklvbvu.mp4}	2025-10-29 00:35:21.308296	150000	200000	Grey	\N	f	\N	\N
56	116	Hawk Xtreme	New Zealand	0	{Eventing}	{"Young Horse"}	{Warmblood}	5	16.3	166	Gelding	Numero Uno Xtreme	Hilux Xtreme	Corofino II	{Brave,Bold,Honest}	NZD	Introducing Hawk Xtreme, an outstanding 5yo that ticks all the boxes!\n\nIf you're looking for a quality youngster to add to your team, whether you're wanting to Event, Show Jump or are looking for a reliable all-rounder, this could be your boy! \n\nOffered for sale by his breeder, Hawk has been purposely bred and professionally produced at Xtreme Sport Horses and his ready for his next chapter. Hawk is a stand out! He is beautifully put together, straight and an uphill type with a stamp of elegance. \n\nHe has received an excellent foundation in his ridden career, being broken in as a 4yo and slowly produced by our team of professional riders. \nHe produces beautiful work on the flat with a natural up hill carriage, showcasing his stunning movement and athleticism. \nHe has had a very positive start to his jumping, is very brave and uncomplicated, with a great technique and impressive jump both over show jumps and XC fences. \n\nThis boys temperament cannot be faulted! He is a kind and genuine boy that really tries his best to please and just loves his job! He is a gem to have in the team and will be a pleasure to produce through the grades. \n\nLocated in NZ, 1 hr north of Wellington International Airport\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1765241048/horses/oaqkfeoidzllvqnnvngx.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241076/horses/uflwk5tfnpqmrpffkx8g.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241083/horses/hnfdk08axk7fczc6lzjm.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241127/horses/oi2tszht0zi752yizzqr.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241146/horses/otagqhxsbsrjwc5s1kr4.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241156/horses/xb3lysealhqgkpld11xv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241166/horses/fvha4vxpemebbqnxojgd.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241175/horses/hptjmosaxtyynxt6zi7n.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765241248/horses/sf90nxhjfrosq6jelki8.jpg}	{}	2025-12-09 01:10:27.99691	70000	80000	Bay	\N	f	\N	\N
61	92	DP Easter Island	Australia	\N	{Jumping}	{"Young Horse"}	{Warmblood}	6	16.1	164	Gelding	Higgins	Chance	Lux Z	{Calm,Honest,Brave}	AUD	Milo is an accomplished gelding established to 90 cm showjumping with a bright future in any Olympic discipline. Bred and broken in by his owner and competed by family members, he is uncomplicated, unflappable and well mannered, offering a safe, established and unspoilt young horse.\n\nHe is soft and light in the bridle, collects willingly and has three balanced paces with athletic movement. Milo loves jumping, is honest and brave, and tolerates the occasional miss. He is currently competing successfully at 80 to 90 cm due to his age. He has attended many competitions at large venues and agricultural shows and is the same horse out as he is at home. He is relaxed on trail rides and consistent in all environments.\n\nUnder saddle Milo is responsive, willing and ridden in a snaffle. He is kind, straightforward and tolerant of rider mistakes. When tired he may feel a little heavier, like any young horse.\n\nHe is in irregular work one to two times a week due to too many horses and not enough riders, which is why he is for sale. He remains safe without consistent work and his behaviour does not change after a spell.\n\nMilo is very well mannered on the ground, easy to catch, lead, groom, clip, wash and shoe, and simple to load and travel. He unloads calmly and stands quietly.\n\nHe is reliable and safe, does not buck, pigroot, bolt or rear, and is calm around dogs and other pets. He is non reactive unless something major happens and even then remains safe and settles immediately.\n\nMilo is hard fed once a day with hay twice a day. He is sound with no performance issues and any vet check is welcome.\nHe is safe and sensible for his breeder and her family, adjusts to his rider and is willing without being overly forward. He is suitable for novice riders with support and for intermediate riders who want to compete.	{https://res.cloudinary.com/dcorxaflu/image/upload/v1765272857/horses/wiijuucmngjng8hfqz4b.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765272882/horses/ff4q3xsntpxgn7lthqqe.jpg}	{}	2025-12-09 09:36:55.552703	15000	20000	Bay	Ideal hom would be a rider who wants to enjoy and love a straightforward and well educated young horse, that they can continue educating and taking up the levels in any of the olympic disciplines . He is a delight and deserves to be spoiled and loved!	f	\N	\N
88	92	The Hungarian	Australia	\N	{Dressage}	{Preliminary,"Young Horse"}	{Thoroughbred}	7	16.2	165	Gelding	Snitzel	Pretty Pins	Pins	{Calm,Honest}	AUD	Price: $6k\nHeight: 16.2hh\nAge: 7\nBreed: TB\nSnitzel x Pretty Pins\nDiscipline: Dressage/ showing, eventing, showjumping\nLocation: Logan Village, QLD\nRider suitability: Capable Rider (under regular professional instruction)\n\nHighlights\nTop level SJ/ eventer prospect!\nGreat foundation and out competing!\nSafe, adaptable and straightforward to manage\n\nIncentives\nQLD OTT - Harry comes with 10 subsidised lessons!\nEquimillions eligible!\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772589907/horses/nqzbmtuhckcqgmxlutwv.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589912/horses/g7bhq6vi1wp5wwkdrqhq.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589939/horses/dwv4z30jl6hsrdti8anj.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589953/horses/k9m2zjm3vpfviulfupqk.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589972/horses/kbvsrs7qjdb4rkkayzkm.jpg}	{}	2026-03-04 02:07:15.461352	5000	10000	Chestnut	Introduction: The Hungarian, affectionately known as ‘Harry,’ is a well-educated 7-year-old 16.2hh gelding who is a top level dressage, eventing or showjumping prospect! With a willing temperament and good exposure to different environments, Harry presents a lovely opportunity for a capable junior or amateur rider to bring on a talented young horse.. \nHarry is by Snitzel out of Pretty Pins (Pins), these bloodlines are both proven and sought after for thoroughbreds that excel, off the track, in their new lives after racing.\n\nEducation, skills and experience: Harry has an established level of education and has been produced to be adaptable and genuine. He has completed low-level showjumping at club level (cavalettis and cross rails) and low-level cross-country schooling. He is familiar with lunging and has been exposed to a wide variety of environments, including busy stables, farm life and even beach outings.\n\nDressage / Showing: Harry works willingly on the flat and is responsive to the aids. He will collect when asked, though like many young horses he can take time and correct riding to maintain a consistent frame and contact. He puts in as much effort as required by his rider and aims to please.\n\nShowjumping / Eventing: Harry enjoys jumping and has been schooled over small fences and answered basic cross-country questions. He is honest and straightforward, making him suitable for a rider wanting to continue developing their skills across showjumping and eventing.\n\nReferences can be provided by the seller's instructors - Rebel Morrow and Gary Lung.\n\nGeneral demeanor under saddle: Harry is willing, responsive and adaptable to the confidence level of his rider. He is generally calm and reliable, though not completely unflappable. He can be a little looky at times and may have a look or step sideways away from something, but he does not do anything silly or reactive and is perfectly safe at all times.\n\nBehaviour in and out of work: Harry is safe to hop on after a spell and does not require constant riding to remain reliable. He is currently in work five or more times per week and is competing.\n\nHandling and general behaviour: Harry is easy to catch and handle, leads calmly, loads and travels well, and stands quietly when travelling. He is reliable for the farrier and good for the vet. He is comfortable being stabled full time in a busy environment or managed with turnout.\n\nFeeding and management: Harry is fed hard feed and is straightforward to manage. He receives supplements as a preventative only. His management is flexible — he can live in a herd, on his own, or on a stable/paddock rotation.\n\nMedical history: Harry has no medical issues or injuries. Any supplements are given as preventative only and do not affect performance. He is up to date with vaccinations (Tetanus and Strangles), shod, and vet checks are welcome at the buyer’s expense.\n\nTack and gear: Harry is light and happy being ridden in a snaffle bit and does not require any specific tack.\n\nRider Suitability: Capable Rider defined as someone with at least five years of regular riding and competition experience, with independent hands and a balanced seat. Harry would suit:\nA balance and confident junior rider (under 18)\nA young rider (18–24)\nAn amateur adult or mature rider\nRegular professional instruction is recommended to continue his development.\n\nIdeal home: A knowledgeable, confident home looking for a well-started young horse to enjoy across dressage, jumping and eventing. Harry would suit someone wanting a genuine allrounder with room to progress.\n	t	\N	\N
78	92	Hollands First Class	Australia	0	{Dressage}	{Elementary}	{"Warmblood Cross"}	8	16.3	166	Gelding	Quando Quando			{Brave}	AUD	Hollands First Class, affectionately known as ‘Harlo,’ is an 8-year-old 16.3hh chestnut gelding by Quando Quando. Harlo has been in his current ownership for the past two years, having been purchased as a lightly broken young horse. During this time, he has demonstrated exceptional work ethic, rideability and trainability, developing into a quality performance horse with genuine presence and ability.\n\nHarlo is competing preliminary, established at Novice level and is currently schooling Elementary and Medium movements, with flying changes and half passes developing beautifully. He offers three expressive, swinging paces and learns quickly, making him an enjoyable and rewarding horse to produce.\n\nHe has had extensive competition experience over the past 18 months and has consistently brought home broad ribbons at agricultural shows. He has carried his rider to multiple Supreme Rider titles and has placed at both Canberra and Sydney Royal Shows in rider and hack classes. At his first Sydney Royal, he placed third in his Novice Hunter and handled the atmosphere exceptionally well.\n\nIn addition to dressage and showing, Harlo has completed low-level jump schooling over cavalettis and cross rails and is well accustomed to general farm life. He is not worried by fireworks, livestock or dogs.\n\nTemperament & Rideability: Under saddle, Harlo is willing, responsive and trainable, and he consistently gives 100% to his rider. He handles big atmospheres well, although he still requires further exposure to consistently produce his best work at large competitions.\n\nHe can be looky in certain situations and will react to unbalanced riders or mixed signals. He requires a rider with soft hands and a clear, consistent approach. As he continues to build strength, he will benefit from time to further improve his collection.\n\nIn busy environments, he can occasionally show tension through his work, sometimes offering small hops instead of moving forward. This behaviour is manageable and videos can be provided. He may also kick out or pigroot if tapped on the hindquarters with a whip, although this does not occur regularly.\n\nHarlo thrives on regular, consistent work. He requires riding four or more times per week to remain reliable and consistent and benefits from lunging before riding after a spell.\n\nRider Suitability: Harlo is best suited to a capable rider at a minimum. This is defined as someone who has been riding and competing regularly for at least five years, has independent hands and a balanced position and is confident handling educated and athletic horses.\n\nHe would suit a young rider aged 18–24 or an amateur adult rider who is under regular professional instruction. Due to his size, athleticism and stage of training, he is not suitable for a nervous rider, a confidence builder or a child’s first hack.\n\nHe would ideally suit someone wanting a talented, trainable dressage horse to develop up the levels using a soft, correct training method and who has the time and commitment to continue his education.\n\nHandling & Ground Manners: Harlo is easy to catch and leads calmly and willingly. He is calm and easy to clip, reliable for the farrier and good for the vet. He is tolerant of handler mistakes and generally easy to manage both at home and at shows.\n\nDue to his size, he requires a confident and capable handler. He loves being stabled and is good to tie up, although he is not reliable to hard tie. He floats well but can be slightly nervous and benefits from patient handling. He can be matey when taken out with another horse but it is just the occasional neigh and he still gets on with the job.\n\nHe does not enjoy being drenched and may raise his head or move away during this and washing.\n\nFeeding & Management: Harlo lives primarily on grass and hay and receives hard feed once daily, consisting of lucerne chaff, Xtra Cool pellets and a gut multivitamin. He is in good health and maintains condition well on his current diet.\nHe can be kept in a herd, paddocked alone or kept completely on his own. He can be stabled part-time or managed flexibly according to his environment and workload.\n\nVeterinary & Care: Harlo has one small scar on his near side front leg, which is cosmetic only. He is currently up to date with dental and was vaccinated for Strangles and Tetanus, both were completed in July 2025. He is currently barefoot and maintained on a regular farrier schedule. A vet check can be conducted at the buyer’s expense.\n\nReason for Sale: This is a very heartbreaking sale. Harlo is only being offered due to lack of time, with young horses coming through, and the desire to find him a rider who can make him their primary focus and partner.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772526128/horses/vitfx8vqvbge0dxdbcad.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772526142/horses/pq1uwqkpxtedmz0l8d3c.jpg}	{}	2026-03-03 08:24:39.570302	35000	40000	Chestnut	Harlo is a talented and trainable gelding with proven Royal Show results and genuine scope to progress through the dressage levels. He requires a confident, capable rider with soft hands and consistent training, but in return offers quality paces, presence and an exceptional work ethic. He is offered to a knowledgeable, committed home where he can continue to develop and thrive.	t		\N
101	92	Sweet Dreams FPH	Australia	0	{Jumping}	{1.10m}	{Warmblood}	9	15.3	155	Mare	Contendro	Ever So		{}	AUD	Asking price: $35k neg\nHeight: 15.3-16hh\nAge: 9\nGender: mare\nBreed: WB\nContendro x Ever So\nRegistrations: Warmblood\nDiscipline: showjumping\nRider suitability: balanced, capable and confident due to level of education\nLocation: Nevertire, NSW (can be viewed 15 mins from Dubbo Airport - which has multiple flights daily from Sydney)\n\nSignificant 2026 Results\n2 x 1st placing and 1 x 2nd - 2026 NSW Indoor Championships - 90cm - AELEC Tamworth\n2 x 8th place - 2026 NSW Indoor Championships - 100cm - AELEC Tamworth\n2nd place - 2026 Mendooran Show - 100cm\n1st place - 2026 Mendooran Show - 90cm\nCompeted up to Junior Level with previous rider\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1776155147/horses/usqta0zubc1olrbqsvgy.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1777504907/horses/aeoeyatatzyyd63nvk9q.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1776154604/horses/s2uuc3idloxc4pgjmm35.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1776155070/horses/jj075oouvxwqpmjfky0k.jpg}	{}	2026-04-14 08:19:10.479072	35000	35000	Brown	Introduction: Sweet Dreams FPH, known as ‘Katie’, is an exciting 9-year-old Warmblood mare with quality, presence and a forward-thinking attitude to her work. Standing at 15.3-16hh, she is a powerful and athletic mare in a smaller package. Katie offers scope, blood and responsiveness, making her an ideal partner for a competitive rider looking for a fun and capable showjumping horse. She is currently being competed by PHS and is offered for sale on behalf of her owner.\n\nEducation, skills and experience: Katie is well educated and has been produced with showjumping firmly in mind. She is currently in work, competing, and has already recorded wins and placings at state level in 2026. She is a forward-thinking mare who enjoys her job and responds well to correct, confident and regular riding.\n\nShowjumping: Showjumping is Katie’s primary discipline. She is athletic, sharp and responsive, with a naturally forward way of going. She is competitive, careful and quick-thinking, making her a fun and engaging ride for a capable or experienced rider. Katie has the ability to continue progressing through the levels with the right home and rider support. She has previously competed successfully to 120/ Junior level.\n\nGeneral demeanor under saddle: Katie is a forward and sharp mare who is willing and responsive to the aids. She has ‘blood’ and presence and therefore requires a rider who enjoys a more sensitive, athletic type. Katie is light and happy being ridden in a trust innosense snaffle bit. She is more switched on and less reactive when wearing a soundproof bonnet and a whip is carried (it does not need to be used).\n\nCurrent workload/ fitness: Katie is currently in work and competing. Like most performance horses, she requires regular riding (four or more times weekly) to remain settled, reliable and straightforward. She may benefit from a five minute lunge after a spell.\n\nHandling and general behaviour: Katie is well mannered on the ground and easy to manage however she can give you the ‘mare stare’ which may be off putting for a nervous handler. She loads without hesitation on our truck, travels quietly, stands well on the float and unloads calmly. She is easy to catch, groom, wash, saddle, and is good for the farrier and vet.\n\nVices or quirks: Katie can be looky in certain situations and may shy away if unsure. This is not dirty behaviour, but she does require a confident, capable rider who can ride her positively and reassure her when needed. She has done a little pigroot when smacked with a whip, is fresh, when doing flying changes or if the rider is unbalanced on landing after a jump - however, this is not malicious or regular. Katie does not buck, bolt or rear.\n\nFeeding and management: Katie is a good doer and is currently fed cracked lupins, chaff and hay. Her management is straightforward but she can get hot when overfed and under worked. She can be stabled and paddocked on a routine or kept in a paddock on her own with other horses in sight. She is sensible around farm machinery, livestock, dogs and other pets.\n\nMedical history: Katie has no past or present medical issues. She is up to date with vaccinations and dental. She is shod on a regular 5-6 week cycle and does not require corrective shoeing. Vet checks are welcome at the buyer’s expense.\n\nRider Suitability: Capable to Experienced Rider defined as someone with extensive riding and competition experience, confident riding forward, sensitive horses and producing performance horses under professional instruction. Katie would suit:\nA capable young rider (15–24 years) with support\nAn experienced amateur adult rider\nA competitive home seeking a fun, sharp mare\n\nReason for sale: Offered for sale as she did not suit her owner and their busy schedule. This is a genuine sale of a horse that is currently in work and competing with PHS.\n\nIdeal home: A competitive showjumping home for someone wanting a fun, athletic and capable horse to enjoy producing and competing. Katie will suit a rider who appreciates a forward, responsive mare and wants a horse with quality and presence.\n	t	Well educated	{}
87	92	Test The Stars	Australia	0	{Eventing}	{EvA80}	{Thoroughbred}	11	15.3	155	Gelding	Testa Rossa	Bella Vedera		{Schoolmaster}	AUD	Asking price: $10k\nHeight: 15.3hh\nGender: Gelding\nAge: 11\nBreed: TB - Equimillions eligible\nDiscipline: Dressage/ showing with a novice rider; eventing/ showjumping with a confident intermediate rider.\nRider suitability: See above\nLocation: Mount Fairy, NSW\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nEducated to elementary level with scores in the mid 60s\nSuccessfully evented to EVA80 and showjumped to 105\nVice free and well mannered on the ground\nSound and issue free\n\nSignificant Results\n3rd place - Junior EVA65 - 2025 REA Wagga Horse Trials\n4th place - Junior 85cm - 2025 Tamworth World Cup Show\n6th place - Junior 95cm - Sydney Show Jumping Club Competition Day (July)\n5th place - Junior Prelim 1.1 - 2025 Leeton Dressage\n8th place - 80cm Combined Training - 2025 Coonabarabran Interschool Expo\n4th place - open 80cm - 2025 Sydney Jumping Association\n6th place - 90cm - 2025 Equimillions\n2024 Coonabarabran Interschool Expo – 3rd Team Six Bar\n2024 Coonabarabran Interschool Expo – 4th Open Lightweight Hack 15.2–16hh\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772589337/horses/bgruiszyd2ryzoxdmzfo.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589413/horses/pfejxquawfay38hd73h2.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589422/horses/e2xssle1ah7ybhqmzyc1.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772589440/horses/ul6rveo4l7v7pokrkka9.jpg}	{}	2026-03-04 01:58:12.487714	10000	10000	Chestnut	Introduction: ‘Test The Stars’, affectionately known as Tosca, is a 12-year-old, 15.3hh Thoroughbred gelding with a proven competition record and genuine allround ability. Tosca has successfully competed in showjumping, eventing and dressage, as well as enjoying cow work and stock work. He is a happy face around the property and a much-loved member of the team who has provided his riders with wonderful experiences across multiple disciplines.\n\nBreeding & Registration: Tosca is a Thoroughbred by Testa Rossa out of Bella Vedera. He holds an EA registration and Showjumping card and is eligible for Equimillions competition.\n\nEducation, Skills & Experience: Tosca is a well-educated and experienced allrounder. He has competed up to 1.05m showjumping, EvA85 eventing and Elementary dressage. In addition to his competition career, he has been exposed to cow work, barrel racing and stock work. He is safe and quiet to ride near cattle and livestock and is not concerned by dogs, busy roads or general farm life, including tractors and motorbikes.\n\nTosca can be ridden bareback and lunged, and adapts well to different environments. Tosca has competed at notable events including North West Interschools, Waratah World Cup Showjumping, Tamworth World Cup, Shepparton World Cup and Equimillions, demonstrating his versatility and exposure to large atmospheres.\n\nTemperament & Rideability: Tosca is sweet and soft to ride and is light in the bridle with the ability to willingly collect. He is generally non-reactive and unflappable under saddle and adapts to the competence and confidence of his rider. He puts in as much effort as is required and is capable of stepping up when ridden by a more experienced rider.\n\nHe can, however, be lazy on the flat and often benefits from spurs and/or a whip to encourage him forward. When showjumping, he can become forward and strong. When coming back into work after a spell, Tosca may be slightly tense and tail swishy on the first ride, but he quickly settles and returns to his usual reliable self. He may occasionally call out to other horses but continues to focus on his job.\n\nRider Suitability: Tosca is best suited to an intermediate rider at a minimum, defined as someone who has been riding and competing regularly for at least three years and has independent hands and a balanced seat. He would particularly suit a rider aged 18 or older, who is under regular professional instruction. Due to his forward nature when jumping, he requires a rider who has soft hands and does not have a ’hot’ seat. He is a very kind and genuine horse but not for beginners.\n\nBehaviour In & Out of Work: Tosca does not require consistent daily riding to remain safe and reliable. He can be brought back into work without issue and settles quickly. He is currently in light work, being ridden once or twice a week.\n\nHandling & Ground Manners: Tosca is easy to catch and well mannered on the ground. He leads calmly, ties up without fuss and self-loads onto the float. He stands quietly while travelling and unloads calmly. He is easy to clip and is reliable for the farrier and veterinarian. \n\nFeeding & Management: Tosca is currently hard fed twice daily and receives a biscuit of lucerne in the afternoon. He has no past or present medical issues, injuries or supplement requirements. He can be stabled full time or stabled for part of the day and paddocked for the remainder. He must be paddocked with a companion within sight.\n\nVeterinary & Care: Tosca is up to date with dental, vaccinations and shoeing. Vet checks are welcome at the buyer’s expense.\n\nReason for Sale: Tosca is offered for sale as his rider is no longer riding or competing and does not have the time to continue his career.\n\nIdeal Home: Tosca is looking for a home where he will be loved and cared for as he has been over the years. He will thrive with someone who is understanding but firm and confident, ensuring he does not take advantage of softer handling. He remains a talented and honest allrounder with plenty to offer the right rider.	t	\N	\N
62	116	Krumble Xtreme	New Zealand	0	{Jumping}	{"Young Horse"}	{Warmblood}	5	16.3	166	Gelding	Numero Uno Xtreme	Courture Xtreme	Corofino II	{Brave,Scope}	NZD	Looking for a serious horse for the future? \n\nAn exquisite modern gelding, Krumble is a top International prospect! \n\nOffered for sale by his breeders, Krumble has had a wonderful foundation to his ridden career and is ready for the next step with his new team. He was professionally broken in at Xtreme Sport Horses as a 4yo and has been slowly produced by our team of professional riders. \n\nHe has big powerful movement, travelling naturally up hill. He has a good foundation to his work on the flat, with a kind and genuine way of going, very uncomplicated. \n\nWith his introduction to jumping he has proven to have impressive scope, a fantastic technique and power over a jump. He is very brave, eager to please with great ride-ability. \n\nFor a rider looking for quality, scope and temperament, please get in touch! We are located 1 hr north of Wellington International Airport. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1765308910/horses/mgbfny1dzodlzqukcsei.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765308842/horses/waeigr4gwa7gr90tnwl3.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765308859/horses/d83yn4b5egmuio9jah4g.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765308924/horses/wqhf2camtz1lssewztv8.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1765308938/horses/hoxcgbiktxlhwr6xlsus.jpg}	{}	2025-12-09 19:47:31.515281	70000	80000	Grey	\N	f	\N	\N
64	92	Inca DP	Australia	0	{Jumping}	{Futurity}	{Warmblood}	7	16.3	166	Mare	Diamant De Semilly	Denison Park Veliki	Vivant	{Brave,Careful}	AUD	Inca is a kind, careful and quick mare who has been produced by her current rider to 130 level. She is straightforward to ride and handle, excels in competition and offers genuine talent and potential for top level sport. This is a rare opportunity to purchase a well bred, well educated mare with proven performance.\n\nShe is by Diamant De Semilly out of Denison Park Veliki, both highly successful Grand Prix showjumpers. Diamant competed to 1.60m CSIO5, was French Champion in 2002, a World Champion by team and ninth individually in 2022, and won a World Championship silver medal in 2023. He has produced more than 2500 winners, including over 230 horses that have competed at 1.60m level, and is known for producing powerful, willing, bold, balanced and sound offspring. Denison Park Veliki competed successfully at Grand Prix level, won five World Cup qualifiers in Australia with Chris Chugg and placed seventh in the 2010 World Cup Final in Geneva. He is by Vivant Van der Heffinck, whose offspring are highly sought after for scope, bravery, consistency and soundness.\n\nInca is compact, athletic and refined with balanced, elastic and powerful paces. She is well established on the flat with automatic flying changes and a quality canter, making her adjustable and competitive on course.\n\nShe has competed and placed to 130 with 135 jump offs and is quick, brave and careful. She is sharp and responsive in a way typical of horses competing at this level. Inca enjoys trail rides, is currently in work and competing.\n\nShe is easy to handle on the ground, good for the farrier and simple to load and travel in both float and truck. She is affectionate and well travelled, comfortable in city environments and ag shows, and eats and drinks well away from home.\nInca is sensible and reliable. When fresh she may kick out playfully in canter transitions or jog back to the truck, but she has no vices and is always safe.\n\nShe is easy to manage, happy stabled or paddocked alone or with company, and has no medical or management issues.\nInca would suit a competitive and experienced rider looking for an established and straightforward horse to compete from 120 to 140 plus level.\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1765967093/horses/siuknivswzhqk71kqyxc.jpg}	{}	2025-12-17 10:25:48.68938	80000	90000	Bay	Inca is for sale as she is ready to compete 140 plus. She is sound, fit and ready to compete. 	t	\N	\N
65	473	Luna	Australia	\N	{Jumping}	{"Not Applicable"}	{Warmblood}	2	15.3	155	Filly	Cornel	Elle	Sandrels	{}	AUD	Beautiful grey filly for sale \nDOB: 23/01/2024\nLuna is by Cornel (Corlensky G x Bjork-L) out of a Sandrels mare. Cornel is a world cup showjumper with many offspring competing in the showjumping circuit around Australia. Sandrels has previously competed up to Prix St. George level dressage. This breeding would make her a great showjumper, eventer or dressage horse. She has 3 beautiful paces and sweet temperament. She’s been lightly handled and shows great potential. 	{https://res.cloudinary.com/dcorxaflu/image/upload/v1768349339/horses/nzgpyhirqqoev1v15lub.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1768349365/horses/gt2m60it0kegzvfz7ifu.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1768349387/horses/g9ap5ayy776kzlpluy38.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1768349396/horses/tadzmxawcvlznaw3ear9.jpg}	{}	2026-01-14 00:11:47.157958	10000	15000	Grey	No history of competition	t	\N	\N
89	92	The Obstructionist	Australia	0	{Jumping}	{"Young Horse"}	{Thoroughbred}	5	16.1	164	Gelding	Savabeel	Striker (NZ)		{Brave,Careful,Scope}	AUD	Asking price: $6000\nHeight: 16.1hh\nAge: 5\nBreed: TB\nSavabeel x Striker (NZ)\nDiscipline: Showjumping, eventing\nRider suitability: Intermediate\nLocation: Logan Village, QLD\nPlease see Owner’s Response Certificate for more information.\n\nHighlights\nTrainable and willing\nTOP LEVEL SHOWJUMPING PROSPECT\nAttended Jump Club\nSound and well ‘let down’\nVice and quirk free\n	{https://res.cloudinary.com/dcorxaflu/image/upload/v1772590301/horses/u4ibhvvgl17a0ifjztw6.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772590307/horses/ivuyqw1vwb4yv1q5gilh.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772590312/horses/r8tawst6bioab2njnx33.jpg,https://res.cloudinary.com/dcorxaflu/image/upload/v1772590317/horses/nve00qjtjwmr1exwuzvr.jpg}	{}	2026-03-04 02:14:05.839007	5000	10000	Brown	Introduction: Obstructionist (Kiwi) is a 5-year-old gelding standing approximately 16.1hh and located in Logan Village, QLD. He is a quality top level prospect who is currently competing and developing his skills across multiple disciplines.\n\nEducation, Skills & Experience: Kiwi is a future showjumping star! He has been schooled over low-level cross country fences and is continuing to establish his dressage and flatwork foundation. He presents as an athletic, forward young horse with plenty of scope to continue progressing under the right guidance. References can be provided by the seller's instructors - Rebel Morrow and Gary Lung.\n\nHe has had outings to adult rider club level and is in consistent work five or more times per week. In addition to his outings, he has been lunged, ridden safely near cattle and sheep and has visited and swum at the beach. He is not concerned by children in his vicinity, busy roads, tractors, trucks, motorbikes, livestock or dogs. \n\nTemperament & Rideability: Under saddle, Kiwi is forward and can be sharp. He can occasionally feel stubborn and may be heavy in the bridle; however, a correct half halt quickly lightens him in the contact. He is generally non-reactive unless something major occurs.\n\nHe does not require regular riding to remain safe and is reliable to hop straight on after a spell. He is currently in consistent work and continues to improve with structured training.\n\nThere are no vices or significant quirks to disclose.\n\nRider Suitability: Kiwi is best suited to a capable rider at a minimum. This is defined as someone who has been riding and competing regularly for at least five years, has independent hands and a balanced position and is confident in handling young or developing horses.\n\nHe would suit a young rider aged 18–24 or an amateur adult rider who is under regular professional instruction. Due to his age and stage of education, he requires a knowledgeable rider who can continue to develop his flatwork and overall rideability.\n\nHandling & Ground Manners: Kiwi is easy to catch and well mannered on the ground. He ties up happily and calmly without fuss or pulling back. He loads very easily into a float or truck, stands quietly while travelling and unloads calmly.\nHe is easy to wash, reliable for the farrier and good for the vet. He is tolerant of handler mistakes and presents as straightforward to manage. He is currently shod.\n\nFeeding & Management: He is fed hard feed and receives supplements as a preventative measure. His management is entirely flexible. He can be kept in a herd situation, in a paddock on his own or completely on his own without other horses on the property. He can be stabled 12 hours a day and paddocked 12 hours a day or happily stabled full time in a busy environment such as a competition stable.\n\nVeterinary & Care: Kiwi is up to date with his tetanus and strangles vaccinations, last completed on 31/12/2025. He is maintained on a regular farrier schedule and is currently shod.\n\nA vet check can be conducted at the buyer’s expense.\n\nSummary: Obstructionist is an athletic young gelding with a good foundation and a broad exposure base. He would suit a capable rider looking to produce a young horse through the grades in showjumping or eventing, with continued development on the flat.\n\nWith consistent professional guidance, he has the capacity to continue improving and become a competitive partner.\n	t	\N	\N
\.


--
-- Data for Name: login_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.login_events (id, user_id, logged_in_at) FROM stdin;
1	31	2025-11-22 02:32:22.310937
2	31	2025-11-22 02:32:23.827923
3	31	2025-11-22 02:42:41.408747
4	31	2025-11-22 02:48:31.143906
5	31	2025-11-22 02:51:52.270975
6	31	2025-11-22 03:17:43.04657
7	31	2025-11-22 03:19:45.36481
8	31	2025-11-22 03:30:54.313095
9	31	2025-11-22 03:45:00.044796
10	31	2025-11-22 03:53:09.934341
11	31	2025-11-22 03:53:10.582327
12	269	2025-11-22 04:42:45.356579
13	269	2025-11-22 04:42:46.246625
14	31	2025-11-22 05:18:23.970364
15	329	2025-11-22 05:25:04.529542
16	329	2025-11-22 07:00:38.300197
17	329	2025-11-22 07:00:38.944008
18	31	2025-11-22 09:24:23.546931
19	31	2025-11-22 09:24:24.320572
20	31	2025-11-22 19:21:07.22685
21	31	2025-11-23 01:44:07.442813
22	330	2025-11-23 03:32:51.613783
23	331	2025-11-23 10:19:46.221166
24	31	2025-11-23 10:43:28.637694
25	116	2025-11-23 20:17:01.848638
26	238	2025-11-23 20:30:19.630446
27	332	2025-11-24 00:41:54.699623
28	332	2025-11-24 00:42:21.71747
29	329	2025-11-24 05:47:38.394349
30	116	2025-11-24 09:32:18.124095
31	331	2025-11-24 12:31:22.475755
32	331	2025-11-24 12:31:22.99921
33	31	2025-11-24 18:30:10.711995
34	31	2025-11-25 06:26:56.099616
35	31	2025-11-25 07:32:44.168435
36	238	2025-11-25 08:33:59.842629
37	31	2025-11-25 10:45:43.762169
38	31	2025-11-26 10:22:09.575347
39	335	2025-11-26 23:32:55.066681
40	335	2025-11-26 23:33:04.81818
41	31	2025-11-27 08:47:24.427593
42	336	2025-11-27 10:36:14.120156
43	284	2025-11-27 11:25:49.56286
44	337	2025-11-27 12:07:22.725907
45	31	2025-11-27 19:21:27.562476
46	31	2025-11-27 20:35:11.056384
47	31	2025-11-27 20:35:11.252418
48	31	2025-11-27 20:40:08.973462
49	31	2025-11-27 20:41:17.236362
50	31	2025-11-27 20:49:21.223519
51	31	2025-11-27 22:33:29.012618
52	31	2025-11-28 03:15:13.086584
53	31	2025-11-28 08:39:16.890759
54	238	2025-11-28 10:45:08.130351
55	338	2025-11-29 02:58:27.853193
56	339	2025-11-29 04:14:17.463818
57	238	2025-11-29 04:52:07.000687
58	238	2025-11-29 05:26:34.811521
59	340	2025-11-29 06:49:05.147004
60	31	2025-11-29 08:45:20.88051
61	31	2025-11-29 09:12:44.534957
62	31	2025-11-29 11:07:54.977939
63	341	2025-11-30 03:38:27.377761
64	343	2025-11-30 07:06:55.804037
65	343	2025-11-30 07:07:51.557025
66	116	2025-11-30 07:22:17.990092
67	31	2025-11-30 11:11:13.828288
68	31	2025-11-30 11:11:14.171819
69	31	2025-11-30 23:21:21.48649
70	31	2025-12-01 03:51:27.261214
71	31	2025-12-01 03:51:27.474249
72	31	2025-12-01 07:08:26.292921
73	344	2025-12-01 07:43:39.701468
74	31	2025-12-01 19:10:59.814324
75	31	2025-12-01 20:52:07.171165
76	31	2025-12-01 20:52:07.748955
77	213	2025-12-01 20:54:15.211305
78	217	2025-12-01 20:54:19.595335
79	137	2025-12-01 20:54:20.679725
80	290	2025-12-01 20:54:27.198196
81	31	2025-12-02 03:14:23.018101
82	345	2025-12-02 08:53:27.260245
83	31	2025-12-02 09:12:12.227861
84	31	2025-12-02 09:12:13.059769
85	31	2025-12-02 09:36:23.488903
86	347	2025-12-03 09:12:39.113652
87	347	2025-12-03 09:22:40.208649
88	31	2025-12-03 10:57:42.696758
89	31	2025-12-03 10:57:43.060651
90	116	2025-12-04 00:05:54.232448
91	116	2025-12-04 00:05:54.625608
92	31	2025-12-04 08:40:38.319374
93	31	2025-12-04 08:40:38.860271
94	31	2025-12-04 09:10:45.930307
95	31	2025-12-04 09:10:46.541019
96	178	2025-12-04 09:52:09.525445
97	31	2025-12-04 10:41:32.490357
98	238	2025-12-04 12:04:57.253361
99	348	2025-12-05 03:42:38.605585
100	348	2025-12-05 03:42:42.534482
101	31	2025-12-05 04:46:18.145344
102	31	2025-12-05 11:24:30.411448
103	31	2025-12-05 11:24:30.608612
104	256	2025-12-06 03:20:20.26221
105	238	2025-12-06 04:44:09.793107
106	31	2025-12-06 08:20:41.771133
107	349	2025-12-06 09:33:04.243495
108	31	2025-12-06 16:51:11.227497
109	31	2025-12-06 18:26:47.943091
110	31	2025-12-06 21:22:04.537483
111	354	2025-12-07 03:31:40.389697
112	31	2025-12-07 23:04:27.922933
113	31	2025-12-08 08:38:16.020716
114	355	2025-12-08 09:15:36.187883
115	31	2025-12-08 09:38:21.237478
116	31	2025-12-08 23:12:35.866963
117	116	2025-12-08 23:45:19.172715
118	94	2025-12-09 01:46:43.384161
119	31	2025-12-09 04:29:45.829904
120	31	2025-12-09 07:28:53.201136
121	31	2025-12-09 07:28:53.406966
122	31	2025-12-09 08:55:58.587937
123	92	2025-12-09 09:02:23.326333
124	31	2025-12-09 09:57:08.820619
125	31	2025-12-09 09:57:31.942356
126	290	2025-12-09 10:25:04.585627
127	357	2025-12-09 10:25:48.209054
128	356	2025-12-09 10:26:33.86956
129	196	2025-12-09 10:27:25.401841
130	359	2025-12-09 10:31:39.02479
131	360	2025-12-09 10:31:47.98135
132	360	2025-12-09 10:32:03.359447
133	358	2025-12-09 10:32:13.982589
134	361	2025-12-09 10:47:30.325657
135	362	2025-12-09 10:49:25.544474
136	363	2025-12-09 10:57:54.818085
137	364	2025-12-09 11:00:23.596236
138	364	2025-12-09 11:00:59.420826
139	365	2025-12-09 11:04:15.949038
140	366	2025-12-09 11:15:16.101649
141	368	2025-12-09 11:18:17.993373
142	370	2025-12-09 11:29:27.199386
143	370	2025-12-09 11:29:46.440367
144	371	2025-12-09 11:31:10.827975
145	373	2025-12-09 11:43:58.366439
146	31	2025-12-09 11:57:10.012675
147	374	2025-12-09 12:45:25.686918
148	375	2025-12-09 13:00:20.017554
149	376	2025-12-09 17:08:28.876043
150	378	2025-12-09 17:37:26.067026
151	377	2025-12-09 17:37:26.084869
152	379	2025-12-09 18:09:48.666638
153	380	2025-12-09 18:16:52.455942
154	380	2025-12-09 18:19:20.333556
155	381	2025-12-09 18:38:28.081021
156	31	2025-12-09 19:01:51.418695
157	382	2025-12-09 19:09:51.845016
158	256	2025-12-09 19:12:46.189218
159	256	2025-12-09 19:12:46.632219
160	116	2025-12-09 19:31:44.605258
161	383	2025-12-09 19:34:16.104594
162	384	2025-12-09 19:48:05.342039
163	385	2025-12-09 19:49:57.661013
164	386	2025-12-09 20:03:07.975635
165	385	2025-12-09 20:10:41.293855
166	388	2025-12-09 20:11:19.745387
167	388	2025-12-09 20:11:42.410754
168	388	2025-12-09 20:20:08.637634
169	389	2025-12-09 20:23:32.067755
170	389	2025-12-09 20:23:52.436377
171	390	2025-12-09 20:26:50.222131
172	391	2025-12-09 20:31:29.611872
173	393	2025-12-09 20:41:17.248815
174	394	2025-12-09 20:44:15.522225
175	394	2025-12-09 20:44:34.155677
176	395	2025-12-09 20:54:34.595761
177	396	2025-12-09 21:48:22.723641
178	397	2025-12-09 22:06:06.606975
179	397	2025-12-09 22:06:38.621451
180	397	2025-12-09 22:06:39.154322
181	397	2025-12-09 22:06:39.787097
182	398	2025-12-09 22:25:47.531123
183	400	2025-12-09 22:39:36.552248
184	401	2025-12-09 23:51:59.223426
185	31	2025-12-10 00:01:38.157511
186	402	2025-12-10 00:17:04.977016
187	405	2025-12-10 00:26:33.017781
188	405	2025-12-10 00:26:55.86528
189	405	2025-12-10 00:29:39.583762
190	406	2025-12-10 00:32:00.911173
191	407	2025-12-10 00:49:08.830705
192	407	2025-12-10 01:11:40.857823
193	409	2025-12-10 01:16:03.209694
194	409	2025-12-10 01:16:42.310456
195	31	2025-12-10 01:16:47.510277
196	31	2025-12-10 01:16:48.248704
197	31	2025-12-10 01:18:09.141542
198	31	2025-12-10 01:18:10.030192
199	409	2025-12-10 01:18:40.7629
200	409	2025-12-10 01:23:09.681207
201	381	2025-12-10 01:33:21.180177
202	410	2025-12-10 01:37:28.198801
203	31	2025-12-10 02:00:00.608562
204	222	2025-12-10 02:00:45.140016
205	222	2025-12-10 02:05:47.191629
206	412	2025-12-10 02:09:44.975465
207	411	2025-12-10 02:10:23.879891
208	413	2025-12-10 02:10:35.293127
209	414	2025-12-10 03:40:24.921057
210	415	2025-12-10 03:46:21.017366
211	416	2025-12-10 04:10:35.753452
212	417	2025-12-10 04:40:46.918022
213	418	2025-12-10 04:43:12.762323
214	381	2025-12-10 05:43:15.926986
215	331	2025-12-10 05:53:35.898432
216	419	2025-12-10 05:57:51.854332
217	31	2025-12-10 06:14:27.077969
218	31	2025-12-10 07:17:30.054777
219	371	2025-12-10 09:05:40.537408
220	395	2025-12-10 09:38:42.146413
221	31	2025-12-10 09:39:56.217868
222	421	2025-12-10 09:41:01.472936
223	381	2025-12-10 18:01:23.419656
224	31	2025-12-10 19:45:43.511786
225	422	2025-12-11 00:35:02.930649
226	423	2025-12-11 03:12:16.294125
227	423	2025-12-11 03:15:13.14084
228	424	2025-12-11 03:32:46.214412
229	425	2025-12-11 05:46:02.549033
230	425	2025-12-11 05:46:34.676769
231	425	2025-12-11 05:48:23.966484
232	31	2025-12-11 09:35:44.782001
233	31	2025-12-11 10:23:12.108138
234	31	2025-12-11 10:27:24.237975
235	31	2025-12-11 10:27:41.215837
236	31	2025-12-11 10:28:31.502724
237	426	2025-12-11 18:05:28.073156
238	31	2025-12-11 18:27:53.291107
239	31	2025-12-11 18:27:54.103343
240	428	2025-12-11 22:50:28.520015
241	31	2025-12-12 03:09:36.797417
242	31	2025-12-12 03:09:37.482979
243	31	2025-12-12 03:53:07.121463
244	256	2025-12-12 04:51:03.997801
245	368	2025-12-12 05:20:46.429335
246	413	2025-12-12 05:50:50.225452
247	31	2025-12-12 06:10:00.999049
248	31	2025-12-12 08:20:21.812676
249	31	2025-12-12 08:21:51.762905
250	213	2025-12-12 08:24:15.69314
251	217	2025-12-12 08:24:17.662165
252	389	2025-12-12 08:24:51.858936
253	343	2025-12-12 09:45:19.279146
254	31	2025-12-12 09:57:49.396537
255	428	2025-12-12 10:25:11.253799
256	359	2025-12-12 10:53:02.011635
257	31	2025-12-12 21:23:27.919405
258	31	2025-12-13 09:29:14.753673
259	31	2025-12-13 09:29:14.955162
260	31	2025-12-14 09:54:14.245055
261	31	2025-12-14 09:54:14.384813
262	31	2025-12-14 11:19:35.172273
263	31	2025-12-15 06:25:11.184864
264	31	2025-12-15 06:25:11.907359
265	31	2025-12-15 09:30:05.309381
266	359	2025-12-15 09:55:06.199032
267	31	2025-12-15 10:01:13.730011
268	385	2025-12-15 21:30:51.297441
269	31	2025-12-16 02:36:15.927806
270	31	2025-12-16 08:04:18.20557
271	31	2025-12-17 09:56:36.867983
272	31	2025-12-17 10:07:52.614885
273	92	2025-12-17 10:17:35.415762
274	31	2025-12-17 10:36:47.73132
275	31	2025-12-17 10:43:04.46352
276	31	2025-12-17 10:44:01.90671
277	31	2025-12-17 18:32:00.914097
278	31	2025-12-17 18:32:01.41611
279	429	2025-12-17 19:34:31.271448
280	429	2025-12-17 19:35:33.661524
281	429	2025-12-17 23:12:32.835373
282	31	2025-12-18 03:57:24.059449
283	31	2025-12-18 07:24:26.088209
284	31	2025-12-18 07:24:27.015387
285	132	2025-12-18 07:32:40.278327
286	31	2025-12-18 07:38:40.49372
287	430	2025-12-18 07:39:33.328655
288	431	2025-12-18 07:44:53.151499
289	432	2025-12-18 08:02:05.016338
290	433	2025-12-18 08:02:18.867618
291	434	2025-12-18 08:08:04.683651
292	31	2025-12-18 08:12:44.866907
293	31	2025-12-18 08:23:11.315566
294	435	2025-12-18 08:31:00.36705
295	435	2025-12-18 08:31:47.523928
296	435	2025-12-18 08:32:16.476732
297	359	2025-12-18 08:50:33.324572
298	31	2025-12-18 08:58:41.864574
299	436	2025-12-18 09:06:45.229274
300	437	2025-12-18 09:10:54.923845
301	439	2025-12-18 09:23:41.145106
302	439	2025-12-18 09:26:41.205414
303	389	2025-12-18 09:41:50.331691
304	31	2025-12-18 09:59:22.571095
305	31	2025-12-18 10:53:59.368504
306	440	2025-12-18 10:56:41.083779
307	441	2025-12-18 11:15:47.374157
308	31	2025-12-18 17:10:14.966955
309	376	2025-12-18 18:19:45.795616
310	443	2025-12-18 22:20:39.70846
311	31	2025-12-19 00:07:49.336105
312	444	2025-12-19 01:04:54.226553
313	31	2025-12-19 04:56:09.700916
314	256	2025-12-19 06:57:05.44134
315	31	2025-12-19 08:21:33.255235
316	421	2025-12-19 09:14:18.370497
317	31	2025-12-19 10:36:29.890922
318	31	2025-12-19 18:24:26.631306
319	373	2025-12-19 20:40:54.926074
320	373	2025-12-19 20:40:55.436841
321	31	2025-12-19 22:19:57.376631
322	445	2025-12-20 07:05:08.433681
323	268	2025-12-20 07:17:25.387264
324	31	2025-12-20 19:23:59.656517
325	446	2025-12-20 20:55:54.498471
326	31	2025-12-21 02:24:02.195259
327	31	2025-12-21 02:46:03.041413
328	31	2025-12-21 02:46:03.72657
329	31	2025-12-21 04:43:33.439898
330	31	2025-12-21 04:43:34.030002
331	31	2025-12-21 05:21:53.307564
332	31	2025-12-21 05:21:53.933193
333	31	2025-12-21 07:06:24.341345
334	359	2025-12-21 08:40:49.744341
335	31	2025-12-21 09:10:55.11637
336	447	2025-12-21 09:16:54.664328
337	448	2025-12-21 09:30:21.173321
338	31	2025-12-21 10:03:06.325435
339	217	2025-12-21 10:05:06.530656
340	213	2025-12-21 10:05:07.745344
341	435	2025-12-21 10:06:10.063972
342	428	2025-12-21 10:10:26.33993
343	446	2025-12-21 10:11:51.998835
344	450	2025-12-21 16:41:44.800198
345	31	2025-12-21 17:41:07.874357
346	31	2025-12-21 18:20:54.608514
347	31	2025-12-21 18:37:23.049758
348	31	2025-12-21 18:38:21.637182
349	31	2025-12-21 19:00:21.018741
350	31	2025-12-21 19:41:35.468814
351	31	2025-12-21 20:22:07.062345
352	31	2025-12-21 21:00:44.901729
353	222	2025-12-21 23:06:02.621994
354	31	2025-12-22 01:27:04.25069
355	451	2025-12-22 07:41:49.625079
356	451	2025-12-22 07:43:37.303105
357	385	2025-12-22 11:05:25.069458
358	31	2025-12-22 11:31:16.779464
359	223	2025-12-22 22:58:49.754548
360	223	2025-12-22 23:09:56.559358
361	31	2025-12-23 02:13:17.458242
362	31	2025-12-23 04:25:38.393404
363	452	2025-12-23 06:23:17.491624
364	453	2025-12-23 07:27:15.546852
365	31	2025-12-23 08:31:38.143611
366	31	2025-12-23 08:54:57.695337
367	31	2025-12-23 09:31:21.904417
368	31	2025-12-23 09:31:22.625129
369	454	2025-12-23 18:52:04.190791
370	31	2025-12-23 19:43:59.034059
371	31	2025-12-23 19:43:59.513942
372	31	2025-12-23 22:51:05.543623
373	31	2025-12-24 00:58:15.917041
374	31	2025-12-24 01:34:55.980939
375	31	2025-12-24 01:34:56.595007
376	31	2025-12-24 01:56:07.362169
377	31	2025-12-24 08:39:42.689143
378	455	2025-12-24 09:11:27.231511
379	31	2025-12-24 11:34:16.926495
380	31	2025-12-25 03:31:01.027209
381	31	2025-12-25 03:31:01.675749
382	31	2025-12-25 04:49:34.102023
383	31	2025-12-25 04:58:13.389584
384	31	2025-12-25 05:30:35.585529
385	31	2025-12-25 06:05:12.401649
386	31	2025-12-25 06:30:46.396168
387	31	2025-12-25 07:03:13.034411
388	31	2025-12-25 07:40:31.512657
389	31	2025-12-25 09:32:31.035004
390	31	2025-12-25 19:09:59.499659
391	31	2025-12-25 19:10:00.426028
392	31	2025-12-26 01:36:24.126523
393	31	2025-12-26 07:20:01.702417
394	31	2025-12-26 09:58:21.992616
395	31	2025-12-26 10:47:20.12274
396	31	2025-12-26 10:47:20.845141
397	31	2025-12-26 21:56:14.956587
398	456	2025-12-27 07:31:21.957672
399	385	2025-12-27 19:04:02.057159
400	31	2025-12-27 21:56:17.841451
401	31	2025-12-28 00:34:21.093886
402	359	2025-12-28 08:28:50.130386
403	31	2025-12-28 19:21:14.3373
404	31	2025-12-29 01:23:57.528015
405	31	2025-12-29 06:33:31.219926
406	31	2025-12-29 08:43:18.116729
407	31	2025-12-29 20:58:11.098453
408	459	2025-12-29 23:11:12.658587
409	31	2025-12-30 00:31:19.644239
410	31	2025-12-30 00:46:01.988973
411	31	2025-12-30 00:48:23.451015
412	31	2025-12-30 01:03:57.183771
413	31	2025-12-30 01:15:10.190307
414	31	2025-12-30 01:15:43.490772
415	31	2025-12-30 01:21:33.954131
416	31	2025-12-30 01:30:09.946964
417	31	2025-12-30 01:32:29.271425
418	31	2025-12-30 01:35:46.214247
419	31	2025-12-30 01:37:56.370492
420	31	2025-12-30 03:26:38.950117
421	31	2025-12-30 05:27:25.376552
422	31	2025-12-30 05:27:26.178009
423	31	2025-12-30 06:42:20.546663
424	31	2025-12-30 06:42:20.608517
425	31	2025-12-30 06:45:32.366826
426	31	2025-12-30 06:45:33.275159
427	31	2025-12-30 06:53:42.044268
428	31	2025-12-30 06:57:06.816331
429	262	2025-12-30 07:01:17.512825
430	262	2025-12-30 07:02:05.854967
431	262	2025-12-30 07:04:57.563843
432	262	2025-12-30 07:04:58.582377
433	262	2025-12-30 07:24:50.90414
434	460	2025-12-30 08:26:01.628208
435	460	2025-12-30 08:26:38.787444
436	262	2025-12-30 09:12:20.753968
437	262	2025-12-30 09:12:21.447919
438	262	2025-12-30 10:04:56.438885
439	31	2025-12-30 10:05:41.773169
440	31	2025-12-30 10:25:44.040961
441	31	2025-12-30 11:04:31.102913
442	461	2025-12-30 19:50:24.194752
443	31	2025-12-30 20:03:40.30568
444	31	2025-12-31 03:28:33.334587
445	31	2025-12-31 03:28:33.967479
446	31	2025-12-31 20:16:06.082283
447	31	2026-01-01 06:37:29.736306
448	31	2026-01-01 21:28:51.889066
449	222	2026-01-02 00:39:09.681028
450	222	2026-01-02 02:06:53.840097
451	222	2026-01-02 03:15:42.04115
452	463	2026-01-02 03:17:52.487287
453	31	2026-01-02 04:19:24.07927
454	31	2026-01-02 08:22:11.752361
455	31	2026-01-02 09:33:08.050021
456	31	2026-01-02 10:48:40.389106
457	31	2026-01-02 10:48:40.994647
458	31	2026-01-02 19:02:35.72569
459	464	2026-01-03 00:31:21.114403
460	464	2026-01-03 00:31:45.424862
461	31	2026-01-03 01:15:04.734661
462	31	2026-01-03 01:15:05.432087
463	31	2026-01-03 01:31:40.732428
464	31	2026-01-03 01:31:41.397424
465	31	2026-01-03 06:06:05.276293
466	31	2026-01-03 07:47:36.573251
467	31	2026-01-03 08:36:20.538235
468	31	2026-01-03 19:17:19.021129
469	31	2026-01-03 22:46:52.504109
470	31	2026-01-04 00:30:56.669159
471	31	2026-01-04 00:30:57.268672
472	456	2026-01-04 01:25:08.248866
473	31	2026-01-04 03:44:13.820465
474	31	2026-01-04 03:44:14.375539
475	31	2026-01-04 04:10:58.616303
476	31	2026-01-04 05:31:47.419498
477	31	2026-01-04 06:29:33.777989
478	31	2026-01-04 09:36:26.021719
479	31	2026-01-04 10:03:58.439673
480	31	2026-01-04 23:34:15.974461
481	31	2026-01-05 04:12:48.5602
482	31	2026-01-05 04:12:49.288669
483	283	2026-01-05 04:18:58.823657
484	31	2026-01-05 09:27:38.712315
485	31	2026-01-05 09:47:18.48568
486	31	2026-01-05 17:54:21.60039
487	31	2026-01-06 00:48:44.911722
488	31	2026-01-06 10:03:29.072256
489	466	2026-01-06 13:32:06.26936
490	31	2026-01-07 03:50:41.367511
491	31	2026-01-07 03:50:41.496237
492	31	2026-01-07 05:06:05.731483
493	31	2026-01-07 07:14:05.17583
494	359	2026-01-07 08:05:43.905116
495	137	2026-01-07 08:46:35.09077
496	31	2026-01-07 09:39:02.336007
497	31	2026-01-08 04:30:36.564603
498	31	2026-01-08 11:34:30.859868
499	31	2026-01-09 02:49:03.476251
500	31	2026-01-09 02:49:04.173137
501	31	2026-01-09 10:13:21.862513
502	31	2026-01-10 01:48:34.573425
503	456	2026-01-10 01:57:15.160706
504	456	2026-01-10 02:49:23.831962
505	31	2026-01-10 07:27:21.520459
506	31	2026-01-11 05:30:37.456234
507	31	2026-01-11 05:30:38.046528
508	385	2026-01-11 09:56:06.141208
509	31	2026-01-11 10:50:51.500972
510	470	2026-01-12 05:34:48.4165
511	470	2026-01-12 05:35:04.584015
512	471	2026-01-12 08:16:01.622745
513	471	2026-01-12 08:20:17.912266
514	471	2026-01-12 08:20:17.913731
515	471	2026-01-12 08:43:41.789856
516	31	2026-01-12 18:35:49.144695
517	31	2026-01-12 18:35:49.743753
518	472	2026-01-12 23:24:11.905053
519	425	2026-01-13 01:19:49.873728
520	31	2026-01-13 07:29:28.455792
521	31	2026-01-13 09:16:58.052877
522	31	2026-01-13 09:16:58.52266
523	31	2026-01-13 09:46:03.414144
524	473	2026-01-13 10:19:08.210662
525	474	2026-01-13 20:53:00.202928
526	473	2026-01-13 22:12:53.347075
527	475	2026-01-14 00:03:11.397725
528	473	2026-01-14 00:07:42.362199
529	31	2026-01-14 01:29:24.1046
530	31	2026-01-14 02:13:44.409862
531	31	2026-01-14 02:13:45.073478
532	433	2026-01-14 04:15:29.879514
533	473	2026-01-14 04:16:11.984785
534	31	2026-01-14 04:59:32.610357
535	31	2026-01-14 05:47:42.858855
536	31	2026-01-14 05:47:43.349291
537	31	2026-01-14 07:16:06.310245
538	31	2026-01-14 07:44:19.917895
539	471	2026-01-14 08:18:22.588156
540	31	2026-01-14 09:30:22.734901
541	31	2026-01-14 09:30:23.469088
542	358	2026-01-14 10:54:58.546959
543	359	2026-01-14 11:06:43.214483
544	456	2026-01-14 20:58:43.714636
545	31	2026-01-14 21:46:10.963692
546	31	2026-01-14 22:31:01.554868
547	31	2026-01-15 02:01:09.528281
548	31	2026-01-15 02:01:09.991664
549	244	2026-01-15 03:11:46.296758
550	244	2026-01-15 03:11:46.969083
551	31	2026-01-15 06:53:32.455002
552	31	2026-01-15 07:24:04.267468
553	31	2026-01-15 08:17:34.79325
554	31	2026-01-15 09:49:23.543526
555	31	2026-01-15 18:47:58.167416
556	213	2026-01-15 18:51:39.020674
557	435	2026-01-15 18:52:28.684926
558	217	2026-01-15 18:52:32.106012
559	368	2026-01-15 20:42:13.871023
560	448	2026-01-15 20:50:13.893558
561	470	2026-01-15 22:23:34.842675
562	31	2026-01-15 22:35:54.78342
563	31	2026-01-16 01:06:13.910658
564	31	2026-01-16 05:06:11.524608
565	31	2026-01-16 05:31:55.693524
566	98	2026-01-16 05:52:52.031929
567	98	2026-01-16 05:56:58.113419
568	31	2026-01-16 06:15:46.708702
569	31	2026-01-16 07:37:19.618668
570	31	2026-01-16 11:18:31.907527
571	31	2026-01-16 11:18:32.35139
572	31	2026-01-16 17:55:02.992484
573	98	2026-01-16 21:04:57.954043
574	31	2026-01-16 21:11:54.071344
575	31	2026-01-16 23:43:52.424562
576	31	2026-01-17 01:13:14.649312
577	456	2026-01-17 03:33:23.157798
578	456	2026-01-17 03:33:23.582262
579	31	2026-01-17 04:03:15.082537
580	31	2026-01-17 06:20:22.444582
581	31	2026-01-17 07:40:56.710356
582	473	2026-01-17 07:52:28.831953
583	391	2026-01-17 08:19:24.807373
584	359	2026-01-17 10:04:46.601015
585	31	2026-01-17 21:15:25.211491
586	31	2026-01-18 08:49:09.571304
587	31	2026-01-18 09:52:25.020125
588	31	2026-01-18 20:50:53.359432
589	31	2026-01-19 00:25:52.60757
590	31	2026-01-19 00:25:52.842998
591	477	2026-01-19 02:38:18.855336
592	477	2026-01-19 02:38:45.267542
593	31	2026-01-19 04:37:06.570892
594	31	2026-01-19 05:52:37.807447
595	31	2026-01-19 05:52:38.555023
596	31	2026-01-19 08:02:11.062083
597	478	2026-01-19 23:01:44.106936
598	31	2026-01-20 02:52:03.192558
599	31	2026-01-20 07:35:24.356462
600	92	2026-01-20 07:35:55.759073
601	31	2026-01-20 07:53:03.549569
602	31	2026-01-20 07:53:53.68232
603	479	2026-01-20 08:01:15.196261
604	31	2026-01-20 09:15:26.375297
605	479	2026-01-20 10:35:18.308478
606	31	2026-01-20 21:32:06.12968
607	31	2026-01-21 03:30:05.990541
608	31	2026-01-21 04:18:56.926269
609	31	2026-01-21 04:46:02.658765
610	31	2026-01-21 07:43:06.135572
611	31	2026-01-21 08:35:31.36018
612	31	2026-01-21 09:03:15.024094
613	480	2026-01-21 09:17:48.871654
614	480	2026-01-21 09:19:43.10041
615	358	2026-01-21 10:30:50.772091
616	31	2026-01-21 17:57:31.533717
617	358	2026-01-22 04:43:28.496352
618	31	2026-01-22 08:20:31.930283
619	31	2026-01-22 09:57:58.110887
620	31	2026-01-22 10:24:51.823676
621	31	2026-01-23 03:44:33.330497
622	31	2026-01-23 10:24:24.585315
623	481	2026-01-23 20:57:01.20539
624	31	2026-01-24 02:27:25.61361
625	31	2026-01-24 08:30:12.594661
626	31	2026-01-25 07:32:26.592078
627	31	2026-01-25 08:54:35.649217
628	31	2026-01-25 22:40:41.108548
629	116	2026-01-26 01:06:00.959339
630	482	2026-01-26 02:26:03.216937
631	31	2026-01-26 06:55:40.612435
632	31	2026-01-26 08:44:53.87111
633	484	2026-01-27 03:19:17.714329
634	31	2026-01-27 05:42:34.527085
635	116	2026-01-27 08:12:24.352129
636	31	2026-01-27 10:04:50.973821
637	31	2026-01-27 10:32:29.471433
638	359	2026-01-27 10:55:02.10118
639	31	2026-01-27 18:31:33.810848
640	456	2026-01-27 19:24:04.433484
641	31	2026-01-27 19:39:39.065435
642	31	2026-01-28 04:04:42.781565
643	31	2026-01-28 08:39:46.109713
644	31	2026-01-28 09:51:25.881631
645	31	2026-01-28 10:38:56.34707
646	31	2026-01-29 00:21:42.969006
647	31	2026-01-29 06:47:23.274575
648	31	2026-01-29 06:47:23.927648
649	31	2026-01-29 09:35:17.787317
650	31	2026-01-30 08:30:55.880041
651	31	2026-01-30 18:38:45.778694
652	31	2026-01-30 18:38:46.148044
653	456	2026-01-31 02:18:37.670949
654	456	2026-01-31 02:18:38.583574
655	485	2026-01-31 02:41:08.313307
656	485	2026-01-31 02:41:16.396855
657	31	2026-01-31 02:53:15.220785
658	31	2026-01-31 09:40:40.791778
659	31	2026-02-01 03:23:41.563065
660	31	2026-02-01 03:23:42.337215
661	31	2026-02-01 06:05:53.80301
662	31	2026-02-01 07:15:24.285141
663	31	2026-02-02 04:15:26.929874
664	31	2026-02-02 04:15:27.856053
665	31	2026-02-02 21:58:15.236664
666	31	2026-02-02 21:58:15.852666
667	31	2026-02-03 05:57:01.511858
668	486	2026-02-04 04:31:36.069012
669	31	2026-02-04 05:59:42.353072
670	31	2026-02-04 05:59:42.799098
671	31	2026-02-04 07:39:55.177195
672	92	2026-02-04 07:43:17.127965
673	31	2026-02-04 08:29:09.035516
674	31	2026-02-04 08:30:05.146468
675	366	2026-02-04 08:30:15.358479
676	137	2026-02-04 08:32:50.875316
677	137	2026-02-04 08:32:52.511826
678	125	2026-02-04 08:33:47.213029
679	394	2026-02-04 08:34:04.60613
680	394	2026-02-04 08:34:06.05433
681	487	2026-02-04 08:39:30.511741
682	31	2026-02-04 08:39:35.197504
683	125	2026-02-04 08:40:39.570837
684	488	2026-02-04 08:40:48.622162
685	489	2026-02-04 08:47:13.414616
686	395	2026-02-04 08:49:20.407495
687	31	2026-02-04 08:55:37.866915
688	394	2026-02-04 08:59:50.137961
689	490	2026-02-04 09:01:06.035367
690	490	2026-02-04 09:01:35.452855
691	31	2026-02-04 09:02:02.327736
692	492	2026-02-04 09:05:38.592806
693	291	2026-02-04 09:07:05.341812
694	222	2026-02-04 09:10:14.533912
695	31	2026-02-04 09:12:30.967771
696	31	2026-02-04 09:16:48.660093
697	494	2026-02-04 09:16:55.804993
698	31	2026-02-04 09:19:07.471562
699	497	2026-02-04 09:22:54.376184
700	31	2026-02-04 09:23:03.99007
701	385	2026-02-04 09:24:13.428047
702	31	2026-02-04 09:31:51.240055
703	122	2026-02-04 09:32:53.271837
704	499	2026-02-04 09:34:09.836752
705	31	2026-02-04 09:40:57.461598
706	500	2026-02-04 09:42:49.299789
707	31	2026-02-04 09:49:24.132806
708	501	2026-02-04 09:54:28.374796
709	31	2026-02-04 09:57:19.850489
710	502	2026-02-04 10:00:41.042817
711	31	2026-02-04 10:08:20.220389
712	31	2026-02-04 10:13:08.872584
713	504	2026-02-04 10:19:18.753379
714	505	2026-02-04 10:21:17.529515
715	505	2026-02-04 10:21:39.677107
716	507	2026-02-04 10:26:36.841061
717	507	2026-02-04 10:28:08.161751
718	508	2026-02-04 10:31:36.697985
719	509	2026-02-04 10:36:02.34142
720	510	2026-02-04 10:38:13.16872
721	511	2026-02-04 10:45:41.469263
722	359	2026-02-04 11:08:44.862966
723	359	2026-02-04 11:08:45.585844
724	513	2026-02-04 12:20:18.716253
725	514	2026-02-04 12:34:56.747841
726	514	2026-02-04 12:35:04.356619
727	514	2026-02-04 12:35:19.970347
728	515	2026-02-04 13:36:30.061128
729	516	2026-02-04 15:03:39.222836
730	517	2026-02-04 15:31:06.552372
731	522	2026-02-04 17:48:29.75879
732	523	2026-02-04 19:01:32.700805
733	31	2026-02-04 19:07:54.466589
734	491	2026-02-04 19:37:44.384599
735	459	2026-02-04 20:01:47.310746
736	525	2026-02-04 20:02:04.975119
737	31	2026-02-04 20:41:53.99371
738	31	2026-02-04 20:41:54.010332
739	526	2026-02-04 21:54:02.895287
740	527	2026-02-04 22:02:04.528782
741	527	2026-02-04 22:02:21.292616
742	31	2026-02-04 22:18:14.209794
743	31	2026-02-04 22:19:41.428148
744	31	2026-02-04 22:23:01.043981
745	31	2026-02-04 22:25:57.90229
746	31	2026-02-04 22:26:17.690725
747	31	2026-02-04 22:27:40.439248
748	31	2026-02-04 22:28:22.374891
749	31	2026-02-04 22:30:04.26863
750	525	2026-02-04 22:50:13.061097
751	525	2026-02-04 22:50:13.521571
752	31	2026-02-04 22:50:15.85012
753	31	2026-02-04 22:53:39.888532
754	31	2026-02-04 22:55:30.573048
755	31	2026-02-04 22:56:20.500566
756	528	2026-02-04 23:00:56.066135
757	31	2026-02-04 23:02:22.988222
758	529	2026-02-04 23:03:05.627525
759	529	2026-02-04 23:03:49.147359
760	530	2026-02-04 23:08:19.782953
761	31	2026-02-04 23:10:25.268827
762	224	2026-02-04 23:16:10.447973
763	531	2026-02-04 23:21:31.191292
764	31	2026-02-04 23:22:40.140797
765	532	2026-02-04 23:28:38.719982
766	31	2026-02-04 23:33:25.001615
767	533	2026-02-04 23:42:36.030684
768	31	2026-02-04 23:43:38.598564
769	533	2026-02-04 23:43:50.272742
770	534	2026-02-04 23:45:25.589272
771	496	2026-02-04 23:47:06.883776
772	496	2026-02-04 23:48:35.766706
773	534	2026-02-04 23:54:18.998495
774	31	2026-02-04 23:58:31.166605
775	31	2026-02-04 23:58:31.738368
776	31	2026-02-05 00:00:58.008729
777	535	2026-02-05 00:03:01.457697
778	31	2026-02-05 00:04:34.806487
779	31	2026-02-05 00:10:43.485579
780	31	2026-02-05 00:11:36.357599
781	31	2026-02-05 00:12:06.909305
782	31	2026-02-05 00:12:40.730076
783	31	2026-02-05 00:16:53.335899
784	536	2026-02-05 00:18:43.759679
785	31	2026-02-05 00:28:13.657622
786	537	2026-02-05 00:35:50.203836
787	31	2026-02-05 00:43:50.53087
788	92	2026-02-05 01:26:40.07953
789	31	2026-02-05 02:05:17.608732
790	538	2026-02-05 02:06:20.254167
791	539	2026-02-05 02:07:01.333413
792	31	2026-02-05 02:10:00.189054
793	92	2026-02-05 02:11:43.865749
794	31	2026-02-05 02:31:16.886789
795	31	2026-02-05 02:31:46.833292
796	92	2026-02-05 02:33:05.647693
797	92	2026-02-05 02:37:09.940076
798	533	2026-02-05 02:37:30.063453
799	31	2026-02-05 02:39:05.353566
800	31	2026-02-05 02:49:27.269462
801	541	2026-02-05 03:04:35.62653
802	541	2026-02-05 03:06:34.18448
803	512	2026-02-05 03:59:19.017385
804	31	2026-02-05 04:02:08.669724
805	31	2026-02-05 04:33:56.697608
806	31	2026-02-05 04:33:56.697861
807	31	2026-02-05 04:51:56.888543
808	542	2026-02-05 05:21:29.508243
809	543	2026-02-05 05:29:02.763924
810	31	2026-02-05 05:31:26.893625
811	31	2026-02-05 05:38:39.572336
812	31	2026-02-05 05:46:55.130215
813	92	2026-02-05 05:54:13.400021
814	31	2026-02-05 05:55:18.977588
815	31	2026-02-05 05:56:36.222593
816	544	2026-02-05 06:01:37.653216
817	31	2026-02-05 06:43:18.009188
818	539	2026-02-05 06:46:00.425534
819	31	2026-02-05 07:30:01.175877
820	546	2026-02-05 07:52:17.926853
821	546	2026-02-05 07:53:58.166846
822	546	2026-02-05 07:53:58.529241
823	31	2026-02-05 08:28:17.667263
824	547	2026-02-05 08:41:06.958657
825	547	2026-02-05 08:44:03.912122
826	256	2026-02-05 09:14:32.509492
827	31	2026-02-05 09:29:24.442233
828	548	2026-02-05 09:55:54.858878
829	31	2026-02-05 10:10:54.517612
830	131	2026-02-05 10:38:24.025056
831	31	2026-02-05 19:08:50.931607
832	31	2026-02-05 19:08:51.17697
833	549	2026-02-05 20:26:29.075055
834	550	2026-02-05 20:53:17.497369
835	549	2026-02-05 21:42:54.458878
836	551	2026-02-05 21:55:00.880266
837	31	2026-02-05 22:13:50.181478
838	31	2026-02-05 22:53:13.716884
839	238	2026-02-05 23:19:26.871578
840	549	2026-02-06 00:56:13.896121
841	31	2026-02-06 01:10:13.463387
842	394	2026-02-06 01:48:34.000833
843	31	2026-02-06 02:03:27.435654
844	31	2026-02-06 05:49:32.818429
845	503	2026-02-06 07:51:23.297375
846	503	2026-02-06 07:53:04.312648
847	31	2026-02-06 08:00:54.815837
848	503	2026-02-06 09:33:27.476267
849	552	2026-02-06 12:07:34.602922
850	552	2026-02-06 12:08:55.111154
851	347	2026-02-06 13:41:07.766997
852	553	2026-02-06 19:57:14.962206
853	553	2026-02-06 19:58:03.459443
854	31	2026-02-06 21:05:35.285062
855	31	2026-02-06 23:32:55.141139
856	116	2026-02-07 01:14:19.741237
857	554	2026-02-07 01:48:20.938528
858	225	2026-02-07 04:48:55.750215
859	31	2026-02-07 07:53:23.871587
860	31	2026-02-07 09:24:56.335256
861	31	2026-02-07 18:54:19.284437
862	91	2026-02-07 22:53:25.16198
863	31	2026-02-08 04:34:54.629942
864	31	2026-02-08 05:21:11.338635
865	283	2026-02-08 09:55:23.198154
866	31	2026-02-09 06:09:18.555818
867	31	2026-02-09 06:09:19.010418
868	555	2026-02-09 13:14:46.172679
869	31	2026-02-09 18:07:15.194489
870	456	2026-02-09 19:54:27.216938
871	456	2026-02-09 19:54:28.644118
872	31	2026-02-09 21:10:33.28744
873	31	2026-02-10 05:46:00.02163
874	359	2026-02-10 11:11:58.139425
875	556	2026-02-10 11:45:13.974694
876	107	2026-02-10 20:06:30.178891
877	557	2026-02-11 06:03:00.966015
878	31	2026-02-11 09:32:08.079872
879	359	2026-02-12 09:43:54.85012
880	558	2026-02-13 00:33:47.18036
881	559	2026-02-13 02:06:46.528382
882	479	2026-02-13 04:07:22.725505
883	31	2026-02-13 09:26:43.315179
884	31	2026-02-13 09:26:44.020355
885	31	2026-02-13 21:03:53.059901
886	31	2026-02-13 21:06:40.297467
887	213	2026-02-13 21:13:13.180609
888	435	2026-02-13 21:13:58.711792
889	514	2026-02-13 21:14:03.41797
890	31	2026-02-13 21:14:19.313969
891	31	2026-02-14 07:28:58.676586
892	276	2026-02-14 09:19:43.484362
893	31	2026-02-14 23:03:04.240608
894	560	2026-02-15 03:22:39.580299
895	31	2026-02-15 08:04:27.493617
896	413	2026-02-15 08:13:48.773125
897	561	2026-02-16 02:10:26.783049
898	561	2026-02-16 02:11:40.727048
899	31	2026-02-16 05:58:43.166109
900	562	2026-02-16 10:23:13.626166
901	562	2026-02-16 10:23:30.419515
902	562	2026-02-16 10:23:31.406381
903	31	2026-02-17 07:46:43.955647
904	564	2026-02-17 08:25:42.192529
905	566	2026-02-17 12:25:48.306301
906	31	2026-02-19 09:34:27.224526
907	31	2026-02-20 03:41:43.80035
908	31	2026-02-20 23:23:47.000584
909	31	2026-02-20 23:23:47.26472
910	567	2026-02-21 03:15:09.956581
911	31	2026-02-21 06:19:50.982907
912	31	2026-02-21 06:19:51.244844
913	92	2026-02-21 07:09:36.186103
914	31	2026-02-21 07:51:49.482649
915	31	2026-02-21 09:29:46.188386
916	31	2026-02-21 18:57:04.277672
917	567	2026-02-22 07:00:14.00815
918	31	2026-02-22 07:24:35.598347
919	31	2026-02-22 07:24:36.303805
920	125	2026-02-22 07:54:18.284533
921	94	2026-02-22 19:57:56.86713
922	31	2026-02-23 01:37:48.734155
923	31	2026-02-23 06:11:34.646145
924	91	2026-02-23 06:15:04.904815
925	31	2026-02-23 06:26:21.835403
926	31	2026-02-23 06:29:14.800834
927	91	2026-02-23 06:30:34.159515
928	91	2026-02-23 06:38:08.900984
929	31	2026-02-23 06:41:18.811253
930	31	2026-02-23 07:42:58.587812
931	568	2026-02-23 07:43:55.147893
932	562	2026-02-23 07:44:35.947599
933	137	2026-02-23 07:47:32.220555
934	31	2026-02-23 07:48:01.41607
935	137	2026-02-23 07:48:04.512911
936	474	2026-02-23 07:50:02.176096
937	430	2026-02-23 07:52:45.29605
938	569	2026-02-23 07:53:02.012706
939	413	2026-02-23 07:54:05.654023
940	413	2026-02-23 07:56:20.174844
941	571	2026-02-23 07:59:45.084587
942	31	2026-02-23 08:04:28.548601
943	371	2026-02-23 08:06:50.770843
944	413	2026-02-23 08:09:22.598515
945	439	2026-02-23 08:14:53.327888
946	375	2026-02-23 08:14:56.970381
947	375	2026-02-23 08:14:58.253776
948	439	2026-02-23 08:15:29.567758
949	31	2026-02-23 08:16:13.264431
950	573	2026-02-23 08:17:54.108911
951	573	2026-02-23 08:19:03.473676
952	574	2026-02-23 08:19:47.71532
953	576	2026-02-23 08:20:58.654557
954	576	2026-02-23 08:21:01.991524
955	576	2026-02-23 08:21:29.341349
956	31	2026-02-23 08:26:46.682612
957	577	2026-02-23 08:29:30.359312
958	578	2026-02-23 08:35:39.00187
959	578	2026-02-23 08:36:29.950706
960	31	2026-02-23 08:37:39.269287
961	482	2026-02-23 08:39:15.099882
962	564	2026-02-23 08:43:53.500171
963	564	2026-02-23 08:44:15.819148
964	31	2026-02-23 08:44:18.453986
965	31	2026-02-23 08:50:33.535655
966	485	2026-02-23 08:51:28.182493
967	359	2026-02-23 08:55:58.160878
968	579	2026-02-23 08:57:06.834117
969	579	2026-02-23 08:57:59.921103
970	31	2026-02-23 09:01:34.770605
971	575	2026-02-23 09:03:12.82669
972	533	2026-02-23 09:08:28.37143
973	580	2026-02-23 09:14:41.356725
974	581	2026-02-23 09:19:59.184088
975	31	2026-02-23 09:25:44.360048
976	583	2026-02-23 09:43:23.74992
977	583	2026-02-23 09:44:09.083381
978	584	2026-02-23 09:49:09.931421
979	177	2026-02-23 09:53:13.604927
980	480	2026-02-23 09:58:23.288444
981	586	2026-02-23 10:16:10.254674
982	585	2026-02-23 10:17:40.990163
983	586	2026-02-23 10:20:21.226895
984	587	2026-02-23 10:40:35.974734
985	588	2026-02-23 10:40:49.995517
986	587	2026-02-23 10:41:56.378825
987	125	2026-02-23 11:14:09.982047
988	125	2026-02-23 11:14:10.779058
989	125	2026-02-23 11:14:13.214058
990	589	2026-02-23 11:28:03.86023
991	589	2026-02-23 11:29:22.625921
992	590	2026-02-23 11:56:01.150268
993	590	2026-02-23 11:57:14.623403
994	591	2026-02-23 13:06:48.205115
995	223	2026-02-23 18:49:05.327432
996	31	2026-02-23 19:04:58.542975
997	593	2026-02-23 19:29:33.488802
998	388	2026-02-23 19:58:55.029376
999	594	2026-02-23 21:03:58.158801
1000	576	2026-02-23 21:15:24.32423
1001	576	2026-02-23 21:15:25.040868
1002	595	2026-02-23 21:35:42.386839
1003	595	2026-02-23 21:36:56.582767
1004	596	2026-02-23 21:41:20.130203
1005	597	2026-02-23 21:47:10.659096
1006	599	2026-02-23 21:57:42.03727
1007	599	2026-02-23 22:12:49.818732
1008	31	2026-02-23 22:14:25.485932
1009	515	2026-02-23 22:15:41.745768
1010	557	2026-02-23 22:39:28.561828
1011	602	2026-02-23 22:50:37.906774
1012	603	2026-02-23 23:08:41.788805
1013	603	2026-02-23 23:10:44.960155
1014	601	2026-02-23 23:23:43.980297
1015	31	2026-02-23 23:38:38.937762
1016	31	2026-02-24 00:06:53.057192
1017	604	2026-02-24 00:37:03.274095
1018	605	2026-02-24 01:31:50.193804
1019	605	2026-02-24 01:33:32.50451
1020	606	2026-02-24 01:34:18.693209
1021	92	2026-02-24 03:16:03.899554
1022	557	2026-02-24 04:47:53.056732
1023	607	2026-02-24 05:57:39.184281
1024	608	2026-02-24 05:58:10.562699
1025	607	2026-02-24 06:22:41.683823
1026	609	2026-02-24 07:09:50.023587
1027	610	2026-02-24 07:56:58.922048
1028	31	2026-02-24 08:56:21.235801
1029	31	2026-02-24 09:36:09.61179
1030	611	2026-02-24 10:33:33.886168
1031	562	2026-02-24 10:44:27.611058
1032	612	2026-02-24 11:07:02.471554
1033	613	2026-02-24 12:32:39.836875
1034	614	2026-02-24 17:48:52.580101
1035	615	2026-02-24 18:34:09.701748
1036	615	2026-02-24 18:34:52.813084
1037	609	2026-02-24 20:16:15.479857
1038	609	2026-02-24 20:16:16.205462
1039	617	2026-02-24 21:31:17.051223
1040	619	2026-02-24 21:32:24.845427
1041	619	2026-02-24 21:32:47.669912
1042	31	2026-02-24 22:02:49.351151
1043	269	2026-02-24 22:14:21.415783
1044	294	2026-02-24 22:28:49.489154
1045	620	2026-02-24 23:03:03.150887
1046	620	2026-02-24 23:05:05.559958
1047	570	2026-02-24 23:18:12.678412
1048	31	2026-02-24 23:32:57.140027
1049	621	2026-02-25 01:07:15.894505
1050	588	2026-02-25 01:21:29.029156
1051	588	2026-02-25 01:21:29.566178
1052	622	2026-02-25 03:12:16.197072
1053	624	2026-02-25 03:57:27.973817
1054	625	2026-02-25 05:43:55.794105
1055	285	2026-02-25 05:45:22.157082
1056	626	2026-02-25 05:59:47.086957
1057	626	2026-02-25 06:00:01.068088
1058	627	2026-02-25 06:06:11.68314
1059	627	2026-02-25 06:06:53.544492
1060	31	2026-02-25 06:52:48.490508
1061	31	2026-02-25 07:19:38.683656
1062	31	2026-02-25 08:34:20.568993
1063	31	2026-02-25 08:34:20.62132
1064	628	2026-02-25 09:33:39.440313
1065	394	2026-02-25 10:39:16.372385
1066	562	2026-02-25 19:44:41.435389
1067	562	2026-02-25 19:44:42.286896
1068	456	2026-02-25 19:47:32.645123
1069	630	2026-02-25 21:14:48.394406
1070	368	2026-02-25 21:17:59.84666
1071	631	2026-02-25 21:38:13.299926
1072	31	2026-02-25 21:52:44.602009
1073	31	2026-02-25 21:52:45.182354
1074	631	2026-02-25 22:33:13.914154
1075	626	2026-02-25 23:13:10.711083
1076	633	2026-02-26 00:06:05.535488
1077	31	2026-02-26 02:43:39.52649
1078	31	2026-02-26 02:43:40.192269
1079	368	2026-02-26 03:07:26.991249
1080	567	2026-02-26 05:26:07.698845
1081	31	2026-02-26 05:27:41.102211
1082	635	2026-02-26 06:27:55.514196
1083	31	2026-02-26 07:23:16.231047
1084	31	2026-02-26 07:23:16.341868
1085	636	2026-02-26 08:58:32.809717
1086	31	2026-02-26 10:07:05.793324
1087	637	2026-02-26 11:12:53.537182
1088	576	2026-02-27 00:56:06.10554
1089	576	2026-02-27 00:56:06.603601
1090	638	2026-02-27 05:12:29.187422
1091	31	2026-02-27 06:07:43.695014
1092	639	2026-02-27 07:43:45.05355
1093	31	2026-02-27 08:21:16.459149
1094	31	2026-02-27 08:21:17.098967
1095	456	2026-02-27 09:54:34.115986
1096	31	2026-02-27 22:14:51.85979
1097	201	2026-02-27 22:24:16.036678
1098	641	2026-02-28 01:04:46.729987
1099	641	2026-02-28 01:05:01.022579
1100	31	2026-02-28 03:11:14.945429
1101	92	2026-02-28 04:16:38.336587
1102	92	2026-02-28 04:16:46.786799
1103	222	2026-02-28 04:18:23.657608
1104	31	2026-02-28 05:23:53.5036
1105	31	2026-02-28 05:23:54.230109
1106	359	2026-02-28 06:47:59.259204
1107	31	2026-02-28 07:45:21.362682
1108	31	2026-02-28 08:02:54.94569
1109	31	2026-02-28 08:20:20.5395
1110	642	2026-02-28 14:43:04.882595
1111	31	2026-02-28 20:00:14.755257
1112	31	2026-02-28 20:00:15.656047
1113	31	2026-02-28 20:26:06.435557
1114	31	2026-02-28 23:48:15.608771
1115	607	2026-03-01 00:27:03.38501
1116	607	2026-03-01 00:27:04.013787
1117	31	2026-03-01 01:24:23.348053
1118	31	2026-03-01 04:28:18.325171
1119	31	2026-03-01 04:28:18.956644
1120	643	2026-03-01 04:46:55.921738
1121	31	2026-03-01 04:49:35.175325
1122	31	2026-03-01 04:49:35.683119
1123	643	2026-03-01 04:52:16.754513
1124	643	2026-03-01 05:00:16.730196
1125	643	2026-03-01 05:01:31.909186
1126	31	2026-03-01 06:23:33.953731
1127	252	2026-03-01 07:33:27.116449
1128	31	2026-03-01 07:45:13.118586
1129	382	2026-03-01 08:03:52.929789
1130	31	2026-03-01 08:41:08.833407
1131	644	2026-03-01 08:57:54.63548
1132	644	2026-03-01 08:58:57.951177
1133	644	2026-03-01 08:58:58.506571
1134	640	2026-03-01 22:41:10.288399
1135	31	2026-03-02 00:03:50.972489
1136	645	2026-03-02 04:24:56.551051
1137	646	2026-03-02 05:21:31.358983
1138	383	2026-03-02 08:53:55.171497
1139	31	2026-03-02 09:35:26.00952
1140	31	2026-03-02 10:15:30.791354
1141	470	2026-03-02 20:13:11.388836
1142	562	2026-03-02 21:33:19.43575
1143	562	2026-03-02 21:33:19.525573
1144	31	2026-03-02 22:36:35.518547
1145	31	2026-03-02 22:36:36.159383
1146	647	2026-03-03 02:41:44.206529
1147	647	2026-03-03 02:42:56.092511
1148	31	2026-03-03 08:14:26.55583
1149	92	2026-03-03 08:14:46.786277
1150	31	2026-03-03 08:24:51.446429
1151	31	2026-03-03 09:26:17.499958
1152	31	2026-03-03 09:26:18.240463
1153	31	2026-03-03 09:30:15.896233
1154	31	2026-03-03 09:33:47.078783
1155	31	2026-03-03 09:33:47.704539
1156	31	2026-03-03 09:36:23.128089
1157	628	2026-03-03 09:37:37.327853
1158	31	2026-03-03 10:07:51.007623
1159	562	2026-03-03 10:09:00.020625
1160	648	2026-03-03 10:21:41.041213
1161	649	2026-03-03 10:21:58.628192
1162	648	2026-03-03 10:23:57.676775
1163	31	2026-03-03 11:11:27.820813
1164	31	2026-03-03 18:38:16.897093
1165	31	2026-03-03 18:38:17.687819
1166	31	2026-03-03 21:52:48.824172
1167	650	2026-03-03 23:41:50.767638
1168	92	2026-03-04 00:41:08.011808
1169	31	2026-03-04 01:03:31.100358
1170	31	2026-03-04 01:18:23.493202
1171	92	2026-03-04 01:19:27.88042
1172	92	2026-03-04 03:10:59.374765
1173	31	2026-03-04 03:11:30.680652
1174	31	2026-03-04 04:02:42.060926
1175	620	2026-03-04 05:22:55.083536
1176	31	2026-03-04 06:08:29.612584
1177	651	2026-03-04 06:10:22.82936
1178	651	2026-03-04 06:10:23.372142
1179	651	2026-03-04 06:14:17.693002
1180	651	2026-03-04 06:16:07.912098
1181	651	2026-03-04 06:16:08.34536
1182	651	2026-03-04 06:16:09.801018
1183	651	2026-03-04 06:16:41.934421
1184	651	2026-03-04 06:18:46.341881
1185	651	2026-03-04 06:23:47.760695
1186	651	2026-03-04 06:24:14.872296
1187	31	2026-03-04 06:25:42.768952
1188	31	2026-03-04 06:43:00.012365
1189	652	2026-03-04 06:43:46.147263
1190	31	2026-03-04 06:46:45.031461
1191	31	2026-03-04 06:49:18.77555
1192	31	2026-03-04 06:50:02.585032
1193	31	2026-03-04 06:53:25.27171
1194	92	2026-03-04 06:54:37.887707
1195	31	2026-03-04 07:00:00.441922
1196	31	2026-03-04 07:00:01.850123
1197	31	2026-03-04 07:03:05.675736
1198	31	2026-03-04 07:11:21.431758
1199	31	2026-03-04 07:17:26.85995
1200	31	2026-03-04 07:18:19.189789
1201	31	2026-03-04 07:19:55.211739
1202	92	2026-03-04 07:34:52.775369
1203	31	2026-03-04 07:39:03.864664
1204	31	2026-03-04 07:39:40.287672
1205	31	2026-03-04 07:42:55.389592
1207	31	2026-03-04 07:57:59.301106
1206	31	2026-03-04 07:57:59.300659
1208	31	2026-03-04 08:08:46.23287
1209	31	2026-03-04 08:18:01.335156
1210	31	2026-03-04 08:37:14.794835
1211	31	2026-03-04 08:37:15.509985
1212	31	2026-03-04 09:43:07.791684
1213	31	2026-03-04 11:14:51.735257
1214	31	2026-03-04 11:14:51.96672
1215	653	2026-03-04 12:13:03.50865
1216	645	2026-03-04 18:51:39.840802
1217	92	2026-03-04 20:36:31.056192
1218	31	2026-03-04 21:46:36.769509
1219	31	2026-03-04 21:46:37.415441
1220	92	2026-03-04 22:23:47.587554
1221	654	2026-03-04 22:35:52.461952
1222	654	2026-03-04 22:37:23.225338
1223	359	2026-03-04 22:55:27.350633
1224	31	2026-03-04 23:17:09.196367
1225	92	2026-03-05 00:57:29.103034
1226	31	2026-03-05 01:02:21.196884
1227	31	2026-03-05 01:02:23.007855
1228	31	2026-03-05 02:03:22.832434
1229	31	2026-03-05 02:03:23.578494
1230	31	2026-03-05 02:04:01.043096
1231	31	2026-03-05 02:04:29.794572
1232	31	2026-03-05 02:06:54.169557
1233	31	2026-03-05 02:08:10.096424
1234	31	2026-03-05 02:10:59.108466
1235	31	2026-03-05 02:10:59.663407
1236	31	2026-03-05 02:16:54.082915
1237	31	2026-03-05 02:18:39.896539
1238	31	2026-03-05 02:20:44.31731
1239	92	2026-03-05 02:21:59.014116
1240	31	2026-03-05 02:23:30.580139
1241	31	2026-03-05 02:26:49.441335
1242	31	2026-03-05 02:47:49.054553
1243	655	2026-03-05 02:48:31.314198
1244	657	2026-03-05 05:42:04.381786
1245	31	2026-03-05 05:48:39.556062
1246	31	2026-03-05 05:48:40.144129
1247	655	2026-03-05 05:58:30.673505
1248	588	2026-03-05 06:01:29.001082
1249	31	2026-03-05 06:58:44.736367
1250	658	2026-03-05 07:10:36.079427
1251	658	2026-03-05 07:12:23.866834
1252	658	2026-03-05 07:12:26.086595
1253	31	2026-03-05 07:33:00.289436
1254	658	2026-03-05 07:35:13.192124
1255	31	2026-03-05 07:39:25.732294
1256	31	2026-03-05 07:56:11.009995
1257	659	2026-03-05 07:58:08.156545
1258	659	2026-03-05 07:58:29.636195
1259	659	2026-03-05 08:00:38.289133
1260	31	2026-03-05 08:14:05.199825
1261	31	2026-03-05 08:38:19.785441
1262	31	2026-03-05 08:46:57.467321
1263	31	2026-03-05 08:52:16.676557
1264	562	2026-03-05 09:21:53.825811
1265	660	2026-03-05 09:24:08.803786
1266	31	2026-03-05 09:25:58.928059
1267	31	2026-03-05 09:25:59.437308
1268	394	2026-03-05 09:52:22.087261
1269	31	2026-03-05 09:59:20.946841
1270	661	2026-03-05 10:19:05.428936
1271	661	2026-03-05 10:20:31.219517
1272	265	2026-03-05 13:06:16.097188
1273	31	2026-03-05 16:52:31.101916
1274	657	2026-03-05 22:16:30.796443
1275	31	2026-03-05 22:25:15.081825
1276	31	2026-03-05 22:36:49.142094
1277	547	2026-03-06 01:21:17.418471
1278	547	2026-03-06 01:21:17.57957
1279	31	2026-03-06 02:00:11.690892
1280	31	2026-03-06 03:42:51.744675
1281	31	2026-03-06 03:42:52.457818
1282	662	2026-03-06 04:21:57.514875
1283	662	2026-03-06 04:25:39.815353
1284	662	2026-03-06 04:27:10.761831
1285	662	2026-03-06 04:27:11.702722
1286	625	2026-03-06 05:50:34.858639
1287	31	2026-03-06 06:12:13.353836
1288	31	2026-03-06 06:12:14.022425
1289	31	2026-03-06 06:26:10.874987
1290	31	2026-03-06 06:26:11.620356
1291	31	2026-03-06 07:48:28.70152
1292	31	2026-03-06 07:48:29.046647
1293	31	2026-03-06 07:48:29.058122
1294	31	2026-03-06 07:48:29.181892
1295	31	2026-03-06 07:48:29.186908
1296	31	2026-03-06 07:48:29.576483
1297	603	2026-03-06 07:52:39.847009
1298	31	2026-03-06 08:45:12.44637
1299	31	2026-03-06 08:45:13.045333
1300	663	2026-03-06 12:32:19.589634
1301	663	2026-03-06 12:34:02.161693
1302	31	2026-03-06 20:54:19.685638
1303	31	2026-03-06 20:54:20.493231
1304	31	2026-03-06 23:36:27.313562
1305	664	2026-03-07 00:47:33.124552
1306	31	2026-03-07 01:56:17.779142
1307	31	2026-03-07 01:56:18.780446
1308	665	2026-03-07 02:05:22.521016
1309	31	2026-03-07 02:09:17.036401
1310	31	2026-03-07 03:35:54.723559
1311	31	2026-03-07 08:46:45.27678
1312	666	2026-03-07 11:47:24.693878
1313	667	2026-03-08 00:08:09.385309
1314	667	2026-03-08 00:11:56.159233
1315	31	2026-03-08 00:34:46.271419
1316	668	2026-03-08 01:25:43.447124
1317	657	2026-03-08 05:26:18.279902
1318	657	2026-03-08 05:26:18.811064
1319	31	2026-03-08 06:06:03.600917
1320	31	2026-03-08 08:10:02.110722
1321	31	2026-03-08 08:16:57.176279
1322	628	2026-03-08 20:28:57.080497
1323	456	2026-03-08 20:47:31.269617
1324	456	2026-03-08 20:47:31.484506
1325	669	2026-03-09 02:05:41.86089
1326	91	2026-03-09 02:06:14.585194
1327	670	2026-03-09 02:21:17.400561
1328	670	2026-03-09 02:22:00.041618
1329	670	2026-03-09 02:23:41.402125
1330	669	2026-03-09 02:28:02.343061
1331	669	2026-03-09 02:28:02.777371
1332	669	2026-03-09 02:34:31.922155
1333	671	2026-03-09 03:18:57.510881
1334	671	2026-03-09 03:19:03.979032
1335	672	2026-03-09 05:38:08.315107
1336	672	2026-03-09 05:38:21.834126
1337	503	2026-03-09 05:53:33.677885
1338	667	2026-03-09 08:49:46.763578
1339	503	2026-03-09 10:01:02.40966
1340	673	2026-03-09 12:32:00.749701
1341	658	2026-03-09 23:09:49.696231
1342	658	2026-03-09 23:09:49.795654
1343	658	2026-03-09 23:31:58.205391
1344	658	2026-03-09 23:32:04.940664
1345	31	2026-03-10 00:48:25.444584
1346	31	2026-03-10 00:50:08.800797
1347	674	2026-03-10 01:14:26.460729
1348	31	2026-03-10 01:41:55.402267
1349	31	2026-03-10 01:50:30.994922
1350	675	2026-03-10 03:48:53.863137
1351	657	2026-03-10 04:23:00.303514
1352	658	2026-03-10 07:30:06.03847
1353	677	2026-03-10 08:06:19.487933
1354	359	2026-03-10 08:22:02.436036
1355	359	2026-03-10 08:23:47.681248
1356	391	2026-03-10 08:30:06.969817
1357	678	2026-03-10 08:52:49.310292
1358	679	2026-03-10 09:03:25.367175
1359	680	2026-03-10 09:49:47.009919
1360	456	2026-03-10 10:20:22.31307
1361	456	2026-03-10 10:20:22.725639
1362	681	2026-03-10 23:37:14.39518
1363	681	2026-03-10 23:37:53.525541
1364	479	2026-03-11 00:20:43.251711
1365	479	2026-03-11 00:20:43.434393
1366	31	2026-03-11 02:16:33.51777
1367	31	2026-03-11 02:16:33.719466
1368	31	2026-03-11 02:27:43.159947
1369	657	2026-03-11 02:31:58.905574
1370	31	2026-03-11 02:50:19.186624
1371	682	2026-03-11 03:00:39.632858
1372	31	2026-03-11 03:05:20.984508
1373	31	2026-03-11 03:05:21.636627
1374	222	2026-03-11 03:23:12.210299
1375	683	2026-03-11 04:37:30.506906
1376	31	2026-03-11 04:50:02.596203
1377	31	2026-03-11 04:50:32.282126
1378	31	2026-03-11 05:18:57.395686
1379	31	2026-03-11 05:22:15.980508
1380	31	2026-03-11 05:33:37.744815
1381	31	2026-03-11 06:18:03.978522
1382	31	2026-03-11 06:21:23.207129
1383	31	2026-03-11 06:34:10.437756
1384	31	2026-03-11 06:39:58.704213
1385	31	2026-03-11 06:42:49.049026
1386	31	2026-03-11 06:45:02.127316
1387	31	2026-03-11 07:04:39.573615
1388	31	2026-03-11 07:11:59.929456
1389	31	2026-03-11 07:19:15.687314
1390	31	2026-03-11 07:29:10.825736
1391	31	2026-03-11 07:38:51.678846
1392	31	2026-03-11 07:41:17.322033
1393	31	2026-03-11 07:46:06.16905
1394	31	2026-03-11 07:55:07.809308
1395	31	2026-03-11 07:55:08.020089
1396	31	2026-03-11 07:58:22.920766
1397	31	2026-03-11 08:00:55.223592
1398	31	2026-03-11 08:00:55.22388
1399	31	2026-03-11 08:00:55.221862
1400	31	2026-03-11 08:05:48.261163
1401	31	2026-03-11 08:10:50.692867
1402	31	2026-03-11 08:14:43.335765
1403	31	2026-03-11 08:20:17.420396
1404	31	2026-03-11 08:43:38.162229
1405	31	2026-03-11 08:47:10.899631
1406	31	2026-03-11 08:57:52.276549
1407	31	2026-03-11 08:57:52.813035
1408	31	2026-03-11 09:03:33.635186
1409	31	2026-03-11 09:05:58.56432
1410	31	2026-03-11 09:10:14.422323
1411	31	2026-03-11 09:12:09.61329
1412	31	2026-03-11 09:13:22.96222
1413	31	2026-03-11 09:22:18.617581
1414	31	2026-03-11 09:24:21.514046
1415	31	2026-03-11 09:27:41.247577
1416	31	2026-03-11 09:40:23.607286
1417	31	2026-03-11 09:40:58.117235
1418	31	2026-03-11 09:42:18.809539
1419	31	2026-03-11 09:43:42.516309
1420	31	2026-03-11 09:44:36.233163
1421	31	2026-03-11 09:50:28.262317
1422	31	2026-03-11 09:51:45.945473
1423	31	2026-03-11 09:52:54.157535
1424	31	2026-03-11 09:53:45.176049
1425	31	2026-03-11 09:59:07.701047
1426	31	2026-03-11 10:04:08.180317
1427	31	2026-03-11 10:05:09.283918
1428	31	2026-03-11 10:09:34.522254
1429	31	2026-03-11 10:13:39.085076
1430	31	2026-03-11 10:16:41.656645
1431	31	2026-03-11 10:18:16.703781
1432	31	2026-03-11 10:19:50.444756
1433	31	2026-03-11 10:24:27.880012
1434	31	2026-03-11 10:24:28.899797
1435	31	2026-03-11 10:27:04.583902
1436	685	2026-03-11 11:42:05.068375
1437	686	2026-03-11 12:30:49.426118
1438	686	2026-03-11 12:37:22.691496
1439	31	2026-03-11 18:36:08.679535
1440	456	2026-03-11 19:13:04.392018
1441	456	2026-03-11 19:13:04.676879
1442	31	2026-03-11 23:04:48.847121
1443	31	2026-03-12 01:55:12.301786
1444	621	2026-03-12 01:55:50.276297
1445	31	2026-03-12 02:10:49.817405
1446	657	2026-03-12 02:17:59.181997
1447	657	2026-03-12 02:17:59.72328
1448	31	2026-03-12 04:20:49.02211
1449	31	2026-03-12 04:20:49.754864
1450	31	2026-03-12 05:02:59.122616
1451	31	2026-03-12 05:31:27.368941
1452	31	2026-03-12 06:42:06.187311
1453	31	2026-03-12 06:42:06.293918
1454	31	2026-03-12 08:43:41.426653
1455	657	2026-03-12 08:57:56.560106
1456	657	2026-03-12 08:57:57.129098
1457	31	2026-03-12 09:07:33.415694
1458	359	2026-03-12 09:55:49.992723
1459	31	2026-03-12 10:10:15.923918
1460	687	2026-03-12 10:16:16.281056
1461	667	2026-03-12 11:38:34.399066
1462	688	2026-03-12 19:05:52.995145
1463	31	2026-03-12 22:05:11.994314
1464	504	2026-03-12 22:40:06.520806
1465	504	2026-03-12 22:40:06.971845
1466	31	2026-03-12 23:05:46.739833
1467	657	2026-03-12 23:14:38.870671
1468	657	2026-03-12 23:25:20.441789
1469	657	2026-03-12 23:28:49.771288
1470	31	2026-03-13 03:11:11.183727
1471	31	2026-03-13 05:14:56.694995
1472	31	2026-03-13 06:24:57.994169
1473	31	2026-03-13 09:12:11.928553
1474	31	2026-03-13 20:37:39.757479
1475	31	2026-03-14 02:08:26.718552
1476	31	2026-03-14 02:08:26.805968
1477	92	2026-03-14 03:50:13.423906
1478	92	2026-03-14 03:56:40.041619
1479	31	2026-03-14 04:39:33.088149
1480	31	2026-03-14 06:44:56.652953
1481	31	2026-03-14 06:44:56.744444
1482	31	2026-03-14 08:16:47.044525
1483	31	2026-03-14 09:09:00.048929
1484	690	2026-03-14 09:51:16.605484
1485	690	2026-03-14 09:52:28.567734
1486	290	2026-03-14 21:59:47.889198
1487	657	2026-03-15 01:33:33.394555
1488	657	2026-03-15 01:33:33.543042
1489	31	2026-03-15 02:26:47.609685
1490	456	2026-03-15 04:43:59.218963
1491	456	2026-03-15 04:43:59.948018
1492	31	2026-03-15 06:52:40.066827
1493	31	2026-03-15 07:11:19.866489
1494	31	2026-03-15 08:04:40.793756
1495	31	2026-03-15 08:04:40.946553
1496	692	2026-03-15 10:49:50.562671
1497	359	2026-03-15 11:02:38.285964
1498	657	2026-03-15 23:01:15.447106
1499	489	2026-03-15 23:28:32.183106
1500	576	2026-03-16 00:57:04.549471
1501	576	2026-03-16 00:57:04.779505
1502	588	2026-03-16 01:53:41.361599
1503	588	2026-03-16 01:53:41.817998
1504	31	2026-03-16 02:07:56.371934
1505	693	2026-03-17 00:02:33.730015
1506	693	2026-03-17 00:03:35.560666
1507	125	2026-03-17 04:09:20.99498
1508	31	2026-03-17 07:56:55.905686
1509	31	2026-03-17 07:56:56.524705
1510	359	2026-03-17 08:01:55.217842
1511	589	2026-03-17 08:14:48.446508
1512	31	2026-03-17 08:56:49.467235
1513	694	2026-03-17 21:32:43.567438
1514	695	2026-03-17 22:06:16.766899
1515	695	2026-03-17 23:05:16.45592
1516	696	2026-03-18 02:55:45.029742
1517	696	2026-03-18 03:04:53.905391
1518	696	2026-03-18 03:06:38.552904
1519	31	2026-03-18 03:07:56.777436
1520	31	2026-03-18 03:07:56.957868
1521	31	2026-03-18 03:08:12.340214
1522	697	2026-03-18 03:46:46.795772
1523	31	2026-03-18 09:20:15.921507
1524	31	2026-03-18 09:20:15.981666
1525	31	2026-03-18 09:22:03.225173
1526	31	2026-03-18 09:22:42.24629
1527	31	2026-03-18 09:29:17.442512
1528	31	2026-03-18 09:32:29.226404
1529	31	2026-03-18 09:33:21.238744
1530	31	2026-03-18 09:41:36.468329
1531	31	2026-03-18 09:41:36.551454
1532	31	2026-03-18 10:11:16.743305
1533	31	2026-03-18 10:27:45.837635
1534	31	2026-03-18 18:43:38.428977
1535	31	2026-03-18 18:44:04.456745
1536	31	2026-03-18 18:49:23.200472
1537	31	2026-03-18 18:49:23.802008
1538	456	2026-03-18 19:56:22.364027
1539	456	2026-03-18 19:56:22.611905
1540	456	2026-03-18 20:44:12.616448
1541	456	2026-03-18 20:44:13.581577
1542	567	2026-03-18 22:11:22.27345
1543	92	2026-03-19 02:43:23.188244
1544	504	2026-03-19 05:20:15.217201
1545	359	2026-03-19 09:21:40.293089
1546	31	2026-03-19 09:51:57.367799
1547	470	2026-03-19 19:26:41.208335
1548	31	2026-03-19 22:51:06.572271
1549	31	2026-03-19 23:37:40.280716
1550	31	2026-03-19 23:37:40.983844
1551	654	2026-03-20 05:23:35.955266
1552	654	2026-03-20 05:23:37.032479
1553	698	2026-03-20 09:03:34.170982
1554	31	2026-03-20 11:42:29.099267
1555	31	2026-03-20 22:34:58.12059
1556	31	2026-03-20 22:34:58.767132
1557	562	2026-03-20 23:00:50.055816
1558	562	2026-03-20 23:00:50.938168
1559	92	2026-03-21 06:07:40.398534
1560	31	2026-03-21 06:13:28.518961
1561	31	2026-03-21 06:18:08.258373
1562	31	2026-03-21 06:18:08.920436
1563	359	2026-03-21 08:10:15.936627
1564	667	2026-03-21 09:42:28.769711
1565	31	2026-03-21 18:59:26.565771
1566	252	2026-03-21 21:20:34.423907
1567	92	2026-03-22 04:27:13.636059
1568	31	2026-03-22 04:31:20.857506
1569	31	2026-03-22 04:34:30.550936
1570	699	2026-03-22 11:14:23.690284
1571	699	2026-03-22 11:14:36.334543
1572	31	2026-03-23 08:00:09.609274
1573	31	2026-03-23 08:00:09.729574
1574	667	2026-03-23 11:21:14.585411
1576	658	2026-03-23 21:01:57.358751
1575	658	2026-03-23 21:01:57.357981
1577	700	2026-03-24 02:01:47.088784
1578	456	2026-03-24 02:23:27.957225
1579	456	2026-03-24 02:23:28.021534
1580	359	2026-03-24 08:16:12.875237
1581	359	2026-03-24 08:16:13.330038
1582	667	2026-03-24 10:12:54.968771
1583	631	2026-03-25 04:36:26.602768
1584	359	2026-03-25 09:28:26.249282
1585	31	2026-03-25 09:38:27.270011
1586	31	2026-03-25 09:38:27.323005
1587	125	2026-03-25 21:17:53.409616
1588	504	2026-03-26 00:20:41.421204
1589	504	2026-03-26 00:20:43.560239
1590	92	2026-03-26 09:28:35.561593
1591	667	2026-03-26 19:38:08.969349
1592	701	2026-03-27 05:06:49.15733
1593	701	2026-03-27 05:08:21.912674
1594	31	2026-03-27 08:59:45.86297
1595	562	2026-03-28 03:34:39.241929
1596	562	2026-03-28 03:34:39.343627
1597	485	2026-03-28 09:28:14.73155
1598	702	2026-03-28 10:56:37.243328
1599	703	2026-03-28 13:58:57.171519
1600	452	2026-03-29 01:48:17.988055
1601	31	2026-03-29 02:16:56.101682
1602	31	2026-03-29 02:16:56.129309
1603	359	2026-03-29 04:44:11.282037
1604	244	2026-03-29 09:52:34.72606
1605	470	2026-03-29 13:57:38.15215
1606	456	2026-03-30 04:14:42.545688
1607	456	2026-03-30 04:14:42.818413
1608	702	2026-03-30 07:02:29.867995
1609	702	2026-03-30 07:02:30.522877
1610	31	2026-03-30 08:31:46.136503
1611	31	2026-03-30 08:31:46.195774
1612	391	2026-03-30 09:46:18.370676
1613	705	2026-03-30 10:06:08.376192
1614	92	2026-03-31 05:38:29.3106
1615	92	2026-03-31 05:38:29.797235
1616	657	2026-03-31 05:47:33.358909
1617	31	2026-03-31 06:29:13.049227
1618	661	2026-03-31 08:04:05.310135
1619	31	2026-03-31 09:21:18.329363
1620	706	2026-04-01 02:34:14.479992
1621	31	2026-04-01 09:57:32.132482
1622	359	2026-04-01 10:35:29.882063
1623	92	2026-04-02 03:14:37.336456
1624	92	2026-04-02 03:15:10.259519
1625	31	2026-04-02 03:15:33.868639
1626	31	2026-04-02 03:15:35.183472
1627	31	2026-04-02 03:16:42.208169
1628	92	2026-04-02 03:18:53.366195
1629	92	2026-04-02 03:22:01.704887
1630	92	2026-04-02 03:22:02.657518
1631	92	2026-04-02 03:27:11.455454
1632	92	2026-04-02 03:30:11.12423
1633	31	2026-04-02 03:38:22.51166
1634	31	2026-04-02 04:14:13.327059
1635	31	2026-04-02 04:18:56.108671
1636	31	2026-04-02 04:24:55.072288
1637	31	2026-04-02 04:29:06.119791
1638	31	2026-04-02 09:51:21.92768
1639	31	2026-04-02 10:19:14.471256
1640	456	2026-04-02 10:30:15.045131
1641	456	2026-04-02 10:30:15.162154
1642	31	2026-04-03 03:34:29.920029
1643	678	2026-04-03 03:40:29.492262
1644	31	2026-04-03 05:49:41.396161
1645	678	2026-04-03 07:22:30.922905
1646	678	2026-04-03 07:22:31.518785
1647	31	2026-04-03 08:00:27.278923
1648	707	2026-04-03 10:40:15.519296
1649	707	2026-04-03 10:40:20.203167
1650	707	2026-04-03 10:40:21.015634
1651	707	2026-04-03 10:40:21.760272
1652	707	2026-04-03 10:40:22.823848
1653	707	2026-04-03 10:40:23.207036
1654	707	2026-04-03 10:40:39.132229
1655	707	2026-04-03 10:40:39.175732
1656	707	2026-04-03 10:40:39.180636
1657	707	2026-04-03 10:40:39.181085
1658	707	2026-04-03 10:40:39.413253
1659	707	2026-04-03 10:40:39.461561
1660	707	2026-04-03 10:40:43.644053
1661	707	2026-04-03 10:40:43.655333
1662	707	2026-04-03 10:40:43.659924
1663	707	2026-04-03 10:40:43.667528
1664	707	2026-04-03 10:40:43.937514
1665	697	2026-04-03 11:19:53.45828
1666	708	2026-04-03 23:35:52.602349
1667	31	2026-04-04 02:07:45.650697
1668	31	2026-04-04 05:15:24.406886
1669	31	2026-04-04 07:44:23.246188
1670	710	2026-04-05 06:37:52.121556
1671	31	2026-04-05 09:18:31.352513
1672	31	2026-04-06 02:04:43.446928
1673	31	2026-04-06 04:46:43.301677
1674	31	2026-04-06 07:35:51.711159
1675	31	2026-04-06 09:00:56.07309
1676	31	2026-04-06 09:00:57.535573
1677	359	2026-04-06 11:59:46.117887
1678	703	2026-04-06 15:42:23.409283
1679	703	2026-04-06 20:56:15.241323
1680	31	2026-04-07 10:27:45.515548
1681	711	2026-04-07 13:46:23.530681
1682	711	2026-04-07 13:48:32.7597
1683	711	2026-04-07 13:58:00.92049
1684	485	2026-04-08 09:44:17.042146
1685	31	2026-04-08 10:30:33.797541
1686	385	2026-04-08 19:50:28.02791
1687	31	2026-04-09 03:19:30.101837
1688	31	2026-04-09 03:19:30.968544
1689	714	2026-04-09 21:50:20.053985
1690	715	2026-04-09 23:26:27.86623
1691	31	2026-04-10 09:35:26.105664
1692	31	2026-04-10 09:35:26.729175
1693	716	2026-04-10 12:10:16.197049
1694	31	2026-04-10 22:55:46.701679
1695	717	2026-04-10 23:06:23.506363
1696	718	2026-04-11 08:07:53.713626
1697	359	2026-04-11 10:22:54.596941
1698	718	2026-04-11 11:00:58.421335
1699	718	2026-04-11 11:00:58.468736
1700	719	2026-04-11 21:45:56.257154
1701	718	2026-04-11 23:38:59.364223
1702	718	2026-04-11 23:46:55.43597
1703	470	2026-04-12 04:24:28.2783
1704	680	2026-04-12 08:10:19.010849
1705	31	2026-04-12 08:54:12.741761
1706	721	2026-04-12 10:49:45.443507
1707	718	2026-04-12 23:47:14.960181
1708	718	2026-04-12 23:47:16.100454
1709	459	2026-04-13 01:32:48.315059
1710	125	2026-04-13 03:21:19.354228
1711	125	2026-04-13 03:21:19.6139
1712	722	2026-04-13 06:52:17.624062
1713	31	2026-04-13 10:29:04.040937
1714	31	2026-04-13 10:29:04.118569
1715	607	2026-04-13 11:22:17.037985
1716	607	2026-04-13 11:22:17.065106
1717	92	2026-04-14 08:13:25.230874
1718	31	2026-04-14 09:00:12.38275
1719	31	2026-04-14 09:00:13.061869
1720	723	2026-04-14 11:07:00.499166
1721	723	2026-04-14 11:08:19.847614
1722	485	2026-04-14 12:19:37.069182
1723	416	2026-04-15 03:41:03.985385
1724	31	2026-04-15 04:15:43.455034
1725	385	2026-04-15 20:46:20.84094
1726	504	2026-04-16 06:24:23.85446
1727	359	2026-04-16 09:34:41.932429
1728	31	2026-04-16 10:49:23.596949
1729	92	2026-04-17 05:59:42.781906
1730	359	2026-04-17 10:43:09.241183
1731	626	2026-04-18 04:27:09.428743
1732	726	2026-04-19 00:02:02.758025
1733	726	2026-04-19 00:03:31.628451
1734	730	2026-04-19 05:07:51.694119
1735	730	2026-04-19 05:15:52.144556
1736	456	2026-04-19 05:29:14.781439
1737	456	2026-04-19 05:29:15.540329
1738	731	2026-04-19 06:28:40.139878
1739	731	2026-04-19 06:29:33.389665
1740	456	2026-04-19 07:55:29.343012
1741	456	2026-04-19 07:55:30.343043
1743	718	2026-04-20 01:05:52.374885
1742	718	2026-04-20 01:05:52.373579
1744	479	2026-04-20 05:37:55.82791
1745	732	2026-04-20 09:37:02.420378
1746	732	2026-04-20 09:37:33.410354
1747	31	2026-04-20 10:18:33.339678
1748	31	2026-04-21 11:01:27.8952
1749	588	2026-04-21 22:41:19.426671
1750	588	2026-04-21 22:41:19.418574
1751	733	2026-04-22 02:06:47.479483
1752	734	2026-04-22 02:17:15.379683
1753	718	2026-04-22 05:37:48.237503
1754	31	2026-04-22 08:02:01.266219
1755	31	2026-04-22 08:02:01.937524
1756	359	2026-04-22 19:42:22.024381
1757	359	2026-04-22 19:52:44.912245
1758	359	2026-04-22 19:52:45.258241
1759	680	2026-04-22 20:49:39.81041
1760	596	2026-04-23 05:56:05.462324
1761	596	2026-04-23 05:56:06.152254
1762	359	2026-04-23 11:45:03.752708
1763	736	2026-04-23 12:08:07.725495
1764	385	2026-04-24 21:50:37.276486
1765	31	2026-04-25 00:25:12.045839
1766	201	2026-04-25 02:24:33.290672
1767	718	2026-04-25 03:01:45.030621
1768	31	2026-04-25 03:14:12.833656
1769	31	2026-04-26 00:25:53.866211
1770	657	2026-04-26 05:18:44.202911
1771	657	2026-04-26 05:18:44.895734
1772	738	2026-04-27 02:11:52.333345
1773	739	2026-04-27 06:35:06.177777
1774	546	2026-04-27 08:59:34.375635
1775	740	2026-04-27 09:09:46.929948
1777	359	2026-04-27 10:00:03.627703
1776	359	2026-04-27 10:00:03.639345
1778	734	2026-04-28 00:27:49.065774
1779	238	2026-04-28 10:14:03.989802
1780	718	2026-04-28 12:25:58.941086
1781	470	2026-04-29 10:04:47.140737
1782	92	2026-04-29 22:11:15.832832
1783	31	2026-04-29 22:32:26.437494
1784	31	2026-04-29 22:58:16.17828
1785	657	2026-04-29 23:06:34.743324
1786	657	2026-04-29 23:06:34.871991
1787	31	2026-04-29 23:17:48.527901
1788	31	2026-04-29 23:17:49.112567
1789	92	2026-04-30 02:48:49.314782
1790	31	2026-04-30 09:42:04.436071
1791	31	2026-04-30 09:44:06.447561
1792	31	2026-04-30 09:52:18.963046
1793	394	2026-04-30 10:19:32.820931
1794	31	2026-04-30 10:22:17.530445
1795	741	2026-04-30 10:23:08.402061
1796	107	2026-04-30 10:23:19.941804
1797	31	2026-04-30 10:25:13.233717
1798	742	2026-04-30 10:25:27.329988
1799	742	2026-04-30 10:25:41.933703
1800	742	2026-04-30 10:25:42.580808
1801	743	2026-04-30 10:30:25.032113
1802	746	2026-04-30 11:15:34.055442
1803	359	2026-04-30 11:21:45.560844
1804	743	2026-04-30 12:38:53.700545
1805	31	2026-04-30 18:40:19.806155
1806	31	2026-04-30 21:06:59.310658
1807	603	2026-04-30 21:14:14.253021
1808	603	2026-04-30 21:14:14.878974
1809	749	2026-04-30 22:14:56.742845
1810	749	2026-04-30 22:16:39.704954
1811	747	2026-05-01 00:12:22.925845
1812	751	2026-05-01 01:15:04.374086
1813	751	2026-05-01 01:18:34.937071
1814	752	2026-05-01 02:38:05.536162
1815	385	2026-05-01 02:48:54.128499
1816	752	2026-05-01 03:27:00.19583
1817	752	2026-05-01 03:29:06.503306
1818	752	2026-05-01 03:34:19.363107
1819	31	2026-05-01 05:52:11.972663
1820	31	2026-05-01 05:52:49.342686
1821	752	2026-05-01 05:58:28.612681
1822	31	2026-05-01 07:28:22.213409
1823	31	2026-05-01 09:17:20.118916
1824	363	2026-05-01 11:05:23.844604
1825	31	2026-05-01 21:10:33.045913
1826	753	2026-05-02 01:28:05.084438
1827	753	2026-05-02 01:32:52.088037
1828	301	2026-05-02 03:42:31.998531
1829	754	2026-05-02 05:42:35.174146
1830	359	2026-05-02 05:55:38.423948
1831	31	2026-05-02 07:36:36.249083
1832	31	2026-05-02 07:36:36.389998
1833	31	2026-05-02 09:45:46.331327
1834	31	2026-05-02 09:45:46.523306
1835	478	2026-05-03 04:15:20.182527
1836	31	2026-05-03 10:40:41.729651
1837	31	2026-05-03 10:40:41.849904
1838	688	2026-05-03 21:40:37.251893
1839	688	2026-05-03 21:40:37.78057
1840	290	2026-05-03 22:22:05.505436
1841	464	2026-05-03 22:38:26.014141
1842	464	2026-05-03 22:39:31.941375
1843	359	2026-05-03 23:11:02.073115
1844	359	2026-05-03 23:11:02.418879
1845	755	2026-05-03 23:21:05.702967
1846	755	2026-05-03 23:21:54.593796
1847	31	2026-05-04 02:26:08.970469
1848	31	2026-05-04 02:26:09.452755
1849	688	2026-05-04 04:42:19.434904
1850	688	2026-05-04 04:43:21.680807
1851	31	2026-05-04 09:07:20.266229
1852	31	2026-05-04 09:07:20.897729
1853	92	2026-05-04 09:08:34.141928
1854	758	2026-05-04 09:20:03.866919
1855	706	2026-05-04 09:20:08.448718
1856	256	2026-05-04 09:20:47.02994
1857	706	2026-05-04 09:22:40.908813
1858	706	2026-05-04 09:22:41.487998
1859	759	2026-05-04 09:23:25.917601
1860	759	2026-05-04 09:24:29.463075
1861	421	2026-05-04 09:24:34.391221
1862	760	2026-05-04 09:24:42.800284
1863	761	2026-05-04 09:25:54.460063
1864	198	2026-05-04 09:25:54.803464
1865	762	2026-05-04 09:26:39.390803
1866	496	2026-05-04 09:26:47.201339
1867	763	2026-05-04 09:27:43.705393
1868	746	2026-05-04 09:28:38.063015
1869	761	2026-05-04 09:28:48.346495
1870	763	2026-05-04 09:29:55.151093
1871	482	2026-05-04 09:30:34.132552
1872	706	2026-05-04 09:32:04.134075
1873	201	2026-05-04 09:33:21.980071
1874	766	2026-05-04 09:34:38.272739
1875	768	2026-05-04 09:37:02.870211
1876	496	2026-05-04 09:37:29.631054
1877	201	2026-05-04 09:39:31.435202
1878	362	2026-05-04 09:43:14.48305
1879	385	2026-05-04 09:44:35.568697
1880	31	2026-05-04 09:45:59.347026
1881	669	2026-05-04 09:46:12.808645
1882	485	2026-05-04 09:46:16.852874
1883	770	2026-05-04 09:49:20.881724
1884	516	2026-05-04 09:49:23.400865
1885	771	2026-05-04 09:49:39.353276
1886	770	2026-05-04 09:50:17.418207
1887	769	2026-05-04 09:51:47.320581
1888	772	2026-05-04 09:51:50.461891
1889	31	2026-05-04 09:53:46.667997
1890	767	2026-05-04 09:58:33.723323
1891	603	2026-05-04 10:00:55.700974
1892	603	2026-05-04 10:00:55.689285
1893	773	2026-05-04 10:04:44.074172
1894	773	2026-05-04 10:07:47.413416
1895	774	2026-05-04 10:08:53.297577
1896	375	2026-05-04 10:11:31.02645
1897	177	2026-05-04 10:20:03.746006
1898	615	2026-05-04 10:20:06.240263
1899	31	2026-05-04 10:28:35.144759
1900	31	2026-05-04 10:28:35.905193
1901	775	2026-05-04 10:33:05.977238
1902	775	2026-05-04 10:33:32.049851
1903	238	2026-05-04 10:40:34.859941
1904	413	2026-05-04 10:42:25.696217
1905	31	2026-05-04 10:51:54.471257
1906	31	2026-05-04 10:51:55.135694
1907	776	2026-05-04 10:54:49.051262
1909	456	2026-05-04 11:00:18.423022
1908	456	2026-05-04 11:00:18.410133
1910	777	2026-05-04 11:12:07.382335
1911	515	2026-05-04 11:20:15.781824
1912	31	2026-05-04 11:26:30.27943
1913	778	2026-05-04 12:03:00.880735
1914	778	2026-05-04 12:03:13.33976
1915	779	2026-05-04 12:06:43.983557
1916	779	2026-05-04 12:08:05.986407
1917	780	2026-05-04 12:53:36.601815
1918	781	2026-05-04 13:54:20.488368
1919	782	2026-05-04 18:09:57.233383
1920	233	2026-05-04 20:26:07.151595
1921	783	2026-05-04 20:27:17.497425
1922	757	2026-05-04 20:38:15.955563
1923	757	2026-05-04 20:39:17.384171
1924	784	2026-05-04 20:43:57.378492
1925	784	2026-05-04 20:46:11.813266
1926	751	2026-05-04 21:13:29.567973
1927	751	2026-05-04 21:13:30.09358
1928	785	2026-05-04 21:17:39.049267
1929	31	2026-05-04 21:20:13.07229
1930	777	2026-05-04 21:24:05.157785
1931	31	2026-05-04 21:51:58.982603
1932	615	2026-05-04 22:38:13.369687
1933	615	2026-05-04 22:38:13.452428
1934	564	2026-05-04 23:06:00.707317
1935	564	2026-05-04 23:06:00.720155
1936	564	2026-05-04 23:06:01.387825
1937	576	2026-05-04 23:18:37.37926
1938	786	2026-05-04 23:27:29.725281
1939	786	2026-05-04 23:53:37.637998
1940	786	2026-05-04 23:54:58.244229
1941	470	2026-05-05 00:17:35.807375
1942	787	2026-05-05 01:23:54.393593
1943	788	2026-05-05 01:59:21.26784
1944	31	2026-05-05 02:22:52.281229
1945	790	2026-05-05 04:13:07.114452
1946	792	2026-05-05 05:30:04.596341
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matches (id, customer_id, horse_id, is_liked, created_at) FROM stdin;
49	452	43	t	2025-12-23 06:28:30.719667
50	452	14	t	2025-12-23 06:29:51.803909
53	452	64	t	2025-12-23 13:03:41.163333
54	452	47	t	2025-12-23 13:05:13.091798
57	31	30	f	2025-12-30 00:46:36.318157
84	522	36	t	2026-02-04 17:53:04.972341
86	541	67	t	2026-02-05 03:11:49.472988
87	541	49	t	2026-02-05 03:16:56.067123
88	546	36	t	2026-02-05 07:55:20.343066
97	564	64	t	2026-02-17 08:27:18.530755
98	564	52	t	2026-02-17 08:27:45.222802
99	564	32	t	2026-02-17 08:28:56.724292
101	588	75	t	2026-02-23 10:44:30.205946
103	594	75	t	2026-02-23 21:06:41.928127
104	594	73	t	2026-02-23 21:06:51.984277
148	736	81	t	2026-04-23 12:18:12.342829
149	736	80	t	2026-04-23 12:21:01.401264
108	605	61	t	2026-02-24 01:37:19.439529
109	621	76	t	2026-02-25 01:08:56.636945
110	621	75	t	2026-02-25 01:08:58.960202
111	627	32	t	2026-02-25 06:08:31.631987
112	631	76	t	2026-02-25 21:40:06.990857
113	31	75	t	2026-02-26 07:35:10.300964
16	89	14	f	2025-07-29 01:24:26.515832
17	94	14	t	2025-09-02 01:18:05.624413
18	98	28	t	2025-09-10 06:23:50.373799
114	655	88	t	2026-03-05 02:57:36.660002
115	655	89	t	2026-03-05 02:57:39.339824
21	233	14	t	2025-10-16 21:18:48.627149
116	562	75	t	2026-03-05 09:22:53.473293
23	238	47	t	2025-10-18 11:47:32.676053
25	238	36	f	2025-10-18 12:06:35.029501
24	238	36	t	2025-10-18 12:06:35.028193
150	736	74	t	2026-04-23 12:24:10.755164
27	267	49	t	2025-10-25 22:17:36.951458
28	267	47	t	2025-10-25 22:18:16.547748
117	547	75	f	2026-03-06 01:22:01.160266
29	267	36	t	2025-10-25 22:21:30.103432
31	267	34	t	2025-10-25 22:22:03.887171
119	670	69	t	2026-03-09 02:24:52.52305
120	687	73	t	2026-03-12 10:21:17.784429
121	700	81	t	2026-03-24 02:06:02.05814
33	295	52	t	2025-11-07 06:50:30.778054
151	736	30	t	2026-04-23 12:29:24.301912
35	301	52	t	2025-11-08 14:22:59.954569
152	470	30	t	2026-04-29 10:09:18.824987
122	125	74	t	2026-03-25 21:19:10.396969
39	309	52	t	2025-11-09 16:07:08.412114
40	326	28	t	2025-11-19 04:38:39.227756
153	743	97	t	2026-04-30 10:37:02.826244
45	385	36	t	2025-12-15 21:32:28.274587
47	428	62	t	2025-12-21 10:15:18.349834
48	385	64	t	2025-12-22 11:06:11.962318
154	752	61	t	2026-05-01 02:47:08.807963
67	262	64	t	2025-12-30 07:05:21.690209
155	752	104	t	2026-05-01 03:00:13.488842
62	31	57	f	2025-12-30 01:30:29.070467
156	363	77	t	2026-05-01 11:12:14.121841
157	482	52	t	2026-05-04 09:42:42.266615
63	31	55	f	2025-12-30 01:30:32.81366
64	31	62	f	2025-12-30 01:38:14.372251
65	31	52	f	2025-12-30 01:38:57.035231
59	31	61	f	2025-12-30 01:30:21.356705
56	31	64	f	2025-12-30 00:46:11.130837
158	482	47	t	2026-05-04 09:43:09.506758
129	470	52	t	2026-03-29 14:01:34.755257
132	661	97	t	2026-03-31 08:05:34.037858
130	661	75	t	2026-03-31 08:04:45.556357
133	706	75	t	2026-04-01 02:34:57.556234
135	706	64	t	2026-04-01 02:38:21.197965
137	706	65	t	2026-04-01 03:20:04.359291
139	706	52	t	2026-04-01 03:21:32.706593
140	385	75	t	2026-04-08 19:51:16.896555
141	718	28	t	2026-04-11 11:01:41.123604
142	723	75	t	2026-04-14 11:08:58.037678
123	485	75	f	2026-03-28 09:28:22.752716
124	485	95	f	2026-03-28 09:28:40.223203
71	485	67	f	2026-01-31 02:41:51.061389
73	485	65	f	2026-01-31 02:42:10.8586
76	485	30	f	2026-01-31 02:43:16.296953
126	485	93	f	2026-03-28 09:28:47.482259
128	485	77	f	2026-03-28 09:29:05.970996
143	416	75	t	2026-04-15 03:41:33.30817
144	416	77	t	2026-04-15 03:43:06.432197
145	734	95	t	2026-04-22 02:19:45.043948
146	734	36	t	2026-04-22 02:41:35.536198
147	736	89	t	2026-04-23 12:13:01.685192
159	482	14	t	2026-05-04 09:43:56.800781
160	385	108	t	2026-05-04 09:52:58.431889
161	238	108	t	2026-05-04 10:45:21.683611
162	757	108	t	2026-05-04 20:39:32.516904
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, customer_id, owner_id, horse_id, content, sender_type, created_at, is_read) FROM stdin;
98	736	92	81	$20k his portfolio of videos and information is available via our website - https://www.performancehorsesales.com.au/horses-for-sale/ktl-icon	owner	2026-04-29 22:12:03.640482	f
96	736	107	30	Could I please have a price on skittles?	customer	2026-04-23 12:29:45.711928	t
99	736	107	30	Hi, he is priced at 45k but owners are wanting a fast sale, so would be negotiable.	owner	2026-04-30 10:24:14.949589	f
73	395	116	49	Can you please send through video	customer	2026-02-04 09:00:18.020394	t
88	395	116	49	Hi Chris, thank you for your message.  Are you on what’s app? I can send through his videos for.  Look forward to hearing from you.	owner	2026-02-07 01:17:09.363895	f
51	238	116	52	Hello, how much are you asking?	customer	2025-11-14 08:36:43.682915	t
55	238	116	52	Thanks Tina, we are searching for a 130-140 Showjumper for my daughter.  We are located in Aus, so would have to factor in import expenses as well if coming across from NZ.  Our budget is healthy for the right horse	customer	2025-11-29 06:02:44.177044	t
62	381	107	30	Hi there, could you please let me know how much you are asking for skittles?\nThanks \nErica	customer	2025-12-09 19:26:53.791298	t
89	381	107	30	Hi Erica, his asking price is $45k. My apologies for not getting back to you sooner	owner	2026-02-10 20:08:20.187165	f
91	413	92	64	Hi There, can I ask what you are asking for this mare and your location please?  Are you free for a chat?  Thanks. Natalie	customer	2026-02-23 08:11:47.871929	t
92	413	92	64	Hi Natalie, Thanks for your message.  Please read on to see how to access the horse’s portfolio of video and information, as well as how to book a phone call or viewing.   Here is the link to our website with all of our current listings, including Inca DP.  http://www.performancehorsesales.com.au/horses-for-sale   On the horse’s ads are links to their portfolio of video and information direct from the owners.  If you would like to request additional photos or video, book a phone call or a viewing with the owner, please fill in the obligation free EOI form on that page.   Meanwhile, we are happy to answer any questions via email or SMS.  Best wishes,  Sally Empringham  Performance Horse Sales	owner	2026-02-24 03:19:56.457569	f
90	413	91	75	Hi Wil, how much are you asking for Krug please? Are you free to chat? Thank you. Natalie	customer	2026-02-23 07:55:15.628094	t
93	734	170	36	Hi How much would you like for him?	customer	2026-04-22 02:32:13.844856	f
94	734	170	36	How much would you like for him?	customer	2026-04-22 02:38:02.363696	f
54	238	116	52	Hi Bella, Thank you for your message. Vixen is in our platinum tier which is over NZD $100,000. If you could please let me know what you're looking for in a horse, any presences and budget range, I can forward you info on relevant horses. Kind Regards, Tina	owner	2025-11-23 20:18:19.524062	t
56	238	116	52	Hi Bella, Vixen is NZ$150k (approx $132k AUD).   She is certainly international quality and capable of being a top serious horse in the future.  She has just turned 6 yrs old, so is jumping 1.20m - 1.30m very easy.  We have jumped her bigger at home, all with ease, so she definitely be a super horse for your daughter in the future.  How much has your daughter done?   Be great if you would like to come and try her and see if it's a good fit.  We also have two other horses that could really suit, both stunning and both 6 yr olds Cassafina Xtreme and Wolf Xtreme. They are NZ$100k (approx $88k AUD).   Look forward to hearing back.  If easier, let me know your phone number and I can call to discuss.  Cheers Sharleen	owner	2025-11-30 07:33:00.037158	t
43	238	196	47	HI Bella, Clovelly is priced at $18,500 :)	owner	2025-10-18 21:42:32.127761	t
97	238	91	75	Price please	customer	2026-04-28 10:18:13.759332	f
95	736	92	81	I’m new to this platform but interested in a price please?	customer	2026-04-23 12:18:31.504602	t
100	752	92	61	Hi, Is Milo still available?\nWould he be suitable for a capable junior rider? \nMy daughter is 13-years-old & moving up from her 14.2hh pony. \nShe has just started riding a horse at our stables that is 16.1hh & she is enjoying the transition.\nShe has been riding since she was 5 years old. \nWe are looking for a safe & sensible horse that will look after his rider. \nOK, if he is a little forward, so long as he is responsive & looks after his rider. \nMust be 100% sound with no veterinary issues. \nNo vices or quirks.\nCould you also please advise the asking price & where Milo is located?\nKind Regards Julia	customer	2026-05-01 03:22:08.442151	t
101	752	92	61	Hi Julia, Please see our website for the horses portfolio of information and video: https://www.performancehorsesales.com.au/horses-for-sale/dp-easter-island	owner	2026-05-04 09:12:50.946274	f
102	238	688	108	Hi, would Charlie suit Young rider? How much are you asking for him?	customer	2026-05-04 10:45:00.975905	f
42	238	196	47	Hi, how much are you asking for Clovelly?	customer	2025-10-18 12:00:58.037348	f
53	323	111	32	A price ?	customer	2025-11-16 11:15:35.064748	f
81	490	92	64	Hi Soph, Here is the link to her full ad and portfolio of videos - https://www.performancehorsesales.com.au/horses-for-sale/inca-dp Best wishes, Sally Empringham	owner	2026-02-05 01:29:26.895953	f
84	358	92	61	Hi Bronte, yes, he is. Please see our website for full details. My number is 0428239317 Best wishes, Sally	owner	2026-02-05 05:27:44.826236	f
70	358	92	61	Hi Is this guy still available? I am able to give you a call? Thanks Bronte	customer	2026-01-21 10:43:11.623212	t
74	490	92	64	Hi, would love some videos and a price please.	customer	2026-02-04 09:05:57.756906	t
\.


--
-- Data for Name: owners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.owners (id, business_name, contact_name, email, password, created_at) FROM stdin;
1	Equestrian Center	John Smith	owner@example.com	password123	2025-05-15 01:25:24.767751
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at, notify_matches, notify_messages, notify_updates, notify_digest) FROM stdin;
4	31	https://web.push.apple.com/QPj32pk1dgSEIdA07Urzd3CVHkLdbFT6IB2tIb5FeU1uatPqIDW6ke0okJYJ-19GEwAiU_3o7Iuh_MUp41Wg6Qmm_ON6WQR1a-nql-BCteGb3NfnpsvnjIZ0PMKeNQKEjlmb7kAhq2_3sxEmS_Ba3YC0BUyRd3tM6pODji9XaBg	BP424kXXdzCLEz40bJfU6ozJmfyjNl8SaJM0YPjhQ2FgS4xk311XjaoTk162rYMYzT+v1TC43B32uqAm04I+H1U=	Puy7AyZ9K5kCFI71/f1nZw==	2025-10-13 21:09:01.471007	t	t	t	t
5	31	https://web.push.apple.com/QFcAJpAGqom9YxxGguHlLI08tWUf5vP_1amadbBqN6JGeSHS1OHKVnkbfZ5J0OJ8ixziDxUyS6B7Y_Rz21oLCRPskKK6CxXeEBrZMYFIq-3h7cHd7ke1LevJ_e-HA7-Vc6rQJcKymx5o7oYICEpdZKbzvTdCKJmGDxaYi1eQsvQ	BCbcBcpa6fPznLsuHzghUjg9Lg99v2mPXH1NOLj56iuvrpC6YKkXf9NUH94hGH51gpYjEeJEOPFbFdQ5Mi680kY=	neJNy5wf+u4I4DtIuIeSSQ==	2025-10-14 08:21:55.542162	t	t	t	t
8	196	https://fcm.googleapis.com/fcm/send/eq5cPQMD0Zc:APA91bHyYmFIx3s6OZJf8fv4TDyT1ObDpxCmTr8UlzSFHm8w9n1ZliS3NsRPZn66b0cYrnscdW3tUY7d2WXxx9Sx5cxvAQlVAJhGcmuGft2_ZXUuT7IqL7XM0d2yACGzG1fgXJa4ql3G	BAMSl45QAaDZuN+xI04Wi7XisHdtBhT2P2x+LXAG7hwzD0TVKRMqlju5KIwEpE+rOUTEGTpnlRY88CujZD8ItyQ=	D2bsQVC3sW93niDHiL58Hg==	2025-10-26 00:40:06.14223	t	t	t	t
3	31				2026-03-05 02:24:14.936	t	t	t	t
30	567	https://web.push.apple.com/QFEb8y6f14jZzsU7uHc_xGJVIDve8YjlIqrf294_C0cD_YBMZsewQgluDuImLnTrhMjBwfJ66D1oTeTzna-M5eqGkA5uNwanzBbSFEn9QJWiUK_pguQa63fJb5SINoTtwbTHj-LmOph39f4NDoFYL329xwUDojX4uMCkuvuYGig	BGAD5DOtz7yBl5CwvloMT8UUSvLqfTHtGUp0L4bBw16v20d9YjUYyJIoY7p8RTYWyRNmnTjzTEcSXn/LlGAXPFc=	A9rYyq2YrAAdzSVcXSRS7w==	2026-03-18 22:12:08.142306	t	t	t	t
19	604	https://updates.push.services.mozilla.com/wpush/v2/gAAAAABpnPLH-cP84GsaWg1K7ycTaCXTRXc-qcd_Dcu2odMFIk0rtzmfxgRQKbs2L6HI--BdZ3JNGFz-pk_OeaE3tzYwS-Kh_Td22rtFeDmr6Q6DTkQ6H0gFHUyWIEA9k1wgXosu0ReQI-Xynzuk3cqh95F5zoZLVR5OVhdvTbpKMhmEHPy_8Xk	BNv5FZkGun7VA8+fE7/PkRvyipb/Yozru/vuQ3hjuOaLa+kERgy3OhWOayut3r2yaS9Nq99H8gMygisuUbiIzck=	WhIjsMpRnL1JFfvjMKY21w==	2026-02-24 00:37:28.007671	t	t	t	t
20	637	https://fcm.googleapis.com/fcm/send/c8MpY5G_IRE:APA91bHR7o6S4qU9YGYzCJoFoOPrDgmbiPQIlW84EGVg8zPhkLQLiMrzc5vFCA3jFOnCD-q3xNI7vKsXq8lDUI4kTv3wAZvOjVMHdSCoG0vAqD0aAjkSK4PsCxamuLmTDGIoGuLPisXl	BH8ufWsJH/n/ymL7PBbTxotmXB2Em3Ng91cLU2dLElOhlEG0lbLicOHQMknX/o0LL9XSSX3m1jR3WoWC0Z/wPzw=	Yn0tcOh4th8ZMTIB6fHAsg==	2026-02-26 11:13:53.440997	t	t	t	t
21	643	https://fcm.googleapis.com/fcm/send/cDVOaZ7cUIc:APA91bFUg4p87uuRXGclYmZKazvfpn-eL3CZWPfTHOb5lu18qfYilMUaJvioMHm3_ixumENgTPKw13Red3Rte0ejGpjar2Z4ryqvGBA44cb7LgqNRB6_47Aa1RRdyTtYfh39PyPQNY4t	BGpqLlxyDq9i7U311NT+tHVE08pd1vaPB3gCvgq/U4UtE+KoKYAGNWEa11OJRVd6fGPVn256oaUAyLovYw633iA=	ZSnwsYhZxEl+bTC1wigd8w==	2026-03-01 04:52:56.562279	t	t	t	t
22	652	https://web.push.apple.com/QIeC5SckciyU6f-QHdx5scDoXp6TtEBPalz4LagZwemfS615Qj2eySujj6jpTcmUHcwDeej1qQRzHsx6Y9XLSkDH-Em5QEXLmYDYq7kxKrGISZJzj33q7lpO3bjZRszZSVDBzrQhZjveKShzZqRM2P9DHrNBt2Uvu72fQASEfKQ	BBO98SccpPs6vYzu/ni9D2e5kvfp/EBpFGS/weGb7IO6jHsMRx0Km5O14RSaHesgdk0+fyWb75UZ+jU8wmPTx4Y=	ncAShQVmyp7iUHapx0CYpQ==	2026-03-04 06:44:25.849799	t	t	t	t
6	92	https://web.push.apple.com/QMVNyxJawlu1rGn2xCKP1ZTK2e1bnvtJsy-Mc3unBD7Y4KN5sGqyvlPd3NNnLqmFJwruydwqprUzWskw2RRCjXwrwCnbbn-Zvz9nGW7YMj4cISArxM_W-8R0SRD4Tx0fQsDQSyhUOhhtveFrsDXZaVxNPf7i44GydI41DSX8AEU	BL/jZczcu121BsANlU+TlWBSSNDplivoRmJswC9L/RB31RcHW6TE/IHdkqPO5LJoYi0UIHVIegG64Fp6ZImPprA=	U2MvsPAaR07V2E6N8bLohQ==	2026-03-04 06:57:09.788	t	t	t	t
7	31	https://web.push.apple.com/QDD5ifG3cq5VS7uf6VeW0206bDvF7Kf-2CFL4l_58IzeJ3Ypn19_eAe5mNnEiaMyziZn2Sr3zQyYey3NYmJV6Qzm0htK88fGhzQiqUQ06RaUnXp9oLKbQXTpcwPqInP2VcD6W0gLnYJp1kmsdlFlsQh3G8zxddf5NKLmCl9iKlc	BOuTOZVcZtl+EDbE6tL3/+BAXDnRjNwFm8hJAvwyz6yzBrT/haM7d0QMCqC1i+MvC6JV+AstHFKLTUIoe+T7dok=	dAiDNFGzwQef9YMrT/2gDg==	2025-10-25 03:26:58.719542	t	t	t	t
14	456	https://fcm.googleapis.com/fcm/send/eIa-Ot3MXXI:APA91bFzEGJKsr5Ma8M7tozAS4J3ZSA6qFyWUwAYGPSsPDkJHPY_VV5KwqIC8yvgh-gSa6KPyx15upFzbgW32nvtdosmkH3OKZhGMPAjxDKatqPebxyS6v5jfgesHxxvDuM8YNfZ_dD0	BBNpuCSjPu6oNTkTEWOCi7ZcbqB3WMU60YlxUw/bicSkgthgj5viLk0ryfkv+fFJAdwXmnSKDv8Ig9fxc7OQIwQ=	xtazczMUtvOKnJs4LZobsg==	2026-01-10 02:49:44.663662	t	t	t	t
23	92	https://fcm.googleapis.com/fcm/send/c_bCHfPNgvQ:APA91bFwoUjuya_qDNYfKjYco2OKkN4itGX34aWOOunS0GPXz3WaffSriEH4W-DlZZ5u9hYFkFCZoYRxZUnTxFq3_QCYCqO8eALHfGQOSbJbvSwzDN9YIRMcUk7uPhae1KseE9XhBuQq	BGyn2AY0ziZS0UQNBDYa/8tTP4dLkqFEDuHMvo4FPMatK+dMAlX+QJFWL+YQcKD5NBN+vPojPsh/fRFeE3ERRdk=	tS5sZRgandx+0YNkEnUP+Q==	2026-03-04 20:37:08.526678	t	t	t	t
17	530	https://fcm.googleapis.com/fcm/send/cFmhiYHiTEM:APA91bF4ghNZdJVHfMoqYc1_WbiupehIBuENcHSuORMGGPT9fjhx4x2L3w0xMTOK5mffeL_4Ms3rU9paXKzWn-qLtmu8HWdhq1BSu6M2XCnPLuw1yEuYGBVB242sshbyviSqydG4bi_T	BOKD95fpvi1steVhJb9lrYjDKBhAcBOYY+jf5yo61KZYRTdgc6Hv89e2jmolVeUEnwXgtV7cGt6z7DnzUGPxqtY=	u6usk05XrJJIQB10C6Nu+Q==	2026-02-04 23:08:54.977783	t	t	t	t
24	657	https://fcm.googleapis.com/fcm/send/fh57_1Ur_7U:APA91bHKmCG4Uq-rPRK_RpUZyX69MPNGfGmRocsAT_CefDsx687FQx5P5CDWjm2CWDcfZUy_c6uBzcq73blnRV6Iw-OB7U0LYf_4R8fnd6vyy5GrNOEEVyraXPpLxyes6D90r8G-P1nc	BNnhlA/CZpD6YubA0Mz0D80tWUXhZUfJONAaodgCzIr9ItnuY8S02yt9GKXO4PqwKWQ5JA5eCUatStYK6t1cKYw=	h0UShi6+W9s6epB+6CzVrw==	2026-03-05 05:42:40.518763	t	t	t	t
31	702	https://fcm.googleapis.com/fcm/send/c3UWI4K_0ME:APA91bEL3evLWmFC9hrfbcZIFKBI1OwAYfAsxChq4JeeXLChQ0atL7em4mO7P130Zp5-1sxqP4VGm4vzNWYpE_jeFwlZFx5FTh9cI6sRrXKEmR-hl_yi5VkFQyKFj2iDqZUaYiWvZypb	BFJsJTSF2Ap9g8qE9NG+7v5mbodHh78VgQlrr1A87OcJ4fJODhjiQtXg8sljNVhUIWfIDtBeMRp/0cVZogvNcoY=	17DTpHd+80Pu+Rf7kuXEAw==	2026-03-30 07:07:26.73038	t	t	t	t
25	667	https://web.push.apple.com/QDR-uSHWFpFPPQimzerukOiH0jCwshp4eRI1Gnrd4QHZsbhvaHxjsHyJ-AfcrVKaoADlt5e2FyQqrrjx0w_3-9JXBbd60WQyefz30EDmOC5aDf3BM-JvRgEhxlPiQqnV6mkTGuvnZCF9EHHXAbxKikO1vOnjZY4w79YgoKwBLw0	BOCWDfFH7nU4h15Qoiue8s73u64wHTSV7yBR3R/8MK1SWWOdZDPCI4Ky6bn9LuN0gfpKjMqrPg99nNGuFm8HOow=	gOtwFpyEPp+mZSaaD11xCw==	2026-03-08 00:22:52.961756	t	t	t	t
32	733	https://fcm.googleapis.com/fcm/send/fo74ih33-Wc:APA91bGqJmlH4Ws0N0uP3-EwiyajtQNIPoPW0YrTsHDavMzLPueegyM-82j7FDVbzRlQGkrlpawsgMFXB5W5DuZv5Hw1VKVdEcka6FBIaR0P3fENP41JUdHuq7BnaK4-myBnU1HTydiZ	BFLCgraLvISlissZR6+pCdkpqc0UrKJ8YMqy631vNfkdoqiwtuimvw50WA1AvE3dQmQIjOkArhMMcijYOrz5Y1o=	WNSIbacJDBF8u9xW++a2Lg==	2026-04-22 02:07:47.677888	t	t	t	t
26	658	https://fcm.googleapis.com/fcm/send/dzcgJxzTJxQ:APA91bFH8IDcds4o2ADmjks7MLJTyEQaLCgP3WyuWXus4Ux_FrV45D7ype9VZ0GX4Vi07UWkL-6tV-L5A6ZTiDc5ZfbkUciF7nM3OaT5ZLcZXHH0_B_gwK7SBVIAHoTFL09g3ymg9kKI	BN9IRCOvNvATGmRLRZoO+7kNpnStQHqUtXiQmzyeAUD2HNpM8m8XBHWoQErxAPmuSS2mX2N4ZqK+i6kI5cCkXEw=	kTox5uZ56eBWCegm9Z1ImQ==	2026-03-09 23:10:59.324166	t	t	f	f
27	675	https://web.push.apple.com/QBNlXNvqU4KobFaMjI59KodU45_zkMfNJruhZi7mIfSb_AgVQTti_hztt7vhkyixaN_ncWa6OqgkGs93xx4WL9jISxZ16Ebc8UEhN-eadAJ-OWJa4NWd8RYKLah_Fcc6C_CPaiesZNtQK5DTEv84AO2vepWfDH69UHZSN5cSUnA	BLnFjIlexvyUzf4oudoz0X+VwJAmj4xW/fYsHCyoUNaRwMXFZuTm9a122z9SNR4OBD3dOEuoFnet1mUmhi9O3mk=	qqWVgWfrTP6lZ6+0V7YLcQ==	2026-03-10 03:49:18.196678	t	t	t	t
28	657	https://web.push.apple.com/QNqFW7Lb5QaThTzwZ7r8B47pncbMr2IfcEPK5Zq2CHjElCFGSTNgjNsgy5xZy65qsFHwsFctSo2RibVArau8oYqijbrtRfCzL6_3i4RAbdwL3HSgflquXucwNsbfc4IZV2t1xrewBmK-1CS_rbEmLw4PqZkoqbZ6GywYGeBjiFE	BHktC5CCCVkXk9DPvH8erDwQlege9Lx/m+k8oBTzohFs4y/sqA4naHrCHIrmbE7nT72xTxaJ5Xw9+8bvBiZ6Xbc=	MawAQql9n4tNkLv1O4Zm2w==	2026-03-12 23:29:03.140093	t	t	t	t
29	696	https://fcm.googleapis.com/fcm/send/enggB08qWAs:APA91bHDXVpO5KmaNnx3D0QLbyNn6RSXZIND2dLveVwAh5yNz9aFT1Alxe6x2MUiNWwtFacSkKat6tj1hHo3e27zRQ1c6I5daMyVksqYvo9L2SQWx9cnVb-AAoVRH72rXzhPdIK3pvGu	BBmeUBRYJzABBthabYWmZ2kFuQAqsNufrTY4FPZzpq+meYVjflkIjSpgCYmquAYzmOmJOpuv+smXXWMg/XvwKw8=	cfY5CXsVPCOLUuK3Y5Q+CQ==	2026-03-18 02:56:03.363243	t	t	t	t
33	734	https://fcm.googleapis.com/fcm/send/f9Js4_cZ3Gk:APA91bEq6JxZcYb-0rDEnrgbUv4fMTK3N3l63rcyw1Z61yS8FLZ7YYIYGsU7-MldcEgSO1J1wqszT8t6woKFipMJBbfUsUTPwM9m8EwGrK13UJ3dCyeSlEUoE-igHf6fX28y4E9k1u1S	BB9rJhFleJldxk+AFd+RnXlzK2o5b8IwJ+fsISP9wcs+oM+PMhDTkfS/dKj+EaN9s6v4nNvTjUxF921b/+a1+94=	KZBEucTY8Dk+W+glgZzzhA==	2026-04-22 02:38:25.595889	t	t	t	t
34	31	https://fcm.googleapis.com/fcm/send/dr2jI6Unans:APA91bEArXPslEz4Ygfnw32cs6gPgUh30Aa42J32jmqZAhBU4exsspqV7CaqTTX7j9jXQhYWty7NttRMgMvQE_GK-bdHFYV_fRK8uNAwoiillkq8LveNc4s6aC-89Mp9h-xU96xXVp9V	BDqEd8QH6ivv8tLzZCzgFeYTawJqY4IjO1HMkG0KWRTuZcCpLsCGUXR4ukfQmIyXLYXjUJo8h+HSJb5KIlHCfA8=	btAIW34s6GXZud9Br9dYgA==	2026-04-30 09:53:19.993569	t	t	t	t
35	752	https://fcm.googleapis.com/fcm/send/dCr1wtN8pow:APA91bEIZY-S3EB7V0Y5-0fRQY6IxjOAf_VNOx3AvdCRpOOQ3OxtryyUGScEMkxI4ThKW0hfR_s6wtuFPCaqsP0PYAxORWnxCt3Pgqb4rz_oZJVXwaIMo5LaI-t3jqzRzBVk9OmNiFQT	BPB0vn3lWgUWojlIhvF16P7C/ENj9ZkvgdDVdCWMcMAIVKAUct4E9qoZnmrvoyzN8IpJ++PHgodyX/d+g0cgmCg=	4y/oq72YKm1S9J1fyMIXYg==	2026-05-01 02:41:53.209009	t	t	t	t
36	753	https://fcm.googleapis.com/fcm/send/eh13wCli7l8:APA91bHjN6wAhIfh7e4WD96gut4zzOmk4yBf0qYen-RV1SY8OMZYO-lI5tfbzzkWrJPxekBY1Lb0q1ym1VGl1i0NDYNIAn8YPT2JRK82l98MVdNSj1AbnoZ7B7FtN94RpZ0Y736PDVk2	BKoHXAt1CFdVkC9EiwcHN4bZxXmyFAbPle6l625PSdmxpacOaGvqBz4QG4JjWzxNZ2X3ILOIC4ntHCShesMU3NA=	f9L8qXMyL3EeYYI1XcCF6g==	2026-05-02 01:29:30.148358	t	t	t	t
37	496	https://web.push.apple.com/QPM40vks5tRW5OWJ7AVK2zMFkFAkxP46vkaL4YzdiCMUVv6vFfR4QYcj0y2gAqAc6nRPvaLZQeYCWE9BY1xaSVq7gT3qoPnclLOVS5J0qQ_dpvdv5vs37QWM-pWCZrbVcz82zuC8ACRvUpqjFWKnleJ2l8xTXX7ithcbUt2aHio	BByVZR70bGDmamlb8M5bOzHNH9FnLAZMtxpjweOaF8fKgbM/TpB+6yq7upyCrf53cYO8LlGoisnbBlGFUQIzbkE=	SO0YOAynqy15ZaXURMwFnQ==	2026-05-04 09:37:50.29648	t	t	t	t
38	706	https://fcm.googleapis.com/fcm/send/dpXc7Ijj_PU:APA91bHEUjBCNT7G7_wShxpZ-7nEDzwT-oLTbbyHJAHkXkKffW3oaWvA2ylOKmrrGoNN6CWW16g_i8Oh2UCJb8Q6xrnaqvWiBz03fYIxZFhWguVcQJdsHVxO4lgRIFi8sUpEPtizUljs	BIiVi707jFrsQkriBnzSUvAN1ghfpQY1TSFIdwkamx9Mjo8l0pL1zib4pHAxVsNhL+79+yXXBRnUEphvp6m+4+Y=	wighN7X0kFJpZ8Gm9HkGsw==	2026-05-04 13:03:03.159144	t	t	t	t
\.


--
-- Data for Name: saved_searches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.saved_searches (id, user_id, name, disciplines, levels, breeds, age_min, age_max, height_min, height_max, sexes, characteristics, price_min, price_max, currency, location_country, location_radius_km, email_notifications, is_active, created_at, updated_at, sire, dam_sire) FROM stdin;
2	49	Dark chestnut dressage horse	{Dressage}	{"Prix St. Georges"}	{}	\N	\N	\N	\N	{Gelding}	{}	\N	\N	\N	\N	\N	t	t	2025-07-07 06:39:49.824	2025-07-07 06:39:49.824	\N	\N
1	31	Jumping Mini Prix	{Jumping}	{"Mini Prix"}	{}	\N	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	t	f	2025-06-26 11:04:30.556	2025-07-14 09:11:09.794	\N	\N
3	31	Jumping Junior	{Jumping}	{Junior}	{}	\N	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	t	f	2025-07-14 09:11:26.932	2025-07-14 09:11:36.964	\N	\N
5	94	All Disciplines	{Jumping,Dressage,Eventing}	{}	{}	\N	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	t	t	2025-09-02 01:18:32.938	2025-09-02 01:18:32.938	\N	\N
4	31	Jumping Junior	{Jumping}	{Junior}	{}	\N	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	t	f	2025-07-14 09:11:57.715	2025-10-13 03:08:42.329	\N	\N
7	262	Mini PrIx 	{Jumping}	{}	{}	\N	\N	\N	\N	{Gelding}	{}	\N	\N	\N	\N	\N	t	t	2025-12-30 07:18:35.743	2025-12-30 07:18:35.743	\N	\N
8	262	Junior	{Jumping}	{Junior}	{}	\N	\N	\N	\N	{Gelding}	{}	\N	\N	\N	\N	\N	t	t	2025-12-30 07:23:08.751	2025-12-30 07:23:08.751	\N	\N
6	31	Jumping Horse 60-200000	{Jumping}	{}	{}	\N	\N	\N	\N	{}	{}	20000	200000			\N	t	t	2025-10-13 03:09:57.017	2026-02-04 09:26:10.473		
9	92	Top level eventer	{Eventing}	{3*,2*}	{}	\N	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	t	t	2026-03-04 21:55:59.128	2026-03-04 21:55:59.128	\N	\N
10	92	Novice Dressage Horse	{Dressage}	{Novice}	{}	\N	\N	\N	\N	{}	{}	\N	\N	\N	\N	\N	t	t	2026-03-04 21:56:26.795	2026-03-04 21:56:26.795	\N	\N
11	265	Dressage	{Dressage}	{Preliminary,Novice,Elementary}	{}	4	14	16.2	17.3	{Gelding}	{}	\N	50000	AUD	Australia	\N	t	t	2026-03-05 13:09:02.809	2026-03-05 13:09:14.643		
12	667	Emma	{}	{}	{}	5	15	15	16	{Gelding}	{}	\N	20000	\N	Australia	\N	t	t	2026-03-08 00:23:49.741	2026-03-08 00:23:49.741	\N	\N
13	674	Jaz	{Jumping,Eventing}	{}	{}	6	13	14.3	16	{}	{}	\N	10000	AUD	Australia	\N	t	t	2026-03-10 01:19:28.411	2026-03-10 01:19:28.411	\N	\N
14	657	Horse Search	{Jumping,Dressage,Eventing}	{}	{}	7	14	16	17.3	{Mare,Gelding}	{}	\N	27500	AUD	Australia	\N	t	t	2026-03-12 23:26:39.4	2026-03-12 23:26:39.4	\N	\N
15	696	Dressage Horse for Sam	{Dressage}	{Medium,Advanced,"Prix St. Georges","Intermediate II","Grand Prix"}	{}	7	0	\N	16.2	{}	{}	\N	\N	AUD	Australia	\N	t	t	2026-03-18 02:59:09.597	2026-03-18 02:59:09.597	\N	\N
16	702	All rounder >$20000	{Eventing,Jumping}	{1.10m,Amateur,"Mini Prix","Grand Prix",EvA95,EvA80,"Intermediate I"}	{}	6	13	15.3	17	{}	{}	\N	20000	AUD	Australia	\N	f	f	2026-03-28 11:06:00.757	2026-03-28 11:06:00.757	\N	\N
17	702	>$25000	{Eventing,Jumping}	{Children,1.10m,1.20m,"Under 1m",Preliminary,Elementary,Medium,Novice,"Mini Prix","Intermediate I",EvA60,EvA95,EvA80,Amateur,Junior,"Young Rider",2*,4*,5*,3*,1*,"Grand Prix","Intermediate II","Prix St. Georges",Advanced,1.30m}	{}	5	13	15.3	16.3	{Gelding,Mare}	{}	\N	25000	AUD	Australia	\N	t	t	2026-03-28 11:07:30.707	2026-03-30 07:09:02.623		
18	722	AOR all-rounder	{}	{}	{}	\N	15	15	\N	{}	{}	\N	15000	AUD	Australia	\N	t	t	2026-04-13 06:57:02.32	2026-04-13 06:57:02.32	\N	\N
19	730	All rounder in Australia 	{}	{Children}	{}	5	15	14.2	15.3	{}	{}	0	5000	AUD	Australia	\N	t	t	2026-04-19 05:26:26.478	2026-04-19 05:26:26.478	\N	\N
20	732	Eventing Schoolmaster	{Eventing}	{2*,3*,4*,5*}	{}	\N	18	\N	\N	{}	{}	\N	\N	\N	Australia	\N	t	t	2026-04-20 09:38:25.668	2026-04-20 09:38:25.668	\N	\N
21	596	Eventing horse 	{Eventing}	{Junior,EvA60}	{}	4	11	16	16.3	{}	{}	\N	17000	AUD	Australia	\N	t	t	2026-04-23 05:57:53.853	2026-04-23 05:57:53.853	\N	\N
22	752	School Master	{Jumping,Dressage,Eventing}	{1.10m,1.20m,"Young Rider",Junior}	{}	6	12	16	16	{Gelding}	{}	1000	35000	AUD	Australia	\N	f	f	2026-05-01 03:06:00.462	2026-05-01 03:06:00.462	\N	\N
23	752	School Master	{Jumping,Dressage,Eventing}	{1.10m,1.05m,1.20m,Junior,"Young Rider"}	{}	6	12	16	16.2	{Gelding}	{}	1000	35000	AUD	Australia	\N	f	f	2026-05-01 03:08:04.126	2026-05-01 03:08:04.126	\N	\N
24	752	School Master	{Jumping,Dressage,Eventing}	{1.05m,1.10m,1.20m,Junior,"Young Rider"}	{}	6	12	16	16.2	{Gelding}	{}	1000	35000	AUD	Australia	\N	t	t	2026-05-01 03:36:03.692	2026-05-01 03:36:03.692	\N	\N
25	754	All - rounder 	{Dressage,Eventing}	{}	{}	3	10	14.2	15.2	{Gelding}	{}	10	15	AUD	Australia	\N	t	t	2026-05-02 05:47:38.184	2026-05-02 05:47:38.184		\N
\.


--
-- Data for Name: search_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.search_notifications (id, saved_search_id, horse_id, sent_at) FROM stdin;
1	2	12	2025-07-07 06:42:27.758851
2	4	22	2025-08-14 07:59:07.721875
3	4	24	2025-09-08 09:48:03.62817
4	5	24	2025-09-08 09:48:04.056912
5	4	25	2025-09-08 10:07:29.518907
6	5	25	2025-09-08 10:07:29.754623
7	4	26	2025-09-08 10:18:56.312173
8	5	26	2025-09-08 10:18:56.590623
9	5	27	2025-09-08 10:32:47.876177
10	5	28	2025-09-10 02:13:00.282738
11	5	29	2025-09-10 07:28:25.449902
12	5	30	2025-09-10 08:44:16.151921
13	5	31	2025-09-10 22:26:29.552647
14	5	32	2025-09-11 05:05:54.683289
15	4	33	2025-09-24 23:17:39.50153
16	5	33	2025-09-24 23:17:39.767504
17	5	34	2025-09-28 21:57:18.394722
18	5	35	2025-09-29 00:37:29.66404
19	5	36	2025-10-04 22:49:32.676004
20	5	37	2025-10-04 22:49:34.91392
21	5	38	2025-10-06 03:58:17.369246
22	5	39	2025-10-06 04:09:59.586497
23	5	40	2025-10-08 10:56:53.202257
24	5	41	2025-10-13 03:14:38.098154
25	6	41	2025-10-13 03:14:38.383952
26	5	42	2025-10-14 08:32:58.914156
27	5	43	2025-10-17 03:17:40.703343
28	5	44	2025-10-17 03:27:06.84085
29	5	45	2025-10-17 03:38:31.291601
30	5	46	2025-10-17 03:46:45.99247
31	5	47	2025-10-17 03:49:45.305943
32	5	48	2025-10-19 22:50:42.909387
33	5	49	2025-10-22 10:50:29.347592
34	6	49	2025-10-22 10:50:30.067272
35	5	50	2025-10-22 11:13:27.968533
36	5	51	2025-10-24 04:58:33.505908
37	6	51	2025-10-24 04:58:33.979387
38	5	52	2025-10-29 00:35:22.212863
39	6	52	2025-10-29 00:35:22.70547
40	5	53	2025-10-29 01:53:52.413975
41	5	54	2025-11-07 06:11:27.381337
42	5	55	2025-12-09 00:38:56.957965
43	5	56	2025-12-09 01:10:28.383792
44	5	57	2025-12-09 01:45:40.801921
45	5	58	2025-12-09 09:10:08.566887
46	5	59	2025-12-09 09:18:45.909852
47	5	60	2025-12-09 09:29:19.011556
48	5	61	2025-12-09 09:36:55.965029
49	5	62	2025-12-09 19:47:31.995962
50	5	63	2025-12-12 06:11:38.517122
51	5	64	2025-12-17 10:25:49.186409
52	6	64	2025-12-17 10:25:49.61004
53	5	65	2026-01-14 00:11:47.867794
54	5	66	2026-01-20 07:49:13.911436
55	7	66	2026-01-20 07:49:14.139409
56	5	67	2026-01-20 08:36:17.726055
57	5	68	2026-01-20 09:05:42.667243
58	5	69	2026-01-26 01:27:13.647382
59	7	69	2026-01-26 01:27:13.914051
60	5	70	2026-02-04 07:52:18.975419
61	7	70	2026-02-04 07:52:19.243412
62	8	70	2026-02-04 07:52:19.503737
63	5	71	2026-02-21 07:24:09.839008
64	5	72	2026-02-21 07:36:33.265654
65	5	73	2026-02-21 07:49:05.02262
66	6	73	2026-02-21 07:49:05.464634
67	5	74	2026-02-22 07:24:07.61578
68	7	74	2026-02-22 07:24:07.852106
69	8	74	2026-02-22 07:24:08.06359
70	6	74	2026-02-22 07:24:08.492721
71	5	75	2026-02-23 06:24:46.328636
72	7	75	2026-02-23 06:24:46.61484
73	8	75	2026-02-23 06:24:46.836564
74	6	75	2026-02-23 06:24:47.366431
75	5	76	2026-02-24 10:47:35.180091
76	6	76	2026-02-24 10:47:35.646756
77	5	77	2026-02-26 05:38:21.310777
78	6	77	2026-02-26 05:38:21.788462
79	5	78	2026-03-03 08:24:40.029858
80	5	79	2026-03-03 08:45:21.901774
81	5	80	2026-03-03 08:57:30.645641
82	5	81	2026-03-04 00:51:36.240132
83	7	81	2026-03-04 00:51:36.510886
84	6	81	2026-03-04 00:51:37.005611
85	5	82	2026-03-04 00:56:38.673323
86	6	82	2026-03-04 00:56:39.112381
87	5	83	2026-03-04 01:02:51.464416
88	5	84	2026-03-04 01:10:25.020498
89	5	85	2026-03-04 01:43:32.883033
90	5	86	2026-03-04 01:48:13.45002
91	7	86	2026-03-04 01:48:13.732584
92	5	87	2026-03-04 01:58:12.887351
93	5	88	2026-03-04 02:07:17.403565
94	5	89	2026-03-04 02:14:06.208688
95	7	89	2026-03-04 02:14:06.481704
96	5	90	2026-03-04 22:34:49.60978
97	5	91	2026-03-04 22:39:36.0095
98	5	92	2026-03-04 22:44:00.764985
99	5	93	2026-03-05 01:22:07.075367
100	5	94	2026-03-05 01:26:26.765363
101	5	95	2026-03-05 07:32:40.781411
102	6	95	2026-03-05 07:32:41.174024
103	5	96	2026-03-14 03:55:41.127503
104	13	96	2026-03-14 03:55:41.397825
105	5	97	2026-03-19 02:55:05.844308
106	7	97	2026-03-19 02:55:06.106492
107	6	97	2026-03-19 02:55:06.524969
108	5	98	2026-03-31 05:42:16.72109
109	5	99	2026-03-31 05:47:17.636106
110	14	99	2026-03-31 05:47:18.167214
111	5	100	2026-03-31 05:51:12.678046
112	5	101	2026-04-14 08:19:10.964915
113	6	101	2026-04-14 08:19:11.41613
114	5	102	2026-04-14 08:23:09.860194
115	7	102	2026-04-14 08:23:10.116678
116	6	102	2026-04-14 08:23:10.579558
117	5	103	2026-04-29 22:31:31.908204
118	7	103	2026-04-29 22:31:32.172204
119	6	103	2026-04-29 22:31:32.620883
120	14	103	2026-04-29 22:31:32.997844
121	17	103	2026-04-29 22:31:33.446555
122	5	104	2026-04-29 22:37:27.618382
123	7	104	2026-04-29 22:37:27.888093
124	6	104	2026-04-29 22:37:28.329796
125	5	105	2026-04-29 22:42:59.40791
126	10	105	2026-04-29 22:42:59.868167
127	5	106	2026-04-29 22:56:57.444196
128	7	106	2026-04-29 22:56:57.694865
129	6	106	2026-04-29 22:56:58.114534
130	5	107	2026-05-03 04:25:06.93562
131	18	107	2026-05-03 04:25:07.177032
132	5	108	2026-05-03 22:05:06.651457
133	7	108	2026-05-03 22:05:06.904922
134	6	108	2026-05-03 22:05:07.331751
135	5	109	2026-05-04 09:11:42.039915
136	18	109	2026-05-04 09:11:42.273034
137	5	110	2026-05-04 09:45:02.045577
138	6	110	2026-05-04 09:45:02.454249
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, business_name, contact_name, is_searching, is_selling, location_country, location_radius_km, preferred_disciplines, preferred_levels, preferred_breeds, age_range_min, age_range_max, height_range_min, height_range_max, preferred_sexes, breeding_preferences, preferred_characteristics, price_range_min, price_range_max, currency, created_at, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan, subscription_end_date, username, email_verified, verification_token, verification_token_expires, subscription_reminder_sent_at, email_unsubscribed) FROM stdin;
167	hanabognuda98@gmail.com	$2b$12$2XUdO55IbXfkSH/.mCMLyutFQZJ02sQdGQz2lOwNl/GGd8t7AaqsG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-04 19:08:39.43097	\N	beta-1759604963452	active	beta-seller	2026-01-02 19:09:23.452	Hbognuda	t	\N	\N	\N	f
157	englandf@gmail.com	$2b$12$VJVTZ6Ap0d3KSzxOp7am0essMsOawb.d6GXLxun9HWak2X1zzM9Iq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-03 23:04:23.354704	\N	beta-1759532753629	active	beta-searching	2026-01-01 23:05:53.629	Fiona	t	\N	\N	\N	f
91	bellarooequestrian@outlook.com	$2b$12$WmTeBjAOH43h1eWCq2miTuQksBTHHzAuRuooh69TSu/gQRAUYVMwS	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-08-11 07:15:03.770038	\N	beta-1754896578874	active	beta-seller	2025-11-09 07:16:18.874	BE Horse Sales	t	\N	\N	\N	f
393	sarahclarkequestrian@gmail.com	$2b$12$Co450ijr2olk9EGI6RqK7OLCoYZUc.hvGKLNg6J7Ct5a9qQAeXhPK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:40:44.735455	\N	\N	\N	\N	\N	Sarah clark	t	\N	\N	2026-02-13 21:12:42.103	f
161	mckeejenny@yahoo.com	$2b$12$bn3VfVdWTEg1xm..EnvWt.vhEpEKo1LVhkI0J4tkMzG5JEDF8URsK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-04 11:03:28.430576	\N	\N	\N	\N	\N	Deptodxa	f	2e61f7d15e0c0b1192eeaf272b382b9fd9179f0303f173031d131d35ddb09d3c	2025-10-06 11:03:28.411	\N	f
87	info@finchfarm.com.au	$2b$12$lVqzyck1f6FRgL.B1xO9eOT/SHuByhVg2xuJ1hDC6VnRRPxP8fWWC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-23 06:43:34.335826	\N	beta-1753670471125	active	beta-seller	2025-10-26 02:41:11.125	finchfarm	t	\N	\N	\N	f
93	emmanicol77@gmail.com	$2b$12$WCTBigx6ldyXxGt2ZGy/K.nH0/RoSJH.UnnhMXu.5vVGKZIy.j9g.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-01 23:53:47.138436	\N	beta-1756770868775	active	beta-seller	2025-11-30 23:54:28.775	Emzy	t	\N	\N	\N	f
50	frits@oakssporthorses.com	$2b$12$Nv0QuS6sKzYICOPOPVJoS..WkqpgHktKW72GVopvNadUgYuslCULG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-14 03:43:32.009615	\N	beta-1752464612009.615000	active	beta-seller	2025-10-12 03:43:32.009615	Frits	t	\N	\N	\N	f
198	ostenfeldequine@gmail.com	$2b$12$mvVgttcK3Bzww4wnwRn/TO.Tv4RJZYJcJONmvm7AiWYgtuWkG4Uve	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-06 21:08:41.615359	\N	beta-1759785167406	active	beta-seller	2026-01-04 21:12:47.406	Ostenfeld	t	\N	\N	\N	f
196	erin@brooksidefarms.com.au	$2b$12$DfTH25jRAuVk47rDaQny.ejxVYWx/7rYtlPtEXnINDLv2WRS2TURC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-06 06:44:51.623269	\N	beta-1759733461796	active	beta-seller	2026-01-04 06:51:01.796	Brooksidehorses	t	\N	\N	\N	f
177	sallee5_566@hotmail.com	$2b$12$MbeVFuF3ajZEZJyFQfP8YeZsFILPnDZlvGS3seGSb3jm9fjIgxlCO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-05 11:01:28.558189	\N	beta-1759662205942	active	beta-seller	2026-01-03 11:03:25.942	Sallee	t	\N	\N	\N	f
89	bressington2107@bigpond.com	$2b$12$iiDlJvXRzXNKowSGZE1XW.MqeE0fUXCTRCm8u4YN6ZzFsxk6Q7Wui	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-29 01:02:10.266034	\N	beta-1753751001991	active	beta-seller	2025-10-27 01:03:21.991	Di.B	t	\N	\N	\N	f
203	merylmarriott@gmail.com	$2b$12$ULgRvTkUXMayBRhzLiq0dOTe/6HbkZEkPDdXT5UlSxJy96Z8RVPh.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-08 09:45:26.133208	\N	\N	\N	\N	\N	Nicolem	t	\N	\N	2026-02-13 21:12:42.832	f
97	tonya.rose@bigpond.com	$2b$12$lt2DmEJ5rck3tYEj1WchLeOQkkhcLMnOC5bKTgRSez7RwWTMGPj/2	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-08 21:52:36.721877	\N	beta-1757368468774	active	beta-seller	2025-12-07 21:54:28.774	Glenayre31	t	\N	\N	\N	f
170	info@sterntaler.com.au	$2b$12$hC7ZTaKSAwbpR89Nabkw9.3meb4FCTiN6Z9jwW6UJD9K187nUV.Tm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-04 22:34:28.915968	\N	beta-1759617393883	active	beta-seller	2026-01-02 22:36:33.883	mKovacs	t	\N	\N	\N	f
197	karen@redhillbrewery.com.au	$2b$12$eEDuBduJVZCJrpcDnm0un.Gs9t.tWMiCdHNrdaMKJzWHuPTP9LZUG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-06 17:48:50.498352	\N	beta-1759773122682	active	beta-seller	2026-01-04 17:52:02.683	Karen Golding	t	\N	\N	\N	f
107	doublec_farms@outlook.com	$2b$12$pPEysj07FK3eRHgbXNm3YO5rLcP8zhh2imGXFzfQKgdGPvwf5NADW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-10 08:31:17.263506	\N	beta-1757493248622	active	beta-seller	2025-12-09 08:34:08.622	Double C Farms 	t	\N	\N	\N	f
98	joy_terry13@hotmail.com	$2b$12$NMERvE6KG/KYqnCIaiXRkOKpW1ABWHd16kAB8rRUVjoyJoNRtUi7W	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-09 10:17:27.263093	\N	beta-1757467600974	active	beta-seller	2025-12-09 01:26:40.974	TerryJ	t	\N	\N	\N	f
178	alexis.clark@hotmail.co.uk	$2b$12$eQOLS1V8b81LHAZQQ4UT9.X9XAFhKFnr5x7dIMzU7TKjH0XOruMsi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-05 11:14:00.17935	\N	beta-1759662967031	active	beta-searching	2026-01-03 11:16:07.032	alexis.clark	t	\N	\N	\N	f
171	alexandragostelow1@gmail.com	$2b$12$5YBP1QrA9U868QQS55uT0uye9pQEzIwnigYNCW5PFEIZjK0q8mM3G	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-04 23:59:19.841415	\N	beta-1759622394138	active	beta-searching	2026-01-02 23:59:54.138	Agostelow	t	\N	\N	\N	f
95	Info@sterntaler.com.au	$2b$12$kWljPTvxdRDzXY4IRE450uYZuhecczJa1ScptaC/FCWkwJfMLtiZK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-06 00:28:53.306179	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	Martina kovacs	t	\N	\N	\N	f
317	sophie.davidson22@icloud.com	$2b$12$n9GwCJxXw0YTMiAHRN5MlOk1RmsoC3x18RM7VOqZFGlbxrvTBqPdm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-13 00:53:48.734803	\N	\N	\N	\N	\N	sophie.davidson	t	\N	\N	2026-02-13 21:12:43.534	f
108	rebeccalouisenicholls@gmail.com	$2b$12$ugb3BVtJ65bBfNEdB30NDOEGCIML2nIm3y9q/Fsi2ROjKGlz4w.Dy	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-10 21:49:32.443688	\N	beta-1757541043437	active	beta-seller	2025-12-09 21:50:43.437	RebeccaNicholls	t	\N	\N	\N	f
116	office@xtremesporthorses.com	$2b$12$ejsD4rlRwMJLGzaTqXqeGu1JIMEqkHvQRKD.QhH.sEQg9y6bTPMv.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-24 22:12:22.844778	\N	beta-1758752070217	active	beta-seller	2025-12-23 22:14:30.217	Xtremesporthorses	t	\N	\N	\N	f
160	sarahbearclark@hotmail.com	$2b$12$VyEEFjq5EfBNEN0vi6CCaOBVaZBkhiZX4tyJpDKphkIfpYnc8Tawq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-04 10:08:24.517739	\N	\N	\N	\N	\N	Sarah Fairmaid	t	\N	\N	2026-02-13 21:12:44.251	f
111	rjsireland@gmail.com	$2b$12$S4FxOpGPTuB8YLGlSpSige/SVo9U126XYKwSCvgG4BY3T.RFFwBve	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-11 03:59:35.993302	\N	beta-1757563255791	active	beta-seller	2025-12-10 04:00:55.791	rjsireland@gmail.com	t	\N	\N	\N	f
201	alitaflannery@gmail.com	$2b$12$HNz8kUh0F3f5mYkIR5jIxO93D188yz9zS6rRiGj.kP0M6hbcUzHRS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 08:11:03.702683	\N	beta-1777887264311	active	beta-searching	2026-08-02 09:34:24.311	Alita 	t	\N	\N	2026-02-13 21:12:44.952	f
200	ash315.k@gmail.com	$2b$12$t5gs3vj8AuoEs1WFUiCOg.Yv59sd9PGl/4ZSX33.nUA9QIDTcEjIy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:14:38.611861	\N	beta-1759810530887	active	beta-searching	2026-01-05 04:15:30.887	Ashak	t	\N	\N	\N	f
122	john.henriksen@bigpond.com	$2b$12$vP.bB8g4BKlXoLWc2BhX2eHrBxS32RmLPTEqVnH9yabaWWrCtUKze	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-27 02:51:34.603535	\N	beta-1758941655990	active	beta-searching	2025-12-26 02:54:15.99	John	t	\N	\N	\N	f
202	rubymeharry@icloud.com	$2b$12$UDRQhrowpxHGHnnYl380Z.xgAm3X9Qp2/2U0y9JzCMpTiP3Rfh/Pm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-08 02:22:33.938585	\N	\N	\N	\N	\N	Rubymeharry 	f	56fbd022b55c7ac6448cd37d3c31b1e2c0cfd86b50a2cb0239dae4380869c82e	2025-10-10 02:22:33.916	\N	f
117	keysoe2@yahoo.com.au	$2b$12$/JrnW0F3sVIjFQbWTAH2Oez/hWJYz8QhwPQ0spUSulROfR/oA9N1S	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-26 23:14:16.661727	\N	beta-1758928604034	active	beta-searching	2025-12-25 23:16:44.034	Rosemary 	t	\N	\N	\N	f
59	charlikw137@gmail.com	$2b$12$JXXyXa/zJRU0yU8gpNEw0u6dfcf72HQfbI1FSXUTXY65aOOhzgOdG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-14 08:55:07.257218	\N	beta-1752483376739	active	beta-seller	2025-10-12 08:56:16.739	Charli 	t	\N	\N	\N	f
204	emmaferguson0571@gmail.com	$2b$12$qdDcAi1FdBoo8hXN3gCPb.HNDz/vbPwVh5hEUmOlJbEmqmbxXSIOe	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-08 10:24:53.152449	\N	beta-1759920669844	active	beta-seller	2026-01-06 10:51:09.844	Emma Ferguson 	t	\N	\N	\N	f
124	Lyndalp73@gmail.com	$2b$12$IDghmCb1OLaQU0/.hNiBueyF8FTbUPiHKUVvuZBrKw6077RAnm8Q6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-27 07:22:46.403969	\N	beta-1758957819600	active	beta-searching	2025-12-26 07:23:39.6	Lyndal	t	\N	\N	\N	f
94	aidanbebbington@gmail.com	$2b$12$d7LsHcvOWlc2eQW6LdcS4epIE6Q4hL9IEGLzM9HQ3./nTP8j6KtWa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-02 01:16:09.15969	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	aidanbebbington	t	\N	\N	\N	f
239	mel.armstrong@eldersrealestate.com.au	$2b$12$fbe8AUJboGdok9Fue6ols.XyVv0.mLJydUIEjKVgXuWxy3ajpHPAG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-19 08:34:09.180158	\N	\N	\N	\N	\N	melarmstrong1973	t	\N	\N	2026-02-13 21:12:41.38	f
92	phs.au.nz@gmail.com	$2b$12$ygrN4TFfCIZTLtqWq1d2Xu7r3TqyRfVxrxh0a9GG73VLminJeKt8y	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-01 11:04:34.060023	\N	beta-sally-1756760377	active	beta-seller	2025-11-01 20:59:37.20322	Sally	t	\N	\N	\N	f
96	ggroom68@bigpond.com	$2b$12$ppynm4uw8pTDeMppUjHrb.DRPKuyLHVomHHZVFSVIqld/ErdIsbG6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-06 05:52:43.035786	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	Shaz	t	\N	\N	\N	f
90	kathyminchin@hotmail.com	$2b$12$eKdnUTPSVgROyArtJ14wH.aE5L9yhK.Cs.dtX2C8xf4mkUmOHyPw.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-31 04:23:29.09146	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	Kminchin	t	\N	\N	\N	f
115	jbasquil@bigpond.com	$2b$12$9aZehHIwkoFs/Qg6nKeir.vfboSYXI7O8Cj.2wLYaiPQbzCX5MuNO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-21 22:19:11.452332	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	Jbasquil 	t	\N	\N	\N	f
211	k.c.stevens@hotmail.com	$2b$12$qbkKS7G8j1E83VcimzT1OOAzfEgGcTqyTa7xV8bCWCNO8X36VmfUi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-11 02:05:15.671877	\N	\N	\N	\N	\N	Kelly	f	5288493e4ad5ed79890c749f5fc823e221d986878e98602480e4246e198b37ed	2025-10-13 02:05:15.65	\N	f
130	alexandra.gostelow@icloud.com	$2b$12$irmxFvN7RQuZxwwXJlmJkeZcT.7FPT07CuBEXB4LD4fwmf38Kx6eG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-01 10:04:59.765758	\N	\N	\N	\N	\N	agostelow 	f	7b7cb1787c9077894ad31effe5554c6a6bf75882016781cf1151a3aeea3c43c0	2025-10-05 04:05:11.428	\N	f
123	Jacie978@gmail.com	$2b$12$a8ZzWsTGD1R2ftaVIL1PGeqSq5H9sp/.nWiTtuvaj8WqRmCeiF9p2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-27 05:11:38.259768	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	Jaciej 	f	d6037647eec28fab862ebdc8f6f3ddf75e9b91067a406d535bc70ffaf92eedcc	2025-10-05 04:07:35.552	\N	f
136	scorbett2208@gmail.com	$2b$12$fyd8JythhLQGWtWHXoknDOg78vJEHLwzVHAKD3IHWIcE6yyrDc2Ci	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-02 22:39:51.132509	\N	beta-1759524303332	active	beta-seller	2026-01-01 20:45:03.332	SCornett2208	t	\N	\N	\N	f
209	virginniaarmstrong@bigpond.com	$2b$12$D99UXIFsodME1OgVBSDrW.S1wsReB96uvLkgpB3KAJomDzohUJQua	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-10 03:02:45.649807	\N	\N	\N	\N	\N	Ginn0803	t	\N	\N	2026-02-13 21:12:46.433	f
133	duesouth74@gmail.com	$2b$12$GBWC92x1/7b5DW.E41WT0.X/o/87PhAEYsqoeFPxlqQ55Maa/0kpW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-01 20:29:52.367925	\N	beta-1759350654847	active	beta-searching	2025-12-30 20:30:54.847	Duesouth	t	\N	\N	\N	f
125	caitlynrobinson1@icloud.com	$2b$12$G0m10zYiWMXSPsDygLtinuUMjgUbbWdClHEjiIr9cdkCb/fNkp/02	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-28 02:48:32.149688	\N	beta-1759049337246	active	beta-searching	2025-12-27 08:48:57.246	caitlynrobinson	t	\N	\N	\N	f
118	john.henriksen13@icloud.com	$2b$12$vnbHs3l3EgbkiApQjWoVduCT/miD0dqGuLmgBbEK9wiBiGEMmFl7u	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-27 02:50:23.666916	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	John Henriksen 	f	7af07cef599297e8192bcebcad219fe63ddc2b1f6f10d1a2c9ce15855d617002	2025-10-05 04:25:10.808	\N	f
127	Alway2200@protonmail.com	$2b$12$3pjHKtY4BZjH.mBOLhZSseQQrlA/sMH9yJS5ug2jgZPdwzASgwgqO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-28 09:40:59.912157	\N	beta-1759052547653	active	beta-seller	2025-12-27 09:42:27.653	Samlena 	t	\N	\N	\N	f
213	luke.magee@chillit.com.au	$2b$12$qUgPew5JAsptCEkdLeOv6OVTGJIc5w6TpVx/Qo01NUwZe4VkgzhmC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 03:49:52.953474	\N	\N	\N	\N	\N	LJM	t	\N	\N	2026-02-13 21:12:47.138	f
135	kathw2107@gmail.com	$2b$12$vXHCjiY5qcCZ5NXcI8.qMeLbzBVp3W224iXr27mlLmJ44aiUeh6Ra	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-02 20:09:09.447649	\N	\N	\N	\N	\N	kathw2107@gmail.com	f	25fe3b315be001ec2b9b77c9de9f88c24504227af18309525ef71981425e7363	2025-10-03 20:09:09.428	\N	f
129	Bjverning@gmail.com	$2b$12$DDmPpUEndJk/tWpjUvkGHe9U27dtviRHalHRFE8qVn/MDcfKL06Vm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-01 09:28:52.105618	\N	\N	\N	\N	\N	Govern_Equine	t	\N	\N	2026-02-13 21:12:47.852	f
217	george.roper@chillit.com.au	$2b$12$osYJH/f4STPYhReDDMhTvebwcCHWJEBdO8haXu2yw0CZ1tg2pKcvK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-13 02:53:46.40005	\N	\N	\N	\N	\N	george.roper	t	\N	\N	2026-02-13 21:12:48.563	f
215	ktedmeades@live.co.uk	$2b$12$RNxuOHRhR06frNExyb00MeUhNIc7.GteYZEt9iD1pV3u6iezPZw1q	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 08:52:53.140421	\N	\N	\N	\N	\N	Ktedmeades	t	\N	\N	2026-02-13 21:12:49.293	f
126	mh.edwards@hotmail.com	$2b$12$qxjGhP8meCWAbvIM.iXeq.fn88Mk8TavQIlRvv.dysLOR1M51Uvny	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-28 04:15:47.079048	\N	\N	\N	\N	\N	Michael Edwards	t	\N	\N	2026-02-13 21:12:50.033	f
224	kerrimichelle20@gmail.com	$2b$12$9UB2j1aubQwq8f/VnXlNwe51Whez5zy8sXAz5fYM3WuQEOZMdF3uS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-15 00:05:21.021314	\N	\N	\N	\N	\N	Kmc	t	\N	\N	2026-02-13 21:12:50.745	f
212	jaydeepark@bigpond.com	$2b$12$rXOkbiDLtdP0poHKKbFMpOjCxdNNvKYH89Qa1fmjnXOExGvFGKEfe	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-11 03:43:27.654665	\N	beta-1760154247859	active	beta-seller	2026-01-09 03:44:07.859	jaydeepark	t	\N	\N	\N	f
208	tdeller@bigpond.net.au	$2b$12$Yg1.xHgJv0i24LJMa3ttYejelzMbNnvqTn4Bf.TWZekdpGqCymxAq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-10 01:22:15.811225	\N	beta-1760059378945	active	beta-searching	2026-01-08 01:22:58.945	Tan	t	\N	\N	\N	f
223	jacobsdoublej@gmail.com	$2b$12$72QMkoxE8KlrirNTDYztO.UEU/TdZ0vW0n4hVNv92qMglOHwD0Bci	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-14 18:53:10.805096	\N	beta-1766444587128	active	beta-seller	2026-03-22 23:03:07.128	Jacobs	t	\N	\N	2025-12-21 10:04:46.073	f
227	vicki@vickiwilson.nz	$2b$12$75sK1bMD7RBVrwz/BHFme.mO.WxELr1vbT.NUXIYjg5qx7aSQiXqm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-15 06:44:50.46896	\N	\N	\N	\N	\N	vickiw	t	\N	\N	2026-02-13 21:12:51.445	f
210	baskets@xtra.co.nz	$2b$12$cCYVsXy6tJh5RVxZ0qdB7.TGi6/jxiV10fB9VmVyCcuE/tRC29LLO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-10 11:51:06.017357	\N	beta-1760097115750	active	beta-searching	2026-01-08 11:51:55.75	LianneI	t	\N	\N	\N	f
276	claireminetti@icloud.com	$2b$12$8TdghKGEvmlXcR0yNFXK8.kLVP14NwJBXjbEG1g0NYy.M..l1Qw7u	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-30 06:12:36.633652	\N	\N	\N	\N	\N	Clairem22	t	\N	\N	2026-02-13 21:12:52.289	f
214	melissa@cleargraham.com	$2b$12$Hq4neT6uQvQ8hqXyd2ivxesk8irVyDPeOp08OXamNSP5aD/MTmZX.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 05:09:13.215981	\N	beta-1760245867769	active	beta-searching	2026-01-10 05:11:07.769	Mel22	t	\N	\N	\N	f
199	sm1961@bigpond.com	$2b$12$Esk72Ml.ER/jfG09joilKuHrhSUn/yLAiZcPqnz3mshmRcu8FUD/u	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 01:57:52.428685	\N	\N	\N	\N	\N	Sharon Matthews	t	\N	\N	2026-02-13 21:12:53.031	f
155	rekha1@bigpond.com	$2b$12$dwUxEUipapVgvQ4h7LcXcOelgXxd5Yoru4j0my85.xvA/VWGdOdEe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-03 11:20:32.204002	\N	beta-1759490473741	active	beta-searching	2026-01-01 11:21:13.741	rekha1@bigpond.com	t	\N	\N	\N	f
219	elissa.stephens1@gmail.com	$2b$12$WxYjTkn1SjII9enEeeOZFOl6qxWgYL7ljuVfiyb3LjnhsZ7Xk6/yG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-13 21:14:17.380053	\N	\N	\N	\N	\N	elissastephens	f	19ccdcd2271d4b0e44c42852cd0cc0c20c5ad36ec5f63284ef6247ffe538482d	2025-10-15 21:14:17.361	\N	f
156	Ginabeb@gmail.com	$2b$12$i68D5edMnHF5Z6hlGZgZxeEuZ5HG6Z9PS91zDEf00vbpR.R.HzkdW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-03 19:31:35.956206	\N	beta-1759519981975	active	beta-seller	2026-01-01 19:33:01.975	Ginab	t	\N	\N	\N	f
222	gonerunning1@hotmail.com	$2b$12$xiKtILTSMPBIjgzirO2ymOxGVmFPFxn3CD0Q8akSTXfs0GqPdA9h2	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-14 18:24:40.833224	\N	beta-1760466363665	active	beta-seller	2026-01-12 18:26:03.665	Ksal16	t	\N	\N	\N	f
220	lisatanneroz@outlook.com	$2b$12$0YEStmKUCAkVvCGUHfTvNe5zGN7c8nWxG7zg0qZdOiuJZHgk8wBkO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-14 01:54:27.697654	\N	beta-1760406955943	active	beta-seller	2026-01-12 01:55:55.943	LisaT 	t	\N	\N	\N	f
207	b-ckennedy@skymesh.com.au	$2b$12$3BW6rAZehB5xl82Sk0e3O.Sy/KBJ90AXr/FKgr5qRiiYD.g/BlctS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-09 07:32:30.937635	\N	\N	\N	\N	\N	brian Kennedy	t	\N	\N	2026-02-13 21:12:53.738	f
128	broganjaze1@gmail.com	$2b$12$URKllK/NGEhsdYu0o8qy6uhT/jnyxGqScadGfvvMD3hf/m.y3jYhW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-01 01:49:13.50879	\N	beta-1759283680527	active	beta-seller	2025-12-30 01:54:40.527	jbrogan76	t	eaad2557a6c96bb977e8ab619ae551a3b9ca39522e9647351f75e0cbd37398db	2025-12-11 10:32:38.113	\N	f
225	ella.hawkeswood135@gmail.com	$2b$12$PFP0PkdV/21wthOFZ5zU6OazKHIiS6G.m6vxmsIcGV45UUXihwbk6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-15 01:18:44.424676	\N	beta-1760491170811	active	beta-searching	2026-01-13 01:19:30.811	EGH 	t	\N	\N	\N	f
226	vanessakjilly@gmail.com	$2b$12$zXDFblk7yZ9L4LBu3pO9o.ka5yT7AgvvKYaVNLg1eYkucdnG/o3GW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-15 05:57:38.136363	\N	beta-1760507903530	active	beta-seller	2026-01-13 05:58:23.53	vanessa	t	\N	\N	\N	f
206	annabelmnelson@icloud.com	$2b$12$prVcBwF3YST2PU09GSRcaOrPtdqZmLfm1YQBUd1P84UeW79uPM./i	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-08 21:25:59.617292	\N	\N	\N	\N	\N	Annabelnelson	f	\N	\N	\N	f
216	tayakk2408@gmail.com	$2b$12$P1h/olSyX4F9DXuN7aqdSeUwFXkfREHFlRpaTMjNUMnGPo4k2YeN.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 21:40:09.438165	\N	\N	\N	\N	\N	taya.kennedy 	t	\N	\N	2026-02-13 21:12:45.681	f
238	kymandwitty@outlook.com	$2b$12$Au5Qxuoyi5CVOP3DorJpVeBeU0QPVyeZ0N/6nSahLl2QH.8LM.w06	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-18 11:45:20.979877	\N	beta-1760787969843	active	beta-searching	2026-01-16 11:46:09.843	BellaWitt10	t	\N	\N	\N	f
228	stevenssporthorses@gmail.com	$2b$12$chpinDYLYFd1T45sdHcZRe4tM2siAn6TgaHTsrmICeZ50kFpp/lmu	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-15 19:14:11.161327	\N	beta-1760555724857	active	beta-seller	2026-01-13 19:15:24.857	Kelly Stevens	t	\N	\N	\N	f
229	breeanna.gear@gmail.com	$2b$12$MnOM54PSsGfQVvkDz.w3Q.jdz0L9eeydjYI/QffJ1zvtsp41lzCDK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-15 22:51:52.280349	\N	\N	\N	\N	\N	Bree-Anna Rose 	f	1dd26d8092311b530f9615629b4ac73cfdd28a2f25950e46a084c129ff04c707	2025-10-17 22:51:52.258	\N	f
255	brookeoneill_3@hotmail.com	$2b$12$TDz6drdEwJvMHQanRCZmR.GUZR1p9BAAjf4DqSjgufIG9S9qkftha	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-23 17:35:38.890456	\N	\N	\N	\N	\N	Brooke	t	\N	\N	2026-02-13 21:12:55.192	f
230	emilyjeanryan@gmail.com	$2b$12$S2MzmaiMRmAvOJxhtoZo1OnOJFvhvCaxDJQNFywTcPgzk7LHO7KS6	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-16 03:12:03.26071	\N	beta-1760584361513	active	beta-seller	2026-01-14 03:12:41.513	Emilyannabelle	t	\N	\N	\N	f
247	lindybeynon@bigpond.com	$2b$12$OkIKBBOP3Vb4r5x8N/Lq4.NwelNxd5hInR8g3UD7Q1vwNR/23XuSa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 00:00:23.918194	\N	\N	\N	\N	\N	Lindy Beynon	f	a04692aa7827ed2fccaa2ebdecf415a827d9dfe685227a04585328c1fe3656e3	2025-10-23 00:03:22.079	\N	f
240	lindseynairn@hotmail.com	$2b$12$p0D7N1KoSsFlRk2TRok1oOdLxUsaHVCIO4CGVz7snZ0cQWMI6mbFC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-19 10:48:56.034767	\N	beta-1760871064873	active	beta-seller	2026-01-17 10:51:04.873	Lindsey 	t	\N	\N	\N	f
232	cjross07@icloud.com	$2b$12$JGWxq/V1BI/nP51llRIOE..LgyBdVvkPeBHfCcMr4uH25FV64hPfa	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-16 03:47:06.2229	\N	beta-1760586483618	active	beta-seller	2026-01-14 03:48:03.618	Charlie.Roas	t	\N	\N	\N	f
236	vendi.diamond@gmail.com	$2b$12$TyHbGRj1TikyZK66cWui9OOGwPt6TVPxMrl.cRVPo5FgybjTRFQAG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-18 05:58:33.215658	\N	\N	\N	\N	\N	DiamondGirl123	t	\N	\N	2026-02-13 21:12:55.902	f
231	tash.coleman@outlook.com	$2b$12$PoYPuXsEQh1zQbbdKTDlrucKY7yf9/y5oNrnJIZ16qLgokhmldwU.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-16 03:46:34.899934	\N	beta-1760586671389	active	beta-searching	2026-01-14 03:51:11.389	tash.coleman	t	\N	\N	\N	f
241	rockellwilliamsonrudder@gmail.com	$2b$12$mimOizVDKuZ6W4iO3Rj8F.UM3QjI3ashc90K84BmhBBUd5ifDmsgS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-19 20:42:26.596454	\N	beta-1760906619496	active	beta-searching	2026-01-17 20:43:39.496	Rockell	t	\N	\N	\N	f
248	henburypark@hotmail.com	$2b$12$d6G59lFpCry0IXyBaQlscuZg6dztXKEf9O65t/ELFyIo.pSnqGVee	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 00:11:20.342136	\N	beta-1761005566379	active	beta-seller	2026-01-19 00:12:46.379	Kate Dewar	t	\N	\N	\N	f
234	jenny.murphy58@gmail.com	$2b$12$bW.tDm6ij.XMADyqeSHCTuxEl6ilKcFWLOhqFcNAi65nQsT0hvuJm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-17 04:00:22.691597	\N	beta-1760673723725	active	beta-seller	2026-01-15 04:02:03.725	Jennym	t	\N	\N	\N	f
242	francescagroening1@gmail.com	$2b$12$HCfdVmwRTWqWzCPfvonEveza9bfQlmjTTAplEIrh1XSwAjT/oRWKq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-19 22:42:19.400028	\N	beta-1760913800342	active	beta-seller	2026-01-17 22:43:20.342	Fillies Stud	t	\N	\N	\N	f
243	kylieolney@optusnet.com.au	$2b$12$iPGoYoIL5qnPIaobGlSkj.2ii5esv4GBfsgZofBeCR5gQAk34ehW2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-20 05:51:21.696945	\N	\N	\N	\N	\N	Kylie	f	088ef246586929834ac37f7b1220dec1ad7fd85606bcb5991bebb8aceeb22fb1	2025-10-22 05:51:21.678	\N	f
235	avessey83@gmail.com	$2b$12$Pte8m3IhdI.hyXKvTZygQuz89TBaUaPFYh/IqSklOIFvuirAc7vqe	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-17 10:06:40.130071	\N	beta-1760695689980	active	beta-seller	2026-01-15 10:08:09.98	TeamAK	t	\N	\N	\N	f
249	eckonobby1173@gmail.com	$2b$12$vrcj.h.jTLnhLeM0NbDMUO3HUgZ1yH9flB0EuAJWW27Lyygl1C5Hu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 06:41:29.327698	\N	\N	\N	\N	\N	DeniJ73	t	\N	\N	2026-02-13 21:12:56.59	f
258	stephenm1604@gmail.com	$2b$12$ZCUHUHygieVMAjsJ00/Xqe3T9fYmidm6vyeqYcs0UUJj5FHbjozpe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-24 09:04:53.93957	\N	\N	\N	\N	\N	stephenm	t	\N	\N	2026-02-13 21:12:57.333	f
237	tsevivian@ymail.com	$2b$12$RkYfNknFsRZ15/BlviWpZuCwivYXo8g8BIMk48QPVo.WhEyKsYfA.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-18 08:36:51.991495	\N	beta-1760776651912	active	beta-searching	2026-01-16 08:37:31.912	vtse2	t	\N	\N	\N	f
251	kellie.curran1@bigpond.com	$2b$12$/8Bzpcsr.rGG7IWeBRqqqux4kSkZjTBrE8NuPuuAQCQfkmmWSe9r6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 11:18:19.678748	\N	\N	\N	\N	\N	kelliecur	f	b9680599be29677b2d4242896fd768b9d4d256356439b861fc8c7d0f7515cb66	2025-10-23 11:18:19.657	\N	f
244	fairy.hoy@gmail.com	$2b$12$qKe3v.q2ScEUhnFd4MFO8.TS/44vOW2LbBz1qiFNnNR/GJVn4s8d2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-20 23:06:28.575219	\N	beta-1761001676922	active	beta-searching	2026-01-18 23:07:56.922	Victoria 	t	\N	\N	\N	f
245	aoakleyshowjumpingteam@gmail.com	$2b$12$YYcvHhWzcQhPKmAYUk8XteNFdOGbrChsKKzHpk9r2aN0gQFWkAwWu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-20 23:28:33.004892	\N	beta-1761003017348	active	beta-searching	2026-01-18 23:30:17.348	Aoakleyshowjumping	t	\N	\N	\N	f
246	reynellatb@bigpond.com	$2b$12$XiqpLc8i4K/JTzf/iMNm/emqYMMNMrLBTKavQLula0fund6p8q30W	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-20 23:57:47.794573	\N	\N	\N	\N	\N	Reynellatb	f	20ae27a7baa9836a699a4077d2e89b7fbef131a9decc8146b12987f3de67f723	2025-10-22 23:57:47.772	\N	f
233	gisellelindley@me.com	$2b$12$9BhCVWEgVQMqFJg5KbG38OEImB442etItJu0IMRQ8DzOo6Pum1oni	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-16 21:13:28.954193	\N	beta-1760649333116	active	beta-searching	2026-01-14 21:15:33.116	gisellelindley	t	89d68db082c9939901c5a7b6cf13e299f9bdc481ab291bc5028a916b31e48378	2026-03-07 02:32:35.24	\N	f
253	tuscansun1405@gmail.com	$2b$12$1CTiIJZIkRNDbNEyzV4uOO2Ga8IjxrWKI9oCVv4bC3qtnz3Ap/Gm.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 20:16:21.597491	\N	\N	\N	\N	\N	Andrea1405	t	\N	\N	2026-02-13 21:12:54.453	f
254	nikola@mcgrathlegal.com.au	$2b$12$3iHWMbh7KR2GlvWmep1a3eCjUyera.i/HeRAUwSTW6QxPAgiFCwYW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-22 12:31:00.661789	\N	\N	\N	\N	\N	Nikmcg	f	1e4eb394f73d603f9e38d0bfab344eb0a39fefa9fb192a230c91894fc4473120	2025-10-24 12:31:00.642	\N	f
256	paigemcbain@outlook.com	$2b$12$LPYQ4.Dlh1tuyLlXBP7m5e2DKGigd1Z.w458hh6/6Y9qC089nsloC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-24 04:51:30.539981	\N	beta-1761281561123	active	beta-seller	2026-01-22 04:52:41.123	Greengrove	t	\N	\N	\N	f
262	joanne@saltadvertisinggroup.com.au	$2b$12$CSdFrGwAMUO6bC1jcOxlYOm3HBV42UL8eakAi3k3hVyZUlBNLVYqS	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-24 10:40:38.508433	\N	beta-1761302568250	active	beta-seller	2026-01-22 10:42:48.25	salt jo	t	\N	\N	\N	f
266	lindaharvey2@bigpond.com	$2b$12$s.Xjh6qx7iikWjJhmVkRF.xCTrIbzbPRd9xsOyWpg223Rp9H5xc8a	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-25 03:44:46.825641	\N	\N	\N	\N	\N	Harv357	f	b29c33de13af798fec769e4098fc67641a6534c184e613b71cabd6bc5dc5fcad	2025-10-27 03:44:46.805	\N	f
264	carolyn@blackhawkfarm.co.nz	$2b$12$GWlKZxs94x7twdHPrOtqq.v81jhedj6uqekZgmrtnMOI8XAGxN96O	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-24 20:30:28.589325	\N	beta-1761337906634	active	beta-seller	2026-01-22 20:31:46.634	BHF	t	\N	\N	\N	f
267	elishamanuel@outlook.com	$2b$12$WTKpiwp5StL0BHeIa/0D.OjTp1.aXlHIr3Gf5G4ZoE9OyNuTrJnY.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-25 22:14:13.345699	\N	beta-1761430542666	active	beta-searching	2026-01-23 22:15:42.666	Priya10	t	\N	\N	\N	f
268	sue.knox@yirrkalastud.com	$2b$12$5h0NNDK1L4Xer0qh.CP2KOcG80HPYpfmEIoy/gRAxKoKSt7LX3eNC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-25 23:14:55.06279	\N	beta-1761434133609	active	beta-seller	2026-01-23 23:15:33.609	Sue Knox	t	\N	\N	\N	f
263	mark-fritha@bigpond.com	$2b$12$hhRij1/O6PfJfdnhp1bEgOCCMicJheoui3D5KZJ3wW3JQUrBBcKwC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-24 11:43:36.495557	\N	beta-1761437523687	active	beta-searching	2026-01-24 00:12:03.687	Fritha	t	\N	\N	\N	f
250	ravenshoerural@bigpond.com	$2b$12$cxthRX8mHaBkGTPjEt7Qte7USdWZHtd6.yczsUS6MN3HHj14bM8Ha	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 06:55:08.303265	\N	\N	\N	\N	\N	Bernadettelyttle	f	1b93dced7186a873ba8315c16550a0ebe88d42d87c6add7a80e28601f59342b3	2025-10-28 01:51:03.655	\N	f
269	nritchie@auski.com.au	$2b$12$N1HNvb7wESc3AJlCLp9/Aue3h/TMNJTOT/e9hPeKXP2FHzpjrIrD6	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-27 05:52:10.702939	\N	beta-1761547874496	active	beta-seller	2026-01-25 06:51:14.496	Judy	t	\N	\N	\N	f
270	jasonroebuck@icloud.com	$2b$12$13Vsotue6aitY/VD6h1TcuFTT6oEylB757dOLU/SwGGpHF/Q.sEDe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-27 09:50:21.389401	\N	\N	\N	\N	\N	Jason	f	8144137fc99274545a56ddd4d042959f951ccd88cf2c54cec66932133b36d165	2025-10-29 09:50:21.369	\N	f
286	horselee1129@gmail.com	$2b$12$wClTac48vlbzHz8w/GBFHOnOP72FKzmkKCdkU.DpT.wKQy8njL6YC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 02:47:39.153795	\N	\N	\N	\N	\N	Hamichelle1129	t	\N	\N	2026-02-13 21:12:58.775	f
300	sarahstone8208@gmail.com	$2b$12$4rflqMj8mYBAL9EOktwrEetktOBKTcv.k9E0adqZZ45zogt87onzG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-08 10:13:41.972447	\N	\N	\N	\N	\N	sarah	t	\N	\N	2026-02-13 21:12:59.502	f
271	melissa.solomon22@gmail.com	$2b$12$AC89YebAKVFzsjol4OJaY.ze0hSDgKBbY6xcb2KDgd9d5PARK5sdm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-28 07:21:37.29629	\N	beta-1761636174208	active	beta-searching	2026-01-26 07:22:54.208	MS1	t	\N	\N	\N	f
273	bluejeansequine@gmail.com	$2b$12$AEKrMfCGp710.oazmomt3eszprbj/iPdrLUyLYmkDd7AXNZtGKGn6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-29 02:53:55.22913	\N	\N	\N	\N	\N	Lance 	f	80a523e2fb127cfb7d1886cd9700abf7d1bda3776cbf5ed520eca8ea91f60775	2025-10-31 02:53:55.21	\N	f
283	courtz-6454@hotmail.com	$2b$12$kNMQawI0N4r8YbmsPE6I1..LpIjfOgTl67JpPo8zr6rgP4MCE9tLS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-04 21:28:11.372374	\N	beta-1762291756923	active	beta-searching	2026-02-02 21:29:16.923	courtz-6454	t	\N	\N	\N	f
274	carson1980@hotmail.com	$2b$12$joZYC02zuwO.UeT/a/ople7FN/rvOf29fq3lCR6gtAdcjadzMt4Da	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-29 10:10:43.943603	\N	beta-1761732753332	active	beta-seller	2026-01-27 10:12:33.332	Katy_lou	t	\N	\N	\N	f
296	bellakikiwillis6311@gmail.com	$2b$12$2OuZDYMyxSuLdrc51YHDpuLPcIvhjNx/0lcEhDbmLSuqAc9dDYJsy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-07 10:06:36.543184	\N	\N	\N	\N	\N	Nakitawillis6	t	\N	\N	2026-02-13 21:13:00.211	f
287	willhodgekiss@icloud.com	$2b$12$o.9czhQHFbW26rgtnDycnug3fZElFIOKmVm2v/pWqF8MWdhJ6BzZG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 02:57:40.399267	\N	\N	\N	\N	\N	WillHodgekiss	t	\N	\N	2026-02-13 21:13:00.936	f
275	cosicanequestrian@gmail.com	$2b$12$8N4swTJY0xVnEhtifKBi5.5.gYpxf1n61mXt37NHrvt8LCILaeYxW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-29 23:55:22.317612	\N	beta-1761782183112	active	beta-searching	2026-01-27 23:56:23.112	Cosican	t	\N	\N	\N	f
299	sbber@schools.vic.edu.au	$2b$12$hrSySnYSPKkZrQ.Jkp4ELupFJ5Ih4L1wSdiuNiFiLuljAg8RilOPy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-08 05:09:23.58856	\N	beta-1762578616360	active	beta-searching	2026-02-06 05:10:16.36	Savannahbergmeier1	t	\N	\N	\N	f
284	madisonportbury@icloud.com	$2b$12$4mOaVz0rpNAfp/oPVB/m1erWjuihQQAIBxBL2DlIAXio/YxIMyOtS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-04 23:30:53.381987	\N	beta-1762299112660	active	beta-searching	2026-02-02 23:31:52.66	Madi.portbury	t	\N	\N	\N	f
288	ambroshadesign@gmail.com	$2b$12$bWiJ.TxXAjUY5xl2dcBlgO5Sxat.LjdaKfsBu5Z4U/vIdVy2sjhpW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 07:17:16.140309	\N	\N	\N	\N	\N	pnissner 	t	\N	\N	2026-02-13 21:13:01.661	f
293	stellapfeffer@gmail.com	$2b$12$JVib7nlaEmyPOkfWP0PEk.s.dZ.26POFwXBafewvywJZnWi2EPN4C	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-07 04:27:23.422807	\N	\N	\N	\N	\N	Stella	t	\N	\N	2026-02-13 21:13:02.39	f
277	shanalimegan1@gmail.com	$2b$12$PQ1S2LhaarS8RY9JOuCYO.2suQO/LlkAQEz3CWEb9XBmgdJnYbDKm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-30 08:24:11.050641	\N	beta-1761812737411	active	beta-searching	2026-01-28 08:25:37.411	Shanali	t	\N	\N	\N	f
205	imogenthew@gmail.com	$2b$12$DmHPb43I27wcEt.kogFzkuUknHVn.JiT.82zZMnQgUhcqq7coEQUG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-08 10:53:30.911842	\N	beta-1759920862433	active	beta-seller	2026-01-06 10:54:22.433	imogenthew	t	\N	\N	\N	f
285	grace.vassallo@icloud.com	$2b$12$eaatC3tD/Z5Xn6DPl6yde.X1AJ02mAczWVqCTVXx3/RDbqkVqoi6O	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 02:34:44.008541	\N	beta-1762310226810	active	beta-searching	2026-02-03 02:37:06.81	Grace Vassallo	t	\N	\N	\N	f
278	rawhitikara51@gmail.com	$2b$12$.g7J1UX6S.bug69kqXpMjuf7Rqxt1v65y5WSVDxqPvj8lzf1mcGum	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-02 02:09:16.570341	\N	beta-1762049418130	active	beta-seller	2026-01-31 02:10:18.13	Peterk8913 	t	\N	\N	\N	f
294	ali@equiprove.com	$2b$12$Wk5rp7G/q.48KwQHNZlwtOBZzIkWIpjyXGhR3w3dyCgwIHqMygwba	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-07 05:53:32.730744	\N	beta-1762495511999	active	beta-seller	2026-02-05 06:05:11.999	aligeeves	t	\N	\N	\N	f
310	lillijc@gmail.com	$2b$12$7tWhIhlW6qhTcpr9BMabMuI.dCNF1x0oupDhzAOhgFUpkYRwlaG7.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-10 02:05:20.172528	\N	\N	\N	\N	\N	lillijc@gmail.com	t	\N	\N	2026-02-13 21:13:03.221	f
282	charobcam@gmail.com	$2b$12$tCHIf1ZjSo3gQFWFB.KZluG9vnhp8UphWW46V3mVNoUfpKdxQjAYa	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-04 20:13:37.07697	\N	beta-1762287279532	active	beta-seller	2026-02-02 20:14:39.532	Charlie camo	t	\N	\N	\N	f
295	amanda.shaf.as@gmail.com	$2b$12$kpFqDmphrOp24Byd6Brpnun2CKGjUUwaXzEBY3w8FSismR4aA0F3G	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-07 06:46:58.137597	\N	beta-1762498127200	active	beta-searching	2026-02-05 06:48:47.2	Sophie1	t	\N	\N	\N	f
289	issyritson@icloud.com	$2b$12$aalqNrl43jaHJTLBEwMSyu4FqtJCrFoqK.yPgCSKeLm377eA.9Ybm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 07:32:43.188493	\N	\N	\N	\N	\N	Issy	f	362b1e2662385048dd00a3a8c42abadb0a148a365d405fede364745aebf9f85a	2025-11-07 07:32:43.166	\N	f
348	carlyoverton@yahoo.com.au	$2b$12$rl2ADQVFFH0xaZ4RwgKLt.xsDKFrwC74akItnG4JXSYvrWTekd.Na	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-05 03:37:03.98193	\N	\N	\N	\N	\N	carlyoverton	t	\N	\N	2026-02-13 21:13:03.934	f
349	wendyjjhorses@gmail.com	$2b$12$l4jb58GaaNnk4gma6DUJOeLTxslrlb1B84Ov0sDV5XHPeknLA1ETi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-06 09:31:56.83806	\N	\N	\N	\N	\N	Wendy 	t	\N	\N	2026-02-13 21:13:04.688	f
305	savvyhallgath@icloud.com	$2b$12$bPrqZ26HduoScPSwJ2pBpeUKHGwbtRXF/HY/LMkYwLQyzBn.t5kVG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 04:08:41.441757	\N	\N	\N	\N	\N	Savannah	f	df8134bd94ae9be19b116d935844301caf2a24a1e6fbda485583c3f938b76f35	2025-12-11 18:15:26.022	\N	f
281	charlotte13caldwell@gmail.com	$2b$12$10owdQr9Lfjr64fsU7mtY.Tn.hI9bkBIRpRgvBlC25TSqDBfLAgvy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-04 09:05:28.608247	\N	\N	\N	\N	\N	Charlotte113	t	\N	\N	2026-02-13 21:12:58.052	f
391	daneschwartz1808@gmail.com	$2b$12$o5keliWsNEQLwLHoQCOWw.A9umpxGYbKcU021UdvnVV7QpX2j.gqa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:30:27.422679	\N	\N	\N	\N	\N	Daneschwartz	t	\N	\N	2026-02-13 21:13:05.395	f
297	laurenandersun674@gmail.com	$2b$12$NV.yzAXgEz32fIVdo1s3ZO9uO24ROz97ONH9zTedbvkeihMtJM0tS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-07 21:32:27.072791	\N	\N	\N	\N	\N	Lauren Anderson 	f	b187e8474cbd6a630905875e6aaad5b0836f983b9d94155ec10f1964ace66995	2025-11-09 21:32:27.051	\N	f
292	lachlan.caserta@gmail.com	$2b$12$7c9crVtGhIz.XM.gkpHY1OBSL.HuWgSkhWzLp36ouA3nFvEHB2jHm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-07 03:21:07.466551	\N	beta-1762485696096	active	beta-seller	2026-02-05 03:21:36.096	Lachiecas	t	\N	\N	\N	f
279	taylaryan165@gmail.com	$2b$12$4jHyhQsMuZgX/yDAauSEQ.Wa739Ofdkkfs7vDOW032/oi/cz5fxXu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-04 07:33:42.115082	\N	\N	\N	\N	\N	TJREQ12	t	\N	\N	2026-02-13 21:13:06.113	f
304	lilyposschadd@gmail.com	$2b$12$ifEWiHsvjBaEMOsJyu1Gx.Ye7K7JVSKt6Qtc3vnxAi9RssQAJgGA6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 03:22:09.650849	\N	beta-1762658594143	active	beta-searching	2026-02-07 03:23:14.143	lily	t	\N	\N	\N	f
302	tjr.equestrian@gmail.com	$2b$12$ouEgDrbBRrxiuqbpe1ynWel3OY2cPz4VxLu/fSdBh1J7KeCx4DZ2i	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 02:20:27.891487	\N	beta-1762654887768	active	beta-seller	2026-02-07 02:21:27.768	Taylaryan25	t	\N	\N	\N	f
301	dominik.fuhrer@gmail.com	$2b$12$yiVCZ3AcqljAmjh902A4LOPaNlsHVwVUACzIqMoLUmkBl/5eACT3i	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-08 14:20:59.583209	\N	beta-1762611682671	active	beta-seller	2026-02-06 14:21:22.671	Dominik	t	\N	\N	\N	f
306	des1311@outlook.com	$2b$12$XiJAtEOhh.CwUpCUIS5TPutfNnBwppgKLhoodichDa2rJMIS1ZG1W	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 04:12:52.655173	\N	beta-1762661718130	active	beta-searching	2026-02-07 04:15:18.13	Des	t	\N	\N	\N	f
308	shellmoors@gmail.com	$2b$12$Qzaa6zSxY9zVZqXU58Km4OJxmngIhBqVHQP/aaPTtkGtDtMqpBUqK	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 05:02:44.524414	\N	beta-1762664611757	active	beta-seller	2026-02-07 05:03:31.757	Shellmoors	t	\N	\N	\N	f
307	hollypenfold1@icloud.com	$2b$12$hsQvgDJs/3xx48apitdqG./3cI/fXvULlre7aHYRVrtSY1Z30Itdi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 04:51:41.539308	\N	beta-1762663963995	active	beta-searching	2026-02-07 04:52:43.995	Hollypenfold95	t	\N	\N	\N	f
309	tayla.carpenter06@gmail.com	$2b$12$tvNjZYQ8UemmvFi29Lf6.eeAfarXR84pQXi7YOne8y9E/MDWVkFqS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-09 15:56:08.249854	\N	beta-1762703839173	active	beta-searching	2026-02-07 15:57:19.173	taylaxcarpenter 	t	\N	\N	\N	f
311	hermionewake@gmail.com	$2b$12$NAFAwAlHkBfko00ywRrUkuFO3LI8N9cuvnTmzquOG5//F3Yg.ZFBC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-10 03:29:48.700662	\N	\N	\N	\N	\N	H.w23	f	f73f25bd901fae64221a8665dfbb7afa5f3b260d2ecc632a42cc21db62a2fc13	2025-11-12 03:29:48.679	\N	f
280	pillargeorgina@gmail.com	$2b$12$e1mE9Fjnukbh/GeKXIBJJeybiUd0hr2gFRRlIuAN3Fnnp05GkFTqq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-04 08:33:29.284186	\N	\N	\N	\N	\N	GeorginaP	t	\N	\N	2026-02-13 21:13:06.829	f
131	janealexander74@gmail.com	$2b$12$cuFwqFlMv65gdlnSuBP5FOSIM2lzPN9lHXIaGCu3rStripM/DCkga	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-01 11:46:51.676993	\N	beta-1759319439275	active	beta-searching	2025-12-30 11:50:39.275	JaneVraca	t	\N	\N	\N	f
313	mingara9@bigpond.net.au	$2b$12$.bGNMGVUZ/DvRu933dMj0eAgB6j5Hi1g6Sq7/iMp2Y/UMiUDZC5oe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-11 03:01:04.253263	\N	\N	\N	\N	\N	Mingara	f	a781479fdc8238bba275928b442d984c4ab3f7f680f6059025db436cc046b1b0	2025-11-13 03:01:04.234	\N	f
314	christyc13@hotmail.com	$2b$12$7Mwox98d7jBiNhXUI5bIaeNkkkFiqaVFG7hz7R01okeImD7LkLcNK	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-11 06:34:07.594164	\N	beta-1762842936243	active	beta-seller	2026-02-09 06:35:36.243	Christyrrr	t	\N	\N	\N	f
335	haileydickens64@gmail.com	$2b$12$K6uBzw31f5ITMfkyAS7MQe1zhv7vNtWIxnaGLsCkNkF5Bko2NQXYu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-26 23:32:32.765367	\N	\N	\N	\N	\N	hailey_p64	t	\N	\N	2026-02-13 21:13:08.272	f
324	tenaya.laird-richards@hotmail.com	$2b$12$rstHW85wEvZurAbNdcSLNOuzEdl8a5mZVAQQOo.y8nV.ixhfywIuC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-17 22:17:29.608064	\N	beta-1763417891555	active	beta-searching	2026-02-15 22:18:11.555	Teericho11	t	\N	\N	\N	f
315	lisa@gtfab.com.au	$2b$12$EyzXaVTawLn3JR6//tDFkOiohnp4Osy3MW9PgNe/gzvXTYAfrEJiC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-12 04:45:00.551518	\N	beta-1762922770975	active	beta-searching	2026-02-10 04:46:10.975	Lisa	t	\N	\N	\N	f
316	annalise.hayes@outlook.com	$2b$12$8g7ibks04FfhpkFWYOvDKOMguaFTyw4q5SwkT4MaibwkYWevmeeLW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-12 19:54:08.640686	\N	\N	\N	\N	\N	Annalise	f	898ac1117cba131b315da6699fa1d73da5263010b6826162dc2470258f6576ce	2025-11-14 19:54:08.529	\N	f
337	samantha.hegedus@bigpond.com	$2b$12$I5Tk11iUqPB7tzO2gYF73OQJtUfCwUUMRH56OC9WiLcw24WURyd0O	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-27 12:06:09.015769	\N	\N	\N	\N	\N	Samheg2013	t	\N	\N	2026-02-13 21:13:08.98	f
319	info@keystonedressage.com	$2b$12$OxLyqisNiBnT0gst/vIb5e6l0ztRwz4bLyMOKqPJBB3.eAwFMxHpG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-14 22:19:26.208777	\N	\N	\N	\N	\N	Keystone	f	7418967bcf44b179af4070dd1524dad5330bbda15e6098f98fb4f49a176c1253	2025-11-16 22:19:26.189	\N	f
325	lill.sbrown006@gmail.com	$2b$12$vfoamAt/aqPCwOnBEogDbevvqpAV3LslX7J16Z97k4KiRSheB2uO2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-18 05:13:16.425964	\N	\N	\N	\N	\N	Lilly brown 	f	529501b74b780a4081316fecf85859a142004f3b6944b060479d4021f751c432	2025-11-20 05:13:16.406	\N	f
318	judesponieshorse@gmail.com	$2b$12$2cFefkBaXe7JL7.2D5W5wui/f05kIq.slhLVJHKpLis.Jt9xIJsMK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-14 09:21:43.59632	\N	beta-1763165294907	active	beta-searching	2026-02-13 00:08:14.907	Judemaydressage	t	\N	\N	\N	f
320	zoelongmire@hotmail.com	$2b$12$iEWGM1mmysac2.CdfVB5HOfCd2pTVtK.TLVaCLJVQWNsI.BFOxaPq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-15 04:21:57.158283	\N	beta-1763180553669	active	beta-seller	2026-02-13 04:22:33.669	Zl3	t	\N	\N	\N	f
340	cherryh@bigpond.com	$2b$12$3fcs9qeARMUCi5eex79Xme5qCVIiyL1Lz3UPOgeOUv9qmm2RRr.wW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 06:48:26.040731	\N	\N	\N	\N	\N	cherryh@bigpond.com	t	\N	\N	2026-02-13 21:13:09.708	f
344	littlesarah53@hotmail.com	$2b$12$NChkyU8plCM4PLy/CcEJPORS107Yq519oHvH12lJsa38mgiDYq596	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-01 07:43:14.055716	\N	\N	\N	\N	\N	Sarah	t	\N	\N	2026-02-13 21:13:10.433	f
330	kim.cross606@gmail.com	$2b$12$rgVl36KZD.bt3avAeRuMMuhMxX9HQyD8P5R6GDfoknW9rZcykJgHC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-23 03:32:28.205307	\N	\N	\N	\N	\N	Kimpolo1	t	\N	\N	2026-02-13 21:13:11.155	f
326	ellagracenewbery@gmail.com	$2b$12$Ma/C0ZG.Cw3b6mexhJTF0Of4hYXcKdv962ArzFsLMnIPykO5K3le2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-19 04:37:22.802369	\N	beta-1763527078635	active	beta-searching	2026-02-17 04:37:58.635	Ellabella2002	t	\N	\N	\N	f
31	info@australianjumping.com.au	$2b$12$z634BS5muusklN73oIU9NuidoMqxhayx/IsFD5s1UEPbo7Rcp5bvu	\N	\N	\N	t	t	Australia	\N	{Jumping}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	AUD	2025-06-26 09:54:33.326911	\N	beta-1750933106529	active	beta-seller	2025-09-24 10:18:26.529	Admin	t	\N	\N	\N	f
321	mayaferenc@hotmail.com	$2b$12$9fY11wjjj0J5qvb/oa6gc.pz8JoyqCrQatWtP3NksoF7wZK1BCLRa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-15 05:14:05.273766	\N	\N	\N	\N	\N	Maya Ferenc	t	\N	\N	2026-02-13 21:13:11.923	f
331	lilyobrien1234@icloud.com	$2b$12$Vf0nufW2JKju1C1bcXt3w.c0t3MOuMHhkkubkU854Crv9wKusypEi	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-23 10:18:48.839763	\N	beta-1763893219009	active	beta-seller	2026-02-21 10:20:19.009	lilyo	t	\N	\N	\N	f
327	bre98@live.com.au	$2b$12$mHnZmUeN0jPXIcpdp5bK2O4rFoOjDGxQLbZLGPrR88csA8MKXAv8q	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 09:29:43.992196	\N	beta-1763631154211	active	beta-searching	2026-02-18 09:32:34.211	Bbsjb01	t	\N	\N	\N	f
336	jo.spira@gmail.com	$2b$12$XoxiIT6Qjaj83BVy6SAHZOwn.1CDTOpSYBzpljPCn1YYiSRM6ot0G	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-27 10:35:59.336097	\N	beta-1764239794501	active	beta-searching	2026-02-25 10:36:34.501	jo.spira@gmail.com	t	\N	\N	\N	f
328	emily.atkinson2608@outlook.com	$2b$12$ZxNJAwazdOGAzSx6cIK4J.KlvKX5MOVNmHy4C7lire6mhb/TwGOF.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 09:44:32.818778	\N	beta-1763631981001	active	beta-seller	2026-02-18 09:46:21.001	eatkinson126	t	\N	\N	\N	f
332	evabraithwaitex@gmail.com	$2b$12$LOZwjNxuLr6T25eAX4Wec..8lHokr2vr6mj2iYA6cdr22uuvhRJ5W	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-24 00:41:25.813622	\N	beta-1763944949436	active	beta-seller	2026-02-22 00:42:29.436	Woofcat 	t	\N	\N	\N	f
272	teegan@teeganashbyequestrian.com.au	$2b$12$dto1IbPONA0ORt/saDtwNuRHs/6oNNAuA7wCS5hpIVNsT469ncZHS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-28 21:58:02.922571	\N	\N	\N	\N	\N	Teegan Papworth	f	5207ff14161e751fdff021ec0ab5c6fa99696e4e813acd3aa94971dbee6e7cc6	2025-11-28 23:16:34.814	\N	f
333	haikeydickens64@gmail.com	$2b$12$yMQw2MADqAWtiwya8lmjBe9d2BW4ppBmbBQZLgVhq8oBNYoC336sW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-26 23:30:07.904927	\N	\N	\N	\N	\N	haileyp64	f	fa87fc440ddbe83c0139c5c22d96d4d99de132e1aaf323ae7a5485df1401bc31	2025-11-28 23:30:07.884	\N	f
329	vanrooyen@xtra.co.nz	$2b$12$Jk5B21ilwMUYs95lomsuxez3l.aOhN4l4s5qajCNPsGgcP2bCHfI6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-22 05:24:44.481616	\N	beta-1763789161934	active	beta-searching	2026-02-20 05:26:01.934	vanrooyen@xtra.co.nz	t	\N	\N	\N	f
343	mksilk@hotmail.com	$2b$12$hAyMhZaxCnQRlEOZl.tpaO0BDqYz1m5gBNSXLVWQgJLKx6rRrYlMe	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-30 07:06:04.016976	\N	beta-1765532729759	active	beta-seller	2026-03-12 09:45:29.759	Katrina Silk	t	\N	\N	2025-12-12 08:24:14.688	f
322	mia.shortt09@gmail.com	$2b$12$xNY80MP.7DCDw15DTIc7feWLXnuJPc5lL9Dlmii96yGpbmdzFCXK.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-16 07:11:30.828706	\N	\N	\N	\N	\N	MiaShortt	t	\N	\N	2026-02-13 21:13:12.628	f
323	becky.fairviewph@gmail.com	$2b$12$2P9tV/eM1.iokIFeWVG.Q.R/Z9qWB4JWGSo/afZs5E3fGxa5Z8Sti	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-16 10:24:18.638024	\N	\N	\N	\N	\N	Beck123	t	\N	\N	2026-02-13 21:13:13.337	f
338	stephaniegrace2007@gmail.com	$2b$12$YsGXMKXJBtMgM77Ft5dT6eTAfcwGOZsH5kIsufjKxue4N7rxGwj2C	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 02:58:09.896222	\N	beta-1764385128843	active	beta-seller	2026-02-27 02:58:48.843	stephaniesaunders182	t	\N	\N	\N	f
342	briarg@hotmail.co.nz	$2b$12$9piKZ8uUonT/GFmvV7hgXec/r8eK7AScqvUMmdznJ95W/gbVEUHDy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-30 04:24:58.226032	\N	\N	\N	\N	\N	Teamwatson	f	28a27203ed815595c746eb0534f7b0f6f39071a8f4ecc5445dc49726e050d163	2025-12-02 04:24:58.206	\N	f
312	charrop@bigpond.com	$2b$12$Ue3uoXZZMC.t/.sRf207GeyTq4aQF00utfPmBJztjNroaQHFFFNZa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-10 11:16:53.696723	\N	\N	\N	\N	\N	Chz	f	\N	\N	\N	f
341	georgiavanderdrift21@gmail.com	$2b$12$6NZ8USOQpHaKppezTV5voOywWVPMLAmUPn1.jGC0e3aiA6E6eagpq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-30 03:37:50.854047	\N	beta-1764473917216	active	beta-seller	2026-02-28 03:38:37.216	Gdrifter	t	\N	\N	\N	f
345	sophie@onesmartfish.com	$2b$12$VWQ7nTneGxJHk.ms9UDuAOvBHQSUcAw7IFzYMfIia.R11bzl6N5Sq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-02 08:53:03.241169	\N	beta-1764665630415	active	beta-searching	2026-03-02 08:53:50.415	Maverickjump	t	\N	\N	\N	f
350	iwest29@icloud.com	$2b$12$bvgqBS3X9QUg1CK0ZUJ7puYA5WMFLBhEgjPKTYfFymRVq6p7dz/Xu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-06 11:21:19.123546	\N	\N	\N	\N	\N	Ivywestley	f	\N	\N	\N	f
339	dotellis60@gmail.com	$2b$12$Zr1BK02ZA5dg21Yy1fC/5O.56RpQle.l65SI6E6cPV8NlJXnX7SE.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 04:13:24.415918	\N	\N	\N	\N	\N	dot60	t	\N	\N	2026-02-13 21:13:07.522	f
346	alisonfoster123@icloud.com	$2b$12$26.JYVa/ZTcywLT9PVYLAO.O88NEST/sfvjiibzeaZu7b9oZRlRe2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-03 06:40:09.250953	\N	\N	\N	\N	\N	Alison 	f	a1483a7aa739fed107a66c5452cff95396dc21d61ed17f2cab16a0cbfab4f472	2025-12-05 06:40:09.23	\N	f
347	olmia@live.com.au	$2b$12$RMhEV0C/Ht186/lOd6n38e3W3jcscGbdWhp/XivlsoJzwWKco9rke	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-03 08:48:54.491136	\N	beta-1764753179378	active	beta-searching	2026-03-03 09:12:59.378	Melanie Denmark 	t	\N	\N	\N	f
351	harvie.mcevoy@icloud.com	$2b$12$9IIb/UW309fuypQ8cxkLLOf2rJtvDrmmq7sUZQqE1xdgnau28f5P6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-06 22:53:23.195695	\N	\N	\N	\N	\N	Dave	f	3be8170e696592eb157462bbab06d1583147c051f1c5157b04965bf42e5d3c27	2025-12-08 22:53:23.175	\N	f
353	harviemcevoy@icloud.com	$2b$12$/S5zYM8rcjSSNA.eZZ4qwuySgD/NZP0vPNYCe3kJR.t3Bm1OJ3Y2m	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-06 22:54:02.477495	\N	\N	\N	\N	\N	Davegdvbg	f	0ad1f626a7311c142c2a136f3dd9d3138ad835e8177b274c590ff08351d1e8fb	2025-12-08 22:54:02.459	\N	f
359	elbytriggs@hotmail.com	$2b$12$cpzKPazFTl9hT2lm3uSOBO9UuCmxpcbNbpkuYj2YKKgn/Vz//FVA6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:31:05.147906	\N	\N	\N	\N	\N	Fairmount Park	t	\N	\N	2026-02-13 21:13:14.796	f
354	graceeaffleck@outlook.co.nz	$2b$12$V2U0EBZ.ZcIGv8T.sL8STO2k0929eTR.gfO0sRpqSqX1mRmk8s/Ui	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-07 03:31:19.492257	\N	beta-1765078306088	active	beta-seller	2026-03-07 03:31:46.088	GraceA	t	\N	\N	\N	f
366	rebecca.g456@gmail.com	$2b$12$wHj/vLssPzx1cl7TNd0x7eD1D7HdL5pd2DcE5OhmfZDBDdyJwcDsu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:11:21.682177	\N	\N	\N	\N	\N	rebecca456	t	\N	\N	2026-02-13 21:13:15.517	f
290	sbber2@schools.vic.edu.au	$2b$12$c.rKJAhjaUrD73CSHoXw7O1OVphmbkT1M2wk9a4Nz0i9EZLJvRigy	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 22:42:46.740362	\N	beta-1765275910315	active	beta-seller	2026-03-09 10:25:10.315	Savannahbergmeier	t	\N	\N	2025-12-01 20:54:09.585	f
375	eleskabrownlee@gmail.com	$2b$12$c/ASj4uICQMalSwSVErx1e7p6HCaduYqVzTJX7tb8PIobeE3eg4nS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 12:59:54.706436	\N	\N	\N	\N	\N	Eleskabrownlee	t	\N	\N	2026-02-13 21:13:16.238	f
368	holly.taunton@icloud.com	$2b$12$CLkPXg2r9c2j7IcSR.KZ.OTJO1KT/wsRPKiLy91LrCKH9MD6aT9WS	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:17:45.520591	\N	beta-1768509742272	active	beta-seller	2026-04-15 20:42:22.272	TanHly	t	\N	\N	2026-01-15 18:51:39.869	f
364	ameliaempringham1@gmail.com	$2b$12$gmhRdihX6YhGtF/KF36ZLO5nK3/MnRnCiKg1G9Ka.aUpzYeHwkw3y	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:00:09.113551	\N	\N	\N	\N	\N	acempringham	t	\N	\N	2026-02-13 21:13:16.957	f
377	sarahb20man@gmail.com	$2b$12$IsTWHX352tJTa82borew7O5AbBH2OZTFJUeghS1SDyv5w/zxYagNu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 17:36:53.892072	\N	\N	\N	\N	\N	Busta 	t	\N	\N	2026-02-13 21:13:17.667	f
360	horseymick@gmail.com	$2b$12$rKyyklAojAKm0qqn89JuQOfrZbHtTsF3JHL0RjJe9elL10hyc7BQS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:31:32.238595	\N	beta-1765276332412	active	beta-searching	2026-03-09 10:32:12.412	Mic4058	t	\N	\N	\N	f
367	stefenno@bigpond.com	$2b$12$7k2HFPI5Mr9nfmwAzU7j8uFucUtTw97kFgSUh2br2VujBJ2yAlUs.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:15:26.346782	\N	\N	\N	\N	\N	Stefenno	f	ca2ab846b98b1cc00d9645ab126d49542e2910176af1d8c9c7f7d2fe58917271	2025-12-11 11:15:26.326	\N	f
358	bronte.webb@hotmail.com	$2b$12$UUFsh32kueJsU1oVLk634OEE/grrNJz6O.lGY5//Hax1Y/m.TTZkW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:29:35.168474	\N	beta-1765276360395	active	beta-searching	2026-03-09 10:32:40.395	brontewebb	t	\N	\N	\N	f
355	katarinazubic99@gmail.com	$2b$12$nbOGVJLVgrwy8rNBIFXNZ.twlf29VGju/T4CNVSoAyYzIFGgyT2WK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-08 09:14:53.556236	\N	\N	\N	\N	\N	KatsBoy	t	\N	\N	2026-02-13 21:13:18.367	f
369	jodietoft@outlook.com	$2b$12$8VBjzKiXnI0fMUV4qwCMmOnxuYnIEFPQNqzxpYZAaULbKh2ngFJTy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:24:34.712329	\N	\N	\N	\N	\N	Jodie 	f	90709a505b81ee1cf5a294132f6341d85fd6026bec59de1c6b25ffdcecb268b5	2025-12-11 11:24:34.692	\N	f
361	sarah@angusbull.com.au	$2b$12$uojpWiKbne1OKLoNuu/3X.0PBdS5GGi5njC7eEnGBSxFXZdoGJSEO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:47:03.383114	\N	beta-1765277285009	active	beta-seller	2026-03-09 10:48:05.009	Sarah1	t	\N	\N	\N	f
362	kirstie@vakarrapark.com.au	$2b$12$tf9StK1V86YsnwBp8GGYDeYhNxj.QxnH1PeRX8VJV9n6ob/fc42V.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:48:28.131687	\N	beta-1765277396130	active	beta-seller	2026-03-09 10:49:56.13	Vakarrapark	t	\N	\N	\N	f
365	nickyboersma@gmail.com	$2b$12$akZCllxry9xUHX/iG2LcPO70WVO/bToQzn8OmLm7naM.kgqCnSyzK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:03:52.00914	\N	\N	\N	\N	\N	Sarzie	t	\N	\N	2026-02-13 21:13:19.109	f
363	sarahmckee522@gmail.com	$2b$12$rIjmGuraYNe0fpqSh9Dm0eIEpJIARCKKO42zCCbuuGFu/aq1/bLTa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:57:36.163221	\N	beta-1765277932683	active	beta-searching	2026-03-09 10:58:52.683	sarahmckee522	t	\N	\N	\N	f
357	theresa@eveningstarranch.com.au	$2b$12$ujDlzJky86RmFsdZl39qO.Cb9QL6DNve7jPKsNcfmv0YwhE.HuM7S	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:25:29.886861	\N	\N	\N	\N	\N	ESR	t	\N	\N	2026-02-13 21:13:19.818	f
370	kheone.cochrane@gmail.com	$2b$12$gKv7fSbveyj8s3lm4iGDyuCKDSMclu4G0bxNBSe8pjLL2lIsfQx66	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:29:12.661501	\N	beta-1765279865779	active	beta-searching	2026-03-09 11:31:05.779	Kheone	t	\N	\N	\N	f
356	martin.hellier@bigpond.com.au	$2b$12$5Zg7ScwjSbVNUD3tUoQxn.yafs3lubAfR5sfFcwcSfSEDe9hgR.vu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 10:24:59.118719	\N	\N	\N	\N	\N	Martin H	t	\N	\N	2026-02-13 21:13:14.09	f
371	naja.poredos.tezak@gmail.com	$2b$12$3UTTfkTenz9ImMDY7thgHuOFO7WLcKGlLAqhI.oJmyZFFfSYERjpa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:30:54.211495	\N	beta-1765279898705	active	beta-searching	2026-03-09 11:31:38.705	Naja Tezak	t	\N	\N	\N	f
373	aaronhadlow@hotmail.com	$2b$12$C2duLIsxdHa0cxTlei4HFuzFrUKTLZi0zbGqe6H8KkW/Cflvsajiu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 11:43:31.121705	\N	beta-1765280654785	active	beta-searching	2026-03-09 11:44:14.785	aaron87	t	\N	\N	\N	f
382	g.empringham09@gmail.com	$2b$12$xjj.nGI9eLuQJoMXTOBIPeYMjClnkc9WeGUXiK4qs2pkbF6q/TSPm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 19:09:25.493633	\N	beta-1765307434786	active	beta-seller	2026-03-09 19:10:34.786	GeorgieEmpringham	t	\N	\N	\N	f
389	bcarter@dux.com.au	$2b$12$ykMrCkR11V9v2Tgd2l8lcezBwtc9hSbQ9TRAiGWQUEq5dPSU9fTGi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:23:10.547398	\N	beta-1766050965138	active	beta-searching	2026-03-18 09:42:45.138	Brooke Carter	t	\N	\N	2025-12-12 08:24:25.28	f
374	stephmacs@hotmail.com	$2b$12$wVWEXeeQgYeyNBrEa5ZDNOZ0uEDD4ecwmYGF5.R/fb7PzXhQ5GnSy	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 12:44:20.534233	\N	beta-1765284390012	active	beta-seller	2026-03-09 12:46:30.012	Stephmacs	t	\N	\N	\N	f
378	carissa@woodhillgroup.co.nz	$2b$12$hXyBkzZTeipQJ6MfRq3.bOKsaSZGv2eChQdRG.gSW0ftq4CwCCXHq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 17:37:09.481164	\N	beta-1765301875885	active	beta-searching	2026-03-09 17:37:55.885	Carissa15	t	\N	\N	\N	f
380	oliviahewitt06@yahoo.com	$2b$12$f.qsoH0vJctHOyggnK1N2uF0uvshgvP0mJpJfGXrMNpwtQbsNls2y	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 18:16:36.637998	\N	beta-1765304259011	active	beta-seller	2026-03-09 18:17:39.011	olivia	t	\N	\N	\N	f
379	airlierobinson@me.com	$2b$12$zf6wyNH0gMJf6KcGHpdAQOWUb57NWItp6DSivqlTGkE0cLVwWsr/q	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 18:09:13.42819	\N	beta-1765303820470	active	beta-searching	2026-03-09 18:10:20.47	Airlie27	t	\N	\N	\N	f
384	rebecca.bates82@gmail.com	$2b$12$4ELwEdVv28tT2U/waeTeFOl/LaX1Ct0Hzo.m4H668UTJPYdPj373K	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 19:47:52.006731	\N	beta-1765309705248	active	beta-searching	2026-03-09 19:48:25.248	Bextar22	t	\N	\N	\N	f
381	ericathompson99@hotmail.com	$2b$12$yDHEUACFqMNrgSLSG.r8M.8YCP9mxrDqyxZvEumvK0ngTb7ca5IoW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 18:37:54.534471	\N	beta-1765305517509	active	beta-seller	2026-03-09 18:38:37.509	Ealderton	t	\N	\N	\N	f
383	skyeceazar@hotmail.com	$2b$12$dBiIwI5sSAn3EV0lYZ9EoOLE/sIaXJ5E9CTZw0c7Wdxx7mAYkJ0AO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 19:33:43.695353	\N	beta-1765308868062	active	beta-searching	2026-03-09 19:34:28.062	Emily1988	t	\N	\N	\N	f
387	molly.mooney1@icloud.com	$2b$12$v63UH1q3QCrUQwSK0s/nn.tEWrjbaOfk4BdVvaGOcQSQmxkP6cmbW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:09:29.454913	\N	\N	\N	\N	\N	Molly	f	3c1317a72f45565663b072bdabb8f53b31016b12215558279d29b498115eb025	2025-12-11 20:09:29.436	\N	f
385	laurynvader27@gmail.com	$2b$12$wk.3JHpfWFBRl7B/olu3eex7Q0ZqCSyLC7ohYntAaPC1gMR6wTV9C	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 19:49:41.817241	\N	beta-1765309825154	active	beta-seller	2026-03-09 19:50:25.154	Laurynv27	t	\N	\N	\N	f
386	phoebeoates1@gmail.com	$2b$12$iCxQpN0V01bdOCX4vuZecuEfv5kIkkoX95dvN55cgq3dVdowDRCaC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:02:20.891417	\N	beta-1765310623356	active	beta-searching	2026-03-09 20:03:43.356	Pbcoates 	t	\N	\N	\N	f
388	warren@nationalplant.com.au	$2b$12$EMs5ILA/cItHRughF2iieuly0352W.yqQ9OpPJ1VA7o6Ry1OEnfb.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:10:55.07697	\N	beta-1765311636022	active	beta-searching	2026-03-09 20:20:36.022	Warren Jensen 	t	\N	\N	\N	f
390	ellaepittts@gmail.com	$2b$12$hR3AxU//o5XlGVq5qO7wdenuYN/BkSy9x4avzv.d2Rq8rh2UXT/xe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:26:04.857745	\N	beta-1765312022641	active	beta-searching	2026-03-09 20:27:02.641	ellapitts	t	\N	\N	\N	f
392	pariswilkinson4@gmail.com	$2b$12$Yk6xgfrSxSbMuCtcN.ecSOj2UoWfMFirAnH3uIJLmmRgWu2KoFeoC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:30:45.519874	\N	\N	\N	\N	\N	Pw22	f	\N	\N	\N	f
395	semi009@icloud.com	$2b$12$CgmLbTrhOFruNqKwD9wTBOqoklwnCp5z5/Ry1ybGWX3EK95OwVgWm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:49:25.361379	\N	beta-1765313818068	active	beta-searching	2026-03-09 20:56:58.068	Chris 	t	\N	\N	\N	f
407	tilley.hardysmith@gmail.com	$2b$12$hEvZRYBRSr7GlG1hro0tgO2lwBS7W7aWkiv3YZmt2IQ4o5804F0k.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 00:48:53.374929	\N	beta-1765327771047	active	beta-seller	2026-03-10 00:49:31.047	Tillihs98	t	\N	\N	\N	f
408	lucycoventry@icloud.com	$2b$12$/q43UkpG/kl9UZv8D9MCDu5DfxjHDYyA6tscODirJzk3M.fEnaqSa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 01:03:56.005033	\N	\N	\N	\N	\N	Lucy Coventry 	f	033ad0e2f6dd2c6baa8c221c5789bd959fbd53f4581702bcb57a6d559e04a2ad	2025-12-12 01:03:55.985	\N	f
396	zarayoungsj@gmail.com	$2b$12$FG6f47qiPAUl5He.muLQHOZfmDpY3ZzKbdCom2foDny9GTO1K2uZC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 21:48:05.117894	\N	beta-1765316957255	active	beta-searching	2026-03-09 21:49:17.255	zarayoung	t	\N	\N	\N	f
431	bridgetkelly82@outlook.com	$2b$12$b6ewkkNw4hkye86NycmHUOZBLp2xVlgzJ6xZl0Qru2vh2Mu6IMTaO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 07:43:59.252909	\N	beta-1766043927336	active	beta-searching	2026-03-18 07:45:27.336	Brelly82	t	\N	\N	\N	f
397	aoakleyshowjumpingteam1@gmail.com	$2b$12$Q2ctFu3ukrkratb.tM.IG.3UGZ7gwAp7ksPNGIEuB2pmotfeI2dAC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 22:03:03.47743	\N	beta-1765318009673	active	beta-seller	2026-03-09 22:06:49.673	Alex	t	\N	\N	\N	f
416	ruby.ginger@icloud.com	$2b$12$MzSeZ0CxQEgqiobmD3hOl.azXg1bm0EaPb.5NiAUzuWIH7rmyFrme	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 04:09:58.438526	\N	beta-1765339852060	active	beta-searching	2026-03-10 04:10:52.06	RubyGinger	t	\N	\N	\N	f
409	luke@keeden.com.au	$2b$12$PvSADUsWQQXLSGzof1jzr.50H5eVFDwi67zk26oRAJRucaYwnWjpy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 01:15:27.919119	\N	beta-1765329533622	active	beta-searching	2026-03-10 01:18:53.622	Nenanoxa	t	\N	\N	\N	f
398	scarlett.ramsay@gmail.com	$2b$12$kCilmLAil/KdVzON3VwKye0ECRFkLOlOQLbTqI4eWEPix.B9YZCY.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 22:24:59.147484	\N	beta-1765319183945	active	beta-searching	2026-03-09 22:26:23.945	Scarlett.r	t	\N	\N	\N	f
400	becka246@gmail.com	$2b$12$wf2Wx8LOXRsYeahGUzmYhexAO1YKz5VnbeksUFynTGJwn8XAuGTV6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 22:39:07.584478	\N	beta-1765320009238	active	beta-searching	2026-03-09 22:40:09.239	Beck	t	\N	\N	\N	f
430	troyballintyne@hotmail.com	$2b$12$mUjJHH.LO563xzCejfrNCeviNe6SfTnsiCnZIvvGhNVQ4kAYkkat.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 07:39:12.397135	\N	beta-1766043612755	active	beta-searching	2026-03-18 07:40:12.755	Troy	t	\N	\N	\N	f
410	tegan_fitzsimon@hotmail.com	$2b$12$B5kdoOLluTwWWRuzfnG4Xu.NQW9PJ.CTbePYkTMJGBXL4giSypGJu	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 01:37:07.421608	\N	beta-1765330688864	active	beta-seller	2026-03-10 01:38:08.864	T.Fitzsimon	t	\N	\N	\N	f
402	lachlanpenny84@mail.com	$2b$12$95YF9.xjWNaDsvDLS7lhV.uvHw33I5AMb/OPlzejg5QguatALjDzy	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 00:16:38.715768	\N	beta-1765325846734	active	beta-seller	2026-03-10 00:17:26.734	Lachiep	t	\N	\N	\N	f
405	annabel.nelson@au.ey.com	$2b$12$d2yUd19l1XWw0NZgmZA4Muby2gvYFWnxSJGnoSMTMwV4nw9G.wR9m	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 00:26:04.021095	\N	beta-1765326601318	active	beta-searching	2026-03-10 00:30:01.318	Annabelnelson1	t	\N	\N	\N	f
429	glenn_woodworth@outlook.com	$2b$12$LXp7LFu86HZkagXOEMcW0e25PwPy3O/jn.XtILwYekqFd8FF9mqMu	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-17 19:33:18.670733	\N	beta-1766013175545	active	beta-seller	2026-03-17 23:12:55.545	Glenn Woodworth 	t	\N	\N	\N	f
406	cmroylance13@gmail.com	$2b$12$2ezRdf56M9m4YwGN2aYx6eZvHKFJc4SP5uR.tVLIraogAB.xSL14e	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 00:31:48.158807	\N	beta-1765326743938	active	beta-seller	2026-03-10 00:32:23.938	cmr	t	\N	\N	\N	f
412	courtwong@hotmail.com	$2b$12$cZFF1U6JyTSEsNPiqsLtv./1GVYAoB/DhHkS6Rkgb/Xv1BUo3CtOq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 02:09:07.603099	\N	\N	\N	\N	\N	courtwong	t	\N	\N	2026-02-13 21:13:21.228	f
417	siennaowen1@gmail.com	$2b$12$X0KchP/WJBqD2EsvRuwZ3elh3K5V7r5A2yJoDvUjB.CVfFMN9J7bu	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 04:40:24.703526	\N	beta-1765341655759	active	beta-seller	2026-03-10 04:40:55.759	siennaowen	t	\N	\N	\N	f
411	brookeanderson5@icloud.com	$2b$12$sDJOVdqP4SRETu5iiGR/quR/VeMs8M7OtfpuMlA7GeVxWtTvOUiUq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 02:07:37.688527	\N	beta-1765332640942	active	beta-searching	2026-03-10 02:10:40.942	Brookeanderson52	t	\N	\N	\N	f
413	natalie@loveridge.net.au	$2b$12$b48YTg1m4a7CgFQLrMGmre.rXuzoZpUOB29ir26OuEdAAMRCW9N8K	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 02:09:56.540202	\N	beta-1765332660358	active	beta-seller	2026-03-10 02:11:00.358	Natalie Loveridgr	t	\N	\N	\N	f
422	gostelowequestrian@gmail.com	$2b$12$.Ca9KiBqIbdYGkMgpetCourwVi9jtV/.Gf6upfTgY.DX0MRAUuQ9O	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-11 00:34:37.284745	\N	\N	\N	\N	\N	Martin Gostelow 	t	\N	\N	2026-02-13 21:13:21.968	f
415	willaboersma@gmail.com	$2b$12$N0zNZpG/8Gpx6rxjTsmRBOdlF/dzCrcr4vgcYJRJidzJZSVm1h7OS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 03:45:54.018681	\N	beta-1765338430866	active	beta-searching	2026-03-10 03:47:10.866	WillaB	t	\N	\N	\N	f
423	jackiejermyn@icloud.com	$2b$12$UK4QNdCOqhyYmojNIfU5P.mYo5aTUvxRa6/lUU6AJRdAUGbpTNDee	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-11 03:09:33.3589	\N	beta-1765422951995	active	beta-searching	2026-03-11 03:15:51.995	JackieJ	t	\N	\N	\N	f
419	alyson.torr@hotmail.com	$2b$12$nKMZM9ZlZtu2cZa43k2ipOxDOlB6vBG.ZiE9xOdViXXLmDbe2k20u	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 05:57:06.315443	\N	beta-1765346282274	active	beta-seller	2026-03-10 05:58:02.274	Alyson Hodgekiss 	t	\N	\N	\N	f
420	virgwill@hotmail.com	$2b$12$CMCCjMCYw4YXyZb890i89ea1zirDOIgQYBh5r0vLExT8tkQjteE6C	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 09:19:33.372644	\N	\N	\N	\N	\N	Virgwill	f	a5c45ffe3249dd07d096e8b4239a9180cfe7897a72514fd109ad0b3191100210	2025-12-12 09:19:33.353	\N	f
418	helen@diacono.com.au	$2b$12$1o0vDxELpP2j1xVbmC.kCehoR5.BwFs/C4NLXUB51FVPojNYMM3Zu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 04:42:20.150976	\N	\N	\N	\N	\N	helsbels	t	\N	\N	2026-02-13 21:13:22.676	f
421	zyunghanns@icloud.com	$2b$12$k0vjyqZ1U9WBs6gJ/YibRuNQQlLRLtYXvVssomB1tXZMEnns9ogPO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 09:39:56.784687	\N	beta-1765359676897	active	beta-seller	2026-03-10 09:41:16.897	Zara8	t	\N	\N	\N	f
424	kellie@kingsfieldequestrian.com.au	$2b$12$RQpn2rJ5fTttUJBeqtXWaep28fMiIkSgSjVE.7/VM9zYF4U.PaYHe	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-11 03:31:59.090963	\N	beta-1765424009342	active	beta-seller	2026-03-11 03:33:29.342	Kingsfield	t	\N	\N	\N	f
414	samialise12@hotmail.com	$2b$12$Q5u/K8J/eHSgF2IkVuY.HuI5Dr4bDU9bP.iiBb7eA90HGKnbRlmYy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-10 03:39:48.227114	\N	\N	\N	\N	\N	Samialise	t	\N	\N	2026-02-13 21:13:23.405	f
426	rubysaybyebye@gmail.com	$2b$12$D.XDAUIbjUxDowD.5S3VtOS7peznUTVMPzzY/jgFncNdUQzV8nNTu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-11 18:05:10.185153	\N	\N	\N	\N	\N	RubyH	t	\N	\N	2026-02-13 21:13:24.129	f
428	williamsonlaila48@gmail.com	$2b$12$JYk4hDhKkgAL/f1RMyZBmu4s3llkxonmqZ/lB0zkOqSO2O0anXUs.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-11 22:49:53.041309	\N	\N	\N	\N	\N	itslailahehe	t	\N	\N	2026-02-13 21:13:24.884	f
435	nathan@keeden.com.au	$2b$12$5e.8o16T82vdfdhwUaSM5u8eVb86GkSULyDDZNeJ6cxzOo8Ll2/rW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 08:30:12.439539	\N	\N	\N	\N	\N	nathan@keeden.com.au	t	\N	\N	2026-02-13 21:13:25.602	f
433	kristy_hogan4u@hotmail.com	$2b$12$kkxTpNKPY3nTAZ2wcJ1Vz.9X6S7IMm6OVJx6tc5FRLMo5KxDJVQ2e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 08:01:38.142729	\N	beta-1768364150104	active	beta-searching	2026-04-14 04:15:50.104	Khogan85	t	\N	\N	2025-12-21 10:05:21.786	f
401	onalee3009@gmail.com	$2b$12$J4DSvf9zsNGw1cxwdIeqqeZyVOwxtWyEDI8V0IbesIM36qMT3pF8W	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 23:51:33.530058	\N	\N	\N	\N	\N	Onaleethew 	t	\N	\N	2026-02-13 21:13:20.53	f
434	cdougherty.160@gmail.com	$2b$12$QH6Ej4eoZF8u7zeCEcRuceY0saaQSJsxPqVjG/nh0ybGA3L7ouLiC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 08:07:51.096004	\N	beta-1766045299660	active	beta-searching	2026-03-18 08:08:19.66	Cdougherty623	t	\N	\N	\N	f
432	amandaleyshan@gmail.com	$2b$12$6RIar4chNAZOSW1bmbtsReXvzWbqCha4ORibvBCG9PRa.aWx53CtO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 08:01:22.203937	\N	beta-1766044966309	active	beta-seller	2026-03-18 08:02:46.309	Amanda Leyshan 	t	\N	\N	\N	f
436	mjequestrian@live.com	$2b$12$xxt/dESsAAsU7woMHNAcz.ZCG1RJEuy2HZJotWjiXUv25YeD/dqhi	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 09:05:11.658666	\N	beta-1766048834871	active	beta-seller	2026-03-18 09:07:14.871	MeganJ	t	\N	\N	\N	f
437	laradeller@hotmail.com	$2b$12$bSARsmXK92GKkX8q9i8Hj.2pVfhhd8zZnT9oNJvDMgCSpLCmmpq1S	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 09:10:11.879757	\N	beta-1766049078953	active	beta-searching	2026-03-18 09:11:18.953	Larad	t	\N	\N	\N	f
446	mparsons2403@gmail.com	$2b$12$.iDG0POnzu.y/H59zRKUC.FvJGig9stu/LJvlmFYxV4cmm19RB8QG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 20:55:14.290865	\N	beta-1766311935655	active	beta-searching	2026-03-21 10:12:15.655	Par03	t	\N	\N	2025-12-21 10:05:24.626	f
441	glewis197@gmail.com	$2b$12$Po1j1EKAM0Z.NVu64ZxR3erpf7cZbSDabiWFwbwJLx8MWxhluiKTm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 11:15:13.741102	\N	beta-1766056561502	active	beta-searching	2026-03-18 11:16:01.502	Georgie	t	\N	\N	\N	f
448	mia@maplesyrup.com.au	$2b$12$R4XsI5B69vq9djkOBcR/o.WOsHf3NrgqHM27sNPqkkPlbewzao1AS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 09:30:03.309169	\N	beta-1768510249045	active	beta-searching	2026-04-15 20:50:49.045	mia	t	\N	\N	2026-01-15 18:51:50.45	f
376	brooke_zander@yahoo.co.uk	$2b$12$m7ViecND2grZNri3.19sW.9/a7aBVZ6jPLM.c0S3rOnRkE41Tq5Wy	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 17:07:49.975941	\N	beta-1766081996643	active	beta-seller	2026-03-18 18:19:56.643	Brookeedgecombe	t	\N	\N	2025-12-12 08:24:23.872	f
440	oliviahamood@gmail.com	$2b$12$mVPi4cKR3.qC31wPNEnIZeqcBYaF2ymWLbpXQxOod39U2trBgs5qW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 10:56:08.745797	\N	\N	\N	\N	\N	oliviahamood	t	\N	\N	2026-02-13 21:13:27.038	f
443	ellieburnett72@gmail.com	$2b$12$xJyjCNmwOvu1ILtbe/O7AOdgpUjLfOBJJMY8P.ssSkLC8EiLhBYsa	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 22:20:13.163561	\N	beta-1766096479538	active	beta-seller	2026-03-18 22:21:19.538	eburnett	t	\N	\N	\N	f
439	dandmgillan@bigpond.com	$2b$12$l6zn/X/tJNNNSQTVIxpSD.s.Vc2U62mSaUwPYDEtTqT8DB5IRufoG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 09:22:19.479478	\N	beta-1771834518313	active	beta-searching	2026-05-24 08:15:18.313	Mgillan	t	\N	\N	2026-02-13 21:13:26.293	f
444	bridiej08@icloud.com	$2b$12$jva.cYsU8aK83EDmBxkqwuKV01xaCK5NcRzbeuTAbAQGpkF5BJSkG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 01:04:01.393139	\N	beta-1766106335119	active	beta-searching	2026-03-19 01:05:35.119	Bridie 	t	\N	\N	\N	f
442	dani.maurer@hotmail.com	$2b$12$CxvYXc/W2hh9OZ/3L38Ww.tc7uwta.duKkVEM7HlPIHp13vvTWCs.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-18 16:02:08.831507	\N	\N	\N	\N	\N	DaniM	f	\N	\N	\N	f
445	stephenelmare@icloud.com	$2b$12$/4dg1iuUGT95w5uPkozZqO/AV3y9UgeqDCR331FPi1C6jOvYnMPTa	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-20 07:04:43.782946	\N	beta-1766214352548	active	beta-seller	2026-03-20 07:05:52.548	Stephen Elmare	t	\N	\N	\N	f
447	sofiabasie@gmail.com	$2b$12$rVruK24a.Tcj/hZg43DgfeTs1xW9ZD4YBtsz2xtKb6mrypzcCA6R6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 09:16:01.957242	\N	beta-1766308634130	active	beta-searching	2026-03-21 09:17:14.13	Sofie	t	\N	\N	\N	f
449	montanakl@bigpond.com	$2b$12$7IgisdFCmUPyt0cQ2YvHd.7RFADJhtgS/NVm69lu/evtFvyRyEipe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 11:27:35.161125	\N	\N	\N	\N	\N	katelenehan	f	2aefcc67760b399e4ca3043f0ad94356c6b1f3b891a22711c7e1ca375c93e37a	2025-12-23 11:27:35.141	\N	f
475	amberpollard83@hotmail.com	$2b$12$ytFF0klLowSzl00hOkI4RuAxKxBMIqFEIy4cAV5CfWr5WEaujvAT.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 00:01:36.85268	\N	\N	\N	\N	\N	Apoll	t	\N	\N	2026-02-13 21:13:29.177	f
114	alexagkong@gmail.com	$2b$12$o5P0UC9ntBc7ZH6ZROxZo...9l02kMi9w6/Fpx9u/4cVy7XyBcXWi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-20 06:56:33.357174	\N	beta-1758959739	active	beta-searching	2025-12-26 07:55:39.499907	alexa111	f	\N	\N	\N	f
451	tess.mcinerney@outlook.com	$2b$12$kr7rAtbwYFZoXveZ5kxNpO8FpJw97ZoRjNXqfg/9/cPEYwjLjRvaa	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-22 07:41:11.292263	\N	beta-1766389436934	active	beta-seller	2026-03-22 07:43:56.934	Tessmcinerney	t	\N	\N	\N	f
462	jae@divasbeverages.com.au	$2b$12$rfylIfC/y94jCA1KmzyvW.ZdIUGd0hsUEMVaOz6HpfPGolXo8o7iG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-31 19:08:02.772135	\N	\N	\N	\N	\N	JANGJAE	f	28f9e0fe38edd3c74136d9a2f251a23a356f5b094080a74b2e95552500e57e34	2026-01-02 19:08:02.752	\N	f
452	shannon.dwyer@outlook.com	$2b$12$bp32dovo8evhTYo7VLtt7.B3/jaxH2l.bF8HvgvR30rad41ynuIuq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 06:22:11.999218	\N	beta-1766471042338	active	beta-searching	2026-03-23 06:24:02.338	Shannon Dwyer	t	\N	\N	\N	f
455	barrybarlow10@gmail.com	$2b$12$rm5CvpoIqOnqqVJyGVsPEuho2WCFXb6wtNqVLe3b3kTktX4QARhzS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-24 09:10:18.213617	\N	\N	\N	\N	\N	Barry Barlow 	t	3f3e0d1a414aeaebf2c5c2ada4f1f92f9b26448b08f685b589b2a2ca1667e6e6	2026-01-21 09:57:36.676	2026-02-13 21:13:29.905	f
425	mcp009@acc.edu.au	$2b$12$gnkoA/ceLi/BygOA.1Cgs.2yPbRXc3DCoezXnu4BFF2toHt/RRaQ6	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-11 05:45:50.917063	\N	beta-1765432009177	active	beta-seller	2026-03-11 05:46:49.177	Islamcpherson	t	7407de17a528f4543ff00309aaba234116fb6dca4d620e94bcdbc7dd5bc9c99c	2026-01-15 01:19:11.474	\N	f
454	claudiaeggerling@gmail.com	$2b$12$lBYvf/C7v6G06rU7wc5eK.o/g2yConqvTRtwdO3pJzqR7k7IxSWdK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 18:51:46.547065	\N	beta-1766515955483	active	beta-searching	2026-03-23 18:52:35.483	claudia	t	\N	\N	\N	f
478	suttoa99@gmail.com	$2b$12$S6d39xDzVcmmbsIIMHBTD.chZDsxXsdEVeSqdnmAnuOO2L4W7E082	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 23:01:30.934486	\N	beta-1768863726035	active	beta-seller	2026-04-19 23:02:06.035	Amelia278	t	\N	\N	\N	f
463	carolyng1967@hotmail.com	$2b$12$UHe/DULsbbrI4vDuwpzFkezAJTLkWL6cT49tsAk0fJg5TCroHPeFG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-02 03:17:10.966017	\N	beta-1767323886672	active	beta-searching	2026-04-02 03:18:06.672	carolyng	t	\N	\N	\N	f
456	hayleykeenan33@gmail.com	$2b$12$RtaLYjyhjjl3t2OtFxxEoesaM06EcPcVnb61HZgkVGr72CjoAB2iq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-27 07:31:06.225757	\N	beta-1766820706295	active	beta-searching	2026-03-27 07:31:46.295	HaylesK	t	\N	\N	\N	f
457	ngaire.oliver@outlook.com	$2b$12$18Ccud7NPqW4u5aM/gRt2u1mQoBpuhKhcoYGXnD49B0a1/hCJBaZa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 04:51:29.560328	\N	\N	\N	\N	\N	ngaire.oliver	f	8601497be87299aca4e6e17f3864278ccb5f90682ace739c8b79684f9ef412d9	2025-12-31 04:51:29.541	\N	f
450	grusgc56@gmail.com	$2b$12$fHzJ15SxT0U3duqdDdRr9eJB6B6WWHhP1PlLSxzBwTv7LQY3ExQ8K	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-21 16:41:22.905464	\N	\N	\N	\N	\N	Gary54	t	\N	\N	2026-02-13 21:13:30.617	f
465	amanjasmine59@gmail.com	$2b$12$nWJcxR6UUHUv8QO.JdJzMukphEBCZaEcRTFEuU9ZSoChn4zowMGhO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-04 07:01:02.239278	\N	\N	\N	\N	\N	Zoya 	f	6dee5bb64ae9af66d9c927b143edb84516ce96e735e1993026099224169348f5	2026-01-06 07:01:02.219	\N	f
459	harry.feast@yahoo.com	$2b$12$ATgSIV9tUHNkaYyvqpRncOKrSKB0nMuxBUVCWChes0m.rPUHwiccW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-29 23:10:42.75474	\N	beta-1767049893893	active	beta-searching	2026-03-29 23:11:33.893	harryfeast	t	\N	\N	\N	f
477	rachelpeel19@gmail.com	$2b$12$QKZdcGLSp/YAYc.gj2yGjuzmNroPlpOT8DqYWekc3kG.Ajjfp8qyC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 02:29:22.173409	\N	beta-1768790315450	active	beta-searching	2026-04-19 02:38:35.45	rachel.peel	t	\N	\N	\N	f
460	eviejarvis@gmail.com	$2b$12$PYRMCFdhQHCL1SqesmJLo.esuZCqxrqIdSy/wYz.rCHmUGo0G2aZO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 08:25:44.422253	\N	beta-1767083219234	active	beta-searching	2026-03-30 08:26:59.234	eve1	t	\N	\N	\N	f
467	scoakley68@gmail.com	$2b$12$cwGwRHk7Tz9Owx3jv0kVR.4aNk12.qf.VBmlRWSTc04Hpw4QI7eES	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-09 08:06:24.424842	\N	\N	\N	\N	\N	Glug	f	227043333b6160521fb86d641a873637c859eceb9717ab11e5af32948d501a90	2026-01-11 08:06:24.404	\N	f
469	teeganashbyequestrian@hotmailcom.au	$2b$12$hW6B.zd5RRPSBRMQX4B8wOFlbCroWXXa0k7NovX3GJKPH9pfm3hUq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-11 23:30:02.616212	\N	\N	\N	\N	\N	teeganpapworth	f	da7a3bc72679ce9b3bb321526761438ee5de9992afdaecfca152a9607cee5f08	2026-01-13 23:30:02.596	\N	f
461	willgb88@gmail.com	$2b$12$3.dc3UpzaQP8MqKha5/MEu06DjIkyLY97EvGhnypwu88bu6etfzGW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-30 19:49:59.511988	\N	\N	\N	\N	\N	Farmer07	t	\N	\N	2026-02-13 21:13:27.735	f
472	hjmt@me.com	$2b$12$rWaTosyVVYi9Ovwig/1SP.iMsYz6NJRUrB50VPfQyK/FgxitrRiOO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-12 19:48:23.793612	\N	\N	\N	\N	\N	hjmt@me.com	t	\N	\N	2026-02-13 21:13:31.341	f
471	astyles93@hotmail.com	$2b$12$WXsMMTeu0HGQJ/fq4ubnju7r0facCX.c1x7BAoi2HAgiQVzgbVfa6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-12 08:15:13.817201	\N	beta-1768205794686	active	beta-searching	2026-04-12 08:16:34.686	Alexia 	t	\N	\N	\N	f
473	leilawyrill18@gmail.com	$2b$12$TjhFXUppDyyiP4lMoCeYk.OotT7rP7U91aeUWkakJnWrGN1ju3B.K	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-13 10:18:51.970548	\N	beta-1768299560434	active	beta-seller	2026-04-13 10:19:20.434	leilawyrill18	t	\N	\N	\N	f
137	chris@packagelandscapes.com.au	$2b$12$TDaFVkgq4JunQMNCIcuDnuMd9WH8r.9u4As5/xyi86SUIlGZAT7kW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-03 02:00:53.512135	\N	beta-1771832858999	active	beta-seller	2026-05-24 07:47:38.999	Wrighty78	t	530d1c5483097a482eca7f31d78d048547cd347373a53cdccfa48dad95701e9f	2025-12-25 07:24:11.924	2026-02-13 21:13:32.127	f
453	packagelandscapes19@gmail.com	$2b$12$QqKtGiGHg8m03pG4.lUtceZqXtq4Ep1nFsNpcTU2xQf1fqKpZiClC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 07:26:57.902854	\N	\N	\N	\N	\N	wrighty78	t	\N	\N	2026-02-13 21:13:32.856	f
474	patangapark@live.com.au	$2b$12$6t3ekKNHBrbTzf.6Q69M8up9jzmEN2Tnv8daWG6EJCeLP/iTQmQd2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-13 20:51:27.393853	\N	beta-1768337632213	active	beta-searching	2026-04-13 20:53:52.213	Jamesharvey	t	\N	\N	\N	f
476	bjandchris6@bigpond.com	$2b$12$zF0VnpiMKNiFbCIckpfluuoasWok12Wtx69J6cQRg1K60QUUcyWnW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-14 04:10:29.616255	\N	\N	\N	\N	\N	Chris	f	dd8f4222193e1d6cdadb060af4ddfb8f1e4065398933d2b9e01b141e1bff60ea	2026-01-16 04:10:29.594	\N	f
464	lylaferrari@hotmail.com	$2b$12$Sq2liST2CuSaWEfvwbgfCO56i2ASCE3bJyk.6yQCiBnBxj4EgW.tq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 00:30:39.561378	\N	\N	\N	\N	\N	Lyla Ferrari	t	\N	\N	2026-02-13 21:13:33.561	f
466	mickyhabibrl@gmail.com	$2b$12$LSRaGseBMoHsH./lVV5BzeqaK5n.zaemUr28qpqzcXjgnpUyvpvje	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-06 13:30:05.184068	\N	\N	\N	\N	\N	MickyH	t	\N	\N	2026-02-13 21:13:34.262	f
484	classictoblerone55@gmail.com	$2b$12$kusdJoz0kBULZKGruT/Qy.xaDxyj.6ZKMZZWjsjBqgtgkyLjoMQpm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 03:18:26.198353	\N	\N	\N	\N	\N	Lisamaria	t	\N	\N	2026-02-13 21:13:35.037	f
481	neville@chartra.org	$2b$12$5yvnA4m.hvZMf9BNl4W14eVb4Zn8cCKmTVNKFwE5ioByEkkdG/7MK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 20:54:38.441264	\N	beta-1769201836479	active	beta-searching	2026-04-23 20:57:16.479	Bob12345678	t	\N	\N	\N	f
479	pariswilk@icloud.com	$2b$12$6wkGaQpmMH.WPk4qhup67uyN94Wb0CEhELrRdxuRtYi./tb4tU.HO	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-20 08:00:39.612682	\N	beta-1768896099413	active	beta-seller	2026-04-20 08:01:39.413	PWW22	t	\N	\N	\N	f
480	rechelle.brost@icloud.com	$2b$12$m.1m4oMw8rs8T8QfsT2wlehj86IzqGSfLFfQMqOLAPAP.WJydPr.u	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-21 09:17:33.074639	\N	beta-1768987206337	active	beta-searching	2026-04-21 09:20:06.337	rechelle.natalie	t	\N	\N	\N	f
482	leannewelsh@live.com	$2b$12$6bUVX6D/l.89k6YHKmBm5.vJT7QSQeqIKUXM2tE9K3vvI6qeqkMkK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 02:25:35.264746	\N	beta-1769394401101	active	beta-searching	2026-04-26 02:26:41.101	Leannew	t	\N	\N	\N	f
485	scarlett.pony@icloud.com	$2b$12$Ybj3h62dTNL7sJcLffICsuazR5MVqw45iFfEbNRBTT/6CXvQNVc3S	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 02:40:18.6458	\N	beta-1769827288081	active	beta-searching	2026-05-01 02:41:28.081	Ramsay	t	\N	\N	\N	f
486	info.kilronan@gmail.com	$2b$12$T.RpxpKU.Iw0oaXBAQ7QS.j1xfH889t/n339w2prZsaEBDmizIbu.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 04:30:34.927877	\N	beta-1770179534897	active	beta-seller	2026-05-05 04:32:14.897	Kilronan eq	t	\N	\N	\N	f
699	maddystrauss@hotmail.com	$2b$12$tUzlFfSEiPuUqxxlZH7Gaephzvt3Uc3ItymgKofbo5clA5E2auEXu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-22 11:13:46.659386	\N	\N	\N	\N	\N	mstrauss	t	\N	\N	\N	f
487	smith.zaraa3@gmail.com	$2b$12$B0xQUASlF5xhDkSVQy/uY./OGke1g8oiA/n5qySRhGkP0TWlKH8SS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 08:38:42.557697	\N	\N	\N	\N	\N	Smith.zaraa	t	\N	\N	2026-02-13 21:13:36.457	f
488	lucy@themillgym.com	$2b$12$QgW3ef9wv99xjKABcDOJ/ezOalqcTALkBuoCNSVNMRlJgzmDcPXFW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 08:40:31.479056	\N	\N	\N	\N	\N	lucyc11	t	\N	\N	2026-02-13 21:13:37.159	f
502	bekcarrolan@gmail.com	$2b$12$GcmgnfgrpF4DrJu7FjsmZujxiMwLjP.d1tqitT5w0THfpFh9MgRwS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:59:59.495037	\N	\N	\N	\N	\N	BekC2026	t	\N	\N	2026-02-13 21:13:38.588	f
500	ashleigh.rigney@gmail.com	$2b$12$WTXwiGHtNum3RhjQfGSese/jOjqZc9MKgq1DAdM6z/OJQEs60mY/S	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:40:10.676862	\N	beta-1770198185986	active	beta-seller	2026-05-05 09:43:05.986	Ashtonks2	t	\N	\N	\N	f
490	sgcraddock05@gmail.com	$2b$12$RHc75ZAWzEiouSz5h1cNa.BDwgxgR5NrwiqVypegvemz4psLNM3ki	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:00:14.063376	\N	beta-1770195722991	active	beta-searching	2026-05-05 09:02:02.991	Sophcradds	t	\N	\N	\N	f
508	capoulsen@outlook.co.nz	$2b$12$hCD0qzCpXMKIpWihu6xyOOPVfPwxp5g3KY16BysyDLd0ongqqiUTm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:31:07.927539	\N	beta-1770201113691	active	beta-searching	2026-05-05 10:31:53.691	Christy154	t	\N	\N	\N	f
492	kimberley.bootes@gmail.com	$2b$12$HsKwt3J1tY8Qyevjn5v2JuobErDWiCn//IthxbyRvhEJxYHxr/hlO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:05:09.690782	\N	beta-1770195984115	active	beta-searching	2026-05-05 09:06:24.115	Kbootes	t	\N	\N	\N	f
291	c_mcmeeken22@outlook.com	$2b$12$SoQ/e46Cw1GwHJjCSVdzaOe6SlDZQ/NebBINpwiQelp62/gAo/cia	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-05 22:59:53.201892	\N	beta-1762383640933	active	beta-seller	2026-02-03 23:00:40.933	C_McMeeken22	t	\N	\N	\N	f
501	abbie@fastmail.com.au	$2b$12$CwtkLJQqSwEeKOuSTMDSQuHyBQFnIaIBnVNHPCOXywioT7fR8RbTy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:54:02.410385	\N	beta-1770198889041	active	beta-searching	2026-05-05 09:54:49.041	Abbielewis	t	\N	\N	\N	f
494	halinamsaunders@icloud.com	$2b$12$SogsLTuocSzRyZrZKGrfgetdOspza.GtVWobSnheSK/ZBbcPmo9KW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:16:20.152808	\N	beta-1770196622483	active	beta-seller	2026-05-05 09:17:02.483	Halina Saunders	t	\N	\N	\N	f
495	karen@beautifulbellies.com.au	$2b$12$UyqrZsN6HjKA4G/qoPWSBOKi0r08XBoqAihGVHAxgvMPGsRpQdPSu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:18:57.625703	\N	\N	\N	\N	\N	Karen	f	bc2b50394e8df3e913ef85ed7c5015ad0cfce26c6f82743dba4a63b9ea63803c	2026-02-06 09:18:57.603	\N	f
509	ellaforbesy7@gmail.com	$2b$12$2f/ehAU/Ku1pmSSlM2gqQ.o5jwNW9kmXGlJYd21zLBGxsUZbe8anO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:35:53.213368	\N	\N	\N	\N	\N	ellaforbesy	t	\N	\N	2026-02-13 21:13:39.303	f
497	anna.musgrove@hotmail.com	$2b$12$cTr1aEzbJxBDIchzroMOa.DLYm59CRxq8yQsSKq40fNkcJr/3nZR.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:22:37.155458	\N	beta-1770197004501	active	beta-searching	2026-05-05 09:23:24.501	AnnaM	t	\N	\N	\N	f
505	lottiebull123@gmail.com	$2b$12$ZLlcCj4Mea24GqLTdOohvOpJuFQlAYRPWX0z1BNP6gbqGZtSAJRAS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:20:43.420346	\N	\N	\N	\N	\N	Lottie bull	t	\N	\N	2026-02-13 21:13:40.007	f
499	errin.kate@gmail.com	$2b$12$oT54646Qj0NcVaJLfpFnGeA7qS458V2WFi8sXgyO4KMiDoicVOViK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:33:55.838027	\N	beta-1770197669061	active	beta-searching	2026-05-05 09:34:29.061	ErrinKate	t	\N	\N	\N	f
504	tegan.coulter@hotmail.com	$2b$12$7gBHXGs4We.EYXzoT43pdOPu4zNZauQY23VMN7PpgtitpU.jpLTrS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:18:58.900635	\N	beta-1770200407712	active	beta-searching	2026-05-05 10:20:07.712	TeganCoulter	t	\N	\N	\N	f
506	katehage@hotmail.com	$2b$12$nMfyUSnk5A5q.71nP7bjaedVhq1uEuNVyVlg9B7xbJo25IoGNZCX2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:21:14.288783	\N	\N	\N	\N	\N	KatieH	f	b5093ef42cf3562f42b8bc0fb59c1d3af4ae87461fcfb57a14275ca35fab90e2	2026-02-06 10:21:14.269	\N	f
514	bree.connell@education.nt.gov.au	$2b$12$BTT87WjS3uL0RgchIuwL/Of0PnhkJYdaBLiwfrtpE4zYsfiWQJ0mC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 12:34:34.298699	\N	\N	\N	\N	\N	Bree.connell	t	\N	\N	2026-02-13 21:13:40.707	f
513	sheenajross@gmail.com	$2b$12$/8doazxApaT0xOzWN3YWxeDT27BUT.GiaxeyQRlnAXOomVQah0hW2	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 12:20:06.356242	\N	beta-1770207642340	active	beta-seller	2026-05-05 12:20:42.34	Sheena	t	\N	\N	\N	f
510	manestride.e@gmail.com	$2b$12$7.IpXJztgBcUW.DLQAV/kO/gT2Mp3vabAjhy1xPLh1nuowm8H6pEW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:38:01.288318	\N	beta-1770201541152	active	beta-seller	2026-05-05 10:39:01.152	Jlverne	t	\N	\N	\N	f
507	cassiewhite66@gmail.com	$2b$12$Mwf7Llgt7xwC4tjW61toq.BRsjPkBVxKpQ1kfmv6lPHBqxqyb363K	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:26:03.713574	\N	beta-1770200896976	active	beta-searching	2026-05-05 10:28:16.976	Casspotter	t	\N	\N	\N	f
512	sandybec@hotmail.co.nz	$2b$12$VrvsEZhzJJHpeMWD0P07q.zwnyTzA5O3ASJD7eHZR0Xw4F/WSVRN6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 12:00:12.882184	\N	\N	\N	\N	\N	sandybec	t	\N	\N	2026-02-13 21:13:41.429	f
511	jasmindawe@gmail.com	$2b$12$4Zc.mYyL6VAEv25IrSPiG.ybmQoJEjdC1b2N3e/ldZAixMNQL1Flm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:45:25.566581	\N	beta-1770201961480	active	beta-searching	2026-05-05 10:46:01.48	Jazzyd	t	\N	\N	\N	f
517	g.sattout@hotmail.com	$2b$12$D4KAxbLgD/ftuhjynhQLceWC9LFZn.odSJzYhMPe1Qr.h/EZSlAfK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:30:45.592861	\N	beta-1770219093246	active	beta-searching	2026-05-05 15:31:33.246	GMS	t	\N	\N	\N	f
516	craigapcochran@gmail.com	$2b$12$3nPh3B1AQT9GiMbQTR7rRuKnpHABK.kz/zrbGX5Nbn.H5cWP.ETR6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:03:16.651859	\N	beta-1770217470753	active	beta-searching	2026-05-05 15:04:30.753	Craig80	t	\N	\N	\N	f
515	julie.isbister@gmail.com	$2b$12$pc../dy0UKDMvcAXIlBOS.Ws4rxpBcEuoNBrWAGChsG9NJpeiFhfG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 13:36:12.479255	\N	beta-1770212203885	active	beta-searching	2026-05-05 13:36:43.885	Julie isbister	t	\N	\N	\N	f
518	reay.hannah@icloud.com	$2b$12$fbItpjVhsWLhsYbobMAOuOIpICmYj.ppELitakrCYIAx0kYJI7hw.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 17:45:03.033394	\N	\N	\N	\N	\N	Hannahreay 	f	37aab2c59cf118f5d223295a985062b9801f5543292388ff458d6ac1772167c5	2026-02-06 17:45:03.011	\N	f
523	mikaela.mac2@gmail.com	$2b$12$/VBN6UwEVTxEJ1JIL5KW.uehCGvah3t/wri908./GJU0Hi2iFLNiW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 19:01:04.697299	\N	beta-1770231933577	active	beta-searching	2026-05-05 19:05:33.577	Mikaelamac	t	\N	\N	\N	f
522	hannah.reay25@gmail.com	$2b$12$QQ1TMML3J4Pphke/uhdXDesrv1twt05D4yqdaUqpYPb3/7Dk8tMp2	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 17:48:05.405048	\N	beta-1770227329340	active	beta-seller	2026-05-05 17:48:49.34	Hannahreay25	t	\N	\N	\N	f
491	oneill1@activ8.net.au	$2b$12$FC.iEcM0yiINlBF3uJuiNu8HYZZYflldr5RapXGdT7/v7baL4JVEi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:03:17.604733	\N	beta-1770233890324	active	beta-searching	2026-05-05 19:38:10.324	Djo1973	t	\N	\N	\N	f
524	bandsmckay@bigpond.com	$2b$12$O5h6Ipt8uxVfA8hnUnlL/.roDW5fyyq2GL1I5VyyxvGMaibKediZC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 19:51:20.424564	\N	\N	\N	\N	\N	SusanM	f	1902d9822aa1dd285a2857bb160fe79ef6965828f320d8002c8dbc8b23a14922	2026-02-06 19:51:20.406	\N	f
525	generalnoshame@gmail.com	$2b$12$hqEeiLDIJZmLCl6dhFep1eF5ZXCrfQJhi3iOgPFfyE7Ce99ZDtekq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 20:01:26.00703	\N	beta-1770235339740	active	beta-searching	2026-05-05 20:02:19.74	speranza 	t	\N	\N	\N	f
526	jharman7@gmail.com	$2b$12$uimjClands.9qtKbgD4zpuMqQn4JXlWBAAy6P0Pi5R/15l14sS84K	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 21:53:36.753233	\N	beta-1770242061932	active	beta-searching	2026-05-05 21:54:21.932	Little76	t	\N	\N	\N	f
496	stephfenn@live.com	$2b$12$OHHmLSD.M/nbQCpjoKWPEO3xdRU4ykIvbfImQOfV6jeREnqI7QRKm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:22:16.607334	\N	beta-1777887481919	active	beta-seller	2026-08-02 09:38:01.919	stephfenn	t	\N	\N	\N	f
503	maggie.johnston@howdengroup.com	$2b$12$VDEUTYGR7TNFQ3joN.4ytu3WjLL8ZC7Dzp50kPf0xZ1bdQ1WEDmTi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:04:41.691933	\N	beta-1770364397458	active	beta-searching	2026-05-07 07:53:17.458	HowdenEquine	t	\N	\N	\N	f
394	sienna.pullar@gmail.com	$2b$12$9HpUjs7OGYJ/wrP7vVEeheoFQ885P97azDnRnUP0GsL8WkB4hlpGG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-09 20:43:58.729975	\N	\N	\N	\N	\N	Sienna2323	t	\N	\N	2026-02-13 21:13:35.743	f
498	oakleya@macstudent.com.au	$2b$12$bsiFHb.iUh6fMB/teuQL3OJPEq7BwfIfdsPEQZM/Cm1JG7wAa6w/y	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:27:26.634323	\N	\N	\N	\N	\N	Aoakley	f	\N	\N	\N	f
660	ellasantry@icloud.com	$2b$12$vplsRu2NnIJ0yN8.Q3DbmOx/qxxrddlnTF9rJK3da7xmT5hTUgdU.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 09:23:52.928998	\N	\N	\N	\N	\N	Ella chase	t	\N	\N	\N	f
659	karenleepaech@gmail.com	$2b$12$3Mb3Ma8x54s3.UpWmvr.9ORPfzih0eRtxnTyrsQVOOxMhdxSzgxgW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 07:57:45.932147	\N	beta-1772697540481	active	beta-searching	2026-06-03 07:59:00.481	Karen 	t	\N	\N	\N	f
527	dakotapinton12@gmail.com	$2b$12$EI7LgGGpHPpVyV6EpItw3OW0sJVWlUZc/tYptXkcKDVmZ9LkltwZG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 22:01:48.833472	\N	beta-1770242551923	active	beta-searching	2026-05-05 22:02:31.923	dakotap	t	\N	\N	\N	f
554	kaipiralodge@xtra.co.nz	$2b$12$P9Q0cqTCU/oI2BaRsoNrP.dDEnHxYwi3rNLeu/IFY4MTmKUQm9WXm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-07 01:47:44.149383	\N	\N	\N	\N	\N	DanielleOliveira	t	\N	\N	2026-02-13 21:13:45.703	f
547	georginapersephonemichael@gmail.com	$2b$12$i5VQcRiAYv5y7G1HbvkMUuiQLVoZ6aPijHW3pi7j6W2HvgGzsPk2m	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 08:40:47.139767	\N	beta-1770280892880	active	beta-searching	2026-05-06 08:41:32.88	Gina803	t	\N	\N	\N	f
529	samiwort08@gmail.com	$2b$12$0IrrKNIas/tG0xwqfxpRR.bRFpHwySp19d9i.oxOYDBZebF1uA2l6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 23:02:53.117072	\N	beta-1770246242244	active	beta-searching	2026-05-05 23:04:02.244	Samijw_sjw	t	\N	\N	\N	f
538	rj3sporthorses@outlook.com	$2b$12$/k7B0QyNW6M.ojDbRiqMtOn8LuH9xau3DxpBs3QxoD5WQ1pG6bNoK	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 02:05:47.122697	\N	beta-1770257199020	active	beta-seller	2026-05-06 02:06:39.02	RJ3 sport horses 	t	\N	\N	\N	f
539	david@australianjumping.com.au	$2b$12$EpNBpkZTShNhDq6RliwNm.LdjVxe0j6pgXZtKOCoWXMz1p8l/d0la	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 02:06:45.886334	\N	beta-1770257237751	active	beta-seller	2026-05-06 02:07:17.751	David AJ	t	\N	\N	\N	f
549	bryn@maddoxequestrian.co.nz	$2b$12$secBc6hceAddAlM60J.sSuxoqfyi20kTTm9zq53r/VOgDFDJuJ00O	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 20:25:51.585797	\N	beta-1770323254395	active	beta-seller	2026-05-06 20:27:34.395	MaddoxNZ	t	\N	\N	\N	f
541	staceymccormack7@hotmail.com	$2b$12$9RMNnuZCUwFyDPOkgpqaX.IjCUOC6wBhLureStjJIQpHKMb/Vzr5e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 03:03:39.327697	\N	beta-1770260694974	active	beta-searching	2026-05-06 03:04:54.974	StaceyM	t	\N	\N	\N	f
533	orhau@icloud.com	$2b$12$/PInVMH9OR0i9d0UPYbsg.R4F2yjhrt.TBKexf/H6yq1SFpZ7qjHy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 23:42:15.575866	\N	beta-1770248567638	active	beta-searching	2026-05-05 23:42:47.638	livrhau	t	\N	\N	\N	f
560	misterlangy@gmail.com	$2b$12$YO/zsz49KR6dMBcrK/Jwwu6KTOtVBTJEpW69lZTlb9tTbtm.BPrxm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-15 03:22:19.950716	\N	beta-1771125786896	active	beta-seller	2026-05-16 03:23:06.896	James Lang	t	\N	\N	\N	f
535	sam.overton@icepack.com.au	$2b$12$qwRGIaUcYPOzqsHevWoM1ufJtuDb3Nfgvxv4acs9egruOH1EYNBf.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 00:02:40.541471	\N	beta-1770249812360	active	beta-searching	2026-05-06 00:03:32.36	Sam Overton	t	\N	\N	\N	f
543	maddisongraham2009@icloud.com	$2b$12$bYbP2ECPfJ8A5B0hP/gLNecUgSTmeVUP8JyGFBWKk5SNrhZPgq2s6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 05:28:45.940986	\N	beta-1770269353352	active	beta-searching	2026-05-06 05:29:13.352	Madds	t	\N	\N	\N	f
556	hrforestry@gmail.com	$2b$12$FdksnZAuYzQBfYZvtL3YcOYDyCdysWj8zDQdiDzOY3VxUUy0oFYQ2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-10 11:44:15.386905	\N	beta-1770723937773	active	beta-searching	2026-05-11 11:45:37.773	MJH	t	\N	\N	\N	f
544	daynaelkin96@gmail.com	$2b$12$baO7gNe94LwXAC66MpVE1euK4PTFXnrM8oaT6rSBEKPCMcFEAFo6C	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 06:01:07.717283	\N	beta-1770271323459	active	beta-searching	2026-05-06 06:02:03.459	daynaelkin	t	\N	\N	\N	f
551	charlotte@jedimail.com.au	$2b$12$TbPbLJwujXOM0LHyhQ1Kc.EcdlliQlTOZ5J8ghyvrMwhYvmt0TqyG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 21:54:48.292755	\N	beta-1770328511859	active	beta-seller	2026-05-06 21:55:11.859	Charlottealex	t	\N	\N	\N	f
563	sarah.borrack@bigpond.com	$2b$12$nK9h0GSwh9eXTb/B56sfvuDDmYZHMRdvptbvo5msOcXmMAWwfvt6C	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-16 11:21:04.44003	\N	\N	\N	\N	\N	SJB	f	448c9d81b38cf9ae2eaac05c5b9884770bb839fea52db210b5c45d8c91a9500f	2026-05-02 22:46:06.635	\N	f
552	kim.krilich@gmail.com	$2b$12$ckaOX0.0h4XM77/rqyQ5PuW1DXaMMY.ngfOCdHS45V1/GwcfZxJym	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-06 12:06:22.290645	\N	beta-1770379700538	active	beta-seller	2026-05-07 12:08:20.538	Kim.krilich	t	\N	\N	\N	f
558	sashamanning1234@icloud.com	$2b$12$k8EYo/fov.iOFQSxs1aAaeyE3dZi/z0mJqVUm52hj/OFjLjdW3BYK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:33:06.269064	\N	\N	\N	\N	\N	Sasha34	t	\N	\N	\N	f
553	grace.klava@hotmail.com	$2b$12$mHTYQzP1aaJ30/j5YXvs3.X/Zvlab8Z9pK1HAkH0AcoLEsF/SnGxm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-06 19:56:56.988878	\N	beta-1770407849576	active	beta-seller	2026-05-07 19:57:29.576	gracemay	t	\N	\N	\N	f
564	ruby.rao060806@icloud.com	$2b$12$gGEHJO2h8HidwFrPPEpaC.nAHFLJMDl7JazH1YYPDtdtTO4c3o3iS	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 08:25:27.605649	\N	beta-1771836247227	active	beta-seller	2026-05-24 08:44:07.227	Ruby.R	t	\N	\N	\N	f
540	pbrumby1@bigpond.com	$2b$12$AieorG4UAyJfPEbUMGQILul2IyLMChLdVYlxT5bQSVFWMItW11UQe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 02:35:38.116964	\N	\N	\N	\N	\N	Philbrumby	f	b1b84bfbdf96ee37dc6b572e9e43bc99e34c4b792de7fb8e38e7ce3a133f4b5f	2026-02-19 09:46:10.358	\N	f
561	kellyslater92@gmail.com	$2b$12$nCiEXGRNLKUZrHRZyU1WUeQwFmZ94yNJfxgIvNZZ/7Ay91r2gThtO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-16 01:58:53.643161	\N	beta-1771207839336	active	beta-searching	2026-05-17 02:10:39.336	kelly	t	\N	\N	\N	f
559	imogen@tutton.com.au	$2b$12$NGpQE1alkzCSCnV/v9Rp3eYiOvp1Wv/yuZ59fIMviQ6..KD3qh5eG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 02:06:13.602872	\N	beta-1770948429638	active	beta-searching	2026-05-14 02:07:09.638	ImiTut	t	\N	\N	\N	f
555	bellabarber@icloud.com	$2b$12$XsyTxROD91uZsWe3chs3RO16fcLvszHUnJpI9ONRsM/sFdP10C7/e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 13:14:29.46915	\N	\N	\N	\N	\N	bb5	t	\N	\N	2026-02-13 21:13:42.138	f
548	kelleykerryoung@hotmail.com	$2b$12$uzG9SH0j.LLkm62cKO2kFOXucKqyvPN5lU6D3CJ4Tf6XKh3VGLPaq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 09:47:43.426718	\N	\N	\N	\N	\N	KelleyL15	t	\N	\N	2026-02-13 21:13:42.839	f
542	jessicapeters1980@gmail.com	$2b$12$wrzqeWJz6.snc0uF37x0.eV.7bOhU2C69uVh.7ulSTEQ6bJxTFDAy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 05:21:11.698036	\N	\N	\N	\N	\N	Jessp1000	t	\N	\N	2026-02-13 21:13:43.548	f
550	cjlockstone@gmail.com	$2b$12$aKi.nyDwVbsq2yC789Y7vOxJXwbh5Nj0i4vz2fwIlrIgkJll1Jf7q	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 20:53:00.58784	\N	\N	\N	\N	\N	Cjlockstone	t	\N	\N	2026-02-13 21:13:44.273	f
557	r.mikala@gmail.com	$2b$12$cVtjoqkrEh92ksUR/C1UbuJLcHewkq0jmwEsKSv6rXMAvg2D2jfTC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 06:02:39.92122	\N	\N	\N	\N	\N	mikala_jane	t	\N	\N	2026-02-13 21:13:44.983	f
562	emmimenzies@hotmail.com	$2b$12$tGSh4rFx/IOZQYYeccWiN.bcbn4FBh8/eUIxgiSicegSmug73/Xq2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-16 10:22:55.062079	\N	beta-1771237428949	active	beta-searching	2026-05-17 10:23:48.949	Tydruk5	t	\N	\N	\N	f
493	rogermarucio@hotmail.com	$2b$12$oPks7T/89bK01MYspEmtN.xVOVfiz.IPBEQyVQXyA8Vr9XtQ6u/IK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 09:06:33.077513	\N	\N	\N	\N	\N	Rogermarucio	f	\N	\N	\N	f
566	maili.kaimarechal@gmail.com	$2b$12$lB0Az8aci6pL6kQJMyD/veDgCdvEdrVT1nNHNJCjw.XC1Jst83ShG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 12:25:33.090606	\N	beta-1771331163870	active	beta-searching	2026-05-18 12:26:03.87	Mailikai	t	\N	\N	\N	f
567	nicole.oshannessy@hotmail.com	$2b$12$LzOk.ShkeMIrlwL0dacLVu11dWDEw83xxJhR6o6vmc9NLQjFH50pi	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-21 03:14:18.586091	\N	beta-1771643739782	active	beta-seller	2026-05-22 03:15:39.782	BourtonPark 	t	\N	\N	\N	f
569	ehmcculloch23@gmail.com	$2b$12$4L7G3BR61U4pUGGU0O6DC.TQxc2rgl/nnQy7A/k1eS3XksAT1jevC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 07:52:47.920253	\N	\N	\N	\N	\N	EStewart	t	\N	\N	\N	f
568	amy.aksila03@gmail.com	$2b$12$5XSvZ64tk4E1/LASDVnTi.mb49wLNP6E3uA1aR.i8PX8Wiyyzm7z2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 07:43:41.509913	\N	beta-1771832697378	active	beta-searching	2026-05-24 07:44:57.378	Amy	t	\N	\N	\N	f
571	angelicapickup8@gmail.com	$2b$12$lX2FFa7ING7wkIMtGPODL.i66DAGgOPwzuV6zqH..yzL.7/ruXSV6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 07:59:30.058001	\N	\N	\N	\N	\N	Angelicapickup	t	\N	\N	\N	f
572	noemailrequired@gmail.com	$2b$12$XMut.fYPBtOF.ckjMyiT7e.lvSHGFQ63djFLIT38YnTxmjkcTxjFu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:00:40.094005	\N	\N	\N	\N	\N	ABC1244	f	ee0813837bbd393355fae8f52461242aa1e25e918914584831c615a1a6fe0e5f	2026-02-25 08:00:40.079	\N	f
573	kadellsykes@icloud.com	$2b$12$C2psWvGUECx4oDqyRwUyqeCP2iWL76X2js839UQtQqcpSzsHd11Cy	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:17:35.079684	\N	beta-1771834703701	active	beta-seller	2026-05-24 08:18:23.701	Kadellsykes	t	\N	\N	\N	f
574	wdaniels4@gmail.com	$2b$12$s1vF.Bp0UsBLhFfCkqZXzuKwAor8IXc1q7b7uynyPtSBwJUrIU2Da	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:17:36.20653	\N	\N	\N	\N	\N	wendy	t	\N	\N	\N	f
570	equusau@bigpond.com	$2b$12$Yc/zkWCCgwNrGwzaz/mKHe4su5lCDAlg4zkBAMbcO3kw49c5vyul6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 07:57:51.283823	\N	\N	\N	\N	\N	Equus	t	\N	\N	\N	f
700	tilly.grant@icloud.com	$2b$12$9Rhn.M8XILE5q9swxMJ87e7NckrvRVkEubf10TIz6c76scRDSb5GW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-24 02:00:54.261865	\N	\N	\N	\N	\N	tilly.grant	t	\N	\N	\N	f
576	nicolaferendinos@gmail.com	$2b$12$VhRusnR6u8xFjt2mKadnsect9F/wO3/0iF3U/qi3n8iysSe8X0Ive	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:20:19.901194	\N	beta-1771834872084	active	beta-searching	2026-05-24 08:21:12.084	nickyferry	t	\N	\N	\N	f
577	monetstevenson3@gmail.com	$2b$12$fPCbEmlpmc11pwyvKSM4weIEyISR5oKrdFQ9ouDPr1/gcdZAT5iga	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:29:06.01523	\N	\N	\N	\N	\N	Monetstevenson3	t	\N	\N	\N	f
588	saskia.grace.miles@gmail.com	$2b$12$2rRxVpvVNYzxxfMN.V5TrubSFfUTYbr8iIDi4cgOm44EJXzDxWNo6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 10:40:35.074184	\N	\N	\N	\N	\N	saskiamiles	t	6b022504508d6895efda8fd849e80f012f480289b6890ee6199b19202b5a9aeb	2026-03-06 21:55:34.158	\N	f
578	gracecoverton@outlook.com	$2b$12$YluYeQWsD09Bva0tdfQ1O.exY0PSq4ZLCmnEyWRbDT.vQpG5jUiRi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:35:17.124996	\N	beta-1771835753323	active	beta-searching	2026-05-24 08:35:53.323	gover17	t	\N	\N	\N	f
587	kkjnr@hotmail.com	$2b$12$P9T6LG0ad/a.muW8z9JOT.FW14PJXuHUyyAQg8D135IXeMXDcfqm.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 10:40:02.145265	\N	beta-1771843270738	active	beta-seller	2026-05-24 10:41:10.738	Katie 	t	\N	\N	\N	f
579	alicia.daly777@gmail.com	$2b$12$SY9Er.8JG1KM7Gpf9ZbuuuFJheHjrQTtCpI3eNBGEFnIyMvsA/tzC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:56:50.839001	\N	beta-1771837044564	active	beta-searching	2026-05-24 08:57:24.564	AliciaD	t	\N	\N	\N	f
589	chelseabager@outlook.com	$2b$12$V3X12Hi9hPRgccRy9FhomOjjDWn4Q5BmHKkpvUYxwzx.EtvKLW9kS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 11:24:27.898112	\N	\N	\N	\N	\N	chelseapocock	t	\N	\N	\N	f
575	jess_somerfield@hotmail.com	$2b$12$GfE6H96QJ7ho5gnV3RPGb.B0OQtmXNo7RJetc0mf9v93prPy8Lnva	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 08:20:05.909363	\N	beta-1771837402342	active	beta-searching	2026-05-24 09:03:22.342	Jess Somerfield 	t	\N	\N	\N	f
580	hannah.cooper576@gmail.com	$2b$12$5f5U5ExjuQYV6/TT3dn/z.x2E/lkyVnM1KsfaEW0TGNAcB2NeY8ye	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 09:14:24.794809	\N	\N	\N	\N	\N	Hannahcooper	t	\N	\N	\N	f
590	liongate3222@gmail.com	$2b$12$jmMKksv6IJfGxEwXTgYyAeWxWmqSnCEgQI7UQxfl8t/4HIUkaTkF6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 11:55:16.83573	\N	\N	\N	\N	\N	LionGate	t	\N	\N	\N	f
581	chloefletcher10@icloud.com	$2b$12$kWmzOXbsxF.CdZMPdV1/L.0Y.5kdgN.EDakjzNFdQ86nYEfEA9N9S	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 09:19:33.986079	\N	beta-1771838414035	active	beta-seller	2026-05-24 09:20:14.035	chloefletcher	t	\N	\N	\N	f
582	charlotte.w@iinet.net.au	$2b$12$vnCFhlwQJz8HIDAGjdEV..rn6fVPorlYtqd6Jq3NIJf5KRaVPPiQO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 09:22:02.031573	\N	\N	\N	\N	\N	Crw734	f	345626e7b8389cc74c4c7b45e56013318109c6daba38248fa1419736f0ebe87a	2026-02-25 09:22:02.015	\N	f
583	timbowman86@yahoo.com.au	$2b$12$xe.b04zyg1q6qbAA3sIAPekA2bbEGL/LrjGVhBetvztqZWrwFGo5e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 09:42:17.308143	\N	beta-1771839826918	active	beta-searching	2026-05-24 09:43:46.918	Teb001	t	\N	\N	\N	f
597	hwalldiva@gmail.com	$2b$12$Bqe2lyVGzC0ae4kd1BLtMepxpM8IIoU/SOk0BIYnsQb6L.ki7T62i	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:46:45.244117	\N	\N	\N	\N	\N	Hayleywall	t	\N	\N	\N	f
591	rileyzac44@gmail.com	$2b$12$cLihWklzCMBZao8sHX9KC.t/UStlrpTQsH8lIOFk5UgXOIEWwCaT2	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 13:06:19.485078	\N	beta-1771852031531	active	beta-seller	2026-05-24 13:07:11.531	Rileyzac	t	\N	\N	\N	f
584	harveyk597@gmail.com	$2b$12$dJEm.puLAy5EJxX7Eww6du.FYCnkygzWExaQeaBw/dnY4Jm7BQXGy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 09:48:24.97534	\N	beta-1771840192237	active	beta-searching	2026-05-24 09:49:52.237	Gina	t	\N	\N	\N	f
585	jacquiri@hotmail.com	$2b$12$qXSujGxKsoM5zzxZt9BmuerrKzZ5g5bU3kZZp5vCfzooj2.OSGA1i	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 10:00:27.754574	\N	\N	\N	\N	\N	Jacqui	t	\N	\N	\N	f
593	bwequestrian1@gmail.com	$2b$12$tyOzI.AaU2T1MuDv1Eo6geEIU3o2.iRX2rLRLT2YObYiwv5G7QipC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 19:29:09.823167	\N	\N	\N	\N	\N	BW2000	t	\N	\N	\N	f
586	rebeccaburgmann@live.com.au	$2b$12$BCUnJh/Z12mCsJ/idkkH0u9mfaEDQKtK2xXyRT1230uj88E0fC/WG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 10:12:18.497281	\N	beta-1771841889177	active	beta-searching	2026-05-24 10:18:09.177	Majestic44	t	\N	\N	\N	f
598	admin@acmart.com.au	$2b$12$5GUWbIo5xxb2vrLsyQmNJe/Q/oGhO5jLwED5qx0k93L9GsmwEVKYS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:56:44.646494	\N	\N	\N	\N	\N	Nairiee 	f	379385d0faa358f395f5029cd2fbc9dce470d5354ab7294a60c760102d907e21	2026-02-25 21:56:44.63	\N	f
594	s.becke@hotmail.com	$2b$12$Wi5k3F6ka2NNFRSZBhjpmORaA3X8Dcp669AgUAKA071R1P6eLppDi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:02:53.360597	\N	beta-1771880652885	active	beta-searching	2026-05-24 21:04:12.885	Suzie	t	\N	\N	\N	f
609	chloeleecarruthers@gmail.com	$2b$12$Agb0czgJSMyRr.lOLNRdNucIhSJnVOp3uPzTtwKe2Nm24BGoJa7t6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 07:09:35.056053	\N	beta-1771917018594	active	beta-searching	2026-05-25 07:10:18.594	Chloecarruthers	t	\N	\N	\N	f
607	gabyherbosa@gmail.com	$2b$12$3GzGrohhgnA4YN/12c77.eeLNx5tg6AFJGXHVQLfxCjEIWw7okmbu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 05:55:35.720249	\N	beta-1771912675387	active	beta-searching	2026-05-25 05:57:55.387	gabyherbosa	t	\N	\N	\N	f
595	riannareeves05@gmail.com	$2b$12$Z7qQOCG/LJ8gwBETzCeUZ.xeztMVvNjJphLyKUS0hTJ0UonTpCB8S	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:35:20.879337	\N	beta-1771882569369	active	beta-searching	2026-05-24 21:36:09.369	Rianna	t	\N	\N	\N	f
604	tanya_hansen@hotmail.com	$2b$12$IK5O/J.R5Cpa6zeyOXsGvOCbTGovn8AHs8AP87qI5d2vDXFa6RVGi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 00:36:48.105558	\N	beta-1771893437519	active	beta-searching	2026-05-25 00:37:17.519	tanyahansen	t	\N	\N	\N	f
599	chelseataunton@icloud.com	$2b$12$4qc8UKdBrHBwkfCnLWSgEuP7eLPcDFOCrASDbPJugmI4fXqZI0PkS	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:57:04.397763	\N	beta-1771884781008	active	beta-seller	2026-05-24 22:13:01.008	chelseaarosee	t	\N	\N	\N	f
600	addybob@icloud.com	$2b$12$aZ3OWcU109xfdMM7JFFimusuYkcryPdSJHxGuY/HzXQkqdAS10geO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 22:37:54.230153	\N	\N	\N	\N	\N	Della	f	f0e193ce63f710a6d6e7f696970789db07e8ab19818730b4e6b8136208b930ed	2026-02-25 22:37:54.213	\N	f
602	jgr@live.com.au	$2b$12$7MyWGAJXM/sVBI4OT/eIWOuhFQvj0uWLPStirUgkl3OeknY5GIRBu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 22:49:48.524296	\N	\N	\N	\N	\N	JGR Equestrian 	t	\N	\N	\N	f
605	sarah.dyson2@education.vic.gov.au	$2b$12$RUjt5.j32NXSybPFhi9xpuITZPfRxJYh1wIGYYxLXHgozO8.aCdIC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 01:31:23.420551	\N	\N	\N	\N	\N	dyarah15	t	\N	\N	\N	f
603	eviecaton05@gmail.com	$2b$12$Y8BYNNNHjdEk80N80SkYw.5xqyFlo9Ax0T5e5z8..E9VREAFEKMv.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 23:08:25.50222	\N	beta-1771888133302	active	beta-seller	2026-05-24 23:08:53.302	eviecaton	t	\N	\N	\N	f
601	dairymnager@outlook.co.nz	$2b$12$jPF63myc8u3uvhDzVTxQF.3hkr6XeNf8Ui2CgpqPRnknSxldB9Rtm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 22:45:32.711097	\N	\N	\N	\N	\N	Lynn	t	\N	\N	\N	f
606	leama73@gmail.com	$2b$12$E8Na6wePvTsDC1HIuvSvIO6vSCe10FFy/Lm6bwlB41ttUCZC2/YmW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 01:33:59.393877	\N	\N	\N	\N	\N	leama	t	\N	\N	\N	f
608	jessielloyd93@hotmail.com	$2b$12$dnRYq6d5BWswaWtAik4kp.qRXG0EX.lgp5BzAW6mzDrCWfiUyAu8e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 05:57:41.357373	\N	\N	\N	\N	\N	darcy11	t	\N	\N	\N	f
612	andersoninteriordesign01@gmail.com	$2b$12$w0ElT8xLx4j6bQgDxnsQkOJrShH2K/IWBHy/HOhwrsrlSoTjwT3oy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 11:06:32.48806	\N	beta-1771931271031	active	beta-searching	2026-05-25 11:07:51.031	Laurenanderson	t	\N	\N	\N	f
610	paige.cartwright@gmail.com	$2b$12$Z8S6DIjFX2axkIAbR2xUleAVA/esVgyGDcu7GUrojgKyD5D/Tvd7G	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 07:56:41.430572	\N	beta-1771919836812	active	beta-seller	2026-05-25 07:57:16.812	paige cartwright	t	\N	\N	\N	f
611	edenmcmahon44@gmail.com	$2b$12$D5kmZaNTLZmq1nKkpe1VK.MjyzhzgwoPo6uDkFai5bS4j.Zj3m3ze	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 10:33:20.710414	\N	beta-1771929227750	active	beta-seller	2026-05-25 10:33:47.75	edenmcmahon	t	\N	\N	\N	f
613	reedequestrian1@outlook.com	$2b$12$8tNJ3iIQuqSOnrDeWjmC4.4lwj320HTD4nLrE0NOAyBZQIvugYZYm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 12:10:18.549752	\N	\N	\N	\N	\N	Clive Reed 	t	\N	\N	\N	f
614	user780@hotmail.com	$2b$12$HBqqk8TM/54QwN781sqUzuo9GNOrEVHVQCjKQy5XvzHWGBOmf7awW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 17:48:03.448767	\N	\N	\N	\N	\N	Lena66	t	\N	\N	\N	f
615	tanjayepark5@hotmail.com	$2b$12$8hCuLVKW/7.ZDkWzxqPeYecCoxpRjn2/I3deRTPaSE8wR.d1XUMpm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 18:33:40.59332	\N	beta-1771958117400	active	beta-seller	2026-05-25 18:35:17.4	TDE93	t	\N	\N	\N	f
616	amy_mcmullan@hotmail.com	$2b$12$sqBBAxHcy8lnBAgJuItUKe828/f/eiXmWqZHpsWAsMjL8mM9NKTOe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 19:08:43.132698	\N	\N	\N	\N	\N	Amymcm11	f	\N	\N	\N	f
617	sophie.ts.m@gmail.com	$2b$12$yXcdYGDhEzNH4HCH4P4ViOUhSz31tK5A1383Ermi0v2mGOwVOagUC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 21:30:57.439759	\N	\N	\N	\N	\N	Sophie.ts	t	\N	\N	\N	f
619	kayleestephens59@gmail.com	$2b$12$UdZp0IFMt7k25GjWxC1AruV/pORCsCds4wunN6OuV7bqtvhSPGaYq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 21:31:20.655937	\N	beta-1771968779279	active	beta-seller	2026-05-25 21:32:59.279	Kayleestephens	t	\N	\N	\N	f
631	flowery84@hotmail.com	$2b$12$smsDTyu5xOkw5bKjvNuxqOXQj527h8BGSCpZzuGW35vKtEQH3jqR.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 21:31:17.952338	\N	beta-1772055503642	active	beta-seller	2026-05-26 21:38:23.642	John Flower 	t	\N	\N	\N	f
632	whitten02@bigpond.com	$2b$12$D2cjYDvP9iihdueLrHu.j.1S7EeNJnT4aEbWMROC/oxhT.ztsybUe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 22:56:49.437059	\N	\N	\N	\N	\N	alysun321	f	ce04fdcc85126dd54d38ba7b404b19a8164164e352c386ef7c9fd0ce0d28a092	2026-02-27 22:56:49.418	\N	f
620	adawe77@gmail.com	$2b$12$.Gub8ChvJlK.1cREpYwaieKDjPCAJaWYu1DaVG4uEieVy2A/MDeHe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 23:01:43.266218	\N	beta-1771974223693	active	beta-searching	2026-05-25 23:03:43.693	Ozzie77	t	\N	\N	\N	f
621	skotty2234@icloud.com	$2b$12$mtSiAoghWnndKjIcF0qINeEHIjezAvqlwniu5oWAdhFYSPZX0M.De	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 01:06:37.317849	\N	\N	\N	\N	\N	nikita 	t	\N	\N	\N	f
622	info@drumsox.com.au	$2b$12$a2klt4qHfGkVJ4ZcJ1EYpulkygIE8BSCI81bI2v400Ij6PUetUjgC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 03:11:53.026812	\N	\N	\N	\N	\N	BenitaCadd	t	\N	\N	\N	f
623	justxok@gmail.com	$2b$12$KDfn7OIv7OWFGXla9Ds1qe3G9Ddonf7woqL8LRABUl5phb/69588y	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 03:49:13.131614	\N	\N	\N	\N	\N	JustXok@gmail.com	f	d0e812507a133e433ca5d28bd4e344d19c11571890fc54865861654c5ea95c03	2026-02-27 03:49:13.113	\N	f
624	lily.peeters07@icloud.com	$2b$12$3bkWkOwCJsyGQG2HRolsT.3plRsRwGwe/8f2dh9AaaQnM1d1wCPzS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 03:57:06.944325	\N	\N	\N	\N	\N	lilypeeterss	t	\N	\N	\N	f
639	emily.inwood@hotmail.com	$2b$12$j0ebM4MOMbvZPgi.LyY7Z.3i1bMW865dZ1bANBgEbvWEGEOfNU4oW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 07:43:14.765594	\N	beta-1772178246038	active	beta-searching	2026-05-28 07:44:06.038	alittlesun	t	\N	\N	\N	f
625	lexioliphant@icloud.com	$2b$12$fShPDilP7JJJE2A/wU6yCOU.UscOtxtFNtsSUOpdGjY9ZiMieDKrC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 05:43:43.548714	\N	beta-1771998252638	active	beta-searching	2026-05-26 05:44:12.638	Coco1104	t	\N	\N	\N	f
633	nadia.maskill@gmail.com	$2b$12$2JJIh34S12G4Rpycu3JK9O56NkJWQOGzEl38Q7Ut4Y/oPxYdYO.Y.	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:05:41.449597	\N	beta-1772064411116	active	beta-seller	2026-05-27 00:06:51.116	Nadia Maskill 	t	\N	\N	\N	f
634	horse@gmail.com	$2b$12$KJJMCw6fmxHlL8xvh8VoKu/85APKsA5KPrQN72b8MR.A7U8oDYIoW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:58:16.798418	\N	\N	\N	\N	\N	heheh	f	10d2c28ed27be18388bb819a9c8b6f37f402fab3d3a01a7384cd51e4c301526f	2026-02-28 00:58:16.777	\N	f
627	opieerin@gmail.com	$2b$12$5Y/X/ljwmiuBDPY3zGeNlugB7K/9U6F1MYdRvmA7tv59w5DD7P24K	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 06:05:48.599736	\N	beta-1771999584810	active	beta-searching	2026-05-26 06:06:24.81	opieerin@gmail.com	t	\N	\N	\N	f
626	annabellesr@icloud.com	$2b$12$G3T1WXW8J8brbPfOXD12su72HLVGxbf5QzOosKiOuRjOVqFSq0Ljm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 05:59:20.66037	\N	beta-1772000664467	active	beta-searching	2026-05-26 06:24:24.467	annabelle261	t	\N	\N	\N	f
641	avamartin278@gmail.com	$2b$12$qDXXyVdgS5Vk9P0X7F1JqOuEPbcDVKkBPxfRLY6qEgOlGizlO35lO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-28 01:04:17.882042	\N	\N	\N	\N	\N	avamartin	t	\N	\N	\N	f
649	jenny.r.1855@gmail.com	$2b$12$45pazVh6fpoPlrkMzmarPebZgnl01J8LTxzIk/nB2SzGiwkjEtc8W	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 10:21:41.402834	\N	beta-1772533350019	active	beta-searching	2026-06-01 10:22:30.019	Poor mum	t	\N	\N	\N	f
629	emma.boulding@icloud.com	$2b$12$ZIYqeT9PmOp6NIyNwejJfOt6MUXLp81PQ.R82xOM8S.thMeuuCHh2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 11:25:07.538313	\N	\N	\N	\N	\N	Emmab123	f	971afb479f3a4d66cc520239b4141f6d330d8f74d4e2a25e402c421f92b26203	2026-02-27 11:25:07.521	\N	f
635	penelopecoles104@gmail.com	$2b$12$FZ0WkeiJ7cmlkDInQPbySutDvww8LYAVnGE5WA7WMNT0HilZnMMOO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 06:26:42.320937	\N	beta-1772087288428	active	beta-searching	2026-05-27 06:28:08.428	Pep85 	t	\N	\N	\N	f
630	khamsin2@hotmail.com	$2b$12$.Ln07j0OlOH5ioQVP92YTOrcpsOZsqTUEAlCnYO8WDGEdbpOd9jbS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 21:13:56.459357	\N	beta-1772054105749	active	beta-searching	2026-05-26 21:15:05.749	khamsin2	t	\N	\N	\N	f
636	frances.smith05@icloud.com	$2b$12$5B3ZPbODdh6k94oPMLjDdOWvrwIxeT73wJjYJnnmBPsHJi.htijfO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 08:57:39.149044	\N	\N	\N	\N	\N	Frannas1	t	\N	\N	\N	f
637	hejohnson1008@gmail.com	$2b$12$56g7njQy9OF7fmOBh/KWyuEnfpr04Eq9kGxd.ABhTQNrhY4h..MFS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 11:12:21.995779	\N	beta-1772104391623	active	beta-searching	2026-05-27 11:13:11.623	Hannah232	t	\N	\N	\N	f
644	charlotteleonow@icloud.com	$2b$12$oL7/3MMsvVtbCoN2cCX61evLKqY.p5d65CmnKF9p0BdfjufsxRckW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-01 08:57:40.478361	\N	beta-1772355493672	active	beta-searching	2026-05-30 08:58:13.672	Cleonow.13	t	\N	\N	\N	f
642	maddi-b@hotmail.com	$2b$12$3NyyNqHP8ZC166IqA8ynkufMkEcO.xXY7IYGjxIXK/wX1Tz73X2Oa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-28 14:42:48.487814	\N	beta-1772289801096	active	beta-searching	2026-05-29 14:43:21.096	Maddibrighton	t	\N	\N	\N	f
638	mikayladickinson1@gmail.com	$2b$12$l.jF12isFV7838nfY94l4.CBvVZAQ6kph6P3fN2omNhwtzRG4cXZu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 05:12:09.088834	\N	beta-1772169161899	active	beta-searching	2026-05-28 05:12:41.899	Mikayla Dickinson	t	\N	\N	\N	f
628	fihargraves@hotmail.com	$2b$12$8lmKIKBGZHf8kR7CjhjNK.MOzp.tkK/6qm0PxERm4xNpfAhYM1IuS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 09:32:39.290738	\N	beta-1772014397639	active	beta-searching	2026-05-26 10:13:17.639	Fi H	t	\N	\N	\N	f
646	mccormackjemima@gmail.com	$2b$12$HbW4lf4YDETN/2jks76g8uZM/CI2y0pwV3SWZX8xDGj1HygpCn93e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 05:20:43.744516	\N	beta-1772428925540	active	beta-searching	2026-05-31 05:22:05.54	mccormackjemima	t	\N	\N	\N	f
643	vicki_3l@hotmail.com	$2b$12$ab0gNhU/ao4.8.SdJ421yubQhwk.ytj..i8v2graMiOAZpBjoxd66	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-01 04:45:04.827581	\N	beta-1772340433481	active	beta-searching	2026-05-30 04:47:13.481	Vicki137	t	\N	\N	\N	f
252	mhclark@bigpond.com	$2b$12$UoSbYLidnbRMc5y9EE.GW.Emy0OCwgh2tzfzQQn0YbPNMOYxYwo06	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-21 12:52:38.967876	\N	beta-1761051307182	active	beta-searching	2026-01-19 12:55:07.182	MCClark	t	\N	\N	\N	f
640	info@massiestables.co.nz	$2b$12$6G5XufUanhC.xqaLPUA8Y.By8918uepxQm2iOgYzpuDnEnSX/Nh1C	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-28 00:32:05.18373	\N	beta-1772404905638	active	beta-seller	2026-05-30 22:41:45.638	AMassie	t	\N	\N	\N	f
645	lavendilliblue@gmail.com	$2b$12$f1ltoZOOi/.htJp/IWT1weWBpvd9K8Drxxv6WVzBV9d6vSnBefUyC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 04:23:24.56234	\N	beta-1772425510999	active	beta-searching	2026-05-31 04:25:10.999	Mitchfarmer71	t	\N	\N	\N	f
650	kathrynmackenzie123@gmail.com	$2b$12$.zMaVTW6BhOhBVifHclgG.1/TwwSSyruQWorZ21FgNbrqroZ24hX2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 23:41:26.302211	\N	\N	\N	\N	\N	Kathryn 	t	\N	\N	\N	f
647	rash_83@icloud.com	$2b$12$C/0X66ZWvXtpXRvdaDlekusZJ5SJsG7JLF6GGseO97o2xLDp59pgS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 02:41:15.440627	\N	beta-1772505754365	active	beta-searching	2026-06-01 02:42:34.365	ARashleigh 	t	\N	\N	\N	f
648	rschroeder1977@gmail.com	$2b$12$5wDWTt3k931/yuYVN4su1uSLlOxdDHN6UjdyDXu.cnWzKdoTkwcvy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 10:21:25.786943	\N	beta-1772533324053	active	beta-searching	2026-06-01 10:22:04.053	Bec1977	t	\N	\N	\N	f
653	oliviawo22@hotmail.com	$2b$12$khgXYkkTCJm6yJMZkzyCaeiUwMSFG63MUOq40CgzsbSeYjym5uP3.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-04 12:10:13.425246	\N	\N	\N	\N	\N	Olivia.wood	t	\N	\N	\N	f
654	shelley.towle@gmail.com	$2b$12$OkSvBnwmQ3uhKWE6Ay8cHOScfQEUZA65YDlKraphPICEx43PKIfJK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-04 22:35:41.557603	\N	beta-1772663783415	active	beta-searching	2026-06-02 22:36:23.415	Shelley 	t	\N	\N	\N	f
655	katrina.vidler@hotmail.com	$2b$12$vZHeve7/BslV5khcN3rIN.A.NDSofBjPQDmSdrc4Ho2a9qwM2XTki	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 02:48:10.464642	\N	beta-1772678922357	active	beta-searching	2026-06-03 02:48:42.357	Ksmith	t	\N	\N	\N	f
657	georgiac8888@gmail.com	$2b$12$TQwYVCqaIvTMSCws3Xi4zenEXhfX.NHcjbtWgdNV3y1bBzNRToGnu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 05:41:51.648833	\N	beta-1772689343779	active	beta-searching	2026-06-03 05:42:23.779	GeorgiaZC	t	\N	\N	\N	f
658	lmeulendijks@live.com.au	$2b$12$GJiHpWB.jYSFW2i.CdqWRObMFaydcIKEpL97iNMlMl7p54ScxwQBe	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 06:27:26.062604	\N	beta-1772694677372	active	beta-seller	2026-06-03 07:11:17.372	Leah123	t	\N	\N	\N	f
661	bree_house@hotmail.com	$2b$12$ZT7xAkdGGResGjaGcff4buKWoEv2iBPRqtc42zAlCwBujwtx2Uan.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 10:18:27.165662	\N	beta-1772705974369	active	beta-searching	2026-06-03 10:19:34.369	Breeb	t	\N	\N	\N	f
265	k.barson@bigpond.net.au	$2b$12$m15Bn9WYVZBv7RMXc3aCaOfGYEPmwhPnxPeo7h1Jt/kbLot/mq.de	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-25 03:07:17.215022	\N	beta-1761465278533	active	beta-searching	2026-01-24 07:54:38.533	Karen44	t	\N	\N	\N	f
662	belindajane2610@gmail.com	$2b$12$4KfueGgpd14Fy74KYUA3h.kZoVwoIlXlR.S/83.KT2wvQ78q9qgJW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-06 04:20:58.590077	\N	\N	\N	\N	\N	Belindabrewer	t	\N	\N	\N	f
680	hannahkr2009@gmail.com	$2b$12$KW7kWJpdEAeBvxPxjXcYBOz5ErrLy3xLG9zK.l36VW9YZwta0VSZO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 09:49:29.228453	\N	beta-1773136212432	active	beta-searching	2026-06-08 09:50:12.432	Hreeves 	t	\N	\N	\N	f
672	s4183285@student.rmit.edu.au	$2b$12$b5j4HzJFM6Ne1784Jb5Cb.qo1tc5khh2mcH26zmoRT9XTyM2PTmUC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 05:37:43.544452	\N	beta-1773034747225	active	beta-searching	2026-06-07 05:39:07.226	Sienna	t	\N	\N	\N	f
663	ashdellow@gmail.com	$2b$12$2zUHp.qHumgWAFfNRQrjQ.9QFrUrzzD8mo8lV0CgZciW4Py1ATPZe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-06 12:31:53.390712	\N	beta-1772800376402	active	beta-searching	2026-06-04 12:32:56.402	ashdellow	t	\N	\N	\N	f
664	connor.morgan1@hotmail.com	$2b$12$ODvgC39twVvuiv9RYN5QD.Hg5xS8m0uDEsi3eG4dlVqLzeF0t5ra2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-07 00:47:15.50705	\N	\N	\N	\N	\N	Connor Morgan	t	\N	\N	\N	f
665	charli@bdemo.com.au	$2b$12$T8THEm1vhznUtPPygJsh1evBwFG/0RNMQg6YQrmBqv4wucNm2dUJm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-07 02:04:56.239171	\N	beta-1772849136385	active	beta-searching	2026-06-05 02:05:36.385	Charlib1	t	\N	\N	\N	f
677	mbfmorgan@mac.com	$2b$12$Z8x4SIEBpn0bhIh4aaVuBeljAMhq8/aIQWtGKKQTopi46nPEbdP6G	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 08:05:40.948538	\N	beta-1773168296454	active	beta-searching	2026-06-08 18:44:56.454	mbfmorgan@mac.com	t	\N	\N	\N	f
673	z.davison89@gmail.com	$2b$12$fC6OmTW2UhdWIJxiuDzgfuO04PIMrMJ8qJfFnNQgcRD0J/2ZbO6uW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 12:31:29.061716	\N	beta-1773059549489	active	beta-searching	2026-06-07 12:32:29.489	Zoe 	t	\N	\N	\N	f
666	amyjeeves@gmail.com	$2b$12$Zybi1jECW9P1ji28TBRsvefWddNZ1KnEez0AsYPDSfSmndig.9tWe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-07 11:46:44.349059	\N	beta-1772884064154	active	beta-searching	2026-06-05 11:47:44.154	Jeeva	t	\N	\N	\N	f
667	rebeccablazejak@gmail.com	$2b$12$KyajkoG1NhXmRrpkSMjfn.ie4Bd4PXfEFNC8t5XaKru3LYUu8v/PO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 00:07:43.39841	\N	beta-1772928523266	active	beta-searching	2026-06-06 00:08:43.266	Rebeccastacey457	t	\N	\N	\N	f
674	wconstance168@gmail.com	$2b$12$IxFxF/M7Y4uNh2HuAdxQNuI/MeBK1cEVEmMPdBQRzgEncY99lUUmC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 01:13:44.762292	\N	beta-1773105302687	active	beta-searching	2026-06-08 01:15:02.687	Constance	t	\N	\N	\N	f
668	cjandmcschiller@bigpond.com	$2b$12$TjQdYffPkWun5dTGI94L4urMdVdam0iA3K/V.Xg73hI7K0EuI2JoW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 01:24:59.574747	\N	beta-1772933160505	active	beta-searching	2026-06-06 01:26:00.505	Rapid1	t	\N	\N	\N	f
686	toniwallace74@gmail.com	$2b$12$PmSC0/BcN8ZeXtTTpRdHdeXJR4vmvTooP1UdOTiLrsiJbUjDDxjLy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 12:29:54.329485	\N	beta-1773232337854	active	beta-searching	2026-06-09 12:32:17.854	Toni Wallace	t	\N	\N	\N	f
669	cox.yamba@gmail.com	$2b$12$5g3Y4loX2gYoTUH4tVX2n.Vu6OZ16GYlUKV/kF.yfzjo4CMdFKrUm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 02:05:12.351968	\N	beta-1773022087373	active	beta-seller	2026-06-07 02:08:07.373	rickicox 	t	\N	\N	\N	f
681	shari.rodger@gmail.com	$2b$12$790y8LGBuiu8gjzUNXdV/uEhRkLuInv3S3XQHeq5yECokfskNwuWu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 23:36:56.626873	\N	beta-1773185888274	active	beta-searching	2026-06-08 23:38:08.274	Arouraxdraco99	t	\N	\N	\N	f
675	caroline.regner21@gmail.com	$2b$12$zVfWhYMYV7/jiwLO1iFdluf07V03..hQoyAYXeVGwchHXk2eJs.vK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 03:48:39.734141	\N	beta-1773114547207	active	beta-searching	2026-06-08 03:49:07.207	Caroline	t	\N	\N	\N	f
670	d.hetzel@live.com	$2b$12$A0w4wROWi1banuKh4VonhuAYpoksCXVoxsYzk.I5Ni9TA3uQti2du	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 02:20:42.320714	\N	beta-1773022927926	active	beta-seller	2026-06-07 02:22:07.926	GGoals	t	\N	\N	\N	f
671	2013ponies@gmail.com	$2b$12$5QZDLqw2XTghc6/B5W76tOpIlb2VjlwMpOG9aSb4xVvBPKaeWStam	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 03:18:36.405192	\N	\N	\N	\N	\N	Remy	t	\N	\N	\N	f
676	traceyk13@bigpond.com	$2b$12$kFSefYxHDh9Dn/JjYMtsAO5qUiqlfRPF94YLeeh8TldhxNbi9sLtG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 07:05:24.03122	\N	\N	\N	\N	\N	Tracey	f	9728946b6150586e325bbde68a0c37e4f87d64cbd5a05410d1827003a3b49bca	2026-03-12 07:05:24.013	\N	f
678	natasha66.swan@gmail.com	$2b$12$JaifpxVHgWnF.RDk5D7WgOqtCZ.cG/pss7qd8VkOu8bpQFvpMsfW6	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 08:52:28.594544	\N	beta-1775187652630	active	beta-seller	2026-07-02 03:40:52.63	Natasha 	t	\N	\N	\N	f
682	joske@xtra.co.nz	$2b$12$AO.2OQXk48Tx4qUwfazyGuHdrhGer6q0cL/72HHybL8WDf4tMonwm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 02:59:28.091016	\N	\N	\N	\N	\N	Joske	t	\N	\N	\N	f
679	navarrey.kavita@gmail.com	$2b$12$dqjNvsZCk1jaxHqq5jYHHOJrayglb17vTrHlVW63Cf7NWpHvv5wpC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 09:03:04.333904	\N	beta-1773133415360	active	beta-seller	2026-06-08 09:03:35.36	Kavnav26	t	\N	\N	\N	f
683	karen@inconjunction.com.au	$2b$12$mU8uMKhBH3HC0I./Vh39/O06Mfbt5dTZF3Tl3JeOlha0FXgjJN/1W	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 04:36:00.344885	\N	\N	\N	\N	\N	Karen Allmark	t	\N	\N	\N	f
684	shannon074@hotmail.com	$2b$12$OxrV7cIFZXQCQdkdbV3d1uOm8mq6M4.AbUTsfTTlOFeEWsb/OI/2q	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 11:07:02.09781	\N	\N	\N	\N	\N	Shannon Omeara	f	7c8d9b136dd78028b64f45f090a061a9d6bb7719d5c721d38b6937fdd8a39372	2026-03-13 11:07:02.014	\N	f
489	madhaugh@gmail.com	$2b$12$Ku9CBrXSq0zCoyLG1rx7muJKd84bmfttkL8wX9aKbYoiUyJVA1TX6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 08:46:56.305862	\N	\N	\N	\N	\N	MGH	t	\N	\N	2026-02-13 21:13:37.881	f
687	jo@josephinereich.com	$2b$12$R1d/aFmWZxF1knX4jfuN0uvcA0qt7tJaoVo85K.lZIt06jesaNUuC	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-12 10:16:00.823954	\N	beta-1773310612206	active	beta-seller	2026-06-10 10:16:52.206	Jos	t	\N	\N	\N	f
685	sshanaereid@gmail.com	$2b$12$MyZu2fP17xm3f0KKRMT.JOjjFbSHkwwjziNdCBinZZ2f9q51sPNdS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 11:41:47.851402	\N	beta-1773229358060	active	beta-searching	2026-06-09 11:42:38.06	shanaereid	t	\N	\N	\N	f
690	joannerobins123@gmail.com	$2b$12$6YRfiTtxpBDvuByFjjxSz.TydRXs0HIyjCZmOicd25RIanEF7d2l6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-14 09:50:19.061274	\N	beta-1773481968186	active	beta-searching	2026-06-12 09:52:48.186	Jo R	t	\N	\N	\N	f
691	mcdowellam@icloud.com	$2b$12$aTCMHPGos2jn78fxf6cbheWL4osDSIYVvLQFfqDPEj/If2k7gnCaS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-15 06:13:13.409907	\N	\N	\N	\N	\N	Annettemariemcdowell	f	5c8efc0a047a31ec12edc505320bacf133fd8646b75663512192292bacbacdef	2026-03-17 06:13:13.389	\N	f
692	jaimee.lea25@adam.com.au	$2b$12$PZSW0rW8MhvamyqqHnkzeOs/kJereS2JLLEiMu0ouqDH9O4L2ufgK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-15 08:22:14.523123	\N	\N	\N	\N	\N	Jaimeelea25	t	\N	\N	\N	f
694	maddymcdonogh@gmail.com	$2b$12$EieHhv8pBQmymSKy8EP3aOx5CwV5NSY/ncTnCTfp6sx6gBd937Gny	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 21:31:17.134956	\N	\N	\N	\N	\N	Maddy M	t	\N	\N	\N	f
693	willowgrace321@gmail.com	$2b$12$gYvw3hNJhYKu9gph9F/lY.dczTMrFcWGMeUsU1g48TA20ufrBd4bW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 00:02:08.38792	\N	beta-1773705780263	active	beta-searching	2026-06-15 00:03:00.263	wgrace321	t	\N	\N	\N	f
695	alisonlilly80@gmail.com	$2b$12$gQJmjOR45dwRy/HgVnVWKuNhx.vB/FEOLrjUG9MjpRzmhfv50.ZVK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 22:05:59.708055	\N	\N	\N	\N	\N	Alisonlilly	t	\N	\N	\N	f
696	kriswaters6@gmail.com	$2b$12$F3oKG/zLfpHkdhv2QesXuOkDW6VqOZuzmH82A4dIoKMB7z6boJdqu	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-18 02:55:29.022214	\N	beta-1773802554458	active	beta-seller	2026-06-16 02:55:54.458	Kris	t	\N	\N	\N	f
697	uniqueunicorns@icloud.com	$2b$12$jQ2oATrz7g3HMGIa4RK7AefXDzoom8np0q4c0W025BnP.uDFgVhuy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-18 03:46:14.442299	\N	beta-1775215263736	active	beta-searching	2026-07-02 11:21:03.736	Leanne	t	\N	\N	\N	f
698	nina.vogel@hotmail.com	$2b$12$F99AVuil42HTU01Y/Q2RWO63hNBbG7uSxB60Fcfds9sv0325EymLO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-20 09:01:36.739616	\N	\N	\N	\N	\N	NinaHorse	t	\N	\N	\N	f
689	jessgalea55@gmail.com	$2b$12$qRN5KF2JWO3oUVfzPdc29OwYB.LxTrN7c9u3OTv1JHfs9HE8tIZh6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-14 02:10:44.404971	\N	\N	\N	\N	\N	jessgalea.6	f	\N	\N	\N	f
701	aidengilbert6337@gmail.com	$2b$12$/goNznVSDav7sgeSwA7kI.JpZTd8TRar0q7p0GBy4QfDC3s/IcrvK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-27 05:05:28.699659	\N	beta-1774588037362	active	beta-searching	2026-06-25 05:07:17.362	Aiden Gilbert	t	\N	\N	\N	f
132	moo-chew@bigpond.com	$2b$12$voXnsiXXbxE.6RKd5vE0COtDzimlAX0ytPe.w4ahtbYKszJit3zPa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-01 19:27:50.12849	\N	beta-1759346945936	active	beta-searching	2025-12-30 19:29:05.936	LozzJazz	t	40fda4e909d4ed6be9f9b170d49ed51205b21758769ff0cdcfc202b71363aeba	2026-04-10 22:20:55.122	\N	f
713	cssayar@outlook.com	$2b$12$yA9tVUdh182aKsuH4e/sieL12Ja1iXDxidqEUV8TLX2uqDMOVEGJ6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 07:05:36.507505	\N	\N	\N	\N	\N	CSS	f	df430656fd81c6dc014d63e8c0db6d19b9cb5a5fb22f735c87c15e3250b50d7b	2026-04-11 07:05:36.48	\N	f
714	hayley.a.walker@outlook.com	$2b$12$JMn08cdT1SglPAef3tP79uzbYIXE9ZuLt7blHMJYDCmf2X1GxRPz.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 21:49:49.648138	\N	\N	\N	\N	\N	hayfieldwalker	t	\N	\N	\N	f
703	elena.hall165@gmail.com	$2b$12$zJOeie72R0lRAPZjXz2ejuuckRFd4suGIAYhVKYiyNJcmEW/o4ZjO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 13:58:33.751154	\N	beta-1774706350152	active	beta-searching	2026-06-26 13:59:10.152	Hall165	t	\N	\N	\N	f
704	dj_robins@bigpond.com	$2b$12$ajQdMYHzgTK8.UX9mIicjeuUaHgIzJEtYFZ6TbQIig.bdO9PqMhDy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-29 10:55:24.589899	\N	\N	\N	\N	\N	Joanne	f	ede5f79c038976c9de30f3febfdd475bcc355566069d4d3267cb8ea7a26c9cdf	2026-03-31 10:55:24.57	\N	f
721	mandybmoo70@gmail.com	$2b$12$S9oxtzDHlF8S2oKcnCoqguDgL7xYnpl5jvOr3tQIuCwR.zas5j2BC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-12 10:48:58.356307	\N	\N	\N	\N	\N	Mandy moo	t	\N	\N	\N	f
470	claire.blackmore@hotmail.co.uk	$2b$12$dSmOGgljcOXoUULofqJFiuA3mIH3xQznWuh4DV23Xg2LdIFkfDZaq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-12 05:32:50.366947	\N	\N	\N	\N	\N	Claireb	t	\N	\N	2026-02-13 21:13:28.463	f
702	charisseanderson@outlook.com.au	$2b$12$pG9KysJaYx6/kVjKFmE5BeY8G385KVNsMAyMbHQ1w.DsBznLuiOWG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 08:55:10.353185	\N	beta-1774695430688	active	beta-searching	2026-06-26 10:57:10.688	Rhonda 	t	8826b13e83b87199a4e487010bc48ddfdb3ad03db4f2a3e159105d455ba36744	2026-04-01 06:52:02.146	\N	f
705	peyton2511@icloud.com	$2b$12$8RoKbHTiSrtH3o2urX5X/OqP5DR5fMrPi5b.SMVNrka.UXIUauH.2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 10:05:54.34172	\N	\N	\N	\N	\N	Peyton	t	\N	\N	\N	f
707	watill@hotmail.com	$2b$12$CDVQoeJl/pfmLMBCR6fh4.0c/bWf.zP4ZN0xmk9BE/XVC5L8Qn08O	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 10:39:08.107295	\N	\N	\N	\N	\N	Watill	t	\N	\N	\N	f
715	petercunningham27@yahoo.co.nz	$2b$12$BZqaXUUtBBg1kFE5YPBwDuQt00V9Eq0MIUSbhGcV1Oqunqlsmj.Mq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 23:25:52.033381	\N	beta-1775777217466	active	beta-searching	2026-07-08 23:26:57.466	Peterc	t	\N	\N	\N	f
708	7almahamnett@gmail.com	$2b$12$mOsWUpSlEOlVxXAaepf5uu6siQTB/Qc941uuJUMmFTzLrLmc2sQV2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 23:35:26.947239	\N	beta-1775259375052	active	beta-searching	2026-07-02 23:36:15.052	alma	t	\N	\N	\N	f
709	beta091221@gmail.com	$2b$12$k3kUaM/UvVDHVpwS73OJ3Oq9FdQz4Un.Q5OtkGhTFRuSilZop7jEm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-04 23:20:36.890943	\N	\N	\N	\N	\N	Beta	f	fff69552c9366b2b580eaccd63518041a5332428902092e43f8a3912dfa2c6c7	2026-04-06 23:20:36.868	\N	f
716	reneelhayes@gmail.com	$2b$12$VwuGBs8L.khbWLvHnWWXVeqfl6YJe0Nq2kcERxsL9oAYkfIqNb1wC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 11:59:33.857905	\N	\N	\N	\N	\N	RLH8183 	t	\N	\N	\N	f
710	tashmcphee@gmail.com	$2b$12$5nc7Ak0SAYZ7I6ddsPv4cebM9vSfyBJwUi.YV2jCeZMQVnzgIVco.	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-05 06:37:23.463404	\N	beta-1775371087691	active	beta-searching	2026-07-04 06:38:07.691	tashmacm	t	\N	\N	\N	f
726	jackobi@outlook.com	$2b$12$hPMWh4NYwTUGtFEwZa/WPe/6iAHJcRoWTMJSRteOkMdbWFJcyRycK	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:01:19.708897	\N	beta-1776556959750	active	beta-seller	2026-07-18 00:02:39.75	Jackobi	t	\N	\N	\N	f
711	joannatq110223@gmail.com	$2b$12$lVf5NYo1/2YRFvSwwVdwFOjgkRyX7x9oQ0Dl8Tizt0DrUoFLzm4TK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 13:46:01.509484	\N	beta-1775569629858	active	beta-searching	2026-07-06 13:47:09.858	Joanna	t	\N	\N	\N	f
712	cookiescustomcakes@bigpond.com	$2b$12$SXYaELea5zNDAU2WBanvA.RmiMH7AXSc/WEwVMtwOwjy2YdIG5m5S	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 22:16:09.160701	\N	\N	\N	\N	\N	Lauren 	f	11a4776efc913776fc051ff5a079cbfe0eb06016090c9303078afc0a7fed529e	2026-04-10 22:16:09.139	\N	f
727	dbrasdil007@gmail.com	$2b$12$k7XO4rcObbgAB2aB2WKy0.Y0R3a7qIFKzPGzqKsYeEQD71GXUr.BW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 03:25:34.798852	\N	\N	\N	\N	\N	Edihehe567	f	d412f91128ab4ecab4503f3b68765234e915d8f8ba628416365c2268e2845f9c	2026-04-21 03:25:34.778	\N	f
717	mail242@icloud.com	$2b$12$txzYdu3bPqyik0YKPbtrOuK91/1ED5rhJb7OnlrQSg84qnYPRCCxS	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 23:06:07.975233	\N	beta-1775862427339	active	beta-searching	2026-07-09 23:07:07.34	HorseySue	t	\N	\N	\N	f
722	hyssop.wearer-7y@icloud.com	$2b$12$07UgNplecCrmU/CaBe59j.KjGRceKKihv1ZDqi/oEZtnE9WwuwxQO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 06:51:26.457376	\N	beta-1776063146342	active	beta-searching	2026-07-12 06:52:26.342	Hyssop7	t	\N	\N	\N	f
718	jodyconyngham@hotmail.com	$2b$12$fOGkrF..zGP.iBgFtv8UPuTJ3mrOHccgDOKfgM//swCD.d.WITqFq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-11 06:38:26.757216	\N	beta-1775905282290	active	beta-searching	2026-07-10 11:01:22.29	jody.conyngham	t	\N	\N	\N	f
719	brookemurchison02@icloud.com	$2b$12$nArytdwMz.wO8iWpk61SSOP229N784.8Ticr05vDQcqfkipAjT.ti	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-11 21:45:41.022497	\N	\N	\N	\N	\N	BrookeM	t	\N	\N	\N	f
720	ews1@bigpond.com	$2b$12$ng0T/gnMsvbnnAvOPB7fdujKbDkeiL1KIK2p66YZfadF.ekl8uEme	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-12 00:04:09.734226	\N	\N	\N	\N	\N	Janice	f	77bf8b2277a98840b43b011377cdd165d12fb3609f4617dc7672798782f510e3	2026-04-14 00:04:09.716	\N	f
728	dbrassiloo7@gmail.com	$2b$12$sDVs/7rh8HiOJT98pZxfZut7aS/vUakGsoRN/TQbjnnvqItLLXmwK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 05:01:28.475055	\N	\N	\N	\N	\N	Dayna456	f	6bf154791180e20513de74bffe4c9d0ca61cb2787a8f0c948c915e4415ffa719	2026-04-21 05:01:28.453	\N	f
723	deahnaaorfini@gmail.com	$2b$12$WdtesWD5xdxOJ7XBoLAWje/I1QPxkwLAWPpLgq9a7Mt7fULk3xIXm	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-14 11:06:47.333844	\N	beta-1776164847974	active	beta-seller	2026-07-13 11:07:27.974	DeahnaO 	t	\N	\N	\N	f
732	zengarapark@hotmail.com	$2b$12$f1ZAlLOsBAwnIcrsBKbvf.1CmCNc8ul3NVaGEGxRHGS7YQ5.AUr.O	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 09:36:32.800553	\N	beta-1776677829584	active	beta-seller	2026-07-19 09:37:09.584	ZengaraPark	t	\N	\N	\N	f
731	olympusequine6@gmail.com	$2b$12$hpLYsZ7zScHn0aYKypM7pO3yER9yLM7r/tgbIBTH09yx4Hbi3xkae	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 06:28:27.495776	\N	beta-1776580146679	active	beta-seller	2026-07-18 06:29:06.679	Hannah	t	\N	\N	\N	f
730	dbrassil007@gmail.com	$2b$12$wvzMfOw3GcDKpaxZXtv5kOiwxoc9VEVsL4n.2cQCVtoLK2w4o/MTa	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 05:06:20.46927	\N	beta-1776575301106	active	beta-seller	2026-07-18 05:08:21.106	Dayna.brassil	t	\N	\N	\N	f
734	zoe.willis08@gmail.com	$2b$12$XfQ1R9xPkP7WIjV64Gy57OotUZ5VZXqQk51Z98dT/l5RHdPL7mirO	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 02:17:04.986026	\N	\N	\N	\N	\N	ZoeWillis08	t	\N	\N	\N	f
733	tamsincolquhoun@gmail.com	$2b$12$KRLy9iZwKe/L/lRmCdnWbekJPiwpPkDlxvoGDDoAr.LiwSWw2tbha	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 02:06:31.056153	\N	beta-1776823624935	active	beta-searching	2026-07-21 02:07:04.935	tamscee	t	\N	\N	\N	f
596	madeleinep10@icloud.com	$2b$12$nlTwOOQyasFouv87rmjecOAKiLzxW./aAMXLlA9lKASm0stDl5gqa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:40:56.80205	\N	beta-1771882898659	active	beta-searching	2026-05-24 21:41:38.659	Madeleine78	t	\N	\N	\N	f
735	joanne.macdonald13@gmail.com	$2b$12$ewA3tMBXP1Y6cpmpPBo14.disQPN93bq1BqsYM0ub4UeYb.58mGhW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-23 09:06:31.439073	\N	\N	\N	\N	\N	Jomacd7	f	d5d672455f9dac90f6bd6aa4470946db44239c4f09330a62bd11ccb45dd9d8c5	2026-04-25 09:06:31.415	\N	f
736	lisameldrum79@icloud.com	$2b$12$0WC38R3IsSE/zPt8XuI8TOFZMzF.2tQVfz3W1wDVw9CZC2dOxDXTi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-23 12:07:49.357234	\N	beta-1776946099541	active	beta-searching	2026-07-22 12:08:19.541	lmeld79	t	\N	\N	\N	f
737	penny@pakav.com.au	$2b$12$jiWEd5gP8RF2XYZ9A.AFfukrUNp3oslMaro7X6Lgjb1BAfZHD7yrW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 05:21:37.888487	\N	\N	\N	\N	\N	Penny Donaldson	f	663f9e6930167605b75a08935e976127437768fd57aebe49a6917ff486514a56	2026-04-26 05:21:37.867	\N	f
738	mjkneebone@icloud.com	$2b$12$vQHihjUZ51NtIfxIiIhYw.n2cjYdbIvoGLZmtPU5HJohdz4fYrR1i	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 02:11:32.498265	\N	beta-1777255940090	active	beta-searching	2026-07-26 02:12:20.09	mjkneebone	t	\N	\N	\N	f
739	sadiemorison2010@gmail.com	$2b$12$Ym.xMr39DRvgnHhajdBTCOlHXPDNM2x0EwmI11Up.4KGmRHgE3yx6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 06:34:46.317143	\N	\N	\N	\N	\N	sadiemorison_	t	\N	\N	\N	f
546	teeganashbyequestrian@hotmail.com	$2b$12$jh0uv6n2mg5R8XX.afliSet8JChViy5jwtPTNngamssqIbRO7ShZK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 07:50:31.704414	\N	beta-1770277978975	active	beta-searching	2026-05-06 07:52:58.975	TeeganPapworth	t	\N	\N	\N	f
751	charlotte@inglis.com.au	$2b$12$OxfG.x34rM5TvfhfQvVqYeWCGYedeuk0ZR1/vpDahWhD4qh8wIyki	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 01:14:12.875075	\N	beta-1777598354860	active	beta-seller	2026-07-30 01:19:14.86	Charlotte	t	\N	\N	\N	f
740	mooneym787@gmail.com	$2b$12$0ungfkZ/Be4p8krsHmcJ0.6UcrEv4kpDzqk3RnriYO55GOXWLaX5u	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 09:09:13.583369	\N	beta-1777281028126	active	beta-searching	2026-07-26 09:10:28.126	Mollym 	t	\N	\N	\N	f
758	kirstenworker@gmail.com	$2b$12$UZzzVbprqEkplxi9tb2.veaSUdrTwtDZAVuY7v0V5/dNkMqmdl9kq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:19:50.476986	\N	\N	\N	\N	\N	KWork	t	\N	\N	\N	f
741	jackmakim09@gmail.com	$2b$12$KXdKIcWB/04PKVk8i/Uzx.y6O9H4teG3BzluELSn3k8xNGGpVIIXi	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 10:22:35.259731	\N	beta-1777544612902	active	beta-seller	2026-07-29 10:23:32.902	Jack Makim	t	\N	\N	\N	f
742	imogenlindh@icloud.com	$2b$12$.pMR70/MxfGKFY.Wm/WrLOPHSU866tzEtCrnViPSBm8QExDL39Pea	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 10:24:26.820682	\N	\N	\N	\N	\N	immylindh	t	\N	\N	\N	f
752	djball912@gmail.com	$2b$12$B3IOsqpSszTRZpdCLCsf9OaEBQvk6VITT27wU2vjAdUOQLFz.FyNi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 02:37:34.597793	\N	beta-1777603241230	active	beta-searching	2026-07-30 02:40:41.23	Solo Equestrian	t	\N	\N	\N	f
743	steph_dsouza@hotmail.com	$2b$12$ejSmJaJ2wncJU6YF1OtC.u6EhvxzVvRDJXIEruYYG2zy1dto2ezHy	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 10:25:38.380369	\N	beta-1777545049267	active	beta-searching	2026-07-29 10:30:49.267	SDS	t	\N	\N	\N	f
744	chelsea.maxwell97@hotmail.com	$2b$12$Jxi/i9NmzDIaUvLdTC5r7uCKbwQwex8m0E4BuyyfMPbeUgXISC9zC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 10:40:07.10416	\N	\N	\N	\N	\N	Cberg	f	b5ddac24e96cc1734d37ff68ca4e92ccfa82f48229b978c4d0524550d6745bd1	2026-05-02 10:40:07.087	\N	f
745	tc.equestrian@hotmail.com	$2b$12$HHwbk2VTWrSI6ral5jFTuOoQ.eGJulCw1xI1Q4qMvNUG/n2.5.Bvq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 10:40:24.29792	\N	\N	\N	\N	\N	tc.equestrian	f	\N	\N	\N	f
746	loulouparkbreeding@gmail.com	$2b$12$C4zo6tya1SLfeWkorVdNGO1ecRtfAOoIou6aVIJV.EZQIB/6dT6Qq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 11:14:56.976271	\N	beta-1777547767035	active	beta-seller	2026-07-29 11:16:07.035	Louloupark	t	\N	\N	\N	f
748	christine@teamj.com.au	$2b$12$MlL6XCI/Zu2RgF0V.xg/MupN/kR6/GL2YclBc8zmLS3YfKhWwrREq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 22:02:59.721352	\N	\N	\N	\N	\N	ChrissieJ	f	36521f74ca924bdf55e70ecda323b3d18d86b7d1851276423612828b6ddb4128	2026-05-02 22:02:59.704	\N	f
753	david@14macarthurave.com	$2b$12$mHe.xE0.4wLf.RGBFS1N2uYJiJas1yvfxI1LCLgA9c7KbWyyHy5/e	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-02 01:27:40.604605	\N	beta-1777685333295	active	beta-searching	2026-07-31 01:28:53.295	David Dunoon	t	\N	\N	\N	f
749	sandhillshorses@bigpond.com	$2b$12$yxnFREDrFSy7yXnYEd6wJuVEyfdKACnBbJ4EgdVHQcl3nJTl.q5AG	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 22:13:22.549404	\N	beta-1777587319575	active	beta-seller	2026-07-29 22:15:19.575	Prue69	t	\N	\N	\N	f
750	gardiner.sarah@bigpond.com	$2b$12$fEMHJGvRmvp8/oKykMrihuRZJa3S8iX.Abu9yjAXmD1AjoXs2uOpe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 22:47:27.441515	\N	\N	\N	\N	\N	Sarahcathedral	f	66f7b8625fa063ed66da58f38cbf656d2d2defcbe472a54dc3999d6318e1a975	2026-05-02 22:47:27.423	\N	f
706	miley11.w@gmail.com	$2b$12$DMQEQ7XJS7as59rSM2t1uOxKqpIfKC7Dw7yLVgCKlUir5rF/HR90O	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 02:34:04.299579	\N	beta-1777886594595	active	beta-searching	2026-08-02 09:23:14.595	Miley W	t	\N	\N	\N	f
761	julesmadsen08@gmail.com	$2b$12$nv6/5RdvkmtDNsVOQ4J/B.jxCEU9UStJacPbJiTICHMtum8gMwhja	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:25:22.395658	\N	beta-1777886798416	active	beta-seller	2026-08-02 09:26:38.416	08jules	t	\N	\N	\N	f
747	lolamayb@bigpond.com	$2b$12$WUZqk4ZtsxrovQHn5MWuDOzkXChLQMATS52u8JD8Aw5iDGN/ov4Le	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-30 11:51:52.60631	\N	beta-1777594359497	active	beta-searching	2026-07-30 00:12:39.497	lola1234	t	\N	\N	\N	f
762	sal.phil@xtra.co.nz	$2b$12$xeAWn7pTMVljG9bJ4IBftebLqmlomqBUjI.p8clgkmrOPASzhvwHe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:26:07.910806	\N	\N	\N	\N	\N	SallyS	t	\N	\N	\N	f
754	herbina7@gmail.com	$2b$12$XuuYalFZsF0yHYZvfIcR.eGgO7hVfFFoFZQqGsR3hnBEI/4O2uvIK	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-02 05:42:05.828024	\N	beta-1777700562965	active	beta-seller	2026-07-31 05:42:42.965	RinaH	t	\N	\N	\N	f
759	stuartabrahams02@gmail.com	$2b$12$k8CvDZinWS.15/X5FOmh/upNZDoxIWhFwdOVQxAsWMlgZvQyHqJIW	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:22:58.022937	\N	beta-1777886617509	active	beta-seller	2026-08-02 09:23:37.509	Stuart Abrahams 	t	\N	\N	\N	f
755	gracedawes2003@gmail.com	$2b$12$GpMu7MAL2rk0rcHZ8HVpdeXvW5iOwkeR8cDKIpXYm8Y5sUOr3T/Le	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-03 23:20:57.557309	\N	beta-1777850491078	active	beta-seller	2026-08-01 23:21:31.078	gdawes	t	\N	\N	\N	f
756	elyssestevens@gmail.com	$2b$12$lVYLcUTYUMJ2neJwboW7COhrOso7yAoWkFytJ6CBoTCsv4gl.ROsC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 01:55:15.939687	\N	\N	\N	\N	\N	Els	f	8bf6e50b3742a50dabda6fd01cc288961be039c72e0e0cf13c997ca85b41e74f	2026-05-06 01:55:15.922	\N	f
688	sallysimmonds6@gmail.com	$2b$12$g90ezLe.BZyvgCsI5S2MROnmxoHg3IoIg61ujthUGLJOf2lOqT7ii	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-12 19:05:39.068428	\N	beta-1773342386562	active	beta-seller	2026-06-10 19:06:26.562	Salsimmonds1	t	\N	\N	\N	f
760	leahfougere@gmail.com	$2b$12$bdaZbEI3wcmhEPPCFXnoj.cKzABXYlj3wnN4bvcZlLBrQv5S1VKx2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:24:27.087729	\N	beta-1777886693828	active	beta-searching	2026-08-02 09:24:53.828	lfougere	t	\N	\N	\N	f
764	megan@jockeynutrition.com	$2b$12$jrPXkHAL656Hr0ZQBDPcVOuUrXfTvfUkYhmV1MklfDgKnaf6S2oAm	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:27:51.051432	\N	\N	\N	\N	\N	MeganR	f	ae486165d72de7b4b27a1518d3410c19b8defc783d761f276d6d00fa7e8dd6ca	2026-05-06 09:27:51.033	\N	f
768	louisemawhinney@gmail.com	$2b$12$vmMo8tyN6lr0.gasNbP.jegaRiyr5/YOY63nGvEl2gZEAiUjhyxjq	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:34:53.146911	\N	\N	\N	\N	\N	Louiseabey	t	\N	\N	\N	f
763	angieread83@hotmail.com	$2b$12$xY2Yp.D6LMMGXKPhnCdM5O7yVxxMK8rXvFqNm0o8KFk9zVk7.mbnK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:27:18.121833	\N	beta-1777886895305	active	beta-searching	2026-08-02 09:28:15.305	Angiebush	t	\N	\N	\N	f
765	bvstables@bigpond.com	$2b$12$fA057.PgfQljVVxl1ozVQ.vHtdjx3fFhvpJ.TuPydQ4NhbHKzY46a	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:30:51.89895	\N	\N	\N	\N	\N	Bvstables	f	7707fb12c41dbbe6b5cc53f7ba392f22992ba54c6143dbcb161a90aff9f55828	2026-05-06 09:30:51.882	\N	f
766	g-kennedy@bigpond.com	$2b$12$fRYUCHmioIGjjoUe2NnTReW.JnvDK9i61EZC/1xGnaB2DCBHl2L.2	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:33:30.952102	\N	beta-1777887357381	active	beta-seller	2026-08-02 09:35:57.381	APPS 	t	\N	\N	\N	f
770	jsradburn@outlook.com	$2b$12$NOPVK8Yegcwb/OOrZzMj3Orc.PcBpQGgm9UkHWvNvZVv3AUDfIhei	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:46:57.55297	\N	\N	\N	\N	\N	Jane Radburn 	t	\N	\N	\N	f
771	shielburnfarmph@gmail.com	$2b$12$7z4DTNRkv1qSGjyAVgDeC.1nT2w06FnxUf7IKbOcEzNlzIOd28wb6	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:49:00.612594	\N	beta-1777888211815	active	beta-searching	2026-08-02 09:50:11.815	Daryl M	t	\N	\N	\N	f
769	karmen.fong28@hotmail.com	$2b$12$GFIqceV5zF7i3e9xY5PgUOKwnqhCkiqh6r0pyw8MGeuutNY4kW/bG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:36:40.239678	\N	\N	\N	\N	\N	karmenwoods	t	\N	\N	\N	f
772	ally.wake@hotmail.com	$2b$12$.PQgDxPv/32Q5IMiC9GNAe4aEm5QkWmU8aMVBbL4EHE5cSZHwkeVC	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:50:53.7288	\N	\N	\N	\N	\N	ally.w00	t	\N	\N	\N	f
767	mel.747@live.com.au	$2b$12$KGwiGBaKmakBlDOAYtUJJ.lnJ9Re4TL4sY5Txhello8.kDKURxW/a	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 09:34:16.974885	\N	\N	\N	\N	\N	Mel.747	t	\N	\N	\N	f
773	fostera18@hamiltoncollege.vic.edu.au	$2b$12$8e6BVrvYdqsEbjyxZzd/Q.iXH7A2/bL3uNE5URe36hpxzvOS0zsMW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 10:04:20.34721	\N	\N	\N	\N	\N	Alisonfoster3	t	\N	\N	\N	f
774	georgia@agbfarming.com.au	$2b$12$dpUYHHnsdw3.wzINzBqQ9ubzzmd8VCCpW6nTNE2ysRT04yyuOq7aK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 10:08:26.477861	\N	beta-1777889361691	active	beta-searching	2026-08-02 10:09:21.691	GB4361	t	\N	\N	\N	f
775	georgie_coates@icloud.com	$2b$12$KDLPTzV5DCYqiDLum.HtN.CuH69PaXxzq4KfmPZUlRMqwFV3zjP86	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 10:32:48.984703	\N	beta-1777890825709	active	beta-seller	2026-08-02 10:33:45.709	Georgie 	t	\N	\N	\N	f
788	lydiaproctor2008@outlook.com	$2b$12$8X0YCQZzu8DG8DHQAVh2veW4R1H1D2ogSCE7N7ofeRPQuO2nyGtmi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 01:58:43.962117	\N	\N	\N	\N	\N	Lydia008	t	\N	\N	\N	f
776	tracycpitts@gmail.com	$2b$12$hiInTU/AnLT7fLMJfVL6luUiVH40nJjNnaYZ2oN59nsxCHxyqkItq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 10:54:23.969389	\N	beta-1777892145212	active	beta-seller	2026-08-02 10:55:45.212	Tracy Pitts	t	\N	\N	\N	f
777	antonia@allproject.com.au	$2b$12$BO/lNGPhKzX3cygl4NVC5upj8XcKF7NVosP4YDv4cKjjVzCf79UFi	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 11:11:38.8763	\N	\N	\N	\N	\N	Antonia	t	\N	\N	\N	f
789	brydantrain@hotmail.com	$2b$12$/WJUp3YxHEQOdAxJuQLWMePFQI4ukh8jNIW1D0xjhMzoI/VScbLCW	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 04:01:50.583482	\N	\N	\N	\N	\N	Btrain	f	d2dcc360d6b73a1d683d6ae3070fc1ff951515fe727eedb9df5488a83d0fb9da	2026-05-07 04:01:50.564	\N	f
778	g.zatta@outlook.com	$2b$12$EvKEJPxil.IsBMBMPmi2rerM/taJM2zLh67D8qLXRzceSU/JtLKqq	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 12:00:58.082031	\N	beta-1777896200801	active	beta-seller	2026-08-02 12:03:20.801	G_zatta	t	\N	\N	\N	f
790	kelleykerryoung15@gmail.com	$2b$12$cXpBmYcGay4aQDRuVdwkhO1oGpSObBrWHLrh27P65UySdyv37rDUa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 04:12:49.68898	\N	\N	\N	\N	\N	KelleyK83	t	\N	\N	\N	f
791	elizajanebh@hotmail.com	$2b$12$S66tSEuv2awIiOdQ53TGRe/7QOtxox7kkEWFOC98AtV3YRhKnG8rK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 05:21:23.41188	\N	\N	\N	\N	\N	eliza-17	f	6702a68327a6c27333bd14363565c1e225cc3a7c6c5054030ba73b2f4e29d7e1	2026-05-07 05:21:23.395	\N	f
779	miahelizabethcurrie@gmail.com	$2b$12$IrUlC/8ZMf5G4OQmHUYb/uatCe3ljdXsjSKj.tk9MJzaIQDGPAmWa	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 12:06:09.642492	\N	beta-1777896425385	active	beta-searching	2026-08-02 12:07:05.385	Miahcurrie	t	\N	\N	\N	f
780	abbey1page@gmail.com	$2b$12$cwh6IW.YIIKmLErJMTAVme33QDwsWAeSABzK3bh2uwCdHUaERxHRK	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 12:53:13.812708	\N	\N	\N	\N	\N	AbbeyPage 	t	\N	\N	\N	f
781	smithmia2000@gmail.com	$2b$12$SEsloond.D3iC450nEYoxuIPy9deudNUvfW16oxCuEY00drbO8kuu	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 13:53:52.364016	\N	beta-1777902890664	active	beta-searching	2026-08-02 13:54:50.664	Miasmith1	t	\N	\N	\N	f
782	cherriewk@yahoo.com	$2b$12$qeqojfdyXpxuPIDwNPKi.OnN.gO5yhPQsegYZ2uhbweJ.B/eSf9Ei	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 18:08:19.691582	\N	\N	\N	\N	\N	cherriewk@yahoo.com	t	\N	\N	\N	f
783	alexmwald@icloud.com	$2b$12$D6BTp4m6CLiE/paJ9isv6e5iO6ObMSVGUk14mOdCtojtzsVdlKbk2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 20:26:58.063759	\N	\N	\N	\N	\N	humbugcreek	t	\N	\N	\N	f
757	jaycietrace21@gmail.com	$2b$12$nqtqWdXw62b.yu0iKC4SoezeeTf9DDN8Kph8rhDYmsBSrNxmRNOH2	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 08:10:10.622903	\N	beta-1777927130584	active	beta-searching	2026-08-02 20:38:50.584	Jtrace1234	t	\N	\N	\N	f
792	lucycoventry763@gmail.com	$2b$12$G3KC0dQwpMiSr/tZCKrBde6IOM29naq1fJ.OQAXOxAImyq60oXXoK	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 05:29:31.333514	\N	beta-1777959014338	active	beta-seller	2026-08-03 05:30:14.338	lucycoventry 	t	\N	\N	\N	f
784	hollytomkins1@gmail.com	$2b$12$N1sGOoJWQpCBz4QYb8umV.e0SNZb7ym/zZ53hC4Mg80.IhDRTZ62q	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 20:43:26.544613	\N	beta-1777927478637	active	beta-searching	2026-08-02 20:44:38.637	hollytomkins1	t	\N	\N	\N	f
785	ninahvejsel@gmail.com	$2b$12$vw96NvZq337euWh4rPI89OqcFINTZs7ObtLSZk4ZO4dszDBy126OG	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 21:17:20.988808	\N	\N	\N	\N	\N	NinaH	t	\N	\N	\N	f
786	amber@twinhillsstud.com	$2b$12$gVaHUfgaqu.dX2enWnDKWOh57HcP2KLhAEXlrgxi2rLSXIitnwFw6	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-04 23:26:37.975937	\N	beta-1777938858495	active	beta-seller	2026-08-02 23:54:18.495	AmberT 	t	\N	\N	\N	f
787	scarlett.mckimmie@gmail.com	$2b$12$aPUir.P6sSUb6TCTnLURK.11wVtGVjGdbOHN0.8E0hdOGLvpyQqQe	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 01:23:40.335193	\N	\N	\N	\N	\N	scarlett	t	\N	\N	\N	f
\.


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversations_id_seq', 48, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 2, true);


--
-- Name: discount_code_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discount_code_usage_id_seq', 1, false);


--
-- Name: discount_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discount_codes_id_seq', 1, true);


--
-- Name: horse_deletion_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.horse_deletion_responses_id_seq', 38, true);


--
-- Name: horses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.horses_id_seq', 110, true);


--
-- Name: login_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.login_events_id_seq', 1946, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.matches_id_seq', 162, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 102, true);


--
-- Name: owners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.owners_id_seq', 1, true);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 38, true);


--
-- Name: saved_searches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.saved_searches_id_seq', 25, true);


--
-- Name: search_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.search_notifications_id_seq', 138, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 792, true);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_unique UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discount_code_usage discount_code_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_usage
    ADD CONSTRAINT discount_code_usage_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_code_key UNIQUE (code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: horse_deletion_responses horse_deletion_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horse_deletion_responses
    ADD CONSTRAINT horse_deletion_responses_pkey PRIMARY KEY (id);


--
-- Name: horses horses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horses
    ADD CONSTRAINT horses_pkey PRIMARY KEY (id);


--
-- Name: login_events login_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_events
    ADD CONSTRAINT login_events_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: owners owners_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_email_unique UNIQUE (email);


--
-- Name: owners owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: search_notifications search_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_notifications
    ADD CONSTRAINT search_notifications_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: users_username_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username);


--
-- Name: users block_test_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER block_test_users BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.prevent_test_user_creation();


--
-- Name: discount_code_usage discount_code_usage_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_usage
    ADD CONSTRAINT discount_code_usage_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id);


--
-- Name: discount_code_usage discount_code_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_code_usage
    ADD CONSTRAINT discount_code_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict abhvcTv76bsbgfc3gtn0Q5QXn8vdZx8WhgCCO1mT7vHAeSb7RzDbU4PvDa948M7

