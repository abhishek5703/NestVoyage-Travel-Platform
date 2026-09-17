import { Filter, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import http from "../api/http";
import ListingCard from "../components/ListingCard";
import { SkeletonCard } from "../components/Loading";

const DEFAULT_PAGE_SIZE = 12;

export default function Listings() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({
    listings: [],
    pagination: { page: 1, limit: DEFAULT_PAGE_SIZE, pages: 1, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favIds, setFavIds] = useState([]);
  const queryString = params.toString();

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setLoading(true);
      setError("");

      const requestParams = Object.fromEntries(params.entries());
      if (!requestParams.page) requestParams.page = "1";
      if (!requestParams.limit) requestParams.limit = String(DEFAULT_PAGE_SIZE);
      if (!requestParams.sort) requestParams.sort = "newest";

      try {
        const response = await http.get("/listings", { params: requestParams });
        if (cancelled) return;

        setData({
          listings: Array.isArray(response.data?.listings) ? response.data.listings : [],
          pagination: response.data?.pagination || {
            page: Number(requestParams.page) || 1,
            limit: DEFAULT_PAGE_SIZE,
            pages: 1,
            total: 0
          }
        });
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Could not load listings. Please try again.");
        setData({
          listings: [],
          pagination: {
            page: Number(requestParams.page) || 1,
            limit: DEFAULT_PAGE_SIZE,
            pages: 1,
            total: 0
          }
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadListings();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const update = (key, value, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    const normalized = String(value ?? "").trim();

    if (normalized) next.set(key, value);
    else next.delete(key);

    if (resetPage) next.set("page", "1");
    setParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("page", "1");
    next.set("sort", "newest");
    setParams(next);
  };

  const changePage = page => {
    const totalPages = Number(data.pagination.pages) || 1;
    const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    const next = new URLSearchParams(params);
    next.set("page", String(safePage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCount = ["category", "location", "minPrice", "maxPrice", "search"]
    .filter(key => params.get(key))
    .length;

  const favoriteChange = (id, on) =>
    setFavIds(current =>
      on
        ? [...new Set([...current, String(id)])]
        : current.filter(value => value !== String(id))
    );

  const total = Number(data.pagination.total) || 0;
  const currentPage = Number(data.pagination.page) || 1;
  const totalPages = Number(data.pagination.pages) || 1;

  return (
    <div className="page listings-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Discover</p>
          <h1>Explore stays</h1>
          <p className="muted">
            {total} result{total === 1 ? "" : "s"}
          </p>
        </div>
        <button className="btn secondary" type="button">
          <SlidersHorizontal size={17} />
          {activeCount ? `${activeCount} filters` : "Filters"}
        </button>
      </div>

      <div className="filter-bar">
        <input
          value={params.get("search") || ""}
          onChange={e => update("search", e.target.value)}
          placeholder="Search destination, stay, or category"
        />
        <input
          value={params.get("location") || ""}
          onChange={e => update("location", e.target.value)}
          placeholder="Location"
        />
        <input
          type="number"
          min="0"
          value={params.get("minPrice") || ""}
          onChange={e => update("minPrice", e.target.value)}
          placeholder="Min ₹"
        />
        <input
          type="number"
          min="0"
          value={params.get("maxPrice") || ""}
          onChange={e => update("maxPrice", e.target.value)}
          placeholder="Max ₹"
        />
        <select
          value={params.get("sort") || "newest"}
          onChange={e => update("sort", e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Rating</option>
          <option value="popular">Popular</option>
        </select>
        {activeCount > 0 && (
          <button className="btn ghost" type="button" onClick={clearFilters}>
            <Filter size={16} />
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="empty-state error-state">
          <h3>Could not load stays</h3>
          <p>{error}</p>
          <button
            className="btn secondary"
            type="button"
            onClick={() => setParams(new URLSearchParams(params))}
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="listing-grid">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : data.listings.map(listing => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    favoriteIds={favIds}
                    onFavoriteChange={favoriteChange}
                  />
                ))}
          </div>

          {!loading && !data.listings.length && (
            <div className="empty-state">
              <h3>No stays found</h3>
              <p>
                {activeCount
                  ? "Try a different keyword, location, category, or price range."
                  : "There are no listings available yet."}
              </p>
              {activeCount > 0 && (
                <button className="btn secondary" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination" aria-label="Listings pagination">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => changePage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => changePage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
