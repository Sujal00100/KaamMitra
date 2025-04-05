import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UpiPaymentProps {
  amount: number;
  description: string;
  recipientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpiPayment({ amount, description, recipientId = "", onSuccess, onCancel }: UpiPaymentProps) {
  const { toast } = useToast();
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const handlePayment = async () => {
    if (!upiId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your UPI ID",
        variant: "destructive",
      });
      return;
    }

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/;
    if (!upiRegex.test(upiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID in the format username@bankname",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStatus("processing");

    try {
      // Make an actual API call to process payment
      const response = await apiRequest("POST", "/api/payment/process", {
        amount,
        upiId,
        recipientId,
        description
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }
      
      // Success case
      setStatus("success");
      toast({
        title: "Payment Successful",
        description: `₹${amount.toFixed(2)} paid successfully`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setStatus("error");
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "success") {
    return (
      <Card>
        <CardHeader className="bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
            <CardTitle>Payment Successful</CardTitle>
          </div>
          <CardDescription>
            Your payment of ₹{amount.toFixed(2)} was successful.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span>{description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UPI ID:</span>
              <span>{upiId}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onSuccess} className="w-full">Done</Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardHeader className="bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            <CardTitle>Payment Failed</CardTitle>
          </div>
          <CardDescription>
            There was a problem processing your payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center mb-4">Please try again or use a different payment method.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => setStatus("idle")}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>UPI Payment</CardTitle>
        <CardDescription>
          Pay ₹{amount.toFixed(2)} securely using your UPI ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span>{description}</span>
            </div>
            {recipientId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span>{recipientId}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="upi-id">Your UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="yourname@bankname"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">Enter your UPI ID to proceed with the payment</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handlePayment} disabled={isProcessing || !upiId.trim()}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}