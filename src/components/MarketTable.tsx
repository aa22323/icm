import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { marketService } from "../services/marketService";

import { PRODUCTS } from "../constants";

export default function MarketTable() {
  const [prices, setPrices] = useState<Record<string, number>>({});
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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Market Overview</h2>
            <p className="text-muted-foreground">Real-time prices of top digital assets and forex pairs.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Crypto</button>
            <button className="px-4 py-2 rounded-lg bg-background border text-sm font-medium hover:bg-muted">Forex</button>
            <button className="px-4 py-2 rounded-lg bg-background border text-sm font-medium hover:bg-muted">Stocks</button>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Symbol</TableHead>
                <TableHead>Last Price</TableHead>
                <TableHead>24h Change</TableHead>
                <TableHead className="hidden md:table-cell">24h High</TableHead>
                <TableHead className="hidden md:table-cell">24h Low</TableHead>
                <TableHead className="hidden md:table-cell">24h Volume</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUCTS.map((product) => {
                const currentPrice = prices[product.symbol] || product.price;
                return (
                  <TableRow key={product.symbol} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {product.symbol.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold">{product.symbol}</div>
                          <div className="text-[10px] text-muted-foreground">{product.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{currentPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      {(() => {
                        const dailyOpen = marketService.getDailyOpenPrice(product.symbol, product.price);
                        const change = currentPrice - dailyOpen;
                        const changePercent = (change / dailyOpen) * 100;
                        const isPos = change >= 0;
                        
                        return (
                          <div className={`flex items-center gap-1 font-medium ${isPos ? 'text-chart-1' : 'text-chart-2'}`}>
                            {isPos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {isPos ? '+' : ''}{changePercent.toFixed(2)}%
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{(currentPrice * 1.02).toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{(currentPrice * 0.98).toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">1.2B</TableCell>
                    <TableCell className="text-right">
                      <button className="text-primary font-bold hover:underline">Trade</button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-8 text-center">
          <button className="text-primary font-bold hover:underline">View All Markets</button>
        </div>
      </div>
    </section>
  );
}
