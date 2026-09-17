const router = require("express").Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const User = require("../models/user");
const { Listing } = require("../models/listing");
const Review = require("../models/review");
const { requireAuth } = require("../middleware/auth");
const { destroyMany } = require("../services/cloudinary");
const { getRecommendationsForUser } = require("../services/recommendations");

const upload = multer({
  storage,
  limits: { files: 8, fileSize: 8 * 1024 * 1024 }
});

function primaryImage(user) {
  return user.profileImage?.url || user.profileImages?.[0]?.url || "";
}

function publicUser(user) {
  const obj = user.toObject({ virtuals: true });
  obj.primaryProfileImage = primaryImage(user);
  delete obj.hash;
  delete obj.salt;
  return obj;
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: "favorites", populate: { path: "owner", select: "username profileImage profileImages" } })
      .populate({ path: "recentlyViewed.listing", populate: { path: "owner", select: "username profileImage profileImages" } });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const allowed = ["username", "email", "bio", "phone", "location", "socialLinks"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    if (update.email) update.email = String(update.email).toLowerCase().trim();
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post("/me/images", requireAuth, upload.array("profileImages", 8), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const items = (req.files || []).map(file => ({ url: file.path, publicId: file.filename }));
    if (!items.length) return res.status(400).json({ message: "No images received." });
    user.profileImages.push(...items);
    if (!user.profileImage?.url) user.profileImage = items[0];
    await user.save();
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.delete("/me/images/:imageId", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const image = user.profileImages.id(req.params.imageId);
    if (!image) return res.status(404).json({ message: "Profile image not found." });

    const wasPrimary = user.profileImage?.publicId === image.publicId;
    await destroyMany([image]);
    image.deleteOne();
    if (wasPrimary) {
      const nextPrimary = user.profileImages[0];
      user.profileImage = nextPrimary ? { url: nextPrimary.url, publicId: nextPrimary.publicId } : undefined;
    }
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.put("/me/images/:imageId/primary", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const image = user.profileImages.id(req.params.imageId);
    if (!image) return res.status(404).json({ message: "Profile image not found." });
    user.profileImage = { url: image.url, publicId: image.publicId };
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.put("/me/images/reorder", requireAuth, async (req, res, next) => {
  try {
    const { imageIds } = req.body;
    if (!Array.isArray(imageIds)) return res.status(400).json({ message: "imageIds must be an array." });
    const user = await User.findById(req.user._id);
    const byId = new Map(user.profileImages.map(x => [String(x._id), x]));
    const reordered = imageIds.map(id => byId.get(String(id))).filter(Boolean);
    user.profileImages.forEach(x => { if (!imageIds.includes(String(x._id))) reordered.push(x); });
    user.profileImages = reordered;
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get("/me/favorites", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: "favorites", populate: { path: "owner", select: "username profileImage profileImages" } });
    res.json({ listings: user.favorites || [] });
  } catch (err) { next(err); }
});

router.post("/me/favorites/:listingId", requireAuth, async (req, res, next) => {
  try {
    const exists = await Listing.exists({ _id: req.params.listingId });
    if (!exists) return res.status(404).json({ message: "Listing not found." });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: req.params.listingId } });
    res.json({ message: "Added to favorites." });
  } catch (err) { next(err); }
});

router.delete("/me/favorites/:listingId", requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: req.params.listingId } });
    res.json({ message: "Removed from favorites." });
  } catch (err) { next(err); }
});

router.get("/me/recent", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: "recentlyViewed.listing", populate: { path: "owner", select: "username profileImage profileImages" } });
    const recent = (user.recentlyViewed || []).sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    res.json({ listings: recent.map(x => x.listing).filter(Boolean) });
  } catch (err) { next(err); }
});

router.post("/me/recent/:listingId", requireAuth, async (req, res, next) => {
  try {
    const exists = await Listing.exists({ _id: req.params.listingId });
    if (!exists) return res.status(404).json({ message: "Listing not found." });
    const user = await User.findById(req.user._id);
    user.recentlyViewed = (user.recentlyViewed || []).filter(x => x.listing?.toString() !== req.params.listingId);
    user.recentlyViewed.unshift({ listing: req.params.listingId, viewedAt: new Date() });
    user.recentlyViewed = user.recentlyViewed.slice(0, 12);
    await user.save();
    res.status(204).end();
  } catch (err) { next(err); }
});

router.delete("/me/recent/:listingId", requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { recentlyViewed: { listing: req.params.listingId } } });
    res.json({ message: "Removed from recently viewed." });
  } catch (err) { next(err); }
});

router.delete("/me/recent", requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { recentlyViewed: [] } });
    res.json({ message: "Recently viewed history cleared." });
  } catch (err) { next(err); }
});

router.get("/me/recommendations", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const listings = await getRecommendationsForUser(user, Math.min(Number(req.query.limit) || 8, 16));
    res.json({ listings });
  } catch (err) { next(err); }
});

router.get("/me/dashboard", requireAuth, async (req, res, next) => {
  try {
    const [listings, reviews] = await Promise.all([
      Listing.find({ owner: req.user._id }).select("_id title price createdAt reviews image images location country category"),
      Review.find({ author: req.user._id }).select("_id")
    ]);
    const received = await Review.find({ _id: { $in: listings.flatMap(l => l.reviews) } }).select("rating");
    const averageRating = received.length ? Number((received.reduce((sum, r) => sum + r.rating, 0) / received.length).toFixed(2)) : 0;
    res.json({
      stats: {
        totalListings: listings.length,
        totalReviewsWritten: reviews.length,
        totalReviewsReceived: received.length,
        averageRating
      },
      recentListings: listings.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
    });
  } catch (err) { next(err); }
});

router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const owned = await Listing.find({ owner: userId });
    const listingIds = owned.map(x => x._id);
    for (const listing of owned) {
      await Listing.findOneAndDelete({ _id: listing._id });
      const images = listing.images?.length ? listing.images : (listing.image?.url ? [{ publicId: listing.image.filename }] : []);
      await destroyMany(images);
    }
    await Review.deleteMany({ author: userId });
    await User.findByIdAndDelete(userId);
    req.logout(() => req.session.destroy(() => res.clearCookie("connect.sid").json({ message: "Account deleted." })));
  } catch (err) { next(err); }
});


// Compatibility aliases matching the target API specification.
router.post("/me/favorites", requireAuth, async (req, res, next) => {
  try {
    const listingId = req.body.listingId || req.body.id;
    if (!listingId) return res.status(400).json({ message: "listingId is required." });
    const exists = await Listing.exists({ _id: listingId });
    if (!exists) return res.status(404).json({ message: "Listing not found." });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: listingId } });
    res.json({ message: "Added to favorites." });
  } catch (err) { next(err); }
});

router.delete("/me/favorites/:listingId", requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: req.params.listingId } });
    res.json({ message: "Removed from favorites." });
  } catch (err) { next(err); }
});

module.exports = router;
