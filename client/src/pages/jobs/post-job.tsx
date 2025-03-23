import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { insertJobSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extend the job schema with validation
const postJobSchema = insertJobSchema.extend({
  description: z.string().min(20, "Description must be at least 20 characters"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  location: z.string().min(3, "Location is required"),
  wage: z.string().min(1, "Wage information is required"),
  duration: z.string().optional(),
});

type PostJobValues = z.infer<typeof postJobSchema>;

const jobCategories = [
  { value: "construction", label: "Construction" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "carpentry", label: "Carpentry" },
  { value: "painting", label: "Painting" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "gardening", label: "Gardening" },
  { value: "other", label: "Other" },
];

export default function PostJob() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<PostJobValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      description: "",
      location: user?.location || "",
      category: "construction",
      wage: "",
      duration: "",
    },
  });

  const postJobMutation = useMutation({
    mutationFn: async (values: PostJobValues) => {
      const res = await apiRequest("POST", "/api/jobs", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Posted Successfully",
        description: "Your job has been published and is now visible to workers.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employers/dashboard"] });
      setLocation("/employer-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Post Job",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: PostJobValues) => {
    setIsSubmitting(true);
    postJobMutation.mutate(values);
  };

  // Ensure only employers can access this page
  if (user && user.userType !== "employer") {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="outline" 
            className="mb-6"
            onClick={() => setLocation("/employer-dashboard")}
          >
            <span className="material-icons mr-2">arrow_back</span>
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Post a New Job</CardTitle>
              <CardDescription>
                Fill in the details below to create a new job listing. Be as specific as possible to attract qualified workers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Construction Helper Needed" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear title helps workers understand the job at a glance.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {jobCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Andheri East, Mumbai" {...field} />
                          </FormControl>
                          <FormDescription>
                            Specific location helps nearby workers find your job.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="wage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wage/Salary</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. ₹600/day or ₹15,000/month" {...field} />
                          </FormControl>
                          <FormDescription>
                            Be clear about payment terms and frequency.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Duration (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 5 days or 2 weeks" {...field} />
                          </FormControl>
                          <FormDescription>
                            How long will this job last? Leave empty for ongoing work.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the job, requirements, and any other important details..." 
                            className="min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include details about tasks, skills required, working hours, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={isSubmitting || postJobMutation.isPending}
                    >
                      {isSubmitting || postJobMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting Job...
                        </>
                      ) : "Post Job"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Posting a Great Job</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-neutral-700">
                <li className="flex items-start">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  <span>Be specific about skill requirements and experience level needed.</span>
                </li>
                <li className="flex items-start">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  <span>Clearly mention the location where work needs to be done.</span>
                </li>
                <li className="flex items-start">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  <span>Specify working hours, duration, and payment terms to avoid confusion.</span>
                </li>
                <li className="flex items-start">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  <span>Mention any tools or equipment that the worker should bring.</span>
                </li>
                <li className="flex items-start">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  <span>List any safety measures or certifications required for the job.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
