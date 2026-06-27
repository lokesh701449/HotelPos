import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Middleware Setup
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Main API Routes
app.use("/api", apiRouter);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
