-- Add missing INSERT policy for certificates table

CREATE POLICY "Users can insert own certificates" 
ON certificates 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());
