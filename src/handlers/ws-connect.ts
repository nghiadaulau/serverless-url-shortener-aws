import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../lib/db.js";

// $connect: client mo WebSocket kem ?code=<code>. Luu connection vao single-table.
// GSI1 (WSCODE#<code>) cho phep aggregator tim moi connection dang nghe mot code.
export const handler = async (event: {
  requestContext: { connectionId: string };
  queryStringParameters?: { code?: string };
}) => {
  const connId = event.requestContext.connectionId;
  const code = event.queryStringParameters?.code;
  if (!code) return { statusCode: 400, body: "thieu code" };

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `CONN#${connId}`,
        SK: "META",
        code,
        GSI1PK: `WSCODE#${code}`,
        GSI1SK: `CONN#${connId}`,
        ttl: Math.floor(Date.now() / 1000) + 7200,
      },
    })
  );
  return { statusCode: 200, body: "connected" };
};
