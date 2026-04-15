import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { TrendingUp, Shield, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
              <Zap className="h-3 w-3" />
              <span>THE WORLD'S LEADING TRADING PLATFORM</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Invest in the <span className="text-primary">Future</span> of Finance
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-lg">
              Access global markets with professional tools, lightning-fast execution, and institutional-grade security.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold">
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold">
                View Markets
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold">$2.4B+</div>
                <div className="text-sm text-muted-foreground">Trading Volume</div>
              </div>
              <div>
                <div className="text-3xl font-bold">1.2M+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold">0.01s</div>
                <div className="text-sm text-muted-foreground">Avg. Execution</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl border bg-card p-4 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-orange-500 flex items-center justify-center text-white font-bold">B</div>
                  <div>
                    <div className="font-bold">BTC/USDT</div>
                    <div className="text-[10px] text-muted-foreground">Bitcoin / Tether</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-chart-1">64,231.50</div>
                  <div className="text-[10px] text-chart-1">+2.45%</div>
                </div>
              </div>
              
              {/* Mock Chart Area */}
              <div className="h-64 w-full bg-muted/30 rounded-lg flex items-end gap-1 p-2">
                {[40, 60, 45, 70, 55, 80, 75, 90, 85, 100, 95, 110, 105, 120, 115, 130].map((h, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-1000 ${i % 3 === 0 ? 'bg-chart-2' : 'bg-chart-1'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button className="w-full bg-chart-1 hover:bg-chart-1/90 font-bold">BUY</Button>
                <Button className="w-full bg-chart-2 hover:bg-chart-2/90 font-bold">SELL</Button>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 bg-background border rounded-xl p-4 shadow-xl hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold">Secure Wallet</div>
                  <div className="text-[10px] text-muted-foreground">Bank-grade encryption</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
