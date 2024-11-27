import { initLogger } from "braintrust";

export const logger = initLogger({
  projectName: "dialogue",
  apiKey: process.env.BRAINTRUST_API_KEY,
});