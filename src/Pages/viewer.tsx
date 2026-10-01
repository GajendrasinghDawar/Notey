import { useState, useCallback, useRef, useEffect } from 'react'
import PlaygroundApp from '@/components/lexical_playground/App'
import '@/components/lexical_playground/index.css'
import '@/components/lexical_playground/theme_overrides.css'
import MarkdownRenderer from '@/components/viewer/markdown_renderer'
import FileDropZone from '@/components/viewer/file_drop_zone'
import ViewerToolbar from '@/components/viewer/viewer_toolbar'
import RecentFiles from '@/components/viewer/recent_files'
import { useFileHandler } from '@/hooks/use_file_handler'
import { useFileLauncher } from '@/hooks/use_file_launcher'



/**
 * Try to read the shared file from the SW cache, retrying a few times
 * because the SW redirect may land before the cache write finishes.
 */
async function readSharedFileFromCache(retries = 3, delay = 150): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const cache = await caches.open('share-target-cache')
      const response = await cache.match('/shared-file')
      if (response) {
        const text = await response.text()
        await cache.delete('/shared-file')
        return text
      }
    } catch (err) {
      console.error('Failed to read shared file from cache:', err)
    }
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, delay))
    }
  }
  return null
}

export default function MarkdownViewer() {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const {
    file,
    isDirty,
    openFile,
    openFolder,
    saveFile,
    saveFileAs,
    updateContent,
    readFileHandle,
    loadReadOnlyFile,
    openRelativeFile,
  } = useFileHandler()

  // Launch Queue: OS opens a .md file with this app
  useFileLauncher(
    useCallback(
      handle => {
        readFileHandle(handle)
      },
      [readFileHandle]
    )
  )

  // Check URL for share target POST (file shared from Android)
  useEffect(() => {
    const url = new URL(window.location.href)

    if (url.searchParams.get('shared') === 'true') {
      ;(async () => {
        const text = await readSharedFileFromCache()
        if (text) {
          loadReadOnlyFile('shared.md', text)
        }
        window.history.replaceState({}, '', '/viewer')
      })()
      return
    }

    // Fallback: content passed via URL params (e.g. Web Share Target text)
    const sharedContent = url.searchParams.get('content')
    if (sharedContent) {
      loadReadOnlyFile('shared.md', decodeURIComponent(sharedContent))
      window.history.replaceState({}, '', '/viewer')
    }
  }, [loadReadOnlyFile])

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === 'view' ? 'edit' : 'view'))
  }, [])

  const handleSave = useCallback(() => {
    saveFile(file.content)
  }, [file.content, saveFile])

  const handleSaveAs = useCallback(() => {
    saveFileAs(file.content)
  }, [file.content, saveFileAs])

  const canSaveBack = file.handle !== null

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (canSaveBack) {
          handleSave()
        } else {
          handleSaveAs()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canSaveBack, handleSave, handleSaveAs])

  return (
    <FileDropZone onFileHandleDrop={readFileHandle} onReadOnlyDrop={loadReadOnlyFile}>
      <div className='flex flex-col min-h-[calc(100vh-64px)]'>
        <ViewerToolbar
          fileName={file.fileName}
          mode={mode}
          isDirty={isDirty}
          hasFile={!!file.content}
          canSaveBack={canSaveBack}
          hasDirHandle={!!file.dirHandle}
          onOpenFile={openFile}
          onOpenFolder={openFolder}
          onToggleMode={toggleMode}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          rawMarkdown={file.content}
        />

        <div className='flex-1 px-4 py-6'>
          {!file.content ? (
            <EmptyState
              onOpenFile={openFile}
              onOpenHandle={readFileHandle}
              onOpenReadOnly={loadReadOnlyFile}
            />
          ) : mode === 'view' ? (
            <MarkdownRenderer content={file.content} onOpenRelativeMd={openRelativeFile} />
          ) : (
            <div className='border border-slate6 rounded-lg overflow-hidden focus-within:border-slate9'>
              <PlaygroundApp
                value={file.content}
                onChangeMarkdown={(md) => {
                  updateContent(md)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </FileDropZone>
  )
}

function EmptyState({
  onOpenFile,
  onOpenHandle,
  onOpenReadOnly,
}: {
  onOpenFile: () => void
  onOpenHandle: (handle: FileSystemFileHandle) => void
  onOpenReadOnly: (name: string, content: string) => void
}) {
  return (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <h2 className='text-xl font-semibold text-slate12 mb-2'>Markdown Viewer</h2>
      <p className='text-sm text-slate10 mb-6 max-w-80'>
        Open a .md file to view or edit it. You can also drag & drop a file here, or open one from
        your file manager.
      </p>
      <button
        onClick={onOpenFile}
        className='px-5 py-2 text-sm font-medium rounded-lg bg-crimson9 text-slate1 hover:bg-crimson10 transition-colors shadow-2'
      >
        Open a Markdown file
      </button>

      <RecentFiles onOpenHandle={onOpenHandle} onOpenReadOnly={onOpenReadOnly} />
    </div>
  )
}
