"use client";

import { ChatInterface } from "@/components/ai-chat/chat-interface";
import { useUi } from "@/lib/hooks/useUi";

export default function WriteStackAIPage() {
  const { canUseChat } = useUi();

  if (!canUseChat) {
    return <div>You don&apos;t have access to this feature</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh)] overflow-hidden">
      <ChatInterface className="h-full" />
    </div>
  );
}
