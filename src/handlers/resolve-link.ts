import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import middy from "@middy/core";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { logMetrics } from "@aws-lambda-powertools/metrics/middleware";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { ddb, TABLE, linkKey } from "../lib/db.js";
import { logger, tracer, metrics } from "../lib/powertools.js";

const eb = tracer.captureAWSv3Client(new EventBridgeClient({}));
const BUS = process.env.EVENT_BUS ?? "default";

const lambdaHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const code = event.pathParameters?.code;
  if (!code) return { statusCode: 400, body: "thieu code" };

  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: linkKey(code) }));
  if (!res.Item) {
    logger.warn("link not found", { code });
    metrics.addMetric("LinkNotFound", MetricUnit.Count, 1);
    return { statusCode: 404, headers: { "content-type": "text/plain" }, body: "khong tim thay link" };
  }

  await eb.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: BUS,
          Source: "urlshortener",
          DetailType: "link.clicked",
          Detail: JSON.stringify({ code, at: new Date().toISOString() }),
        },
      ],
    })
  );

  logger.info("link resolved", { code });
  metrics.addMetric("LinkResolved", MetricUnit.Count, 1);
  return { statusCode: 301, headers: { location: res.Item.target as string }, body: "" };
};

// Middy ghep cac middleware Powertools: trace handler (X-Ray), gan context vao log,
// va day metric (EMF) khi handler ket thuc.
export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { logEvent: false }))
  .use(logMetrics(metrics));
