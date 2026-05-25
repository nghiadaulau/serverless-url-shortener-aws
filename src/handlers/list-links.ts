import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../lib/db.js";

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// GET /links -> liet ke link cua DUNG nguoi dang dang nhap (qua GSI1, sap moi-nhat-truoc).
export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const owner = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  if (!owner) return json(401, { error: "thieu danh tinh nguoi dung" });

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :u",
      ExpressionAttributeValues: { ":u": `USER#${owner}` },
      ScanIndexForward: false,
    })
  );

  const links = (res.Items ?? []).map((i) => ({
    code: (i.PK as string).replace("LINK#", ""),
    target: i.target,
    clicks: i.clicks,
    createdAt: i.createdAt,
  }));
  return json(200, { links });
};
