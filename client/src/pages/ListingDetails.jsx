import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MapPin, Share2, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import toast from "react-hot-toast";
import { PageLoader } from "../components/Loading";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [active, setActive] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await http.get(`/listings/${id}`);
    setListing(data.listing);
  };

  useEffect(() => {
    load().catch(() => navigate("/404"));
    if (user) http.post(`/listings/${id}/view`).catch(()=>{});
  }, [id, user]);

  const images = listing?.imageItems || [];
  const isOwner = user && listing && String(user._id) === String(listing.owner?._id);

  const deleteListing = async () => {
    if (!confirm("Delete this listing permanently?")) return;
    await http.delete(`/listings/${id}`);
    toast.success("Listing deleted.");
    navigate("/listings");
  };

  const submitReview = async e => {
    e.preventDefault();
    try {
      await http.post(`/listings/${id}/reviews`, review);
      setReview({rating:5,comment:""});
      await load();
      toast.success("Review added.");
    } catch(err) { toast.error(err.response?.data?.message || "Unable to add review."); }
  };

  const deleteReview = async reviewId => {
    if (!confirm("Delete this review?")) return;
    try { await http.delete(`/listings/${id}/reviews/${reviewId}`); await load(); toast.success("Review deleted."); }
    catch(err) { toast.error(err.response?.data?.message || "Unable to delete review."); }
  };

  if (!listing) return <PageLoader/>;

  const gallery = images.length ? images : [{url: listing.coverImage}];

  return <div className="page detail-page">
    <Link className="back-link" to="/listings"><ArrowLeft size={16}/> Back to explore</Link>
    <div className="gallery">
      <div className="gallery-main"><img src={gallery[active].url} alt={listing.title}/><button className="gallery-btn left" onClick={()=>setActive((active-1+gallery.length)%gallery.length)}><ChevronLeft/></button><button className="gallery-btn right" onClick={()=>setActive((active+1)%gallery.length)}><ChevronRight/></button></div>
      <div className="gallery-thumbs">{gallery.map((img,i)=><button className={i===active?"selected":""} key={img.url+i} onClick={()=>setActive(i)}><img src={img.url} alt={`View ${i+1}`}/></button>)}</div>
    </div>

    <div className="detail-grid">
      <article>
        <div className="detail-title-row"><div><div className="tag-row">{(listing.category||[]).map(c=><span key={c} className="tag">{c}</span>)}</div><h1>{listing.title}</h1><p className="muted"><MapPin size={17}/> {listing.location}, {listing.country}</p></div><div className="detail-actions"><button className="icon-btn" onClick={()=>navigator.clipboard?.writeText(window.location.href).then(()=>toast.success("Link copied."))}><Share2/></button>{isOwner && <><Link className="icon-btn" to={`/listings/${id}/edit`}>✎</Link><button className="icon-btn danger" onClick={deleteListing}><Trash2/></button></>}</div></div>
        <p className="detail-description">{listing.description}</p>

        <div className="host-card"><Avatar user={listing.owner} size="lg"/><div><p className="muted">Hosted by</p><h3>{listing.owner?.username}</h3><p className="muted">{listing.owner?.email}</p></div></div>

        {listing.contact?.name && <div className="info-card"><h3>Contact the owner</h3><p><strong>{listing.contact.name}</strong></p><p>{listing.contact.email}</p><p>{listing.contact.phone}</p></div>}

        <section className="reviews-section"><div className="section-heading"><div><p className="eyebrow">Community feedback</p><h2>Reviews</h2></div><div className="rating-summary"><Star size={18} fill="currentColor"/> {listing.reviews?.length || 0}</div></div>
          {user && <form className="review-form" onSubmit={submitReview}><label>Rating<select value={review.rating} onChange={e=>setReview({...review,rating:Number(e.target.value)})}><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><textarea required value={review.comment} onChange={e=>setReview({...review,comment:e.target.value})} placeholder="Share your experience..."/><button className="btn primary">Submit review</button></form>}
          <div className="review-list">{(listing.reviews||[]).map(r=><div className="review-card" key={r._id}><div className="review-head"><div className="profile-inline"><Avatar user={r.author}/><strong>{r.author?.username}</strong></div><span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span></div><div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div><p>{r.comment}</p>{user && (String(user._id)===String(r.author?._id) || isOwner) && <button className="text-danger" onClick={()=>deleteReview(r._id)}>Delete review</button>}</div>)}</div>
          {!listing.reviews?.length && <div className="empty-state compact"><p>No reviews yet.</p></div>}
        </section>
      </article>

      <aside className="price-card"><span className="muted">From</span><div className="big-price">₹{Number(listing.price).toLocaleString("en-IN")} <small>/ night</small></div><p className="muted">Contact the owner for booking inquiries.</p><a className="btn primary full" href={listing.contact?.email ? `mailto:${listing.contact.email}` : `#`}>{listing.contact?.email ? "Contact owner" : "View details"}</a></aside>
    </div>
  </div>;
}
