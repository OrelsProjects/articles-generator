"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { CheckCircle2 } from "lucide-react";

const Auth = () => {
  const { status } = useSession();
  const router = useCustomRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/editor");
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    // Implement Google sign-in logic here
    console.log("Sign in with Google");
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-b from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Welcome
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full py-6 text-lg font-semibold transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <FcGoogle className="mr-2 h-6 w-6" /> Sign in with Google
          </Button>
          <div className="grid gap-4 mt-4">
            {[
              "Access to AI-powered ideas and outlines generator",
              "Easy integration with your Substack account",
              "Never have writer's block again",
            ].map((perk, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* <p className="mt-8 text-center text-sm text-muted-foreground">
        By signing in, you agree to our{" "}
        <a
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </a>
        .
      </p> */}
    </div>
  );
};

export default Auth;
