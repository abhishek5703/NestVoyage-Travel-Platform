import { ArrowRight, Compass, ShieldCheck, Sparkles, Star, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import http from "../api/http";
import ListingCard from "../components/ListingCard";
import { SkeletonCard } from "../components/Loading";

const categories = [
  ["Mountain", "⛰️"], ["Cities", "🏙️"], ["Camping", "⛺"], ["Pools", "🏊"], ["Rooms", "🛏️"], ["Boats", "⛵"], ["Farms", "🌾"], ["Arctic", "❄️"]
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    http.get("/listings?limit=6&sort=oldest").then(({data}) => setFeatured(data.listings)).finally(() => setLoading(false));
  }, []);

  return <div>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={16}/> A smarter way to stay</div>
        <h1>Find a stay that feels like <em>yours.</em></h1>
        <p>Explore distinctive homes, cabins, city spaces, and escapes — powered by the real NestVoyage marketplace.</p>
        <form className="hero-search" action="/listings" onSubmit={e => { e.preventDefault(); window.location.href = `/listings?search=${encodeURIComponent(e.target.q.value)}`; }}>
          <Search size={22}/><input name="q" placeholder="Where do you want to go?"/><button className="btn primary">Explore</button>
        </form>
        <div className="hero-trust"><ShieldCheck size={16}/> Secure sessions · Cloudinary images · Owner-protected actions</div>
      </div>
      <div className="hero-art">
        <div className="hero-image hero-image-a"/>
        <div className="hero-image hero-image-b"/>
        <div className="floating-stat"><Star size={15} fill="currentColor"/> Real reviews from the marketplace</div>
      </div>
    </section>

    <section className="section">
      <div className="section-heading"><div><p className="eyebrow">Browse your way</p><h2>Explore categories</h2></div><Link to="/listings">See all <ArrowRight size={16}/></Link></div>
      <div className="category-grid">{categories.map(([name, icon]) => <Link key={name} className="category-tile" to={`/listings?category=${name}`}><span>{icon}</span><strong>{name}</strong></Link>)}</div>
    </section>

    <section className="section muted-section">
      <div className="section-heading"><div><p className="eyebrow">Fresh from NestVoyage</p><h2>Featured stays</h2></div><Link to="/listings">Explore all <ArrowRight size={16}/></Link></div>
      <div className="listing-grid">{loading ? Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>) : featured.map(l=><ListingCard key={l._id} listing={l}/>)}</div>
    </section>

    <section className="section benefits">
      <div><Compass/><h3>Better discovery</h3><p>Server-driven search, category filters, sorting, and recently viewed stays.</p></div>
      <div><ShieldCheck/><h3>Protected actions</h3><p>Ownership and review permissions are enforced by the API, not just the UI.</p></div>
      <div><Sparkles/><h3>Premium experience</h3><p>Responsive cards, polished states, accessible forms, and focused interactions.</p></div>
    </section>

    <section className="host-cta"><div><p className="eyebrow">Have a place to share?</p><h2>Turn your property into a NestVoyage stay.</h2><p>Create, edit, manage, and showcase your listings with Cloudinary-backed imagery.</p></div><Link className="btn light" to="/listings/new">Become a host <ArrowRight size={16}/></Link></section>
  </div>;
}
