"use client";

import * as React from "react";
import "react-toastify/dist/ReactToastify.css";
import SizeContext from "@/lib/context/sizeContext";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import * as toast from "react-toastify";
import SettingsComponent from "@/components/settingsContainer";
import { useAppSelector } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import NavigationBar from "@/components/navigationBar/navigationBar";

interface ContentProviderProps {
  children: React.ReactNode;
}

const BOTTOM_BAR_HEIGHT = 65;

const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const { user, state } = useAppSelector(state => state.auth);
  const { theme } = useTheme();
  const sizeContent = React.useContext(SizeContext);
  const bottomBarRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number>(
    sizeContent.height,
  );
  ("use client");

  React.useEffect(() => {
    if (bottomBarRef.current) {
      setContentHeight(sizeContent.height - bottomBarRef.current.clientHeight);
    } else {
      setContentHeight(sizeContent.height - BOTTOM_BAR_HEIGHT);
    }
  }, [sizeContent.height, bottomBarRef, bottomBarRef.current]);

  return (
    <div className="w-screen h-screen md:h-[100vh] flex flex-col relative">
      <ThemeProvider>
        <div className="relative z-[51]">
          <toast.ToastContainer
            stacked
            newestOnTop
            theme={theme === "system" ? "light" : theme}
            autoClose={2500}
            draggablePercent={60}
            className="!mb-16 z-[51]"
            transition={toast.Flip}
            position="bottom-center"
            pauseOnHover={false}
          />
        </div>
        {children}
      </ThemeProvider>
    </div>
  );
};

export default ContentProvider;
