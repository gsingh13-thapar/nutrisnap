import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Plus, Minus, Bell } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const WATER_GOAL = 8; // 8 glasses a day

const WaterTracker = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "water_logs", `${user.uid}_${today}`);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCount(docSnap.data().count || 0);
      } else {
        setCount(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [today]);

  const updateWater = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "water_logs", `${user.uid}_${today}`);
    const docSnap = await getDoc(docRef);

    try {
      if (docSnap.exists()) {
        const newCount = Math.max(0, docSnap.data().count + amount);
        await updateDoc(docRef, {
          count: newCount,
          updated_at: new Date().toISOString()
        });
      } else {
        if (amount < 0) return;
        await setDoc(docRef, {
          user_id: user.uid,
          date: today,
          count: amount,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating water log:", error);
      toast({
        title: "Error",
        description: "Failed to update water intake.",
        variant: "destructive",
      });
    }
  };

  const progress = Math.min((count / WATER_GOAL) * 100, 100);

  return (
    <Card className="shadow-elevated overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4">
        <Bell className={`w-4 h-4 ${count < WATER_GOAL ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Droplets className="w-5 h-5 text-blue-500" />
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">
              {count} <span className="text-sm font-normal text-muted-foreground">/ {WATER_GOAL} glasses</span>
            </p>
            <p className="text-xs text-muted-foreground italic">
              {count >= WATER_GOAL ? "Great job! You're well hydrated!" : "Keep drinking! Your body needs it."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => updateWater(-1)}
              disabled={count <= 0}
              className="h-10 w-10 rounded-full"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              onClick={() => updateWater(1)}
              className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2 [&>div]:bg-blue-500" />
          <div className="flex justify-between gap-1">
            {[...Array(WATER_GOAL)].map((_, i) => (
              <div 
                key={i} 
                className={`h-8 flex-1 rounded-sm flex items-center justify-center transition-all duration-500 ${
                  i < count ? "bg-blue-500/20 text-blue-600 scale-105" : "bg-muted text-muted-foreground/30"
                }`}
              >
                <Droplets className={`w-4 h-4 ${i < count ? "fill-blue-500" : ""}`} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterTracker;
