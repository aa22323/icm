import { Search } from "lucide-react";
import { PRODUCTS } from "../../constants";
import { useState, useEffect } from "react";
import { marketService } from "../../services/marketService";

// Helper to generate a stable sparkline path based on symbol
const getSparklinePath = (symbol: string, change: number) => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const points = [];
  for (let i = 0; i <= 9; i++) {
    // Use sin for deterministic "random" looking points
    const y = 10 + Math.abs(Math.sin(hash + i * 1.5)) * 15;
    points.push(`${i * 10} ${y}`);
  }
  return `M ${points.join(' L ')} L 100 ${change > 0 ? 5 : 25}`;
};

export default function MobileMarketList({ onSelectProduct }: { onSelectProduct: (id: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('Metal');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const categories = ['Crypto', 'Oil', 'CFD', 'US', 'Metal'];
  const hasApiKey = !!import.meta.env.VITE_TWELVE_DATA_API_KEY;

  useEffect(() => {
    const fetchPrices = async () => {
      const newPrices: Record<string, number> = {};
      for (const product of PRODUCTS) {
        let basePrice = product.price;
        
        if (hasApiKey) {
          const data = await marketService.getRealTimePrice(product.symbol);
          if (data && data.price) {
            basePrice = parseFloat(data.price);
          }
        }

        const manipulatedPrice = await marketService.getManipulatedPrice(product.symbol, basePrice);
        
        if (manipulatedPrice === basePrice) {
          const seed = product.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const noise = Math.sin(Date.now() / 2000 + seed) * (basePrice * 0.0001);
          newPrices[product.symbol] = basePrice + noise;
        } else {
          newPrices[product.symbol] = manipulatedPrice;
        }
      }
      setPrices(prev => ({ ...prev, ...newPrices }));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 2000);
    return () => clearInterval(interval);
  }, [hasApiKey]);

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <img src="https://flagcdn.com/w40/us.png" alt="US" className="w-6 h-auto" />
          {hasApiKey && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-green-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-1">
            <div className="flex items-end gap-0.5 h-3.5">
              <div className="w-0.5 h-1 bg-black"></div>
              <div className="w-0.5 h-2.5 bg-black"></div>
              <div className="w-0.5 h-3.5 bg-[#39ff14]"></div>
            </div>
            <div className="flex items-baseline leading-none">
              <span className="text-[#39ff14] font-black text-sm tracking-tighter">IC</span>
              <span className="text-black font-black text-sm tracking-tighter">Markets</span>
            </div>
          </div>
        </div>
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around px-2 py-3 border-b">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${
              activeCategory === cat ? 'bg-[#f0f0f0] text-black' : 'text-[#999]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            onClick={() => onSelectProduct(product.id)}
            className="flex items-center px-4 py-3 border-b active:bg-muted/50 transition-colors cursor-pointer h-[72px]"
          >
            {/* Logo & Symbol */}
            <div className="flex items-center gap-3 w-[110px] shrink-0">
              <div className="relative w-10 h-10 shrink-0">
                {/* Product Image (Bottom) */}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#f8f8f8] border flex items-center justify-center overflow-hidden z-10">
                  <img src={product.img} className="w-5 h-5 object-contain" alt="" />
                </div>
                {/* Flag Image (Top) */}
                <div className="absolute top-0 left-0 w-7 h-5 rounded-sm overflow-hidden border border-white shadow-sm z-20">
                  <img src={`https://flagcdn.com/w40/${product.flag}.png`} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div className="font-bold text-[13px] tracking-tight">{product.symbol}</div>
            </div>
            
            {/* Price & Change (Center) */}
            <div className="flex-1 text-center px-2">
              <div className="font-bold text-[15px] leading-tight">
                {(prices[product.symbol] || product.price).toFixed(product.id.includes('Oil') ? 3 : 2)}
              </div>
              {(() => {
                const dailyOpen = marketService.getDailyOpenPrice(product.symbol, product.price);
                const change = (prices[product.symbol] || product.price) - dailyOpen;
                const changePercent = (change / dailyOpen) * 100;
                const isPos = change >= 0;
                
                return (
                  <div className={`text-[11px] font-bold flex items-center justify-center gap-0.5 ${isPos ? 'text-[#0166fc]' : 'text-[#f23c48]'}`}>
                    {isPos ? '+' : ''}{changePercent.toFixed(2)}%
                    <span className="text-[8px]">{isPos ? '▲' : '▼'}</span>
                  </div>
                );
              })()}
            </div>

            {/* Sparkline (Right) */}
            <div className="w-[100px] shrink-0">
              <div className="h-8 w-full">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                  <path
                    d={getSparklinePath(product.symbol, product.change)}
                    fill="none"
                    stroke={product.change > 0 ? "#0166fc" : "#f23c48"}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
