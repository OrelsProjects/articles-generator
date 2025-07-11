import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import _ from "lodash";
import AppUser from "@/types/appUser";
import { Plan } from "@prisma/client";

export type AuthStateType =
  | "anonymous"
  | "authenticated"
  | "unauthenticated"
  | "registration_required";

export interface AuthState {
  user?: AppUser | null;
  isAdmin: boolean;
  state: AuthStateType;
  loading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  isAdmin: false,
  state: "unauthenticated",
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<
        ((AppUser | undefined) & { state?: AuthStateType }) | null | undefined
      >,
    ) => {
      state.loading = false;
      if (!action.payload) {
        state.user = null;
        state.state = "unauthenticated";
        return;
      }
      const { state: authState, ...user } = action.payload;
      if (user && !_.isEqual(state.user, user)) {
        state.user = user;
      }
      state.state = action.payload.state ?? "authenticated";
    },
    updateUserPlan: (
      state,
      action: PayloadAction<{ plan: string; interval: "month" | "year" }>,
    ) => {
      const planLower = action.payload.plan.toLowerCase() as Plan;
      if (state.user) {
        state.user.meta = {
          ...state.user.meta,
          plan: planLower,
          currentPeriodStart: state.user.meta?.currentPeriodStart || null,
          currentPeriodEnd: state.user.meta?.currentPeriodEnd || null,
          cancelAtPeriodEnd: state.user.meta?.cancelAtPeriodEnd || false,
          featureFlags: state.user.meta?.featureFlags || [],
          interval: action.payload.interval,
          hadSubscription: state.user.meta?.hadSubscription || false,
          isAdmin: state.user.meta?.isAdmin || false,
          tempAuthorId: state.user.meta?.tempAuthorId || null,
          notesToGenerateCount: state.user.meta?.notesToGenerateCount || 3,
          preferredLanguage: state.user.meta?.preferredLanguage || "en",
          extensionVersion: state.user.meta?.extensionVersion || null,
          author: state.user.meta?.author || null,
          iAmA: state.user.meta?.iAmA || null,
          usuallyPostAbout: state.user.meta?.usuallyPostAbout || null,
        };
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearUser: state => {
      state.loading = false;
      state.user = null;
      state.state = "unauthenticated";
    },
    updatePreferredLanguage: (state, action: PayloadAction<string>) => {
      if (state.user?.meta) {
        state.user.meta.preferredLanguage = action.payload;
      }
    },
    updateName: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.displayName = action.payload;
      }
    },
  },
});

export const {
  setUser,
  setError,
  clearUser,
  setLoading,
  updateUserPlan,
  updatePreferredLanguage,
  updateName,
} = authSlice.actions;

export const selectAuth = (state: RootState): AuthState => state.auth;

export default authSlice.reducer;
