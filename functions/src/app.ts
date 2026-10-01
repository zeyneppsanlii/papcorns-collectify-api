import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { router } from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);
