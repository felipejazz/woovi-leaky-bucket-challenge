import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;


const customFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ timestamp, level, message, service }) => {
        return `${timestamp} [${service}] ${level.toUpperCase()}: ${message}`;
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
