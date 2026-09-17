import { useEffect, useState } from "react";
import http from "../api/http";
import ListingCard from "../components/ListingCard";

export default function Favorites() {
 const [items,setItems]=useState([]);
 useEffect(()=>{http.get("/users/me/favorites").then(({data})=>setItems(data.listings||[]))},[]);
 return <div className="page"><div className="page-head"><div><p className="eyebrow">Saved stays</p><h1>Favorites</h1></div></div>{items.length?<div className="listing-grid">{items.map(l=><ListingCard key={l._id} listing={{...l,coverImage:l.images?.[0]?.url||l.image?.url}} favoriteIds={items.map(x=>String(x._id))} onFavoriteChange={(id,on)=>{if(!on)setItems(x=>x.filter(v=>String(v._id)!==String(id)))}}/>)}</div>:<div className="empty-state"><h3>No favorites yet</h3><p>Use the heart on any listing to save it here.</p></div>}</div>;
}
