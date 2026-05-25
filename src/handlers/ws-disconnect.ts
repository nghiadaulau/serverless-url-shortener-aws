import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../lib/db.js";

// $disconnect: xoa connection. Chi co connectionId, nen luu theo PK=CONN#<id>.
export const handler = async (event: {
  requestContext: { connectionId: string };
}) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: `CONN#${event.requestContext.connectionId}`, SK: "META" },
    })
  );
  return { statusCode: 200, body: "disconnected" };
};
