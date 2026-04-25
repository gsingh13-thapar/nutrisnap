import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Utensils, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MealSuggestionsProps {
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: {
    daily_calorie_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fat_goal: number;
  };
}

interface Suggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MealSuggestions = ({ dailyTotals, goals }: MealSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing API Key");

      const remaining = {
        calories: Math.max(0, goals.daily_calorie_goal - dailyTotals.calories),
        protein: Math.max(0, goals.daily_protein_goal - dailyTotals.protein),
        carbs: Math.max(0, goals.daily_carbs_goal - dailyTotals.carbs),
        fat: Math.max(0, goals.daily_fat_goal - dailyTotals.fat),
      };

      const prompt = `As a nutritionist AI, suggest 3 healthy dinner options for a user who has these remaining macro targets for the day:
      Calories: ${remaining.calories} kcal
      Protein: ${remaining.protein}g
      Carbs: ${remaining.carbs}g
      Fat: ${remaining.fat}g

      Return the response exactly as a JSON array of objects matching this interface:
      interface Suggestion { name: string; description: string; calories: number; protein: number; carbs: number; fat: number; }
      Limit the description to 2 short sentences. No markdown wrappers.`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("Invalid AI response");

      setSuggestions(JSON.parse(content));
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "AI Suggestion Failed",
        description: "Could not generate meal suggestions. Using fallback.",
        variant: "destructive",
      });
      // Fallback
      setSuggestions([
        { name: "Grilled Salmon & Quinoa", description: "Rich in omega-3 and protein. Perfect for hitting your macro targets.", calories: 450, protein: 35, carbs: 40, fat: 15 },
        { name: "Chicken Stir-Fry", description: "High protein, low fat. Easy to customize with your favorite veggies.", calories: 380, protein: 40, carbs: 30, fat: 8 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-elevated border-primary/20 bg-gradient-to-br from-background to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between font-display text-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Dinner Suggestions
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={getSuggestions} 
            disabled={loading}
            className="text-xs text-primary hover:text-primary hover:bg-primary/10"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {suggestions.length > 0 ? "Refresh" : "Get Ideas"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 && !loading && (
          <div className="text-center py-8 space-y-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Ready for dinner?</p>
              <p className="text-xs text-muted-foreground">Click the button to get personalized suggestions based on your remaining macros.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
            <p className="text-xs text-muted-foreground animate-pulse">Calculating optimal meals...</p>
          </div>
        )}

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="group bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{suggestion.name}</h4>
                <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {suggestion.calories} kcal
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{suggestion.description}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-protein/5 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-protein font-bold uppercase">Pro</p>
                  <p className="text-xs font-semibold">{suggestion.protein}g</p>
                </div>
                <div className="bg-carbs/5 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-carbs font-bold uppercase">Carb</p>
                  <p className="text-xs font-semibold">{suggestion.carbs}g</p>
                </div>
                <div className="bg-fat/5 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-fat font-bold uppercase">Fat</p>
                  <p className="text-xs font-semibold">{suggestion.fat}g</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {suggestions.length > 0 && (
          <Button variant="ghost" className="w-full text-xs text-muted-foreground group" size="sm">
            Browse all recipes <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MealSuggestions;
