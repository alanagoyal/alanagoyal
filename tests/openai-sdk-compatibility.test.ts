import assert from "node:assert/strict";
import test from "node:test";
import OpenAI from "openai";
import { wrapOpenAI } from "braintrust";
import { getFunctionToolCalls } from "../lib/messages/function-tool-calls";

const respond = {
  id: "call-respond",
  type: "function" as const,
  function: { name: "respond", arguments: '{"message":"hello"}' },
};

function completion(message: Record<string, unknown>) {
  return new Response(JSON.stringify({
    id: "chat-test",
    object: "chat.completion",
    created: 0,
    model: "test-model",
    choices: [{ index: 0, message: { role: "assistant", ...message }, finish_reason: "stop" }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  }), { headers: { "content-type": "application/json" } });
}

test("Braintrust-wrapped SDK preserves function-tool chat requests and responses", async () => {
  let requests = 0;
  const client = wrapOpenAI(new OpenAI({
    apiKey: "test-braintrust-key",
    baseURL: "https://api.braintrust.dev/v1/proxy",
    maxRetries: 0,
    fetch: async (url, init) => {
      requests += 1;
      assert.equal(String(url), "https://api.braintrust.dev/v1/proxy/chat/completions");
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-braintrust-key");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "gpt-5.2");
      assert.equal(body.tool_choice, "required");
      assert.equal(body.parallel_tool_calls, false);
      assert.equal(body.tools[0].function.name, "respond");
      return completion({ content: null, tool_calls: [respond] });
    },
  }));

  const result = await client.chat.completions.create({
    model: "gpt-5.2",
    messages: [{ role: "user", content: "hello" }],
    tools: [{ type: "function", function: { name: "respond", parameters: { type: "object" } } }],
    tool_choice: "required",
    parallel_tool_calls: false,
    stream: false,
  });

  assert.equal(requests, 1);
  assert.deepEqual(getFunctionToolCalls(result.choices[0].message.tool_calls), [respond]);
});

test("SDK preserves photo categorization's multimodal Chat Completions request", async () => {
  const client = new OpenAI({
    apiKey: "test-openai-key",
    maxRetries: 0,
    fetch: async (url, init) => {
      assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "gpt-4o-mini");
      assert.equal(body.max_tokens, 20);
      assert.deepEqual(body.messages[0].content[1], {
        type: "image_url", image_url: { url: "data:image/jpeg;base64,dGVzdA==" },
      });
      return completion({ content: "flowers" });
    },
  });

  const result = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: [
      { type: "text", text: "Categorize this image." },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,dGVzdA==" } },
    ] }],
    max_tokens: 20,
  });
  assert.equal(result.choices[0].message.content, "flowers");
});

test("function-tool parsing ignores custom tools while preserving action order", () => {
  const custom = { id: "call-custom", type: "custom" as const, custom: { name: "other", input: "input" } };
  const react = { ...respond, id: "call-react", function: { name: "react", arguments: '{"reaction":"like"}' } };
  assert.deepEqual(getFunctionToolCalls([custom, react, respond]), [react, respond]);
  assert.deepEqual(getFunctionToolCalls([custom]), []);
  assert.deepEqual(getFunctionToolCalls(undefined), []);
});
