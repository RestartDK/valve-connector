import {
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
} from "@azure/functions";
const Registry = require('azure-iothub').Registry;

const connectionString = process.env.IOTHUB_CONNECTION_STRING;
const registry = Registry.fromConnectionString(connectionString);

export async function setValveState(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const deviceId: string = request.query.get("deviceId") || (await request.text());
        const status: string = request.query.get("status") || (await request.text());

        if (!deviceId) {
            throw new Error("DeviceId is required");
        }
        if (!status) {
            throw new Error("Status is required");
        } else if (status !== "on" && status !== "off") {
            throw new Error("Status must be 'on' or 'off'");
        }

        // Update the device twin with the desired properties
        const desiredProperties = {
            properties: {
                desired: {
                    status: status
                }
            }
        };

        return new Promise((resolve, reject) => {
            registry.getTwin(deviceId, (err, twin) => {
                if (err) {
                    context.error("Could not get twin: " + err.toString());
                    reject({ status: 400, body: err.toString() });
                }
                context.log("Twin retrieved");

                twin.update(desiredProperties, (err) => {
                    if (err) {
                        context.error("Could not update twin: " + err.toString());
                        reject({ status: 400, body: err.toString() });
                    }
                    context.log("Twin updated with desired properties");
                    resolve({ status: 200, body: `Twin updated to status ${status}` });
                });
            });
        });
    } catch (error) {
        context.log("error: " + error.toString());
        return { status: 500, body: error.toString() };
    }
}

app.http("setValveState", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: setValveState,  // Ensure the handler name matches the function name
});
