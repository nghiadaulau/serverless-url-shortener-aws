import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE, linkKey } from "../lib/db.js";

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// DELETE /links/{code} -> chi xoa duoc link CUA MINH.
// ConditionExpression kiem quyen so huu ngay trong thao tac xoa, tranh IDOR.
export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const owner = event.requestContext.authorizer?.jwt?.claims?.sub as string;
  const code = event.pathParameters?.code;
  if (!owner) return json(401, { error: "thieu danh tinh nguoi dung" });
  if (!code) return json(400, { error: "thieu code" });

  try {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: linkKey(code),
        ConditionExpression: "attribute_exists(PK) AND ownerId = :me",
        ExpressionAttributeValues: { ":me": owner },
      })
    );
    return json(200, { deleted: code });
  } catch (err) {
    // Khong ton tai HOAC khong thuoc ve minh -> deu tra 404 de khong lo su ton tai.
    if ((err as { name?: string }).name === "ConditionalCheckFailedException") {
      return json(404, { error: "link khong ton tai hoac khong thuoc ve ban" });
    }
    throw err;
  }
};
