-- =============================================================
-- Chat storage for DuHoc24 widget
-- Server-only access via sb_secret_ key (RLS block anon)
-- =============================================================

-- Conversations: 1 record per visitor session (cookie du_sid)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  message_count integer NOT NULL DEFAULT 0,
  user_agent text,
  ip_hash text
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_msg
  ON public.conversations (last_message_at DESC);

-- Messages: child of conversations
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'bot')),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON public.messages (conversation_id, created_at);

-- Auto-bump last_message_at + message_count khi có message mới
CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         message_count = message_count + 1
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_conversation ON public.messages;
CREATE TRIGGER trg_bump_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_conversation();

-- =============================================================
-- RLS: enable + ZERO policy cho anon/authenticated
-- → chỉ service_role (sb_secret_) mới read/write được
-- =============================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

-- Revoke mọi quyền default của anon/authenticated (chắc ăn 2 lớp)
REVOKE ALL ON public.conversations FROM anon, authenticated;
REVOKE ALL ON public.messages FROM anon, authenticated;

COMMENT ON TABLE public.conversations IS
  'Chat sessions của khách DuHoc24. RLS zero-policy: chỉ sb_secret_ truy cập được từ server.';
COMMENT ON TABLE public.messages IS
  'Nội dung tin nhắn trong từng conversation. RLS zero-policy giống bảng cha.';
