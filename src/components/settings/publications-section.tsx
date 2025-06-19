"use client";

import { useSettings } from "@/lib/hooks/useSettings";
import { PublicationPreferences } from "@/components/settings/publication-preferences";

export function PublicationsSection() {
  const { hasPublication } = useSettings();

  return (
    <div className="space-y-6">

      {hasPublication ? (
        <PublicationPreferences />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No publication connected</p>
          <p className="text-sm mt-1">Connect a publication to manage its preferences</p>
        </div>
      )}
    </div>
  );
} 