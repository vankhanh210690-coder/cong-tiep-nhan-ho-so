-- =============================================================
-- Portal: student_profiles + documents + Storage bucket
-- Khách đăng nhập (Supabase Auth email magic-link) → upload →
-- Gemini Vision extract → đối chiếu điểm chuẩn
-- =============================================================

-- ========== student_profiles: 1 record per auth user ==========
CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,                       -- trích từ bảng điểm hoặc CCCD
  date_of_birth text,                   -- dạng DD/MM/YYYY từ CCCD
  gpa numeric(3,1),                     -- từ bảng điểm
  ielts numeric(3,1),                   -- từ chứng chỉ IELTS
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_updated ON public.student_profiles(updated_at DESC);

-- Auto-create profile khi user mới signup qua auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.student_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== documents: giấy tờ upload ==========
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('transcript', 'ielts', 'identity')),
  file_name text NOT NULL,
  storage_path text NOT NULL,          -- bucket path: user_id/{doc_type}-{timestamp}.ext
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'dang_xu_ly' CHECK (status IN ('dang_xu_ly', 'hop_le', 'can_nop_lai')),
  reason text,                         -- lý do khi can_nop_lai
  extracted_data jsonb,                -- JSON từ Gemini Vision
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id, doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON public.documents(uploaded_at DESC);

-- 1 user chỉ có 1 document hiện hành mỗi loại (upload lại = thay cái cũ)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_doctype ON public.documents(user_id, doc_type);

-- Auto update profile.updated_at khi document đổi
CREATE OR REPLACE FUNCTION public.touch_profile_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.student_profiles
    SET updated_at = now()
    WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_profile ON public.documents;
CREATE TRIGGER trg_touch_profile
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated();

-- ========== RLS zero-policy (server-only qua sb_secret_) ==========
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_profiles FROM anon, authenticated;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.documents FROM anon, authenticated;

-- ========== Storage bucket ==========
-- Tạo bucket PRIVATE (không public URL) nếu chưa có
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,                               -- PRIVATE
  5242880,                             -- 5 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

-- Storage RLS: chỉ server (service_role) truy cập — không cho anon/authenticated trực tiếp
-- Lý do: upload/download đều đi qua API server để log + audit + extract
-- (Không tạo policy cho anon/authenticated → không ai ngoài service_role đụng được)

COMMENT ON TABLE public.student_profiles IS 'Hồ sơ học viên portal, 1-1 với auth.users. RLS zero-policy.';
COMMENT ON TABLE public.documents IS 'Giấy tờ học viên upload. RLS zero-policy, server-side only.';
