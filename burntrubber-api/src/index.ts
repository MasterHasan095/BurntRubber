import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import backupRoutes from "./routes/backup";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/", backupRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`burntrubber-api running on port ${PORT}`));