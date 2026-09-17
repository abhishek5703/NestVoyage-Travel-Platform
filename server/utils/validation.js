const Joi = require("joi");

const listingJoi = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(4000).allow("").default(""),
  price: Joi.number().min(0).required(),
  location: Joi.string().trim().min(1).max(120).required(),
  country: Joi.string().trim().min(1).max(120).required(),
  category: Joi.array().items(Joi.string().valid(
    "Mountain", "Cities", "Camping", "Pools", "Rooms",
    "Boats", "Farms", "Hills", "Temples", "Trending", "Arctic", "Domes"
  )).min(1).required(),
  contact: Joi.object({
    name: Joi.string().trim().max(120).allow(""),
    email: Joi.string().email({ tlds: { allow: false } }).allow(""),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{7,30}$/).allow("")
  }).default({})
});

const reviewJoi = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().min(1).max(1500).required()
});

module.exports = { listingJoi, reviewJoi };
