import { Shield, Zap, Headphones, Globe, BarChart3, Lock } from "lucide-react";

const features = [
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Secure & Regulated",
    description: "Your funds are protected by institutional-grade security and full regulatory compliance."
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Ultra-Fast Execution",
    description: "Execute trades in milliseconds with our high-performance matching engine."
  },
  {
    icon: <Headphones className="h-8 w-8 text-primary" />,
    title: "24/7 Expert Support",
    description: "Our dedicated support team is available around the clock to assist you with any queries."
  },
  {
    icon: <Globe className="h-8 w-8 text-primary" />,
    title: "Global Market Access",
    description: "Trade thousands of assets across Forex, Crypto, Stocks, and Commodities from one account."
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: "Advanced Analytics",
    description: "Professional charting tools and technical indicators to help you make informed decisions."
  },
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Privacy First",
    description: "We prioritize your privacy with end-to-end encryption and strict data protection policies."
  }
];

export default function Features() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose CAL Investments?</h2>
          <p className="text-lg text-muted-foreground">
            We provide a comprehensive trading ecosystem designed for both beginners and professional traders.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow">
              <div className="mb-6 h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
