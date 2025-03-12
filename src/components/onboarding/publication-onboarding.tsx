"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalyzePublicationButton } from "@/components/ui/text-editor/analyze-publication-button";
import Logo from "@/components/ui/logo";
import Image from "next/image";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "WriteRoom";

export function PublicationOnboarding() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center min-h-screen bg-background p-4 relative">
      <Image
        src="/home-dark.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill hidden dark:block z-10"
      />
      <Image
        src="/home-light.png"
        alt="Home"
        fill
        className="absolute inset-0 object-fill block dark:hidden z-10"
      />
      <div className="absolute inset-0 bg-foreground/70 dark:bg-background/50 backdrop-blur-sm z-20" />
      <Card className="w-full max-w-md z-30">
        <CardHeader>
          {/* <div className="w-full flex items-center justify-center"> */}
          <Logo className="w-10 h-10" />
          {/* </div> */}
          <CardTitle className="text-2xl">Welcome to {appName}</CardTitle>
          <CardDescription>
            Before you can start, we need to connect your publication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {appName} works by analyzing your existing content to help you
            create better notes and ideas. Please connect your publication to
            continue.
          </p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium">What you&apos;ll need:</p>
            <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Your publication URL (e.g., yourname.substack.com)</li>
              <li>
                Public access to your publication (Paid publications is also
                okay)
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <AnalyzePublicationButton variant="default" className="w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}
