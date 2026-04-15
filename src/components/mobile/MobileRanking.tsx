import { TrendingUp, Award, Star } from "lucide-react";

const TOP_TRADERS = [
  { name: "Alex Trader", profit: "+124.5%", avatar: "https://picsum.photos/seed/alex/100/100", rank: 1 },
  { name: "Sarah FX", profit: "+98.2%", avatar: "https://picsum.photos/seed/sarah/100/100", rank: 2 },
  { name: "Crypto King", profit: "+87.1%", avatar: "https://picsum.photos/seed/crypto/100/100", rank: 3 },
  { name: "Gold Digger", profit: "+76.4%", avatar: "https://picsum.photos/seed/gold/100/100", rank: 4 },
  { name: "Bull Market", profit: "+65.9%", avatar: "https://picsum.photos/seed/bull/100/100", rank: 5 },
  { name: "Bear Hunter", profit: "+54.3%", avatar: "https://picsum.photos/seed/bear/100/100", rank: 6 },
];

export default function MobileRanking() {
  return (
    <div className="flex flex-col h-full bg-white pb-24">
      <div className="px-4 py-6 bg-gradient-to-b from-[#0166fc] to-[#0166fc]/80 text-white shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic tracking-tighter">RANKING</h1>
          <TrendingUp className="h-6 w-6" />
        </div>
        
        <div className="flex justify-around items-end pb-2">
          {/* 2nd Place */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img src={TOP_TRADERS[1].avatar} className="w-14 h-14 rounded-full border-2 border-silver shadow-lg" alt="" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-300 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">2</div>
            </div>
            <p className="text-[11px] font-bold">{TOP_TRADERS[1].name}</p>
            <p className="text-[10px] text-white/80">{TOP_TRADERS[1].profit}</p>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center gap-2 -translate-y-4">
            <div className="relative">
              <Award className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-400 animate-bounce" />
              <img src={TOP_TRADERS[0].avatar} className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-xl" alt="" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[12px] font-bold px-3 py-0.5 rounded-full">1</div>
            </div>
            <p className="text-[13px] font-bold">{TOP_TRADERS[0].name}</p>
            <p className="text-[11px] font-yellow-400 font-black">{TOP_TRADERS[0].profit}</p>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img src={TOP_TRADERS[2].avatar} className="w-14 h-14 rounded-full border-2 border-orange-400 shadow-lg" alt="" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">3</div>
            </div>
            <p className="text-[11px] font-bold">{TOP_TRADERS[2].name}</p>
            <p className="text-[10px] text-white/80">{TOP_TRADERS[2].profit}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {TOP_TRADERS.slice(3).map((trader) => (
          <div key={trader.rank} className="flex items-center gap-4 p-3 bg-[#f8f8f8] rounded-2xl">
            <span className="w-6 text-center font-black text-[#999]">{trader.rank}</span>
            <img src={trader.avatar} className="w-10 h-10 rounded-full" alt="" />
            <div className="flex-1">
              <p className="font-bold text-sm">{trader.name}</p>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-[#999]">Master Trader</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#0166fc] font-black text-sm">{trader.profit}</p>
              <p className="text-[9px] text-[#bbb]">Last 30 days</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
