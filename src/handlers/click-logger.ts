import type { EventBridgeEvent } from "aws-lambda";

// Consumer tam thoi cua bai 09: chi log su kien de chung minh no chay qua bus.
// Bai 10 thay bang aggregator that (idempotent + DLQ + cap nhat bo dem).
export const handler = async (
  event: EventBridgeEvent<"link.clicked", { code: string; at: string }>
): Promise<void> => {
  console.log(
    "CLICK EVENT",
    JSON.stringify({
      source: event.source,
      detailType: event["detail-type"],
      detail: event.detail,
    })
  );
};
