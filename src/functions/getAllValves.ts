import {
	app,
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
const Registry = require("azure-iothub").Registry;

// Retrieve the connection string from the local.settings.json environment variables
const connectionString = process.env.IOTHUB_CONNECTION_STRING;
const registry = Registry.fromConnectionString(connectionString);

export async function getAllValves(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	context.log(`Http function processed request for url "${request.url}"`);
	return new Promise((resolve, reject) => {
		registry.list((err, deviceList) => {
			if (err) {
				context.log("error: " + err.toString());
				reject({ status: 500, body: err.toString() });
			} else {
				context.log(
					"Devices: " + deviceList.map((device) => device.deviceId).join(",")
				);
				resolve({ status: 200, body: JSON.stringify(deviceList) });
			}
		});
	});
}

app.http("getAllValves", {
	methods: ["GET", "POST"],
	authLevel: "anonymous",
	handler: getAllValves,
});
