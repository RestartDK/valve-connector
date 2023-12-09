import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { Registry } from "azure-iothub";
import { ContainerInstanceManagementClient, ContainerGroup } from "@azure/arm-containerinstance";
import { DefaultAzureCredential } from "@azure/identity";

const iotHubConnectionString = process.env.IOTHUB_CONNECTION_STRING;
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID; // Ensure this is set in your environment variables
const resourceGroup = process.env.AZURE_RESOURCE_GROUP; // Ensure this is set in your environment variables
const containerInstanceLocation = process.env.AZURE_CONTAINER_LOCATION; // Ensure this is set in your environment variables
const registry = Registry.fromConnectionString(iotHubConnectionString);

// Used to authenticate with Azure services
const credentials = new DefaultAzureCredential();

export async function createValveTest(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const deviceId = request.query.get("deviceId") || (await request.text());
        if (!deviceId) {
            return { status: 400, body: "DeviceId is required" };
        }

        context.log(`Processing request for device ID: ${deviceId}`);

        // Create device in IoT Hub
        const { primaryKey } = await createDevice(deviceId);
        const deviceConnectionString = `HostName=valve-simulation.azure-devices.net;DeviceId=${deviceId};SharedAccessKey=${primaryKey}`;

        // Create container instance
        await createContainerInstance(deviceId, deviceConnectionString);

        // Return a successful response
        return { status: 200, body: JSON.stringify({ deviceId, primaryKey }) };
    } catch (error) {
        context.log(`Error: ${error.message}`);
        // Return an error response
        return { status: 500, body: error.message };
    }
}

async function createDevice(deviceId: string): Promise<{ primaryKey: string }> {
    return new Promise((resolve, reject) => {
        registry.create({ deviceId }, (err, deviceInfo) => {
            if (err) {
                reject(new Error(`Error creating device: ${err.message}`));
            } else {
                const primaryKey = deviceInfo.authentication.symmetricKey.primaryKey;
                resolve({ primaryKey });
            }
        });
    });
}

async function createContainerInstance(deviceId: string, deviceConnectionString: string): Promise<void> {
    const containerGroupName = `containergroup-${deviceId}`;
    const client = new ContainerInstanceManagementClient(credentials, subscriptionId);

    const containerResourceRequests = {
        cpu: 1.0,  // Number of CPU cores
        memoryInGB: 1.5  // Amount of memory in GB
    };

    const containerProperties = {
        name: containerGroupName,
        image: 'dkumlin/raspberry-pi:1.1',  // Replace with your container image
        resources: {
            requests: containerResourceRequests
        },
        environmentVariables: [
            { name: 'CONNECTION_STRING', value: deviceConnectionString }
        ],
        // You can add additional properties like ports, volume mounts, etc.
    };

    const containerGroupProperties: ContainerGroup = {
        location: containerInstanceLocation,
        containers: [containerProperties],
        osType: 'Linux',  
    };

    await client.containerGroups.beginCreateOrUpdate(resourceGroup, containerGroupName, containerGroupProperties);
}

app.http("createValveTest", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: createValveTest,
});