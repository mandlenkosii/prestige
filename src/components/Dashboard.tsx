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
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'picked_up': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'in_transit': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center">
          <ShieldCheck className="w-8 h-8 text-white mr-3" />
          <span className="text-xl font-bold tracking-tight">Prestige</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button className="w-full flex items-center px-4 py-3 bg-slate-800 rounded-xl text-white font-medium">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          <button className="w-full flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
            <Package className="w-5 h-5 mr-3" />
            Deliveries
          </button>
          <button className="w-full flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
            <User className="w-5 h-5 mr-3" />
            Profile
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          {isGuest && (
            <button 
              onClick={toggleRole}
              className="w-full flex items-center px-4 py-3 mb-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-all"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Switch to {profile.role === 'firm' ? 'Courier' : 'Firm'}
            </button>
          )}
          <div className="flex items-center p-3 bg-slate-800/50 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <div className="text-sm font-semibold truncate">{profile.name}</div>
              <div className="text-xs text-slate-500 capitalize">{profile.role}</div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            {profile.role === 'firm' ? 'Firm Dashboard' : 'Courier Portal'}
            {isGuest && (
              <span className="ml-3 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-indigo-200">
                Demo Mode
              </span>
            )}
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search deliveries..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all outline-none"
              />
            </div>
            {profile.role === 'firm' && (
              <button 
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center hover:bg-slate-800 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Clock className="text-amber-500" />} label="Active" value={deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length} />
            <StatCard icon={<CheckCircle2 className="text-emerald-500" />} label="Completed" value={deliveries.filter(d => d.status === 'delivered').length} />
            <StatCard icon={<AlertCircle className="text-rose-500" />} label="Urgent" value={deliveries.filter(d => d.urgency === 'urgent' && d.status !== 'delivered').length} />
            <StatCard icon={<Package className="text-blue-500" />} label="Total" value={deliveries.length} />
          </div>

          {/* Delivery List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Recent Deliveries</h3>
              <button className="text-sm text-slate-500 flex items-center hover:text-slate-900 transition-all">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading deliveries...</div>
              ) : deliveries.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">No deliveries found.</p>
                </div>
              ) : (
                deliveries.map((delivery) => (
                  <div 
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(delivery)}
                    className="px-6 py-4 flex items-center hover:bg-slate-50 cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white transition-all">
                      <Package className="w-5 h-5" />
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold text-slate-900">{delivery.documentType}</span>
                        <span className={cn(
                          "ml-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusColor(delivery.status)
                        )}>
                          {delivery.status.replace('_', ' ')}
                        </span>
                        {delivery.urgency === 'urgent' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[200px]">{delivery.pickupAddress}</span>
                        <ChevronRight className="w-3 h-3 mx-2" />
                        <span className="truncate max-w-[200px]">{delivery.dropoffAddress}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        R {delivery.price?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{delivery.distance || 0} km</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {delivery.createdAt?.toDate ? format(delivery.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 ml-6 text-slate-300 group-hover:text-slate-600 transition-all" />
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-xl font-bold">New Delivery Request</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-all">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Document Type</label>
              <select 
                value={formData.documentType}
                onChange={e => setFormData({...formData, documentType: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              >
                <option>Confidential Document</option>
                <option>Court Filing</option>
                <option>Contract / Agreement</option>
                <option>Evidence / Physical Asset</option>
                <option>Other Legal Material</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Urgency Level</label>
              <select 
                value={formData.urgency}
                onChange={e => setFormData({...formData, urgency: e.target.value as UrgencyLevel})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              >
                <option value="standard">Standard</option>
                <option value="same-day">Same Day</option>
                <option value="urgent">Urgent (Express)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Pickup Address</label>
              <input 
                required
                type="text"
                value={formData.pickupAddress}
                onChange={e => setFormData({...formData, pickupAddress: e.target.value})}
                placeholder="Street, Building, Office #"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Drop-off Address</label>
              <input 
                required
                type="text"
                value={formData.dropoffAddress}
                onChange={e => setFormData({...formData, dropoffAddress: e.target.value})}
                placeholder="Recipient Name, Street, Building"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Handling Instructions</label>
              <textarea 
                rows={3}
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
                placeholder="Any special security or handling requirements..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none"
              />
            </div>

            <div className="col-span-2 p-6 bg-slate-900 rounded-2xl text-white flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estimated Distance (KM)</label>
                <div className="flex items-center">
                  <input 
                    required
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.distance || ''}
                    onChange={e => setFormData({...formData, distance: parseFloat(e.target.value) || 0})}
                    placeholder="0.0"
                    className="w-32 px-4 py-2 bg-slate-800 border-none rounded-lg text-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <span className="ml-3 text-slate-400 font-medium">km @ R8.50/km</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cost</div>
                <div className="text-3xl font-bold text-indigo-400">R {totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-500 font-semibold hover:text-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Delivery Details</div>
            <h3 className="text-xl font-bold">{delivery.documentType}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-all">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Status & Actions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Current Status</div>
                <div className="text-lg font-bold text-slate-900 capitalize">{delivery.status.replace('_', ' ')}</div>
              </div>
              
              <div className="flex space-x-3">
                {profile.role === 'courier' && (
                  <>
                    {delivery.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus('assigned')}
                        disabled={updating}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        Accept Job
                      </button>
                    )}
                    {delivery.status === 'assigned' && (
                      <button 
                        onClick={() => updateStatus('picked_up')}
                        disabled={updating}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        Mark Picked Up
                      </button>
                    )}
                    {delivery.status === 'picked_up' && (
                      <button 
                        onClick={() => updateStatus('in_transit')}
                        disabled={updating}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:opacity-50"
                      >
                        Start Transit
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button 
                        onClick={() => updateStatus('delivered')}
                        disabled={updating}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-indigo-900 rounded-2xl text-white">
              <div>
                <div className="text-xs font-bold text-indigo-300 uppercase mb-1">Total Cost</div>
                <div className="text-2xl font-bold">R {delivery.price?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-indigo-300 uppercase mb-1">Distance</div>
                <div className="text-lg font-semibold">{delivery.distance || 0} km</div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center text-slate-400 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Pickup</span>
              </div>
              <div className="text-slate-800 font-medium">{delivery.pickupAddress}</div>
            </div>
            <div>
              <div className="flex items-center text-slate-400 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Drop-off</span>
              </div>
              <div className="text-slate-800 font-medium">{delivery.dropoffAddress}</div>
            </div>
          </div>

          {/* Chain of Custody */}
          <div>
            <div className="flex items-center text-slate-400 mb-4">
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span className="text-xs font-bold uppercase tracking-wider">Chain of Custody (Audit Log)</span>
            </div>
            <div className="space-y-4">
              {delivery.chainOfCustody.map((entry, i) => (
                <div key={i} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1.5",
                      i === delivery.chainOfCustody.length - 1 ? "bg-slate-900 ring-4 ring-slate-100" : "bg-slate-300"
                    )} />
                    {i !== delivery.chainOfCustody.length - 1 && <div className="w-0.5 h-full bg-slate-100 my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{entry.status}</span>
                      <span className="text-[10px] text-slate-400">{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">By: {entry.actorName}</div>
                    {entry.notes && <div className="text-xs text-slate-400 mt-1 italic">"{entry.notes}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Code */}
          {profile.role === 'firm' && delivery.status !== 'delivered' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center text-amber-800">
                <AlertCircle className="w-5 h-5 mr-3" />
                <div>
                  <div className="text-sm font-bold">Delivery Verification Code</div>
                  <div className="text-xs opacity-80">Provide this to the recipient for confirmation.</div>
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-900 tracking-widest">{delivery.verificationCode}</div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
