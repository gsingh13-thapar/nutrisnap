import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, BookOpen, Calendar, TrendingUp, Sparkles, Apple } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Apple className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">NutriSnap</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
          <Button asChild className="gradient-primary">
            <Link to="/auth?signup=true">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Nutrition Tracking</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Know What You Eat with{" "}
            <span className="text-gradient">Just a Photo</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Snap a photo of your meal and instantly get detailed nutritional information. 
            Track your calories, protein, and macros effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gradient-primary text-lg px-8 py-6">
              <Link to="/auth?signup=true">Start Free Today</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
              <Link to="/auth">I Have an Account</Link>
            </Button>
          </div>
        </div>

        {/* Feature Cards Preview */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="shadow-elevated hover:shadow-floating transition-shadow duration-300 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-calories/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-7 h-7 text-calories" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Photo Analysis</h3>
              <p className="text-muted-foreground">
                Take a photo of any meal and get instant calorie & macro breakdown using AI
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elevated hover:shadow-floating transition-shadow duration-300 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-protein/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-protein" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Recipe Collection</h3>
              <p className="text-muted-foreground">
                Browse healthy recipes with nutrition info, or add your own favorites
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elevated hover:shadow-floating transition-shadow duration-300 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Food Diary</h3>
              <p className="text-muted-foreground">
                Plan your meals and track daily nutrition with visual progress charts
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Your Complete Nutrition Companion
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to understand and improve your eating habits
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-calories/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-calories">🔥</span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Track Calories</h3>
              <p className="text-muted-foreground text-sm">
                See exactly how many calories you consume each day
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-protein/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">💪</span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Hit Protein Goals</h3>
              <p className="text-muted-foreground text-sm">
                Ensure you're getting enough protein for your lifestyle
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">See Progress</h3>
              <p className="text-muted-foreground text-sm">
                Visualize your nutrition trends over weeks and months
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">🎯</span>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Reach Goals</h3>
              <p className="text-muted-foreground text-sm">
                Set personalized daily targets and achieve them
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto gradient-primary text-primary-foreground shadow-floating">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Start Your Health Journey Today
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-xl mx-auto">
                Join thousands of people using NutriSnap to make better food choices every day.
              </p>
              <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
                <Link to="/auth?signup=true">Create Free Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 NutriSnap. Your AI-powered nutrition companion.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
