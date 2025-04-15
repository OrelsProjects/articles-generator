import Mailchimp, { MessagesMessage } from "@mailchimp/mailchimp_transactional";
import client from "@mailchimp/mailchimp_marketing";
import slugify from "slugify";

const mailchimpTx = Mailchimp(process.env.MAILCHIMP_API_KEY || "");
const config = {
  apiKey: process.env.MAILCHIMP_APP_KEY || "",
  server: process.env.MAILCHIMP_SERVER || "us13",
};

export interface ListUser {
  email: string;
  fullName: string;
}

export const testEndpoint = async () => {
  const response = await mailchimpTx.users.ping();
  if (response === "PONG!") {
    return true;
  }
  return false;
};

export const sendMail = async ({
  to,
  from,
  subject,
  template,
  cc = [],
}: {
  to: string | string[];
  subject: string;
  from: "support" | "noreply" | "welcome"
  template: string;
  cc?: string[];
}) => {
  const message: MessagesMessage = {
    from_email: `${from}@writeroom.co`,
    subject,
    html: template,
    to: Array.isArray(to)
      ? to.map(t => ({ email: t, type: "to" }))
      : [{ email: to, type: "to" }],
  };
  for (const c of cc) {
    message.to.push({ email: c, type: "cc" });
  }
  try {
    const response = await mailchimpTx.messages.send({ message });
    console.log("Mail sent successfully:", response);
    return response;
  } catch (error: any) {
    throw new Error(`Error sending mail: ${error.message}`);
  }
};

export const addUserToList = async (user: ListUser) => {
  client.setConfig(config);
  const firstName = user.fullName.split(" ")[0];
  const lastName = user.fullName.split(" ").slice(1).join(" ");
  const listId = process.env.MAILCHIMP_LIST_ID || "";

  const lists = await client.lists.getAllLists();
  console.log(lists);
  const response = await client.lists.addListMember(listId, {
    email_address: user.email,
    status: "subscribed",
    tags: ["WriteRoom"],
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName,
      FULLNAME: user.fullName,
    },
  });

  return response;
};
