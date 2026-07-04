/**
 * SMTP Password Encryption using Supabase Vault
 * 
 * This module provides encryption/decryption for SMTP passwords
 * using Supabase's built-in Vault feature (backed by AWS KMS).
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Encrypt SMTP password using Supabase Vault
 * 
 * @param password - Plain text password
 * @returns Encrypted password (vault secret ID)
 */
export async function encryptPassword(password: string): Promise<string> {
  const supabase = await createClient()
  
  // Use Supabase Vault to store the password securely
  // The vault.create_secret function returns a UUID reference
  const { data, error } = await supabase.rpc('vault_create_secret', {
    secret: password,
    name: `smtp_password_${Date.now()}`, // Unique name for tracking
    description: 'SMTP account password',
  })

  if (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt password')
  }

  return data as string // Returns the secret UUID
}

/**
 * Decrypt SMTP password from Supabase Vault
 * 
 * @param secretId - Vault secret ID (UUID)
 * @returns Decrypted password
 */
export async function decryptPassword(secretId: string): Promise<string> {
  const supabase = await createClient()
  
  // Retrieve the secret from Vault
  const { data, error } = await supabase.rpc('vault_read_secret', {
    secret_id: secretId,
  })

  if (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt password')
  }

  return data as string
}

/**
 * Delete SMTP password from Supabase Vault
 * 
 * @param secretId - Vault secret ID (UUID)
 */
export async function deletePassword(secretId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('vault_delete_secret', {
    secret_id: secretId,
  })

  if (error) {
    console.error('Deletion error:', error)
    throw new Error('Failed to delete password from vault')
  }
}

/**
 * Update SMTP password in Supabase Vault
 * 
 * @param oldSecretId - Old vault secret ID to delete
 * @param newPassword - New plain text password
 * @returns New encrypted password (vault secret ID)
 */
export async function updatePassword(
  oldSecretId: string | null,
  newPassword: string
): Promise<string> {
  // Delete old password if exists
  if (oldSecretId) {
    try {
      await deletePassword(oldSecretId)
    } catch (err) {
      console.error('Failed to delete old password:', err)
      // Continue anyway to store new password
    }
  }

  // Encrypt and store new password
  return await encryptPassword(newPassword)
}

/**
 * Fallback: Simple Base64 encoding (NOT SECURE - for development only)
 * Use Supabase Vault in production!
 * 
 * @param password - Plain text password
 * @returns Base64 encoded password
 */
export function simpleEncrypt(password: string): string {
  return Buffer.from(password).toString('base64')
}

/**
 * Fallback: Simple Base64 decoding (NOT SECURE - for development only)
 * 
 * @param encoded - Base64 encoded password
 * @returns Plain text password
 */
export function simpleDecrypt(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf8')
}
