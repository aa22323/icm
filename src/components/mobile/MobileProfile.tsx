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
  Upload,
  ChevronDown
} from "lucide-react";

type SubView = 'main' | 'deposit' | 'withdraw' | 'assets' | 'orders' | 'bankCard' | 'cryptoWallet' | 'profile' | 'security' | 'verification' | 'about' | 'contact' | 'language' | 'tradingPassword' | 'loginPassword' | 'admin';

export default function MobileProfile({ onLogout, onTabChange, isLocalDemo }: { onLogout: () => void, onTabChange: (tab: string, params?: any) => void, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  const [userBalance, setUserBalance] = useState<number | null>(isLocalDemo ? 10000 : null);
  const [activeSubView, setActiveSubView] = useState<SubView>('main');
  const [userData, setUserData] = useState<any>(isLocalDemo ? { realName: 'Local Guest', memberId: '88888888', balance: 10000 } : null);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    if (isLocalDemo) return;
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setUserBalance(data.balance);
          
          if (!data.memberId) {
            const randomId = Math.floor(10000000 + Math.random() * 90000000).toString();
            updateDoc(userRef, { memberId: randomId }).catch(() => {});
          }
        }
      }, (err) => console.warn("User data fetch failed:", err));

      const unsubSettings = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
        if (docSnap.exists()) setSystemSettings(docSnap.data());
      }, (err) => console.warn("Settings fetch failed:", err));

      return () => {
        unsubUser();
        unsubSettings();
      };
    }
  }, [isLocalDemo]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || (!auth.currentUser && !isLocalDemo)) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      if (isLocalDemo) {
        setUserData({ ...userData, avatar: base64String });
        return;
      }
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
    if (!isLocalDemo) await auth.signOut();
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
        return <BankCardForm onBack={() => setActiveSubView('main')} userData={userData} isLocalDemo={isLocalDemo} />;
      case 'tradingPassword':
        return <TradingPasswordForm onBack={() => setActiveSubView('main')} userData={userData} isLocalDemo={isLocalDemo} />;
      case 'loginPassword':
        return <LoginPasswordForm onBack={() => setActiveSubView('main')} userData={userData} isLocalDemo={isLocalDemo} />;
      case 'verification':
        return <VerificationForm onBack={() => setActiveSubView('main')} userData={userData} isLocalDemo={isLocalDemo} />;
      case 'assets':
        return (
          <AssetsView 
            onBack={() => setActiveSubView('main')} 
            balance={userBalance || 0} 
            onDeposit={() => setActiveSubView('deposit')}
            onWithdraw={() => setActiveSubView('withdraw')}
            isLocalDemo={isLocalDemo}
          />
        );
      case 'deposit':
        return <DepositView onBack={() => setActiveSubView('main')} systemSettings={systemSettings} isLocalDemo={isLocalDemo} />;
      case 'withdraw':
        return (
          <WithdrawView 
            onBack={() => setActiveSubView('main')} 
            onAddBankCard={() => setActiveSubView('bankCard')} 
            balance={userBalance || 0} 
            userData={userData} 
            isLocalDemo={isLocalDemo}
          />
        );
      case 'main':
        return null;
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
          <p className="text-gray-500 text-[13px] truncate">{isLocalDemo ? 'local_guest@cal-trading.com' : (auth.currentUser?.email || 'guest_user@gmail.com')}</p>
        </div>
      </div>

      {isLocalDemo && (
        <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-500" />
          <p className="text-xs text-blue-600 font-medium leading-tight">
            You are in <b>Local Demo Mode</b>. Your data is saved only on this device.
          </p>
        </div>
      )}

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

function BankCardForm({ onBack, userData, isLocalDemo }: { onBack: () => void, userData: any, isLocalDemo?: boolean }) {
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
    if (!auth.currentUser && !isLocalDemo) return;
    
    setLoading(true);
    try {
      if (!isLocalDemo) {
        const userRef = doc(db, "users", auth.currentUser!.uid);
        await updateDoc(userRef, { bankInfo: formData });
      }
      setSuccess(true);
      setTimeout(onBack, 1500);
    } catch (error) {
      alert("Failed to save information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('bind_bank_card')}</h2>
      </div>
      <div className="p-6">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">{t('bind_success')}</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label={t('bank_name')} value={formData.bankName} onChange={v => setFormData({...formData, bankName: v})} />
            <Input label={t('bank_card_number')} value={formData.cardNumber} onChange={v => setFormData({...formData, cardNumber: v})} />
            <Input label={t('cardholder_name')} value={formData.holderName} onChange={v => setFormData({...formData, holderName: v})} />
            <Input label={t('branch_name')} value={formData.branch} onChange={v => setFormData({...formData, branch: v})} />
            <button type="submit" disabled={loading} className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-8 flex items-center justify-center">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : t('confirm_bind')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AssetsView({ onBack, balance, onDeposit, onWithdraw, isLocalDemo }: { onBack: () => void, balance: number, onDeposit: () => void, onWithdraw: () => void, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isLocalDemo);

  useEffect(() => {
    if (isLocalDemo || !auth.currentUser) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "transactions"), where("uid", "==", auth.currentUser.uid), limit(20));
    return onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      txs.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setTransactions(txs);
      setLoading(false);
    });
  }, [isLocalDemo]);

  return (
    <div className="flex flex-col h-full bg-white pb-24 overflow-y-auto">
      <div className="flex items-center px-4 py-3 border-b sticky top-0 bg-white z-10">
        <button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
        <h2 className="flex-1 text-center font-bold text-lg pr-6">{t('transaction_records')}</h2>
      </div>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{t('account_assets')}</h3>
          <div className="flex gap-2">
            <button onClick={onDeposit} className="bg-yellow-400 text-black px-4 py-1.5 rounded-md text-sm font-bold">{t('deposit')}</button>
            <button onClick={onWithdraw} className="bg-yellow-400 text-black px-4 py-1.5 rounded-md text-sm font-bold">{t('withdraw')}</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-6">
          <AssetItem label={t('current_balance')} value={balance} />
          <AssetItem label={t('available_funds')} value={balance} />
          <AssetItem label={t('equity_label')} value={balance} />
          <AssetItem label={t('frozen_assets')} value={0} />
        </div>
      </div>
      <div className="bg-[#f8f8f8] px-4 py-2 border-b flex items-center gap-1">
        <div className="w-1 h-4 bg-yellow-400" /><h3 className="text-sm font-bold text-gray-800">{t('transaction_records')}</h3>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-4 px-4 py-3 border-b text-[11px] text-gray-400 font-medium">
          <div>{t('asset_type')}</div><div>{t('operation_type')}</div><div>{t('symbol_code')}</div><div className="text-right">{t('amount')}</div>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div> : 
           transactions.length === 0 ? <div className="flex flex-col items-center justify-center py-10 text-gray-400"><Info className="h-8 w-8 mb-2 opacity-20" /><p className="text-xs">{t('no_records')}</p></div> :
           transactions.map(tx => (
            <div key={tx.id} className="px-4 py-4">
              <div className="grid grid-cols-4 text-[13px] font-bold text-gray-700">
                <div className="truncate">{tx.assetType || 'SYSTEM'}</div>
                <div className={`truncate ${tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'}`}>{tx.type}</div>
                <div className="truncate text-gray-400 font-normal">{tx.symbol || '--'}</div>
                <div className={`text-right ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DepositView({ onBack, systemSettings, isLocalDemo }: { onBack: () => void, systemSettings: any, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!auth.currentUser && !isLocalDemo) return;
    const depositAmount = parseFloat(amount);
    try {
      if (!isLocalDemo) {
        const userRef = doc(db, "users", auth.currentUser!.uid);
        await updateDoc(userRef, { balance: increment(depositAmount) });
        await addDoc(collection(db, "transactions"), { uid: auth.currentUser!.uid, type: 'DEPOSIT', amount: depositAmount, status: 'COMPLETED', createdAt: serverTimestamp(), assetType: 'SYSTEM' });
      }
      alert(t('deposit_success'));
      onBack();
    } catch (error) {
      alert(t('deposit_failed'));
    }
  };

  if (selectedMethod) {
    return (
      <div className="flex flex-col h-full bg-[#f8f8f8] pb-24">
        <div className="flex items-center px-4 py-3 bg-white border-b"><button onClick={() => setSelectedMethod(null)} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{t('deposit')}</h2></div>
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-4">{t('scan_qr_to_transfer')}</p>
            <div className="w-48 h-48 bg-gray-50 rounded-2xl mb-6 flex items-center justify-center border p-2">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=demo_address&color=0166fc`} alt="QR" className="w-full h-full object-contain" />
            </div>
            <button onClick={handleDeposit} className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg shadow-lg">{t('i_have_transferred')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24">
      <div className="flex items-center px-4 py-3 bg-white border-b"><button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{t('deposit')}</h2></div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wider">{t('deposit_amount')}</p>
          <input type="number" className="w-full h-16 bg-gray-50 rounded-xl px-4 text-2xl font-black outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
          <button onClick={() => setSelectedMethod('usdt')} disabled={!amount} className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg mt-4 disabled:opacity-50">{t('deposit_now')}</button>
        </div>
      </div>
    </div>
  );
}

function WithdrawView({ onBack, onAddBankCard, balance, userData, isLocalDemo }: { onBack: () => void, onAddBankCard: () => void, balance: number, userData: any, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');

  const handleWithdraw = async () => {
    if (!auth.currentUser && !isLocalDemo) return;
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > balance) { alert(t('insufficient_balance')); return; }
    try {
      if (!isLocalDemo) {
        const userRef = doc(db, "users", auth.currentUser!.uid);
        await updateDoc(userRef, { balance: increment(-withdrawAmount) });
        await addDoc(collection(db, "withdrawals"), { uid: auth.currentUser!.uid, amount: withdrawAmount, status: 'pending', createdAt: serverTimestamp() });
      }
      alert(t('withdraw_submitted'));
      onBack();
    } catch (error) {
      alert(t('withdraw_failed'));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24">
      <div className="flex items-center px-4 py-3 bg-white border-b"><button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{t('withdraw_title')}</h2></div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4"><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('available_balance')}</p><p className="text-lg font-black text-[#0166fc]">${balance.toLocaleString()}</p></div>
          <input type="number" className="w-full h-16 bg-gray-50 rounded-xl px-4 text-xl font-bold outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <button onClick={handleWithdraw} disabled={!amount} className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg mt-4 disabled:opacity-50">{t('submit_withdraw')}</button>
      </div>
    </div>
  );
}

function TradingPasswordForm({ onBack, userData, isLocalDemo }: { onBack: () => void, userData: any, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocalDemo) {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, { tradingPassword: password });
    }
    alert(t('set_success'));
    onBack();
  };
  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b"><button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{t('set_trading_password')}</h2></div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <Input label={t('new_trading_password')} value={password} onChange={setPassword} type="password" />
        <button type="submit" className="w-full bg-[#0166fc] text-white h-14 rounded-xl font-bold text-lg">{t('confirm_set')}</button>
      </form>
    </div>
  );
}

function LoginPasswordForm({ onBack, userData, isLocalDemo }: { onBack: () => void, userData: any, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b"><button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{t('change_login_password_title')}</h2></div>
      <div className="p-10 text-center text-gray-400">{t('feature_under_development')}</div>
    </div>
  );
}

function VerificationForm({ onBack, userData, isLocalDemo }: { onBack: () => void, userData: any, isLocalDemo?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b"><button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{t('identity_verification')}</h2></div>
      <div className="p-10 text-center text-gray-400">{t('feature_under_development')}</div>
    </div>
  );
}

function PlaceholderView({ title, onBack }: { title: string, onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b"><button onClick={onBack} className="p-1 -ml-1"><ChevronLeft className="h-6 w-6 text-gray-800" /></button><h2 className="flex-1 text-center font-bold text-lg pr-6">{title}</h2></div>
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-gray-400">
        <Info className="h-10 w-10 mb-4 opacity-20" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}{t('feature_under_development')}</h3>
        <button onClick={onBack} className="mt-8 text-[#0166fc] font-bold">{t('back_to_profile')}</button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>
      <input type={type} className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none focus:border-[#0166fc]" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function AssetItem({ label, value }: { label: string, value: number }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold text-black">{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 active:opacity-60">
      <div className="h-6 flex items-center justify-center">{icon}</div>
      <span className="text-[13px] font-medium text-gray-700">{label}</span>
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 border-b last:border-none active:bg-gray-50">
      <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-gray-600" /><span className="text-[15px] text-gray-800">{label}</span></div>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </button>
  );
}

function getViewTitle(view: SubView, t: any): string {
  const titles: Record<string, string> = {
    deposit: t('deposit'), withdraw: t('withdraw'), assets: t('assets'), orders: t('orders'), cryptoWallet: t('crypto_wallet_title'), profile: t('edit_profile'), security: t('security_settings'), verification: t('identity_verification'), about: t('about_us'), contact: t('contact_us'), language: t('language_switch_title'), tradingPassword: t('set_trading_password'), loginPassword: t('change_login_password')
  };
  return titles[view] || t('function_details');
}

