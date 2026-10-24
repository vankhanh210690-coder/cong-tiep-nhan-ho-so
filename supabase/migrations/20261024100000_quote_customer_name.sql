-- Thêm cột customer_name vào quote_requests
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS customer_name text;
