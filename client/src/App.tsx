import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import WorkerDashboard from "./pages/dashboard/worker-dashboard";
import EmployerDashboard from "./pages/dashboard/employer-dashboard";
import JobDetails from "./pages/jobs/job-details";
import PostJob from "./pages/jobs/post-job";
import WorkerProfile from "./pages/workers/worker-profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/worker-dashboard" component={WorkerDashboard} userType="worker" />
      <ProtectedRoute path="/employer-dashboard" component={EmployerDashboard} userType="employer" />
      <ProtectedRoute path="/post-job" component={PostJob} userType="employer" />
      <Route path="/jobs/:id" component={JobDetails} />
      <Route path="/workers/:id" component={WorkerProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
