import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Target, Save, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    daily_calorie_goal: "2000",
    daily_protein_goal: "50",
    daily_carbs_goal: "250",
    daily_fat_goal: "65",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, "profiles", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data as Profile);
        setFormData({
          name: data.name || "",
          daily_calorie_goal: data.daily_calorie_goal?.toString() || "2000",
          daily_protein_goal: data.daily_protein_goal?.toString() || "50",
          daily_carbs_goal: data.daily_carbs_goal?.toString() || "250",
          daily_fat_goal: data.daily_fat_goal?.toString() || "65",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;

    const updateData = {
      name: formData.name || null,
      daily_calorie_goal: parseInt(formData.daily_calorie_goal) || 2000,
      daily_protein_goal: parseInt(formData.daily_protein_goal) || 50,
      daily_carbs_goal: parseInt(formData.daily_carbs_goal) || 250,
      daily_fat_goal: parseInt(formData.daily_fat_goal) || 65,
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "profiles", user.uid), updateData, { merge: true });
      toast({
        title: "Profile updated",
        description: "Your settings have been saved.",
      });
      fetchProfile();
    } catch (error) {
      console.error("Error saving profile", error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

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
      <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and nutrition goals
          </p>
        </div>

        {/* Personal Info */}
        <Card className="mb-6 shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Goals */}
        <Card className="mb-6 shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Target className="w-5 h-5 text-primary" />
              Daily Nutrition Goals
            </CardTitle>
            <CardDescription>
              Set your daily targets for tracking progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-calories" />
                  Calories
                </Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="2000"
                  value={formData.daily_calorie_goal}
                  onChange={(e) => setFormData({ ...formData, daily_calorie_goal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-protein" />
                  Protein (g)
                </Label>
                <Input
                  id="protein"
                  type="number"
                  placeholder="50"
                  value={formData.daily_protein_goal}
                  onChange={(e) => setFormData({ ...formData, daily_protein_goal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-carbs" />
                  Carbohydrates (g)
                </Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="250"
                  value={formData.daily_carbs_goal}
                  onChange={(e) => setFormData({ ...formData, daily_carbs_goal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-fat" />
                  Fat (g)
                </Label>
                <Input
                  id="fat"
                  type="number"
                  placeholder="65"
                  value={formData.daily_fat_goal}
                  onChange={(e) => setFormData({ ...formData, daily_fat_goal: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold mb-2">💡 Setting Good Goals</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Average adult needs 1,800-2,400 calories daily</li>
              <li>• Aim for 0.8g protein per kg of body weight</li>
              <li>• Carbs should be 45-65% of total calories</li>
              <li>• Fat should be 20-35% of total calories</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
