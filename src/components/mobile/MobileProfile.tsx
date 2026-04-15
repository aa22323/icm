import { auth, db } from "../../lib/firebase";
import MobileLogin from "./MobileLogin";
import AdminDashboard from "./AdminDashboard";
import MobileLanguageSwitch from "./MobileLanguageSwitch";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { doc, onSnapshot, updateDoc, increment, serverTimestamp, addDoc, collection, query, where, orderBy, limit } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { 
  LogOut, 
  ChevronRight, 
  Lock, 
  UserCircle, 
  ShieldCheck, 
  CreditCard, 
  Wallet, 
  User, 
  Info, 
  Mail, 
  Globe,
  Crown,
  Headset,
  MoreHorizontal,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  PlusCircle,
  Camera,
  Upload
} from "lucide-react";

type SubView = 'main' | 'deposit' | 'withdraw' | 'assets' | 'orders' | 'bankCard' | 'cryptoWallet' | 'profile' | 'security' | 'verification' | 'about' | 'contact' | 'language' | 'tradingPassword' | 'loginPassword' | 'admin';

export default function MobileProfile({ onLogout, onTabChange }: { onLogout: () => void, onTabChange: (tab: string, params?: any) => void }) {
  const { t } = useTranslation();
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [userData, setUserData] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setUserBalance(data.balance);
          
          // Generate unique member ID if not exists
          if (!data.memberId) {
            const randomId = Math.floor(10000000 + Math.random() * 90000000).toString();
            updateDoc(userRef, { memberId: randomId });
          }
        }
      });

      const unsubSettings = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
        if (docSnap.exists()) setSystemSettings(docSnap.data());
      });

      return () => {
        unsubUser();
        unsubSettings();
      };
    }
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const userRef = doc(db, "users", auth.currentUser!.uid);
      try {
        await updateDoc(userRef, { avatar: base64String });
      } catch (error) {
        console.error("Avatar upload error:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await auth.signOut();
    onLogout();
  };

  const renderSubView = () => {
    switch (activeSubView) {
      case 'language':
        return <MobileLanguageSwitch onBack={() => setActiveSubView('main')} />;
      case 'admin':
        return (
          <AdminDashboard 
            onBack={() => {
              onTabChange('mine', { isAdminView: false });
              setActiveSubView('main');
            }} 
          />
        );
      case 'bankCard':
        return <BankCardForm onBack={() => setActiveSubView('main')} userData={userData} />;
      case 'tradingPassword':
        return <TradingPasswordForm onBack={() => setActiveSubView('main')} userData={userData} />;
      case 'loginPassword':
        return <LoginPasswordForm onBack={() => setActiveSubView('main')} userData={userData} />;
      case 'verification':
        return <VerificationForm onBack={() => setActiveSubView('main')} userData={userData} />;
      case 'assets':
        return (
          <AssetsView 
            onBack={() => setActiveSubView('main')} 
            balance={userBalance || 0} 
            onDeposit={() => setActiveSubView('deposit')}
            onWithdraw={() => setActiveSubView('withdraw')}
          />
        );
      case 'deposit':
        return <DepositView onBack={() => setActiveSubView('main')} systemSettings={systemSettings} />;
      case 'withdraw':
        return (
          <WithdrawView 
            onBack={() => setActiveSubView('main')} 
            onAddBankCard={() => setActiveSubView('bankCard')} 
            balance={userBalance || 0} 
            userData={userData} 
          />
        );
      case 'main':
        return null; // Handled in the main return
      default:
        return (
          <PlaceholderView 
            title={getViewTitle(activeSubView, t)} 
            onBack={() => setActiveSubView('main')} 
          />
        );
    }
  };

  const subViewContent = renderSubView();
  if (subViewContent) return subViewContent;

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24 overflow-y-auto">
      {/* User Info Section */}
      <div className="bg-[#f8f8f8] px-4 py-8 flex items-center gap-4">
        <label className="relative cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
            {userData?.avatar ? (
              <img src={userData.avatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <UserCircle className="w-full h-full text-gray-300" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-gray-500" />
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
        </label>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-lg text-gray-900">{userData?.realName || '--'}</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-gray-500 text-[13px] truncate">{auth.currentUser?.email || 'guest_user@gmail.com'}</p>
        </div>
      </div>

      {/* VIP Banner */}
      <div className="mx-4 mb-4 bg-[#2a2623] rounded-xl p-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#f3d06a] to-[#d4af37] flex items-center justify-center shadow-inner">
            <Crown className="h-3.5 w-3.5 text-[#2a2623]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[#f3d06a] text-sm font-bold tracking-wide">{t('regular_member')}</span>
              <span className="text-[#f3d06a]/80 text-xs font-mono">{userData?.memberId || '88558280'}</span>
            </div>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-[#f3d06a]/10 border border-[#f3d06a]/20">
          <span className="text-[#f3d06a] text-[10px] font-bold">{t('vip_level')}</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white mx-4 rounded-xl shadow-sm mb-4 grid grid-cols-4 py-6">
        <QuickAction 
          icon={<div className="w-6 h-6 bg-yellow-400 rounded-sm" />} 
          label={t('deposit')} 
          onClick={() => setActiveSubView('deposit')}
        />
        <QuickAction 
          icon={<div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"/></div>} 
          label={t('withdraw')} 
          onClick={() => setActiveSubView('withdraw')}
        />
        <QuickAction 
          icon={<div className="w-1 h-6 bg-yellow-400" />} 
          label={t('assets')} 
          onClick={() => setActiveSubView('assets')}
        />
        <QuickAction 
          icon={<div className="w-6 h-6 bg-yellow-400 rounded-tr-lg rounded-bl-lg" />} 
          label={t('orders')} 
          onClick={() => onTabChange('orders')}
        />
      </div>

      {/* Menu List */}
      <div className="bg-white border-t border-b mb-4">
        {(userData?.role === 'admin' || auth.currentUser?.email === 'oopqwe001@gmail.com') && (
          <MenuItem icon={ShieldCheck} label={t('admin_dashboard')} onClick={() => {
            onTabChange('mine', { isAdminView: true });
            setActiveSubView('admin');
          }} />
        )}
        <MenuItem icon={Headset} label={t('online_service')} onClick={() => {
          if (systemSettings?.customerServiceUrl) {
            window.open(systemSettings.customerServiceUrl, '_blank');
          } else {
            alert(t('customer_service_offline'));
          }
        }} />
        <MenuItem icon={Lock} label={t('set_trading_password')} onClick={() => setActiveSubView('tradingPassword')} />
        <MenuItem icon={PlusCircle} label={t('change_login_password')} onClick={() => setActiveSubView('loginPassword')} />
        <MenuItem icon={UserCircle} label={t('identity_verification')} onClick={() => setActiveSubView('verification')} />
        <MenuItem icon={Wallet} label={t('bind_crypto_wallet')} onClick={() => setActiveSubView('cryptoWallet')} />
        <MenuItem icon={CreditCard} label={t('bind_bank_card')} onClick={() => setActiveSubView('bankCard')} />
        <MenuItem icon={User} label={t('edit_profile')} onClick={() => setActiveSubView('profile')} />
        <MenuItem icon={Info} label={t('about_us')} onClick={() => setActiveSubView('about')} />
        <MenuItem icon={Mail} label={t('contact_us')} onClick={() => setActiveSubView('contact')} />
        <MenuItem icon={Globe} label={t('language_switch')} onClick={() => setActiveSubView('language')} />
      </div>

      {/* Logout Button */}
      <div className="px-4 mb-8">
        <button 
          onClick={handleLogout}
          className="w-full bg-white text-[#f23c48] py-4 rounded-xl font-bold border shadow-sm active:bg-gray-50 transition-colors"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

function BankCardForm({ onBack, userData }: { onBack: () => void, userData: any }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    bankName: userData?.bankInfo?.bankName || '',
    cardNumber: userData?.bankInfo?.cardNumber || '',
    holderName: userData?.bankInfo?.holderName || '',
    branch: userData?.bankInfo?.branch || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        bankInfo: formData
      });
      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      console.error("Save bank info error:", error);
      alert("Failed to save information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('bind_bank_card')}</h2>
      </div>

      <div className="p-6">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">{t('bind_success')}</h3>
            <p className="text-gray-500 mt-2">{t('bind_success_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('bank_name')}</label>
              <input 
                required
                type="text"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.bankName}
                onChange={e => setFormData({...formData, bankName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('bank_card_number')}</label>
              <input 
                required
                type="text"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.cardNumber}
                onChange={e => setFormData({...formData, cardNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('cardholder_name')}</label>
              <input 
                required
                type="text"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.holderName}
                onChange={e => setFormData({...formData, holderName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('branch_name')}</label>
              <input 
                type="text"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.branch}
                onChange={e => setFormData({...formData, branch: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-8 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('confirm_bind')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AssetsView({ onBack, balance, onDeposit, onWithdraw }: { onBack: () => void, balance: number, onDeposit: () => void, onWithdraw: () => void }) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", auth.currentUser.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort client-side to avoid composite index requirement
      txs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setTransactions(txs.slice(0, 20));
      setLoading(false);
    }, (error) => {
      console.error("Transactions listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return (
    <div className="flex flex-col h-full bg-white pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b sticky top-0 bg-white z-10">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 pr-6">
          <h2 className="font-bold text-lg">{t('transaction_records')}</h2>
          <ChevronDownIcon className="h-4 w-4 text-gray-800" />
        </div>
      </div>

      {/* Account Assets Section */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{t('account_assets')}</h3>
          <div className="flex gap-2">
            <button onClick={onDeposit} className="bg-yellow-400 text-black px-4 py-1.5 rounded-md text-sm font-bold active:scale-95 transition-transform">{t('deposit')}</button>
            <button onClick={onWithdraw} className="bg-yellow-400 text-black px-4 py-1.5 rounded-md text-sm font-bold active:scale-95 transition-transform">{t('withdraw')}</button>
            <button onClick={() => window.location.reload()} className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-md text-sm font-bold active:scale-95 transition-transform">{t('refresh')}</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-6">
          <div>
            <p className="text-gray-400 text-xs mb-1">{t('current_balance')}</p>
            <p className="text-xl font-bold text-black">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{t('available_funds')}</p>
            <p className="text-xl font-bold text-black">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{t('equity_label')}</p>
            <p className="text-xl font-bold text-black">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{t('frozen_assets')}</p>
            <p className="text-xl font-bold text-black">0.00</p>
          </div>
        </div>
      </div>

      {/* Transaction Records Section */}
      <div className="bg-[#f8f8f8] px-4 py-2 border-b">
        <div className="flex items-center gap-1">
          <div className="w-1 h-4 bg-yellow-400" />
          <h3 className="text-sm font-bold text-gray-800">{t('transaction_records')}</h3>
        </div>
      </div>

      <div className="flex-1">
        {/* Table Header */}
        <div className="grid grid-cols-4 px-4 py-3 border-b text-[11px] text-gray-400 font-medium">
          <div>{t('asset_type')}</div>
          <div>{t('operation_type')}</div>
          <div>{t('symbol_code')}</div>
          <div className="text-right">{t('amount')}</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Info className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">{t('no_records')}</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="px-4 py-4">
                <div className="grid grid-cols-4 text-[13px] font-bold text-gray-700">
                  <div className="truncate">{tx.assetType || 'SYSTEM'}</div>
                  <div className={`truncate ${tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type}
                  </div>
                  <div className="truncate text-gray-400 font-normal">{tx.symbol || '--'}</div>
                  <div className={`text-right ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-[10px] text-gray-300 mt-1">
                  {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : t('just_now')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-8">
            <button className="text-gray-300 text-sm font-medium">{t('prev_page')}</button>
            <button className="w-8 h-8 bg-[#0166fc] text-white rounded flex items-center justify-center text-sm font-bold">1</button>
            <button className="text-gray-300 text-sm font-medium">{t('next_page')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DepositView({ onBack, systemSettings }: { onBack: () => void, systemSettings: any }) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'ERC20'>('TRC20');
  const [amount, setAmount] = useState('');

  const methods = [
    { id: 'usdt', name: 'USDT', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
    { id: 'bank', name: t('bank_transfer'), icon: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png' },
    { id: 'visa', name: 'VISA/Mastercard', icon: 'https://cdn-icons-png.flaticon.com/512/196/196010.png' }
  ];

  const usdtAddresses = {
    TRC20: systemSettings?.depositInfo?.cryptoAddress || 'TX7mY9k2P8j5L3n1R4v6C0x9Z2w8Q7mY9k2P8j5L3n1',
    ERC20: systemSettings?.depositInfo?.erc20Address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  };

  if (selectedMethod) {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] pb-24 overflow-y-auto">
        <div className="flex items-center px-4 py-3 bg-white border-b sticky top-0 z-10">
          <button onClick={() => setSelectedMethod(null)} className="p-1 -ml-1">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <h2 className="flex-1 text-center font-bold text-lg pr-6">
            {methods.find(m => m.id === selectedMethod)?.name} {selectedMethod === 'usdt' ? `(${usdtNetwork})` : ''} {t('deposit')}
          </h2>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
            {selectedMethod === 'usdt' && (
              <>
                {/* Network Selection */}
                <div className="flex w-full bg-gray-100 p-1 rounded-xl mb-6">
                  <button 
                    onClick={() => setUsdtNetwork('TRC20')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${usdtNetwork === 'TRC20' ? 'bg-white text-[#0166fc] shadow-sm' : 'text-gray-400'}`}
                  >
                    TRC20
                  </button>
                  <button 
                    onClick={() => setUsdtNetwork('ERC20')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${usdtNetwork === 'ERC20' ? 'bg-white text-[#0166fc] shadow-sm' : 'text-gray-400'}`}
                  >
                    ERC20
                  </button>
                </div>

                <p className="text-sm text-gray-400 mb-4 text-center">{t('scan_qr_to_transfer')}</p>
                <div className="w-48 h-48 bg-gray-50 rounded-2xl mb-6 flex items-center justify-center border p-2">
                  <img 
                    src={
                      usdtNetwork === 'TRC20' 
                        ? (systemSettings?.depositInfo?.cryptoQR || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${usdtAddresses[usdtNetwork]}&color=0166fc`)
                        : (systemSettings?.depositInfo?.erc20QR || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${usdtAddresses[usdtNetwork]}&color=0166fc`)
                    } 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-full bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">USDT ({usdtNetwork}) {t('address')}</p>
                  <p className="text-xs font-mono break-all text-gray-800 select-all">{usdtAddresses[usdtNetwork]}</p>
                </div>
              </>
            )}
            
            {selectedMethod === 'bank' && (
              <div className="w-full space-y-4">
                <p className="text-sm text-gray-400 mb-2">{t('transfer_to_bank')}</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-dashed whitespace-pre-line text-sm text-gray-700 font-medium">
                  {systemSettings?.depositInfo?.bankInfo || t('contact_service_for_bank')}
                </div>
              </div>
            )}

            {selectedMethod === 'visa' && (
              <div className="w-full space-y-4">
                <p className="text-sm text-gray-400 mb-2">{t('card_payment')}</p>
                <div className="p-4 border rounded-xl bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-bold text-gray-800">{t('online_secure_gateway')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed mt-4">
                  {t('payment_tip')}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-wider">{t('estimated_arrival')}</p>
            <p className="text-2xl font-black text-[#0166fc]">${amount || '0.00'}</p>
          </div>

          <button 
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={async () => {
              if (!auth.currentUser) return;
              try {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const depositAmount = parseFloat(amount);
                
                await updateDoc(userRef, {
                  balance: increment(depositAmount)
                });

                // Add to transaction records
                await addDoc(collection(db, "transactions"), {
                  uid: auth.currentUser.uid,
                  type: 'DEPOSIT',
                  amount: depositAmount,
                  status: 'COMPLETED',
                  createdAt: serverTimestamp(),
                  assetType: 'SYSTEM'
                });

                alert(t('deposit_success'));
                onBack();
              } catch (error) {
                console.error("Deposit error:", error);
                alert(t('deposit_failed'));
              }
            }}
            className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {t('i_have_transferred')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24 overflow-y-auto">
      <div className="flex items-center px-4 py-3 bg-white border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('deposit')}</h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wider">{t('select_deposit_method')}</p>
          <div className="space-y-3">
            {methods.map(m => (
              <button 
                key={m.id} 
                onClick={() => setSelectedMethod(m.id)}
                className="w-full flex items-center justify-between p-4 border rounded-xl active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={m.icon} className="w-8 h-8 object-contain" alt="" referrerPolicy="no-referrer" />
                  <span className="font-bold text-gray-800">{m.id === 'bank' ? t('bank_transfer') : m.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wider">{t('deposit_amount')}</p>
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
            <input 
              type="number" 
              placeholder="" 
              className="w-full h-16 bg-gray-50 rounded-xl pl-10 pr-4 text-2xl font-black outline-none focus:ring-2 focus:ring-[#0166fc]/20" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <button 
            disabled={!amount}
            onClick={() => {
              if (methods.length > 0) setSelectedMethod(methods[0].id);
            }}
            className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {t('deposit_now')}
          </button>
        </div>
      </div>
    </div>
  );
}

function BankDetail({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-none">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
}

function WithdrawView({ onBack, onAddBankCard, balance, userData }: { onBack: () => void, onAddBankCard: () => void, balance: number, userData: any }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!auth.currentUser) return;
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert(t('invalid_amount'));
      return;
    }

    if (withdrawAmount > balance) {
      alert(t('insufficient_balance'));
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      // Deduct balance immediately for pending withdrawal
      await updateDoc(userRef, {
        balance: increment(-withdrawAmount)
      });

      // Create withdrawal request for admin approval
      await addDoc(collection(db, "withdrawals"), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        amount: withdrawAmount,
        status: 'pending',
        bankInfo: userData.bankCard || userData.bankInfo,
        createdAt: serverTimestamp()
      });

      // Add to transaction records
      await addDoc(collection(db, "transactions"), {
        uid: auth.currentUser.uid,
        type: 'WITHDRAW',
        amount: withdrawAmount,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        assetType: 'SYSTEM'
      });

      alert(t('withdraw_submitted'));
      onBack();
    } catch (error) {
      console.error("Withdraw error:", error);
      alert(t('withdraw_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24 overflow-y-auto">
      <div className="flex items-center px-4 py-3 bg-white border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('withdraw_title')}</h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('available_balance')}</p>
            <p className="text-lg font-black text-[#0166fc]">${balance.toLocaleString()}</p>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
            <input 
              type="number" 
              placeholder="" 
              className="w-full h-16 bg-gray-50 rounded-xl pl-10 pr-4 text-xl font-bold outline-none focus:ring-2 focus:ring-[#0166fc]/20" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wider">{t('withdraw_to')}</p>
          {userData?.bankInfo ? (
            <div className="p-4 border rounded-xl bg-gray-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">{userData.bankInfo.bankName}</p>
                <p className="text-xs text-gray-400 mt-1">**** **** **** {userData.bankInfo.cardNumber.slice(-4)}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          ) : (
            <button onClick={onAddBankCard} className="w-full p-4 border-2 border-dashed rounded-xl text-gray-400 font-bold text-sm flex flex-col items-center gap-2">
              <PlusCircle className="h-6 w-6" />
              {t('add_bank_card')}
            </button>
          )}
        </div>

        <button 
          disabled={loading || !amount}
          onClick={handleWithdraw}
          className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-4 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : t('submit_withdraw')}
        </button>
      </div>
    </div>
  );
}

function ChevronDownIcon(props: any) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlaceholderView({ title, onBack }: { title: string, onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{title}</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Info className="h-10 w-10 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}{t('feature_under_development')}</h3>
        <p className="text-sm text-gray-500">{t('security_maintenance_tip')}</p>
        <button 
          onClick={onBack}
          className="mt-8 text-[#0166fc] font-bold"
        >
          {t('back_to_profile')}
        </button>
      </div>
    </div>
  );
}

function getViewTitle(view: SubView, t: any): string {
  const titles: Record<string, string> = {
    deposit: t('deposit'),
    withdraw: t('withdraw'),
    assets: t('assets'),
    orders: t('orders'),
    cryptoWallet: t('crypto_wallet_title'),
    profile: t('edit_profile'),
    security: t('security_settings'),
    verification: t('identity_verification'),
    about: t('about_us'),
    contact: t('contact_us'),
    language: t('language_switch_title'),
    tradingPassword: t('set_trading_password'),
    loginPassword: t('change_login_password')
  };
  return titles[view] || t('function_details');
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 active:opacity-60 transition-opacity">
      <div className="h-6 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[13px] font-medium text-gray-700">{label}</span>
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 border-b last:border-none active:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-600" />
        <span className="text-[15px] text-gray-800">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </button>
  );
}

// Custom icons to match the screenshot better
function PlusCircleIcon(props: any) {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center relative">
      <div className="w-3 h-0.5 bg-gray-600 absolute" />
      <div className="w-0.5 h-3 bg-gray-600 absolute" />
    </div>
  );
}

function UserSquareIcon(props: any) {
  return (
    <div className="w-5 h-5 border-2 border-gray-600 rounded-sm flex items-center justify-center">
      <User className="w-3 h-3 text-gray-600" />
    </div>
  );
}

function TradingPasswordForm({ onBack, userData }: { onBack: () => void, userData: any }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t('passwords_do_not_match'));
      return;
    }
    if (password.length < 6) {
      alert(t('trading_password_min_length'));
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        tradingPassword: password
      });
      setSuccess(true);
      setTimeout(onBack, 1500);
    } catch (error) {
      alert(t('set_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('set_trading_password')}</h2>
      </div>

      <div className="p-6">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">{t('set_success')}</h3>
            <p className="text-gray-500 mt-2">{t('set_success_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-400">{t('trading_password_tip')}</p>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('new_trading_password')}</label>
              <input 
                required
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('confirm_trading_password')}</label>
              <input 
                required
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-8 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('confirm_set')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function LoginPasswordForm({ onBack, userData }: { onBack: () => void, userData: any }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'old' | 'email'>('old');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSendResetEmail = async () => {
    if (!auth.currentUser?.email) {
      alert(t('email_not_found'));
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setEmailSent(true);
      alert(`${t('reset_email_sent_to')}: ${auth.currentUser.email}\n${t('check_email_tip')}`);
    } catch (error: any) {
      console.error("Send reset email error:", error);
      alert(t('send_failed') + ": " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert(t('passwords_do_not_match'));
      return;
    }

    setLoading(true);
    // Simulate password update with old password
    // In a real app, you'd use reauthenticateWithCredential then updatePassword
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(onBack, 1500);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('change_login_password_title')}</h2>
      </div>

      <div className="p-6">
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
          <button 
            onClick={() => setMode('old')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'old' ? 'bg-white text-[#0166fc] shadow-sm' : 'text-gray-400'}`}
          >
            {t('old_password_change')}
          </button>
          <button 
            onClick={() => setMode('email')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'email' ? 'bg-white text-[#0166fc] shadow-sm' : 'text-gray-400'}`}
          >
            {t('email_link_reset')}
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">{t('modify_success')}</h3>
            <p className="text-gray-500 mt-2">{t('modify_success_desc')}</p>
          </div>
        ) : mode === 'email' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-600 leading-relaxed">
                {t('email_reset_desc')} <span className="font-bold">{auth.currentUser?.email || t('not_bound')}</span>
              </p>
            </div>
            
            {emailSent ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-bold text-gray-800">{t('email_sent')}</p>
                <p className="text-xs text-gray-400 mt-1 px-4">{t('check_email_tip')}</p>
                <button 
                  onClick={onBack}
                  className="mt-6 text-[#0166fc] font-bold text-sm"
                >
                  {t('back_to_profile')}
                </button>
              </div>
            ) : (
              <button 
                disabled={loading || !auth.currentUser?.email}
                onClick={handleSendResetEmail}
                className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('send_reset_email')}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('current_login_password')}</label>
              <input 
                required
                type="password"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.oldPassword}
                onChange={e => setFormData({...formData, oldPassword: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('new_login_password')}</label>
              <input 
                required
                type="password"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">{t('confirm_new_password')}</label>
              <input 
                required
                type="password"
                placeholder=""
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc] transition-colors"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-8 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('confirm_modify')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function VerificationForm({ onBack, userData }: { onBack: () => void, userData: any }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState<'id' | 'license'>('id');
  const [formData, setFormData] = useState({
    realName: userData?.verification?.realName || '',
    phone: userData?.verification?.phone || '',
    idNumber: userData?.verification?.idNumber || ''
  });
  const [files, setFiles] = useState<{front: File | null, back: File | null}>({
    front: null,
    back: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.front || !files.back) {
      alert(t('please_upload_photos'));
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        verification: {
          ...formData,
          type,
          status: 'pending',
          submittedAt: new Date().toISOString()
        }
      });
      setSuccess(true);
      setTimeout(onBack, 2000);
    } catch (error) {
      alert(t('submit_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24 overflow-y-auto">
      <div className="flex items-center px-4 py-3 bg-white border-b sticky top-0 z-10">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('identity_verification')}</h2>
      </div>

      <div className="p-4">
        {success ? (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('submit_success')}</h3>
            <p className="text-gray-500 leading-relaxed">{t('verification_pending_desc')}</p>
          </div>
        ) : userData?.verification?.status === 'pending' ? (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-[#0166fc] animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('under_review')}</h3>
            <p className="text-gray-500 leading-relaxed">{t('review_pending_desc')}</p>
            <button onClick={onBack} className="mt-8 text-[#0166fc] font-bold">{t('back_to_profile')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wider">{t('id_type')}</p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setType('id')}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${type === 'id' ? 'border-[#0166fc] bg-[#0166fc]/5 text-[#0166fc]' : 'border-gray-100 text-gray-400'}`}
                >
                  {t('id_card')}
                </button>
                <button 
                  type="button"
                  onClick={() => setType('license')}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${type === 'license' ? 'border-[#0166fc] bg-[#0166fc]/5 text-[#0166fc]' : 'border-gray-100 text-gray-400'}`}
                >
                  {t('driver_license')}
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">{t('basic_info')}</p>
              <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">{t('real_name')}</label>
                <input 
                  required
                  type="text"
                  placeholder=""
                  className="w-full h-12 bg-gray-50 rounded-xl px-4 outline-none focus:ring-2 focus:ring-[#0166fc]/20 transition-all font-medium"
                  value={formData.realName}
                  onChange={e => setFormData({...formData, realName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">{t('phone_number')}</label>
                <input 
                  required
                  type="tel"
                  placeholder=""
                  className="w-full h-12 bg-gray-50 rounded-xl px-4 outline-none focus:ring-2 focus:ring-[#0166fc]/20 transition-all font-medium"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">{t('id_number')}</label>
                <input 
                  required
                  type="text"
                  placeholder=""
                  className="w-full h-12 bg-gray-50 rounded-xl px-4 outline-none focus:ring-2 focus:ring-[#0166fc]/20 transition-all font-medium"
                  value={formData.idNumber}
                  onChange={e => setFormData({...formData, idNumber: e.target.value})}
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">{t('id_photo')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-center text-gray-400 font-bold">{t('front_side')}</p>
                  <label className="aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-gray-100 transition-all overflow-hidden relative">
                    {files.front ? (
                      <img src={URL.createObjectURL(files.front)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-gray-300" />
                        <span className="text-[10px] text-gray-400 font-bold">{t('click_to_upload')}</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={e => setFiles({...files, front: e.target.files?.[0] || null})} />
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-center text-gray-400 font-bold">{t('back_side')}</p>
                  <label className="aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-gray-100 transition-all overflow-hidden relative">
                    {files.back ? (
                      <img src={URL.createObjectURL(files.back)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-gray-300" />
                        <span className="text-[10px] text-gray-400 font-bold">{t('click_to_upload')}</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={e => setFiles({...files, back: e.target.files?.[0] || null})} />
                  </label>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-[10px] text-yellow-700 leading-relaxed">
                  {t('verification_tip')}
                </p>
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#0166fc] text-white h-14 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-4 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('submit_verification')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
