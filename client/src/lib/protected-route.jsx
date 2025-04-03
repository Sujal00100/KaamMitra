import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  userType,
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (userType && user.userType !== userType) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
          <p className="text-muted-foreground text-center mb-6">
            You don't have permission to access this page. This page is only for {userType}s.
          </p>
          <a 
            href={user.userType === "worker" ? "/worker-dashboard" : "/employer-dashboard"} 
            className="text-primary hover:underline"
          >
            Go to your dashboard
          </a>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}