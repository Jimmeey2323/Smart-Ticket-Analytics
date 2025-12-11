import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Ticket, 
  BarChart3, 
  Users, 
  Bell, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background font-bold">
              P57
            </div>
            <span className="font-semibold hidden sm:inline">Physique 57 India</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleLogin} data-testid="button-login">
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Customer Feedback
              <span className="block text-muted-foreground">Management System</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive ticket management platform for Physique 57 India's internal teams. 
              Record, track, and resolve customer feedback efficiently with AI-powered insights.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">
                  Learn More
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">13</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-sm text-muted-foreground">Subcategories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">Studio Locations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">8</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Powerful Features</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage customer feedback effectively and improve service quality.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mt-4 text-muted-foreground">
                Sign in with your account to access the ticket management system.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4">
                <Button size="lg" onClick={handleLogin} data-testid="button-signin-bottom">
                  Sign In to Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Secure Authentication</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Role-based Access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Real-time Updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs">
                P57
              </div>
              <span className="text-sm text-muted-foreground">
                Physique 57 India - Internal Tool
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Physique 57. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
