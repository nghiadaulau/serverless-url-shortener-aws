import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { ddb, TABLE, linkKey } from "../lib/db.js";

const eb = new EventBridgeClient({});
const BUS = process.env.EVENT_BUS ?? "default";

// GET /{code} -> tra cuu DynamoDB, 301 toi target, va PHAT su kien "link.clicked".
// Tu bai 09: viec dem click tach khoi duong chuyen huong. Resolve chi tra cuu +
// phat su kien; consumer (bai 10) moi cap nhat bo dem. Nho vay duong nong nhe hon.
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const code = event.pathParameters?.code;
  if (!code) return { statusCode: 400, body: "thieu code" };

  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: linkKey(code) }));
  if (!res.Item) {
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

  return { statusCode: 301, headers: { location: res.Item.target as string }, body: "" };
};
