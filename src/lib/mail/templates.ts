import { Plan } from "@prisma/client";

export interface EmailTemplate {
  body: string;
  subject: string;
}

export function baseEmailTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WriteStack Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background-color: hsl(0, 0%, 98%);
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border: 1px solid hsl(0, 0%, 89.8%);
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #ff661a; /* Deep burnt orange */
          color: #ffffff;
          padding: 20px;
          text-align: center;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .header h1 {
          margin: 0;
        }
        .content {
          padding: 20px;
        }
        .center-button-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .title {
            font-size: 18px;
            color: #ff661a; /* Deep burnt orange */
        }
        .button-container {
            text-align: center;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            color: #ffffff !important;
            background-color: #ff661a; /* Deep burnt orange */
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: bold;
        }
        .footer {
            font-size: 12px;
            color: #777777;
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
        }
        .divider {
            margin-top: 30px;
            border-top: 1px solid #dddddd;
            margin-bottom: 20px;
        }
        a {
            color: #ffffff;
            text-decoration: none;
            cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WriteStack</h1>
        </div>
        <div class="content">
          ${content}
        </div>
      </div>
    </body>
    </html>
  `;
}

// REMOVED 5m+ from the email <li>Access to 5m+ inspiration notes</li>
export const generateWelcomeTemplateTrial = (name: string): EmailTemplate => ({
  body: baseEmailTemplate(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hey ${name || "there"}, it's Orel from WriteStack!</title>
</head>
<body>
    <div>
        <h1 class="title">Hey ${name || "there"}, it's Orel from WriteStack!</h1>
        
        <p><strong>You're in!</strong> Thanks so much for joining. I'm genuinely excited to be part of your writing journey.</p>

        <p>WriteStack was built for writers like you who want to maintain their authentic voice while getting a little AI magic to enhance your process.
        Whether you're writing posts or notes, WriteStack is designed to improve your natural talent. Never replace it.</p>
        
        <p>Here's what's waiting for you:</p>
        <ul>
          <li>AI-powered notes outline and writing</li>
          <li>Easy notes scheduling</li>
          <li>Notes AI enhancer</li>
          <li>Smart Substack-like post editor with style enhancements</li>
        </ul>

        <p>And the best part? Everything is <strong>extremely personalized</strong> to <strong>your</strong> writing.</p>
        
        <p>I'm constantly developing new features based on writers' feedback. Keep an eye on your inbox for updates, tips, and inspiration to maximize your WriteStack experience.</p>
        
        <p>Ready to start growing your audience?</p>

        
        <div class="button-container">
        <a class="button" href="https://writestack.io/home">Start growing</a>
        </div>

        <p><strong>P.S.</strong> Your feedback shapes WriteStack's future. Have ideas, questions, or just want to chat about writing? Just reply to this email. I read every message personally.</p>

        <div class="divider"></div>

        <footer class="footer">
            <p>Crafted with ❤️ by Orel</p>
            <p>Questions or thoughts? Just hit reply. I'm a real human who loves hearing from you.</p>
        </footer>

    </div>
</body>
</html>
`),
  subject: name ? `${name}, you're in! 🎉` : "You're in! 🎉",
});

export function generateSubscriptionCanceledEmail(subscriptionId: string) {
  const content = `
    <h2>We'll miss having you in the WriteStack!</h2>
    <p>Your subscription <strong>${subscriptionId}</strong> has been successfully canceled.</p>
    <p>Everyone's writing journey is different, and we're grateful you gave WriteStack a try. If you have a moment to share what we could have done better, I'd personally love to hear your thoughts. It helps us improve for other writers.</p>
    <p>Should your writing needs change, your account is still here whenever you're ready to return. We've preserved all your previous work, so you can pick up right where you left off.</p>
    <div class="center-button-container">
      <a href="https://writestack.io/account" class="button">Manage Your Account</a>
    </div>
    <p style="margin-top: 20px; font-style: italic;">Wishing you continued success with your writing, wherever it takes you!</p>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "We'll miss having you in the WriteStack!",
  };
}

export function generateSubscriptionTrialEndingEmail(
  plan: Plan,
  trialEndDate: Date,
  name: string | null,
) {
  const planString = plan.charAt(0).toUpperCase() + plan.slice(1);
  const formattedDate = trialEndDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const content = `
    <h2>Your WriteStack adventure continues soon!</h2>
    <p>Hey ${name || "there"}!</p>
    <p>Just a friendly heads-up that your trial of the <strong>${planString} Plan</strong> will wrap up on <strong>${formattedDate}</strong>.</p>
    <p>We hope WriteStack has been helping you find your voice and grow your audience!</p> 
    <p>If you're enjoying the experience, no action is needed. Your subscription will continue seamlessly, and you can keep creating amazing content without interruption.</p>
    <p>Not quite the right fit for your writing process? No problem at all. You can manage or cancel your subscription anytime before your trial ends.</p>
    <p>Either way, I'm here to support you in any way. Respond to this email or send me a DM on my <a href="https://substack.com/@orelzilberman?utm_source=user-menu">Substack</a>.</p>
    <div class="center-button-container">
      <a href="https://writestack.io/settings" class="button">Manage My Subscription</a>
    </div>
  `;

  return {
    body: baseEmailTemplate(content),
    subject: "Your WriteStack trial is ending soon",
  };
}

export function generateSubscriptionDeletedEmail(
  userName?: string,
  planName?: string,
) {
  const content = `
    <h2>Hey ${userName || "there"}, we're sad to see you go</h2>
    <p>Your plan <strong>${planName}</strong> for WriteStack has been successfully canceled.</p>
    <p>Everyone's writing needs are unique, and I'd genuinely value hearing about your experience. What could we have done differently to better support your creative process?</p>
    <p>As a thank you for your feedback, I'd be happy to offer you a special discount if you decide to return in the future. Your insights help make WriteStack better for writers everywhere.</p>
    <div class="center-button-container">
      <a href="mailto:feedback@writestack.io?subject=My%20WriteRoom%20Experience" class="button">Share Your Feedback</a>
    </div>
    <p style="margin-top: 20px;">Your WriteStack account remains active, and we've saved all your previous work should you ever wish to return.</p>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "I'm sad to see you go",
  };
}

export function generateInvoicePaymentFailedEmail(
  invoiceId: string,
  email: string,
) {
  const content = `
    <h2>We noticed an issue with your payment</h2>
    <p>Hi there! We wanted to let you know that the payment for invoice <strong>${invoiceId}</strong> associated with <strong>${email}</strong> wasn't able to go through.</p>
    <p>This sometimes happens due to temporary card issues or bank security measures. No worrie. You can update your payment method or try again through your account dashboard.</p>
    <p>Need any help sorting this out? We're here for you!</p>
    <div class="center-button-container">
      <a href="https://writestack.io/settings" class="button">Update Payment Information</a>
    </div>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "We noticed an issue with your payment",
  };
}

export function generateFailedToSendNoteEmail(
  noteBody: string,
  noteId: string,
) {
  const content = `
    <h2>Quick fix needed for your note</h2>
    ${
      noteBody.length > 0
        ? `<p>We tried to send your note (<a href="https://writestack.io/queue?noteId=${noteId}">view here</a>), but ran into a small hiccup along the way.</p>
        <p>Here's what you wrote:</p>
        <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff661a; margin: 15px 0;"><strong>${noteBody}</strong></p>
        <p>No worries! You can send it now with a single click:</p>
        <div class="center-button-container">
          <a href="https://writestack.io/queue?sendNoteId=${noteId}" class="button">Send Now</a>
        </div>
        `
        : `<p>We tried to send your note (<a href="https://writestack.io/queue?noteId=${noteId}">view here</a>), but it appears to be empty.<br/> Perhaps you meant to add some content?</p>`
    }

  `;
  return {
    body: baseEmailTemplate(content),
    subject: "Quick fix needed for your note",
  };
}

export function generatePublicationAnalysisCompleteEmail(userName?: string) {
  const content = `
    <h2>Your publication analysis is ready, ${userName || "writer"}!</h2>
    <p>Good news! We've completed the in-depth analysis of your publication.</p>
    <p>Ready to start writing with your new insights?</p>
    <div class="center-button-container">
      <a href="https://www.writestack.io/settings#preferences" class="button">View Your Analysis</a>
    </div>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "Your publication analysis is ready 🎉",
  };
}

// REMOVED 5m+ from the email <li>Inspiration notes from 5m+ pool of notes</li>
export function generatePaymentConfirmationEmail(options: {
  userName?: string;
  planName?: string;
  amount?: string | number;
  paymentDate?: Date;
  nextBillingDate?: Date;
  invoiceNumber?: string;
}) {
  const {
    userName,
    planName,
    amount,
    paymentDate,
    nextBillingDate,
    invoiceNumber,
  } = options;
  const formattedPaymentDate = paymentDate
    ? paymentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "today";

  const formattedNextBillingDate = nextBillingDate
    ? nextBillingDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const content = `
    <h2>Payment Confirmed! Your WriteStack journey continues</h2>
    <p>Hi ${userName || "there"},</p>
    <p>Great news! Your payment for WriteStack ${planName || "subscription"} has been successfully processed. Thank you for your continued support of your writing journey with us.</p>
    
    <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #cc5500; margin-top: 0;">Payment Details</h3>
      <p><strong>Amount:</strong> ${amount || "Your subscription amount"}</p>
      <p><strong>Date:</strong> ${formattedPaymentDate}</p>
      ${invoiceNumber ? `<p><strong>Invoice Number:</strong> ${invoiceNumber}</p>` : ""}
      ${formattedNextBillingDate ? `<p><strong>Next Billing Date:</strong> ${formattedNextBillingDate}</p>` : ""}
    </div>
    
    <p>Your subscription is active and you have full access to all WriteStack features to help elevate your writing:</p>
    <ul>
      <li>Smart, powerful notes outline and writer</li>
      <li>Easy notes scheduling</li>
      <li>Publication analytics and insights</li>
    </ul>
    
    <p>Need to review your subscription details or download your invoice? You can access your account settings at any time:</p>
    
    <div class="center-button-container">
      <a href="https://writestack.io/settings" class="button">Manage Subscription</a>
    </div>
    
    <p style="margin-top: 20px;">If you have any questions about your payment or subscription, please don't hesitate to reach out. We're here to help!</p>
    
    <p>Happy writing,<br>
    The WriteStack Team</p>
  `;

  return {
    body: baseEmailTemplate(content),
    subject: `Payment Confirmed: Your WriteStack ${planName || "subscription"} is active`,
  };
}

export function generateFreeTrialEndingEmail(
  trialEndDate: Date,
  userName?: string,
) {
  const formattedDate = trialEndDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const content = `
    <h2>Your WriteStack free trial is wrapping up!</h2>
    <p>Hi ${userName || "there"},</p>
    <p>Just a friendly heads-up that your free trial of WriteStack will conclude on <strong>${formattedDate}</strong>.</p>
    
    <p>We've loved having you as part of our writing community and hope that WriteStack has helped spark your creativity and streamline your writing process!</p>
    
    <p>During your trial, you've experienced how WriteStack can:</p>
    <ul>
      <li>Generate AI-powered outlines that match your unique style</li>
      <li>Enhance your writing with smart text editing tools</li>
      <li>Help you schedule and organize your content calendar</li>
      <li>Connect you with inspiration from our extensive note library</li>
    </ul>
    
    <p>Many writers tell me that WriteStack has become an essential part of their creative process. I'd love for you to continue your journey with me!</p>    
    
    <p style="margin-top: 20px;">Have questions about which plan might be right for you? Just reply to this email. I'm happy to help you find the perfect fit for your writing needs.</p>
    
    <p>Happy writing,<br>
    Orel and the WriteStack Team</p>
  `;

  return {
    body: baseEmailTemplate(content),
    subject: `Your WriteStack free trial ends ${formattedDate}`,
  };
}

// REMOVED 5m+ from the email <li>Access to 5m+ inspiration notes</li>
export function generateFreeSubscriptionEndedEmail(userName?: string) {
  const content = `
    <h2>Your WriteStack Free Trial Has Ended. Keep the Momentum Going!</h2>
    <p>Hi ${userName || "there"},</p>
    <p>We hope you enjoyed exploring WriteStack's full potential during your free trial! While your access to premium features has now concluded, your writing journey doesn't have to stop here :)</p>
    
    <p>During your trial, you unlocked:</p>
    <ul>
      <li>AI-powered notes outline and writer</li>
      <li>Easy notes scheduling</li>
      <li>Notes AI enhancer</li>
      <li>Smart Substack-like post editor with style enhancements</li>
    </ul>
    
    <p>Many writers like you find their voice via WriteStack:<br>
    <em>"WriteStack allowed me to finally find my voice on Substack Notes, one that I'm satisfied with and I feel like."</em> – Kacper Wojaczek</p>
    
    <div class="center-button-container">
      <a href="https://www.writestack.io/pricing" class="button">Continue Your Writing Journey</a>
    </div>
    
    <p>Special offer for trial users: Save 15% on your first 3 months when you upgrade in the next 48 hours.</p>
    <p> Use the code <strong>TRIAL15</strong> at checkout to save 15%.</p>
    
    <p style="margin-top: 20px;">Whatever you decide, thank you for giving WriteStack a try. We're rooting for your writing success!</p>
    
    <p>Warm regards,<br>
    Orel and the WriteStack Team</p>
    
    <p style="font-size: 0.9em; color: #666; margin-top: 25px;">
      P.S. Need help choosing a plan? Reply to this email. I'll personally help you find the perfect fit.
    </p>
  `;

  return {
    body: baseEmailTemplate(content),
    subject: "Your WriteStack Free Trial Has Ended. Keep the Momentum Going!",
  };
}

export function generateSubscriptionPausedEmail(
  userName?: string,
  planName?: string,
) {
  const content = `
    <h2>Your WriteStack Subscription is Paused. Ready to Return Anytime</h2>
    <p>Hi ${userName || "there"},</p>
    <p>We've successfully paused your <strong>${planName || "subscription"}</strong>. Your writing space remains exactly as you left it, and we'll preserve all your work and preferences until you're ready to resume.</p>

    <p>While paused, your data is saved and will be accessible once you resume your subscription.</p>

    <p>When you're ready to continue your writing journey, one click brings everything back:</p>

    <div class="center-button-container">
      <a href="https://www.writestack.io/settings" class="button">Resume Subscription</a>
    </div>

    <p>Whether this is a temporary break or extended leave, we're here to support your creative rhythm. Your writing matters, and we're honored you chose WriteStack as part of your process.</p>

    <p>Warm regards,<br>
    Orel and the WriteStack Team</p>
  `;

  return {
    body: baseEmailTemplate(content),
    subject: "Your WriteStack Subscription is Paused. Ready to Return Anytime",
  };
}

export function generatePrivateNewUserSignedUpEmail(
  userName?: string,
  userEmail?: string,
) {
  // This is an email to be sent to me when a new user signs up
  const content = `
    <h2>New User Signed Up</h2>
    <p>Hi there,</p>
    <p>A new user has signed up for WriteStack:</p>
    <p>Name: ${userName}</p>
    <p>Email: ${userEmail}</p>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "New User Signed Up",
  };
}

export function generateScheduleNoteMissedEmail(
  userName: string,
  noteId: string,
  noteBody: string,
  reason?: string,
) {
  const content = `
  <h2>Schedule Note Missed</h2>
  <p>Hi ${userName || "there"},</p>
  <p>We noticed that your scheduled note (<a href="https://writestack.io/queue?noteId=${noteId}">view here</a>) was missed.</p>
  ${
    noteBody
      ? `<p>Here's the note:</p>
  <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff661a; margin: 15px 0;"><strong>${noteBody}</strong></p>`
      : ""
  }
  <p>Reason: ${reason || "Unknown"}</p>
  <p>No worries! You can either reschedule it or send it now:</p>
  <div class="center-button-container">
    <a href="https://writestack.io/queue?noteId=${noteId}" class="button">Reschedule Note</a>
  </div>
  <p>Make sure to open this link from your computer to avoid any issues.</p>
<p>Sorry for the inconvenience!</p>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "Schedule Note Missed",
  };
}

export function generateSubscriptionCouponAppliedEmail(
  userName: string,
  percentOff: number,
  discountForMonths: number,
) {
  const content = `
  <h2>Subscription Coupon Applied</h2>
  <p>Hi ${userName || "there"},</p>
  <p>We've successfully applied a ${percentOff}% discount to your subscription for the next ${discountForMonths} months.</p>
  <p>Your subscription is now updated with the new discount.</p>
  <p>If you have any questions or need assistance, please don't hesitate to reach out. I'm here to help!</p>
  <p>Warm regards,<br>
  Orel</p>
  `;
  return {
    body: baseEmailTemplate(content),
    subject: "Subscription Coupon Applied",
  };
}

export function generateMagicLinkEmail(
  email: string,
  url: string,
): { subject: string; body: string } {
  return {
    subject: "Your Magic Link to Sign In to WriteStack",
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Sign In to WriteStack</h2>
        <p>Hey there!</p>
        <p>You requested a magic link to sign in to WriteStack. Click the button below to sign in:</p>
        <div style="margin: 20px 0;">
          <a href="${url}" 
             style="display: inline-block; 
                    background-color: #0070f3; 
                    color: white; 
                    padding: 12px 20px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;">
            Sign In to WriteStack
          </a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this link, you can safely ignore this email.</p>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>© WriteStack</p>
        </div>
      </div>
    `,
  };
}
