import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PuzzleIcon } from "lucide-react";
import { useExtension } from "@/lib/hooks/useExtension";
import { cn } from "@/lib/utils";
import Loading from "@/components/ui/loading";

export interface ExtensionNeededCardProps {
  title?: string;
  body?: string;
  children: React.ReactNode;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  loading?: boolean;
  className?: string;
}

export default function ExtensionNeededWrapper({
  title = "Chrome Extension Required",
  body = "In order to use this functionality, you'll need to install our Chrome extension.",
  children,
  wrapper: Wrapper,
  className,
  loading = false,
}: ExtensionNeededCardProps) {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const { hasExtension } = useExtension();

  useEffect(() => {
    const checkExtensionInstalled = async () => {
      const result = await hasExtension({
        showDialog: false,
        throwIfNoExtension: false,
      });
      setExtensionInstalled(result);
    };
    checkExtensionInstalled();
  }, [hasExtension]);

  const handleInstall = () => {
    // Open Chrome extension store in a new tab
    window.open(
      process.env.NEXT_PUBLIC_EXTENSION_URL ||
        "https://chrome.google.com/webstore/category/extensions",
      "_blank",
    );
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const WrapperComponent = ({ children }: { children: React.ReactNode }) => {
    return Wrapper ? <Wrapper>{children}</Wrapper> : <>{children}</>;
  };

  if (!extensionInstalled) {
    return (
      <WrapperComponent>
        <Card className={cn("w-full relative", className)}>
          {loading && <Loading className="absolute inset-0" />}
          <CardHeader
            className={cn({
              "opacity-0": loading,
            })}
          >
            <CardTitle className="flex items-center gap-2">
              <PuzzleIcon className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn("text-center py-8 space-y-4", {
                "opacity-0": loading,
              })}
            >
              <p className="text-muted-foreground">{body}</p>
              <div className="flex justify-center gap-3 pt-4">
                <Button variant="ghost" onClick={handleRefresh}>
                  Refresh (After installation)
                </Button>
                <Button variant="neumorphic-primary" onClick={handleInstall}>
                  Install extension
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </WrapperComponent>
    );
  }

  return children;
}
