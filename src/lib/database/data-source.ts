import "reflect-metadata";
import { DataSource } from "typeorm";
import { Guitar } from "../entities/Guitar";
import { Brand } from "../entities/Brand";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "data/database.sqlite",
    synchronize: true,
    logging: false,
    entities: [Guitar, Brand],
    migrations: [],
    subscribers: [],
});

// Initialize the data source
const initializePromise = AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
        return AppDataSource;
    })
    .catch((error) => {
        console.error("Error during Data Source initialization:", error);
        throw error;
    });

// Function to get the initialized data source
export const getInitializedDataSource = async (): Promise<DataSource> => {
    return initializePromise;
};