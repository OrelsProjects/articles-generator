"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft } from "lucide-react";
import { EventTracker } from "@/eventTracker";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    EventTracker.track("auth_error_page_view", { error });
  }, [error]);

  const getErrorMessage = () => {
    switch (error) {
      case "Verification":
        return "The sign in link is no longer valid. It may have expired or it may have already been used.";
      case "OAuthCallback":
        return "There was a problem with your social sign in. Please try again.";
      case "OAuthAccountNotLinked":
        return "To confirm your identity, sign in with the same account you used originally.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Configuration":
        return "There is a problem with the server configuration. Please contact support.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Authentication Error
          </h2>
        </div>

        <Card className="mt-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex justify-center">
              <div className="mx-auto p-3 rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-medium text-destructive mb-4">
              {error ? `Error: ${error}` : "Authentication Error"}
            </p>
            <p className="text-foreground">
              {getErrorMessage()}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              asChild
            >
              <Link href="/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 