import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { QueryCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE, linkKey } from "./db.js";

const endpoint = process.env.WS_ENDPOINT;
const mgmt = endpoint ? new ApiGatewayManagementApiClient({ endpoint }) : null;

// Day so click moi xuong moi connection dang nghe code nay (qua GSI1 WSCODE#<code>).
// Connection da dong (GoneException 410) thi don luon.
export async function pushClickUpdate(code: string): Promise<void> {
  if (!mgmt) return;

  const meta = await ddb.send(new GetCommand({ TableName: TABLE, Key: linkKey(code) }));
  const clicks = (meta.Item?.clicks as number) ?? 0;

  const conns = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :p",
      ExpressionAttributeValues: { ":p": `WSCODE#${code}` },
    })
  );

  const data = Buffer.from(JSON.stringify({ code, clicks }));
  await Promise.all(
    (conns.Items ?? []).map(async (c) => {
      const connId = (c.GSI1SK as string).replace("CONN#", "");
      try {
        await mgmt.send(new PostToConnectionCommand({ ConnectionId: connId, Data: data }));
      } catch (e) {
        const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) {
          await ddb.send(
            new DeleteCommand({ TableName: TABLE, Key: { PK: `CONN#${connId}`, SK: "META" } })
          );
        }
      }
    })
  );
}
