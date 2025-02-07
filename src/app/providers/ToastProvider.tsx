"use client";

import * as toast from "react-toastify";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative z-[51]">
      <toast.ToastContainer
        stacked
        newestOnTop
        theme={resolvedTheme}
        autoClose={2500}
        draggablePercent={60}
        className="!mb-16 z-[51]"
        transition={toast.Flip}
        position="bottom-center"
        pauseOnHover={false}
      />
    </div>
  );
}
