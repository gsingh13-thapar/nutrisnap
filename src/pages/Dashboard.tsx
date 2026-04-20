import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, BookOpen, Calendar, Plus, TrendingUp, Flame, Drumstick, Wheat, Droplets } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  name: string | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch profile
      let userProfile = null;
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        userProfile = profileSnap.data() as Profile;
        setProfile(userProfile);
      } else {
        // Create default profile
        userProfile = {
          name: null,
          daily_calorie_goal: 2000,
          daily_protein_goal: 50,
          daily_carbs_goal: 250,
          daily_fat_goal: 65,
        };
        await setDoc(profileRef, {
          user_id: user.uid,
          ...userProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setProfile(userProfile as Profile);
      }

      // Fetch today's diary entries
      const today = format(new Date(), "yyyy-MM-dd");
      const q = query(
        collection(db, "diary_entries"),
        where("user_id", "==", user.uid),
        where("entry_date", "==", today)
      );
      const querySnapshot = await getDocs(q);
      const diaryData = querySnapshot.docs.map(doc => doc.data() as DailyTotals);

      if (diaryData && diaryData.length > 0) {
        const totals = diaryData.reduce(
          (acc, entry) => ({
            calories: acc.calories + (entry.calories || 0),
            protein: acc.protein + (entry.protein || 0),
            carbs: acc.carbs + (entry.carbs || 0),
            fat: acc.fat + (entry.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setDailyTotals(totals);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const getProgress = (current: number, goal: number) => Math.min((current / goal) * 100, 100);

  const quickActions = [
    { icon: Camera, label: "Analyze Food", path: "/analyze", color: "bg-calories/10 text-calories" },
    { icon: BookOpen, label: "Browse Recipes", path: "/recipes", color: "bg-protein/10 text-protein" },
    { icon: Calendar, label: "View Diary", path: "/diary", color: "bg-primary/10 text-primary" },
    { icon: Plus, label: "Add Meal", path: "/diary", color: "bg-accent/10 text-accent" },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {profile?.name ? `Hey, ${profile.name}!` : "Welcome back!"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Daily Progress */}
        <Card className="mb-8 shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="w-5 h-5 text-primary" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Calories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-calories" />
                    <span className="text-sm font-medium">Calories</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dailyTotals.calories} / {profile?.daily_calorie_goal || 2000}
                  </span>
                </div>
                <Progress 
                  value={getProgress(dailyTotals.calories, profile?.daily_calorie_goal || 2000)} 
                  className="h-2 [&>div]:bg-calories"
                />
              </div>

              {/* Protein */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Drumstick className="w-4 h-4 text-protein" />
                    <span className="text-sm font-medium">Protein</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dailyTotals.protein}g / {profile?.daily_protein_goal || 50}g
                  </span>
                </div>
                <Progress 
                  value={getProgress(dailyTotals.protein, profile?.daily_protein_goal || 50)} 
                  className="h-2 [&>div]:bg-protein"
                />
              </div>

              {/* Carbs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-carbs" />
                    <span className="text-sm font-medium">Carbs</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dailyTotals.carbs}g / {profile?.daily_carbs_goal || 250}g
                  </span>
                </div>
                <Progress 
                  value={getProgress(dailyTotals.carbs, profile?.daily_carbs_goal || 250)} 
                  className="h-2 [&>div]:bg-carbs"
                />
              </div>

              {/* Fat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-fat" />
                    <span className="text-sm font-medium">Fat</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dailyTotals.fat}g / {profile?.daily_fat_goal || 65}g
                  </span>
                </div>
                <Progress 
                  value={getProgress(dailyTotals.fat, profile?.daily_fat_goal || 65)} 
                  className="h-2 [&>div]:bg-fat"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <h2 className="text-xl font-display font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.path + action.label} to={action.path}>
              <Card className="shadow-soft hover:shadow-elevated transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Tips Card */}
        <Card className="gradient-primary text-primary-foreground shadow-floating">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-lg mb-2">💡 Pro Tip</h3>
            <p className="opacity-90">
              Take photos of your meals right before eating for the most accurate nutrition tracking. 
              The AI works best with well-lit photos showing all food items clearly.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
