import { app, InvocationContext, StorageQueueTrigger } from "@azure/functions";
import { Registry } from "azure-iothub";

type ValveQueueMessage = {
    deviceId: string;
    status: string;
};

const connectionString = process.env.IOTHUB_CONNECTION_STRING;
const registry = Registry.fromConnectionString(connectionString);

export async function processValveQueue(queueItem: ValveQueueMessage, context: InvocationContext): Promise<void> {
    try {
        const { deviceId, status } = queueItem;

        if (!deviceId || !status) {
            context.log("Not enough information to process queue item");
            return; // Exit the function if essential information is missing
        }

        const desiredProperties = {
            properties: {
                desired: {
                    status: status
                }
            }
        };

        registry.getTwin(deviceId, (err, twin) => {
            if (err) {
                context.error("Could not get twin: " + err.toString());
                return; // Exit the function on error
            }

            twin.update(desiredProperties, (err) => {
                if (err) {
                    context.error("Could not update twin: " + err.toString());
                    return; // Exit the function on error
                }
                context.log("Twin updated with desired properties");
            });
        });
    } catch (error) {
        context.log(`Error processing queue item: ${error.message}`);
        // Handle any other unexpected errors here
    }
}

app.storageQueue('processValveQueue', {
    queueName: 'valvequeue',
    connection: "AzureWebJobsStorage",
    handler: processValveQueue
});
