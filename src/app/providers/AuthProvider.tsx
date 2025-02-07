/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectAuth,
  setUser as setUserAction,
} from "@/lib/features/auth/authSlice";
import { usePathname } from "next/navigation";
import Loading from "@/components/ui/loading";
import { setUserEventTracker } from "@/eventTracker";
import { setUserLogger } from "@/logger";
import { useSession } from "next-auth/react";
import AppUser, { Plan } from "@/models/appUser";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import {
  addIdeas,
  addPublication,
} from "@/lib/features/publications/publicationSlice";
import axios from "axios";
import { Session, SessionUser } from "next-auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useCustomRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useSelector(selectAuth);
  const { data: session, status } = useSession();

  const setUser = async (session?: Session) => {
    try {
      const userPlan: Plan = session?.user?.meta ? { ...session.user.meta } : { plan: "free" };

      const appUser: AppUser = {
        displayName: session?.user?.name || null,
        email: session?.user?.email || "",
        image: session?.user?.image || null,
        userId: session?.user?.id || "",
        meta: userPlan,
      };
      dispatch(setUserAction(appUser));

      const publicationIdResponse = await axios.get("/api/user/publications");
      const { publication } = publicationIdResponse.data;
      if (publication) {
        dispatch(addPublication(publication));
        dispatch(addIdeas(publication.ideas));
      }
    } catch (error: any) {
      console.error(error);
      dispatch(setUserAction(null));
    }
  };

  useEffect(() => {
    switch (status) {
      case "authenticated":
        setLoading(true);
        setUser(session).finally(() => {
          setLoading(false);
        });
        break;
      case "loading":
        break;
      case "unauthenticated":
        setUser(undefined);
        break;
      default:
        break;
    }
  }, [status]);

  useEffect(() => {
    setUserEventTracker(currentUser);
    setUserLogger(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      if (
        pathname.includes("login") ||
        pathname.includes("register") ||
        pathname === "/"
      ) {
        router.push("/ideas", { preserveQuery: true });
      }
    } else {
      if (!pathname.includes("login") && !pathname.includes("register")) {
        router.push("/", { preserveQuery: true });
      }
    }
  }, [status]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <Loading className="w-20 h-20" />
      </div>
    );
  }
  return children;
}
