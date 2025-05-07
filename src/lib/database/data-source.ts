import "reflect-metadata";
import { DataSource } from "typeorm";
import { Guitar } from "../entities/Guitar";
import { Brand } from "../entities/Brand";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "data/database.sqlite", // Using the data directory
    synchronize: true, // Set to false in production and use migrations
    logging: false,
    entities: [Guitar, Brand],
    migrations: [],
    subscribers: [],
});

// Helper function to initialize the data source
export const initializeDataSource = async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
    }
};