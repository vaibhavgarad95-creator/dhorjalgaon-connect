CREATE TYPE public.app_role AS ENUM ('admin','citizen');
CREATE TYPE public.issue_status AS ENUM ('pending','in_progress','completed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  village text NOT NULL DEFAULT 'ढोरजळगाव',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, village)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'village', 'ढोरजळगाव')
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email,'')) = 'vaibhavgarad95@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'notice',
  village text NOT NULL DEFAULT 'ढोरजळगाव',
  event_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_read" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "ann_admin_write" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  village text NOT NULL DEFAULT 'ढोरजळगाव',
  photo_url text,
  after_photo_url text,
  latitude double precision,
  longitude double precision,
  location_text text,
  is_anonymous boolean NOT NULL DEFAULT false,
  status public.issue_status NOT NULL DEFAULT 'pending',
  expected_date date,
  resolution_notes text,
  amount_spent numeric(12,2),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.issues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues_read" ON public.issues FOR SELECT USING (true);
CREATE POLICY "issues_insert_own" ON public.issues FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "issues_update_own" ON public.issues FOR UPDATE TO authenticated
  USING (reporter_id = auth.uid() AND status = 'pending') WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "issues_delete_own" ON public.issues FOR DELETE TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "issues_admin_all" ON public.issues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.issue_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_id, user_id)
);
GRANT SELECT ON public.issue_votes TO anon;
GRANT SELECT, INSERT, DELETE ON public.issue_votes TO authenticated;
GRANT ALL ON public.issue_votes TO service_role;
ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read" ON public.issue_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_own" ON public.issue_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "votes_delete_own" ON public.issue_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT 'ढोरजळगाव',
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ideas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ideas_read" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "ideas_insert_own" ON public.ideas FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "ideas_update_own" ON public.ideas FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "ideas_delete_own" ON public.ideas FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.idea_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (idea_id, user_id)
);
GRANT SELECT ON public.idea_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.idea_likes TO authenticated;
GRANT ALL ON public.idea_likes TO service_role;
ALTER TABLE public.idea_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_likes_read" ON public.idea_likes FOR SELECT USING (true);
CREATE POLICY "idea_likes_insert_own" ON public.idea_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "idea_likes_delete_own" ON public.idea_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.idea_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.idea_comments TO authenticated;
GRANT ALL ON public.idea_comments TO service_role;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_comments_read" ON public.idea_comments FOR SELECT USING (true);
CREATE POLICY "idea_comments_insert_own" ON public.idea_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "idea_comments_delete_own" ON public.idea_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER issues_touch BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "issue_photos_read" ON storage.objects FOR SELECT USING (bucket_id = 'issue-photos');
CREATE POLICY "issue_photos_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'issue-photos');
CREATE POLICY "issue_photos_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'issue-photos' AND owner = auth.uid());

INSERT INTO public.announcements (title, body, kind, village, event_date) VALUES
('ग्रामसभेची सूचना', 'दिनांक १५ ऑगस्ट रोजी सकाळी १० वाजता ग्रामपंचायत कार्यालय, ढोरजळगाव येथे मासिक ग्रामसभा आयोजित करण्यात आली आहे. सर्व ग्रामस्थांनी उपस्थित राहावे.', 'meeting', 'ढोरजळगाव', '2026-08-15'),
('घरकुल योजना – अर्ज सुरू', 'प्रधानमंत्री आवास योजना (ग्रामीण) अंतर्गत नवीन अर्ज स्वीकारले जात आहेत. आवश्यक कागदपत्रांसह ग्रामपंचायत कार्यालयात संपर्क साधावा.', 'scheme', 'ढोरजळगाव', NULL),
('पाणीपुरवठा वेळापत्रक', 'गरडवाडी येथे नळपाणी पुरवठा दररोज सकाळी ७ ते ९ या वेळेत करण्यात येईल.', 'notice', 'गरडवाडी', NULL),
('स्वच्छता अभियान', 'मलकापूर येथे रविवारी सकाळी ८ वाजता ग्राम स्वच्छता मोहीम राबविण्यात येणार आहे.', 'notice', 'मलकापूर', NULL),
('शालेय पोषण आहार तपासणी', 'आपेगाव जिल्हा परिषद शाळेत पोषण आहार तपासणी समितीची बैठक होणार आहे.', 'meeting', 'आपेगाव', NULL);