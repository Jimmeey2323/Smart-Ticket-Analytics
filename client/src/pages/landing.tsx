import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  BarChart3, 
  Users, 
  Bell, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, animate } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

const COLORS_TOP = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
const COLORS_TOP_LIGHT = ['#93c5fd', '#c4b5fd', '#f472b6', '#22d3ee'];

export default function Landing() {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();
  const color = useMotionValue(COLORS_TOP[0]);

  // Determine if dark mode is active
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const colors = isDark ? COLORS_TOP : COLORS_TOP_LIGHT;

  useEffect(() => {
    animate(color, colors, {
      ease: 'easeInOut',
      duration: 10,
      repeat: Infinity,
      repeatType: 'mirror',
    });
  }, [isDark]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, hsl(var(--background)) 50%, ${color})`;

  const handleLogin = () => {
    setShowAuthForm(true);
    setIsSignUp(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Ticket,
      title: "Smart Ticket Management",
      description: "Create, track, and resolve customer feedback tickets with intelligent categorization and routing."
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Automatic sentiment analysis, keyword extraction, and smart categorization using AI."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Auto-assign tickets to the right teams, track workloads, and collaborate seamlessly."
    },
    {
      icon: Bell,
      title: "Automated Notifications",
      description: "Stay informed with real-time alerts for assignments, status changes, and SLA breaches."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards with KPIs, trends, and performance metrics."
    },
    {
      icon: Shield,
      title: "SLA Tracking",
      description: "Monitor resolution times with visual indicators and automatic escalations."
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/logo.png" alt="Physique 57 India" className="h-9 w-auto" />
            <span className="font-semibold hidden sm:inline text-foreground">Physique 57 India</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ThemeToggle />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleLogin} 
                data-testid="button-login"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <AnimatePresence>
        {showAuthForm && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setShowAuthForm(false)}
                className="absolute -top-10 -right-10 z-10 p-2 rounded-full hover:bg-white/10 transition-colors text-foreground"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
              <Card className="w-full max-w-md mx-4 border-2 border-blue-500/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Sparkles className="w-5 h-5" />
                    {isSignUp ? "Create Account" : "Sign In"}
                  </CardTitle>
                  <CardDescription>
                    {isSignUp 
                      ? "Enter your email to create a new account" 
                      : "Enter your email and password to sign in"}
                  </CardDescription>
                </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@physique57.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <motion.div 
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSignUp ? "Sign Up" : "Sign In"}
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAuthForm(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
                <div className="text-center text-sm">
                  {isSignUp ? (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setIsSignUp(false)}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setIsSignUp(true)}
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section with Animated Background */}
        <motion.section
          style={{ backgroundImage }}
          className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12"
        >
          {/* Animated background stars */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 3 + 'px',
                  height: Math.random() * 3 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  opacity: Math.random() * 0.5 + 0.1,
                }}
                animate={{
                  opacity: [0.1, 0.5, 0.1],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 container mx-auto max-w-4xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-block rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 px-6 py-2.5 text-sm font-medium shadow-lg shadow-blue-500/20"
            >
              ✨ Smart Ticket Management • AI Analytics • Real-time Insights
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-br from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                Smart Ticket Management<br />for Physique 57 India
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12 max-w-3xl mx-auto text-lg text-gray-200 leading-relaxed"
            >
              Transform your customer feedback into actionable insights. Track, analyze, and resolve tickets efficiently with AI-powered categorization and intelligent team routing.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Button 
                size="lg" 
                onClick={handleLogin} 
                data-testid="button-get-started"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 shadow-lg shadow-purple-500/50 hover:shadow-purple-600/70 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="border-2 border-blue-400/30 hover:bg-blue-500/10"
              >
                <a href="#features">
                  Learn More
                </a>
              </Button>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
            >
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-blue-400/50 transition-all duration-300">
                <div className="text-xl md:text-2xl font-bold text-blue-400">13</div>
                <div className="text-xs text-gray-300">Categories</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-400/50 transition-all duration-300">
                <div className="text-xl md:text-2xl font-bold text-purple-400">100+</div>
                <div className="text-xs text-gray-300">Fields</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-cyan-400/50 transition-all duration-300">
                <div className="text-xl md:text-2xl font-bold text-cyan-400">8</div>
                <div className="text-xs text-gray-300">Locations</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-pink-400/50 transition-all duration-300">
                <div className="text-xl md:text-2xl font-bold text-pink-400">AI</div>
                <div className="text-xs text-gray-300">Powered</div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <section className="border-y border-blue-500/20 bg-gradient-to-b from-background via-blue-950/10 to-background backdrop-blur-xl">
          <div className="container mx-auto px-4 py-16">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              viewport={{ once: true }}
            >
              {[
                { num: '13', label: 'Categories' },
                { num: '100+', label: 'Subcategories' },
                { num: '8', label: 'Locations' },
                { num: '8', label: 'Departments' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{stat.num}</div>
                  <div className="text-sm text-gray-300 mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-16 md:py-24">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg">
              Everything you need to manage customer feedback effectively and improve service quality.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="relative overflow-hidden h-full bg-white/5 backdrop-blur-lg border border-blue-400/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-400/50">
                        <feature.icon className="h-6 w-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-gray-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-blue-500/20 bg-gradient-to-b from-background via-purple-950/10 to-background backdrop-blur-xl">
          <div className="container mx-auto px-4 py-16">
            <motion.div 
              className="mx-auto max-w-3xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-gray-300 text-lg">
                Sign in with your account to access the ticket management system.
              </p>
              <div className="mt-8 flex flex-col items-center gap-6">
                <Button 
                  size="lg" 
                  onClick={handleLogin} 
                  data-testid="button-signin-bottom"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 shadow-lg shadow-purple-500/50 hover:shadow-purple-600/70 transition-all duration-300"
                >
                  Sign In to Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <motion.div 
                  className="flex flex-wrap items-center justify-center gap-6 text-sm"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {[
                    { icon: <CheckCircle2 className="h-5 w-5 text-blue-400" />, label: 'Secure Authentication' },
                    { icon: <CheckCircle2 className="h-5 w-5 text-purple-400" />, label: 'Role-based Access' },
                    { icon: <CheckCircle2 className="h-5 w-5 text-cyan-400" />, label: 'Real-time Updates' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-lg border border-white/10">
                      {item.icon}
                      <span className="text-gray-300">{item.label}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blue-500/20 bg-gradient-to-t from-background via-background to-transparent py-8">
          <div className="container mx-auto px-4">
            <motion.div 
              className="flex flex-col md:flex-row items-center justify-between gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Physique 57 India" className="h-7 w-auto" />
                <span className="text-sm text-muted-foreground">
                  Physique 57 India - Smart Ticket Management
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Physique 57. All rights reserved.
              </p>
            </motion.div>
          </div>
        </footer>
      </main>
    </div>
  );
}
