"use client";

import * as toast from "react-toastify";

export function ToastProvider() {
  return (
    <div className="relative z-[999999999999]">
      <toast.ToastContainer
        stacked
        newestOnTop
        theme="light"
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
