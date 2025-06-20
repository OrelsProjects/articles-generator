"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { setHideFeedbackFab } from "@/lib/features/ui/uiSlice";
import { useDispatch } from "react-redux";

export function AppearanceSection() {
  const dispatch = useDispatch();
  const [hideFab, setHideFab] = useLocalStorage("hide_feedback_fab", true);

  const { setTheme, resolvedTheme } = useTheme();

  const handleHideFeedbackFab = () => {
    setHideFab(!hideFab);
    dispatch(setHideFeedbackFab(hideFab));
  };

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>
            Customize how the application looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable dark mode for a more comfortable viewing
                experience.
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={resolvedTheme === "dark"}
              onCheckedChange={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hide-feedback-fab">Hide Feedback Button</Label>
              <p className="text-sm text-muted-foreground">
                Hide the feedback button from the bottom of the screen.
              </p>
            </div>
            <Switch
              id="hide-feedback-fab"
              checked={hideFab}
              onCheckedChange={handleHideFeedbackFab}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 