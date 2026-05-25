import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { generateShortCode, normalizeUrl } from "../lib/shortcode.js";

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// POST /links  { "url": "https://..." }  ->  { code, shortUrl, target }
// Bai 03: chua luu tru (persistence o bai 04). O day chi lo phan API: doc body,
// validate, sinh ma, tra ve.
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

  const code = generateShortCode();
  const base = `https://${event.requestContext.domainName}`;
  return json(201, { code, shortUrl: `${base}/${code}`, target });
};
