import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck, ShieldCheck, KeyRound } from "lucide-react";
import http from "../api/http";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { firebaseConfigured } = useAuth();

  const requestOtp = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await http.post("/auth/request-password-reset", { email });
      setStep(2);
      toast.success("Check your email for the 6-digit code.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send OTP.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await http.post("/auth/verify-password-otp", { email, otp });
      setResetToken(data.resetToken);
      setStep(3);
      toast.success("OTP verified.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      await http.post("/auth/reset-password", { email, resetToken, newPassword: password });
      toast.success("Password updated. You can log in now.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to reset password.");
    } finally { setLoading(false); }
  };

  return <div className="auth-page single-auth-page">
    <div className="auth-panel full-panel">
      <div className="auth-card reset-card">
        <Link to="/login" className="back-link"><ArrowLeft size={16}/> Back to login</Link>
        <p className="eyebrow"><ShieldCheck size={15}/> Secure account recovery</p>
        <h1>Forgot password?</h1>
        <p className="muted">Recover your NestVoyage account with an email OTP, then set a new password.</p>

        <div className="reset-steps"><div className={step >= 1 ? "active" : ""}><MailCheck size={17}/><span>Email</span></div><div className={step >= 2 ? "active" : ""}><KeyRound size={17}/><span>OTP</span></div><div className={step >= 3 ? "active" : ""}><ShieldCheck size={17}/><span>Password</span></div></div>

        {step === 1 && <form className="auth-form" onSubmit={requestOtp}>
          <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
          <button className="btn primary full" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
        </form>}

        {step === 2 && <form className="auth-form" onSubmit={verifyOtp}>
          <label>6-digit OTP<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="123456" required/></label>
          <button className="btn primary full" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
          <button type="button" className="btn ghost full" disabled={loading} onClick={()=>setStep(1)}>Use a different email</button>
        </form>}

        {step === 3 && <form className="auth-form" onSubmit={resetPassword}>
          <label>New password<input type="password" minLength="8" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="At least 8 characters"/></label>
          <label>Confirm password<input type="password" minLength="8" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Repeat your new password"/></label>
          <button className="btn primary full" disabled={loading}>{loading ? "Updating..." : "Reset password"}</button>
        </form>}

        <p className="auth-info"><strong>Free setup:</strong> Firebase handles new-account email verification. Password-reset OTPs are sent through the SMTP account you configure on your server; Gmail App Passwords can be used without a paid email service. {firebaseConfigured ? "" : "Firebase is currently not configured in this browser."}</p>
      </div>
    </div>
  </div>;
}
