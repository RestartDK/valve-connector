import { DateTime } from 'luxon';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { QueueServiceClient } from "@azure/storage-queue";

export async function scheduleValveStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const deviceId = request.query.get("deviceId"); // Device ID
        const status = request.query.get("status"); // Status ('on' or 'off')
        const targetTimeString = request.query.get("targetTime"); // Target time as string

        if (!targetTimeString || !deviceId || !status) {
            return { status: 400, body: "Missing targetTime, deviceId, or status" };
        }

        // Parse the target time as UTC using Luxon
        const targetTime = DateTime.fromISO(targetTimeString, { zone: 'utc' });

        if (!targetTime.isValid) {
            return { status: 400, body: "Invalid targetTime" };
        }

        // Current time in UTC
        const currentTime = DateTime.utc();

        // Calculate the delay in seconds
        const delayInSeconds = Math.round(targetTime.diff(currentTime, 'seconds').seconds); 

        if (delayInSeconds > 0) {
            const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);
            const queueClient = queueServiceClient.getQueueClient("valvequeue");
            const messageContent = JSON.stringify({ deviceId, status });
            await queueClient.sendMessage(Buffer.from(messageContent).toString('base64'), { visibilityTimeout: delayInSeconds });

            return { status: 200, body: `Function scheduled for Target Time: ${targetTimeString}` };
        } else {
            return { status: 400, body: "Target time is in the past" };
        }
    } catch (error) {
        return { status: 500, body: error.toString() };
    }
}

app.http('scheduleValveStatus', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: scheduleValveStatus
});
