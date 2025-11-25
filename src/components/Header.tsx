import { Button } from "@/components/ui/button";
import { Heart, Menu, X, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
}

const Header = ({ isAuthenticated = false, onSignIn, onSignUp, onSignOut }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        toast({
          title: "Session Refresh Failed",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      } else if (data.session) {
        toast({
          title: "Session Refreshed",
          description: "Your session has been updated successfully.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Unable to refresh session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefreshSession}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Session
                </Button>
                <Button variant="outline" size="sm" onClick={onSignOut}>
                  Sign Out
                </Button>
              </div>
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
                  <>
                    <Button variant="ghost" size="sm" className="justify-start">
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefreshSession}
                      disabled={isRefreshing}
                      className="justify-start"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh Session
                    </Button>
                    <Button variant="outline" size="sm" onClick={onSignOut} className="justify-start">
                      Sign Out
                    </Button>
                  </>
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