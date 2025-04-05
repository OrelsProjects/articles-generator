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

const roleArn = process.env.AWS_SCHEDULER_ROLE_ARN as string;

// 1. CREATE a schedule with HTTP endpoint
export async function createEventBridgeSchedule({
  name,
  scheduleExpression,
  endpoint,
  method = "POST",
  headers = {},
  body,
}: {
  name: string;
  scheduleExpression: string; // e.g. 'rate(5 minutes)' or 'cron(0 12 * * ? *)'
  endpoint: string; // HTTP endpoint URL
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
}) {
  const command = new CreateScheduleCommand({
    Name: name,
    ScheduleExpression: scheduleExpression,
    Target: {
      Arn: process.env.AWS_SCHEDULER_NOTE_API_DESTINATION_ARN as string,
      RoleArn: roleArn,
      Input: JSON.stringify({
        Endpoint: endpoint,
        Method: method,
        HeaderParameters: {
          ...headers,
          "x-api-key": process.env
            .AWS_EVENT_BRIDGE_NOTE_SCHEDULE_CONNECTION_API_KEY as string,
        },
        Body: body ? JSON.stringify(body) : undefined,
      }),
    },
    FlexibleTimeWindow: { Mode: "OFF" },
  });

  return await client.send(command);
}

// 2. READ / GET a schedule
export async function getSchedule(name: string) {
  const command = new GetScheduleCommand({
    Name: name,
  });

  return await client.send(command);
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
      Arn: process.env.AWS_SCHEDULER_NOTE_API_DESTINATION_ARN as string,
      RoleArn: roleArn,
      Input: JSON.stringify({
        Endpoint: endpoint,
        Method: method,
        HeaderParameters: headers,
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
