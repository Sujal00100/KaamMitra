import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LoginPage from "@/pages/login-page";
import RegisterPage from "@/pages/register-page";
import VerificationPage from "@/pages/verification-page";
import AdminPage from "@/pages/admin-page";
import PaymentDemo from "@/pages/payment-demo";
import MessagingPage from "@/pages/messaging-page";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import WorkerDashboard from "./pages/dashboard/worker-dashboard";
import EmployerDashboard from "./pages/dashboard/employer-dashboard";
import JobDetails from "./pages/jobs/job-details";
import PostJob from "./pages/jobs/post-job";
import WorkerProfile from "./pages/workers/worker-profile";
import { Chatbot } from "@/components/ui/chatbot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <ProtectedRoute path="/worker-dashboard" component={WorkerDashboard} userType="worker" />
      <ProtectedRoute path="/employer-dashboard" component={EmployerDashboard} userType="employer" />
      <ProtectedRoute path="/post-job" component={PostJob} userType="employer" />
      <ProtectedRoute path="/verification" component={VerificationPage} />
      <ProtectedRoute path="/messaging" component={MessagingPage} />
      <ProtectedRoute path="/messaging/:id" component={MessagingPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/payment" component={PaymentDemo} />
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
        <Chatbot />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
