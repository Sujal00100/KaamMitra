import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const verificationCodeSchema = z.object({
  code: z.string().min(6, "Verification code must be at least 6 characters"),
});

export function EmailVerificationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(user?.emailVerified || false);

  const form = useForm({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/verify-email", {
        userId: user?.id,
        code: data.code,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsVerified(true);
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified.",
        });
      } else {
        toast({
          title: "Verification failed",
          description: data.message || "Invalid or expired verification code",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/resend-verification");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Verification email sent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        toast({
          title: "Failed to send verification email",
          description: data.message || "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send verification email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    verifyEmailMutation.mutate(data);
  };
  
  const handleResendCode = () => {
    resendCodeMutation.mutate();
  };

  if (isVerified) {
    return (
      <div className="p-6 text-center border rounded-lg shadow-sm bg-muted/30">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">Email Verified</h3>
        <p className="mt-2 text-muted-foreground">
          Your email address has been successfully verified.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">Email Verification</h2>
      <p className="mb-6 text-muted-foreground">
        We've sent a verification code to your email address: <strong>{user?.email}</strong>. 
        Please check your inbox and enter the code below to verify your email.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter verification code" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the 6-digit code sent to your email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={verifyEmailMutation.isPending}
            >
              {verifyEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handleResendCode}
              disabled={resendCodeMutation.isPending}
            >
              {resendCodeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}