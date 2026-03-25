import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface PlaybookFolder {
  id: string
  name: string
  sort_order: number
}

interface PlaybookFile {
  id: string
  name: string
  storage_path: string
  mime_type: string
  sort_order: number
}

export default function Playbook() {
  const [folders, setFolders] = useState<PlaybookFolder[]>([])
  const [foldersLoading, setFoldersLoading] = useState(true)

  const [selectedFolder, setSelectedFolder] = useState<PlaybookFolder | null>(null)
  const [files, setFiles] = useState<PlaybookFile[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [filesLoading, setFilesLoading] = useState(false)

  // Lightbox state
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // ── Fetch folders ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('playbook_folders')
      .select('*')
      .order('sort_order')
      .order('created_at')
      .then(({ data }) => {
        setFolders((data ?? []) as PlaybookFolder[])
        setFoldersLoading(false)
      })
  }, [])

  // ── Fetch files when folder selected ─────────────────────────────────────────
  const openFolder = useCallback(async (folder: PlaybookFolder) => {
    setSelectedFolder(folder)
    setFiles([])
    setSignedUrls({})
    setFilesLoading(true)

    const { data } = await supabase
      .from('playbook_files')
      .select('id, name, storage_path, mime_type, sort_order')
      .eq('folder_id', folder.id)
      .order('sort_order')
      .order('created_at')

    const rows = (data ?? []) as PlaybookFile[]
    setFiles(rows)

    if (rows.length > 0) {
      const { data: urls } = await supabase.storage
        .from('playbook')
        .createSignedUrls(rows.map(f => f.storage_path), 3600)
      if (urls) {
        const map: Record<string, string> = {}
        urls.forEach((u, i) => { if (u.signedUrl) map[rows[i].id] = u.signedUrl })
        setSignedUrls(map)
      }
    }
    setFilesLoading(false)
  }, [])

  // ── Lightbox navigation (images only) ────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-8 pb-24 max-w-lg mx-auto">

      {/* Header */}
      <div className="mb-6">
        {selectedFolder ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedFolder(null); setFiles([]) }}
              className="text-brand text-sm font-medium hover:text-brand-light transition-colors"
            >
              ← Back
            </button>
            <div className="w-px h-4 bg-gray-300" />
            <h1 className="font-display text-2xl font-bold text-near-black truncate">
              {selectedFolder.name}
            </h1>
          </div>
        ) : (
          <>
            <p className="font-ui text-xs tracking-widest uppercase text-gray-500 mb-1">Browse</p>
            <h1 className="font-display text-4xl font-bold text-near-black leading-none">Playbook.</h1>
          </>
        )}
      </div>

      {/* ── Folder list ──────────────────────────────────────────────────────── */}
      {!selectedFolder && (
        <>
          {foldersLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">📖</span>
              <p className="font-semibold text-near-black">Nothing here yet</p>
              <p className="text-sm text-gray-400 mt-1">Your coaches will add playbook content here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => openFolder(folder)}
                  className="w-full flex items-center gap-3 bg-white/80 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700/50
                             border-l-2 border-l-brand rounded-xl px-4 py-3.5
                             hover:border-gray-300 hover:border-l-brand-light transition-all text-left"
                >
                  <span className="text-xl flex-shrink-0">📁</span>
                  <span className="font-ui font-medium text-sm text-near-black flex-1">
                    {folder.name}
                  </span>
                  <span className="text-gray-400 text-sm">→</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── File grid ────────────────────────────────────────────────────────── */}
      {selectedFolder && (
        <>
          {filesLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-near-black font-semibold">No plays yet</p>
              <p className="text-sm text-gray-400 mt-1">Your coaches haven't added files to this folder.</p>
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
                    onClick={() => {
                      if (!url) return
                      if (isPdf) window.open(url, '_blank')
                      else setLightboxIdx(imageIdx)
                    }}
                    className="group relative bg-gray-100 dark:bg-[#3A3A3C] rounded-xl overflow-hidden aspect-square
                               border border-gray-200 dark:border-gray-700/50 hover:border-brand/40 transition-all
                               focus:outline-none"
                  >
                    {isPdf ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <span className="text-4xl">📄</span>
                        <p className="font-ui text-[10px] font-medium text-gray-600 px-2 truncate w-full text-center">
                          {file.name}
                        </p>
                      </div>
                    ) : url ? (
                      <img
                        src={url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
                      </div>
                    )}
                    {/* Name label — only for images */}
                    {!isPdf && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent
                                      px-2 pt-4 pb-2">
                        <p className="text-white text-[10px] font-medium truncate">{file.name}</p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && lightboxUrls[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Image */}
          <img
            src={lightboxUrls[lightboxIdx]}
            alt={imageFiles[lightboxIdx]?.name}
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl leading-none transition-colors"
          >
            ×
          </button>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! - 1) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white
                         text-3xl leading-none bg-black/30 rounded-full w-10 h-10
                         flex items-center justify-center transition-colors"
            >
              ‹
            </button>
          )}

          {/* Next */}
          {lightboxIdx < lightboxUrls.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! + 1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white
                         text-3xl leading-none bg-black/30 rounded-full w-10 h-10
                         flex items-center justify-center transition-colors"
            >
              ›
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-xs font-ui">
            {lightboxIdx + 1} / {lightboxUrls.length}
          </div>
        </div>
      )}
    </div>
  )
}
