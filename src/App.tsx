import MobileBottomNav from "./components/mobile/MobileBottomNav";
import MobileHome from "./components/mobile/MobileHome";
import MobileMarketList from "./components/mobile/MobileMarketList";
import MobileTradingView from "./components/mobile/MobileTradingView";
import MobileLogin from "./components/mobile/MobileLogin";
import MobileProfile from "./components/mobile/MobileProfile";
import MobileOrders from "./components/mobile/MobileOrders";
import MobileRanking from "./components/mobile/MobileRanking";
import { useState, useEffect } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('market');
  const [tabParams, setTabParams] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState('XAUUSD');
  const [user, setUser] = useState<any>(null);
  const [customerServiceUrl, setCustomerServiceUrl] = useState<string>('');

  useEffect(() => {
    // Fetch system settings for customer service URL
    const unsubSettings = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
      if (docSnap.exists()) {
        setCustomerServiceUrl(docSnap.data().customerServiceUrl || '');
      }
    });

    // Test Firestore connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_connection_test', 'ping'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firebase connection error: The client is offline. Check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Persist demo state if user is anonymous
        if (u.isAnonymous) {
          localStorage.setItem('is_demo_user', 'true');
        } else {
          localStorage.removeItem('is_demo_user');
        }

        // Ensure user document exists in Firestore (non-blocking)
        const userRef = doc(db, "users", u.uid);
        getDoc(userRef).then(docSnap => {
          if (!docSnap.exists()) {
            setDoc(userRef, {
              uid: u.uid,
              balance: 10000,
              createdAt: serverTimestamp(),
              isAnonymous: u.isAnonymous
            }).catch(err => console.error("Error creating user doc:", err));
          }
        }).catch(err => console.error("Error fetching user doc:", err));
      } else {
        localStorage.removeItem('is_demo_user');
      }
    });
    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    setActiveTab('trade');
  };

  const handleTabChange = (tab: string, params?: any) => {
    setActiveTab(tab);
    setTabParams(params);
  };

  // Check if we are in admin view to allow full width
  const isFullWidth = activeTab === 'mine' && tabParams?.isAdminView;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center">
      <div className={`w-full ${isFullWidth ? '' : 'max-w-[480px]'} min-h-screen bg-white shadow-2xl flex flex-col relative overflow-hidden transition-all duration-500`}>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'home' && <MobileHome onSelectMarket={() => setActiveTab('market')} onTabChange={handleTabChange} />}
          {activeTab === 'market' && <MobileMarketList onSelectProduct={handleProductSelect} />}
          {activeTab === 'trade' && <MobileTradingView productId={selectedProductId} user={user} />}
          {activeTab === 'orders' && <MobileOrders onBack={() => setActiveTab('market')} />}
          {activeTab === 'mine' && (
            user && (!user.isAnonymous || tabParams?.demo || localStorage.getItem('is_demo_user') === 'true') ? 
            <MobileProfile onLogout={() => { 
              setActiveTab('market'); 
              setTabParams(null); 
              localStorage.removeItem('is_demo_user');
            }} onTabChange={handleTabChange} /> : 
            <MobileLogin 
              onBack={() => setActiveTab('market')} 
              onLogin={() => setTabParams({ ...tabParams, demo: true })}
              initialMode={tabParams?.mode} 
            />
          )}
        </div>
        <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Floating Customer Service Button */}
        {activeTab !== 'trade' && (
          <div 
            className="fixed bottom-24 right-[calc(50%-232px)] z-[9999] max-[480px]:right-2"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
          >
            <button
              onClick={() => {
                if (customerServiceUrl) {
                  window.open(customerServiceUrl, '_blank');
                } else {
                  alert(t('customer_service_offline'));
                }
              }}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 active:scale-90 transition-transform cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#ff5722] rounded-full flex items-center justify-center">
                <MessageCircle className="text-white w-5 h-5 fill-white" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

