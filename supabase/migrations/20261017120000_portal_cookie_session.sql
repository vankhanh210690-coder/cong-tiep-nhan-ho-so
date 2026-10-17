-- =============================================================
-- Refactor Portal: bỏ auth, dùng cookie portal_sid (không login)
-- Mở rộng fields trích xuất: GPA, IELTS 4 skills + overall + ngày thi,
-- số CCCD/passport
-- RLS zero-policy, server-only
-- =============================================================

-- Drop trigger + bảng cũ (có FK auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS trg_touch_profile ON public.documents;
DROP FUNCTION IF EXISTS public.touch_profile_updated();
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;

-- ========== student_profiles mới: dùng cookie session ==========
CREATE TABLE public.student_profiles (
  session_id text PRIMARY KEY,                 -- khớp cookie portal_sid

  -- Trích từ BẢNG ĐIỂM
  full_name text,
  date_of_birth text,                          -- DD/MM/YYYY
  gpa numeric(3,1),                            -- thang 10

  -- Trích từ CHỨNG CHỈ IELTS (có thể tên khác bảng điểm)
  ielts_name text,
  ielts_overall numeric(3,1),
  ielts_listening numeric(3,1),
  ielts_reading numeric(3,1),
  ielts_writing numeric(3,1),
  ielts_speaking numeric(3,1),
  ielts_test_date text,                        -- DD/MM/YYYY

  -- Trích từ CMND/CCCD/HỘ CHIẾU
  identity_name text,
  identity_dob text,
  identity_number text,                        -- số CMND/CCCD/passport

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_updated ON public.student_profiles(updated_at DESC);

-- ========== documents: giấy tờ upload ==========
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES public.student_profiles(session_id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('transcript', 'ielts', 'identity')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'dang_xu_ly' CHECK (status IN ('dang_xu_ly', 'hop_le', 'can_nop_lai')),
  reason text,
  extracted_data jsonb,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_session_doctype ON public.documents(session_id, doc_type);
CREATE INDEX idx_documents_uploaded ON public.documents(uploaded_at DESC);

-- Trigger: mỗi khi insert/update document → bump profile.updated_at
CREATE OR REPLACE FUNCTION public.touch_profile_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.student_profiles
    SET updated_at = now()
    WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_profile
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated();

-- ========== RLS zero-policy ==========
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_profiles FROM anon, authenticated;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.documents FROM anon, authenticated;

COMMENT ON TABLE public.student_profiles IS 'Hồ sơ portal theo cookie portal_sid. RLS zero-policy, server-only.';
COMMENT ON TABLE public.documents IS 'Giấy tờ upload portal. RLS zero-policy, server-only.';
