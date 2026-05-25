import type { SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from "aws-lambda";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../lib/db.js";

// Tieu thu su kien link.clicked tu SQS, dem click vao DynamoDB.
// - Idempotent: mot marker CLICK#<eventId> ghi kem trong CUNG transaction voi
//   viec tang bo dem; neu marker da ton tai (su kien giao trung) -> ca transaction
//   bi huy -> khong dem lai.
// - Partial batch failure: record loi tra ve trong batchItemFailures de SQS chi
//   thu lai dung record do; sau maxReceiveCount no roi vao DLQ.
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const ebEvent = JSON.parse(record.body);
      const id: string | undefined = ebEvent.id;
      const code: string | undefined = ebEvent.detail?.code;
      const at: string = ebEvent.detail?.at ?? new Date().toISOString();
      if (!id || !code) throw new Error("su kien thieu id hoac code");

      const date = at.slice(0, 10); // YYYY-MM-DD
      const ttl = Math.floor(Date.now() / 1000) + 86400; // marker tu xoa sau 24h

      try {
        await ddb.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Update: {
                  TableName: TABLE,
                  Key: { PK: `LINK#${code}`, SK: "META" },
                  UpdateExpression: "ADD clicks :one",
                  ExpressionAttributeValues: { ":one": 1 },
                },
              },
              {
                Update: {
                  TableName: TABLE,
                  Key: { PK: `LINK#${code}`, SK: `STAT#${date}` },
                  UpdateExpression: "ADD #c :one",
                  ExpressionAttributeNames: { "#c": "count" },
                  ExpressionAttributeValues: { ":one": 1 },
                },
              },
              {
                Put: {
                  TableName: TABLE,
                  Item: { PK: `CLICK#${id}`, SK: "CLICK", ttl },
                  ConditionExpression: "attribute_not_exists(PK)",
                },
              },
            ],
          })
        );
        console.log("counted", { code, id });
      } catch (e) {
        // Marker da ton tai -> transaction bi huy -> su kien trung, bo qua an toan.
        if ((e as { name?: string }).name === "TransactionCanceledException") {
          console.log("duplicate, skip", { id });
          continue;
        }
        throw e;
      }
    } catch (err) {
      console.error("FAILED record", record.messageId, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
