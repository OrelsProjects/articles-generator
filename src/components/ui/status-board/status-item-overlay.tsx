import { Card, CardContent } from "@/components/ui/card"
import type { StatusItem as StatusItemType } from "./types"

interface StatusItemOverlayProps {
  item: StatusItemType
}

export function StatusItemOverlay({ item }: StatusItemOverlayProps) {
  return (
    <Card className="w-full bg-background/95 shadow-md rotate-12">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Skeleton circle for avatar */}
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />

          <div className="flex-1 space-y-2">
            {/* Skeleton lines for content */}
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-[90%]" />
              <div className="h-3 bg-muted rounded animate-pulse w-[80%]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

