const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: false },
    firebaseUid: { type: String, trim: true, index: true, sparse: true },
    authProvider: { type: String, enum: ["local", "firebase", "hybrid"], default: "local" },
    bio: { type: String, trim: true, maxlength: 500, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    socialLinks: {
      website: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" }
    },
    profileImage: { url: String, publicId: String },
    profileImages: { type: [imageSchema], default: [] },
    favorites: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
    recentlyViewed: [{
      listing: { type: Schema.Types.ObjectId, ref: "Listing" },
      viewedAt: { type: Date, default: Date.now }
    }],
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: "username",
  usernameUnique: true
});

userSchema.virtual("primaryProfileImage").get(function () {
  return this.profileImage?.url || this.profileImages?.[0]?.url || "";
});

userSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("User", userSchema);
