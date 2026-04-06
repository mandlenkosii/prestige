import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { Shield } from 'lucide-react';
import { UserProfile } from './types';

const GUEST_PROFILE: UserProfile = {
  uid: 'guest-user-123',
  email: 'guest@prestigecourier.demo',
  role: 'firm',
  name: 'Guest Law Firm',
  firmName: 'Prestige Legal Demo',
  createdAt: new Date(),
  verificationStatus: 'verified'
};

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center">
        <div className="bg-brand-950 p-6 rounded-3xl animate-pulse mb-6 shadow-2xl shadow-brand-950/20">
          <Shield className="w-12 h-12 text-white" />
        </div>
        <div className="text-brand-900 font-bold font-display tracking-tight animate-pulse text-xl">Initializing Secure Session...</div>
        <div className="text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 animate-pulse">PrestigeCourier Protocol</div>
      </div>
    );
  }

  // If not logged in, use the guest profile to allow the app to function immediately
  const activeProfile = profile || GUEST_PROFILE;

  return <Dashboard profile={activeProfile} />;
}
