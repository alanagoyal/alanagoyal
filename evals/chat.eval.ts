import { Eval, type EvalScorer, wrapOpenAI } from "braintrust";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { buildGroupPrompt, buildGroupTools } from "../lib/messages/group-chat-model";
import {
  formatConversationReversed,
  getConversationState,
} from "../lib/messages/temporal-context";
import type { Message, Recipient } from "../types/messages";

dotenv.config({ path: ".env.local" });

type GroupChatActionName = "react" | "respond" | "wait" | "wrap_up";

interface GroupChatAction {
  action: GroupChatActionName;
  participant?: string;
  reaction?: string;
  message?: string;
  messages?: string[];
}

interface EvalParticipant extends Recipient {
  description: string;
}

interface GroupChatEvalInput {
  caseId: string;
  participants: EvalParticipant[];
  messages: Message[];
}

interface GroupChatExpected {
  requiredAction: GroupChatActionName;
  allowedActions: GroupChatActionName[];
  participant?: string;
}

interface GroupChatEvalOutput {
  actions: GroupChatAction[];
  state: ReturnType<typeof getConversationState>;
}

const MODEL = "gpt-5.2";
const API_BASE_URL = "https://api.braintrust.dev/v1/proxy";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.BRAINTRUST_API_KEY) {
    throw new Error("BRAINTRUST_API_KEY is required to run chat evals");
  }

  if (!client) {
    client = wrapOpenAI(
      new OpenAI({
        baseURL: API_BASE_URL,
        apiKey: process.env.BRAINTRUST_API_KEY,
        timeout: 12000,
        maxRetries: 0,
      })
    ) as unknown as OpenAI;
  }

  return client;
}

function minutesAgo(minutes: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

function parseToolCallArguments(
  rawArguments: string | undefined
): Record<string, unknown> {
  if (!rawArguments) return {};

  try {
    const parsed = JSON.parse(rawArguments);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCount(value: string): number {
  const matches = value.match(/[.!?]+/g);
  if (!matches) {
    return value.trim().length > 0 ? 1 : 0;
  }
  return matches.length;
}

function extractGeneratedTexts(actions: GroupChatAction[]): string[] {
  return actions.flatMap((action) => {
    if (action.action === "respond") {
      return (action.messages ?? []).filter(
        (message): message is string => typeof message === "string"
      );
    }

    if (action.action === "wrap_up" && typeof action.message === "string") {
      return [action.message];
    }

    return [];
  });
}

function findPrimaryAction(
  actions: GroupChatAction[],
  actionName: GroupChatActionName
): GroupChatAction | undefined {
  return actions.find((action) => action.action === actionName);
}

function parseActions(toolCalls: ChatCompletionMessageToolCall[] | undefined): GroupChatAction[] {
  if (!toolCalls?.length) return [];

  return toolCalls.map((toolCall) => {
    const args = parseToolCallArguments(toolCall.function.arguments);
    return {
      action: toolCall.function.name as GroupChatActionName,
      participant:
        typeof args.participant === "string" ? args.participant : undefined,
      reaction: typeof args.reaction === "string" ? args.reaction : undefined,
      message: typeof args.message === "string" ? args.message : undefined,
      messages: Array.isArray(args.messages)
        ? args.messages.filter(
            (message): message is string =>
              typeof message === "string" && message.trim().length > 0
          )
        : undefined,
    };
  });
}

function buildParticipantDescriptions(participants: EvalParticipant[]): string {
  return participants
    .map(
      (participant) => `- ${participant.name}: ${participant.description}`
    )
    .join("\n");
}

const participants = {
  guillermo: {
    id: "guillermo-rauch",
    name: "Guillermo Rauch",
    description:
      "You are Guillermo Rauch, a technical founder. Communicate with deep technical knowledge and entrepreneurial vision. Your style combines technical precision with a bit of fun trolling every now and then.",
  },
  paul: {
    id: "paul-copplestone",
    name: "Paul Copplestone",
    description:
      "You are Paul Copplestone the founder of Supabase. You are casual and love talking technical topics and memes.",
  },
} satisfies Record<string, EvalParticipant>;

const cases: Array<{ input: GroupChatEvalInput; expected: GroupChatExpected }> = [
  {
    input: {
      caseId: "direct-question-routes-to-guillermo",
      participants: [participants.guillermo, participants.paul],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "what products have you guys enjoyed using lately?",
          timestamp: minutesAgo(12),
        },
        {
          id: "m2",
          sender: "Guillermo Rauch",
          content: "container queries changed everything tbh",
          timestamp: minutesAgo(11),
        },
        {
          id: "m3",
          sender: "Paul Copplestone",
          content: "htmx is fun if you don't take it too seriously",
          timestamp: minutesAgo(10),
        },
        {
          id: "m4",
          sender: "me",
          content: "guillermo what's actually underrated on the web platform right now?",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "respond",
      allowedActions: ["respond", "react"],
      participant: "Guillermo Rauch",
    },
  },
  {
    input: {
      caseId: "participant-question-does-not-wait",
      participants: [participants.guillermo, participants.paul],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "what gets harder as infra products scale?",
          timestamp: minutesAgo(14),
        },
        {
          id: "m2",
          sender: "Paul Copplestone",
          content: "support and docs start becoming part of the product surface",
          timestamp: minutesAgo(13),
        },
        {
          id: "m3",
          sender: "Guillermo Rauch",
          content: "paul where do you think teams overcomplicate postgres the most?",
          timestamp: minutesAgo(2),
        },
      ],
    },
    expected: {
      requiredAction: "respond",
      allowedActions: ["respond", "react"],
      participant: "Paul Copplestone",
    },
  },
  {
    input: {
      caseId: "wait-when-human-needs-to-answer",
      participants: [participants.guillermo, participants.paul],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "thinking of rebuilding messages with realtime later",
          timestamp: minutesAgo(8),
        },
        {
          id: "m2",
          sender: "Paul Copplestone",
          content: "could be fun",
          timestamp: minutesAgo(7),
        },
        {
          id: "m3",
          sender: "Guillermo Rauch",
          content: "what stack are you leaning toward for it?",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "wait",
      allowedActions: ["wait"],
    },
  },
  {
    input: {
      caseId: "wrap-up-after-three-ai-messages",
      participants: [participants.guillermo, participants.paul],
      messages: [
        {
          id: "m1",
          sender: "me",
          content: "what should i prototype first?",
          timestamp: minutesAgo(9),
        },
        {
          id: "m2",
          sender: "Paul Copplestone",
          content: "make the scrappiest version you can ship tonight",
          timestamp: minutesAgo(8),
        },
        {
          id: "m3",
          sender: "Guillermo Rauch",
          content: "ship the interface before polishing the backend",
          timestamp: minutesAgo(7),
        },
        {
          id: "m4",
          sender: "Paul Copplestone",
          content: "and instrument it from day one so you see the failures fast",
          timestamp: minutesAgo(1),
        },
      ],
    },
    expected: {
      requiredAction: "wrap_up",
      allowedActions: ["wrap_up"],
      participant: "Guillermo Rauch",
    },
  },
];

const requiredActionScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output, expected }) => ({
  name: "required_action",
  score: output.actions.some(
    (action) => action.action === expected.requiredAction
  )
    ? 1
    : 0,
  metadata: {
    requiredAction: expected.requiredAction,
    actions: output.actions.map((action) => action.action),
  },
});

const allowedActionsScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output, expected }) => ({
  name: "allowed_actions_only",
  score:
    output.actions.length > 0 &&
    output.actions.every((action) =>
      expected.allowedActions.includes(action.action)
    )
      ? 1
      : 0,
  metadata: {
    allowedActions: expected.allowedActions,
    actions: output.actions.map((action) => action.action),
  },
});

const participantScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output, expected }) => {
  if (!expected.participant) {
    return { name: "expected_participant", score: 1 };
  }

  const action = findPrimaryAction(output.actions, expected.requiredAction);

  return {
    name: "expected_participant",
    score: action?.participant === expected.participant ? 1 : 0,
    metadata: {
      expectedParticipant: expected.participant,
      actualParticipant: action?.participant ?? null,
    },
  };
};

const schemaScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output }) => {
  const valid = output.actions.length > 0 && output.actions.every((action) => {
    if (action.action === "wait") return true;
    if (action.action === "react") {
      return Boolean(action.participant && action.reaction);
    }
    if (action.action === "respond") {
      return Boolean(
        action.participant &&
          action.messages &&
          action.messages.length >= 1 &&
          action.messages.every((message) => message.trim().length > 0)
      );
    }
    return Boolean(action.participant && action.message?.trim().length);
  });

  return {
    name: "schema_valid",
    score: valid ? 1 : 0,
  };
};

const noRepeatSpeakerScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output }) => {
  const lastSpeaker = output.state.lastSpeaker;
  const repeatedSpeaker =
    lastSpeaker && lastSpeaker !== "me"
      ? output.actions.some((action) => action.participant === lastSpeaker)
      : false;

  return {
    name: "no_same_speaker_twice",
    score: repeatedSpeaker ? 0 : 1,
    metadata: {
      lastSpeaker,
      participants: output.actions
        .map((action) => action.participant)
        .filter((participant): participant is string => Boolean(participant)),
    },
  };
};

const noRepeatedTextScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ input, output }) => {
  const priorTexts = new Set(
    input.messages
      .filter((message) => message.sender !== "system")
      .map((message) => normalizeText(message.content))
      .filter((message) => message.length > 0)
  );

  const generatedTexts = extractGeneratedTexts(output.actions).map(normalizeText);
  const repeats = generatedTexts.filter((text) => priorTexts.has(text));

  return {
    name: "no_direct_repetition",
    score: repeats.length === 0 ? 1 : 0,
    metadata: {
      repeats,
    },
  };
};

const brevityScore: EvalScorer<
  GroupChatEvalInput,
  GroupChatEvalOutput,
  GroupChatExpected
> = ({ output }) => {
  const generatedTexts = extractGeneratedTexts(output.actions);
  const valid = generatedTexts.every((text) => {
    const trimmed = text.trim();
    return (
      trimmed.length > 0 &&
      trimmed.length <= 160 &&
      sentenceCount(trimmed) <= 2
    );
  });

  return {
    name: "brief_texting_style",
    score: valid ? 1 : 0,
    metadata: {
      texts: generatedTexts,
    },
  };
};

Eval("messages-group-chat", {
  data: cases,
  maxConcurrency: 1,
  metadata: {
    app: "messages",
    surface: "group-chat",
    model: MODEL,
  },
  task: async (input, hooks) => {
    const state = getConversationState(input.messages);
    const conversationReversed = formatConversationReversed(input.messages);
    const prompt = buildGroupPrompt(
      input.participants,
      buildParticipantDescriptions(input.participants),
      conversationReversed,
      state
    );
    const tools = buildGroupTools(
      input.participants.map((participant) => participant.name),
      state.lastSpeaker
    );

    hooks.meta({
      caseId: input.caseId,
      lastSpeaker: state.lastSpeaker,
      messagesSinceHuman: state.messagesSinceHuman,
    });

    const response = await getClient().chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: prompt }],
      tool_choice: "required",
      tools,
      stream: false,
      parallel_tool_calls: false,
      temperature: 0.7,
      max_tokens: 300,
    });

    return {
      actions: parseActions(response.choices[0]?.message?.tool_calls),
      state,
    };
  },
  scores: [
    requiredActionScore,
    allowedActionsScore,
    participantScore,
    schemaScore,
    noRepeatSpeakerScore,
    noRepeatedTextScore,
    brevityScore,
  ],
});
