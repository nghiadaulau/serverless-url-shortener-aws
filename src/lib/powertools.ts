import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";

// Dung chung cho moi handler. serviceName/namespace xuat hien trong log, trace, metric.
export const logger = new Logger({ serviceName: "url-shortener" });
export const tracer = new Tracer({ serviceName: "url-shortener" });
export const metrics = new Metrics({
  namespace: "UrlShortener",
  serviceName: "url-shortener",
});
