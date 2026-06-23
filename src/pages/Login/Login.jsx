import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
// 🔥 Firebase Auth Imports
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Button disable karne ke liye state
  
  const navigate = useNavigate();
  const auth = getAuth(); // Firebase Auth Instance

  // 📧 1. EMAIL & PASSWORD LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Empty Check
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields!");
      return;
    }

    // 2. Strict Email Format Check (Regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address (e.g. name@domain.com)!");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // 🚀 REAL FIREBASE LOGIN
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      navigate("/home"); // Successful login ke baad home par
    } catch (err) {
      console.error(err);
      setError("Invalid Email or Password! Please try again."); // User friendly error
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
  if (!email) {
    alert("Please enter your email first!");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent! Check your inbox or Spam Folder.");
  } catch (error) {
    alert(error.message);
  }
};

  // 🚀 2. GOOGLE LOGIN
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
    <div className="min-h-screen bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center px-5 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[35px] shadow-2xl p-8">
        
        <div className="text-center">
          <div className="text-5xl mb-3">✈️</div>
          <h1 className="text-3xl font-bold">PlotMyPath</h1>
          <p className="text-gray-500 mt-2">Welcome Back 👋</p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-500 text-xs p-3 rounded-xl font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
          <div>
            <label className="font-semibold text-gray-700 text-xs">Email</label>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 mt-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <FaEnvelope className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full bg-transparent p-4 outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 text-xs">Password</label>
            <div className="flex items-center bg-gray-100 rounded-xl px-4 mt-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <FaLock className="text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-transparent p-4 outline-none text-xs"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex justify-end w-full mt-1">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer bg-transparent border-none outline-none"
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-xl font-semibold mt-6 transition shadow-md text-xs ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="mx-3 text-gray-400 text-sm font-bold">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleAuth}
          className="w-full border border-gray-200 rounded-xl py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition text-xs font-bold text-gray-700"
        >
          <FaGoogle className="text-red-500" /> Continue with Google
        </button>

        <p className="text-center mt-8 text-gray-500 text-xs">
          Don't have an account?
          <button type="button" onClick={() => navigate("/signup")} className="text-indigo-600 font-bold cursor-pointer ml-1 hover:underline bg-transparent">
            Sign Up
          </button>
        </p>

      </div>
    </div>
  );
}