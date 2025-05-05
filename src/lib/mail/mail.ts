import loggerServer from "@/loggerServer";
import { MailClient } from "./client";
import { SendEmailOptions, Tag } from "@/types/mail";

const client = new MailClient({
  apiKey: process.env.KIT_API_KEY || "",
  baseUrl: process.env.KIT_BASE_URL || "",
});

export interface ListUser {
  email: string;
  fullName: string;
}

export const sendMail = async ({
  to,
  from,
  subject,
  template,
  cc = [],
}: SendEmailOptions) => {
  loggerServer.info(
    `Sending mail: ${subject}, to: ${to}, from: ${from}, cc: ${cc}, template: ${template}`,
  );
  let fromApp = `WriteStack <${from}@writestack.io>`;
  if (from === "support") {
    fromApp = `WriteStack Support <support@writestack.io>`;
  } else if (from === "welcome") {
    fromApp = `Orel from WriteStack <welcome@writestack.io>`;
  }
  const response = await client.sendEmail({
    to,
    from: fromApp,
    subject,
    template,
    cc,
  });
  loggerServer.info(`Mail sent successfully: ${subject}, to: ${to}`);
  if (!response) {
    throw new Error(`Failed to send mail: ${subject}, to: ${to}`);
  }
  return response;
};

export const addTagToEmail = async (email: string, tag: Tag) => {
  return client.addTagToEmail({ email, tag });
};

export const removeTagFromEmail = async (email: string, tag: Tag) => {
  return client.removeTagFromEmail({ email, tag });
};

export const addSubscriber = async (
  email: string,
  name:
    | {
        firstName: string;
        lastName: string;
      }
    | {
        fullName: string;
      },
  fields: Record<string, string>,
) => {
  return client.addSubscriber({ email, name, fields });
};

export const sendMailSafe = async ({
  to,
  from,
  subject,
  template,
}: {
  to: string;
  from: "support" | "noreply" | "welcome";
  subject: string;
  template: string;
}): Promise<boolean> => {
  try {
    await sendMail({ to, from, subject, template });
    return true;
  } catch (error) {
    loggerServer.error(`[MAIL-ERROR] Error sending mail: ${error}`);
    return false;
  }
};

export default MailClient;
