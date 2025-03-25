import Mailchimp, { MessagesMessage } from "@mailchimp/mailchimp_transactional";

const mailchimpTx = Mailchimp(process.env.MAILCHIMP_API_KEY || "");

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
  cc,
}: {
  to: string | string[];
  from: string;
  subject: string;
  template: string;
  cc: string[];
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
  const form = new FormData();
  const firstName = user.fullName.split(" ")[0];
  const lastName = user.fullName.split(" ").slice(1).join(" ");
  const listAddress = "orel@writeroom.co";
  const apiKey = process.env.MAILGUN_API_KEY;
  form.append("name", user.fullName);
  form.append("address", user.email);
  form.append("vars[first_name]", firstName);
  form.append("vars[last_name]", lastName);
  form.append("subscribed", "yes");
  form.append("upsert", "yes");
  const resp = await fetch(
    `https://api.mailgun.net/v3/lists/${listAddress}/members`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from("api:" + apiKey).toString("base64"),
      },
      body: form,
    },
  );

  const data = await resp.text();
  console.log(data);
};

export const sendFeaturesMailToList = async () => {
  // const mailgun = new Mailgun(FormData);
  // const listAddress = "orel@writeroom.co";
  // const mg = mailgun.client({
  //   username: "api",
  //   key: process.env.MAILGUN_API_KEY || "API_KEY",
  // });
  // const users: MailListMembersResult =
  //   await mg.lists.members.listMembers(listAddress);
  // const tos = users.items;
  // for (const to of tos) {
  //   try {
  //     const data = await mg.messages.create("writeroom.co", {
  //       from: "WriteRoom <orel@writeroom.co>",
  //       to: to.address,
  //       subject: "WriteRoom new features",
  //       template: "writeroom new features",
  //       "h:X-Mailgun-Variables": JSON.stringify({
  //         first_name: to.vars.first_name || "there",
  //       }),
  //     });
  //     console.log(data); // logs response data
  //   } catch (error) {
  //     console.log(error, to); // logs any error
  //   }
  // }
};
