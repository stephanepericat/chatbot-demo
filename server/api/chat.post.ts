import { LangChainAdapter, type Message } from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

export default defineLazyEventHandler(() => {
  // fetch the OpenAI API key
  // const apiKey = useRuntimeConfig().openaiApiKey;
  // if (!apiKey) {
  //   throw createError('Missing OpenAI API key');
  // }

  // create a OpenAI LLM client
  // const llm = new ChatOpenAI({
  //   openAIApiKey: apiKey,
  //   streaming: true,
  // });

  return defineEventHandler(async (event) => {
    // const { messages } = await readBody<{ messages: Message[] }>(event);
    const { question, model, temperature, thread } = await readBody(event)
    console.log({ question, model, temperature, thread })
    return { ok: true }

    // const { stream, handlers } = LangChainStream();
    // llm
    //   .invoke(
    //     (messages as Message[]).map((message) =>
    //       message.role === 'user' ? new HumanMessage(message.content) : new AIMessage(message.content)
    //     ),
    //     { callbacks: [handlers] }
    //   )
    //   .catch(console.error);
    // return new StreamingTextResponse(stream);

  });
});