# Azure Functions for Valve Management System

Azure Functions implemented in the Water Treatment Cloud Project. Each function serves a specific role in managing and controlling valve operations within the system, leveraging the power and scalability of Azure's serverless architecture.

## ⚡ Functions

### 1. `scheduleValveStatus`

- **Purpose**: Schedules a valve operation (turn on/off) at a specified time.
- **Trigger**: HTTP trigger.
- **Method**: POST.
- **Parameters**:
  - `deviceId`: Identifier for the valve.
  - `status`: Desired status ('on' or 'off').
  - `targetTime`: The scheduled time for the operation (UTC).
- **Description**: Receives scheduling requests and places them into Azure Queue Storage for delayed processing. Handles time zone conversions and schedules tasks accurately in UTC.

### 2. `monitorValveState`

- **Purpose**: Monitors the current state of a valve.
- **Trigger**: HTTP trigger.
- **Method**: GET.
- **Parameters**:
  - `deviceId`: Identifier for the valve.
- **Description**: Provides real-time monitoring capability by fetching the current state of a specified valve. Useful for dashboard updates and alert systems.

### 3. `updateValveState`

- **Purpose**: Updates the state of a valve (on/off).
- **Trigger**: Queue trigger.
- **Description**: Triggered by messages in the Azure Queue, this function updates the state of valves based on scheduled tasks. Ensures that valve operations are carried out at the designated times.

### 4. `logValveActivity`

- **Purpose**: Logs valve activities for auditing and historical analysis.
- **Trigger**: Event Hub trigger.
- **Description**: Captures and logs every state change or significant event related to valve operations. Supports data analytics and historical tracking of valve performance.

### 5. `validateValveOperation`

- **Purpose**: Validates requests for valve operations.
- **Trigger**: HTTP trigger.
- **Method**: POST.
- **Parameters**:
  - Request payload containing operation details.
- **Description**: Ensures that incoming requests for valve operations are valid, authenticated, and authorized. Prevents unauthorized access and maintains system integrity.

## ⚙️ Deployment and Configuration

Each function is deployed as part of the Azure Functions app. Ensure that all necessary environment variables and configuration settings are correctly set in the Azure portal or local.settings.json for local testing.

## 📝 Local Testing

To test these functions locally, use Azure Functions Core Tools:

To install azure function core tools see the following link: (Azure function core tools download)[https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-typescript].

Then start the azure function
```
bun run start
```

Navigate to the specific function URL to trigger HTTP functions, or use tools like Postman for making HTTP requests.
