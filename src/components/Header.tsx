import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
}

const Header = ({ isAuthenticated = false, onSignIn, onSignUp, onSignOut }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">HealthFair Pro</h1>
              <p className="text-xs text-muted-foreground">Event Management</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-[var(--transition-smooth)]">
              Features
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-[var(--transition-smooth)]">
              Pricing
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-[var(--transition-smooth)]">
              About
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={onSignOut}>
                Sign Out
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={onSignIn}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" onClick={onSignUp}>
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-foreground hover:text-primary transition-[var(--transition-smooth)]">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-[var(--transition-smooth)]">
                Pricing
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-[var(--transition-smooth)]">
                About
              </a>
              
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                {isAuthenticated ? (
                  <Button variant="outline" size="sm" onClick={onSignOut} className="justify-start">
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={onSignIn} className="justify-start">
                      Sign In
                    </Button>
                    <Button variant="hero" size="sm" onClick={onSignUp} className="justify-start">
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;