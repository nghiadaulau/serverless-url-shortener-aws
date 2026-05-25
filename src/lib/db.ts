import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { tracer } from "./powertools.js";

// Tao client o tang module (static init): chay mot lan moi moi truong, tai dung
// qua cac invoke warm. Xem bai 02 ve vong doi execution environment.
// captureAWSv3Client: moi loi goi DynamoDB hien thanh subsegment trong X-Ray.
const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE = process.env.TABLE_NAME ?? "url-shortener";

// Khoa cua mot link trong single-table.
export const linkKey = (code: string) => ({ PK: `LINK#${code}`, SK: "META" });
