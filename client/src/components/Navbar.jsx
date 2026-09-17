import { Heart, Home as HomeIcon, LayoutDashboard, LogIn, LogOut, Menu, Plus, Search, X, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = e => {
    e.preventDefault();
    navigate(`/listings?search=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  const closeMenu = () => setOpen(false);

  return <header className="navbar">
    <Link className="brand" to="/">
      <div className="brand-mark">N</div>
      <div><strong>Nest<span>Voyage</span></strong><small>Explore. Stay. Enjoy.</small></div>
    </Link>

    <form className="nav-search" onSubmit={submit}>
      <Search size={18}/>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search destinations, stays, or categories..." aria-label="Search listings"/>
    </form>

    <nav className={`nav-links ${open ? "open" : ""}`}>
      <Link to="/" onClick={closeMenu}><HomeIcon size={17}/>Home</Link>
      <Link to="/listings" onClick={closeMenu}>Explore</Link>
      <Link to="/trip-planner" onClick={closeMenu}><Sparkles size={17}/> AI Planner</Link>
      {user && <Link to="/dashboard" onClick={closeMenu}><LayoutDashboard size={17}/>Dashboard</Link>}
      {user && <Link to="/listings/new" onClick={closeMenu}><Plus size={17}/>Become a host</Link>}
      {user ? <>
        <Link to="/favorites" onClick={closeMenu}><Heart size={17}/>Saved</Link>
        <Link className="profile-link" to="/profile" onClick={closeMenu}><Avatar user={user}/><span>{user.username}</span></Link>
        <button className="icon-btn" onClick={() => { logout(); closeMenu(); }} title="Log out"><LogOut size={18}/></button>
      </> : <>
        <Link to="/login" onClick={closeMenu}><LogIn size={17}/>Log in</Link>
        <Link className="btn primary compact" to="/signup" onClick={closeMenu}>Sign up</Link>
      </>}
    </nav>

    <button className="mobile-menu" aria-label="Menu" onClick={() => setOpen(x => !x)}>{open ? <X/> : <Menu/>}</button>
  </header>;
}
