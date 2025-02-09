"use client";

import AppleLogin from "@/components/auth/appleLogin";
import GoogleLogin from "@/components/auth/googleLogin";
import CustomLink from "@/components/customLink";
import { Button } from "@/components/ui/button";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const Auth = () => {
  const { status } = useSession();
  const router = useCustomRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/editor");
    }
  }, [status, router]);

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center text-center overflow-hidden px-6 lg:px-0 ">
      <div className="w-full flex flex-col gap-3 lg:max-w-[420px] rounded-xl p-8 bg-card">
        <GoogleLogin signInTextPrefix="Sign in with" />
        <AppleLogin signInTextPrefix="Sign in with" />
      </div>
      <div className="flex flex-row gap-1 justify-center items-center">
        <span className="text-muted-foreground">
          Don&apos;t have an account?
        </span>
        <Button
          variant="link"
          className="text-base underline text-muted-foreground !p-0"
          asChild
        >
          <CustomLink href="/register" preserveQuery>
            Sign up
          </CustomLink>
        </Button>
      </div>
    </div>
  );
};

export default Auth;
