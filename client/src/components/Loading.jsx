export function SkeletonCard() {
  return <div className="listing-card skeleton-card"><div className="skeleton skeleton-image"/><div className="card-body"><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line short"/><div className="skeleton skeleton-line"/></div></div>;
}

export function PageLoader() {
  return <div className="page-loader"><div className="spinner"/></div>;
}
