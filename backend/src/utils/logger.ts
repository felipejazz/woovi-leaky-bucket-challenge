import winston from 'winston';

const colors: Record<string, string> = {
    info: 'green',
    warn: 'yellow',
    error: 'red',
    debug: 'blue'
};

winston.addColors(colors);

const { combine, timestamp, printf } = winston.format;


const customFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ timestamp, level, message, service }) => {
        const coloredLevel = winston.format.colorize().colorize(level, level.toUpperCase());
        return `${timestamp} [${service}] ${coloredLevel}: ${message}`;
    })
);

const logger = winston.createLogger({
    format: customFormat,
    transports: [
        new winston.transports.Console()
    ]
});

export default function createCustomLogger(serviceName: string) {
    return logger.child({ service: serviceName });
}
