import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
const Registry = require("azure-iothub").Registry;

const connectionString = process.env.IOTHUB_CONNECTION_STRING;
const registry = Registry.fromConnectionString(connectionString);

export async function getValveState(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	context.log(`Http function processed request for url "${request.url}"`);

    try {
        const deviceId: string = request.query.get("deviceId") || (await request.text());
        if (!deviceId) {
            throw new Error("DeviceId is required");
        }

        return new Promise((resolve, reject) => {
            registry.getTwin(deviceId, (err, twin) => {
                if (err) {
                    context.error("Could not get twin: " + err.toString());
                    reject({ status: 400, body: err.toString() });
                } else {
                    const reportedProperties = twin.properties.reported;
                    context.log("reportedProperties: " + JSON.stringify(reportedProperties));

                    const status = reportedProperties.status; // Extract the status property from the reported properties
                    resolve({ status: 200, body: JSON.stringify({ status }) });
                }
            });
        });
    } catch (error) {
		context.log("error: " + error.toString());
		return { status: 500, body: error.toString() };
	}
}

app.http('getValveState', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getValveState
});
