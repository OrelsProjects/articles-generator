import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/auth/authSlice";
import publicationReducer from "@/lib/features/publications/publicationSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      publications: publicationReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
