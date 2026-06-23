import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// 🔥 NAYE IMPORTS DATABASE KE LIYE
import { db } from "../../firebase/config"; 
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); 

  const navigate = useNavigate();
  const auth = getAuth(); 

  const sendWelcomeEmail = (userEmail, userName) => {
    console.log(`Simulated: Welcome Email sent to ${userEmail}`);
  };

  // 📝 1. EMAIL & PASSWORD SIGNUP (UPDATED WITH FIRESTORE)
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 🔥 Validation me phone number bhi add kiya hai
    if (!name.trim() || !email.trim() || !password.trim() || !phoneNumber.trim()) {
      setError("All fields are mandatory, including mobile number!");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email format!");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // 1. Firebase Auth me account create kiya
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      // 2. Auth Profile me Name update kiya
      await updateProfile(user, {
        displayName: name.trim()
      });

      // 🔥 3. DATABASE (FIRESTORE) MEIN USER DATA SAVE KARNA
      const fullPhoneString = `${countryCode}${phoneNumber}`; // +919876543210

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: email.trim(),
        countryCode: countryCode,
        number: phoneNumber,
        phoneNumber: fullPhoneString, // Combined field
        isPhoneVerified: false,
        role: "User", // Default role
        profileImage: "",
        completedTrips: 0,
        savedRoutes: 0,
        likedPlaces: [],
        createdAt: new Date().toISOString()
      });

      sendWelcomeEmail(user.email, name.trim());
      navigate("/home");
      
    } catch (err) {
      console.error("Signup Error:", err.code);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please log in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === 'auth/invalid-email') {
        setError("The email address is not valid.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 2. GOOGLE SIGNUP
  const handleGoogleAuth = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // 🔥 YE LINE SABSE ZAROORI HAI 🔥
    // Ye Google ko force karegi ki wo har baar account choose karne ka popup dikhaye
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Database mein check kar rahe hain
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Agar user ekdum NAYA hai (Database mein pehli baar aaya hai)
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        phoneNumber: "", // Ekdum khali field jayegi, koi 987... nahi!
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLogin: new Date()
      });
    } else {
      // Agar user pehle se database mein hai, toh sirf lastLogin time update karo
      // Note: Agar pichli kisi error ki wajah se 987 number yahan pehle se save ho chuka tha,
      // toh wo yahan se overwrite nahi hoga. Wo aapko Firebase se delete karna hoga.
      await setDoc(userDocRef, { 
        lastLogin: new Date() 
      }, { merge: true });
    }

    alert("Google Sign-In Successful! 🎉");
    navigate("/home"); 

  } catch (error) {
    console.error("Google Auth Error:", error);
    alert("Google Sign-In Failed: " + error.message);
  }
};
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center px-5 py-6 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[35px] shadow-2xl p-8">
        <div className="text-center">
          <div className="text-5xl mb-3">🎒</div>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-400 text-sm mt-2">Start your custom real-world journey</p>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-500 text-xs p-3 rounded-xl text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="font-semibold text-gray-700 text-xs">Full Name</label>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 mt-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <FaUser className="text-gray-400" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="w-full bg-transparent p-4 outline-none text-xs" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">
              Mobile Number
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-50 transition-all overflow-hidden">
              
              {/* Country Code Select */}
              <select 
                value={countryCode} 
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-slate-100/50 border-r border-slate-200 px-3 py-3 text-xs font-black text-slate-600 outline-none cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <option value="+91">🇮🇳 +91 </option>
                <option value="+1">🇺🇸 +1 </option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61 </option>
                <option value="+971">🇦🇪 +971 </option>
                <option value="+65">🇸🇬 +65 </option>
              </select>

              {/* Phone Number Input */}
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                placeholder="Enter your number"
                className="w-full bg-transparent px-3 py-3 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300 placeholder:font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 text-xs">Email</label>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 mt-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <FaEnvelope className="text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@example.com" className="w-full bg-transparent p-4 outline-none text-xs" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 text-xs">Password</label>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 mt-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <FaLock className="text-gray-400" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" className="w-full bg-transparent p-4 outline-none text-xs" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Signup Button */}
        <button 
          type="button" 
          onClick={handleRegister} 
          disabled={isLoading}
          className={`w-full text-white py-4 rounded-xl font-semibold mt-6 transition shadow-md text-xs ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isLoading ? "Creating Account..." : "Register & Save Profile"}
        </button>

        {/* Secondary Login Button */}
        <button 
          type="button" 
          onClick={() => navigate("/login")} 
          className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-3.5 rounded-xl font-bold mt-3 transition text-xs border border-indigo-100"
        >
          Already have an account? Login
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="mx-3 text-gray-400 text-xs font-bold">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Signup Button */}
        <button 
          type="button" 
          onClick={handleGoogleAuth} 
          className="w-full border border-gray-200 rounded-xl py-4 flex items-center justify-center gap-3 hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
        >
          <FaGoogle className="text-red-500" /> Sign Up with Google
        </button>
      </div>
    </div>
  );
}