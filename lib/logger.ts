type LogLevel = "info" | "error" | "warn";

interface LogData {
  event: string;
  requestId?: string;
  route?: string;
  [key: string]: unknown;
}

interface ErrorLogData extends LogData {
  error: {
    message: string;
    stack?: string;
    name?: string;
  };
}

function getEnv() {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
}

function createLogEntry(level: LogLevel, data: LogData | ErrorLogData): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    env: getEnv(),
    ...data,
  };

  return JSON.stringify(entry);
}

export function logInfo(event: string, data: Omit<LogData, "event"> = {}) {
  console.log(createLogEntry("info", { event, ...data }));
}

export function logError(
  event: string,
  error: Error | unknown,
  data: Omit<LogData, "event"> = {}
) {
  const errorData: ErrorLogData = {
    event,
    ...data,
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    },
  };

  console.error(createLogEntry("error", errorData));
}

export function logWarn(event: string, data: Omit<LogData, "event"> = {}) {
  console.warn(createLogEntry("warn", { event, ...data }));
}
