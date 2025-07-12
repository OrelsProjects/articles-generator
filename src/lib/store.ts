import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/auth/authSlice";
import publicationReducer from "@/lib/features/publications/publicationSlice";
import uiReducer from "@/lib/features/ui/uiSlice";
import productsReducer from "@/lib/features/products/productsSlice";
import settingsReducer from "@/lib/features/settings/settingsSlice";
import notesReducer from "@/lib/features/notes/notesSlice";
import inspirationReducer from "@/lib/features/inspiration/inspirationSlice";
import statisticsReducer from "@/lib/features/statistics/statisticsSlice";
import writerReducer from "@/lib/features/writer/writerSlice";
import autoDMReducer from "@/lib/features/auto-dm/auto-dm-slice";
import ghostwriterReducer from "@/lib/features/ghostwriter/ghostwriterSlice";
import realTimeReducer from "@/lib/features/real-time/realTimeSlice";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
      products: productsReducer,
      publications: publicationReducer,
      settings: settingsReducer,
      notes: notesReducer,
      inspiration: inspirationReducer,
      statistics: statisticsReducer,
      writer: writerReducer,
      autoDM: autoDMReducer,
      ghostwriter: ghostwriterReducer,
      realTime: realTimeReducer,
    },
  });

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
