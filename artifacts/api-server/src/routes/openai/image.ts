import { Router, type IRouter } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  const body = GenerateOpenaiImageBody.parse(req.body);
  const size = (body.size ?? "1024x1024") as "1024x1024" | "512x512" | "256x256";
  const buffer = await generateImageBuffer(body.prompt, size);
  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
