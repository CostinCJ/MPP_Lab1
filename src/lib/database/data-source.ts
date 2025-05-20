import "reflect-metadata";
import { DataSource } from "typeorm";
import { Guitar } from "../entities/Guitar";

import { Brand } from "../entities/Brand";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "1234",
    database: process.env.POSTGRES_DB || "guitars_db",
    synchronize: process.env.NODE_ENV === 'development',
    logging: true,
    entities: [Guitar, Brand],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    subscribers: [],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let initializePromise: Promise<DataSource> | null = null;

// Function to get the initialized data source
export const getInitializedDataSource = async (): Promise<DataSource> => {
    if (!AppDataSource.isInitialized) {
        if (!initializePromise) { // Avoid multiple initialization attempts
            initializePromise = AppDataSource.initialize()
                .then(() => {
                    console.log("Data Source has been initialized!");
                    return AppDataSource;
                })
                .catch((error) => {
                    console.error("Error during Data Source initialization:", error);
                    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
                        throw error;
                    }
                    console.warn("Database initialization failed, but continuing (likely build phase)...");
                    return AppDataSource;
                });
        }
        return initializePromise;
    }
    return AppDataSource;
};