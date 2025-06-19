"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useBilling } from "@/lib/hooks/useBilling";
import { toast } from "react-toastify";
import { Logger } from "@/logger";
import axiosInstance from "@/lib/axios-instance";
import usePayments from "@/lib/hooks/usePayments";
import { useSettings } from "@/lib/hooks/useSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, X } from "lucide-react";

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

export function BillingSection() {
  const { billingInfo, loading: loadingBilling } = useBilling();
  const { cancelSubscription, applyRetentionDiscount } = usePayments();
  const { shouldShow50PercentOffOnCancel } = useSettings();
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [loadingCancelDiscount, setLoadingCancelDiscount] = useState(false);

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await axiosInstance.get<BillingHistoryItem[]>("/api/user/billing/history");
      setBillingHistory(response.data);
    } catch (error) {
      Logger.error("Error fetching billing history:", { error });
      toast.error("Failed to load billing history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      setDownloadingInvoice(invoiceId);
      const response = await axiosInstance.get(`/api/user/billing/invoice/${invoiceId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `invoice-${invoiceId}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      Logger.error("Error downloading invoice:", { error });
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const handleCancelRequest = async () => {
    try {
      setLoadingCancelDiscount(true);
      // Check if user is eligible for retention discount before cancelling
      const isEligible = await shouldShow50PercentOffOnCancel();
      setLoadingCancelDiscount(false);

      if (isEligible) {
        // Show discount dialog instead of cancelling
        setShowDiscountDialog(true);
      } else {
        // Proceed with cancellation
        await handleCancelSubscription();
      }
    } catch (error) {
      setLoadingCancelDiscount(false);
      Logger.error("Error checking for discount:", { error });
      // Fall back to regular cancellation
      await handleCancelSubscription();
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoadingCancel(true);
      await cancelSubscription();
      toast.success("Your subscription has been canceled");
      setShowCancelDialog(false);
    } catch (error) {
      Logger.error("Error canceling subscription:", { error });
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleApplyDiscount = async () => {
    try {
      setLoadingDiscount(true);
      const success = await applyRetentionDiscount();
      if (success) {
        toast.success("50% discount applied to your subscription!");
        setShowDiscountDialog(false);
        setShowCancelDialog(false);
      } else {
        toast.error("Failed to apply discount. Please try again.");
      }
    } catch (error) {
      Logger.error("Error applying discount:", { error });
      toast.error("Failed to apply discount. Please try again.");
    } finally {
      setLoadingDiscount(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>
            Information about your current subscription plan and billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingBilling ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current Plan:</span>
                  <Badge variant="outline" className="capitalize">
                    {billingInfo?.plan || "Free"}
                  </Badge>
                  {billingInfo?.interval && (
                    <span className="text-sm text-muted-foreground">
                      (Billed{" "}
                      {billingInfo.interval === "month"
                        ? "monthly"
                        : "yearly"}
                      )
                    </span>
                  )}
                </div>

                {billingInfo?.nextBillingDate && (
                  <div>
                    <span className="font-medium">
                      Next Billing Date:
                    </span>{" "}
                    <span>
                      {billingInfo.nextBillingDate.toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                )}

                {billingInfo?.nextPaymentAmount && (
                  <div>
                    <span className="font-medium">
                      Next Payment Amount:
                    </span>{" "}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {billingInfo.coupon?.isValid && billingInfo.originalAmount ? (
                        <>
                          <span className="text-muted-foreground line-through text-sm sm:text-base">
                            {formatAmount(billingInfo.originalAmount)}
                          </span>
                          <span className="text-lg sm:text-xl font-semibold text-primary">
                            {formatAmount(billingInfo.nextPaymentAmount)}
                          </span>
                          <span className="text-xs sm:text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                            {billingInfo.coupon.percentOff}% off
                          </span>
                        </>
                      ) : (
                        <span className="text-lg sm:text-xl font-semibold text-primary">
                          {formatAmount(billingInfo.nextPaymentAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {billingInfo?.coupon && (
                  <div className="mt-4 p-3 border border-border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Applied Coupon:</span>
                      <Badge
                        variant={
                          billingInfo.coupon.isValid
                            ? "default"
                            : "outline"
                        }
                        className={
                          billingInfo.coupon.isValid
                            ? "bg-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {billingInfo.coupon.emoji}{" "}
                        {billingInfo.coupon.name}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center">
                      <span>
                        {billingInfo.coupon.percentOff}% discount
                      </span>
                      {/* <TooltipProvider delayDuration={20}>
                        <Tooltip>
                          <TooltipTrigger className="pt-1 ml-1">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-background text-foreground">
                            <p>
                              This coupon is calculated as portion of the
                              year. (
                              <span className="font-bold">Example:</span>
                              50% 1 month is ~5% for the whole year)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider> */}
                    </div>
                    {!billingInfo.coupon.isValid && (
                      <p className="text-sm text-muted-foreground mt-1">
                        This coupon is no longer active on your
                        subscription.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link
                    href={"/settings/pricing"}
                    className="text-foreground bg-card"
                  >
                    Update plan
                  </Link>
                </Button>
                <Button
                  variant="link"
                  className="text-muted-foreground hover:text-destructive w-full sm:w-auto"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[60px]" />
                </div>
              ))}
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No billing history found</p>
              <p className="text-sm mt-1">Your invoices will appear here once you have a paid subscription</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatAmount(item.amount)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(item.status)} text-white`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.invoiceUrl && item.status === 'paid' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(item.id)}
                          disabled={downloadingInvoice === item.id}
                        >
                          <Download className="h-4 w-4" />
                          {downloadingInvoice === item.id ? "Downloading..." : "Download"}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {item.status === 'pending' ? 'Pending' : 'N/A'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Cancel subscription
            </DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 border border-border rounded-md p-4 my-4">
            <p className="text-muted-foreground">
              Is there something we can do to change your mind? I&apos;d love
              to hear from you. <br /> Please{" "}
              <Link
                href="mailto:oreslam@gmail.com"
                className="text-primary hover:underline"
              >
                email
              </Link>{" "}
              me 👍
            </p>
          </div>

          <p className="text-foreground text-base">
            Your subscription will remain active until the end of your current
            billing cycle, which is{" "}
            {billingInfo?.nextBillingDate
              ? billingInfo.nextBillingDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "the end of your current billing period"}
            .
          </p>

          <p className="text-red-500 font-medium mt-6">
            Your account will be locked after this date.
          </p>

          <ul className="list-disc pl-6 mt-4 space-y-3 text-foreground text-sm">
            <li>Scheduled notes will not be sent.</li>
            <li>You will not have access to your notes or posts.</li>
            <li>You will lose any and all access to your account.</li>
            <li>Your subscription will not renew.</li>
          </ul>

          <div className="border-t border-border my-6 pt-4">
            <h3 className="text-lg font-semibold text-foreground text-center">
              Are you sure you want to cancel your subscription?
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border border-primary"
              onClick={() => setShowCancelDialog(false)}
              disabled={loadingCancelDiscount || loadingCancel}
            >
              ← No, keep subscription
            </Button>
            <Button
              variant="destructive"
              disabled={loadingCancelDiscount || loadingCancel}
              onClick={handleCancelRequest}
              className="flex items-center justify-center gap-2"
            >
              {loadingCancelDiscount ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking options...
                </>
              ) : loadingCancel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel subscription"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 50% Discount Offer Dialog */}
      <Dialog
        open={showDiscountDialog}
        onOpenChange={open => {
          if (!open) {
            setShowDiscountDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-center text-center">
              <span className="text-2xl">🎁</span> Special Offer Just For You!
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-lg text-center mb-2">
                50% OFF Your Subscription
              </h3>
              <p className="text-center">
                We&apos;d hate to see you go! Stay with us and get 50% off
                your current plan for the next month (30% for annual plans).
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Keep your scheduled notes and history</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Continue with all your features</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Pay only half the price</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setShowDiscountDialog(false);
                handleCancelSubscription();
              }}
              className="flex items-center justify-center gap-2"
              disabled={loadingDiscount}
            >
              <X className="h-4 w-4" />
              Cancel subscription
            </Button>
            <Button
              onClick={handleApplyDiscount}
              disabled={loadingDiscount}
              className="flex items-center justify-center gap-2"
            >
              {loadingDiscount ? (
                <>Applying discount...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Apply 50% discount
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 