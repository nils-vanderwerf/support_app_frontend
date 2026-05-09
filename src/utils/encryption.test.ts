import { encryptMessage, decryptMessage } from './encryption';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const round = async (text: string, convId: number) =>
  decryptMessage(await encryptMessage(text, convId), convId);

// ---------------------------------------------------------------------------
// Round-trip correctness
// ---------------------------------------------------------------------------

describe('encryptMessage / decryptMessage', () => {
  it('round-trips ASCII plaintext', async () => {
    expect(await round('Hello, world!', 1)).toBe('Hello, world!');
  });

  it('round-trips unicode and emoji content', async () => {
    const text = 'Hi 👋 — Héllo wörld 🌏';
    expect(await round(text, 2)).toBe(text);
  });

  it('round-trips an empty string', async () => {
    expect(await round('', 3)).toBe('');
  });

  it('round-trips a multi-line message', async () => {
    const text = 'Line 1\nLine 2\nLine 3';
    expect(await round(text, 4)).toBe(text);
  });

  // -------------------------------------------------------------------------
  // Ciphertext properties
  // -------------------------------------------------------------------------

  it('produces output with the ENC: prefix', async () => {
    const enc = await encryptMessage('test', 5);
    expect(enc).toMatch(/^ENC:/);
  });

  it('encrypting the same text twice produces different ciphertext (random IV)', async () => {
    const a = await encryptMessage('same text', 6);
    const b = await encryptMessage('same text', 6);
    expect(a).not.toBe(b);
  });

  it('different conversation IDs produce different ciphertext', async () => {
    const a = await encryptMessage('same text', 10);
    const b = await encryptMessage('same text', 11);
    expect(a).not.toBe(b);
  });

  // -------------------------------------------------------------------------
  // Key isolation
  // -------------------------------------------------------------------------

  it('cannot decrypt a message encrypted for a different conversation', async () => {
    const enc = await encryptMessage('secret', 20);
    const result = await decryptMessage(enc, 21);
    // Decryption with the wrong key fails; original ciphertext is returned
    expect(result).toBe(enc);
    expect(result).not.toBe('secret');
  });

  // -------------------------------------------------------------------------
  // Backward-compatibility: plaintext pass-through
  // -------------------------------------------------------------------------

  it('passes through messages that lack the ENC: prefix unchanged', async () => {
    expect(await decryptMessage('Hello there', 1)).toBe('Hello there');
  });

  it('passes through [SYS] system messages unchanged', async () => {
    const sys = '[SYS] Appointment scheduled for Monday.';
    expect(await decryptMessage(sys, 1)).toBe(sys);
  });

  it('passes through AI-generated plaintext unchanged', async () => {
    const ai = 'Sure! I can help you book an appointment.';
    expect(await decryptMessage(ai, 1)).toBe(ai);
  });

  // -------------------------------------------------------------------------
  // Resilience against corrupted / tampered ciphertext
  // -------------------------------------------------------------------------

  it('returns the original string when the base64 payload is corrupted', async () => {
    const bad = 'ENC:!!!not_valid_base64!!!';
    expect(await decryptMessage(bad, 1)).toBe(bad);
  });

  it('returns the original string when the ciphertext is truncated', async () => {
    const enc = await encryptMessage('test', 30);
    const truncated = enc.slice(0, enc.length - 10);
    expect(await decryptMessage(truncated, 30)).toBe(truncated);
  });

  it('returns the original string when the ciphertext is tampered (bit-flip)', async () => {
    const enc = await encryptMessage('test', 40);
    // Flip the last character of the base64 payload
    const tampered = enc.slice(0, -1) + (enc.endsWith('A') ? 'B' : 'A');
    const result = await decryptMessage(tampered, 40);
    expect(result).toBe(tampered);
  });

  // -------------------------------------------------------------------------
  // Key caching — same conversation ID works correctly across multiple calls
  // -------------------------------------------------------------------------

  it('decrypts multiple messages for the same conversation correctly', async () => {
    const msgs = ['First message', 'Second message', 'Third message'];
    const encrypted = await Promise.all(msgs.map(m => encryptMessage(m, 50)));
    const decrypted = await Promise.all(encrypted.map(e => decryptMessage(e, 50)));
    expect(decrypted).toEqual(msgs);
  });
});
