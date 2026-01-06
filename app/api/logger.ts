import { initLogger } from "braintrust";

export const logger = initLogger({
  projectName: "messages",
  apiKey: process.env.BRAINTRUST_API_KEY,
});