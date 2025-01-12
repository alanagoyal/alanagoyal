import { Eval, initDataset } from "braintrust";
import { LLMClassifierFromTemplate } from "autoevals";

const noRepeat = LLMClassifierFromTemplate({
  name: "No repetition",
  promptTemplate: "Is this chat conversation repetetive? (Y/N)\n\n{{output}}",
  choiceScores: { Y: 0, N: 1 },
  useCoT: true,
});

Eval("dialogue", {
  data: initDataset("dialogue", { dataset: "conversations" }),
  task: (input) => {
    return JSON.stringify(input);
  },
  scores: [noRepeat],
});
