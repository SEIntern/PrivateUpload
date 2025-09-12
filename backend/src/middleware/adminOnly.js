export default function adminOrManager(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Access denied: Admins or Managers only' });
  }
  next();
}
