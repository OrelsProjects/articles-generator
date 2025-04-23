"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { CheckCircle2 } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectPublications } from "@/lib/features/publications/publicationSlice";
import Link from "next/link";

const Auth = () => {
  const { signInWithGoogle } = useAuth();
  const { status } = useSession();
  const { publications } = useAppSelector(selectPublications);
  const router = useCustomRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      localStorage.setItem("code", code);
    }
  }, [code, router]);

  useEffect(() => {
    const hasPublication = publications.length > 0;
    if (status === "authenticated") {
      if (hasPublication) {
        router.push("/home", { preserveQuery: true });
      } else {
        router.push("/onboarding", { preserveQuery: true });
      }
    }
  }, [status, router, publications]);

  const handleGoogleSignIn = () => {
    signInWithGoogle();
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
            <FcGoogle className="mr-2 h-6 w-6" /> Sign in with Google
          </Button>
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
