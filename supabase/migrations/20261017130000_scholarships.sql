-- =============================================================
-- Học bổng theo từng trường
-- Dữ liệu công khai, nhưng vẫn RLS zero-policy (query qua server
-- để consistent với bảng khác + có thể audit sau)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.scholarships (
  id text PRIMARY KEY,
  name text NOT NULL,
  school_id text NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,

  -- Điều kiện tối thiểu (ít nhất 1 trường được set)
  min_gpa numeric(3,1),
  min_ielts numeric(3,1),

  -- Mức hỗ trợ
  benefit_text text NOT NULL,                   -- vd '25% học phí', 'Toàn phần'
  benefit_percent integer,                       -- vd 25, 20, 100 — để sort

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_school ON public.scholarships(school_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_benefit ON public.scholarships(benefit_percent DESC NULLS LAST);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.scholarships FROM anon, authenticated;

-- Seed 4 học bổng
INSERT INTO public.scholarships (id, name, school_id, min_gpa, min_ielts, benefit_text, benefit_percent) VALUES
  ('sch_deakin_merit',       'Merit Deakin',             'sch_06', 8.0, NULL, '25% học phí',  25),
  ('sch_swinburne_global',   'Global Excellence',        'sch_07', NULL, 7.0, '20% học phí',  20),
  ('sch_melbourne_chancell', 'Chancellor''s Scholarship','sch_08', 9.0, NULL, 'Toàn phần',    100),
  ('sch_auckland_intl',      'International Excellence', 'sch_09', 7.5, NULL, '15% học phí',  15)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.scholarships IS 'Học bổng theo trường. Khách đạt min_gpa HOẶC min_ielts (tùy field nào được set) thì đủ điều kiện.';
