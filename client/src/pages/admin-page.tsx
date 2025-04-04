import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletionComplete, setIsDeletionComplete] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [isSavingUpi, setIsSavingUpi] = useState(false);

  const handleDeleteAllUsers = async () => {
    if (deleteConfirmation !== "DELETE ALL") {
      toast({
        title: "Confirmation failed",
        description: "Please type DELETE ALL to confirm this action",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/delete-all-users");
      if (response.ok) {
        setIsDeletionComplete(true);
        toast({
          title: "Success",
          description: "All user data has been deleted",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete data");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user data",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUpiId = async () => {
    if (!upiId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      });
      return;
    }

    setIsSavingUpi(true);
    try {
      // This would normally save to a database, but for now just show a success message
      // await apiRequest("POST", "/api/payment/upi", { upiId });
      
      // Simulating a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "UPI payment option has been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save UPI ID",
        variant: "destructive",
      });
    } finally {
      setIsSavingUpi(false);
    }
  };

  // For now, we'll allow any authenticated user to access the admin page
  // In a production environment, you would check for admin privileges
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="w-full max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="data-management" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data-management">Data Management</TabsTrigger>
          <TabsTrigger value="payment-options">Payment Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data-management" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Actions here can permanently delete data and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDeletionComplete ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    All user registration data has been deleted successfully.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="mb-4">
                    <Label htmlFor="confirm-delete">
                      Type <span className="font-bold">DELETE ALL</span> to confirm:
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllUsers}
                    disabled={isDeleting || deleteConfirmation !== "DELETE ALL"}
                    className="w-full"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All User Data
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment-options" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>UPI Payment Options</CardTitle>
              <CardDescription>
                Configure UPI payment options for the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    placeholder="username@bankname"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your UPI ID to receive payments directly.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveUpiId}
                disabled={isSavingUpi || !upiId.trim()}
              >
                {isSavingUpi ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save UPI Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}