import { initLogger } from "braintrust";

// Check if BRAINTRUST_API_KEY is non-empty
export const logger = process.env.BRAINTRUST_API_KEY?.trim()
  ? initLogger({
      projectName: "messages",
      apiKey: process.env.BRAINTRUST_API_KEY,
    })
  : {
      // Fallback logger with no-op methods
      log: () => {},
      warn: () => {},
      error: () => {},
    };
