import { useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2, Flame, Drumstick, Wheat, Droplets, Leaf, Save, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface AnalysisResult {
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  meal_description: string;
}

const Analyze = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>("lunch");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

      // Extract base64 and mime type
      const base64Data = image.split(",")[1];
      const mimeType = image.split(";")[0].split(":")[1];

      const prompt = `Analyze this food image. Identify the meal and break it down into food items. Then provide realistic macros (calories, protein, carbs, fat, fiber). Return the response exactly as a JSON object matching this TypeScript interface, with no markdown wrappers or backticks:
interface FoodItem { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; }
interface AnalysisResult { food_items: FoodItem[]; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; total_fiber: number; meal_description: string; }`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error("API request failed: " + errorText);
      }

      const responseData = await response.json();
      
      const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Could not parse the AI response.");
      }

      let parsedResult: AnalysisResult;
      try {
        let jsonStr = content.trim();
        // Fallback in case gemini hallucinates markdown block
        if (jsonStr.startsWith("```json")) jsonStr = jsonStr.substring(7);
        if (jsonStr.startsWith("```")) jsonStr = jsonStr.substring(3);
        if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
        
        parsedResult = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error("JSON Error:", e, "Raw output:", content);
        throw new Error("The AI returned an invalid format. Please try again.");
      }

      setResult(parsedResult);
      toast({
        title: "Analysis complete!",
        description: `Successfully analyzed image with Gemini Vision AI.`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveToDiary = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");
      
      // Save each food item as a diary entry
      const promises = result.food_items.map((item) => {
        return addDoc(collection(db, "diary_entries"), {
          user_id: user.uid,
          entry_date: today,
          meal_type: selectedMealType,
          food_name: `${item.name} (${item.portion})`,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          created_at: new Date().toISOString()
        });
      });

      await Promise.all(promises);

      toast({
        title: "Saved to diary!",
        description: `Added ${result.food_items.length} item(s) to your ${selectedMealType}.`,
      });

      // Reset state
      setImage(null);
      setResult(null);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "Could not save to diary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Analyze Food</h1>
          <p className="text-muted-foreground mt-1">
            Take or upload a photo to get instant nutrition information
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Camera className="w-5 h-5 text-primary" />
                Upload Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              {!image ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Click to upload a photo</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop an image here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={image}
                      alt="Food to analyze"
                      className="w-full h-64 object-cover"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={analyzeImage}
                      disabled={analyzing}
                      className="flex-1 gradient-primary"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Analyze Photo
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="font-display">Nutrition Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload and analyze a photo to see nutrition information</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Meal Description */}
                  <p className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    {result.meal_description}
                  </p>

                  {/* Totals */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-calories/10 rounded-xl p-4 text-center">
                      <Flame className="w-6 h-6 text-calories mx-auto mb-1" />
                      <p className="text-2xl font-bold text-calories">{result.total_calories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="bg-protein/10 rounded-xl p-4 text-center">
                      <Drumstick className="w-6 h-6 text-protein mx-auto mb-1" />
                      <p className="text-2xl font-bold text-protein">{result.total_protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="bg-carbs/10 rounded-xl p-4 text-center">
                      <Wheat className="w-6 h-6 text-carbs mx-auto mb-1" />
                      <p className="text-2xl font-bold text-carbs">{result.total_carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="bg-fat/10 rounded-xl p-4 text-center">
                      <Droplets className="w-6 h-6 text-fat mx-auto mb-1" />
                      <p className="text-2xl font-bold text-fat">{result.total_fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>

                  {/* Fiber */}
                  <div className="flex items-center justify-center gap-2 text-fiber bg-fiber/10 p-2 rounded-lg">
                    <Leaf className="w-4 h-4" />
                    <span className="font-medium text-sm">{result.total_fiber}g Dietary Fiber</span>
                  </div>

                  {/* Food Items */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-3">Detected Components</h4>
                    {result.food_items.map((item, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-3 text-sm border border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <span className="text-muted-foreground bg-background px-2 py-0.5 rounded text-xs">{item.portion}</span>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs font-medium">
                          <span className="text-calories">{item.calories} <span className="opacity-50">cal</span></span>
                          <span className="text-protein">{item.protein}g <span className="opacity-50">pro</span></span>
                          <span className="text-carbs">{item.carbs}g <span className="opacity-50">carb</span></span>
                          <span className="text-fat">{item.fat}g <span className="opacity-50">fat</span></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save to Diary */}
                  <div className="space-y-3 pt-6 border-t border-border">
                    <div className="flex gap-3">
                      <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={saveToDiary} disabled={saving} className="gradient-primary">
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analyze;
