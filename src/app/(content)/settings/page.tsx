import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { SettingsHeader } from "@/components/settings/settings-header";
import { BillingSettings } from "@/components/settings/billing-settings";

const sidebarNavItems = [
  {
    title: "General",
    href: "#general",
  },
  {
    title: "Billing",
    href: "#billing",
  },
];

export default function SettingsPage() {
  return (
    <div className="container relative mx-auto flex flex-col space-y-6 py-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <main className="flex-1 lg:max-w-2xl">
        <SettingsHeader
          heading="Settings"
          text="Manage your account settings and set e-mail preferences."
        />
        <Separator className="my-6" />
        <div className="space-y-10">
          <section id="billing">
            <BillingSettings />
          </section>
        </div>
      </main>
    </div>
  );
}
