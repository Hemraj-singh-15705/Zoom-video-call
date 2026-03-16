import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../..", ".env") });
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000))
app.use(cors({
    origin: ["https://linkup-yy69.onrender.com", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    try {

        const connectionDb = await mongoose.connect(process.env.MONGO_URI)

        console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`)
        server.listen(app.get("port"), () => {
            console.log("LISTENIN ON PORT 8000")
        });
    } catch (e) {
        console.log("Error Connecting to DB", e)
    }
}
start();