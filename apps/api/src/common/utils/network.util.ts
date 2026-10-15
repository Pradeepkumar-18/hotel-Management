/**
 * Truncates client IP addresses to subnet masks to ensure GDPR/privacy compliance
 * while still allowing subnet-based rate limiting and security telemetry.
 */
export function privacySafeIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  const normalized = ip.replace(/^::ffff:/, '').trim();
  if (normalized.includes('.')) {
    return `${normalized.split('.').slice(0, 3).join('.')}.0/24`;
  }
  return `${normalized.split(':').slice(0, 4).join(':')}::/64`;
}
