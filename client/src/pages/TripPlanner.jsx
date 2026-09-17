const isDevelopment = import.meta.env.DEV;
import { useMemo, useState } from "react";
import { CalendarDays, Car, ChevronDown, Coffee, Compass, LoaderCircle, MapPin, Sparkles, Users, WalletCards } from "lucide-react";
import http from "../api/http";
import toast from "react-hot-toast";

const interestOptions = ["Nature", "Beaches", "Food", "Culture", "Adventure", "Nightlife", "Shopping", "Photography"];

export default function TripPlanner() {
  const [form, setForm] = useState({
    destination: "",
    days: 3,
    travelers: 2,
    budget: "₹25,000",
    style: "Balanced",
    pace: "Comfortable",
    transport: "Public transport / cabs",
    interests: ["Food", "Culture"]
  });
  const [provider, setProvider] = useState("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleInterest = value => setForm(prev => ({
    ...prev,
    interests: prev.interests.includes(value)
      ? prev.interests.filter(x => x !== value)
      : [...prev.interests, value]
  }));

  const generate = async e => {
    e.preventDefault();
    if (!form.destination.trim()) return toast.error("Enter a destination first.");
    setLoading(true);
    try {
      const selectedProvider =
        isDevelopment ? provider : "gemini";

      const { data } = await http.post(
        "/ai/trip-planner",
        {
          ...form,
          provider: selectedProvider
        }
      );
      setResult(data.itinerary);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(
        `${selectedProvider === "ollama"
          ? "Ollama"
          : "Gemini"
        } created your itinerary.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.hint || "Unable to generate the itinerary.");
    } finally { setLoading(false); }
  };

  const dayCount = useMemo(() => result?.days?.length || 0, [result]);

  return <div className="page trip-page">
    <div className="trip-hero">
      <div>
        <div className="eyebrow"><Sparkles size={16} /> NestVoyage AI</div>
        <h1>Build a trip that fits <em>you.</em></h1>
        <p>Tell us where you're going, how you want to travel, and what you enjoy. Generate with Gemini or keep everything local with Ollama.</p>
      </div>
      {isDevelopment && (
        <div className="ai-provider-card">
          <div className="provider-icon">
            <Sparkles size={18} />
          </div>

          <div>
            <strong>Choose your AI</strong>

            <span>
              {provider === "gemini"
                ? "Gemini cloud generation"
                : "Ollama on your computer"}
            </span>
          </div>

          <select
            value={provider}
            onChange={e =>
              setProvider(e.target.value)
            }
          >
            <option value="gemini">
              Gemini API
            </option>

            <option value="ollama">
              Ollama Local
            </option>
          </select>
        </div>
      )}
    </div>

    <div className="trip-layout">
      <form className="trip-form surface-form" onSubmit={generate}>
        <div className="trip-form-head"><div><p className="eyebrow">Trip preferences</p><h2>Plan your getaway</h2></div><span className="ai-pill"><Sparkles size={14} /> AI</span></div>

        <label className="trip-field full-field"><span><MapPin size={16} /> Destination</span><input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Goa, Manali, Jaipur" required /></label>

        <div className="trip-fields-grid">
          <label className="trip-field"><span><CalendarDays size={16} /> Days</span><input type="number" min="1" max="14" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} /></label>
          <label className="trip-field"><span><Users size={16} /> Travelers</span><input type="number" min="1" max="20" value={form.travelers} onChange={e => setForm({ ...form, travelers: e.target.value })} /></label>
          <label className="trip-field"><span><WalletCards size={16} /> Budget</span><input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="₹25,000" /></label>
          <label className="trip-field"><span>Travel style</span><select value={form.style} onChange={e => setForm({ ...form, style: e.target.value })}><option>Balanced</option><option>Budget</option><option>Luxury</option><option>Backpacking</option><option>Family</option><option>Couple</option></select></label>
          <label className="trip-field"><span>Pace</span><select value={form.pace} onChange={e => setForm({ ...form, pace: e.target.value })}><option>Relaxed</option><option>Comfortable</option><option>Busy</option></select></label>
          <label className="trip-field"><span><Car size={16} /> Transport</span><select value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value })}><option>Public transport / cabs</option><option>Rental car</option><option>Walking + public transport</option><option>Mixed</option></select></label>
        </div>

        <div className="trip-interest"><div className="trip-interest-head"><span>Interests</span><small>Select any that matter to you</small></div><div className="interest-chips">{interestOptions.map(option => <button type="button" key={option} className={form.interests.includes(option) ? "selected" : ""} onClick={() => toggleInterest(option)}>{option}</button>)}</div></div>

        <button className="btn primary full ai-generate-btn" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={18} /> Generating your plan...</> : <><Sparkles size={18} /> Generate {provider === "ollama" ? "local" : "Gemini"} itinerary</>}</button>
        <p className="trip-disclaimer">AI-generated travel ideas can contain outdated details. Verify opening hours, prices, travel times, local restrictions, and availability before making plans.</p>
      </form>

      <aside className="trip-side-card"><Compass size={22} /><h3>Why use AI here?</h3><p>Gemini is convenient for cloud generation. Ollama keeps generation local when you want a no-cloud workflow.</p><div className="side-row"><span>Days</span><strong>{form.days}</strong></div><div className="side-row"><span>Travelers</span><strong>{form.travelers}</strong></div><div className="side-row"><span>Interests</span><strong>{form.interests.length}</strong></div></aside>
    </div>

    {result && <section className="trip-result">
      <div className="trip-result-head"><div><p className="eyebrow">Your plan</p><h2>{result.title}</h2><p className="muted">{result.summary}</p></div><span className="provider-result">{provider === "ollama" ? "Ollama Local" : "Gemini API"}</span></div>
      <div className="budget-note"><WalletCards size={18} /><span>{result.budgetNote}</span></div>
      <div className="trip-days">{result.days.map(day => <article className="trip-day-card" key={day.day}><div className="day-badge">Day {day.day}</div><h3>{day.title}</h3><div className="day-sections"><DaySection title="Morning" items={day.morning} /><DaySection title="Afternoon" items={day.afternoon} /><DaySection title="Evening" items={day.evening} /><DaySection title="Food" items={day.food} icon={<Coffee size={15} />} /></div><div className="transport-tip"><strong>Transport:</strong> {day.transport}</div>{day.tips?.length > 0 && <div className="day-tips"><strong>Tips</strong>{day.tips.map(t => <span key={t}>• {t}</span>)}</div>}</article>)}</div>
      {result.packing?.length > 0 && <div className="trip-extra-grid"><div><h3>Packing ideas</h3>{result.packing.map(x => <span key={x}>• {x}</span>)}</div><div><h3>General tips</h3>{result.generalTips.map(x => <span key={x}>• {x}</span>)}</div></div>}
      <p className="trip-result-foot">Generated for {dayCount} days. Re-check live details before traveling.</p>
    </section>}
  </div>;
}

function DaySection({ title, items, icon }) {
  if (!items?.length) return null;
  return <div className="day-section"><h4>{icon}{title}</h4>{items.map(item => <p key={item}>{item}</p>)}</div>;
}
