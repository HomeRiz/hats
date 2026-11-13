import rateLimit from 'express-rate-limit';

const WINDOW_MS = 60 * 1000;
const MOCK_PREFIX = '/mock-frontend/';

function build(limit, extra = {}) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many requests. Wait a minute and try again.' },
    ...extra,
  });
}

export function createLimiter(limit, extra) {
  return build(limit, extra);
}

export const apiLimiter = build(3000, { skip: (req) => req.path.startsWith(MOCK_PREFIX) });
export const assetLimiter = build(30000);
