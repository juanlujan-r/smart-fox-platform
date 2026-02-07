/* ==========================================================================
   SMART FOX SOLUTIONS - STORAGE BUCKETS (AVATARS)
   Date: 2026-02-07
   Description: Create storage buckets for user avatars
   ========================================================================== */

-- ============================================================================
-- 1. CREATE AVATARS BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES FOR AVATARS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;

CREATE POLICY "Authenticated users upload avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public access to avatars" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Users update own avatars" ON storage.objects
FOR UPDATE TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatars" ON storage.objects
FOR DELETE TO authenticated 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
