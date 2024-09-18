import { Client, Databases } from "appwrite";

const client = new Client()
    .setEndpoint(import.meta.env.VITE_PROJECT_URL) // Your API Endpoint
    .setProject(import.meta.env.VITE_PROJECT_ID); // Your project ID

export const databases = new Databases(client);
export const databaseID = import.meta.env.VITE_DATABASE_ID 
export const collectionID = import.meta.env.VITE_COLLECTION_ID 