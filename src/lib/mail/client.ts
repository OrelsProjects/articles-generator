import { TransactionalClient } from "@/lib/mail/transactional-client";
import loggerServer from "@/loggerServer";

export interface MailClientConfig {
  apiKey: string;
  baseUrl: string;
}

export interface SubscriberName {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export interface AddSubscriberParams {
  email: string;
  name: SubscriberName;
  fields?: Record<string, string>;
}

export interface AddTagParams {
  email: string;
  tag: string;
}

export interface SendEmailParams {
  to: string | string[];
  from: string;
  subject: string;
  template: string;
  cc?: string[];
}

const transactionalClient = new TransactionalClient();

export class MailClient {
  private config: MailClientConfig;

  constructor(config: MailClientConfig) {
    this.config = config;
  }

  async addSubscriber({ email, name, fields = {} }: AddSubscriberParams) {
    try {
      // Here you would implement your provider-specific logic
      // For example with fetch:
      const response = await fetch(`${this.config.baseUrl}/subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          email,
          name,
          fields,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add subscriber: ${response.statusText}`);
      }

      const data = await response.json();
      loggerServer.info(`Subscriber added: ${email}`);
      return data;
    } catch (error: any) {
      loggerServer.error(`Error adding subscriber: ${error.message}`);
      return null;
    }
  }

  async addTagToEmail({ email, tag }: AddTagParams) {
    try {
      // Provider-specific implementation
      const response = await fetch(`${this.config.baseUrl}/subscribers/tag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          email,
          tag,
          status: "active",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add tag: ${response.statusText}`);
      }

      const data = await response.json();
      loggerServer.info(`Tag added to email: ${email}, tag: ${tag}`);
      return data;
    } catch (error: any) {
      loggerServer.error(`Error adding tag to email: ${error.message}`);
      return null;
    }
  }

  async removeTagFromEmail({ email, tag }: AddTagParams) {
    try {
      // Provider-specific implementation
      const response = await fetch(`${this.config.baseUrl}/subscribers/untag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          email,
          tag,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove tag: ${response.statusText}`);
      }

      const data = await response.json();
      loggerServer.info(`Tag removed from email: ${email}, tag: ${tag}`);
      return data;
    } catch (error: any) {
      loggerServer.error(`Error removing tag from email: ${error.message}`);
      return null;
    }
  }

  async sendEmail({ to, from, subject, template, cc = [] }: SendEmailParams) {
    try {
      // Using the transactional API key for sending emails
      const response = await transactionalClient.sendEmail({
        to,
        from,
        subject,
        template,
        cc,
      });

      if (response.error) {
        throw new Error(`Failed to send email: ${response.error.message}`);
      }

      return response.data;
    } catch (error: any) {
      loggerServer.error(`Error sending email: ${error.message}`);
      return null;
    }
  }
}
