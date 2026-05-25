import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE, linkKey } from "../lib/db.js";
import { generateShortCode, normalizeUrl } from "../lib/shortcode.js";

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// Auth o bai 07; tam thoi gan owner co dinh.
const OWNER = "user-001";

// POST /links { "url": "https://..." } -> ghi link moi vao DynamoDB.
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "body khong phai JSON hop le" });
  }
  const target = normalizeUrl((parsed as Record<string, unknown>).url);
  if (!target) {
    return json(400, { error: "thieu hoac sai truong 'url' (chi nhan http/https)" });
  }

  const createdAt = new Date().toISOString();

  // Sinh ma, ghi voi dieu kien PK chua ton tai. Neu trung ma (rat hiem voi
  // base62^7) thi ConditionalCheckFailed -> sinh ma khac va thu lai.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateShortCode();
    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: {
            ...linkKey(code),
            target,
            ownerId: OWNER,
            createdAt,
            clicks: 0,
            GSI1PK: `USER#${OWNER}`,
            GSI1SK: `LINK#${createdAt}`,
          },
          ConditionExpression: "attribute_not_exists(PK)",
        })
      );
      const base = `https://${event.requestContext.domainName}`;
      return json(201, { code, shortUrl: `${base}/${code}`, target });
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === "ConditionalCheckFailedException") continue; // trung ma, thu lai
      throw err;
    }
  }
  return json(500, { error: "khong sinh duoc ma duy nhat, thu lai" });
};
