import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Calendar, 
  Users, 
  Shield, 
  BarChart3, 
  CheckCircle, 
  Star,
  ArrowRight,
  Sparkles
} from "lucide-react";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";
import SessionRecoveryModal from "@/components/SessionRecoveryModal";
import heroImage from "@/assets/health-fair-collage.jpg";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionRecoveryOpen, setIsSessionRecoveryOpen] = useState(false);
  const [userEmailForRecovery, setUserEmailForRecovery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener - MUST be synchronous to prevent deadlocks
    // DO NOT call getSession() as it triggers token refresh even with autoRefreshToken disabled
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {  // NOT async!
        console.log('Auth state change:', event, session?.user?.email);
        
        // CRITICAL: Ignore TOKEN_REFRESHED events to prevent sign-out from failed refresh
        // The backend refresh endpoint is broken, but we can stay signed in with the access token
        if (event === 'TOKEN_REFRESHED') {
          console.log('Ignoring TOKEN_REFRESHED event to prevent sign-out from backend error');
          return; // Don't update state, keep current session
        }
        
        // Handle different auth events - only synchronous state updates
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
          setUser(null);
          setIsSessionRecoveryOpen(false);
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          console.log('User signed in or initial session loaded');
          setSession(session);
          setUser(session?.user ?? null);
          setIsSessionRecoveryOpen(false);
        } else if (event === 'USER_UPDATED') {
          console.log('User updated');
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          // For any other events, check if we lost the session unexpectedly
          if (!session && user) {
            console.log('Session lost unexpectedly, showing recovery modal');
            setUserEmailForRecovery(user.email || "");
            setIsSessionRecoveryOpen(true);
          }
          setSession(session);
          setUser(session?.user ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [user]);

  const handleSignIn = () => {
    setAuthModalTab("signin");
    setIsAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthModalTab("signup");
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const handleSessionRecoverySuccess = () => {
    toast({
      title: "Session Restored",
      description: "You've been successfully signed in again.",
    });
  };

  // If authenticated, show dashboard
  if (user) {
    return (
      <>
        <Header 
          isAuthenticated={!!user}
          onSignOut={handleSignOut}
        />
        <Dashboard user={user} />
      </>
    );
  }

  // Landing page
  const features = [
    {
      icon: Calendar,
      title: "Event Management",
      description: "Create, schedule, and manage health fair events with our intuitive interface."
    },
    {
      icon: Users,
      title: "Attendee Registration",
      description: "Streamline registration process and manage participant data efficiently."
    },
    {
      icon: Shield,
      title: "Vendor Coordination",
      description: "Coordinate with healthcare vendors and manage booth assignments seamlessly."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Get detailed insights and generate comprehensive reports for your events."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Health Services Director",
      company: "City Medical Center",
      content: "HealthFair Pro has transformed how we organize our community health events. The platform is intuitive and saves us hours of coordination work.",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Corporate Wellness Manager",
      company: "TechCorp Inc.",
      content: "Managing our annual health fair has never been easier. The vendor coordination features are particularly impressive.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated={!!user}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onSignOut={handleSignOut}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-primary-glow/20 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                Now with AI-powered insights
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">
                  Health Fair Events
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-primary-foreground/90 mb-8 max-w-2xl">
                Streamline your health fair management with our comprehensive SaaS platform. 
                From attendee registration to vendor coordination, we've got you covered.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={handleSignUp}
                  className="bg-white text-primary hover:bg-white/90 shadow-glow"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-white/30 text-primary-foreground hover:bg-white/10"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl"></div>
              <img 
                src={heroImage} 
                alt="Health Fair Management Dashboard" 
                className="relative rounded-2xl shadow-medical w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to organize, 
              manage, and analyze your health fair events.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="shadow-card hover:shadow-medical transition-[var(--transition-smooth)] group">
                  <CardHeader className="pb-4">
                    <div className="bg-gradient-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-glow transition-[var(--transition-smooth)]">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our customers are saying about HealthFair Pro
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-accent fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-foreground mb-6 italic">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Health Fairs?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of healthcare organizations already using HealthFair Pro 
            to create successful health fair events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl"
              onClick={handleSignUp}
              className="bg-white text-primary hover:bg-white/90 shadow-glow"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="xl"
              onClick={handleSignIn}
              className="border-white/30 text-primary-foreground hover:bg-white/10"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">HealthFair Pro</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 HealthFair Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Session Recovery Modal */}
      <SessionRecoveryModal
        isOpen={isSessionRecoveryOpen}
        onClose={() => setIsSessionRecoveryOpen(false)}
        onRecoverySuccess={handleSessionRecoverySuccess}
        userEmail={userEmailForRecovery}
      />
    </div>
  );
};

export default Index;
