"use client";

import { useEffect } from "react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { CheckCircle2 } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { EventTracker } from "@/eventTracker";

const Auth = () => {
  const { signInWithGoogle } = useAuth();
  const router = useCustomRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || undefined;

  useEffect(() => {
    if (code) {
      localStorage.setItem("code", code);
    }
  }, [code, router]);

  useEffect(() => {
    EventTracker.track("login_page_view");
  }, []);

  const handleGoogleSignIn = () => {
    signInWithGoogle(redirect);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-b from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg relative">
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
            <FcGoogle className="mr-2 h-6 w-6" /> Continue with Google
          </Button>
          
          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full"></div>
            <span className="bg-background text-muted-foreground px-3 text-sm absolute mb-0.5">or</span>
          </div>

          <EmailSignIn />

          <div className="grid gap-4 mt-4">
            {[
              "Use WriteStack's AI to outline your notes (with your voice)",
              "Break through writer's block",
              "Grow 5x faster",
            ].map((perk, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="w-full flex justify-end absolute -bottom-8 right-0">
          <Button
            variant="link"
            size="sm"
            asChild
            className="text-muted-foreground text-xs"
          >
            <Link href="/tos" target="_blank">
              Terms of Service
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
