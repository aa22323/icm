import React, { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { marketService } from "../../services/marketService";
import { PRODUCTS } from "../../constants";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { 
  Users, 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  ChevronLeft, 
  Save, 
  X,
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Search,
  Settings,
  Image as ImageIcon,
  Newspaper,
  Loader2,
  User,
  RefreshCw,
  Edit2,
  Upload,
  ClipboardList
} from "lucide-react";

type AdminTab = 'dashboard' | 'users' | 'market' | 'finance' | 'content' | 'settings' | 'orders';

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [marketControls, setMarketControls] = useState<any[]>([]);
  const [marketRanges, setMarketRanges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editingUser, setEditingUser] = useState<any>(null);
  const [marketControlModal, setMarketControlModal] = useState<any>(null);
  const [marketRangeModal, setMarketRangeModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Stats for dashboard
  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
  const recentUsers = [...users].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);
  const recentWithdrawals = [...withdrawals].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);

  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', content: '', image: '' });

  useEffect(() => {
    setLoading(true);
    // Fetch Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Admin Users Error:", err));

    // Fetch Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Initialize settings if missing
        setDoc(doc(db, "settings", "system"), {
          banners: [],
          depositInfo: { cryptoAddress: "", erc20Address: "", bankInfo: "" },
          withdrawConfig: { minAmount: 10, fee: 0 }
        }).catch(err => console.error("Init Settings Error:", err));
      }
    }, (err) => console.error("Admin Settings Error:", err));

    // Fetch Market Controls
    const unsubMarket = onSnapshot(collection(db, "market_controls"), (snap) => {
      setMarketControls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Admin Market Error:", err));

    // Fetch Market Ranges
    const unsubRanges = onSnapshot(collection(db, "market_ranges"), (snap) => {
      setMarketRanges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Admin Ranges Error:", err));

    // Fetch Withdrawals
    const unsubWithdrawals = onSnapshot(collection(db, "withdrawals"), (snap) => {
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Admin Withdrawals Error:", err));

    // Fetch News
    const unsubNews = onSnapshot(collection(db, "news"), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Admin News Error:", err));

    // Fetch Orders
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Admin Orders Error:", err));

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => {
      clearTimeout(timer);
      unsubUsers();
      unsubSettings();
      unsubMarket();
      unsubRanges();
      unsubWithdrawals();
      unsubNews();
      unsubOrders();
    };
  }, []);

  const handleDeleteUser = (userId: string, email: string) => {
    setConfirmModal({
      title: "确认删除",
      message: `确定要删除用户 ${email || '匿名用户'} 吗？此操作不可恢复！`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", userId));
          setAdminStatus({ msg: "用户已删除", type: 'success' });
        } catch (err) {
          setAdminStatus({ msg: "删除失败", type: 'error' });
        }
        setConfirmModal(null);
      }
    });
  };

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, "users", userId), { balance: newBalance });
      setAdminStatus({ msg: "余额已更新！", type: 'success' });
    } catch (err) {
      setAdminStatus({ msg: "更新余额失败", type: 'error' });
    }
  };

  const [adminStatus, setAdminStatus] = useState<{msg: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    if (adminStatus) {
      const timer = setTimeout(() => setAdminStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [adminStatus]);

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      await setDoc(doc(db, "settings", "system"), newSettings);
      setAdminStatus({ msg: "设置已保存！", type: 'success' });
    } catch (err) {
      setAdminStatus({ msg: "保存失败：文件可能过大，请压缩后再试", type: 'error' });
      console.error(err);
    }
  };

  const resizeImage = (base64Str: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // 使用 0.7 的质量进行 JPEG 压缩
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAdminStatus({ msg: "正在处理并优化图片...", type: 'success' });

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      // 自动调整尺寸：最大宽度 1200px
      const processedBase64 = await resizeImage(base64String, 1200, 1200);
      
      const img = new Image();
      img.onload = () => {
        handleUpdateSettings({ 
          ...settings, 
          banners: [...(settings?.banners || []), { 
            image: processedBase64, 
            title: '新轮播图',
            width: img.width,
            height: img.height,
            size: (processedBase64.length / 1024 * 0.75).toFixed(2) + 'KB'
          }] 
        });
      };
      img.src = processedBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleNewsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAdminStatus({ msg: "正在优化资讯图片...", type: 'success' });

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      // 自动调整尺寸：最大宽度 1000px
      const processedBase64 = await resizeImage(base64String, 1000, 1000);

      const img = new Image();
      img.onload = () => {
        setNewNews({ 
          ...newNews, 
          image: processedBase64,
          width: img.width,
          height: img.height,
          size: (processedBase64.length / 1024 * 0.75).toFixed(2) + 'KB'
        } as any);
        setAdminStatus({ msg: "图片优化完成", type: 'success' });
      };
      img.src = processedBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNews = async () => {
    if (!newNews.title || !newNews.content || !newNews.image) {
      setAdminStatus({ msg: "请填写完整资讯内容", type: 'error' });
      return;
    }
    try {
      await addDoc(collection(db, "news"), {
        title: newNews.title,
        content: newNews.content,
        image: newNews.image,
        width: (newNews as any).width,
        height: (newNews as any).height,
        fileSize: (newNews as any).size,
        time: new Date().toLocaleDateString(),
        createdAt: serverTimestamp()
      });
      setShowNewsModal(false);
      setNewNews({ title: '', content: '', image: '' });
      setAdminStatus({ msg: "资讯发布成功！", type: 'success' });
    } catch (err) {
      setAdminStatus({ msg: "发布失败，请检查网络或图片大小", type: 'error' });
    }
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'trc20' | 'erc20') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const field = type === 'trc20' ? 'cryptoQR' : 'erc20QR';
      setSettings({
        ...settings,
        depositInfo: {
          ...(settings?.depositInfo || {}),
          [field]: base64String
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleApproveWithdrawal = async (req: any) => {
    try {
      await updateDoc(doc(db, "withdrawals", req.id), { status: 'approved' });
      setAdminStatus({ msg: "提现已批准！", type: 'success' });
    } catch (err) {
      setAdminStatus({ msg: "批准失败", type: 'error' });
    }
  };

  const handleSetMarketControl = async (symbol: string) => {
    try {
      const staticProduct = PRODUCTS.find(p => p.symbol === symbol);
      const fallbackPrice = staticProduct ? staticProduct.price : 0;
      
      const data = await marketService.getRealTimePrice(symbol);
      const currentPrice = data?.price ? parseFloat(data.price) : fallbackPrice;
      setMarketControlModal({ symbol, currentPrice });
    } catch (err) {
      const staticProduct = PRODUCTS.find(p => p.symbol === symbol);
      setMarketControlModal({ symbol, currentPrice: staticProduct ? staticProduct.price : 0 });
    }
  };

  const handleSetMarketRange = async (symbol: string) => {
    try {
      const staticProduct = PRODUCTS.find(p => p.symbol === symbol);
      const fallbackPrice = staticProduct ? staticProduct.price : 0;
      
      const data = await marketService.getRealTimePrice(symbol);
      const currentPrice = data?.price ? parseFloat(data.price) : fallbackPrice;
      setMarketRangeModal({ symbol, currentPrice });
    } catch (err) {
      const staticProduct = PRODUCTS.find(p => p.symbol === symbol);
      setMarketRangeModal({ symbol, currentPrice: staticProduct ? staticProduct.price : 0 });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.uid?.includes(searchTerm) ||
    u.remark?.toLowerCase().includes(searchTerm.toLowerCase())
  ).map(u => ({
    ...u,
    orderCount: orders.filter(o => o.userId === u.uid).length
  }));

  return (
    <div className="flex h-screen bg-[#f4f7f9] overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <Settings className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-lg tracking-tight">系统管理</h1>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">V2.4 Pro</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <SidebarItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20}/>} 
            label="控制台" 
          />
          <SidebarItem 
            active={activeTab === 'market'} 
            onClick={() => setActiveTab('market')} 
            icon={<TrendingUp size={20}/>} 
            label="产品管理" 
          />
          <SidebarItem 
            active={activeTab === 'finance'} 
            onClick={() => setActiveTab('finance')} 
            icon={<Wallet size={20}/>} 
            label="财务管理" 
          />
          <SidebarItem 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
            icon={<ClipboardList size={20}/>} 
            label="持仓管理" 
          />
          <SidebarItem 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<Users size={20}/>} 
            label="会员管理" 
          />
          <SidebarItem 
            active={activeTab === 'content'} 
            onClick={() => setActiveTab('content')} 
            icon={<Newspaper size={20}/>} 
            label="资讯管理" 
          />
          <SidebarItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={20}/>} 
            label="系统设置" 
          />
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-bold text-sm"
          >
            <ChevronLeft size={20} />
            退出后台
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex-1">
            {adminStatus && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
                adminStatus.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {adminStatus.type === 'success' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                {adminStatus.msg}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">管理员</div>
              <div className="text-[10px] text-gray-400 font-mono">oopqwe001@gmail.com</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
              <p className="text-sm text-gray-400 font-bold">正在同步云端数据...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="总会员数" value={users.length} unit="人" color="blue" />
                    <StatCard label="总余额" value={totalBalance.toLocaleString()} unit="¥" color="green" />
                    <StatCard label="入金待办" value={0} unit="件" color="orange" />
                    <StatCard label="出金待办" value={pendingWithdrawals} unit="件" color="red" />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                      <div className="w-2 h-6 bg-red-600 rounded-full" />
                      快速操作
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button 
                        onClick={() => {
                          setActiveTab('content');
                          setShowNewsModal(true);
                        }}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 text-blue-600 rounded-3xl hover:bg-blue-100 transition-all group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <span className="font-black text-sm">发布资讯</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('market')}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 text-purple-600 rounded-3xl hover:bg-purple-100 transition-all group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <TrendingUp size={24} />
                        </div>
                        <span className="font-black text-sm">产品调控</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('finance')}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-green-50 text-green-600 rounded-3xl hover:bg-green-100 transition-all group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Wallet size={24} />
                        </div>
                        <span className="font-black text-sm">财务审核</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-orange-50 text-orange-600 rounded-3xl hover:bg-orange-100 transition-all group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Settings size={24} />
                        </div>
                        <span className="font-black text-sm">系统设置</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Transactions */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                          <TrendingUp size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">最近交易</h3>
                      </div>
                      <div className="space-y-4">
                        {recentWithdrawals.map((w, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                <Plus size={18} className="rotate-45" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">出金申请 - ¥{w.amount?.toLocaleString()}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{new Date(w.createdAt?.seconds * 1000).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black ${w.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {w.status === 'approved' ? '已处理' : '待审核'}
                            </div>
                          </div>
                        ))}
                        {recentWithdrawals.length === 0 && <div className="text-center py-10 text-gray-300 font-bold">暂无交易记录</div>}
                      </div>
                    </div>

                    {/* New Members */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                          <Users size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">新规会员</h3>
                      </div>
                      <div className="space-y-4">
                        {recentUsers.map((u, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-purple-100 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-400 font-black uppercase shadow-sm">
                                {u.email?.[0] || 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 truncate max-w-[200px]">{u.email || '匿名用户'}</div>
                                <div className="text-[11px] text-gray-400 font-mono">ID: {u.uid?.slice(-5)}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-green-600">¥{u.balance?.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900">持仓管理 ({orders.length})</h2>
                    <div className="relative w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input 
                        type="text" 
                        placeholder="搜索会员或产品..." 
                        className="w-full bg-white border-none shadow-sm rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">会员信息</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">产品/方向</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">手数/保证金</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">入场价</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">盈利情况</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">状态</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">下单时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {orders.filter(o => {
                            const user = users.find(u => u.uid === o.userId);
                            return (user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                   o.symbol?.toLowerCase().includes(searchTerm.toLowerCase()));
                          }).map(o => {
                            const user = users.find(u => u.uid === o.userId);
                            return (
                              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                                      {user?.email?.[0] || 'U'}
                                    </div>
                                    <div>
                                      <div className="text-sm font-black text-gray-900">{user?.email || '未知用户'}</div>
                                      <div className="text-[10px] text-gray-400 font-mono">UID: {o.userId?.slice(-8)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col">
                                    <div className="text-sm font-black text-gray-900">{o.symbol}</div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${o.type === 'buy' ? 'text-blue-600' : 'text-red-600'}`}>
                                      {o.type === 'buy' ? '做多 (BUY)' : '做空 (SELL)'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="text-sm font-black text-gray-900">{o.lots} 手</div>
                                  <div className="text-[10px] text-gray-400 font-bold">保证金: ¥{o.margin?.toLocaleString()}</div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="text-sm font-black text-gray-900">{o.entryPrice?.toLocaleString()}</div>
                                </td>
                                <td className="px-8 py-6">
                                  {o.status === 'closed' ? (
                                    <div className={`text-sm font-black ${o.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {o.pnl >= 0 ? '+' : '-'}{Math.abs(o.pnl || 0).toLocaleString()}
                                    </div>
                                  ) : (
                                    <div className="text-sm font-bold text-blue-500 animate-pulse">进行中...</div>
                                  )}
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col gap-1">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${o.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                      {o.status === 'open' ? '持仓中' : '已平仓'}
                                    </span>
                                    {o.isLiquidated && (
                                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600">
                                        已爆仓
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-gray-500">
                                    {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : 'N/A'}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-black text-gray-900">会员一覧 ({users.length})</h2>
                      <button 
                        onClick={() => window.location.reload()}
                        className="p-2 bg-white rounded-xl text-gray-400 hover:text-blue-600 shadow-sm transition-all active:rotate-180"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    <div className="relative w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input 
                        type="text" 
                        placeholder="搜索会员邮箱或UID..." 
                        className="w-full bg-white border-none shadow-sm rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">会员详细</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">权限</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">残高</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">备注</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">交易记录</th>
                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">ADMIN.ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredUsers.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400 font-black text-lg uppercase shrink-0">
                                    {u.email?.[0] || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-black text-gray-900 text-base">{u.email || '匿名用户'}</div>
                                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {u.uid?.slice(-8)} | 状态: <span className="text-green-500 font-bold">有效</span></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {u.role === 'admin' ? '管理者' : '一般会员'}
                                </span>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-lg font-black text-green-600">¥ {u.balance?.toLocaleString()}</div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-sm font-bold text-gray-500">{u.remark || '-'}</div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-sm font-bold text-gray-600">注文数: <span className="text-gray-900 font-black">{u.orderCount || 0}</span></div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-4">
                                  <button 
                                    onClick={() => setEditingUser(u)}
                                    className="text-blue-600 font-black text-sm hover:underline underline-offset-4"
                                  >
                                    编辑
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    className="text-red-500 font-black text-sm hover:underline underline-offset-4"
                                  >
                                    删除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="px-10 py-8 border-b flex items-center justify-between bg-gray-50/50">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">编辑会员资料</h3>
                        <p className="text-sm text-gray-400 font-medium mt-1">UID: {editingUser.uid}</p>
                      </div>
                      <button 
                        onClick={() => setEditingUser(null)}
                        className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all shadow-sm border border-transparent hover:border-gray-100"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="p-10 space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">账户余额 (¥)</label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">¥</span>
                            <input 
                              type="number" 
                              className="w-full bg-gray-50 border-none rounded-2xl py-5 pl-12 pr-6 text-xl font-black outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                              defaultValue={editingUser.balance}
                              id="edit-balance"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">会员权限</label>
                          <select 
                            className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-base font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all appearance-none"
                            defaultValue={editingUser.role || 'user'}
                            id="edit-role"
                          >
                            <option value="user">一般会员</option>
                            <option value="admin">管理者</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">管理员备注 (所属代理/来源)</label>
                        <input 
                          type="text" 
                          className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-base font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                          defaultValue={editingUser.remark || ''}
                          placeholder="例如: 张三代理 / 抖音来源"
                          id="edit-remark"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">登录密码</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="text" 
                            className="flex-1 bg-gray-50 border-none rounded-2xl py-5 px-6 text-base font-mono font-bold outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                            defaultValue={editingUser.password}
                            id="edit-password"
                          />
                          <button 
                            onClick={() => {
                              const pass = Math.random().toString(36).slice(-8);
                              (document.getElementById('edit-password') as HTMLInputElement).value = pass;
                            }}
                            className="px-6 py-5 bg-white border rounded-2xl font-black text-sm text-gray-500 hover:text-red-600 hover:border-red-100 transition-all shadow-sm active:scale-95"
                          >
                            重置
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-4">
                        <button 
                          onClick={async () => {
                            const balance = parseFloat((document.getElementById('edit-balance') as HTMLInputElement).value);
                            const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
                            const password = (document.getElementById('edit-password') as HTMLInputElement).value;
                            const remark = (document.getElementById('edit-remark') as HTMLInputElement).value;
                            
                            try {
                              await updateDoc(doc(db, "users", editingUser.id), {
                                balance,
                                role,
                                password,
                                remark
                              });
                              setAdminStatus({ msg: "更新成功！", type: 'success' });
                              setEditingUser(null);
                            } catch (err) {
                              setAdminStatus({ msg: "更新失败", type: 'error' });
                            }
                          }}
                          className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100 active:scale-95 transition-all"
                        >
                          保存修改
                        </button>
                        <button 
                          onClick={() => setEditingUser(null)}
                          className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-lg active:scale-95 transition-all"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {marketRangeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">设置当日波动范围</h3>
                        <p className="text-sm text-blue-600 font-bold mt-1">产品: {marketRangeModal.symbol}</p>
                      </div>
                      <button 
                        onClick={() => setMarketRangeModal(null)}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">当前参考价格</div>
                        <div className="text-2xl font-black text-blue-600">
                          {marketRangeModal.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">最低价格 (下限)</label>
                          <input 
                            type="number" 
                            step="0.0001"
                            placeholder="例如: 4600"
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-lg font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            id="range-min-price"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">最高价格 (上限)</label>
                          <input 
                            type="number" 
                            step="0.0001"
                            placeholder="例如: 4800"
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-lg font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            id="range-max-price"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex gap-4">
                        <button 
                          onClick={async () => {
                            const minPrice = (document.getElementById('range-min-price') as HTMLInputElement).value;
                            const maxPrice = (document.getElementById('range-max-price') as HTMLInputElement).value;
                            
                            if (!minPrice || !maxPrice) {
                              setAdminStatus({ msg: "请填写完整价格范围", type: 'error' });
                              return;
                            }

                            try {
                              // Delete existing range for this symbol first
                              const existing = marketRanges.find(r => r.symbol === marketRangeModal.symbol);
                              if (existing) {
                                await deleteDoc(doc(db, "market_ranges", existing.id));
                              }

                              await addDoc(collection(db, "market_ranges"), {
                                symbol: marketRangeModal.symbol,
                                minPrice: parseFloat(minPrice),
                                maxPrice: parseFloat(maxPrice),
                                createdAt: serverTimestamp(),
                                isActive: true
                              });
                              setAdminStatus({ msg: "波动范围设置成功！", type: 'success' });
                              setMarketRangeModal(null);
                            } catch (err) {
                              setAdminStatus({ msg: "设置失败", type: 'error' });
                            }
                          }}
                          className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-blue-100 active:scale-95 transition-all"
                        >
                          确认设置范围
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {marketControlModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">设置行情干预</h3>
                        <p className="text-sm text-red-600 font-bold mt-1">产品: {marketControlModal.symbol}</p>
                      </div>
                      <button 
                        onClick={() => setMarketControlModal(null)}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-[10px] text-red-400 font-black uppercase tracking-widest">当前实时价格</div>
                          <button 
                            onClick={() => handleSetMarketControl(marketControlModal.symbol)}
                            className="p-1 hover:bg-red-100 rounded-lg text-red-400 transition-all"
                            title="刷新价格"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                        <div className="text-2xl font-black text-red-600">
                          {marketControlModal.currentPrice > 0 ? 
                            marketControlModal.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : 
                            '获取中...'
                          }
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">目标价格</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.0001"
                            placeholder="例如: 4866"
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-lg font-black outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                            id="control-target-price"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold ml-1">输入您希望行情到达的最终价格</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">持续时间 (分钟)</label>
                        <input 
                          type="number" 
                          placeholder="请输入干预持续的分钟数"
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-lg font-black outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                          id="control-duration"
                        />
                      </div>

                      <div className="pt-4 flex gap-4">
                        <button 
                          onClick={async () => {
                            const targetPrice = (document.getElementById('control-target-price') as HTMLInputElement).value;
                            const duration = (document.getElementById('control-duration') as HTMLInputElement).value;
                            
                            if (!targetPrice || !duration) {
                              setAdminStatus({ msg: "请填写完整信息", type: 'error' });
                              return;
                            }

                            try {
                              await addDoc(collection(db, "market_controls"), {
                                symbol: marketControlModal.symbol,
                                targetPrice: parseFloat(targetPrice),
                                startPrice: marketControlModal.currentPrice,
                                durationMinutes: parseInt(duration),
                                startTime: serverTimestamp(),
                                isActive: true
                              });
                              setAdminStatus({ msg: "设置成功！", type: 'success' });
                              setMarketControlModal(null);
                            } catch (err) {
                              setAdminStatus({ msg: "设置失败", type: 'error' });
                            }
                          }}
                          className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-red-100 active:scale-95 transition-all"
                        >
                          确认开启干预
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'market' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900">产品管理</h2>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <RefreshCw size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">当日波动范围设定</h3>
                        <p className="text-sm text-gray-400 font-medium">设定产品在当天的最高和最低波动区间。</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      {PRODUCTS.map(product => (
                        <button 
                          key={product.symbol}
                          onClick={() => handleSetMarketRange(product.symbol)}
                          className="group relative bg-gray-50 p-6 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <div className="relative z-10">
                            <div className="font-black text-xl text-gray-900 mb-1">{product.symbol}</div>
                            <div className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              <Plus size={10} /> 设定范围
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">当前生效的范围控制</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketRanges.map(r => (
                          <div key={r.id} className="bg-gray-50 p-6 rounded-2xl border flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <RefreshCw size={20} />
                              </div>
                              <div>
                                <div className="font-black text-lg text-gray-900">{r.symbol}</div>
                                <div className="text-xs font-bold text-blue-500">
                                  区间: {r.minPrice?.toLocaleString()} ~ {r.maxPrice?.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => setConfirmModal({
                                title: "确认删除",
                                message: `确定要删除 ${r.symbol} 的波动范围设置吗？`,
                                onConfirm: async () => {
                                  try {
                                    await deleteDoc(doc(db, "market_ranges", r.id));
                                    setAdminStatus({ msg: "已删除", type: 'success' });
                                  } catch (err) {
                                    setAdminStatus({ msg: "删除失败", type: 'error' });
                                  }
                                  setConfirmModal(null);
                                }
                              })} 
                              className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                        {marketRanges.length === 0 && (
                          <div className="col-span-full py-8 text-center text-gray-300 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl">
                            暂无生效的范围控制
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">行情人工干预</h3>
                        <p className="text-sm text-gray-400 font-medium">设置产品在指定时间内缓慢上涨或下跌。</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {PRODUCTS.map(product => (
                        <button 
                          key={product.symbol}
                          onClick={() => handleSetMarketControl(product.symbol)}
                          className="group relative bg-gray-50 p-8 rounded-3xl border border-transparent hover:border-red-100 hover:bg-white hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={64} />
                          </div>
                          <div className="relative z-10">
                            <div className="font-black text-2xl text-gray-900 mb-2">{product.symbol}</div>
                            <div className="inline-flex items-center gap-2 text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-full">
                              <Plus size={12} /> 设置干预
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-2 h-6 bg-red-600 rounded-full" />
                      正在运行的干预
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketControls.map(c => (
                        <div key={c.id} className="bg-gray-50 p-6 rounded-2xl border flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.targetChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {c.targetChange >= 0 ? <TrendingUp size={24} /> : <TrendingUp size={24} className="rotate-180" />}
                            </div>
                            <div>
                              <div className="font-black text-lg text-gray-900">{c.symbol}</div>
                              <div className={`text-xs font-bold ${(!c.targetPrice || c.targetPrice >= (c.startPrice || 0)) ? 'text-green-500' : 'text-red-500'}`}>
                                {c.targetPrice ? (
                                  <>目标价格: {c.targetPrice.toLocaleString()} (从 {c.startPrice?.toLocaleString()})</>
                                ) : (
                                  <>{c.targetChange >= 0 ? '上涨' : '下跌'} {Math.abs(c.targetChange)}%</>
                                )}
                                ，耗时 {c.durationMinutes}分钟
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setConfirmModal({
                              title: "确认删除",
                              message: `确定要停止 ${c.symbol} 的行情干预吗？`,
                              onConfirm: async () => {
                                try {
                                  await deleteDoc(doc(db, "market_controls", c.id));
                                  setAdminStatus({ msg: "干预已停止", type: 'success' });
                                } catch (err) {
                                  setAdminStatus({ msg: "操作失败", type: 'error' });
                                }
                                setConfirmModal(null);
                              }
                            })} 
                            className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      {marketControls.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-300 font-bold border-2 border-dashed rounded-3xl">
                          暂无运行中的干预任务
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-gray-900">财务管理</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Withdrawal Requests */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-2 h-6 bg-blue-600 rounded-full" />
                          提现申请审核
                        </h3>
                        <div className="space-y-4">
                          {withdrawals.filter(w => w.status === 'pending').map(w => (
                            <div key={w.id} className="bg-gray-50 p-6 rounded-3xl border hover:bg-white hover:shadow-lg transition-all group">
                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-gray-400 font-black uppercase shadow-sm">
                                    {w.email?.[0] || 'W'}
                                  </div>
                                  <div>
                                    <div className="font-black text-gray-900">{w.email}</div>
                                    <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{new Date(w.createdAt?.seconds * 1000).toLocaleString()}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-black text-red-600">¥{w.amount?.toLocaleString()}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">申请金额</div>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleApproveWithdrawal(w)}
                                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all"
                                >
                                  <CheckCircle size={18}/> 批准申请
                                </button>
                                <button 
                                  onClick={() => updateDoc(doc(db, "withdrawals", w.id), { status: 'rejected' })}
                                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-95 transition-all"
                                >
                                  <XCircle size={18}/> 拒绝申请
                                </button>
                              </div>
                            </div>
                          ))}
                          {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                            <div className="text-center py-20 text-gray-300 font-bold border-2 border-dashed rounded-3xl">
                              暂无待处理提现申请
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Deposit Config */}
                    <div className="space-y-6">
                      {/* Customer Service Config */}
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-2 h-6 bg-blue-600 rounded-full" />
                          在线客服配置
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">客服链接 (LINE/Telegram)</label>
                            <input 
                              type="text" 
                              placeholder="https://line.me/... 或 https://t.me/..."
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                              value={settings?.customerServiceUrl || ""}
                              onChange={(e) => setSettings({ ...settings, customerServiceUrl: e.target.value })}
                            />
                            <p className="mt-2 text-[10px] text-gray-400 font-bold">用户点击“联系客服”按钮后将跳转至此链接</p>
                          </div>
                          
                          <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">客服二维码 (可选)</label>
                            <label className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden">
                              {settings?.customerServiceQR ? (
                                <img src={settings.customerServiceQR} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <>
                                  <Upload size={24} className="text-gray-300 mb-2" />
                                  <span className="text-xs font-bold text-gray-400">点击上传客服二维码</span>
                                </>
                              )}
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    const base64String = reader.result as string;
                                    const processed = await resizeImage(base64String, 800, 800);
                                    setSettings({ ...settings, customerServiceQR: processed });
                                  };
                                  reader.readAsDataURL(file);
                                }} 
                              />
                            </label>
                          </div>

                          <button 
                            onClick={() => handleUpdateSettings(settings)}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95 transition-all"
                          >
                            <Save size={20}/> 保存客服配置
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-8">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-2 h-6 bg-orange-600 rounded-full" />
                          充值收款配置
                        </h3>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">USDT-TRC20 收款地址</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 transition-all mb-3"
                              value={settings?.depositInfo?.cryptoAddress || ""}
                              onChange={(e) => setSettings({ ...settings, depositInfo: { ...(settings?.depositInfo || {}), cryptoAddress: e.target.value } })}
                            />
                            <div className="flex items-center gap-4">
                              <label className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-3 cursor-pointer hover:bg-gray-100 transition-all">
                                <Upload size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500">上传 TRC20 二维码</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleQRUpload(e, 'trc20')} />
                              </label>
                              {settings?.depositInfo?.cryptoQR && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden border">
                                  <img src={settings.depositInfo.cryptoQR} className="w-full h-full object-cover" alt="" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">USDT-ERC20 收款地址</label>
                            <input 
                              type="text" 
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:ring-2 focus:ring-orange-500/20 transition-all mb-3"
                              value={settings?.depositInfo?.erc20Address || ""}
                              onChange={(e) => setSettings({ ...settings, depositInfo: { ...(settings?.depositInfo || {}), erc20Address: e.target.value } })}
                            />
                            <div className="flex items-center gap-4">
                              <label className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-3 cursor-pointer hover:bg-gray-100 transition-all">
                                <Upload size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500">上传 ERC20 二维码</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleQRUpload(e, 'erc20')} />
                              </label>
                              {settings?.depositInfo?.erc20QR && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden border">
                                  <img src={settings.depositInfo.erc20QR} className="w-full h-full object-cover" alt="" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">银行卡收款信息</label>
                            <textarea 
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium h-32 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                              value={settings?.depositInfo?.bankInfo || ""}
                              onChange={(e) => setSettings({ ...settings, depositInfo: { ...(settings?.depositInfo || {}), bankInfo: e.target.value } })}
                            />
                          </div>
                          <button 
                            onClick={() => handleUpdateSettings(settings)}
                            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-orange-100 active:scale-95 transition-all"
                          >
                            <Save size={20}/> 保存配置
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-gray-900">内容管理</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Banners */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                          <ImageIcon size={20} className="text-red-600" /> 轮播图管理
                        </h3>
                        <label className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-colors cursor-pointer">
                          + 添加图片
                          <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {settings?.banners?.map((b: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border group hover:bg-white hover:shadow-md transition-all">
                            <div className="w-24 aspect-video rounded-xl overflow-hidden border shrink-0">
                              <img src={b.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-gray-900 truncate text-sm">{b.title}</div>
                              <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                                <span>尺寸: {b.width && b.height ? `${b.width}x${b.height}` : '未知'}</span>
                                {b.size && <span>• {b.size}</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const newBanners = settings.banners.filter((_: any, idx: number) => idx !== i);
                                handleUpdateSettings({ ...settings, banners: newBanners });
                              }}
                              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        {(!settings?.banners || settings.banners.length === 0) && (
                          <div className="py-10 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">暂无轮播图</div>
                        )}
                      </div>
                    </div>

                    {/* News */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                          <Newspaper size={20} className="text-blue-600" /> 行业资讯
                        </h3>
                        <button 
                          onClick={() => setShowNewsModal(true)} 
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors"
                        >
                          + 发布资讯
                        </button>
                      </div>
                      <div className="space-y-4">
                        {news.map(n => (
                          <div key={n.id} className="bg-gray-50 p-4 rounded-2xl border flex gap-4 group hover:bg-white hover:shadow-md transition-all">
                            <img src={n.image} className="w-20 h-20 rounded-xl object-cover shadow-sm shrink-0" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="font-black text-gray-900 truncate text-sm">{n.title}</div>
                                <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                                  <span>{n.time}</span>
                                  {n.width && n.height && <span>• {n.width}x{n.height}</span>}
                                  {n.fileSize && <span>• {n.fileSize}</span>}
                                </div>
                              </div>
                              <button 
                                onClick={() => setConfirmModal({
                                  title: "确认删除",
                                  message: `确定要删除资讯 "${n.title}" 吗？`,
                                  onConfirm: async () => {
                                    try {
                                      await deleteDoc(doc(db, "news", n.id));
                                      setAdminStatus({ msg: "资讯已删除", type: 'success' });
                                    } catch (err) {
                                      setAdminStatus({ msg: "删除失败", type: 'error' });
                                    }
                                    setConfirmModal(null);
                                  }
                                })} 
                                className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={12} /> 删除资讯
                              </button>
                            </div>
                          </div>
                        ))}
                        {news.length === 0 && (
                          <div className="py-10 text-center text-gray-300 text-xs font-bold uppercase tracking-widest">暂无行业资讯</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black text-gray-900">系统设置</h2>
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-2xl">
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">提现限制</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">最低提现金额 (¥)</label>
                            <input 
                              type="number" 
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20"
                              value={settings?.withdrawConfig?.minAmount || 10}
                              onChange={(e) => setSettings({ ...settings, withdrawConfig: { ...(settings?.withdrawConfig || {}), minAmount: parseFloat(e.target.value) } })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">提现手续费 (%)</label>
                            <input 
                              type="number" 
                              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20"
                              value={settings?.withdrawConfig?.fee || 0}
                              onChange={(e) => setSettings({ ...settings, withdrawConfig: { ...(settings?.withdrawConfig || {}), fee: parseFloat(e.target.value) } })}
                            />
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">系统维护</h3>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                          <div>
                            <div className="font-black text-red-900">维护模式</div>
                            <div className="text-xs text-red-700">开启后普通用户将无法访问 App</div>
                          </div>
                          <button 
                            className={`w-14 h-8 rounded-full transition-all relative ${settings?.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'}`}
                            onClick={() => setSettings({ ...settings, maintenanceMode: !settings?.maintenanceMode })}
                          >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.maintenanceMode ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      </section>

                      <button 
                        onClick={() => handleUpdateSettings(settings)}
                        className="w-full bg-red-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-red-100 active:scale-95 transition-all"
                      >
                        <Save size={20}/> 保存系统设置
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showNewsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                    <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50 shrink-0">
                      <h3 className="text-xl font-black text-gray-900">发布新资讯</h3>
                      <button onClick={() => setShowNewsModal(false)} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">资讯标题</label>
                        <input 
                          type="text" 
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-base font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="输入资讯标题..."
                          value={newNews.title}
                          onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">资讯内容</label>
                        <textarea 
                          className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-base font-medium h-40 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                          placeholder="输入资讯详细内容..."
                          value={newNews.content}
                          onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">封面图片</label>
                        <label className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden">
                          {newNews.image ? (
                            <img src={newNews.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <>
                              <Upload size={24} className="text-gray-300 mb-2" />
                              <span className="text-xs font-bold text-gray-400">点击上传图片</span>
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleNewsImageUpload} />
                        </label>
                      </div>
                      <button 
                        onClick={handleSaveNews}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-blue-100 active:scale-95 transition-all"
                      >
                        确认上传
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {confirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trash2 size={32} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2">{confirmModal.title}</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">{confirmModal.message}</p>
                    </div>
                    <div className="flex border-t">
                      <button 
                        onClick={() => setConfirmModal(null)}
                        className="flex-1 px-6 py-5 text-gray-500 font-black hover:bg-gray-50 transition-all border-r"
                      >
                        取消
                      </button>
                      <button 
                        onClick={confirmModal.onConfirm}
                        className="flex-1 px-6 py-5 text-red-600 font-black hover:bg-red-50 transition-all"
                      >
                        确认删除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-red-600 text-white shadow-xl shadow-red-200 translate-x-1' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className={`text-sm font-black tracking-wide ${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
        {label}
      </span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
    </button>
  );
}

function StatCard({ label, value, unit, color }: { label: string, value: string | number, unit: string, color: 'blue' | 'green' | 'orange' | 'red' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    red: 'text-red-600 bg-red-50 border-red-100'
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-black tracking-tighter ${colors[color].split(' ')[0]}`}>{value}</span>
        <span className="text-xs font-bold text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
