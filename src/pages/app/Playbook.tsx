import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { IconFolder, IconFile, IconChevronRight, IconX, IconPlaybook } from '../../components/icons'

interface PlaybookFolder { id: string; name: string; sort_order: number }
interface PlaybookFile   { id: string; name: string; storage_path: string; mime_type: string; sort_order: number }

export default function Playbook() {
  const [folders, setFolders]         = useState<PlaybookFolder[]>([])
  const [foldersLoading, setFoldersLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<PlaybookFolder | null>(null)
  const [files, setFiles]             = useState<PlaybookFile[]>([])
  const [signedUrls, setSignedUrls]   = useState<Record<string, string>>({})
  const [filesLoading, setFilesLoading] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('playbook_folders').select('*').order('sort_order').order('created_at')
      .then(({ data }) => { setFolders((data ?? []) as PlaybookFolder[]); setFoldersLoading(false) })
  }, [])

  const openFolder = useCallback(async (folder: PlaybookFolder) => {
    setSelectedFolder(folder); setFiles([]); setSignedUrls({}); setFilesLoading(true)
    const { data } = await supabase.from('playbook_files')
      .select('id, name, storage_path, mime_type, sort_order')
      .eq('folder_id', folder.id).order('sort_order').order('created_at')
    const rows = (data ?? []) as PlaybookFile[]
    setFiles(rows)
    if (rows.length > 0) {
      const { data: urls } = await supabase.storage.from('playbook')
        .createSignedUrls(rows.map(f => f.storage_path), 3600)
      if (urls) {
        const map: Record<string, string> = {}
        urls.forEach((u, i) => { if (u.signedUrl) map[rows[i].id] = u.signedUrl })
        setSignedUrls(map)
      }
    }
    setFilesLoading(false)
  }, [])

  const imageFiles = files.filter(f => f.mime_type !== 'application/pdf')
  const lightboxUrls = imageFiles.map(f => signedUrls[f.id]).filter(Boolean)

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? Math.min(i + 1, lightboxUrls.length - 1) : null)
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null)
      if (e.key === 'Escape')     setLightboxIdx(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIdx, lightboxUrls.length])

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">

      {/* Header */}
      <div className="mb-6">
        {selectedFolder ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedFolder(null); setFiles([]) }}
              className="font-ui text-sm font-medium text-brand hover:text-brand/80 transition-colors"
            >
              ← Back
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <h1 className="font-display text-2xl font-black text-near-black dark:text-white truncate">
              {selectedFolder.name}
            </h1>
          </div>
        ) : (
          <>
            <p className="font-ui text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-1">Browse</p>
            <h1 className="font-display text-4xl font-black text-near-black dark:text-white leading-none">Playbook.</h1>
          </>
        )}
      </div>

      {/* Folder list */}
      {!selectedFolder && (
        foldersLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-4">
              <IconPlaybook size={24} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-ui font-semibold text-near-black dark:text-gray-100">Nothing here yet</p>
            <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mt-1">Your coaches will add playbook content here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="w-full flex items-center gap-4 bg-white dark:bg-[#1C1C1E] border border-gray-100
                           dark:border-gray-800/60 rounded-2xl px-4 py-4 shadow-sm
                           hover:border-gray-200 dark:hover:border-gray-700 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <IconFolder size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-ui font-semibold text-sm text-near-black dark:text-gray-100 flex-1">
                  {folder.name}
                </span>
                <IconChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        )
      )}

      {/* File grid */}
      {selectedFolder && (
        filesLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-4">
              <IconFile size={24} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-ui font-semibold text-near-black dark:text-gray-100">No plays yet</p>
            <p className="font-ui text-sm text-gray-400 dark:text-gray-500 mt-1">Your coaches haven't added files here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {files.map(file => {
              const url = signedUrls[file.id]
              const isPdf = file.mime_type === 'application/pdf'
              const imageIdx = isPdf ? -1 : imageFiles.indexOf(file)
              return (
                <button
                  key={file.id}
                  onClick={() => { if (!url) return; isPdf ? setActivePdfUrl(url) : setLightboxIdx(imageIdx) }}
                  className="group relative bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden aspect-square
                             border border-gray-200 dark:border-gray-800/60
                             hover:border-brand/30 active:scale-[0.97] transition-all focus:outline-none"
                >
                  {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                      <IconFile size={32} className="text-gray-400 dark:text-gray-500" />
                      <p className="font-ui text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {file.name}
                      </p>
                    </div>
                  ) : url ? (
                    <img src={url} alt={file.name}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
                    </div>
                  )}
                  {!isPdf && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 pt-6 pb-2">
                      <p className="text-white text-[10px] font-medium truncate">{file.name}</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )
      )}

      {/* PDF viewer */}
      {activePdfUrl && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col pb-safe pt-safe-top">
          <div className="flex items-center justify-end px-4 py-3 shrink-0">
            <button onClick={() => setActivePdfUrl(null)}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white
                               hover:bg-white/20 transition-colors">
              <IconX size={18} />
            </button>
          </div>
          <iframe src={activePdfUrl} className="flex-1 w-full border-0" title="PDF viewer" />
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && lightboxUrls[lightboxIdx] && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
             onClick={() => setLightboxIdx(null)}>
          <img src={lightboxUrls[lightboxIdx]} alt={imageFiles[lightboxIdx]?.name}
               className="max-w-[92vw] max-h-[85vh] object-contain rounded-2xl"
               onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxIdx(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center
                             justify-center text-white hover:bg-white/20 transition-colors">
            <IconX size={18} />
          </button>
          {lightboxIdx > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! - 1) }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40
                               flex items-center justify-center text-white text-2xl hover:bg-black/60 transition-colors">
              ‹
            </button>
          )}
          {lightboxIdx < lightboxUrls.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! + 1) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40
                               flex items-center justify-center text-white text-2xl hover:bg-black/60 transition-colors">
              ›
            </button>
          )}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-ui text-white/50 text-xs">
            {lightboxIdx + 1} / {lightboxUrls.length}
          </div>
        </div>
      )}
    </div>
  )
}
