"use client";

import { useEffect, useState } from "react";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import useAuth from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { EventTracker } from "@/eventTracker";
import { Logger } from "@/logger";
import { appName } from "@/lib/consts";
import { cn } from "@/lib/utils";
import {
  BestSeller100,
  BestSeller1000,
  BestSeller10000,
} from "@/components/ui/best-seller-badge";
import Logo from "@/components/ui/logo";
import { testimonials } from "@/lib/consts";
import { motion } from "framer-motion";

const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const nextTestimonial = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      prev => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  useEffect(() => {
    if (!hovering) {
      const interval = setInterval(nextTestimonial, 8000);
      return () => clearInterval(interval);
    }
  }, [hovering]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative h-full flex flex-col">
      <div className="text-right mb-8">
        <h3 className="text-xl font-semibold text-muted-foreground mb-2 text-center">
          What creators are saying about {appName}
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div
          className={cn(
            "h-72 p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-auto rounded-lg",
            {
              "z-50": !!currentTestimonial.noteImage,
            },
          )}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="flex items-center gap-2">
            <img
              src={currentTestimonial.image}
              alt={currentTestimonial.author}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex flex-row items-center gap-1">
                <div className="font-semibold hover:underline hover:cursor-pointer">
                  <Link href={currentTestimonial.url} target="_blank">
                    {currentTestimonial.author}
                  </Link>
                </div>
                {currentTestimonial.bestSeller &&
                  (currentTestimonial.bestSeller === "100" ? (
                    <BestSeller100 height={16} width={16} />
                  ) : currentTestimonial.bestSeller === "1000" ? (
                    <BestSeller1000 height={16} width={16} />
                  ) : (
                    <BestSeller10000 height={16} width={16} />
                  ))}
              </div>

              <div
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: currentTestimonial.title,
                }}
              />
            </div>
          </div>
          {currentTestimonial.quote && (
            <p
              className="text-foreground mb-4"
              dangerouslySetInnerHTML={{
                __html: currentTestimonial.quote,
              }}
            />
          )}
          {currentTestimonial.noteImage && (
            <motion.img
              whileHover={
                {
                  // scale: 1.6,
                  // make it incraese size to the left side
                  // x: -40,
                }
              }
              transition={{ duration: 0.3 }}
              src={currentTestimonial.noteImage}
              alt={currentTestimonial.author}
              onClick={() => {
                if (currentTestimonial.noteUrl) {
                  window.open(currentTestimonial.noteUrl, "_blank");
                }
              }}
              className={cn(
                "w-full h-40 object-cover rounded-lg hover:shadow-md transition-shadow duration-300",
                {
                  "cursor-pointer": !!currentTestimonial.noteUrl,
                },
              )}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={prevTestimonial}>
            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
          </Button>

          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/10",
                )}
              />
            ))}
          </div>

          <Button variant="ghost" onClick={nextTestimonial}>
            <ChevronRight className="w-6 h-6 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Auth = () => {
  const { signInWithGoogle } = useAuth();
  const router = useCustomRouter();
  const searchParams = useSearchParams();
  const [loadingSignIn, setLoadingSignIn] = useState(false);

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
    Logger.info("Redirecting after google sign in: ", { redirect });
    setLoadingSignIn(true);
    signInWithGoogle(redirect).finally(() => {
      setLoadingSignIn(false);
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Connectivity Issue Banner */}
      {/* <motion.div
        initial={{ opacity: 1, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      className="bg-yellow-100 border-b border-yellow-200 px-4 py-3 text-center">
        <p className="text-yellow-800 text-sm font-medium">
          We are aware of an ongoing connectivity issue. We are working on a fix.
        </p>
      </motion.div> */}

      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Login Form */}
        <div className="flex flex-col justify-center px-8 lg:px-16">
          <div className="max-w-md mx-auto w-full">
            {/* Logo */}
            <Logo className="mb-8" />

            {/* Welcome */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome!
              </h1>
              <p className="text-gray-600">
                We&apos;ll sign you in or create an account
                <br />
                if you don&apos;t have one yet.
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loadingSignIn}
              className="w-full py-6 text-base font-medium mb-6 bg-background/60"
            >
              {loadingSignIn ? (
                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <FcGoogle className="mr-3 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-300 w-full"></div>
              <span className="bg-muted text-muted-foreground px-3 text-sm absolute">
                or
              </span>
            </div>

            {/* Email Sign In */}
            <EmailSignIn />

            {/* Terms */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                By continuing you agree to the{" "}
                <Link href="/tos" className="text-blue-600 hover:underline">
                  Terms of use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Testimonials Carousel */}
        <div className="hidden lg:block bg-white">
          <div className="h-full p-16">
            <TestimonialCarousel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
