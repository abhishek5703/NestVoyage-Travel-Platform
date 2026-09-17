import { ArrowUpRight, Compass, Heart, Instagram, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return <footer className="footer">
    <div className="footer-main">
      <div className="footer-brand-row">
        <div className="brand-mark">N</div>
        <div>
          <div className="footer-brand-name">Nest<span>Voyage</span></div>
          <p className="footer-kicker">Explore. Stay. Enjoy.</p>
        </div>
      </div>
      <p className="footer-intro">Thoughtfully designed stays, easier discovery, and a smoother way to find your next place to pause, wander, and recharge.</p>
      <div className="footer-badges">
        <span><ShieldCheck size={15}/> Protected actions</span>
        <span><Compass size={15}/> Curated discovery</span>
      </div>
    </div>

    <div className="footer-column">
      <h4>Explore</h4>
      <Link to="/listings">All stays <ArrowUpRight size={14}/></Link>
      <Link to="/listings?category=Mountain">Mountains <ArrowUpRight size={14}/></Link>
      <Link to="/listings?category=Cities">Cities <ArrowUpRight size={14}/></Link>
      <Link to="/listings?category=Camping">Camping <ArrowUpRight size={14}/></Link>
    </div>

    <div className="footer-column">
      <h4>Host</h4>
      <Link to="/listings/new">Create a listing <ArrowUpRight size={14}/></Link>
      <Link to="/dashboard">Manage listings <ArrowUpRight size={14}/></Link>
      <Link to="/profile">Your profile <ArrowUpRight size={14}/></Link>
    </div>

    <div className="footer-column">
      <h4>Company</h4>
      <a href="#">Privacy <ArrowUpRight size={14}/></a>
      <a href="#">Terms <ArrowUpRight size={14}/></a>
      <a href="mailto:hello@nestvoyage.com"><Mail size={14}/> Contact <ArrowUpRight size={14}/></a>
    </div>

    <div className="footer-bottom">
      <div>© 2026 NestVoyage Private Limited. Crafted for better stays.</div>
      <div className="footer-socials">
        <a href="#" aria-label="Instagram"><Instagram size={16}/></a>
        <a href="#" aria-label="Favorites"><Heart size={16}/></a>
      </div>
    </div>
  </footer>;
}
