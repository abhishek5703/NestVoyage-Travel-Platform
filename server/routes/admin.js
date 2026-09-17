const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.use(requireAuth, requireAdmin);

// Reserved for future moderation/admin features.
// Intentionally not exposed to normal users.
router.get("/health", (req, res) => res.json({ ok: true, role: req.user.role }));

module.exports = router;
