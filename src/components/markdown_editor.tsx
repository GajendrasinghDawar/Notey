import React from 'react'

import { NoteFormData } from '@/types'
import PlaygroundApp from './lexical_playground/App'
import './lexical_playground/index.css'
import './lexical_playground/theme_overrides.css'

interface MarkDownEditorProps {
  value: string
  setData: React.Dispatch<React.SetStateAction<NoteFormData>>
}

export default function MarkDownEditor({ value, setData }: MarkDownEditorProps) {
  return (
    <div
      className='border w-full overflow-hidden border border-slate6 focus:bg-slate4 focus:ring-0 rounded-lg focus-within:border-slate9 min-h-40'
    >
      <PlaygroundApp 
        value={value} 
        onChangeMarkdown={(md) => setData(prev => ({ ...prev, content: md }))} 
      />
    </div>
  )
}
