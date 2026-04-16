import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  Zap, 
  Shield, 
  Globe, 
  ChevronRight,
  Bell,
  Search,
  X,
  Clock,
  Share2,
  Mail,
  MapPin,
  Headphones,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit, doc } from "firebase/firestore";
import { marketService } from "../../services/marketService";
import { PRODUCTS } from "../../constants";

interface NewsItemData {
  id: string;
  title: string;
  content: string;
  image: string;
  time: string;
}

export default function MobileHome({ onSelectMarket, onTabChange }: { onSelectMarket: () => void, onTabChange: (tab: string, params?: any) => void }) {
  const { t } = useTranslation();
  const [realPrices, setRealPrices] = useState<Record<string, number>>({});
  const hasApiKey = !!import.meta.env.VITE_TWELVE_DATA_API_KEY;

  const STATIC_NEWS: NewsItemData[] = [
    {
      id: '1',
      title: t('news_title_1'),
      time: t('news_time_1'),
      image: "https://picsum.photos/seed/finance/800/400",
      content: "美联储在最新的议息会议上决定维持基准利率在5.25%-5.50%区间不变。主席鲍威尔表示，尽管通胀已有所放缓，但仍高于2%的目标水平。市场分析师普遍预计，如果通胀数据继续改善，美联储可能在今年第三季度开启首次降息。这一消息引发了股市和债市的积极反应，投资者对经济软着陆的信心有所增强。\n\n此外，鲍威尔强调，未来的政策路径将继续取决于数据。虽然目前的利率水平被认为是限制性的，但美联储仍准备在必要时采取进一步行动。市场正在密切关注即将公布的非农就业数据和CPI报告，以寻找更多关于降息时机的线索。"
    },
    {
      id: '2',
      title: t('news_title_2'),
      time: t('news_time_2'),
      image: "https://picsum.photos/seed/gold/800/400",
      content: "受地缘政治紧张局势和主要央行购金需求的推动，国际金价今日突破2400美元/盎司大关，创下历史新高。分析师指出，在全球经济不确定性增加的背景下，黄金作为传统避险资产的吸引力进一步凸显。\n\n除了避险需求外，通胀预期和货币政策的不确定性也是推动金价上涨的关键因素。许多投资者将其视为对冲法币贬值的工具。目前，技术面显示黄金仍处于强劲的上行通道中，尽管短期内可能存在回调压力，但长期看涨情绪依然稳固。"
    },
    {
      id: '3',
      title: t('news_title_3'),
      time: t('news_time_3'),
      image: "https://picsum.photos/seed/crypto/800/400",
      content: "今日数字货币市场出现剧烈波动，比特币在触及历史高点后迅速回调，跌幅一度超过5%。以太坊及其他主流代币也跟随下跌。监管机构再次发出警告，提醒投资者注意虚拟货币交易的高风险性。\n\n专家建议，在市场情绪极度亢奋时，投资者应保持冷静，合理配置资产，避免盲目追高。随着ETF的获批和机构资金的入场，市场结构正在发生变化，但其高波动性的本质并未改变。投资者应关注各国监管政策的最新动向，并做好风险管理。"
    }
  ];

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '', icon: null as any });
  
  const [selectedNews, setSelectedNews] = useState<NewsItemData | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [news, setNews] = useState<NewsItemData[]>([]);

  useEffect(() => {
    // Fetch Banners from Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "system"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().banners) {
        setBanners(docSnap.data().banners);
      }
    });

    // Fetch News from Collection
    const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(10)), (snap) => {
      if (!snap.empty) {
        setNews(snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsItemData)));
      } else {
        setNews(STATIC_NEWS);
      }
    });

    return () => {
      unsubSettings();
      unsubNews();
    };
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const bannerInterval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(bannerInterval);
  }, [banners.length]);
  
  const [stats, setStats] = useState({
    volume: 1.2,
    users: 850,
    volumeChange: 5.4,
    usersChange: 1.2
  });

  const [prices, setPrices] = useState({
    btc: 74133.80,
    eth: 2316.28,
    xau: 4800.28,
    btcChange: 2.45,
    ethChange: -1.12,
    xauChange: 0.85
  });

  useEffect(() => {
    // Update stats and prices
    const interval = setInterval(async () => {
      // Update stats
      setStats(prev => ({
        ...prev,
        volume: +(prev.volume + (Math.random() * 0.1 - 0.05)).toFixed(3),
        users: +(prev.users + (Math.random() * 10 - 5)).toFixed(0),
        volumeChange: +(prev.volumeChange + (Math.random() * 0.4 - 0.2)).toFixed(2),
        usersChange: +(prev.usersChange + (Math.random() * 0.2 - 0.1)).toFixed(2)
      }));

      // Update the main display prices
      const newRealPrices: Record<string, number> = {};
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
          newRealPrices[product.symbol] = basePrice + noise;
        } else {
          newRealPrices[product.symbol] = manipulatedPrice;
        }
      }
      setRealPrices(prev => ({ ...prev, ...newRealPrices }));

      setPrices(prev => {
        const btcPrice = newRealPrices['BTCUSD'] || prev.btc;
        const ethPrice = newRealPrices['ETHUSD'] || prev.eth;
        const xauPrice = newRealPrices['XAUUSD'] || prev.xau;
        
        return {
          ...prev,
          btc: btcPrice,
          eth: ethPrice,
          xau: xauPrice,
          btcChange: +((btcPrice - 72350) / 72350 * 100).toFixed(2),
          ethChange: +((ethPrice - 2342) / 2342 * 100).toFixed(2),
          xauChange: +((xauPrice - 4760) / 4760 * 100).toFixed(2)
        };
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [hasApiKey]);

  const seedInitialNews = async () => {
    try {
      const newsRef = collection(db, "news");
      const existingDocs = await getDocs(newsRef);
      
      // If we already have news, don't seed
      if (existingDocs.size >= 3) return;

      const existingTitles = existingDocs.docs.map(doc => doc.data().title);
      const initialData = [
        {
          title: "美联储维持利率不变，市场预期下半年降息",
          time: "10分钟前",
          image: "https://picsum.photos/seed/finance/800/400",
          content: "美联储在最新的议息会议上决定维持基准利率在5.25%-5.50%区间不变。主席鲍威尔表示，尽管通胀已有所放缓，但仍高于2%的目标水平。市场分析师普遍预计，如果通胀数据继续改善，美联储可能在今年第三季度开启首次降息。这一消息引发了股市和债市的积极反应，投资者对经济软着陆的信心有所增强。\n\n此外，鲍威尔强调，未来的政策路径将继续取决于数据。虽然目前的利率水平被认为是限制性的，但美联储仍准备在必要时采取进一步行动。市场正在密切关注即将公布的非农就业数据和CPI报告，以寻找更多关于降息时机的线索。",
          createdAt: serverTimestamp()
        },
        {
          title: "黄金价格创历史新高，避险情绪持续升温",
          time: "1小时前",
          image: "https://picsum.photos/seed/gold/800/400",
          content: "受地缘政治紧张局势和主要央行购金需求的推动，国际金价今日突破2400美元/盎司大关，创下历史新高。分析师指出，在全球经济不确定性增加的背景下，黄金作为传统避险资产的吸引力进一步凸显。\n\n除了避险需求外，通胀预期和货币政策的不确定性也是推动金价上涨的关键因素。许多投资者将其视为对冲法币贬值的工具。目前，技术面显示黄金仍处于强劲的上行通道中，尽管短期内可能存在回调压力，但长期看涨情绪依然稳固。",
          createdAt: serverTimestamp()
        },
        {
          title: "数字货币市场波动加剧，投资者需警惕风险",
          time: "3小时前",
          image: "https://picsum.photos/seed/crypto/800/400",
          content: "今日数字货币市场出现剧烈波动，比特币在触及历史高点后迅速回调，跌幅一度超过5%。以太坊及其他主流代币也跟随下跌。监管机构再次发出警告，提醒投资者注意虚拟货币交易的高风险性。\n\n专家建议，在市场情绪极度亢奋时，投资者应保持冷静，合理配置资产，避免盲目追高。随着ETF的获批和机构资金的入场，市场结构正在发生变化，但其高波动性的本质并未改变。投资者应关注各国监管政策的最新动向，并做好风险管理。",
          createdAt: serverTimestamp()
        }
      ];

      for (const item of initialData) {
        if (!existingTitles.includes(item.title)) {
          await addDoc(newsRef, item);
        }
      }
    } catch (err) {
      console.error("Seeding failed:", err);
    }
  };

  const handleFeatureClick = (label: string) => {
    switch (label) {
      case t('fast_account'):
        onTabChange('mine', { mode: 'register' });
        break;
      case t('fund_security'):
        setModalContent({
          title: t('fund_security_title'),
          content: t('fund_security_desc'),
          icon: <Shield className="h-12 w-12 text-green-500 mb-4" />
        });
        setShowModal(true);
        break;
      case t('global_market'):
        onTabChange('market');
        break;
      case t('pro_analysis'):
        setModalContent({
          title: t('pro_analysis_title'),
          content: t('pro_analysis_desc'),
          icon: <TrendingUp className="h-12 w-12 text-purple-500 mb-4" />
        });
        setShowModal(true);
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b">
        <div className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div className="flex items-end gap-0.5 h-4">
              <div className="w-0.5 h-1.5 bg-black"></div>
              <div className="w-0.5 h-3 bg-black"></div>
              <div className="w-0.5 h-4.5 bg-[#39ff14]"></div>
            </div>
            <div className="flex items-baseline leading-none">
              <span className="text-[#39ff14] font-black text-lg tracking-tighter">IC</span>
              <span className="text-black font-black text-lg tracking-tighter">Markets</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Search className="h-5 w-5 text-gray-400" />
          <Bell className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="px-4 py-4">
        <div className="relative h-[180px] w-full overflow-hidden rounded-2xl shadow-lg bg-gray-100">
          {banners.length > 0 && banners[currentBanner] ? (
            <AnimatePresence initial={false}>
              <motion.div
                key={currentBanner}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className={`absolute inset-0 text-white ${banners[currentBanner].image ? '' : `bg-gradient-to-br ${banners[currentBanner].gradient || 'from-[#0166fc] to-[#004dc2]'}`}`}
              >
                {banners[currentBanner].image && (
                  <img 
                    src={banners[currentBanner].image} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    alt="" 
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {!banners[currentBanner].image ? (
                  <div className="relative z-10 p-6">
                    <h2 className="text-2xl font-black mb-2 leading-tight">{banners[currentBanner].title || ''}</h2>
                    <p className="text-blue-50 text-sm mb-6 opacity-90">{banners[currentBanner].subtitle || ''}</p>
                    {banners[currentBanner].buttonText && (
                      <button 
                        onClick={banners[currentBanner].onClick || onSelectMarket}
                        className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
                      >
                        {banners[currentBanner].buttonText}
                      </button>
                    )}
                  </div>
                ) : (
                  // If it's an image banner, make the whole area clickable if an onClick exists
                  <div 
                    className="absolute inset-0 z-10 cursor-pointer p-6" 
                    onClick={banners[currentBanner].onClick || onSelectMarket}
                  >
                    {/* Even with an image, we might want to show title/subtitle if provided */}
                    {banners[currentBanner].title && (
                      <div className="relative z-20">
                        <h2 className="text-2xl font-black mb-2 leading-tight drop-shadow-md">{banners[currentBanner].title}</h2>
                        <p className="text-white/90 text-sm mb-6 drop-shadow-sm">{banners[currentBanner].subtitle}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Decorative elements */}
                {!banners[currentBanner].image && (
                  <>
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-gray-200 animate-spin" />
            </div>
          )}

          {/* Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 right-6 flex gap-1.5 z-20">
              {banners.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        <StatCard 
          label={t('vol_24h')} 
          value={`$${stats.volume}B`} 
          change={`${stats.volumeChange > 0 ? '+' : ''}${stats.volumeChange}%`} 
          isUp={stats.volumeChange >= 0} 
        />
        <StatCard 
          label={t('active_users')} 
          value={`${stats.users}K+`} 
          change={`${stats.usersChange > 0 ? '+' : ''}${stats.usersChange}%`} 
          isUp={stats.usersChange >= 0} 
        />
        <StatCard label={t('security_level')} value="AAA" change="Stable" isUp={true} />
      </div>

      {/* Features Grid */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-4 gap-4">
          <FeatureItem icon={<Zap className="text-yellow-500" />} label={t('fast_account')} onClick={() => handleFeatureClick(t('fast_account'))} />
          <FeatureItem icon={<Shield className="text-green-500" />} label={t('fund_security')} onClick={() => handleFeatureClick(t('fund_security'))} />
          <FeatureItem icon={<Globe className="text-blue-500" />} label={t('global_market')} onClick={() => handleFeatureClick(t('global_market'))} />
          <FeatureItem icon={<TrendingUp className="text-purple-500" />} label={t('pro_analysis')} onClick={() => handleFeatureClick(t('pro_analysis'))} />
        </div>
      </div>

      {/* Market Ticker */}
      <div className="mb-6 overflow-hidden bg-white/50 backdrop-blur-sm py-2 border-y border-gray-100 flex">
        <motion.div 
          className="flex whitespace-nowrap gap-8 pr-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 50, 
            repeat: Infinity, 
            ease: "linear",
            repeatType: "loop"
          }}
          style={{ willChange: "transform" }}
        >
          {/* Two identical sets for a seamless infinite loop */}
          <div className="flex gap-8 items-center">
            {PRODUCTS.map(product => (
              <TickerItem 
                key={product.id}
                symbol={product.symbol} 
                price={realPrices[product.symbol] || product.price} 
                change={product.change} 
              />
            ))}
          </div>
          <div className="flex gap-8 items-center">
            {PRODUCTS.map(product => (
              <TickerItem 
                key={`${product.id}-clone`}
                symbol={product.symbol} 
                price={realPrices[product.symbol] || product.price} 
                change={product.change} 
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Feature Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              {modalContent.icon}
              <h3 className="text-xl font-black text-gray-900 mb-4">{modalContent.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">{modalContent.content}</p>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full bg-[#0166fc] text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                {t('i_know')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Market Preview */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">{t('market')}</h3>
          <button onClick={onSelectMarket} className="text-[#0166fc] text-sm font-bold flex items-center gap-1">
            {t('more_market')} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <MarketRow 
            symbol="BTC/USDT" 
            price={prices.btc.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
            change={`${prices.btcChange > 0 ? '+' : ''}${prices.btcChange}%`} 
            isUp={prices.btcChange >= 0} 
          />
          <MarketRow 
            symbol="ETH/USDT" 
            price={prices.eth.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
            change={`${prices.ethChange > 0 ? '+' : ''}${prices.ethChange}%`} 
            isUp={prices.ethChange >= 0} 
          />
          <MarketRow 
            symbol="XAU/USD" 
            price={prices.xau.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
            change={`${prices.xauChange > 0 ? '+' : ''}${prices.xauChange}%`} 
            isUp={prices.xauChange >= 0} 
          />
        </div>
      </div>

      {/* News Section */}
      <div className="px-4 mb-8">
        <h3 className="font-bold text-lg text-gray-900 mb-4">{t('industry_news')}</h3>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id}>
              <NewsItem 
                title={item.title}
                time={item.time}
                image={item.image}
                onClick={() => setSelectedNews(item)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Professional Footer Info */}
      <div className="bg-black text-white px-3 py-10 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Headphones className="h-6 w-6 text-blue-400" />
            <h4 className="text-lg font-bold">Contact</h4>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            We welcome any inquiries, suggestions, and feedback. Please feel free to contact us. Our working hours are Monday to Sunday 00:00 - 23:59 (UTC-4)
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-blue-400" />
            <h4 className="text-lg font-bold">Email</h4>
          </div>
          <p className="text-blue-400 text-sm font-medium">support@icmarketsltds.cc</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-400" />
            <h4 className="text-lg font-bold">Group Address</h4>
          </div>
          <p className="text-gray-400 text-sm">Manhattan, New York, NY, USA</p>
        </div>

        <div className="pt-2 -mt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-64 overflow-y-auto custom-scrollbar">
            <p className="text-gray-500 text-[11px] leading-relaxed">
              IC Markets Global is an Australian online forex and CFD broker that provides traders with access to global financial markets. Founded in 2007, the company is regulated by the Australian Securities and Investments Commission (ASIC) and the Cyprus Securities and Exchange Commission (CySEC). IC Markets offers over 2,250 CFDs, 61 currency pairs, 24 commodities, over 2,100 stocks, 25 indices, 9 bonds, 21 cryptocurrencies, and 4 futures contracts through advanced trading platforms such as MetaTrader 4, MetaTrader 5, cTrader, and TradingView. The company also provides 24/7 customer support and a variety of educational resources for traders of all levels. As a professional system service team, FXTM boasts an industry-leading spread control module, a comprehensive data source interface, and 24/7 technical customer support. This ensures that customers can operate stably and respond promptly across all time zones and market conditions. We cater to the global market, offering deeply customized trading architectures to meet the diverse needs of clients ranging from fledgling trading platforms to mature brokers. Leveraging our robust technical capabilities and international perspective, FXTM is emerging as a trustworthy partner in the global trading technology services sector.
            </p>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-[10px] leading-relaxed italic">
              IC Markets (EU) Ltd is a limited company registered in Cyprus under company number HE 356877, and is authorized and regulated by the Cyprus Securities and Exchange Commission with License No. 362/18. The head office address is at 86 Franklinou Roosvelt, 4th floor, Office 401, 3011 Omonoia, Limassol, Cyprus.
            </p>
          </div>
        </div>
      </div>

      {/* News Detail Overlay */}
      {selectedNews && (
        <div className="fixed inset-0 z-[200] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b z-10">
            <button onClick={() => setSelectedNews(null)} className="p-2 -ml-2 active:scale-90 transition-transform">
              <X className="h-6 w-6 text-gray-900" />
            </button>
            <span className="font-bold text-gray-900">{t('news_detail')}</span>
            <button className="p-2 -mr-2 active:scale-90 transition-transform">
              <Share2 className="h-5 w-5 text-gray-900" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <img 
              src={selectedNews.image} 
              className="w-full aspect-video object-cover" 
              alt="" 
              referrerPolicy="no-referrer" 
            />
            
            <div className="p-6">
              <h1 className="text-2xl font-black text-gray-900 leading-tight mb-4">
                {selectedNews.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-8 text-gray-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{selectedNews.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span>{t('official_source')}</span>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                {selectedNews.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-gray-600 leading-relaxed mb-4 text-[15px]">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center italic">
                  {t('disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TickerItem({ symbol, price, change }: { symbol: string, price: number, change: number, key?: string }) {
  const isUp = change >= 0;
  
  // Simple icon mapping
  const getIcon = (sym: string) => {
    if (sym.includes('BTC')) return <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white font-bold">B</div>;
    if (sym.includes('ETH')) return <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">E</div>;
    if (sym.includes('XAU')) return <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] text-white font-bold">G</div>;
    if (sym.includes('EUR')) return <div className="w-4 h-4 rounded-full bg-blue-700 flex items-center justify-center text-[8px] text-white font-bold">€</div>;
    if (sym.includes('GBP')) return <div className="w-4 h-4 rounded-full bg-red-700 flex items-center justify-center text-[8px] text-white font-bold">£</div>;
    return <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-[8px] text-white font-bold">$</div>;
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon(symbol)}
      <span className="text-xs font-bold text-gray-500 uppercase">{symbol}</span>
      <span className="text-xs font-black text-gray-900 tabular-nums">
        {price.toLocaleString(undefined, { minimumFractionDigits: symbol.includes('JPY') ? 3 : 2 })}
      </span>
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isUp ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
        {isUp ? '+' : ''}{change}%
      </span>
    </div>
  );
}

function StatCard({ label, value, change, isUp }: { label: string, value: string, change: string, isUp: boolean }) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm h-[84px] flex flex-col justify-between">
      <p className="text-[10px] text-gray-400 font-bold mb-1">{label}</p>
      <p className="text-sm font-black text-gray-900 mb-1 tabular-nums">{value}</p>
      <p className={`text-[10px] font-bold tabular-nums ${isUp ? 'text-green-500' : 'text-red-500'}`}>{change}</p>
    </div>
  );
}

function FeatureItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
      </div>
      <span className="text-[11px] font-bold text-gray-600">{label}</span>
    </button>
  );
}

function MarketRow({ symbol, price, change, isUp }: { symbol: string, price: string, change: string, isUp: boolean }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between h-[72px]">
      <span className="font-bold text-gray-800">{symbol}</span>
      <div className="flex items-center gap-4">
        <span className="font-black text-gray-900 tabular-nums">{price}</span>
        <span className={`px-2 py-1 rounded-lg text-xs font-bold min-w-[65px] text-center ${
          isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function NewsItem({ title, time, image, onClick }: { title: string, time: string, image: string, onClick?: () => void }) {
  return (
    <div className="flex gap-4 items-center active:opacity-70 transition-opacity cursor-pointer h-20 overflow-hidden" onClick={onClick}>
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        <img src={image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
      </div>
      <div className="flex-1 flex flex-col justify-center h-full">
        <h4 className="font-bold text-sm text-gray-800 leading-snug mb-1 line-clamp-2">{title}</h4>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
}


