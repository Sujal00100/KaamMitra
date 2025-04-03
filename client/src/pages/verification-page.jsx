import { VerificationForm } from "@/components/verification/verification-form";
import { EmailVerificationForm } from "@/components/verification/email-verification-form";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VerificationPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Account Verification</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr]">
          <div>
            <Tabs defaultValue="id" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="id" className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ID Verification</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Verification</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="id" className="mt-4">
                <VerificationForm />
              </TabsContent>
              
              <TabsContent value="email" className="mt-4">
                <EmailVerificationForm />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <div className="p-5 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold">Why verify your account?</h3>
              <ul className="mt-3 space-y-2 text-sm list-disc list-inside text-muted-foreground">
                <li>Build trust with employers/workers</li>
                <li>Access premium job opportunities</li>
                <li>Increase your profile visibility</li>
                <li>Improve chances of selection</li>
                <li>Higher payment security</li>
              </ul>
            </div>
            
            <div className="p-5 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold">Verification Process</h3>
              <ol className="mt-3 space-y-3 text-sm list-decimal list-inside text-muted-foreground">
                <li>Verify your email address with the verification code</li>
                <li>Submit your government ID and information</li>
                <li>Our team reviews your documentation</li>
                <li>Verification is typically completed within 24-48 hours</li>
                <li>Once verified, you'll receive a badge on your profile</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}