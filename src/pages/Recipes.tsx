import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, getDocs, where, deleteDoc, doc, addDoc } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Heart, Clock, Users, Flame, Drumstick, Plus, BookOpen, Video, Trash2, Loader2, Leaf } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  youtube_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  ingredients: Json;
  instructions: Json;
  meal_type: string | null;
  is_preloaded: boolean | null;
  user_id: string | null;
  created_at?: string;
}

const getYouTubeEmbedUrl = (url: string | null | undefined) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    title: "",
    description: "",
    youtube_url: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    meal_type: "lunch"
  });

  useEffect(() => {
    fetchRecipes();
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecipes = async () => {
    try {
      const q = query(collection(db, "recipes"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      // Sort manually by created_at assuming it exists
      data.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load recipes.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, "favorite_recipes"), where("user_id", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data());
      setFavorites(data.map((f) => (f as { recipe_id: string }).recipe_id));
    } catch (error) {
      console.error("Error fetching favorites", error);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const isFavorite = favorites.includes(recipeId);

    try {
      if (isFavorite) {
        const q = query(
          collection(db, "favorite_recipes"),
          where("user_id", "==", user.uid),
          where("recipe_id", "==", recipeId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
          await deleteDoc(doc(db, "favorite_recipes", d.id));
        });
        setFavorites(favorites.filter((id) => id !== recipeId));
      } else {
        await addDoc(collection(db, "favorite_recipes"), {
          user_id: user.uid,
          recipe_id: recipeId,
          created_at: new Date().toISOString()
        });
        setFavorites([...favorites, recipeId]);
      }
    } catch (error) {
      console.error("Error toggling favorite", error);
    }
  };

  const handleCreateRecipe = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    
    if (!newRecipe.title || !newRecipe.calories || !newRecipe.protein) {
      toast({ title: "Error", description: "Title, calories, and protein are required.", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const recipeData = {
        title: newRecipe.title,
        description: newRecipe.description || null,
        youtube_url: newRecipe.youtube_url || null,
        image_url: null,
        calories: Number(newRecipe.calories),
        protein: Number(newRecipe.protein),
        carbs: Number(newRecipe.carbs) || 0,
        fat: Number(newRecipe.fat) || 0,
        fiber: null,
        servings: 1,
        prep_time: null,
        cook_time: null,
        ingredients: [],
        instructions: [],
        meal_type: newRecipe.meal_type,
        is_preloaded: false,
        user_id: user.uid,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "recipes"), recipeData);
      setRecipes([{ id: docRef.id, ...recipeData } as Recipe, ...recipes]);
      
      toast({ title: "Success", description: "Gym Recipe added successfully!" });
      setIsAddOpen(false);
      setNewRecipe({
        title: "", description: "", youtube_url: "",
        calories: "", protein: "", carbs: "", fat: "", meal_type: "lunch"
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add recipe.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = mealTypeFilter === "all" || recipe.meal_type === mealTypeFilter;
    return matchesSearch && matchesMealType;
  });

  const getMealTypeColor = (type: string | null) => {
    switch (type) {
      case "breakfast": return "bg-carbs/10 text-carbs";
      case "lunch": return "bg-primary/10 text-primary";
      case "dinner": return "bg-protein/10 text-protein";
      case "snack": return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getIngredients = (ingredients: Json): string[] => {
    if (Array.isArray(ingredients)) {
      return ingredients.filter((i): i is string => typeof i === 'string');
    }
    return [];
  };

  const getInstructions = (instructions: Json): string[] => {
    if (Array.isArray(instructions)) {
      return instructions.filter((i): i is string => typeof i === 'string');
    }
    return [];
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Recipe Collection</h1>
            <p className="text-muted-foreground mt-1">
              Browse healthy recipes with complete nutrition information
            </p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 shadow-soft">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Gym Recipe</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    value={newRecipe.title} 
                    onChange={e => setNewRecipe({...newRecipe, title: e.target.value})} 
                    placeholder="E.g., High Protein Oats" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">YouTube URL (Optional)</label>
                  <Input 
                    value={newRecipe.youtube_url} 
                    onChange={e => setNewRecipe({...newRecipe, youtube_url: e.target.value})} 
                    placeholder="https://youtube.com/watch?v=..." 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calories</label>
                    <Input 
                      type="number" 
                      value={newRecipe.calories} 
                      onChange={e => setNewRecipe({...newRecipe, calories: e.target.value})} 
                      placeholder="e.g. 400" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Protein (g)</label>
                    <Input 
                      type="number" 
                      value={newRecipe.protein} 
                      onChange={e => setNewRecipe({...newRecipe, protein: e.target.value})} 
                      placeholder="e.g. 40" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Carbs (g)</label>
                    <Input 
                      type="number" 
                      value={newRecipe.carbs} 
                      onChange={e => setNewRecipe({...newRecipe, carbs: e.target.value})} 
                      placeholder="e.g. 35" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fat (g)</label>
                    <Input 
                      type="number" 
                      value={newRecipe.fat} 
                      onChange={e => setNewRecipe({...newRecipe, fat: e.target.value})} 
                      placeholder="e.g. 12" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meal Type</label>
                  <Select value={newRecipe.meal_type} onValueChange={v => setNewRecipe({...newRecipe, meal_type: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={adding} onClick={handleCreateRecipe} className="w-full mt-2 gradient-primary">
                  {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Recipe"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 shadow-soft"
            />
          </div>
          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 shadow-soft bg-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by meal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snacks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground flex justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading recipes...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <Card className="text-center py-12 bg-white/50 border-dashed">
            <CardContent className="pt-6">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No recipes found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adding a gym recipe using the button above!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Dialog key={recipe.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer shadow-soft hover:shadow-elevated transition-all hover:-translate-y-1 overflow-hidden border-transparent">
                    {/* Thumbnail area */}
                    {recipe.youtube_url ? (
                      <div className="relative h-48 bg-black flex items-center justify-center rounded-t-xl group">
                         <div className="absolute inset-0 opacity-50 bg-gradient-to-t from-black to-transparent" />
                         <Video className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform shadow-lg z-10" />
                         <p className="absolute bottom-3 left-3 text-white text-xs font-semibold px-2 py-1 bg-black/60 rounded z-10 flex items-center gap-1"><Video className="w-3 h-3"/> YouTube</p>
                      </div>
                    ) : recipe.image_url ? (
                      <div className="relative h-48 overflow-hidden rounded-t-xl bg-muted">
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative h-48 flex items-center justify-center rounded-t-xl bg-gradient-to-br from-primary/10 to-primary/5">
                        <Drumstick className="w-12 h-12 text-primary/20" />
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                    >
                      <Heart
                        className={`w-5 h-5 ${favorites.includes(recipe.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                      />
                    </button>

                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-semibold text-lg line-clamp-1">{recipe.title}</h3>
                        {recipe.meal_type && (
                          <Badge variant="secondary" className={getMealTypeColor(recipe.meal_type)}>
                            {recipe.meal_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                        {recipe.description || "A delicious gym recipe."}
                      </p>
                      
                      {/* Nutrition Highlights */}
                      <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg">
                        <div className="flex flex-1 items-center justify-center gap-1.5 border-r border-border/50">
                          <Flame className="w-4 h-4 text-calories" />
                          <span className="text-sm font-bold text-calories">{recipe.calories}</span>
                          <span className="text-xs text-muted-foreground">cal</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center gap-1.5">
                          <Drumstick className="w-4 h-4 text-protein" />
                          <span className="text-sm font-bold text-protein">{recipe.protein}g</span>
                          <span className="text-xs text-muted-foreground">pro</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                {/* Recipe Detail Dialog (Two Column Layout) */}
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-0 overflow-hidden bg-background">
                  <div className="flex flex-col md:flex-row h-full">
                    
                    {/* Left Column (Video/Image & Intros) */}
                    <div className="flex-1 md:w-2/3 border-r border-border bg-card">
                      {recipe.youtube_url ? (
                        <div className="w-full aspect-video bg-black sticky top-0 z-10 border-b border-white/10">
                          {getYouTubeEmbedUrl(recipe.youtube_url) ? (
                            <iframe 
                              src={getYouTubeEmbedUrl(recipe.youtube_url) as string} 
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white p-4 text-center">
                              Invalid YouTube URL: {recipe.youtube_url}
                            </div>
                          )}
                        </div>
                      ) : recipe.image_url ? (
                        <div className="w-full h-64 md:h-80 bg-muted">
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center border-b border-primary/10">
                          <h2 className="text-primary font-display font-bold text-2xl tracking-tight opacity-70 flex items-center gap-2">
                             <Drumstick className="w-8 h-8" />
                             Gym Recipe
                          </h2>
                        </div>
                      )}

                      <div className="p-6 md:p-8">
                        <DialogHeader className="text-left mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                {recipe.meal_type && (
                                  <Badge variant="secondary" className={getMealTypeColor(recipe.meal_type)}>
                                      {recipe.meal_type.toUpperCase()}
                                  </Badge>
                                )}
                                {recipe.youtube_url && (
                                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 shadow-sm">
                                      <Video className="w-3 h-3 mr-1" />
                                      YouTube Tutorial
                                  </Badge>
                                )}
                            </div>
                          <DialogTitle className="font-display font-bold text-3xl md:text-4xl text-foreground">
                            {recipe.title}
                          </DialogTitle>
                          {recipe.description && (
                            <p className="text-muted-foreground text-lg mt-3 leading-relaxed">
                              {recipe.description}
                            </p>
                          )}
                        </DialogHeader>

                        {/* Ingredients & Instructions (Only if they exist) */}
                        {getIngredients(recipe.ingredients).length > 0 && (
                          <div className="mb-8">
                            <h4 className="font-display font-semibold text-xl mb-4 flex items-center gap-2">
                              <Leaf className="w-5 h-5 text-primary" /> Ingredients
                            </h4>
                            <ul className="space-y-3 bg-muted/30 p-5 rounded-xl border border-border/50">
                              {getIngredients(recipe.ingredients).map((ingredient, index) => (
                                <li key={index} className="flex items-start gap-3 text-base">
                                  <span className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0 shadow-sm" />
                                  <span className="text-foreground/90">{ingredient}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {getInstructions(recipe.instructions).length > 0 && (
                          <div>
                            <h4 className="font-display font-semibold text-xl mb-4 flex items-center gap-2">
                               <BookOpen className="w-5 h-5 text-primary" /> Instructions
                            </h4>
                            <ol className="space-y-5">
                              {getInstructions(recipe.instructions).map((instruction, index) => (
                                <li key={index} className="flex gap-4 text-base bg-white p-4 rounded-xl shadow-sm border border-border/50">
                                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold shadow-inner">
                                    {index + 1}
                                  </span>
                                  <span className="mt-1 text-foreground/90">{instruction}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {(!recipe.youtube_url && getIngredients(recipe.ingredients).length === 0 && getInstructions(recipe.instructions).length === 0) && (
                          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border/60 text-muted-foreground mt-4">
                            <p>Watch the video for instructions!</p>
                            <p className="text-sm mt-1">Check the macros panel on the side for nutritional info.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column (Sidebar - MACROS prominently displayed) */}
                    <div className="w-full md:w-1/3 bg-slate-50 p-6 md:overflow-y-auto">
                      <div className="sticky top-6">
                        <h3 className="font-display font-bold text-xl mb-6 text-slate-800 border-b border-slate-200 pb-2">Nutritional Facts</h3>
                        
                        <div className="flex flex-col gap-4">
                          {/* Protein Card (Gym focus - moved to top) */}
                          <div className="bg-gradient-to-br from-protein to-protein/90 rounded-2xl p-6 text-center shadow-md relative overflow-hidden text-white">
                            <Drumstick className="w-32 h-32 text-white/10 absolute -right-4 -bottom-4" />
                            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-1 relative z-10 flex flex-col items-center gap-1">Protein</p>
                            <p className="text-5xl font-black tracking-tighter relative z-10 drop-shadow-sm">{recipe.protein}<span className="text-2xl font-bold ml-1 text-white/90">g</span></p>
                            <p className="text-xs text-white/90 font-medium mt-1 relative z-10">Muscle Building Blocks</p>
                          </div>

                          {/* Calories Hero Card */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
                            <Flame className="w-24 h-24 text-calories/10 absolute -left-4 -bottom-4" />
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1 relative z-10">Total Calories</p>
                            <p className="text-4xl font-black text-calories tracking-tighter relative z-10">{recipe.calories}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1 relative z-10">kcal / serving</p>
                          </div>

                          {/* Carbs & Fat Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm relative overflow-hidden group">
                              <p className="text-2xl font-black text-carbs tracking-tighter relative z-10">{recipe.carbs}<span className="text-lg font-bold ml-0.5">g</span></p>
                              <p className="text-xs font-semibold text-slate-500 uppercase mt-1 relative z-10">Carbs</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm relative overflow-hidden group">
                              <p className="text-2xl font-black text-fat tracking-tighter relative z-10">{recipe.fat}<span className="text-lg font-bold ml-0.5">g</span></p>
                              <p className="text-xs font-semibold text-slate-500 uppercase mt-1 relative z-10">Fat</p>
                            </div>
                          </div>

                          {/* Fiber (If provided) */}
                          {recipe.fiber !== null && recipe.fiber !== undefined && recipe.fiber > 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm mt-2 flex items-center justify-center gap-3">
                              <span className="text-sm font-semibold text-slate-500 uppercase">Fiber</span>
                              <span className="text-lg font-black text-fiber">{recipe.fiber}g</span>
                            </div>
                          )}
                        </div>

                        {/* Extra Time/Serving Info */}
                        {(recipe.prep_time || recipe.cook_time || recipe.servings) && (
                          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">Details</h4>
                            <div className="space-y-3">
                              {recipe.prep_time && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Prep Time</span>
                                  <span className="font-medium text-slate-800">{recipe.prep_time} min</span>
                                </div>
                              )}
                              {recipe.cook_time && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><Flame className="w-4 h-4" /> Cook Time</span>
                                  <span className="font-medium text-slate-800">{recipe.cook_time} min</span>
                                </div>
                              )}
                              {recipe.servings && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Servings</span>
                                  <span className="font-medium text-slate-800">{recipe.servings} x</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Recipes;
