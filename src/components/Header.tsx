import { Button } from "@/components/ui/button";
import { Globe, Menu, User } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl">
            C
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            CAL Investments
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#" className="transition-colors hover:text-primary">Markets</a>
          <a href="#" className="transition-colors hover:text-primary">Trade</a>
          <a href="#" className="transition-colors hover:text-primary">Investment</a>
          <a href="#" className="transition-colors hover:text-primary">About Us</a>
          <a href="#" className="transition-colors hover:text-primary">Support</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground mr-4">
            <Globe className="h-4 w-4" />
            <span className="text-xs">English</span>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            Login
          </Button>
          <Button size="sm">
            Register
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4">
          <a href="#" className="text-sm font-medium">Markets</a>
          <a href="#" className="text-sm font-medium">Trade</a>
          <a href="#" className="text-sm font-medium">Investment</a>
          <a href="#" className="text-sm font-medium">About Us</a>
          <a href="#" className="text-sm font-medium">Support</a>
        </div>
      )}
    </header>
  );
}
