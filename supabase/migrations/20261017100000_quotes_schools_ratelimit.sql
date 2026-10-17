-- =============================================================
-- Hoàn thiện 3 module còn mock: quote_requests, schools, chat_rate_limits
-- Tất cả RLS zero-policy (server-only qua sb_secret_)
-- =============================================================

-- ========== quote_requests: form báo giá trang chủ ==========
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  degree_level text NOT NULL,
  package text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  quote_amount bigint NOT NULL,          -- VNĐ, bigint vì có thể lên 100 triệu
  status text NOT NULL DEFAULT 'cho_duyet' CHECK (status IN ('cho_duyet', 'da_duyet', 'tu_choi')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text
);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON public.quote_requests(created_at DESC);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.quote_requests FROM anon, authenticated;

-- ========== schools: trường + điểm chuẩn ==========
CREATE TABLE IF NOT EXISTS public.schools (
  id text PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL,
  min_gpa numeric(3,1) NOT NULL,
  min_ielts numeric(3,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schools_country ON public.schools(country);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.schools FROM anon, authenticated;

-- Seed 5 trường từ mock-data cũ
INSERT INTO public.schools (id, name, country, min_gpa, min_ielts) VALUES
  ('sch_01', 'University of Toronto', 'Canada', 8.0, 6.5),
  ('sch_02', 'RMIT University', 'Úc', 7.0, 6.0),
  ('sch_03', 'University of Manchester', 'Anh', 7.5, 6.5),
  ('sch_04', 'Arizona State University', 'Mỹ', 6.5, 6.0),
  ('sch_05', 'Yonsei University', 'Hàn Quốc', 8.5, 7.0)
ON CONFLICT (id) DO NOTHING;

-- ========== chat_rate_limits: persist rate limit qua Supabase ==========
CREATE TABLE IF NOT EXISTS public.chat_rate_limits (
  session_id text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_rate_window ON public.chat_rate_limits(window_start);

ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rate_limits FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_rate_limits FROM anon, authenticated;

-- Function atomic increment: tăng count nếu còn trong window, reset nếu quá
CREATE OR REPLACE FUNCTION public.bump_rate_limit(
  p_session text,
  p_window_seconds integer,
  p_max integer
) RETURNS TABLE(allowed boolean, retry_after integer)
LANGUAGE plpgsql AS $$
DECLARE
  v_now timestamptz := now();
  v_cutoff timestamptz := v_now - make_interval(secs => p_window_seconds);
  v_count integer;
  v_window_start timestamptz;
BEGIN
  INSERT INTO public.chat_rate_limits (session_id, count, window_start)
  VALUES (p_session, 1, v_now)
  ON CONFLICT (session_id) DO UPDATE
    SET
      count = CASE WHEN chat_rate_limits.window_start < v_cutoff THEN 1
                   ELSE chat_rate_limits.count + 1 END,
      window_start = CASE WHEN chat_rate_limits.window_start < v_cutoff THEN v_now
                          ELSE chat_rate_limits.window_start END
    RETURNING chat_rate_limits.count, chat_rate_limits.window_start
    INTO v_count, v_window_start;

  IF v_count > p_max THEN
    RETURN QUERY SELECT false, GREATEST(1, EXTRACT(EPOCH FROM (v_window_start + make_interval(secs => p_window_seconds) - v_now))::int);
  ELSE
    RETURN QUERY SELECT true, 0;
  END IF;
END;
$$;

COMMENT ON TABLE public.quote_requests IS 'Form báo giá từ trang chủ. RLS zero-policy.';
COMMENT ON TABLE public.schools IS 'Danh sách trường + điểm chuẩn tham khảo.';
COMMENT ON TABLE public.chat_rate_limits IS 'Rate limit persist cho /api/chat, kháng cold start.';
