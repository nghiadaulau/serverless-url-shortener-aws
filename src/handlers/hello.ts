import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const now = new Date().toISOString();
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "Hello from a serverless URL shortener",
      path: event.rawPath,
      time: now,
    }),
  };
};
