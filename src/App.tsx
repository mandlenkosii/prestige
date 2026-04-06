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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="bg-slate-900 p-4 rounded-2xl animate-pulse mb-4">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="text-slate-400 font-medium animate-pulse">Initializing Secure Session...</div>
      </div>
    );
  }

  // If not logged in, use the guest profile to allow the app to function immediately
  const activeProfile = profile || GUEST_PROFILE;

  return <Dashboard profile={activeProfile} />;
}
