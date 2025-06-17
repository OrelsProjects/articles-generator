export type Tag = "writestack-new-subscriber" | "writestack" | "writestack-subscriber";


export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  from: "support" | "noreply" | "welcome" | "team";
  template: string;
  cc?: string | string[];
  sendInDevelopment?: boolean;
  isMagicLink?: boolean;
}

export interface AddSubscriberOptions {
  email: string;
  name:
    | {
        firstName: string;
        lastName: string;
      }
    | {
        fullName: string;
      };
  fields: Record<string, string>;
}

export interface AddTagToEmailOptions {
  email: string;
  tag: Tag;
}

export interface RemoveTagFromEmailOptions {
  email: string;
  tag: Tag;
}

// Generic interfaces for mail provider
export interface MailProvider {
  addTagToEmail(options: AddTagToEmailOptions): Promise<any>;
  removeTagFromEmail(options: RemoveTagFromEmailOptions): Promise<any>;
  addSubscriber(options: AddSubscriberOptions): Promise<any>;
  sendEmail(options: SendEmailOptions): Promise<any>;
}

export interface MailClientConfig {
  apiKey: string;
  baseUrl: string;
  transactionalApiKey: string;
}
