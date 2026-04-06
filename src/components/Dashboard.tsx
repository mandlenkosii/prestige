import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { UserProfile, DeliveryRequest, DeliveryStatus, UrgencyLevel } from '../types';
import { 
  LayoutDashboard, 
  Plus, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  MapPin, 
  User, 
  ShieldCheck,
  LogOut,
  Search,
  Filter,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface DashboardProps {
  profile: UserProfile;
}

export function Dashboard({ profile: initialProfile }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const isGuest = profile.uid === 'guest-user-123';

  useEffect(() => {
    const q = profile.role === 'firm' 
      ? query(collection(db, 'deliveries'), where('firmId', '==', profile.uid), orderBy('createdAt', 'desc'))
      : profile.role === 'courier'
      ? query(collection(db, 'deliveries'), where('status', 'in', ['pending', 'assigned', 'picked_up', 'in_transit']), orderBy('createdAt', 'desc'))
      : query(collection(db, 'deliveries'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryRequest));
      setDeliveries(docs);
      setLoading(false);
    }, (error) => {
      console.error("Deliveries fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleSignOut = () => {
    if (isGuest) {
      window.location.reload();
    } else {
      auth.signOut();
    }
  };

  const toggleRole = () => {
    setProfile(prev => ({
      ...prev,
      role: prev.role === 'firm' ? 'courier' : 'firm',
      name: prev.role === 'firm' ? 'Guest Courier' : 'Guest Law Firm'
    }));
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-900/5';
      case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-900/5';
      case 'picked_up': return 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm shadow-indigo-900/5';
      case 'in_transit': return 'bg-purple-50 text-purple-700 border-purple-100 shadow-sm shadow-purple-900/5';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-900/5';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm shadow-rose-900/5';
      default: return 'bg-brand-50 text-brand-700 border-brand-100';
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-brand-950 text-white flex flex-col shadow-2xl relative z-20">
        <div className="p-8 flex items-center">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm mr-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight font-display">Prestige</span>
        </div>
        
        <nav className="flex-1 px-6 py-6 space-y-3">
          <button className="w-full flex items-center px-4 py-3.5 bg-white/10 rounded-xl text-white font-semibold shadow-inner-subtle">
            <LayoutDashboard className="w-5 h-5 mr-3 opacity-80" />
            Dashboard
          </button>
          <button className="w-full flex items-center px-4 py-3.5 text-brand-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200">
            <Package className="w-5 h-5 mr-3 opacity-60" />
            Deliveries
          </button>
          <button className="w-full flex items-center px-4 py-3.5 text-brand-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200">
            <User className="w-5 h-5 mr-3 opacity-60" />
            Profile
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          {isGuest && (
            <button 
              onClick={toggleRole}
              className="w-full flex items-center px-4 py-3.5 mb-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Switch to {profile.role === 'firm' ? 'Courier' : 'Firm'}
            </button>
          )}
          <div className="flex items-center p-4 bg-white/5 rounded-2xl mb-6 border border-white/5">
            <div className="w-11 h-11 rounded-xl bg-brand-800 flex items-center justify-center text-sm font-black text-brand-200 border border-white/10 shadow-inner">
              {profile.name.charAt(0)}
            </div>
            <div className="ml-4 overflow-hidden">
              <div className="text-sm font-bold truncate">{profile.name}</div>
              <div className="text-[10px] text-brand-500 uppercase font-black tracking-widest mt-0.5">{profile.role}</div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-sm font-bold"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-brand-100 flex items-center justify-between px-10 relative z-10">
          <h2 className="text-xl font-bold text-brand-900 flex items-center font-display">
            {profile.role === 'firm' ? 'Firm Dashboard' : 'Courier Portal'}
            {isGuest && (
              <span className="ml-4 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border border-indigo-100 shadow-sm">
                Demo Mode
              </span>
            )}
          </h2>
          
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-900 transition-colors" />
              <input 
                type="text" 
                placeholder="Search deliveries..." 
                className="pl-11 pr-5 py-2.5 bg-brand-100/50 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-900 transition-all outline-none w-64 border border-brand-100"
              />
            </div>
            {profile.role === 'firm' && (
              <button 
                onClick={() => setIsRequestModalOpen(true)}
                className="btn-primary shadow-lg shadow-brand-900/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-brand-50/50">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 mb-10">
            <StatCard icon={<Clock className="text-amber-500" />} label="Active" value={deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length} />
            <StatCard icon={<CheckCircle2 className="text-emerald-500" />} label="Completed" value={deliveries.filter(d => d.status === 'delivered').length} />
            <StatCard icon={<AlertCircle className="text-rose-500" />} label="Urgent" value={deliveries.filter(d => d.urgency === 'urgent' && d.status !== 'delivered').length} />
            <StatCard icon={<Package className="text-blue-500" />} label="Total" value={deliveries.length} />
          </div>

          {/* Delivery List */}
          <div className="bg-white rounded-3xl shadow-premium border border-brand-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-brand-50 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-brand-900 font-display">Recent Deliveries</h3>
              <button className="text-xs font-bold text-brand-500 flex items-center hover:text-brand-900 transition-all uppercase tracking-widest">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
            
            <div className="divide-y divide-brand-50">
              {loading ? (
                <div className="p-20 text-center text-brand-300 font-medium animate-pulse">Loading secure records...</div>
              ) : deliveries.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-10 h-10 text-brand-200" />
                  </div>
                  <p className="text-brand-500 font-medium">No delivery records found in the vault.</p>
                </div>
              ) : (
                deliveries.map((delivery) => (
                  <div 
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(delivery)}
                    className="px-8 py-6 flex items-center hover:bg-brand-50/50 cursor-pointer transition-all group relative"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-brand-100">
                      <Package className="w-6 h-6" />
                    </div>
                    
                    <div className="ml-6 flex-1">
                      <div className="flex items-center">
                        <span className="font-bold text-brand-900 text-base">{delivery.documentType}</span>
                        <span className={cn(
                          "ml-4 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                          getStatusColor(delivery.status)
                        )}>
                          {delivery.status.replace('_', ' ')}
                        </span>
                        {delivery.urgency === 'urgent' && (
                          <span className="ml-2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-2 text-xs text-brand-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                        <span className="truncate max-w-[240px]">{delivery.pickupAddress}</span>
                        <ChevronRight className="w-3.5 h-3.5 mx-3 opacity-30" />
                        <span className="truncate max-w-[240px]">{delivery.dropoffAddress}</span>
                      </div>
                    </div>

                    <div className="text-right px-8">
                      <div className="text-lg font-black text-brand-900 font-display">
                        R {delivery.price?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-1">{delivery.distance || 0} km total</div>
                    </div>

                    <div className="text-right border-l border-brand-50 pl-8">
                      <div className="text-xs font-bold text-brand-900">
                        {delivery.createdAt?.toDate ? format(delivery.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}
                      </div>
                      <div className="text-[10px] text-brand-400 font-medium mt-1">
                        {delivery.createdAt?.toDate ? format(delivery.createdAt.toDate(), 'h:mm a') : 'Pending...'}
                      </div>
                    </div>
                    
                    <div className="ml-8 w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover:bg-brand-900 group-hover:text-white transition-all duration-300">
                      <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <RequestModal 
            profile={profile} 
            onClose={() => setIsRequestModalOpen(false)} 
          />
        )}
        {selectedDelivery && (
          <DeliveryDetailModal 
            delivery={selectedDelivery} 
            profile={profile}
            onClose={() => setSelectedDelivery(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-brand-100 shadow-premium group hover:border-brand-900 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-brand-50 rounded-2xl group-hover:bg-brand-900 group-hover:text-white transition-all duration-300">{icon}</div>
      </div>
      <div className="text-3xl font-black text-brand-900 font-display">{value}</div>
      <div className="text-xs font-bold text-brand-400 uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}

function RequestModal({ profile, onClose }: { profile: UserProfile, onClose: () => void }) {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    documentType: 'Confidential Document',
    urgency: 'standard' as UrgencyLevel,
    instructions: '',
    distance: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const RATE_PER_KM = 8.50;
  const totalPrice = formData.distance * RATE_PER_KM;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const deliveryData = {
        ...formData,
        price: totalPrice,
        firmId: profile.uid,
        status: 'pending' as DeliveryStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        chainOfCustody: [{
          timestamp: new Date().toISOString(),
          status: 'Request Created',
          actorId: profile.uid,
          actorName: profile.name,
          notes: 'Initial delivery request submitted.'
        }],
        verificationCode: Math.floor(1000 + Math.random() * 9000).toString()
      };
      await addDoc(collection(db, 'deliveries'), deliveryData);
      onClose();
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden border border-brand-100"
      >
        <div className="px-10 py-8 bg-brand-950 text-white flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold font-display">New Delivery Request</h3>
            <p className="text-brand-400 text-xs font-bold uppercase tracking-widest mt-1">Secure Document Transport</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
              <label className="block text-xs font-black text-brand-900 uppercase tracking-widest mb-3">Document Type</label>
              <select 
                value={formData.documentType}
                onChange={e => setFormData({...formData, documentType: e.target.value})}
                className="input-field"
              >
                <option>Confidential Document</option>
                <option>Court Filing</option>
                <option>Contract / Agreement</option>
                <option>Evidence / Physical Asset</option>
                <option>Other Legal Material</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-brand-900 uppercase tracking-widest mb-3">Urgency Level</label>
              <select 
                value={formData.urgency}
                onChange={e => setFormData({...formData, urgency: e.target.value as UrgencyLevel})}
                className="input-field"
              >
                <option value="standard">Standard</option>
                <option value="same-day">Same Day</option>
                <option value="urgent">Urgent (Express)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-black text-brand-900 uppercase tracking-widest mb-3">Pickup Address</label>
              <input 
                required
                type="text"
                value={formData.pickupAddress}
                onChange={e => setFormData({...formData, pickupAddress: e.target.value})}
                placeholder="Street, Building, Office #"
                className="input-field"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-black text-brand-900 uppercase tracking-widest mb-3">Drop-off Address</label>
              <input 
                required
                type="text"
                value={formData.dropoffAddress}
                onChange={e => setFormData({...formData, dropoffAddress: e.target.value})}
                placeholder="Recipient Name, Street, Building"
                className="input-field"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-black text-brand-900 uppercase tracking-widest mb-3">Handling Instructions</label>
              <textarea 
                rows={3}
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
                placeholder="Any special security or handling requirements..."
                className="input-field resize-none"
              />
            </div>

            <div className="col-span-2 p-8 bg-brand-950 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-brand-950/20">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-3">Estimated Distance</label>
                <div className="flex items-center">
                  <input 
                    required
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.distance || ''}
                    onChange={e => setFormData({...formData, distance: parseFloat(e.target.value) || 0})}
                    placeholder="0.0"
                    className="w-28 px-4 py-3 bg-white/10 border-none rounded-xl text-2xl font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-display"
                  />
                  <span className="ml-4 text-brand-400 font-bold text-sm">KM @ R8.50</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-2">Total Cost</div>
                <div className="text-4xl font-black text-indigo-400 font-display tracking-tight">R {totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-6 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-brand-400 hover:text-brand-900 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="btn-primary px-10 py-4 text-lg shadow-xl shadow-brand-900/20"
            >
              {submitting ? 'Creating...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeliveryDetailModal({ delivery, profile, onClose }: { delivery: DeliveryRequest, profile: UserProfile, onClose: () => void }) {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus: DeliveryStatus) => {
    setUpdating(true);
    try {
      const deliveryRef = doc(db, 'deliveries', delivery.id);
      const newEntry = {
        timestamp: new Date().toISOString(),
        status: newStatus.replace('_', ' ').toUpperCase(),
        actorId: profile.uid,
        actorName: profile.name,
        notes: `Status updated to ${newStatus}`
      };
      
      await updateDoc(deliveryRef, {
        status: newStatus,
        courierId: profile.role === 'courier' ? profile.uid : delivery.courierId,
        updatedAt: serverTimestamp(),
        chainOfCustody: [...delivery.chainOfCustody, newEntry]
      });
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-brand-100"
      >
        <div className="px-10 py-8 bg-brand-950 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-2">Delivery Intelligence</div>
            <h3 className="text-2xl font-bold font-display">{delivery.documentType}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          {/* Status & Actions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-8 bg-brand-50 rounded-3xl border border-brand-100">
              <div>
                <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2">Current Status</div>
                <div className="text-xl font-black text-brand-900 capitalize font-display">{delivery.status.replace('_', ' ')}</div>
              </div>
              
              <div className="flex space-x-3">
                {profile.role === 'courier' && (
                  <>
                    {delivery.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus('assigned')}
                        disabled={updating}
                        className="btn-primary px-6 py-2.5 text-sm"
                      >
                        Accept Job
                      </button>
                    )}
                    {delivery.status === 'assigned' && (
                      <button 
                        onClick={() => updateStatus('picked_up')}
                        disabled={updating}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Mark Picked Up
                      </button>
                    )}
                    {delivery.status === 'picked_up' && (
                      <button 
                        onClick={() => updateStatus('in_transit')}
                        disabled={updating}
                        className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
                      >
                        Start Transit
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button 
                        onClick={() => updateStatus('delivered')}
                        disabled={updating}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-8 bg-brand-950 rounded-3xl text-white shadow-xl shadow-brand-950/20">
              <div>
                <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2">Total Cost</div>
                <div className="text-3xl font-black font-display text-indigo-400">R {delivery.price?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2">Distance</div>
                <div className="text-xl font-black font-display">{delivery.distance || 0} km</div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-10">
            <div className="p-8 bg-brand-50/50 rounded-3xl border border-brand-100">
              <div className="flex items-center text-brand-400 mb-4">
                <MapPin className="w-4 h-4 mr-2 opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-widest">Pickup Location</span>
              </div>
              <div className="text-brand-900 font-bold text-lg leading-relaxed">{delivery.pickupAddress}</div>
            </div>
            <div className="p-8 bg-brand-50/50 rounded-3xl border border-brand-100">
              <div className="flex items-center text-brand-400 mb-4">
                <MapPin className="w-4 h-4 mr-2 opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-widest">Drop-off Location</span>
              </div>
              <div className="text-brand-900 font-bold text-lg leading-relaxed">{delivery.dropoffAddress}</div>
            </div>
          </div>

          {/* Chain of Custody */}
          <div className="p-10 bg-white rounded-[2rem] border border-brand-100 shadow-premium">
            <div className="flex items-center text-brand-400 mb-8">
              <ShieldCheck className="w-5 h-5 mr-3 opacity-60" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Chain of Custody (Secure Audit Log)</span>
            </div>
            <div className="space-y-8">
              {delivery.chainOfCustody.map((entry, i) => (
                <div key={i} className="flex items-start">
                  <div className="flex flex-col items-center mr-6">
                    <div className={cn(
                      "w-4 h-4 rounded-full mt-1.5 border-2",
                      i === delivery.chainOfCustody.length - 1 ? "bg-brand-900 border-brand-900 ring-8 ring-brand-50" : "bg-white border-brand-200"
                    )} />
                    {i !== delivery.chainOfCustody.length - 1 && <div className="w-0.5 h-full bg-brand-100 my-2" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-brand-900 text-base font-display">{entry.status}</span>
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</span>
                    </div>
                    <div className="text-xs text-brand-500 mt-1 font-medium">Verified by: <span className="text-brand-900 font-bold">{entry.actorName}</span></div>
                    {entry.notes && <div className="text-xs text-brand-400 mt-2 italic bg-brand-50 p-3 rounded-xl border border-brand-100">"{entry.notes}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Code */}
          {profile.role === 'firm' && delivery.status !== 'delivered' && (
            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-between shadow-lg shadow-indigo-600/5">
              <div className="flex items-center text-indigo-900">
                <div className="bg-white p-3 rounded-2xl mr-5 shadow-sm">
                  <AlertCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="text-lg font-black font-display">Delivery Verification Code</div>
                  <div className="text-xs font-medium opacity-60 mt-1">Provide this to the recipient for final confirmation.</div>
                </div>
              </div>
              <div className="text-4xl font-black text-indigo-900 tracking-[0.25em] font-display bg-white px-8 py-4 rounded-2xl shadow-inner-subtle border border-indigo-100">{delivery.verificationCode}</div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
