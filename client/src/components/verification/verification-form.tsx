import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const verificationSchema = z.object({
  govtId: z.string().min(1, "Government ID is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine(date => {
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return age >= 18;
  }, {
    message: "You must be at least 18 years old to register",
  }),
  address: z.string().min(1, "Address is required"),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

export function VerificationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      govtId: "",
      address: user?.location || "",
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationFormValues) => {
      const formData = new FormData();
      formData.append("userId", user?.id.toString() || "");
      formData.append("govtId", data.govtId);
      formData.append("dateOfBirth", data.dateOfBirth.toISOString());
      formData.append("address", data.address);
      
      const res = await apiRequest("POST", "/api/verification/submit", formData);
      return await res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Verification submitted",
        description: "Your verification details have been submitted for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: VerificationFormValues) => {
    verificationMutation.mutate(data);
  };

  if (user?.verificationStatus === "verified") {
    return (
      <div className="p-8 text-center border rounded-lg border-border bg-muted/30">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">Verified Account</h3>
        <p className="mt-2 text-muted-foreground">
          Your account has been verified. You have full access to all features.
        </p>
      </div>
    );
  }

  if (user?.verificationStatus === "pending" || isSubmitted) {
    return (
      <div className="p-8 text-center border rounded-lg border-border bg-muted/30">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
        <h3 className="text-xl font-semibold">Verification In Progress</h3>
        <p className="mt-2 text-muted-foreground">
          Your verification is currently under review. This process may take 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg shadow-sm">
      <h2 className="mb-6 text-2xl font-semibold">Identity Verification</h2>
      <p className="mb-6 text-muted-foreground">
        To ensure the safety and trust of our community, we require verification of your identity.
        Please provide the following details.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="govtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Government ID Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your Aadhar/PAN/Passport number" {...field} />
                </FormControl>
                <FormDescription>
                  Enter your government-issued identification number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const today = new Date();
                        const eighteenYearsAgo = new Date();
                        eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
                        return date > eighteenYearsAgo || date > today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Your date of birth is used to verify your age
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full address" {...field} />
                </FormControl>
                <FormDescription>
                  Please provide your complete address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={verificationMutation.isPending}
          >
            {verificationMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Verification"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}