import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitials = user ? user.fullName.split(' ').map(n => n[0]).join('') : '';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinks = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#for-workers", label: "For Workers" },
    { href: "/#for-employers", label: "For Employers" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <span className="material-icons text-primary text-3xl mr-2">handyman</span>
            <h1 className="text-xl font-bold text-primary">WorkBuddy</h1>
          </div>
        </Link>

        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-neutral-700 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex space-x-3 items-center">
          {user ? (
            <>
              {user.userType === "employer" && (
                <Button
                  variant="outline"
                  className="hidden md:inline-flex"
                  asChild
                >
                  <Link href="/post-job">Post a Job</Link>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium">
                    {user.fullName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.userType === "worker" ? "/worker-dashboard" : "/employer-dashboard"}>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/verification">
                      Verify Account {user.verificationStatus === "verified" && "✓"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:inline-block">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-9 w-9 rounded-full md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="material-icons text-primary text-3xl mr-2">handyman</span>
                    <h1 className="text-xl font-bold text-primary">WorkBuddy</h1>
                  </div>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 h-9 w-9 rounded-full"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </SheetTrigger>
                </div>
                
                <div className="space-y-4 py-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block py-2 text-neutral-700 hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                  
                  {user ? (
                    <>
                      <Link
                        href={user.userType === "worker" ? "/worker-dashboard" : "/employer-dashboard"}
                        className="block py-2 text-neutral-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/verification"
                        className="block py-2 text-neutral-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Verify Account {user.verificationStatus === "verified" && "✓"}
                      </Link>
                      {user.userType === "employer" && (
                        <Link
                          href="/post-job"
                          className="block py-2 text-neutral-700 hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Post a Job
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block py-2 text-neutral-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full mt-4">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
