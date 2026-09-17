const { Listing } = require("../models/listing");

async function getRecommendationsForUser(user, limit = 8) {
  const favoriteListings = await Listing.find({ _id: { $in: user.favorites || [] } }).select("category location price");
  const recentIds = (user.recentlyViewed || []).map(v => v.listing).filter(Boolean);

  const categoryCounts = new Map();
  favoriteListings.forEach(l => (l.category || []).forEach(c => categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1)));

  const preferredCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 3);
  const recent = await Listing.find({ _id: { $in: recentIds } }).select("location price category");
  const locations = [...new Set(recent.map(l => l.location).filter(Boolean))].slice(0, 3);

  const query = {};
  const or = [];
  if (preferredCategories.length) or.push({ category: { $in: preferredCategories } });
  if (locations.length) or.push({ location: { $in: locations } });
  if (or.length) query.$or = or;

  let results = await Listing.find(query).sort({ createdAt: -1 }).limit(limit);
  if (!results.length) results = await Listing.find({}).sort({ createdAt: -1 }).limit(limit);
  return results;
}

module.exports = { getRecommendationsForUser };
