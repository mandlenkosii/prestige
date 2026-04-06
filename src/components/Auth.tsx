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
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card rounded-3xl p-10 border border-white/40 relative z-10"
      >
        <div className="flex items-center justify-center mb-10">
          <div className="bg-brand-900 p-3.5 rounded-2xl shadow-lg shadow-brand-900/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold ml-4 text-brand-900 tracking-tight font-display">PrestigeCourier</h1>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-brand-800 leading-tight">Legal-Grade Document Transport</h2>
          <p className="text-brand-500 mt-3 text-sm leading-relaxed">Secure, compliant, and fully tracked messenger services for law firms.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => setRole('firm')}
            className={`flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 ${
              role === 'firm' ? 'border-brand-900 bg-brand-900 text-white shadow-lg shadow-brand-900/10' : 'border-brand-100 bg-white text-brand-400 hover:border-brand-200 hover:bg-brand-50'
            }`}
          >
            <Scale className="w-6 h-6 mb-3" />
            <span className="text-sm font-bold uppercase tracking-wider">Law Firm</span>
          </button>
          <button
            onClick={() => setRole('courier')}
            className={`flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 ${
              role === 'courier' ? 'border-brand-900 bg-brand-900 text-white shadow-lg shadow-brand-900/10' : 'border-brand-100 bg-white text-brand-400 hover:border-brand-200 hover:bg-brand-50'
            }`}
          >
            <Truck className="w-6 h-6 mb-3" />
            <span className="text-sm font-bold uppercase tracking-wider">Courier</span>
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full btn-primary py-4.5 text-lg shadow-xl shadow-brand-900/10 group"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-3 group-hover:translate-x-0.5 transition-transform" />
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-12 pt-8 border-t border-brand-100 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-[10px] font-black text-brand-900 uppercase tracking-[0.15em]">Secure</div>
            <div className="text-[10px] text-brand-400 mt-1.5 font-medium">E2E Encrypted</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-brand-900 uppercase tracking-[0.15em]">Compliant</div>
            <div className="text-[10px] text-brand-400 mt-1.5 font-medium">Full Audit Trail</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-brand-900 uppercase tracking-[0.15em]">Vetted</div>
            <div className="text-[10px] text-brand-400 mt-1.5 font-medium">Verified Agents</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
