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
  cc,
  sendInDevelopment = false,
}: SendEmailOptions) => {
  const env = process.env.NODE_ENV;
  if (env !== "production" && !sendInDevelopment) {
    console.log(
      `[MAIL] Not sending mail in development: ${subject}, to: ${to}, from: ${from}, cc: ${cc}, template: ${template}`,
    );
    return;
  }

  loggerServer.info(
    `Sending mail: ${subject}, to: ${to}, from: ${from}, cc: ${cc}, template: ${template}`,
  );

  const ccArray = Array.isArray(cc) ? cc : cc ? [cc] : [];

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
    cc: ccArray,
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

export const addTagToManyEmails = async (emails: string[], tag: Tag) => {
  return client.addTagToManyEmails({ emails, tag });
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
  fields?: Record<string, string>,
) => {
  let subscriberFields = { ...fields };
  let firstName = "";
  let lastName = "";
  let fullName = "";
  if ("firstName" in name) {
    firstName = name.firstName;
    lastName = name.lastName;
    fullName = `${firstName} ${lastName}`;
  } else {
    fullName = name.fullName;
    const nameParts = fullName.split(" ");
    firstName = nameParts[0];
    lastName = nameParts[nameParts.length - 1];
  }
  return client.addSubscriber({
    email,
    name: { firstName, lastName, fullName },
    fields: subscriberFields,
  });
};

export const sendMailSafe = async ({
  to,
  from,
  subject,
  template,
  cc,
}: SendEmailOptions): Promise<boolean> => {
  try {
    await sendMail({ to, from, subject, template, cc });
    return true;
  } catch (error) {
    loggerServer.error(`[MAIL-ERROR] Error sending mail: ${error}`);
    return false;
  }
};

export default MailClient;
