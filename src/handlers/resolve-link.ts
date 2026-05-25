import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

// GET /{code}  ->  301 chuyen huong toi URL goc.
// Bai 03: chua tra cuu DB (bai 06). O day minh hoa lay path param va tra ve 301
// kem header Location. Target tam thoi la mot URL demo dua tren code.
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const code = event.pathParameters?.code;
  if (!code) {
    return { statusCode: 400, body: "thieu code" };
  }

  // Tam thoi: chua co kho luu, tra ve mot dia chi demo de thay co che 301.
  const target = `https://example.com/demo-target-for/${code}`;

  return {
    statusCode: 301,
    headers: { location: target },
    body: "",
  };
};
