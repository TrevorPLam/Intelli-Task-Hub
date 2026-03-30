import { Router, type IRouter } from "express";
import { generalLimiter, openaiLimiter } from "../middlewares/rateLimiter";
import healthRouter from "./health";
import openaiRouter from "./openai";

const router: IRouter = Router();

// Apply general rate limiter to all routes
router.use(generalLimiter);

router.use(healthRouter);
router.use("/openai", openaiLimiter, openaiRouter);

export default router;
