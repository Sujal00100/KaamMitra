import { Metadata } from "@tanstack/react-query";
import { VerificationForm } from "@/components/verification/verification-form";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, ShieldCheck } from "lucide-react";

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
            <VerificationForm />
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