import { NextResponse } from 'next/server'

const MODELS = [
  { id: 'toosii-qwen',                label: 'Toosii Qwen',        group: 'Toosii (Free)'  },
  { id: 'toosii-deepseek-v3',         label: 'Toosii DeepSeek V3', group: 'Toosii (Free)'  },
  { id: 'toosii-deepseek-r1',         label: 'Toosii DeepSeek R1', group: 'Toosii (Free)'  },
  { id: 'toosii-gemini',              label: 'Toosii Gemini',      group: 'Toosii (Free)'  },
  { id: 'llama-3.3-70b-versatile',    label: 'Llama 3.3 70B',      group: 'Groq (Free)'   },
  { id: 'llama-3.1-8b-instant',       label: 'Llama 3.1 8B',       group: 'Groq (Free)'   },
  { id: 'mixtral-8x7b-32768',         label: 'Mixtral 8x7B',       group: 'Groq (Free)'   },
  { id: 'gemma2-9b-it',               label: 'Gemma 2 9B',         group: 'Groq (Free)'   },
  { id: 'gemini-2.0-flash',           label: 'Gemini 2.0 Flash ✦', group: 'Gemini (Free)' },
  { id: 'gemini-1.5-flash',           label: 'Gemini 1.5 Flash',   group: 'Gemini (Free)' },
  { id: 'gemini-1.5-pro',             label: 'Gemini 1.5 Pro',     group: 'Gemini (Free)' },
  { id: 'grok-2-vision-1212',         label: 'Grok 2 Vision',      group: 'Grok (xAI)'    },
  { id: 'grok-3',                     label: 'Grok 3',             group: 'Grok (xAI)'    },
  { id: 'grok-3-mini',                label: 'Grok 3 Mini',        group: 'Grok (xAI)'    },
  { id: 'grok-2-latest',              label: 'Grok 2',             group: 'Grok (xAI)'    },
  { id: 'gpt-4o',                     label: 'GPT-4o',             group: 'OpenAI'        },
  { id: 'gpt-4o-mini',                label: 'GPT-4o Mini',        group: 'OpenAI'        },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet',  group: 'Anthropic'     },
  { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku',   group: 'Anthropic'     },
  { id: 'toosii-gptlogic',             label: 'Toosii Logic (Backup)', group: 'Toosii (Free)'  },
]

export async function GET() {
  return NextResponse.json({ models: MODELS }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
