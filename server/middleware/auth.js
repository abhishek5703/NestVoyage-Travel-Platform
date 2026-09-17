function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Authentication required." });
}

function requireOwner(model, param = "id") {
  return async (req, res, next) => {
    try {
      const doc = await model.findById(req.params[param]);
      if (!doc) return res.status(404).json({ message: "Resource not found." });
      if (doc.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Owner authorization required." });
      }
      req.resource = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Admin authorization required." });
}

module.exports = { requireAuth, requireOwner, requireAdmin };
