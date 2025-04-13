import { Plan } from "@prisma/client";

export function baseEmailTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WriteRoom Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: hsl(0, 0%, 13%);
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
          background-color: #cc5500; /* Deep burnt orange */
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
        .button {
          display: inline-block;
          background-color: #cc5500; /* Deep burnt orange */
          color: #ffffff;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 0.5rem;
          margin-top: 20px;
        }
        .center-button-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: hsl(0, 0%, 45.1%);
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WriteRoom</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from WriteRoom. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const welcomeTemplate = (name?: string) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to WriteRoom</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333333;
            line-height: 1.6;
            padding: 0;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #cc5500; /* Deep burnt orange */
        }
        .button-container {
            text-align: center;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            color: #ffffff;
            background-color: #cc5500; /* Deep burnt orange */
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
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">Hey ${name || "there"}, Welcome to WriteRoom!</h1>
        
        <p><strong>Payment Confirmation:</strong> We appreciate your support and are thrilled to have you on board!</p>

        <p>WriteRoom is designed to help you write smarter while staying true to your own voice. Whether you’re a Substack writer, blogger, or content creator, our AI-powered tools give you the freedom to explore ideas, craft outlines, and refine your words—without losing the spark that makes your writing unique.</p>
        
        <p>Here’s what you can expect:</p>
        <ul>
          <li><strong>AI-Powered Outlines & Titles:</strong> Generate tailored suggestions for what to write next.</li>
          <li><strong>Smart Text Editor:</strong> Enhance clarity, refine tone, and expand or condense sections in real-time.</li>
          <li><strong>Authentic Control:</strong> Keep your signature style intact while letting AI do the heavy lifting.</li>
        </ul>
        
        <p>We’ll keep you updated with new features to help you make the most of WriteRoom. In the meantime, feel free to jump right in and start writing!</p>
        
        <p>Thanks again for joining.</p>

        <p><strong>P.S.</strong> We love feedback! If you have questions or suggestions, simply reply to this email or reach out anytime.</p>
        
        <div class="button-container">
            <a class="button" href="https://writeroom.co/editor">Start writing</a>
        </div>

        <div class="divider"></div>

        <footer class="footer">
            <p>Made with ❤️ by Orel</p>
            <p>If you have any questions, just hit reply. We're always here to help.</p>
            <p>Simply reply to this email to reach us.</p>
            <p>Need to unsubscribe? <a href="%unsubscribe_url%" style="color: #cc5500; text-decoration: none;">Click here</a>.</p>
        </footer>

    </div>
</body>
</html>
`;

export function generateSubscriptionCanceledEmail(subscriptionId: string) {
  const content = `
    <h2>Subscription Canceled</h2>
    <p>Your subscription <strong>${subscriptionId}</strong> for WriteRoom has been canceled.</p>
    <p>We’re sorry to see you go. If you have feedback about your experience or suggestions for how we can improve, we’d love to hear from you.</p>
    <p>Should you change your mind, you can reactivate your subscription at any time to regain access to AI outlines, real-time text improvements, and more.</p>
    <a href="https://writeroom.co/account" class="button">Manage Your WriteRoom Account</a>
  `;
  return baseEmailTemplate(content);
}

export function generateSubscriptionTrialEndingEmail(
  plan: Plan,
  trialEndDate: Date,
) {
  const planString = plan.charAt(0).toUpperCase() + plan.slice(1);

  const content = `
    <h2>Your WriteRoom Trial is Ending Soon</h2>
    <p>Your trial for subscription plan: <strong>${planString}</strong> will end on 
    <strong>${trialEndDate.toLocaleDateString()}</strong>.</p>
    <p>If you find value in WriteRoom, you can safely ignore this email and keep up the amazing writing :).</p>
    <p>Otherwise, you can cancel your subscription any time.</p>
    <div class="center-button-container">
      <a href="https://writeroom.co/settings" class="button">Manage Subscription</a>
    </div>
  `;
  return baseEmailTemplate(content);
}

export function generateSubscriptionDeletedEmail(subscriptionId: string) {
  const content = `
    <h2>I'm sorry to see you go :(</h2>
    <p>Your subscription <strong>${subscriptionId}</strong> for WriteRoom has been cancelled.</p>
    <p>If you didn't enjoy using WriteRoom, I'd love to hear from you and improve.</p>
    <p>Should you change your mind and tell me how I can improve, I'll give you a substantial discount for your next subscription :)</p>
    <div class="center-button-container">
      <a href=${process.env.NEXT_PUBLIC_UPDATE_SUBSCRIPTION_URL} class="button">Manage Subscription</a>
    </div>
  `;
  return baseEmailTemplate(content);
}

export function generateInvoicePaymentFailedEmail(
  invoiceId: string,
  email: string,
) {
  const content = `
    <h2>Payment Failed</h2>
    <p>A user with email <strong>${email}</strong> payment for invoice <strong>${invoiceId}</strong> has failed.</p>
  `;
  return baseEmailTemplate(content);
}

export function generateFailedToSendNoteEmail(
  noteBody: string,
  noteId: string,
) {
  const content = `
    <h2>Failed to send note</h2>
    ${
      noteBody.length > 0
        ? `<p>The note: <a href="https://writeroom.co/queue?noteId=${noteId}">${noteId}</a>
        with body:
        <br/> <strong>${noteBody}</strong>
        <br/> failed to send.</p>`
        : `The note with id <a href="https://writeroom.co/queue?noteId=${noteId}">${noteId}</a> failed to send because the note is empty.`
    }
    <p>You can send it now by clicking the button below.</p>
    <div class="center-button-container">
      <a href="https://writeroom.co/queue?sendNoteId=${noteId}" class="button">Send now</a>
    </div>
  `;
  return baseEmailTemplate(content);
}
