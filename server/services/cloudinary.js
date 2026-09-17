const { cloudinary } = require("../config/cloudinary");

async function destroyMany(items = []) {
  const ids = items.map(x => x?.publicId || x?.filename).filter(Boolean);
  if (!ids.length) return;
  await Promise.allSettled(ids.map(id => cloudinary.uploader.destroy(id)));
}

module.exports = { destroyMany };
