import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import { Shield, Scale, Truck, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const [role, setRole] = useState<UserRole>('firm');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        // Create new profile
        await setDoc(profileRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Anonymous',
          role: role,
          createdAt: serverTimestamp(),
          verificationStatus: 'pending',
          firmName: role === 'firm' ? 'Legal Firm' : undefined
        });
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="bg-slate-900 p-3 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold ml-3 text-slate-900 tracking-tight">PrestigeCourier</h1>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-slate-800">Legal-Grade Document Transport</h2>
          <p className="text-slate-500 mt-2">Secure, compliant, and fully tracked messenger services for law firms.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setRole('firm')}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              role === 'firm' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-transparent bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Law Firm</span>
          </button>
          <button
            onClick={() => setRole('courier')}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              role === 'courier' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-transparent bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Courier</span>
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Secure</div>
            <div className="text-[10px] text-slate-400 mt-1">E2E Encrypted</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Compliant</div>
            <div className="text-[10px] text-slate-400 mt-1">Full Audit Trail</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Vetted</div>
            <div className="text-[10px] text-slate-400 mt-1">Verified Agents</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
