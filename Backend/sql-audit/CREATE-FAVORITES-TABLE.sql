-- FAVORITES SYSTEM - SUPABASE TABLE CREATION
-- Created: 2025-01-03
-- Purpose: Unified favorites system for properties

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID NOT NULL, -- References properties table
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique constraint per user-property combination
  UNIQUE(user_id, property_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_favorites_updated_at_trigger ON favorites;
CREATE TRIGGER update_favorites_updated_at_trigger
  BEFORE UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
GRANT USAGE ON SEQUENCE favorites_id_seq TO authenticated;

-- Verification queries (for testing)
-- SELECT * FROM favorites WHERE user_id = auth.uid();
-- INSERT INTO favorites (user_id, property_id) VALUES (auth.uid(), 'some-property-id');
-- DELETE FROM favorites WHERE user_id = auth.uid() AND property_id = 'some-property-id';

COMMENT ON TABLE favorites IS 'User favorites for properties - unified system with RLS';
COMMENT ON COLUMN favorites.user_id IS 'Reference to authenticated user';
COMMENT ON COLUMN favorites.property_id IS 'Reference to property (UUID string)';
COMMENT ON COLUMN favorites.created_at IS 'When favorite was added';
COMMENT ON COLUMN favorites.updated_at IS 'Last modification timestamp';
