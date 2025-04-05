/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectAuth,
  setUser as setUserAction,
} from "@/lib/features/auth/authSlice";
import { usePathname, useSearchParams } from "next/navigation";
import { setUserEventTracker } from "@/eventTracker";
import { Logger, setUserLogger } from "@/logger";
import { useSession } from "next-auth/react";
import AppUser from "@/types/appUser";
import { Plan } from "@prisma/client";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { addPublication } from "@/lib/features/publications/publicationSlice";
import axios from "axios";
import { Session } from "next-auth";
import { Loader2 } from "lucide-react";
import { useIdea } from "@/lib/hooks/useIdea";
import { useSettings } from "@/lib/hooks/useSettings";
import Loading from "@/components/ui/loading";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useCustomRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { setIdeas } = useIdea();
  const { init: initSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useSelector(selectAuth);
  const { data: session, status } = useSession();

  const setUser = async (session?: Session) => {
    let hasPublication = false;
    try {
      const userPlan: Plan | null = session?.user?.meta
        ? session.user.meta.plan
        : null;
      const appUser: AppUser = {
        displayName: session?.user?.name || null,
        email: session?.user?.email || "",
        image: session?.user?.image || null,
        userId: session?.user?.id || "",
        meta: {
          plan: userPlan,
          currentPeriodStart: session?.user?.meta?.currentPeriodStart || null,
          currentPeriodEnd: session?.user?.meta?.currentPeriodEnd || null,
          cancelAtPeriodEnd: session?.user?.meta?.cancelAtPeriodEnd || false,
          featureFlags: session?.user?.meta?.featureFlags || [],
          hadSubscription: session?.user?.meta?.hadSubscription || false,
          isAdmin: session?.user?.meta?.isAdmin || false,
        },
      };
      dispatch(setUserAction(appUser));

      try {
        const publicationIdResponse = await axios.get("/api/user/publications");
        const { publication } = publicationIdResponse.data;
        if (publication) {
          hasPublication = true;
          dispatch(addPublication(publication));
          setIdeas(publication.ideas);
        }
        initSettings();
      } catch (error: any) {
        Logger.error("Error adding publication:", error);
      }
    } catch (error: any) {
      Logger.error("Error setting user:", error);
      dispatch(setUserAction(null));
    } finally {
      return hasPublication;
    }
  };

  const handleNavigation = (
    state: "authenticated" | "unauthenticated",
    hasPublication: boolean,
  ) => {
    if (state === "unauthenticated") {
      if (!pathname.includes("login")) {
        router.push("/", { preserveQuery: true });
      }
      return;
    }

    const shouldOnboard = !hasPublication;

    if (shouldOnboard) {
      if (!pathname.includes("onboarding")) {
        router.push(`/onboarding`, {
          preserveQuery: true,
          paramsToAdd: {
            redirect: pathname,
          },
        });
      }
    } else {
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect, {
          preserveQuery: true,
          paramsToRemove: ["redirect"],
        });
      } else if (pathname.includes("login")) {
        // router.push("/home", { preserveQuery: true });
      }
    }
  };

  useEffect(() => {
    let hasPublication = false;
    switch (status) {
      case "authenticated":
        setLoading(true);
        setUser(session)
          .then(response => {
            hasPublication = response;
          })
          .finally(() => {
            setLoading(false);
            handleNavigation("authenticated", hasPublication);
          });
        break;
      case "loading":
        break;
      case "unauthenticated":
        setUser(undefined);
        handleNavigation("unauthenticated", false);
        break;
      default:
        break;
    }
  }, [status]);

  useEffect(() => {
    setUserEventTracker(currentUser);
    setUserLogger(currentUser);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loading spinnerClassName="h-16 w-16" />
      </div>
    );
  }
  return children;
}
