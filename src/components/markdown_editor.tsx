import React, { useEffect, useState } from 'react'

import { NoteFormData } from '@/types'
import PlaygroundApp from './lexical_playground/App'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import './lexical_playground/index.css'
import './lexical_playground/theme_overrides.css'

interface MarkDownEditorProps {
  value: string
  setData: React.Dispatch<React.SetStateAction<NoteFormData>>
}

function LexicalHTMLUpdater({ value, onChange }: { value: string, onChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender && value) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        // We cannot just insert nodes directly into root, need to do it carefully
        // or just let PlaygroundApp handle its prepopulated state if value is empty.
      });
      setIsFirstRender(false);
    }
  }, [editor, isFirstRender, value]);

  return (
    <OnChangePlugin onChange={(editorState) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        onChange(html);
      });
    }} />
  );
}

export default function MarkDownEditor({ value, setData }: MarkDownEditorProps) {
  // We wrap the PlaygroundApp and provide an OnChangePlugin from inside it
  // Wait, PlaygroundApp encapsulates the LexicalComposer, so we cannot easily add OnChangePlugin *outside* of it.
  // We should modify PlaygroundApp or App.tsx in lexical_playground to accept value and onChange.

  return (
    <div
      className='border w-full overflow-hidden border border-slate6 focus:bg-slate4 focus:ring-0 rounded-lg focus-within:border-slate9 min-h-40'
    >
      <PlaygroundApp />
    </div>
  )
}
