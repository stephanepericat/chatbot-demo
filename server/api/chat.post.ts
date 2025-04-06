import { LangChainAdapter, type Message } from 'ai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { Annotation, StateGraph } from '@langchain/langgraph'
import type { Document } from "@langchain/core/documents";
import { pull } from 'langchain/hub'
import { QdrantVectorStore } from '@langchain/qdrant'
// import { AIMessage, HumanMessage } from '@langchain/core/messages';

const collectionName = process.env.QDRANT_COLLECTION

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBED_MODEL,
  apiKey: process.env.EMBED_API_KEY,
  dimensions: 1024,
  configuration: {
    baseURL: process.env.EMBED_BASE_URL,
  },
})

export default defineLazyEventHandler(() => {

  return defineEventHandler(async (event) => {
    const { messages, model, temperature, thread } = await readBody<{
      messages: Message[]
      model: string,
      temperature: number,
      thread: string
    }>(event)

    const question = messages[messages.length -1].content

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      apiKey: process.env.QDRANT_KEY,
      url: process.env.QDRANT_URL,
      collectionName,
    })
    
    const template = await pull('tcl-chatbot')
    
    // @ts-expect-error type issue
    const promptTemplate = ChatPromptTemplate.fromMessages(template.promptMessages)

    const llm = new ChatOpenAI({
      model: model || 'deepseek/deepseek-r1:free',
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: temperature || 0.5,
      configuration: {
        baseURL: process.env.OPENROUTER_BASE_URL,
      },
      streaming: true,
    })

    const retrieve = async ({ question }: typeof InputStateAnnotation.State) => {
      const context = await vectorStore.similaritySearch(
        question,
        parseInt(process.env.QDRANT_SEARCH_LIMIT!),
      )
    
      return { context }
    }
    
    const generate = async (state: typeof StateAnnotation.State) => {
      const docsContent = state.context.map((doc) => doc.pageContent).join('\n')
      const messages = await promptTemplate.invoke({
        question: state.question,
        context: docsContent,
      })
      const response = await llm.invoke(messages)
      return { answer: response.content }
    }
    
    const graph = new StateGraph(StateAnnotation)
      .addNode('retrieve', retrieve)
      .addNode('generate', generate)
      .addEdge('__start__', 'retrieve')
      .addEdge('retrieve', 'generate')
      .addEdge('generate', '__end__')
      .compile()

    const stream = await graph.stream({ question }, { streamMode: 'messages', configurable: { thread_id: thread } })
    const transformStream = new ReadableStream({
      async start(controller) {
        for await (const [message, _metadata] of stream) {
          controller.enqueue(message.content)
        }
        controller.close();
      }
    });

    return LangChainAdapter.toDataStreamResponse(transformStream)
  })
})