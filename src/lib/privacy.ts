export const USER_PRIVATE_OMIT = {
  email: true,
  emailVerified: true,
  passwordHash: true,
  status: true,
  suspendedUntil: true,
  suspensionReason: true,
  suspensionNote: true,
  violationCount: true,
  lastViolationAt: true,
  scheduledDeleteAt: true,
} as const;

export const PROFILE_PRIVATE_OMIT = {
  aiMemory: true,
  aiSettings: true,
} as const;

export const PUBLIC_USER_INCLUDE = {
  omit: USER_PRIVATE_OMIT,
  include: { profile: { omit: PROFILE_PRIVATE_OMIT } },
} as const;