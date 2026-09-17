const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  { _id: true }
);

const categories = [
  "Mountain", "Cities", "Camping", "Pools", "Rooms",
  "Boats", "Farms", "Hills", "Temples", "Trending",
  "Arctic", "Domes"
];

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 4000, default: "" },
    // Legacy field intentionally preserved.
    image: { url: String, filename: String },
    // New optional multi-image system.
    images: { type: [imageSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    country: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: [{ type: String, enum: categories }],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

listingSchema.index({ title: "text", description: "text", location: "text", country: "text" });
listingSchema.index({ category: 1, location: 1, price: 1, createdAt: -1 });

listingSchema.post("findOneAndDelete", async listing => {
  if (listing?.reviews?.length) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

listingSchema.virtual("coverImage").get(function () {
  return this.images?.[0]?.url || this.image?.url || "";
});

listingSchema.virtual("imageItems").get(function () {
  if (this.images?.length) return this.images;
  if (this.image?.url) return [{ url: this.image.url, publicId: this.image.filename || "" }];
  return [];
});

listingSchema.set("toJSON", { virtuals: true });

module.exports = { Listing: mongoose.model("Listing", listingSchema), categories };
