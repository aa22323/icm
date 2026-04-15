import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { ArrowUp, ArrowDown, ChevronDown, ChevronLeft, Star, Share2, Settings, Info, Bell, LayoutGrid, Menu, Search, Clock, Zap, ShieldCheck, Globe, TrendingUp, Wallet, ArrowRightLeft, History, Plus, Minus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from "../../constants";
import { doc, onSnapshot, collection, query, where, addDoc, updateDoc, serverTimestamp, increment, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useTranslation } from "react-i18next";
import { marketService } from "../../services/marketService";

const timeframeMs: Record<string, number> = {
  '1M': 60 * 1000,
  '5M': 5 * 60 * 1000,
  '15M': 15 * 60 * 1000,
  '30M': 30 * 60 * 1000,
  '1H': 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
};

export default function MobileTradingView({ productId, user }: { productId: string, user: any }) {
  const { t } = useTranslation();

  // Helper to calculate Moving Average
  const calculateMA = (data: any[], count: number) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < count; j++) {
        sum += data[i - j][1]; // index 1 is 'close' in our source format
      }
      result.push(sum / count);
    }
    return result;
  };

  const product = useMemo(() => PRODUCTS.find(p => p.id === productId) || PRODUCTS[0], [productId]);
  const [activeTab, setActiveTab] = useState('Market Price');
  const [lots, setLots] = useState(0.1);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [timeframe, setTimeframe] = useState('5M');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const staticHistoryRef = useRef<any[]>([]);
  const sourceRef = useRef<any[][]>([]);
  const chartScaleRef = useRef<{min: number, max: number, range: number} | null>(null);
  const targetPriceRef = useRef<number | null>(null);
  const smoothPriceRef = useRef<number | null>(null);
  const isFirstFitRef = useRef(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const hasApiKey = !!import.meta.env.VITE_TWELVE_DATA_API_KEY;

  // Use currentPrice if available, otherwise fallback to product.price
  const displayPrice = currentPrice || product.price;

  // Initialize Balance Listener
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserBalance(docSnap.data().balance);
        }
      });
    }
  }, [user]);

  const [orders, setOrders] = useState<any[]>([]);
  // Initialize Open Orders Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("userId", "==", user.uid), where("status", "==", "open"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setOrders(docs);
    });
  }, [user]);

  // Liquidation Monitor
  useEffect(() => {
    if (!user || orders.length === 0 || !currentPrice || userBalance === null) return;
    
    const checkLiquidation = async () => {
      for (const order of orders) {
        // For simplicity, we only liquidate the current product's orders here
        if (order.symbol !== product.symbol) continue;

        const pnl = marketService.calculatePnL(order, currentPrice);
        const equity = userBalance + order.margin + pnl;
        const marginLevel = (equity / order.margin) * 100;

        if (marginLevel <= 20) { // 20% Stop Out level
          console.log(`Liquidation triggered for order ${order.id}`);
          handleCloseOrder(order, true);
        }
      }
    };

    checkLiquidation();
  }, [currentPrice, orders, userBalance]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async (type: 'buy' | 'sell') => {
    if (!user) {
      alert(t('please_login'));
      return;
    }
    
    if (userBalance === null) {
      alert(t('loading_balance'));
      return;
    }

    const priceToUse = displayPrice;
    if (!priceToUse) {
      alert(t('price_unavailable'));
      return;
    }
    
    const margin = lots * 1000;
    if (userBalance < margin) {
      alert(t('insufficient_balance_margin') + margin);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderRef = doc(collection(db, "orders"));
      const orderData = {
        userId: user.uid,
        symbol: product.symbol,
        type,
        lots,
        entryPrice: priceToUse,
        stopLoss,
        takeProfit,
        margin,
        status: 'open',
        createdAt: serverTimestamp()
      };

      await setDoc(orderRef, orderData);
      
      // Deduct margin from balance
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        balance: increment(-margin)
      });

      alert(`${t('order_success')}${priceToUse}!`);
      setActiveTab('Pending Orders');
    } catch (error: any) {
      console.error("Order error:", error);
      alert(t('change_failed') + ": " + (error.message || "Unknown error"));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const [closingId, setClosingId] = useState<string | null>(null);

  const handleCloseOrder = async (order: any, isAuto = false) => {
    if (!user || closingId) return;
    
    setClosingId(order.id);
    try {
      const priceToUse = order.symbol === product.symbol ? (currentPrice || product.price) : order.entryPrice;
      const pnl = marketService.calculatePnL(order, priceToUse);
      const returnAmount = order.margin + pnl;

      const userRef = doc(db, "users", user.uid);
      const orderRef = doc(db, "orders", order.id);

      await updateDoc(orderRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
        exitPrice: priceToUse,
        pnl: pnl,
        isLiquidated: isAuto
      });

      await updateDoc(userRef, {
        balance: increment(returnAmount),
        totalPnl: increment(pnl)
      });

      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: pnl >= 0 ? 'PROFIT' : 'LOSS',
        amount: Math.abs(pnl),
        status: 'COMPLETED',
        createdAt: serverTimestamp(),
        assetType: 'TRADE',
        symbol: order.symbol
      });

      if (!isAuto) {
        alert(`${t('order_closed_success')}${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USD`);
      }
    } catch (error: any) {
      console.error("Close order error:", error);
      if (!isAuto) alert(t('close_failed'));
    } finally {
      setClosingId(null);
    }
  };

  const [dailyOpenPrice, setDailyOpenPrice] = useState<number | null>(null);

  // Seeded random for deterministic initial data
  const getSeededRandom = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
      h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
      h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
      h = (h ^ h >>> 16) >>> 0;
      return h / 4294967296;
    };
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const seededRand = getSeededRandom(`${todayStr}-${productId}`);
    return {
      turnover: (seededRand() * 50 + 50).toFixed(2) + 'M',
      volume: (seededRand() * 400 + 100).toFixed(2) + 'K',
      high: (product.price * (1 + seededRand() * 0.015)).toFixed(2),
      low: (product.price * (1 - seededRand() * 0.015)).toFixed(2),
      prevClose: (product.price * (1 + (seededRand() * 0.01 - 0.005))).toFixed(2)
    };
  }, [productId, product.price]);

  // 2. Rock-Solid Chart Controller
  useEffect(() => {
    // Reset refs when symbol or timeframe changes
    chartScaleRef.current = null;
    smoothPriceRef.current = null;
    targetPriceRef.current = null;

    const generateInitialHistory = (count: number) => {
      const now = Date.now();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      const todayStr = today.toISOString().split('T')[0];
      
      // Seed for today's base price
      const dayOpen = marketService.getDailyOpenPrice(productId, product.price);
      if (!dailyOpenPrice) setDailyOpenPrice(dayOpen);

      // Determine "current" price based on time passed today (deterministic walk)
      const minutesPassed = Math.floor((now - startOfDay) / 60000);
      const walkRand = getSeededRandom(`${todayStr}-${productId}-${timeframe}-walk`);
      let priceAtNow = dayOpen;
      // Simulate walk in 5-minute chunks for performance and stability
      for (let i = 0; i < Math.floor(minutesPassed / 5); i++) {
        priceAtNow *= (1 + (walkRand() * 0.002 - 0.001));
      }
      
      const data = [];
      let currentSimPrice = priceAtNow;
      const histRand = getSeededRandom(`${todayStr}-${productId}-${timeframe}-hist`);
      
      const period = timeframeMs[timeframe] || 300000;
      
      // Generate backwards from priceAtNow
      for (let i = 0; i < count; i++) {
        const candleVol = currentSimPrice * 0.004; 
        const isUp = histRand() > 0.5;
        
        const bodySize = histRand() * candleVol;
        const open = currentSimPrice;
        const close = isUp ? open + bodySize : open - bodySize;
        
        const upperWick = histRand() * candleVol * 0.4;
        const lowerWick = histRand() * candleVol * 0.4;
        
        const high = Math.max(open, close) + upperWick;
        const low = Math.min(open, close) - lowerWick;
        
        data.unshift({
          t: now - i * period,
          o: open,
          c: close,
          l: low,
          h: high
        });
        
        // Drift for next candle (moving backwards)
        currentSimPrice = open - (histRand() - 0.5) * (currentSimPrice * 0.003);
      }
      return data;
    };

    const initialHistory = generateInitialHistory(60);
    staticHistoryRef.current = initialHistory;
    sourceRef.current = initialHistory.map(d => [d.o, d.c, d.l, d.h]);
    
    // Initialize price refs to match the last candle exactly
    const lastPrice = initialHistory[initialHistory.length - 1].c;
    targetPriceRef.current = lastPrice;
    smoothPriceRef.current = lastPrice;
    setCurrentPrice(lastPrice);

    let animId: number;
    let lastHeaderUpdate = 0;
    const smoothAndDraw = () => {
      const chart = chartInstanceRef.current;
      const history = staticHistoryRef.current;
      const source = sourceRef.current;
      
      if (chart && history.length > 0 && source.length > 0) {
        let nextPrice = smoothPriceRef.current;
        if (targetPriceRef.current !== null) {
          const target = targetPriceRef.current!;
          nextPrice = nextPrice || target;
          const diff = target - nextPrice;
          // Set smoothing to 0.8 as requested
          if (Math.abs(diff) > 0.00001) nextPrice = nextPrice + (diff * 0.8);
          else nextPrice = target;
          smoothPriceRef.current = nextPrice;
        }

        if (nextPrice !== null) {
          const lastIdx = source.length - 1;
          const lastCandle = history[lastIdx];
          
          // Update both source (for ECharts) and history (for simulation consistency)
          source[lastIdx][1] = nextPrice;
          source[lastIdx][2] = Math.min(lastCandle.l, nextPrice);
          source[lastIdx][3] = Math.max(lastCandle.h, nextPrice);
          
          lastCandle.c = nextPrice;
          lastCandle.l = source[lastIdx][2];
          lastCandle.h = source[lastIdx][3];
        }

        const currentP = (typeof nextPrice === 'number' && !isNaN(nextPrice)) 
          ? nextPrice 
          : (history[history.length - 1]?.c || 0);
        
        // Throttled header price update to prevent visual fatigue
        if (Date.now() - lastHeaderUpdate > 100) {
          setCurrentPrice(currentP);
          lastHeaderUpdate = Date.now();
        }
        
        // Best-Fit Scaling: Calculate range based on the last 40 visible candles
        const visibleCount = 40;
        const visibleHistory = history.slice(-visibleCount);
        let minPrice = currentP;
        let maxPrice = currentP;
        
        visibleHistory.forEach(d => {
          if (d.l < minPrice) minPrice = d.l;
          if (d.h > maxPrice) maxPrice = d.h;
        });

        const dataRange = maxPrice - minPrice;
        // Ultra-stretched scaling: Use minimal padding to force maximum vertical expansion
        const minRange = currentP * 0.0001; 
        const actualRange = Math.max(dataRange, minRange);
        const padding = actualRange * 0.02; 
        
        const targetMin = minPrice - padding;
        const targetMax = maxPrice + padding;

        if (!chartScaleRef.current || isFirstFitRef.current) {
          chartScaleRef.current = { min: targetMin, max: targetMax, range: targetMax - targetMin };
          isFirstFitRef.current = false;
        } else {
          const scale = chartScaleRef.current;
          // Faster adjustment to target scale
          scale.min = scale.min + (targetMin - scale.min) * 0.2;
          scale.max = scale.max + (targetMax - scale.max) * 0.2;
          scale.range = scale.max - scale.min;
        }

        const scale = chartScaleRef.current!;
        const isUp = currentP >= history[history.length - 1].o;
        const priceColor = isUp ? '#00e676' : '#ff5252';

        chart.setOption({
          animation: false,
          grid: { top: 30, left: 10, right: 85, bottom: 25, containLabel: false },
          xAxis: {
            type: 'category',
            data: history.map(d => String(d.t)),
            boundaryGap: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { 
              color: '#999', fontSize: 9, interval: 14,
              formatter: (v: any) => {
                const d = new Date(Number(v));
                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              }
            },
            splitLine: { show: true, lineStyle: { color: '#f0f0f0', type: 'dashed', opacity: 0.3 } }
          },
          yAxis: {
            type: 'value',
            position: 'right',
            min: scale.min,
            max: scale.max,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { 
              color: '#bbb', 
              fontSize: 9, 
              formatter: (v: number) => v.toFixed(2),
              margin: 8
            },
            splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed', opacity: 0.3 } }
          },
          series: [{
            type: 'candlestick',
            data: source,
            barWidth: '70%',
            itemStyle: { 
              color: '#26a69a', 
              color0: '#ef5350', 
              borderColor: '#26a69a', 
              borderColor0: '#ef5350',
              borderWidth: 1
            },
            markLine: {
              symbol: ['none', 'none'],
              silent: true,
              animation: false,
              z: 10,
              label: {
                show: true, 
                position: 'end',
                backgroundColor: priceColor, 
                color: '#fff',
                padding: [4, 8], 
                borderRadius: 2, 
                fontSize: 12, 
                fontWeight: 'bold',
                formatter: (params: any) => {
                  const val = typeof params.value === 'number' ? params.value : currentP;
                  return val.toFixed(3);
                }
              },
              lineStyle: { color: priceColor, type: 'dashed', width: 1.5, opacity: 1 },
              data: [{ yAxis: currentP }]
            }
          }]
        });
      }
      animId = requestAnimationFrame(smoothAndDraw);
    };

    const observer = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        if (!chartInstanceRef.current) {
          try {
            chartInstanceRef.current = echarts.init(chartContainerRef.current, null, { renderer: 'canvas' });
            smoothAndDraw();
          } catch (e) {
            console.error("ECharts init error:", e);
          }
        } else {
          chartInstanceRef.current.resize();
        }
      }
    });

    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }

    // Fallback init if observer fails
    const fallbackTimer = setTimeout(() => {
      if (chartContainerRef.current && !chartInstanceRef.current) {
        chartInstanceRef.current = echarts.init(chartContainerRef.current, null, { renderer: 'canvas' });
        smoothAndDraw();
      }
    }, 500);
    
    const uiInterval = setInterval(() => {
      // Syncing now handled in smoothAndDraw for 60fps precision
    }, 1000);

    const priceInterval = setInterval(async () => {
      if (staticHistoryRef.current.length === 0) return;
      const last = staticHistoryRef.current[staticHistoryRef.current.length - 1];
      
      let basePrice = last.c;
      if (hasApiKey) {
        const data = await marketService.getRealTimePrice(product.symbol);
        if (data && data.price) {
          basePrice = parseFloat(data.price);
        }
      }

      const manipulatedPrice = await marketService.getManipulatedPrice(product.symbol, basePrice);
      
      if (manipulatedPrice === basePrice) {
        // Natural drift if no manipulation
        targetPriceRef.current = last.c + (Math.random() - 0.5) * (last.c * 0.0008);
      } else {
        targetPriceRef.current = manipulatedPrice;
      }
    }, 2000);

    const candleInterval = setInterval(() => {
      const history = staticHistoryRef.current;
      const source = sourceRef.current;
      if (history.length === 0) return;
      
      const last = history[history.length - 1];
      const interval = timeframeMs[timeframe] || 60000;
      
      // New candle starts EXACTLY where the last one is currently
      const newCandle = { 
        t: last.t + interval, 
        o: last.c, 
        c: last.c, 
        l: last.c, 
        h: last.c 
      };
      
      staticHistoryRef.current = [...history.slice(1), newCandle];
      sourceRef.current = [...source.slice(1), [newCandle.o, newCandle.c, newCandle.l, newCandle.h]];
      
      // Update target price to the new candle's start to prevent jumps
      targetPriceRef.current = newCandle.c;
    }, timeframeMs[timeframe] || 60000);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
      cancelAnimationFrame(animId);
      clearInterval(uiInterval);
      clearInterval(priceInterval);
      clearInterval(candleInterval);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [product.symbol, timeframe]);

  // 3. UI Update Loop
  useEffect(() => {
    // Removed: Unified into Rock-Solid Chart Controller
  }, []);

  // Trigger scale check when price changes
  // Removed: checkAndAdjustScale is now integrated into the unified animation loop.

  // Calculate dynamic change based on the daily open price
  const referencePrice = dailyOpenPrice || (staticHistoryRef.current.length > 0 ? staticHistoryRef.current[0].o : product.price);
  const dynamicChange = (currentPrice || product.price) - referencePrice;
  const dynamicChangePercent = (dynamicChange / referencePrice) * 100;
  const isPositive = dynamicChange >= 0;

  return (
    <div className="flex flex-col h-full bg-white pb-24 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-100 rounded-lg">
            <TrendingUp className={isPositive ? 'text-[#0166fc]' : 'text-[#f23c48]'} size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-gray-900 tracking-tight">{product.symbol}</span>
              <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {product.type}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Global Market Live</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold leading-tight ${isPositive ? 'text-[#0166fc]' : 'text-[#f23c48]'}`}>
            {(currentPrice || product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-[11px] font-bold ${isPositive ? 'text-[#0166fc]' : 'text-[#f23c48]'}`}>
            {isPositive ? '+' : ''}{dynamicChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Timeframes */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b shrink-0 bg-white overflow-x-auto no-scrollbar">
        {['1M', '5M', '15M', '30M', '1H', '1D'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded text-[11px] font-bold transition-all whitespace-nowrap ${
              tf === timeframe ? 'bg-[#0166fc] text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tf}
          </button>
        ))}
        <div className="w-px h-3 bg-gray-200 mx-1" />
        <button className="text-gray-400 p-1"><Plus size={14} /></button>
      </div>

      {/* Chart */}
      <div className="relative flex flex-col h-72 w-full bg-white border-b shrink-0">
        {/* Stats Summary */}
        <div className="px-4 py-2 flex items-center justify-between border-b bg-white shrink-0">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Turnover (USD)</div>
            <div className="text-sm font-bold text-gray-800">{stats.turnover}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Increase Change (USD)</div>
            <div className={`text-sm font-bold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {isPositive ? '+' : ''}{dynamicChangePercent.toFixed(4)}%
            </div>
          </div>
        </div>

        <div ref={chartContainerRef} className="flex-1 w-full bg-[#fcfcfc] min-h-[200px]" />
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#f5f5f5] mx-4 my-2 rounded-lg h-12 shrink-0">
        <button
          onClick={() => setActiveTab('Market Price')}
          className={`flex-1 flex items-center justify-center text-sm font-bold rounded-md transition-all ${
            activeTab === 'Market Price' ? 'bg-[#0166fc] text-white shadow-[0_4px_12px_rgba(1,102,252,0.4)]' : 'text-[#999]'
          }`}
        >
          {t('market_price')}
        </button>
        <button
          onClick={() => setActiveTab('Pending Orders')}
          className={`flex-1 flex items-center justify-center text-sm font-bold rounded-md transition-all ${
            activeTab === 'Pending Orders' ? 'bg-[#0166fc] text-white shadow-[0_4px_12px_rgba(1,102,252,0.4)]' : 'text-[#999]'
          }`}
        >
          {t('pending_orders')}
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'Market Price' ? (
        <div className="px-4 space-y-3 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#333]">{t('set_loss')}</span>
              <input 
                type="checkbox" 
                checked={stopLoss > 0}
                onChange={(e) => setStopLoss(e.target.checked ? (currentPrice || product.price) * 0.95 : 0)}
                className="w-4 h-4 rounded border-gray-300 text-[#0166fc] focus:ring-[#0166fc]" 
              />
            </div>
            <div className="flex items-center border border-[#eee] rounded-lg overflow-hidden h-10 w-44 bg-[#f8f8f8]">
              <button 
                onClick={() => setStopLoss(s => Math.max(0, s - 1))}
                className="w-10 h-full border-r border-[#eee] hover:bg-gray-100 flex items-center justify-center shrink-0"
              >
                <Minus className="h-4 w-4 text-[#666]" />
              </button>
              <input 
                type="number" 
                className="flex-1 min-w-0 text-center text-[15px] font-bold bg-transparent focus:outline-none text-[#333]" 
                value={stopLoss.toFixed(2)} 
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              />
              <button 
                onClick={() => setStopLoss(s => s + 1)}
                className="w-10 h-full border-l border-[#eee] hover:bg-gray-100 flex items-center justify-center shrink-0"
              >
                <Plus className="h-4 w-4 text-[#666]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#333]">{t('set_profit')}</span>
              <input 
                type="checkbox" 
                checked={takeProfit > 0}
                onChange={(e) => setTakeProfit(e.target.checked ? (currentPrice || product.price) * 1.05 : 0)}
                className="w-4 h-4 rounded border-gray-300 text-[#0166fc] focus:ring-[#0166fc]" 
              />
            </div>
            <div className="flex items-center border border-[#eee] rounded-lg overflow-hidden h-10 w-44 bg-[#f8f8f8]">
              <button 
                onClick={() => setTakeProfit(s => Math.max(0, s - 1))}
                className="w-10 h-full border-r border-[#eee] hover:bg-gray-100 flex items-center justify-center shrink-0"
              >
                <Minus className="h-4 w-4 text-[#666]" />
              </button>
              <input 
                type="number" 
                className="flex-1 min-w-0 text-center text-[15px] font-bold bg-transparent focus:outline-none text-[#333]" 
                value={takeProfit.toFixed(2)} 
                onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              />
              <button 
                onClick={() => setTakeProfit(s => s + 1)}
                className="w-10 h-full border-l border-[#eee] hover:bg-gray-100 flex items-center justify-center shrink-0"
              >
                <Plus className="h-4 w-4 text-[#666]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[14px] font-bold text-[#333]">{t('lots_step')}</div>
            <div className="flex items-center border border-[#eee] rounded-lg overflow-hidden h-10 w-44 bg-[#f8f8f8]">
              <button onClick={() => setLots(l => Math.max(0.1, l - 0.1))} className="w-10 h-full border-r border-[#eee] hover:bg-gray-100 flex items-center justify-center shrink-0"><Minus className="h-4 w-4 text-[#666]" /></button>
              <input type="number" className="flex-1 min-w-0 text-center text-[15px] font-bold bg-transparent focus:outline-none text-[#333]" value={lots.toFixed(1)} readOnly />
              <button onClick={() => setLots(l => l + 0.1)} className="w-10 h-full border-l border-[#eee] hover:bg-gray-100 flex items-center justify-center shrink-0"><Plus className="h-4 w-4 text-[#666]" /></button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[#f5f5f5]">
            <div className="flex justify-between items-center">
              <span className="text-[#bbb] text-[13px]">{t('each_sheet')}</span>
              <span className="text-black font-bold text-[13px]">1Sheet = 1000 {product.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#bbb] text-[13px]">{t('handling_fee')}</span>
              <span className="text-black font-bold text-[13px]">{(lots * 10).toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#bbb] text-[13px]">{t('estimated_margin')}</span>
              <span className="text-black font-bold text-[13px]">{(lots * 1000).toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#bbb] text-[13px]">{t('balance')}</span>
              <span className="text-black font-bold text-[13px]">
                {userBalance !== null ? `$${userBalance.toLocaleString()}` : '--'}
              </span>
            </div>
          </div>

          {/* Buy/Sell Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-6 pb-8">
            <button 
              disabled={isPlacingOrder}
              onClick={() => handlePlaceOrder('buy')}
              className="bg-[#0166fc] text-white py-4 rounded-full font-bold text-xl shadow-[0_8px_20px_rgba(1,102,252,0.3)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isPlacingOrder ? '...' : t('buy')}
            </button>
            <button 
              disabled={isPlacingOrder}
              onClick={() => handlePlaceOrder('sell')}
              className="bg-[#f23c48] text-white py-4 rounded-full font-bold text-xl shadow-[0_8px_20_rgba(242,60,72,0.3)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isPlacingOrder ? '...' : t('sell')}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-6">
          {orders.length === 0 ? (
            <div className="py-10 text-center text-[#999] text-sm">{t('no_pending_orders')}</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="p-3 border rounded-lg bg-[#fcfcfc] space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-sm ${order.type === 'buy' ? 'text-[#0166fc]' : 'text-[#f23c48]'}`}>
                    {order.type === 'buy' ? t('buy') : t('sell')} {order.symbol}
                  </span>
                  <span className="text-[10px] text-[#999]">
                    {order.createdAt?.toDate().toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-[#999]">{t('lots')}: <span className="text-black font-bold">{order.lots}</span></div>
                  <div className="text-[#999]">{t('entry_price')}: <span className="text-black font-bold">{order.entryPrice}</span></div>
                  <div className="text-[#999]">{t('margin_label')}: <span className="text-black font-bold">${order.margin}</span></div>
                  <div className="text-[#999]">
                    {t('floating_pnl') || 'Profit/Loss'}: 
                    {(() => {
                      const priceToUse = order.symbol === product.symbol ? (currentPrice || product.price) : order.entryPrice;
                      const pnl = marketService.calculatePnL(order, priceToUse);
                      return (
                        <span className={`font-bold ml-1 ${pnl >= 0 ? 'text-[#0166fc]' : 'text-[#f23c48]'}`}>
                          ${pnl.toFixed(2)}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="pt-2 border-t flex justify-end">
                  <button 
                    disabled={closingId === order.id}
                    onClick={() => handleCloseOrder(order)}
                    className="bg-[#f23c48] text-white px-4 py-1 rounded-md text-[10px] font-bold active:scale-95 transition-all disabled:opacity-50"
                  >
                    {closingId === order.id ? '...' : t('close_now')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
