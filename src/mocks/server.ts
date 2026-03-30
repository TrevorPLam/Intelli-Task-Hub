import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),

  http.get("/api/openai/conversations", () => {
    return HttpResponse.json([
      { id: 1, title: "Test Conversation", createdAt: new Date().toISOString() },
    ]);
  }),

  http.post("/api/openai/conversations/:id/messages", async ({ request }) => {
    const body = (await request.json()) as { content: string };
    return HttpResponse.json({
      id: Math.random().toString(36),
      role: "assistant",
      content: `Mock response to: ${body.content}`,
      createdAt: new Date().toISOString(),
    });
  }),
];

export const server = setupServer(...handlers);
