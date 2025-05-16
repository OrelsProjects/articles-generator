"use client";

import { useEffect } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventTracker } from "@/eventTracker";

export default function VerifyRequestPage() {
  useEffect(() => {
    EventTracker.track("magic_link_request_page_view");
  }, []);

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="mt-2 text-muted-foreground">
            A sign in link has been sent to your email address.
          </p>
        </div>

        <Card className="mt-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex justify-center">
              <div className="mx-auto p-3 rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-foreground">
                Click the link in your email to sign in.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don&apos;t see the email, check your spam folder. The
                link will expire in 10 minutes.
              </p>

              <Button
                variant="outline"
                className="w-full mt-4"
                asChild
              >
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 