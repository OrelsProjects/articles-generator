import Mailchimp, { MessagesMessage } from "@mailchimp/mailchimp_transactional";
import client from "@mailchimp/mailchimp_marketing";
import loggerServer from "@/loggerServer";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "WriteStack";
const mailchimpTx = Mailchimp(process.env.MAILCHIMP_API_KEY || "");
const config = {
  apiKey: process.env.MAILCHIMP_APP_KEY || "",
  server: process.env.MAILCHIMP_SERVER || "us13",
};

const tagMap = {
  "signed-in": "WriteStack",
  subscribed: "WriteStack-subscribed",
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
  from: "support" | "noreply" | "welcome";
  template: string;
  cc?: string[];
}) => {
  const fromWithCapital = from.charAt(0).toUpperCase() + from.slice(1);
  const message: MessagesMessage = {
    from_email: `${appName} - ${fromWithCapital}@writestack.io`,
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
    loggerServer.error(`Error sending mail: ${error.message}`);
    return null;
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
    tags: ["WriteStack"],
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName,
      FULLNAME: user.fullName,
    },
  });

  return response;
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
    loggerServer.error(`Error sending mail: ${error}`);
    return false;
  }
};

export const addTagToUser = async (
  email: string,
  tag: "signed-in" | "subscribed",
) => {
  client.setConfig(config);
  const listId = process.env.MAILCHIMP_LIST_ID || "";
  const membersResponse = await client.lists.getListMembersInfo(listId, {
    count: 99,
  });
  // if has "status" in membersResponse, then it's an error
  if ("status" in membersResponse) {
    loggerServer.error(`Error getting list members: ${membersResponse.status}`);
    return;
  }
  const member = membersResponse.members.find(m => m.email_address === email);
  if (!member) {
    return;
  }

  const response = await client.lists.updateListMemberTags(listId, member.id, {
    tags: [tagMap[tag]],
  });
  return response;
};
