import { buildScheduleName } from "@/lib/dal/note-schedule";
import loggerServer from "@/loggerServer";
import {
  SchedulerClient,
  CreateScheduleCommand,
  GetScheduleCommand,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
} from "@aws-sdk/client-scheduler";

const client = new SchedulerClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
  region: process.env.AWS_REGION as string,
}); // change region

const LAMBDA_FUNCTION_ARN = process.env
  .AWS_LAMBDA_INVOKE_FUNCTION_ARN as string;
const SCHEDULER_ROLE_ARN = process.env.AWS_SCHEDULER_ROLE_ARN as string;
const API_KEY = process.env
  .AWS_EVENT_BRIDGE_NOTE_SCHEDULE_CONNECTION_API_KEY as string;

// 1. CREATE a schedule with HTTP endpoint
export async function createEventBridgeSchedule({
  name,
  scheduleExpression,
  endpoint,
  method = "POST",
  headers = {},
  body,
  deleteAfterCompletion = true,
}: {
  name: string;
  scheduleExpression: string; // e.g. 'rate(5 minutes)' or 'cron(0 12 * * ? *)'
  endpoint: string; // HTTP endpoint URL
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  deleteAfterCompletion?: boolean;
}) {
  const command = new CreateScheduleCommand({
    Name: name,
    ScheduleExpression: scheduleExpression,
    Target: {
      Arn: LAMBDA_FUNCTION_ARN, // This tells AWS to invoke Lambda
      RoleArn: SCHEDULER_ROLE_ARN,
      Input: JSON.stringify({
        Payload: {
          endpoint,
          method,
          headers: {
            ...headers,
            "x-api-key": API_KEY,
          },
          body: body ? JSON.stringify(body) : undefined,
        },
      }),
      RetryPolicy: {
        MaximumRetryAttempts: 5,
      },
    },
    FlexibleTimeWindow: { Mode: "OFF" },
    ActionAfterCompletion: deleteAfterCompletion ? "DELETE" : undefined,
  });

  return await client.send(command);
}

// 2. READ / GET a schedule
export async function getEventBridgeSchedule(options: {
  name?: string;
  id?: string;
}) {
  try {
    let eventName = options.id ? buildScheduleName(options.id) : options.name;
    const command = new GetScheduleCommand({
      Name: eventName,
    });

    return await client.send(command);
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      return null;
    }
    loggerServer.error(error);
    return null;
  }
}

// 3. UPDATE a schedule with HTTP endpoint
export async function updateEventBridgeSchedule({
  name,
  scheduleExpression,
  endpoint,
  method = "POST",
  headers = {},
  input,
}: {
  name: string;
  scheduleExpression: string;
  endpoint: string; // HTTP endpoint URL
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  input?: any;
}) {
  const command = new UpdateScheduleCommand({
    Name: name,
    ScheduleExpression: scheduleExpression,
    Target: {
      Arn: LAMBDA_FUNCTION_ARN,
      RoleArn: SCHEDULER_ROLE_ARN,
      Input: JSON.stringify({
        Endpoint: endpoint,
        Method: method,
        HeaderParameters: {
          ...headers,
          "x-api-key": API_KEY,
        },
        Body: input ? JSON.stringify(input) : undefined,
      }),
    },
    FlexibleTimeWindow: { Mode: "OFF" },
  });

  return await client.send(command);
}

// 4. DELETE a schedule
export async function deleteEventBridgeSchedule(name: string) {
  const command = new DeleteScheduleCommand({
    Name: name,
  });

  return await client.send(command);
}
