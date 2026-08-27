import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kreia/jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleKreiaJobsRequest } = await import("@/lib/kreia/jobs-http");
        return handleKreiaJobsRequest(request);
      },
      POST: async ({ request }) => {
        const { handleKreiaJobsRequest } = await import("@/lib/kreia/jobs-http");
        return handleKreiaJobsRequest(request);
      },
      OPTIONS: async ({ request }) => {
        const { handleKreiaJobsRequest } = await import("@/lib/kreia/jobs-http");
        return handleKreiaJobsRequest(request);
      },
    },
  },
});
