import express from "express";
import cors from "cors";
import pantryRoutes from "./routes/pantry.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", pantryRoutes);

export default app;
