import { Router, type IRouter } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { parseBody } from "../../lib/validate";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  const bodyResult = parseBody(GenerateOpenaiImageBody, req.body);
  if (!bodyResult.success) {
    res.status(400).json(bodyResult.error);
    return;
  }
  const { prompt, size } = bodyResult.data;
  const imageSize = size ?? "1024x1024";
  const buffer = await generateImageBuffer(prompt, imageSize);
  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
