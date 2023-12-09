import { app, InvocationContext } from "@azure/functions";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

export async function processValveQueue(queueItem: unknown, context: InvocationContext): Promise<void> {
    context.log('Storage queue function processed work item:', queueItem);
}

app.storageQueue('processValveQueue', {
    queueName: 'valvequeue',
    connection: AZURE_STORAGE_CONNECTION_STRING,
    handler: processValveQueue
});
