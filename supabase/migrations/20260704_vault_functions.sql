-- Migration: Add Vault helper functions for SMTP password encryption
-- Date: 2026-07-04
-- Description: Create helper functions to interact with Supabase Vault for secure password storage

-- Enable the vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vault;

-- Function to create a vault secret
-- Returns the secret UUID
CREATE OR REPLACE FUNCTION vault_create_secret(
  secret TEXT,
  name TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_id UUID;
BEGIN
  -- Insert into vault.secrets
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (secret, name, description)
  RETURNING id INTO secret_id;
  
  RETURN secret_id;
END;
$$;

-- Function to read a vault secret
-- Returns the decrypted secret value
CREATE OR REPLACE FUNCTION vault_read_secret(
  secret_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  -- Retrieve from vault.secrets and decrypt
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE id = secret_id;
  
  IF secret_value IS NULL THEN
    RAISE EXCEPTION 'Secret not found: %', secret_id;
  END IF;
  
  RETURN secret_value;
END;
$$;

-- Function to delete a vault secret
CREATE OR REPLACE FUNCTION vault_delete_secret(
  secret_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM vault.secrets
  WHERE id = secret_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION vault_create_secret TO authenticated;
GRANT EXECUTE ON FUNCTION vault_read_secret TO authenticated;
GRANT EXECUTE ON FUNCTION vault_delete_secret TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION vault_create_secret IS 'Securely store a secret in Supabase Vault (AWS KMS-backed)';
COMMENT ON FUNCTION vault_read_secret IS 'Retrieve and decrypt a secret from Supabase Vault';
COMMENT ON FUNCTION vault_delete_secret IS 'Delete a secret from Supabase Vault';

-- Note: In production, you may want to add additional RLS policies
-- to restrict which users can access which secrets based on organization_id
-- This would require storing organization context in the vault.secrets table
