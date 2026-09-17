import { Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import http from "../api/http";
import toast from "react-hot-toast";

export default function ListingCard({ listing, favoriteIds = [], onFavoriteChange }) {
  const { user } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);
  const favorite = favoriteIds.includes(String(listing._id));
  const coverImage = listing.coverImage || listing.images?.[0]?.url || listing.image?.url || (typeof listing.image === "string" ? listing.image : "");
  const imageSrc = imageFailed ? "" : coverImage;

  const toggleFavorite = async e => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Please log in to save favorites.");
    try {
      if (favorite) await http.delete(`/listings/${listing._id}/favorite`);
      else await http.post(`/listings/${listing._id}/favorite`);
      onFavoriteChange?.(listing._id, !favorite);
    } catch (err) { toast.error(err.response?.data?.message || "Could not update favorites."); }
  };

  return <Link to={`/listings/${listing._id}`} className="listing-card-link">
    <article className="listing-card">
      <div className="listing-image-wrap">
        {imageSrc
          ? <img src={imageSrc} alt={listing.title} loading="lazy" onError={() => setImageFailed(true)} />
          : <div className="image-placeholder">No image</div>}
        <button aria-label={favorite ? "Remove from favorites" : "Add to favorites"} className={`heart-btn ${favorite ? "active" : ""}`} onClick={toggleFavorite}>
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <h3>{listing.title}</h3>
          <span className="price">₹{Number(listing.price).toLocaleString("en-IN")}<small>/night</small></span>
        </div>
        <p className="muted"><MapPin size={15}/> {listing.location}, {listing.country}</p>
        <div className="tag-row">{(listing.category || []).slice(0,3).map(c => <span key={c} className="tag">{c}</span>)}</div>
        {(listing.reviewCount || listing.rating) ? <div className="rating-line"><Star size={15} fill="currentColor"/> {listing.rating || "New"} {listing.reviewCount ? `· ${listing.reviewCount} reviews` : ""}</div> : null}
      </div>
    </article>
  </Link>;
}
