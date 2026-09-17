import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetails from "./pages/ListingDetails";
import { Login, Signup } from "./pages/Auth";
import ListingForm from "./pages/ListingForm";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import ForgotPassword from "./pages/ForgotPassword";
import TripPlanner from "./pages/TripPlanner";

export default function App() {
 return <BrowserRouter><Layout><Routes>
   <Route path="/" element={<Home/>}/>
   <Route path="/listings" element={<Listings/>}/>
   <Route path="/listings/new" element={<ProtectedRoute><ListingForm/></ProtectedRoute>}/>
   <Route path="/listings/:id/edit" element={<ProtectedRoute><ListingForm edit/></ProtectedRoute>}/>
   <Route path="/listings/:id" element={<ListingDetails/>}/>
   <Route path="/login" element={<Login/>}/>
   <Route path="/signup" element={<Signup/>}/>
   <Route path="/forgot-password" element={<ForgotPassword/>}/>
   <Route path="/trip-planner" element={<ProtectedRoute><TripPlanner /></ProtectedRoute>}/>
   <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
   <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
   <Route path="/favorites" element={<ProtectedRoute><Favorites/></ProtectedRoute>}/>
   <Route path="/404" element={<div className="page"><div className="empty-state"><h1>Page not found</h1></div></div>}/>
   <Route path="*" element={<Navigate to="/404" replace/>}/>
 </Routes></Layout><Toaster position="top-right"/></BrowserRouter>;
}
