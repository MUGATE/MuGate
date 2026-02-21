const LOG_LEVELS = {
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    DEBUG: "DEBUG",
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
};

export const logger = {
    info: (message: string) => console.log(formatMessage("INFO", message)),
    warn: (message: string) => console.warn(formatMessage("WARN", message)),
    error: (message: string, err?: Error) => {
        console.error(formatMessage("ERROR", message));
        if (err?.stack) console.error(err.stack);
    },
    debug: (message: string) => {
        if (process.env.NODE_ENV === "development") {
            console.log(formatMessage("DEBUG", message));
        }
    },
};
