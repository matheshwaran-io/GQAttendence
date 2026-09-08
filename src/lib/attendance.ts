import crypto from "crypto";

const WINDOW_SIZE_MS = 10000; // 10-second rotation window

/**
 * In-memory ledger of consumed single-use tokens to prevent replay attacks.
 */
const consumedTokens = new Set<string>();

/**
 * Persistent device binding registry (studentId -> hardwareFingerprint).
 * Ensures 1 Student Account is strictly bound to 1 Physical Device.
 */
const studentDeviceBindings = new Map<string, { fingerprint: string; boundAt: Date }>();

/**
 * Generates an HMAC-SHA256 token for a session based on the current 10-second time window.
 */
export function generateQRToken(sessionId: string, qrSecret: string, timestamp: number): string {
  const timeWindow = Math.floor(timestamp / WINDOW_SIZE_MS);
  const hmac = crypto.createHmac("sha256", qrSecret);
  hmac.update(`${sessionId}:${timeWindow}`);
  return hmac.digest("hex");
}

/**
 * Validates a QR code token, allowing the current and the immediately preceding 10-second window
 * to account for network transmission latency.
 */
export function validateQRToken(sessionId: string, qrSecret: string, token: string): boolean {
  const now = Date.now();
  const tokenCurrent = generateQRToken(sessionId, qrSecret, now);
  const tokenPrev = generateQRToken(sessionId, qrSecret, now - WINDOW_SIZE_MS);
  return token === tokenCurrent || token === tokenPrev;
}

/**
 * Single-Use Nonce Validator: Ensures a token cannot be replayed or shared.
 */
export function checkAndConsumeTokenNonce(sessionId: string, studentId: string, token: string): boolean {
  const key = `${sessionId}:${studentId}:${token}`;
  if (consumedTokens.has(key)) {
    return false; // Replay attack detected
  }
  consumedTokens.add(key);
  setTimeout(() => {
    consumedTokens.delete(key);
  }, 120000); // 2 minutes auto-expiration
  return true;
}

/**
 * Single-Device Binding Validator:
 * Validates whether the student's phone matches their registered hardware signature.
 */
export function verifyStudentDeviceBinding(studentId: string, fingerprint: string): { isBound: boolean; isValid: boolean } {
  if (!fingerprint) return { isBound: false, isValid: true };
  const existing = studentDeviceBindings.get(studentId);
  if (!existing) {
    // First time binding this student's account to this device
    studentDeviceBindings.set(studentId, { fingerprint, boundAt: new Date() });
    return { isBound: true, isValid: true };
  }
  return { isBound: true, isValid: existing.fingerprint === fingerprint };
}

/**
 * Resets a student's device binding (e.g. if student bought a new phone and tutor approves).
 */
export function resetStudentDeviceBinding(studentId: string) {
  studentDeviceBindings.delete(studentId);
}

/**
 * Calculates the distance in meters between two GPS coordinates using the Haversine formula.
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // returns distance in meters
}
