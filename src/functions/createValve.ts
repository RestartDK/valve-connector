import {
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
} from "@azure/functions";
const Registry = require("azure-iothub").Registry;

const connectionString = process.env.IOTHUB_CONNECTION_STRING;
const registry = Registry.fromConnectionString(connectionString);

export async function createValve(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const deviceId: string = request.query.get("deviceId") || (await request.text());
        if (!deviceId) {
            throw new Error("DeviceId is required");
        }

        context.log(`Http function processed request for url "${request.url}"`);
        return new Promise((resolve, reject) => {
            registry.create({ deviceId: deviceId }, (err, deviceInfo) => {
                if (err) {
                    context.log("error: " + err.toString());
                    reject({ status: 400, body: err.toString() });
                } else {
                    context.log("Device created: " + deviceInfo.deviceId);
                    // Extract only the deviceId and primary key
                    const response = {
                        deviceId: deviceInfo.deviceId,
                        primaryKey: deviceInfo.authentication.symmetricKey.primaryKey
                    };
                    resolve({ status: 200, body: JSON.stringify(response) });
                }
            });
        });
    } catch (error) {
        context.log("error: " + error.toString());
        return { status: 500, body: error.toString() };
    }
}

app.http("createValve", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: createValve,
});
