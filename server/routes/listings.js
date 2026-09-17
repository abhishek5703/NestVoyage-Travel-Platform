const router = require("express").Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const { Listing, categories } = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const { requireAuth, requireOwner } = require("../middleware/auth");
const { listingJoi } = require("../utils/validation");
const { destroyMany } = require("../services/cloudinary");

const upload = multer({
  storage,
  limits: { files: 8, fileSize: 8 * 1024 * 1024 }
});

const escapeRegex = value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

function buildFilter(query) {
  const { search = "", q = "", category = "", location = "", minPrice, maxPrice } = query;
  const keyword = (search || q).trim();
  const filter = {};
  if (keyword) {
    const rx = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ title: rx }, { description: rx }, { location: rx }, { country: rx }, { category: rx }];
  }
  if (category.trim()) filter.category = { $in: category.split(",").map(x => x.trim()).filter(Boolean) };
  if (location.trim()) filter.location = new RegExp(escapeRegex(location.trim()), "i");
  if (minPrice !== undefined && minPrice !== "") filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice !== undefined && maxPrice !== "") filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  return filter;
}

function serialize(listing) {
  const obj = listing.toObject ? listing.toObject({ virtuals: true }) : listing;
  obj.coverImage = obj.images?.[0]?.url || obj.image?.url || "";
  obj.imageItems = obj.images?.length ? obj.images : (obj.image?.url ? [{ url: obj.image.url, publicId: obj.image.filename || "" }] : []);
  return obj;
}

router.get("/meta/categories", (req, res) => res.json({ categories }));

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 40);
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1, createdAt: -1 },
      price_desc: { price: -1, createdAt: -1 },
      rating: { rating: -1, createdAt: -1 },
      popular: { reviewCount: -1, createdAt: -1 },
      recommended: { createdAt: -1 }
    };
    const sort = sortMap[req.query.sort] || sortMap.newest;
    const filter = buildFilter(req.query);

    // Fetch the matching listings through Mongoose so legacy and current
    // documents are both handled consistently. Ratings/review counts are
    // calculated after population, then the result is sorted and paginated.
    const allListings = await Listing.find(filter)
      .populate("owner", "username email profileImage profileImages")
      .populate("reviews", "rating")
      .lean();

    const enriched = allListings.map(listing => {
      const reviews = Array.isArray(listing.reviews) ? listing.reviews : [];
      const ratings = reviews
        .map(review => Number(review?.rating))
        .filter(Number.isFinite);

      return {
        ...listing,
        reviewCount: reviews.length,
        rating: ratings.length
          ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2))
          : 0
      };
    });

    const direction = value => Number(value) || 0;
    enriched.sort((a, b) => {
      if (req.query.sort === "price_asc") {
        return direction(a.price) - direction(b.price) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (req.query.sort === "price_desc") {
        return direction(b.price) - direction(a.price) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (req.query.sort === "rating") {
        return direction(b.rating) - direction(a.rating) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (req.query.sort === "popular") {
        return direction(b.reviewCount) - direction(a.reviewCount) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (req.query.sort === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const total = enriched.length;
    const startIndex = (page - 1) * limit;
    const items = enriched.slice(startIndex, startIndex + limit);

    res.json({
      listings: items.map(serialize),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("owner", "username email profileImage profileImages")
      .populate({ path: "reviews", populate: { path: "author", select: "username profileImage profileImages" } });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    res.json({ listing: serialize(listing) });
  } catch (err) { next(err); }
});

router.post("/", requireAuth, upload.array("images", 8), async (req, res, next) => {
  try {
    const payload = JSON.parse(req.body.listing || "{}");
    const { value, error } = listingJoi.validate(payload, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(", ") });

    const images = (req.files || []).map(file => ({ url: file.path, publicId: file.filename }));
    const listing = await Listing.create({
      ...value,
      owner: req.user._id,
      image: images[0] ? { url: images[0].url, filename: images[0].publicId } : undefined,
      images
    });
    const populated = await Listing.findById(listing._id).populate("owner", "username email profileImage profileImages");
    res.status(201).json({ listing: serialize(populated) });
  } catch (err) { next(err); }
});

router.put("/:id", requireAuth, requireOwner(Listing), upload.array("images", 8), async (req, res, next) => {
  try {
    const payload = JSON.parse(req.body.listing || "{}");
    const { value, error } = listingJoi.validate(payload, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(", ") });

    const listing = req.resource;
    Object.assign(listing, value);

    if ((req.files || []).length) {
      const oldNewFormat = listing.images?.length ? listing.images : (listing.image?.url ? [{ url: listing.image.url, publicId: listing.image.filename || "" }] : []);
      await destroyMany(oldNewFormat);
      const images = req.files.map(file => ({ url: file.path, publicId: file.filename }));
      listing.images = images;
      listing.image = images[0] ? { url: images[0].url, filename: images[0].publicId } : undefined;
    }
    await listing.save();
    const populated = await Listing.findById(listing._id).populate("owner", "username email profileImage profileImages");
    res.json({ listing: serialize(populated) });
  } catch (err) { next(err); }
});

router.delete("/:id", requireAuth, requireOwner(Listing), async (req, res, next) => {
  try {
    const listing = req.resource;
    await Listing.findOneAndDelete({ _id: listing._id });
    const images = listing.images?.length ? listing.images : (listing.image?.url ? [{ publicId: listing.image.filename }] : []);
    await destroyMany(images);
    res.json({ message: "Listing deleted." });
  } catch (err) { next(err); }
});

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate({ path: "reviews", populate: { path: "author", select: "username profileImage profileImages" } });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    res.json({ reviews: listing.reviews || [] });
  } catch (err) { next(err); }
});

router.post("/:id/reviews", requireAuth, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    const { value, error } = (require("../utils/validation").reviewJoi).validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(", ") });

    const review = await Review.create({ ...value, author: req.user._id });
    listing.reviews.push(review._id);
    await listing.save();
    const populated = await review.populate("author", "username profileImage profileImages");
    res.status(201).json({ review: populated });
  } catch (err) { next(err); }
});

router.delete("/:id/reviews/:reviewId", requireAuth, async (req, res, next) => {
  try {
    const [listing, review] = await Promise.all([
      Listing.findById(req.params.id),
      Review.findById(req.params.reviewId)
    ]);
    if (!listing || !review) return res.status(404).json({ message: "Review not found." });
    const isAuthor = review.author.toString() === req.user._id.toString();
    const isOwner = listing.owner.toString() === req.user._id.toString();
    if (!isAuthor && !isOwner) return res.status(403).json({ message: "Not authorized to delete this review." });

    await Promise.all([
      Review.findByIdAndDelete(review._id),
      Listing.findByIdAndUpdate(listing._id, { $pull: { reviews: review._id } })
    ]);
    res.json({ message: "Review deleted." });
  } catch (err) { next(err); }
});



router.post("/:id/view", requireAuth, async (req, res, next) => {
  try {
    const exists = await Listing.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: "Listing not found." });
    const user = await User.findById(req.user._id);
    user.recentlyViewed = (user.recentlyViewed || []).filter(x => x.listing?.toString() !== req.params.id);
    user.recentlyViewed.unshift({ listing: req.params.id, viewedAt: new Date() });
    user.recentlyViewed = user.recentlyViewed.slice(0, 12);
    await user.save();
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post("/:id/favorite", requireAuth, async (req, res, next) => {
  try {
    const exists = await Listing.exists({ _id: req.params.id });
    if (!exists) return res.status(404).json({ message: "Listing not found." });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: req.params.id } });
    res.json({ message: "Added to favorites.", favorite: true });
  } catch (err) { next(err); }
});

router.delete("/:id/favorite", requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: req.params.id } });
    res.json({ message: "Removed from favorites.", favorite: false });
  } catch (err) { next(err); }
});

module.exports = router;
