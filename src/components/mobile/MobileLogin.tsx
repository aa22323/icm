import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth, db } from "../../lib/firebase";
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import React, { useState } from "react";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export default React.memo(function MobileLogin({ onBack, onLogin, initialMode }: { onBack: () => void, onLogin?: () => void, initialMode?: 'login' | 'register' }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode || 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      // Attempt anonymous sign-in
      await signInAnonymously(auth);
      if (onLogin) onLogin();
    } catch (err: any) {
      console.error("Anonymous login failed:", err);
      
      if (err.code === 'auth/network-request-failed') {
        setError("Network error: Unable to reach authentication server. If you are in a restricted region, please use a VPN. Alternatively, you can use 'Local Demo Mode' below.");
      } else {
        // Fallback: Generate a random account
        try {
          const randomId = Math.random().toString(36).substring(2, 10);
          const demoEmail = `demo_${randomId}@cal-trading.com`;
          const demoPassword = `demo_${randomId}_pass`;
          
          const result = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          
          // Initialize user document
          await setDoc(doc(db, "users", result.user.uid), {
            uid: result.user.uid,
            balance: 100000,
            createdAt: serverTimestamp(),
            email: result.user.email,
            isDemo: true
          });
          
          if (onLogin) onLogin();
        } catch (innerErr: any) {
          console.error("Random account generation failed:", innerErr);
          if (innerErr.code === 'auth/admin-restricted-operation' || innerErr.code === 'auth/operation-not-allowed') {
            setError("Firebase Auth is currently restricted. Please enable 'Anonymous' or 'Email/Password' in your Firebase Console.");
          } else if (innerErr.code === 'auth/network-request-failed') {
            setError("Network error: Unable to reach authentication server. Please check your connection or use a VPN.");
          } else {
            setError(innerErr.message || "Failed to create demo account.");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDemo = () => {
    localStorage.setItem('is_local_demo', 'true');
    if (onLogin) onLogin();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`重置密码邮件已发送至: ${email}\n请检查您的收件箱。`);
    } catch (err: any) {
      console.error("Reset password error:", err);
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = "未找到该邮箱对应的用户。";
      if (err.code === 'auth/invalid-email') msg = "邮箱格式不正确。";
      setError(msg || "发送重置邮件失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) {
      setError("请输入邮箱和密码。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        // Update password in firestore for admin view
        if (auth.currentUser) {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            password: password
          }).catch(() => {}); // Ignore if fails
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize user document for new email user
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          balance: 0,
          createdAt: serverTimestamp(),
          email: result.user.email,
          password: password,
          isDemo: false
        });
      }
      if (onLogin) onLogin();
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "认证失败。";
      if (err.code === 'auth/user-not-found') msg = "用户不存在。";
      if (err.code === 'auth/wrong-password') msg = "密码错误。";
      if (err.code === 'auth/invalid-email') msg = "邮箱格式不正确。";
      if (err.code === 'auth/email-already-in-use') msg = "该邮箱已被注册，请直接登录。";
      if (err.code === 'auth/invalid-credential') msg = "邮箱或密码错误。";
      if (err.code === 'auth/weak-password') msg = "密码强度不足（至少6位）。";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-6 py-4 pb-24 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="h-7 w-7 text-black" />
        </button>
        <div className="flex items-center gap-2">
          <img src="https://flagcdn.com/w40/us.png" alt="US" className="w-6 h-auto shadow-sm rounded-sm" />
          <span className="text-[12px] font-bold">English</span>
        </div>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-black rounded-[24px] flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.1)] mb-4">
          <div className="text-white font-black text-4xl italic tracking-tighter transform -skew-x-6">CAL</div>
        </div>
        <h2 className="text-xl font-bold text-black">
          {mode === 'login' ? t('welcome_back') : t('register')}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[#0166fc] font-bold text-[16px] mb-3 ml-1">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('enter_email')}
            className="w-full h-[58px] bg-[#f8f8f8] border-none rounded-full px-8 focus:ring-2 focus:ring-[#0166fc]/20 outline-none text-[15px] font-medium placeholder:text-[#ccc] transition-all"
          />
        </div>

        <div>
          <label className="block text-black font-bold text-[16px] mb-3 ml-1">{t('password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('enter_password')}
            className="w-full h-[58px] bg-[#f8f8f8] border-none rounded-full px-8 focus:ring-2 focus:ring-[#0166fc]/20 outline-none text-[15px] font-medium placeholder:text-[#ccc] transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-[14px] font-bold px-2">
          <button 
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-[#0166fc] hover:opacity-80"
          >
            {mode === 'login' ? t('new_user_join') : t('login')}
          </button>
          <button 
            type="button" 
            onClick={handleForgotPassword}
            disabled={loading}
            className="text-[#999] hover:opacity-80 disabled:opacity-50"
          >
            {t('forgot_password')}
          </button>
        </div>

        <div className="space-y-4 pt-6">
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-[58px] bg-[#0166fc] text-white rounded-full font-bold text-lg shadow-[0_8px_25px_rgba(1,102,252,0.15)] active:scale-[0.98] transition-transform flex items-center justify-center disabled:opacity-70"
          >
            {loading && mode !== 'register' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              loading && mode === 'register' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                mode === 'login' ? t('login') : t('register')
              )
            )}
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">{t('or')}</span></div>
          </div>

          <button 
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full h-[58px] bg-[#0166fc] text-white rounded-full font-bold text-[14px] shadow-[0_8px_25px_rgba(1,102,252,0.15)] active:scale-[0.98] transition-transform flex items-center justify-center text-center px-10 leading-tight disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t('create_demo_account')
            )}
          </button>

          {error?.includes('Network error') && (
            <button 
              type="button"
              onClick={handleLocalDemo}
              className="w-full h-[58px] bg-gray-100 text-gray-600 rounded-full font-bold text-[14px] active:scale-[0.98] transition-transform flex items-center justify-center text-center px-10 leading-tight"
            >
              Skip & Use Local Demo Mode
            </button>
          )}
        </div>
      </form>
    </div>
  );
});

