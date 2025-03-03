import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/auth/authSlice";
import publicationReducer from "@/lib/features/publications/publicationSlice";
import uiReducer from "@/lib/features/ui/uiSlice";
import productsReducer from "@/lib/features/products/productsSlice";
import settingsReducer from "@/lib/features/settings/settingsSlice";
import notesReducer from "@/lib/features/notes/notesSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
      products: productsReducer,
      publications: publicationReducer,
      settings: settingsReducer,
      notes: notesReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
