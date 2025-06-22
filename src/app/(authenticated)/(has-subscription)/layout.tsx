import { DataFetchProvider } from "@/app/providers/DataFetchProvider";
import DialogProvider from "@/app/providers/DialogProvider";
import { ExtensionProvider } from "@/app/providers/ExtensionProvider";
import FreeSubscriptionProvider from "@/app/providers/FreeSubscriptionProvider";
import NewSubscriptionDialog from "@/app/providers/NewSubscriptionDialog";
import QueueDiscrepancyProvider from "@/app/providers/QueueDiscrepancyProvider";
import ShowNoteFromUrlProvider from "@/app/providers/ShowNoteFromUrlProvider";
import SubscriptionProvider from "@/app/providers/SubscriptionProvider";
import { SubstackCookiesProvider } from "@/app/providers/SubstackCookiesProvider";
import { UpdateDataProvider } from "@/app/providers/UpdateExtensionDataProvider";
import VisitProvider from "@/app/providers/VisitProvider";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("%c🔥 rerender layout", "color: purple; font-size: 20px");

  return (
    <AppSidebar>
      <FreeSubscriptionProvider>
        <SubscriptionProvider>
          <NewSubscriptionDialog />
          <VisitProvider>
            <DataFetchProvider>
              <ShowNoteFromUrlProvider />
              <SubstackCookiesProvider>
                <ExtensionProvider />
                <DialogProvider />
                <QueueDiscrepancyProvider />
                <UpdateDataProvider />
                {children}
              </SubstackCookiesProvider>
            </DataFetchProvider>
          </VisitProvider>
        </SubscriptionProvider>
      </FreeSubscriptionProvider>
    </AppSidebar>
  );
}
