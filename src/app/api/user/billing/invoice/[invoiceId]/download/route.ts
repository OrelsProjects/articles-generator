import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/authOptions";
import { getStripeInstance } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getActiveSubscription } from "@/lib/dal/subscription";
import { Logger } from "@/logger";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { invoiceId } = params;

    // Get user subscription from database
    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
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
        return NextResponse.json(
          { error: "Failed to verify subscription" },
          { status: 500 }
        );
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "No customer found" },
        { status: 404 }
      );
    }

    // Retrieve the invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Verify that this invoice belongs to the user's customer
    if (invoice.customer !== customerId) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if invoice has a PDF URL
    if (!invoice.invoice_pdf) {
      return NextResponse.json(
        { error: "Invoice PDF not available" },
        { status: 404 }
      );
    }

    // Fetch the PDF from Stripe
    const pdfResponse = await fetch(invoice.invoice_pdf);
    
    if (!pdfResponse.ok) {
      Logger.error("Failed to fetch invoice PDF from Stripe:", { 
        invoiceId, 
        status: pdfResponse.status,
        userId 
      });
      return NextResponse.json(
        { error: "Failed to download invoice" },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.number || invoiceId}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    Logger.error("Error downloading invoice:", { error, invoiceId: params.invoiceId });
    return NextResponse.json(
      { error: "Failed to download invoice" },
      { status: 500 }
    );
  }
} 