import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import toast from "react-hot-toast";

const categories=["Trending","Rooms","Cities","Mountain","Pools","Camping","Farms","Arctic","Domes","Boats","Hills","Temples"];

export default function ListingForm({edit=false}) {
  const {id}=useParams(); const navigate=useNavigate(); const [loading,setLoading]=useState(edit); const [saving,setSaving]=useState(false); const [files,setFiles]=useState([]); const [existing,setExisting]=useState([]);
  const [form,setForm]=useState({title:"",description:"",price:"",location:"",country:"",category:[],contact:{name:"",email:"",phone:""}});
  const fileRef=useRef();

  useEffect(()=>{if(edit) http.get(`/listings/${id}`).then(({data})=>{const l=data.listing;setForm({title:l.title,description:l.description,price:l.price,location:l.location,country:l.country,category:l.category||[],contact:l.contact||{}});setExisting(l.imageItems||[]);}).finally(()=>setLoading(false));},[edit,id]);

  const toggleCat=c=>setForm(f=>({...f,category:f.category.includes(c)?f.category.filter(x=>x!==c):[...f.category,c]}));
  const submit=async e=>{e.preventDefault();if(!form.category.length)return toast.error("Select at least one category.");setSaving(true);try{const fd=new FormData();fd.append("listing",JSON.stringify(form));files.forEach(f=>fd.append("images",f));const res=edit?await http.put(`/listings/${id}`,fd):await http.post("/listings",fd);toast.success(edit?"Listing updated.":"Listing created.");navigate(`/listings/${res.data.listing._id}`);}catch(err){toast.error(err.response?.data?.message||"Could not save listing.");}finally{setSaving(false);}};
  if(loading)return <div className="page-loader"><div className="spinner"/></div>;

  return <div className="page form-page"><div className="form-header"><p className="eyebrow">{edit?"Manage stay":"Become a host"}</p><h1>{edit?"Edit your listing":"Create a listing people remember"}</h1><p className="muted">All dynamic listing data is saved in MongoDB; images use Cloudinary.</p></div>
    <form className="surface-form" onSubmit={submit}>
      <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label>
      <label>Description<textarea rows="5" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/></label>
      <div className="form-grid"><label>Price per night (₹)<input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label><label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} required/></label><label>Country<input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} required/></label></div>
      <div><label>Categories</label><div className="check-grid">{categories.map(c=><button type="button" key={c} className={`check-pill ${form.category.includes(c)?"selected":""}`} onClick={()=>toggleCat(c)}>{c}</button>)}</div></div>
      <div className="upload-box" onClick={()=>fileRef.current?.click()}><ImagePlus/><strong>Add listing images</strong><span>Up to 8 images · JPG, PNG, WEBP · 8MB each</span><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e=>setFiles([...e.target.files])}/></div>
      <div className="preview-row">{(edit?existing:[]).map(x=><img key={x.url} src={x.url} alt="Existing listing"/>) }{files.map(f=><img key={f.name} src={URL.createObjectURL(f)} alt="Preview"/>)}</div>
      <div className="form-grid"><label>Contact name<input value={form.contact.name} onChange={e=>setForm({...form,contact:{...form.contact,name:e.target.value}})} required/></label><label>Contact email<input type="email" value={form.contact.email} onChange={e=>setForm({...form,contact:{...form.contact,email:e.target.value}})} required/></label><label>Contact phone<input value={form.contact.phone} onChange={e=>setForm({...form,contact:{...form.contact,phone:e.target.value}})} pattern="[0-9+\\-\\s()]{7,30}" required/></label></div>
      <div className="form-actions"><button type="button" className="btn ghost" onClick={()=>navigate(-1)}>Cancel</button><button className="btn primary" disabled={saving}>{saving?"Saving...":edit?"Save changes":"Publish listing"}</button></div>
    </form>
  </div>;
}
