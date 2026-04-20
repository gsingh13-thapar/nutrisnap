import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Flame, 
  Drumstick, 
  Wheat, 
  Droplets,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  meal_type: string;
  portion_size: number | null;
  created_at?: string;
}

interface Profile {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
}

const mealTypes = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-carbs" },
  { key: "lunch", label: "Lunch", icon: Sun, color: "text-primary" },
  { key: "dinner", label: "Dinner", icon: Moon, color: "text-protein" },
  { key: "snack", label: "Snacks", icon: Cookie, color: "text-accent" },
];

const Diary = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    food_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    meal_type: "lunch",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Fetch profile
      const profileSnap = await getDoc(doc(db, "profiles", user.uid));
      if (profileSnap.exists()) {
        setProfile(profileSnap.data() as Profile);
      }

      // Fetch diary entries for selected date
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const q = query(
        collection(db, "diary_entries"),
        where("user_id", "==", user.uid),
        where("entry_date", "==", dateStr)
      );
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as DiaryEntry[];
      
      // Sort in memory by created_at
      entriesData.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setEntries(entriesData);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
    setLoading(false);
  };

  const dailyTotals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getProgress = (current: number, goal: number) => Math.min((current / goal) * 100, 100);

  const addEntry = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, "diary_entries"), {
        user_id: user.uid,
        entry_date: format(selectedDate, "yyyy-MM-dd"),
        food_name: newEntry.food_name,
        calories: parseInt(newEntry.calories) || 0,
        protein: parseInt(newEntry.protein) || 0,
        carbs: parseInt(newEntry.carbs) || 0,
        fat: parseInt(newEntry.fat) || 0,
        meal_type: newEntry.meal_type,
        created_at: new Date().toISOString()
      });

      toast({
        title: "Entry added",
        description: `${newEntry.food_name} added to your diary.`,
      });
      setIsAddDialogOpen(false);
      setNewEntry({
        food_name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        meal_type: "lunch",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add entry.",
        variant: "destructive",
      });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, "diary_entries", id));
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry.",
        variant: "destructive",
      });
    }
  };

  const getEntriesByMealType = (mealType: string) => 
    entries.filter((entry) => entry.meal_type === mealType);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 lg:pb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Food Diary</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily meals and nutrition
          </p>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="mb-6 shadow-elevated">
          <CardHeader>
            <CardTitle className="font-display">Daily Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-calories" />
                    <span className="text-sm font-medium">Calories</span>
                  </div>
                </div>
                <Progress
                  value={getProgress(dailyTotals.calories, profile?.daily_calorie_goal || 2000)}
                  className="h-2 [&>div]:bg-calories"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {dailyTotals.calories} / {profile?.daily_calorie_goal || 2000}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Drumstick className="w-4 h-4 text-protein" />
                  <span className="text-sm font-medium">Protein</span>
                </div>
                <Progress
                  value={getProgress(dailyTotals.protein, profile?.daily_protein_goal || 50)}
                  className="h-2 [&>div]:bg-protein"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {dailyTotals.protein}g / {profile?.daily_protein_goal || 50}g
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-carbs" />
                  <span className="text-sm font-medium">Carbs</span>
                </div>
                <Progress
                  value={getProgress(dailyTotals.carbs, profile?.daily_carbs_goal || 250)}
                  className="h-2 [&>div]:bg-carbs"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {dailyTotals.carbs}g / {profile?.daily_carbs_goal || 250}g
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-fat" />
                  <span className="text-sm font-medium">Fat</span>
                </div>
                <Progress
                  value={getProgress(dailyTotals.fat, profile?.daily_fat_goal || 65)}
                  className="h-2 [&>div]:bg-fat"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {dailyTotals.fat}g / {profile?.daily_fat_goal || 65}g
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Sections */}
        <div className="space-y-4">
          {mealTypes.map((meal) => {
            const mealEntries = getEntriesByMealType(meal.key);
            const mealCalories = mealEntries.reduce((sum, e) => sum + e.calories, 0);

            return (
              <Card key={meal.key} className="shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${meal.key === 'breakfast' ? 'carbs' : meal.key === 'lunch' ? 'primary' : meal.key === 'dinner' ? 'protein' : 'accent'}/10`)}>
                        <meal.icon className={cn("w-5 h-5", meal.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-display">{meal.label}</CardTitle>
                        <p className="text-sm text-muted-foreground">{mealCalories} calories</p>
                      </div>
                    </div>
                    <Dialog open={isAddDialogOpen && newEntry.meal_type === meal.key} onOpenChange={(open) => {
                      setIsAddDialogOpen(open);
                      if (open) setNewEntry({ ...newEntry, meal_type: meal.key });
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setNewEntry({ ...newEntry, meal_type: meal.key })}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to {meal.label}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Food Name</Label>
                            <Input
                              placeholder="e.g., Grilled Chicken Salad"
                              value={newEntry.food_name}
                              onChange={(e) => setNewEntry({ ...newEntry, food_name: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Calories</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newEntry.calories}
                                onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Protein (g)</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newEntry.protein}
                                onChange={(e) => setNewEntry({ ...newEntry, protein: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Carbs (g)</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newEntry.carbs}
                                onChange={(e) => setNewEntry({ ...newEntry, carbs: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Fat (g)</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newEntry.fat}
                                onChange={(e) => setNewEntry({ ...newEntry, fat: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button onClick={addEntry} className="w-full gradient-primary">
                            Add Entry
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {mealEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No entries yet. Add your {meal.label.toLowerCase()}!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {mealEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{entry.food_name}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              <span className="text-calories">{entry.calories} cal</span>
                              <span className="text-protein">{entry.protein}g P</span>
                              <span className="text-carbs">{entry.carbs}g C</span>
                              <span className="text-fat">{entry.fat}g F</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Diary;
