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
// Load UI state from localStorage
// const loadUiState = () => {
//   if (typeof window === "undefined") return undefined;
//   try {
//     const serializedState = localStorage.getItem("uiState");
//     if (serializedState === null) return undefined;
//     return JSON.parse(serializedState);
//   } catch (err) {
//     console.error("Error loading UI state from localStorage:", err);
//     return undefined;
//   }
// };

// // Save UI state to localStorage
// const saveUiState = (state: any) => {
//   if (typeof window === "undefined") return;
//   try {
//     const serializedState = JSON.stringify(state);
//     localStorage.setItem("uiState", serializedState);
//   } catch (err) {
//     console.error("Error saving UI state to localStorage:", err);
//   }
// };

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
    },
    // preloadedState: {
    //   ui: loadUiState(),
    // },
  });

  // // Subscribe to store changes to save UI state
  // if (typeof window !== "undefined") {
  //   store.subscribe(() => {
  //     const state = store.getState();
  //     saveUiState(state.ui);
  //   });
  // }

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
