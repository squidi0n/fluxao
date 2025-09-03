// Edge Runtime compatible password hashing using Web Crypto API
const SALT_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations (equivalent security to bcrypt rounds=12)

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Hash a password using Web Crypto API (PBKDF2)
 * @param password Plain text password
 * @returns Hashed password with salt (base64 encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const salt = generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );

  // Combine salt and hash
  const combined = new Uint8Array(salt.length + hashBuffer.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hashBuffer), salt.length);

  // Return base64 encoded result
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password (base64 encoded with salt)
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    // Decode base64 hash
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    
    // Extract salt and hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);

    // Hash the input password with the stored salt
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const newHash = new Uint8Array(hashBuffer);

    // Compare hashes using constant-time comparison
    if (storedHash.length !== newHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < storedHash.length; i++) {
      result |= storedHash[i] ^ newHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check if a password meets security requirements
 * @param password Password to check
 * @returns Object with validation result
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Relaxed validation - only length required for now
  // Can be made stricter later if needed
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
