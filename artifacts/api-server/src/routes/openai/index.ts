import { Router, type IRouter } from "express";
import conversationsRouter from "./conversations";
import imageRouter from "./image";

const router: IRouter = Router();

router.use("/conversations", conversationsRouter);
router.use("/generate-image", imageRouter);

export default router;
