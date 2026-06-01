export function requireAuth(req, res, next) {
  if (req.session?.authenticated) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

export function attachUserId(req, res, next) {
  if (req.session?.userId) {
    req.userId = req.session.userId;
  }
  next();
}
