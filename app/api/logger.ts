import { initLogger } from "braintrust";

export const logger = initLogger({
  projectName: "socratichat",
  apiKey: process.env.BRAINTRUST_API_KEY,
  asyncFlush: true,
});