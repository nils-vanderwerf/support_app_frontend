// AES-256-GCM with a per-conversation key derived via PBKDF2.
// Messages sent from the browser are encrypted before leaving the client.
// The ENC: prefix distinguishes encrypted content from legacy plaintext
// (e.g. AI-generated messages written directly by the backend).
//
// NOTE: the backend AI endpoint reads raw DB content, so AI-generated
// messages will remain plaintext until the backend is updated to
// decrypt before passing context to the model.

const APP_CONTEXT = 'support-app-messages-v1';
const IV_BYTES = 12;

// Cache derived keys to avoid running PBKDF2 on every message
const keyCache = new Map<number, CryptoKey>();

async function deriveKey(conversationId: number): Promise<CryptoKey> {
  if (keyCache.has(conversationId)) return keyCache.get(conversationId)!;

  // HKDF is appropriate here: the input is already uniform (a fixed context
  // string, not a low-entropy password), so the iteration-based slowness of
  // PBKDF2 would add latency without adding security.
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_CONTEXT),
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(APP_CONTEXT),
      info: new TextEncoder().encode(`conv-${conversationId}`),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(conversationId, key);
  return key;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function encryptMessage(plaintext: string, conversationId: number): Promise<string> {
  const key = await deriveKey(conversationId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);
  return 'ENC:' + bytesToBase64(combined);
}

// Returns plaintext. If content lacks the ENC: prefix it is returned
// as-is, preserving display of AI/legacy messages without error.
export async function decryptMessage(content: string, conversationId: number): Promise<string> {
  if (!content.startsWith('ENC:')) return content;
  try {
    const key = await deriveKey(conversationId);
    const combined = base64ToBytes(content.slice(4));
    const iv = combined.slice(0, IV_BYTES);
    const ciphertext = combined.slice(IV_BYTES);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return content;
  }
}
