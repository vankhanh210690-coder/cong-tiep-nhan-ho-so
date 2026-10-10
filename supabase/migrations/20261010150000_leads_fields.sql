-- =============================================================
-- Mở rộng conversation_insights với các trường chuẩn sales triage
-- =============================================================

ALTER TABLE public.conversation_insights
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS wants_consultation boolean,
  ADD COLUMN IF NOT EXISTS lead_quality text CHECK (lead_quality IN ('good', 'ok', 'spam')),
  ADD COLUMN IF NOT EXISTS note text;

CREATE INDEX IF NOT EXISTS idx_insights_lead_quality
  ON public.conversation_insights (lead_quality)
  WHERE lead_quality IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_insights_wants_consult
  ON public.conversation_insights (wants_consultation)
  WHERE wants_consultation = true;

COMMENT ON COLUMN public.conversation_insights.availability IS 'Khung giờ khách rảnh tư vấn (vd "tối thứ 7")';
COMMENT ON COLUMN public.conversation_insights.wants_consultation IS 'Khách có đồng ý đặt lịch tư vấn 1-1 không';
COMMENT ON COLUMN public.conversation_insights.lead_quality IS 'Phân loại nhanh lead: good (hot, follow ngay), ok (nurture), spam (bot/lạc đề)';
COMMENT ON COLUMN public.conversation_insights.note IS 'Ghi chú/câu hỏi khách để lại ngoài form chuẩn';
