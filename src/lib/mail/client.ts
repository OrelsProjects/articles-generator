import loggerServer from "@/loggerServer";
import axios from "axios";
import {
  MailClientConfig,
  MailProvider,
  AddSubscriberOptions,
  AddTagToEmailOptions,
  RemoveTagFromEmailOptions,
} from "@/types/mail";
import { Resend } from "resend";

export class MailClient implements MailProvider {
  private config: MailClientConfig;
  private baseHeaders: Record<string, string>;
  private transactionalProvider: Resend;

  constructor(config: MailClientConfig) {
    this.config = config;
    this.baseHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
    this.transactionalProvider = new Resend(this.config.transactionalApiKey);
  }

  async sendEmail({
    to,
    from,
    subject,
    template,
    cc = [],
  }: {
    to: string | string[];
    subject: string;
    from: string;
    template: string;
    cc?: string[];
  }) {
    const response = await this.transactionalProvider.emails.send({
      from: `WriteStack <${from}@writestack.io>`,
      to,
      subject,
      html: template,
      cc,
    });

    if (response.error) {
      loggerServer.error(`Error sending email: ${response.error}`);
      throw new Error(response.error.message);
    }

    return response;
  }

  async addSubscriber(options: AddSubscriberOptions) {
    const { email, name, fields } = options;
    let firstName = "";
    let lastName = "";
    let fullName = "";

    if ("firstName" in name) {
      firstName = name.firstName;
      lastName = name.lastName;
      fullName = `${firstName} ${lastName}`;
    } else {
      firstName = name.fullName.split(" ")[0];
      lastName = name.fullName.split(" ").slice(1).join(" ");
      fullName = name.fullName;
    }

    try {
      const body = {
        first_name: firstName,
        email_address: email,
        state: "active",
        fields: {
          last_name: lastName,
          full_name: fullName,
          ...fields,
        },
      };

      const response = await axios.post(
        `${this.config.baseUrl}/subscribers`,
        body,
        { headers: this.baseHeaders },
      );

      return response;
    } catch (error: any) {
      loggerServer.error(`Error adding subscriber: ${error.message}`);
      return null;
    }
  }

  async addTagToEmail(options: AddTagToEmailOptions) {
    const { email, tag } = options;
    try {
      const body = {
        email_address: email,
      };

      const response = await axios.post(
        `${this.config.baseUrl}/tags/${tag}/subscribers`,
        body,
        { headers: this.baseHeaders },
      );

      return response;
    } catch (error: any) {
      loggerServer.error(`Error adding tag to email: ${error.message}`);
      throw error;
    }
  }

  async removeTagFromEmail(options: RemoveTagFromEmailOptions) {
    const { email, tag } = options;
    const body = {
      email_address: email,
    };
    try {
      const response = await axios.delete(
        `${this.config.baseUrl}/tags/${tag}/subscribers/`,
        { headers: this.baseHeaders, data: body },
      );

      return response;
    } catch (error: any) {
      loggerServer.error(`Error removing tag from email: ${error.message}`);
      throw error;
    }
  }
}
