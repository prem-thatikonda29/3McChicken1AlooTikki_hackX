import mongoose from "mongoose";

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
