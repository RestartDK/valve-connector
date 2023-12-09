import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { QueueServiceClient } from "@azure/storage-queue";

export async function scheduleValveStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const targetTime = new Date(request.query.get("targetTime")); // Target time
        const deviceId = request.query.get("deviceId"); // Device ID
        const status = request.query.get("status"); // Status ('on' or 'off')

        // Validate input
        if (!targetTime || !deviceId || !status) {
            return { status: 400, body: "Missing targetTime, deviceId, or status" };
        }

        const currentTime = new Date();
        const delayInSeconds = (targetTime.getTime() - currentTime.getTime()) / 1000;

        if (delayInSeconds > 0) {
            const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
            const queueClient = queueServiceClient.getQueueClient("valvequeue");
            
            // Construct message content with device and status information
            const messageContent = JSON.stringify({ deviceId, status });
            await queueClient.sendMessage(Buffer.from(messageContent).toString('base64'), { visibilityTimeout: delayInSeconds });

            context.log("Message sent to queue");
            return { status: 200, body: "Function scheduled" };
        } else {
            context.log("Target time is in the past");
            return { status: 400, body: "Target time is in the past" };
        }
    } catch (error) {
        context.log("error: " + error.toString());
        return { status: 500, body: error.toString() };
    }
};

app.http('scheduleValveStatus', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: scheduleValveStatus
});
