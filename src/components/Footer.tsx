import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">
                C
              </div>
              <span className="text-xl font-bold tracking-tight">
                CAL Investments
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              CAL Investments Limited is a global leader in online trading and investment services, providing access to worldwide financial markets.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Market Data</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trading Platform</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Investment Plans</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">About Company</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Support</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trading Guides</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Security Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Contact Info</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>Financial District, London, EC2V 7NQ, United Kingdom</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+44 20 7123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>support@calinvestments.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            © 2026 CAL Investments Limited. All rights reserved.
          </p>
          <div className="max-w-4xl mx-auto text-[10px] text-muted-foreground leading-relaxed">
            Risk Warning: Trading financial instruments involves significant risk and can result in the loss of your invested capital. You should not invest more than you can afford to lose and should ensure that you fully understand the risks involved. Trading leveraged products may not be suitable for all investors. Before trading, please take into consideration your level of experience, investment objectives and seek independent financial advice if necessary.
          </div>
        </div>
      </div>
    </footer>
  );
}
