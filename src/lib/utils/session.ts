export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function hashPan(pan: string): string {
  // Simple hash function for deterministic mock data
  let hash = 0;
  for (let i = 0; i < pan.length; i++) {
    const char = pan.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}