import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import medicalRoutes from "./routers/medicalRoutes.js";

const app = express();
app.use(cors());
const port = 3000;

const uri =
    "mongodb+srv://manuinmumbai:m1@cluster0.jum3w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const clientOptions = {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
    console.log("🟡 Attempting to connect to MongoDB...");

    mongoose
        .connect(uri, clientOptions)
        .then(() => console.log("✅ Connected to MongoDB!"))
        .catch((err) =>
            console.error("❌ MongoDB Connection Error:", err.message)
        );
}

// Middleware to parse JSON bodies
app.use(express.json());

console.log("🟡 Calling connectDB()...");
connectDB();

app.use("api/medical", medicalRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
