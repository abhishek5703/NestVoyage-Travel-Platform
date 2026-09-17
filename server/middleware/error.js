function notFound(req, res, next) {
  const err = new Error("Route not found");
  err.statusCode = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  const message = process.env.NODE_ENV === "production" && status >= 500
    ? "Something went wrong."
    : err.message || "Something went wrong.";
  if (res.headersSent) return next(err);
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
