import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { HttpError } from "./utils/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(root, ".env") });
process.chdir(root);

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "CreatorHub AI", demoFallback: !process.env.OPENAI_API_KEY });
});

app.use("/api", router);

app.use((_req, _res, next) => next(new HttpError(404, "Not found")));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`CreatorHub AI API running on http://localhost:${port}`);
});
