import { Routes, Route } from "react-router-dom";

import Splash from "../pages/Splash/Splash";
import Onboarding from "../pages/Onboarding/Onboarding";
import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import Explore from "../pages/Explore/Explore";
import Planner from "../pages/Planner/Planner";
import Saved from "../pages/Saved/Saved";
import Profile from "../pages/Profile/Profile";
import Destination from "../pages/Destination/Destination";
import Budget from "../pages/Budget/Budget";
import Packing from "../pages/Packing/Packing";
import Signup from "../pages/Signup/Signup";  
import SplitExpense from "../pages/SplitExpense/SplitExpense";
import Leads from "../pages/Leads/Leads";

function AppRoutes() {
  return (
    
      <Routes>
        <Route path="/" element={<Splash/>}/>
        <Route path="/onboarding" element={<Onboarding/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/explore" element={<Explore/>}/>
        <Route path="/planner" element={<Planner/>}/>
        <Route path="/saved" element={<Saved/>}/>
        <Route path="/profile" element={<Profile/>}/>
        
        {/* 🎯 FIXED PARAMETER PATH: Ab dynamic routing block (/destination/1) handle hoga aur blank screen nahi aayegi */}
        <Route path="/destination/:id" element={<Destination />}/>
        
        <Route path="/budget" element={<Budget/>}/>
        <Route path="/packing" element={<Packing/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/split-expense" element={<SplitExpense/>}/>  
        <Route path="/leads" element={<Leads/>}/>
      </Routes>
  );
}

export default AppRoutes;