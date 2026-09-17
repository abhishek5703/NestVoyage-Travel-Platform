import { BarChart3, Heart, Home, Plus, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import ListingCard from "../components/ListingCard";

export default function Dashboard() {
  const [dash,setDash]=useState({stats:{},recentListings:[]}); const [recommendations,setRecommendations]=useState([]);
  useEffect(()=>{Promise.all([http.get("/users/me/dashboard"),http.get("/users/me/recommendations")]).then(([a,b])=>{setDash(a.data);setRecommendations(b.data.listings);})},[]);
  return <div className="page"><div className="page-head"><div><p className="eyebrow">Your space</p><h1>Dashboard</h1><p className="muted">Live statistics and marketplace activity from your account.</p></div><Link to="/listings/new" className="btn primary"><Plus size={16}/> New listing</Link></div>
    <div className="stat-grid">{[[Home,"Listings",dash.stats.totalListings||0],[Star,"Reviews received",dash.stats.totalReviewsReceived||0],[BarChart3,"Reviews written",dash.stats.totalReviewsWritten||0],[Sparkles,"Average rating",dash.stats.averageRating||0]].map(([Icon,label,value])=><div className="stat-card" key={label}><Icon/><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="section"><div className="section-heading"><div><p className="eyebrow">Host area</p><h2>Recent listings</h2></div><Link to="/listings/new">Add another <Plus size={16}/></Link></div><div className="listing-grid">{dash.recentListings.map(l=><ListingCard key={l._id} listing={{...l,coverImage:l.images?.[0]?.url||l.image?.url||""}}/>)}</div></div>
    <div className="section"><div className="section-heading"><div><p className="eyebrow">Smart discovery</p><h2>Recommended for you</h2></div><Sparkles size={20}/></div><div className="listing-grid">{recommendations.map(l=><ListingCard key={l._id} listing={{...l,coverImage:l.images?.[0]?.url||l.image?.url}}/>)}</div></div>
  </div>;
}
