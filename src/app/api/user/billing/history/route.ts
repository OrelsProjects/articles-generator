import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getStripeInstance } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { Logger } from "@/logger";

export const dynamic = 'force-dynamic';

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  invoiceUrl?: string;
  description: string;
  period: {
    start: string;
    end: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user subscription from database
    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return NextResponse.json([]);
    }

    const stripe = getStripeInstance();

    // Get customer ID from Stripe subscription
    let customerId: string | null = null;
    if (subscription.stripeSubId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubId
        );
        customerId = stripeSubscription.customer as string;
      } catch (error) {
        Logger.error("Failed to retrieve Stripe subscription:", { error, userId });
      }
    }

    if (!customerId) {
      return NextResponse.json([]);
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100, // Adjust as needed
    });

    // Transform Stripe invoices to our format
    const billingHistory: BillingHistoryItem[] = invoices.data.map((invoice: Stripe.Invoice) => {
      let status: "paid" | "pending" | "failed" = "pending";
      
      if (invoice.status === "paid") {
        status = "paid";
      } else if (invoice.status === "open" || invoice.status === "draft") {
        status = "pending";
      } else {
        status = "failed";
      }

      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.amount_paid || invoice.total || 0,
        status,
        invoiceUrl: invoice.invoice_pdf || undefined,
        description: invoice.description || `${subscription.plan} subscription`,
        period: {
          start: new Date((invoice.period_start || invoice.created) * 1000).toISOString(),
          end: new Date((invoice.period_end || invoice.created) * 1000).toISOString(),
        },
      };
    });

    // Sort by date (newest first)
    billingHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(billingHistory);
  } catch (error) {
    Logger.error("Error fetching billing history:", { error });
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 }
    );
  }
} 