import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE, linkKey } from "../lib/db.js";

// GET /{code} -> tra cuu DynamoDB, 301 toi target, dem click bang atomic counter.
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const code = event.pathParameters?.code;
  if (!code) return { statusCode: 400, body: "thieu code" };

  const res = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: linkKey(code) })
  );
  if (!res.Item) {
    return { statusCode: 404, headers: { "content-type": "text/plain" }, body: "khong tim thay link" };
  }
  const target = res.Item.target as string;

  // Atomic counter: ADD cong tai server, an toan khi nhieu luot mo dong thoi
  // (khong doc-roi-ghi). Khong await ket qua dem de tra redirect nhanh,
  // nhung van phai cho lenh gui xong truoc khi handler ket thuc.
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: linkKey(code),
      UpdateExpression: "ADD clicks :one",
      ExpressionAttributeValues: { ":one": 1 },
    })
  );

  return { statusCode: 301, headers: { location: target }, body: "" };
};
