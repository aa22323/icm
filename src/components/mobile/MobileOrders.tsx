import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, serverTimestamp, addDoc } from "firebase/firestore";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { marketService } from "../../services/marketService";
import { PRODUCTS } from "../../constants";

export default function MobileOrders({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasApiKey = !!import.meta.env.VITE_TWELVE_DATA_API_KEY;

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "orders"),
      where("userId", "==", auth.currentUser.uid),
      where("status", "==", "closed")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      // Client-side sort to avoid index requirement
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setOrders(docs);
      setLoading(false);
    }, (error) => {
      console.error("Orders listener error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="flex items-center px-4 py-3 border-b shrink-0">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-center font-bold text-lg mr-6">{t('orders')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#0166fc] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-[#999]">
            <p className="text-sm">{t('no_orders')}</p>
            <button onClick={onBack} className="mt-4 text-[#0166fc] font-bold">{t('go_to_trade')}</button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    order.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {order.type === 'buy' ? t('buy') : t('sell')}
                  </span>
                  <span className="font-bold text-[15px]">{order.symbol}</span>
                </div>
                <span className={`text-xs font-bold ${order.status === 'open' ? 'text-green-500' : 'text-[#999]'}`}>
                  {order.status === 'open' ? t('in_progress') : t('closed')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('lots')}</p>
                  <p className="font-bold text-sm">{order.lots}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('entry_price')}</p>
                  <p className="font-bold text-sm">{order.entryPrice}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('margin_label')}</p>
                  <p className="font-bold text-sm">${order.margin}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('pnl') || 'PnL'}</p>
                  <p className={`font-bold text-sm ${order.pnl >= 0 ? 'text-[#0166fc]' : 'text-[#f23c48]'}`}>
                    ${order.pnl?.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('exit_price') || 'Exit Price'}</p>
                  <p className="font-bold text-sm">{order.exitPrice?.toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-2 border-t flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>{t('open_time') || 'Open Time'}:</span>
                  <span>{order.createdAt?.toDate().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>{t('close_time') || 'Close Time'}:</span>
                  <span>{order.closedAt?.toDate().toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
