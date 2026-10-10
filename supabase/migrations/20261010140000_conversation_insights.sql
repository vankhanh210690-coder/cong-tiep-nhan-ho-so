-- =============================================================
-- Conversation insights: thông tin trích xuất + đánh giá chất lượng
-- 1-1 với conversation (PK = conversation_id)
-- RLS zero-policy, chỉ sb_secret_ truy cập
-- =============================================================

CREATE TABLE IF NOT EXISTS public.conversation_insights (
  conversation_id uuid PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,

  -- Thông tin cá nhân khách
  lead_name text,
  lead_email text,
  lead_phone text,

  -- Nhu cầu du học
  country text,                     -- quốc gia muốn đi
  degree text,                      -- bậc học
  major text,                       -- ngành
  timeline text,                    -- thời gian dự kiến (vd "Fall 2027")
  has_ielts boolean,                -- NULL = chưa biết

  -- Dịch vụ đã trao đổi
  services_discussed text[],        -- vd ['chọn trường', 'xin visa']

  -- Đánh giá chất lượng
  lead_captured boolean DEFAULT false,  -- true nếu có đủ tên + (email OR phone)
  quality_score integer CHECK (quality_score BETWEEN 1 AND 5),
  flow_stage text CHECK (flow_stage IN (
    'greeting', 'country', 'degree', 'service_intro',
    'offer_consultation', 'collecting_contact', 'closed', 'off_topic'
  )),
  summary text,                     -- 1-2 câu tóm tắt
  quality_notes text,               -- nhận xét ngắn về chất lượng tư vấn

  -- Meta
  extracted_at timestamptz NOT NULL DEFAULT now(),
  model_used text                   -- vd 'gemini-3.5-flash-lite'
);

CREATE INDEX IF NOT EXISTS idx_insights_lead ON public.conversation_insights (lead_captured) WHERE lead_captured = true;
CREATE INDEX IF NOT EXISTS idx_insights_quality ON public.conversation_insights (quality_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_insights_country ON public.conversation_insights (country) WHERE country IS NOT NULL;

ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_insights FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.conversation_insights FROM anon, authenticated;

COMMENT ON TABLE public.conversation_insights IS
  'Thông tin trích xuất + đánh giá chất lượng cho mỗi conversation, generate bởi Gemini. RLS zero-policy giống bảng cha.';
