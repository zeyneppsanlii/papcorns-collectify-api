import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { rateLimiter } from "./middleware/rate-limit.middleware";
import { router } from "./routes";

export const app = express();

app.set("trust proxy", 1);
app.use(cors());
app.use(rateLimiter);
app.use(express.json());
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);
