<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import type { SelectItem } from '@nuxt/ui'

const { messages, input, handleSubmit } = useChat()

const llms = ref<SelectItem[]>([
  {type: 'label', label: 'AI Model'},
  {label: 'Deepseek/Deepseek R1', value: 'deepseek/deepseek-r1:free', selected: true },
  {label: 'Deepseek/Deepseek V3', value: 'deepseek/deepseek-chat:free' },
  {label: 'Qwen/QWQ 32b', value: 'qwen/qwq-32b:free' },
  {label: 'Qwen/Qwen 2.5 72b instruct', value: 'qwen/qwen-2.5-72b-instruct:free' },
  {label: 'Qwen/Qwen VL 72b instruct', value: 'qwen/qwen2.5-vl-72b-instruct:free' },
  {label: 'OpenRouter/Quasar alpha', value: 'openrouter/quasar-alpha' },
  {label: 'MistralAI/Mistral 3.1 small', value: 'meta-llama/llama-4-maverick:free' },
  {label: 'Meta/Llama 4.0 maverick', value: 'meta-llama/llama-4-maverick:free' },
  {label: 'Meta/Llama 3.3 70b instruct', value: 'meta-llama/llama-3.3-70b-instruct:free' },
  {label: 'Microsoft/Phi3 medium', value: 'microsoft/phi-3-medium-128k-instruct:free' },
])

const temps = ref<SelectItem[]>([{type: 'label', label: 'Temperature'}, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0])

const model = ref('deepseek/deepseek-r1:free')
const temperature = ref(0.5)

const loading = ref(false)

const thread = ref(crypto.randomUUID())

const onSubmit = async (e: Event) => {
  e.preventDefault()

  try {
    handleSubmit(e, {
      body: {
        model: model.value,
        temperature: temperature.value,
        thread: thread.value
      }
    })
  } catch(e) {
    console.error(e)
  }
}

watch(messages, () => {
  if(!messages.value.length) {
    return
  }

  loading.value = messages.value[messages.value.length -1].role === 'user'
})
</script>

<template>
  <div class="mx-auto py-8 px-4 max-w-[48rem] h-[100vh]">
    <div class="flex flex-col h-full gap-8">
      <div class="grow-1 overflow-auto">
        <div v-for="message in messages" :key="message.id" :class="message.role">{{ message.content }}</div>
        <ThinkLoader v-if="loading" />
      </div>
      <div class="shrink-0 min-h-[150px]">
        <form class="w-full" @submit="onSubmit">
          <div class="w-full flex gap-4 items-center">
            <UTextarea v-model="input" class="grow-1" :maxrows="4" autoresize color="neutral" variant="subtle" placeholder="Ask a question about covid-19..." />
            <UButton type="submit" class="shrink-0 hover:cursor-pointer">Send</UButton>
          </div>
          <div class="mt-4 w-full flex justify-between">
            <USelect v-model="model" class="w-1/3" :items="llms" placeholder="Choose a LLM..." />
            <USelect v-model="temperature" class="w-1/3" :items="temps" placeholder="Choose a temperature..." />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>