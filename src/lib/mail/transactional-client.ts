import { SendEmailParams } from "@/lib/mail/client";
import { Resend } from "resend";

const client = new Resend(process.env.RESEND_API_KEY);

export interface ITransactionalClient {
  sendEmail(params: SendEmailParams): Promise<{
    error: Error | null;
    data: any;
  }>;
}

export class TransactionalClient implements ITransactionalClient {
  async sendEmail(params: SendEmailParams): Promise<{
    error: Error | null;
    data: any;
  }> {
    try {
      const response = await client.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.template,
        cc: params.cc,
      });
      return { error: response.error, data: response.data };
    } catch (error: any) {
      return { error: error, data: null };
    }
  }
}
