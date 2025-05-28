import { TransactionalClient } from "@/lib/mail/transactional-client";
import loggerServer from "@/loggerServer";

type Tag = "writestack" | "writestack-new-subscriber" | "writestack-subscriber";

const tagIds = {
  writestack: 7711550,
  "writestack-new-subscriber": 7713183,
  "writestack-subscriber": 7711556,
};

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
  tag: Tag;
}

export interface AddTagToManyEmailsParams {
  emails: string[];
  tag: Tag;
}

export interface SendEmailParams {
  to: string | string[];
  from: string;
  subject: string;
  template: string;
  cc?: string[];
}

const transactionalClient = new TransactionalClient();

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Kit-Api-Key": process.env.KIT_API_KEY as string,
} as const;

export class MailClient {
  private config: MailClientConfig;

  constructor(config: MailClientConfig) {
    this.config = config;
  }

  async getUsersFromDate(startDate: Date): Promise<string[]> {
    const matchingEmails: string[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    try {
      while (hasNextPage) {
        const url = new URL(`${this.config.baseUrl}/subscribers`);
        url.searchParams.append("created_after", startDate.toISOString());

        if (cursor) {
          url.searchParams.append("after", cursor);
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(
            `Failed to fetch subscribers: ${response.statusText}, ${responseText}`,
          );
        }

        const data = await response.json();
        const subscribers = data.subscribers || [];

        for (const sub of subscribers) {
          const created = new Date(sub.created_at);
          if (created > startDate) {
            matchingEmails.push(sub.email_address);
          }
        }

        hasNextPage = data.pagination?.has_next_page;
        cursor = data.pagination?.end_cursor ?? null;
      }

      loggerServer.info(
        `✅ Found ${matchingEmails.length} subscribers after ${startDate.toISOString()}`,
      );
      return matchingEmails;
    } catch (error: any) {
      loggerServer.error(`❌ Error in getUsersFromDate: ${error.message}`);
      return [];
    }
  }

  async addSubscriber({ email, name, fields = {} }: AddSubscriberParams) {
    try {
      // Here you would implement your provider-specific logic
      // For example with fetch:
      const response = await fetch(`${this.config.baseUrl}/subscribers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email_address: email,
          first_name: name.firstName,
          state: "active",
          fields: {
            last_name: name.lastName,
            full_name: name.fullName,
            ...fields,
          },
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Failed to add subscriber: ${response.statusText}, ${response.status}, ${responseText}`,
        );
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
      const tagId = tagIds[tag];
      if (!tagId) {
        throw new Error(`Tag not found: ${tag}`);
      }
      const inputBody = {
        email_address: email,
      };

      // Provider-specific implementation
      const response = await fetch(
        `${this.config.baseUrl}/tags/${tagId}/subscribers`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(inputBody),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Failed to add tag: ${response.statusText}, ${responseText}`,
        );
      }

      const data = await response.json();
      loggerServer.info(`Tag added to email: ${email}, tag: ${tag}`);
      return data;
    } catch (error: any) {
      loggerServer.error(`Error adding tag to email: ${error.message}`);
      return null;
    }
  }
  // exactly the same as addTagToEmail, but DELETE
  async removeTagFromEmail({ email, tag }: AddTagParams) {
    try {
      const tagId = tagIds[tag];
      if (!tagId) {
        throw new Error(`Tag not found: ${tag}`);
      }
      const response = await fetch(
        `${this.config.baseUrl}/tags/${tagId}/subscribers`,
        {
          method: "DELETE",
          headers: {
            ...headers,
            Accept: "",
          },
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Failed to remove tag: ${response.statusText}, ${responseText}`,
        );
      }

      const data = await response.json();
      loggerServer.info(`Tag removed from email: ${email}, tag: ${tag}`);
      return data;
    } catch (error: any) {
      loggerServer.error(`Error removing tag from email: ${error.message}`);
      return null;
    }
  }
  async addTagToManyEmails({ emails, tag }: AddTagToManyEmailsParams) {
    try {
      // Provider-specific implementation
      const tagId = tagIds[tag];
      if (!tagId) {
        throw new Error(`Tag not found: ${tag}`);
      }

      const bodyInput = {
        taggings: emails.map(email => ({
          email_address: email,
          tag_id: tagId,
        })),
      };

      const response = await fetch(
        `${this.config.baseUrl}/bulk/tags/subscribers`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(bodyInput),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Failed to add tag to emails: ${response.statusText}, ${responseText}`,
        );
      }

      const data = await response.json();
      loggerServer.info(`Tag added to emails: ${emails}, tag: ${tag}`);
      return data;
    } catch (error: any) {
      loggerServer.error(`Error adding tag to emails: ${error.message}`);
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
