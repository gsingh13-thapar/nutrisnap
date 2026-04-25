import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Scan, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onScanSuccess: (data: any) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScanSuccess, onClose }: BarcodeScannerProps) => {
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      async (decodedText) => {
        // Success
        handleBarcodeScanned(decodedText);
      },
      (error) => {
        // Error is common during scanning, just ignore
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
            console.error("Failed to clear scanner", error);
        });
      }
    };
  }, []);

  const handleBarcodeScanned = async (barcode: string) => {
    if (loading) return;
    setLoading(true);
    
    // Stop scanner once we have a barcode
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) {
        const product = data.product;
        const nutrition = product.nutriments;
        
        const result = {
          meal_description: product.product_name || "Packaged Food",
          total_calories: Math.round(nutrition["energy-kcal_100g"] || 0),
          total_protein: Math.round(nutrition.proteins_100g || 0),
          total_carbs: Math.round(nutrition.carbohydrates_100g || 0),
          total_fat: Math.round(nutrition.fat_100g || 0),
          total_fiber: Math.round(nutrition.fiber_100g || 0),
          food_items: [{
            name: product.product_name || "Packaged Food",
            portion: "100g",
            calories: Math.round(nutrition["energy-kcal_100g"] || 0),
            protein: Math.round(nutrition.proteins_100g || 0),
            carbs: Math.round(nutrition.carbohydrates_100g || 0),
            fat: Math.round(nutrition.fat_100g || 0),
            fiber: Math.round(nutrition.fiber_100g || 0),
          }]
        };

        onScanSuccess(result);
        toast({
          title: "Product Found!",
          description: `Identified ${product.product_name}`,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: "We couldn't find this barcode in our database.",
          variant: "destructive",
        });
        onClose();
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch nutrition data.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div id="reader" className="overflow-hidden rounded-xl border-2 border-primary/20 bg-muted"></div>
      
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Fetching nutrition data...</p>
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={onClose}>
        Cancel Scanning
      </Button>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <p>Position the barcode clearly within the square. Scanning works best in bright light.</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
