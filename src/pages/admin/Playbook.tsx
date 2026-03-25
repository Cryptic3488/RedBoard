import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface PlaybookFolder {
  id: string
  name: string
  sort_order: number
  created_at: string
}

interface PlaybookFile {
  id: string
  folder_id: string
  name: string
  storage_path: string
  mime_type: string
  sort_order: number
  created_at: string
}

export default function AdminPlaybook() {
  const { user } = useAuth()

  // ── Folders ──────────────────────────────────────────────────────────────────
  const [folders, setFolders] = useState<PlaybookFolder[]>([])
  const [foldersLoading, setFoldersLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<PlaybookFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [folderSaving, setFolderSaving] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)

  // ── Files ─────────────────────────────────────────────────────────────────────
  const [files, setFiles] = useState<PlaybookFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Lightbox ──────────────────────────────────────────────────────────────────
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // ── Fetch folders ─────────────────────────────────────────────────────────────
  const fetchFolders = useCallback(async () => {
    setFoldersLoading(true)
    const { data } = await supabase
      .from('playbook_folders')
      .select('*')
      .order('sort_order')
      .order('created_at')
    setFolders((data ?? []) as PlaybookFolder[])
    setFoldersLoading(false)
  }, [])

  useEffect(() => { fetchFolders() }, [fetchFolders])

  // ── Fetch files for selected folder ───────────────────────────────────────────
  const fetchFiles = useCallback(async (folderId: string) => {
    setFilesLoading(true)
    setSignedUrls({})
    const { data } = await supabase
      .from('playbook_files')
      .select('*')
      .eq('folder_id', folderId)
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

  useEffect(() => {
    if (selectedFolder) fetchFiles(selectedFolder.id)
    else { setFiles([]); setSignedUrls({}) }
  }, [selectedFolder, fetchFiles])

  // ── Create folder ─────────────────────────────────────────────────────────────
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newFolderName.trim()) return
    setFolderSaving(true); setFolderError(null)
    const { error } = await (supabase as any)
      .from('playbook_folders')
      .insert({ name: newFolderName.trim(), created_by: user.id })
    if (error) { setFolderError(error.message); setFolderSaving(false); return }
    setNewFolderName('')
    setFolderSaving(false)
    fetchFolders()
  }

  // ── Rename folder ─────────────────────────────────────────────────────────────
  const handleRenameFolder = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return }
    await (supabase as any)
      .from('playbook_folders')
      .update({ name: renameValue.trim() })
      .eq('id', id)
    setRenamingId(null); setRenameValue('')
    fetchFolders()
  }

  // ── Delete folder (also cleans up storage objects) ────────────────────────────
  const handleDeleteFolder = async (folder: PlaybookFolder) => {
    if (!confirm(`Delete "${folder.name}" and all its files?`)) return
    const { data: folderFiles } = await supabase
      .from('playbook_files')
      .select('storage_path')
      .eq('folder_id', folder.id)
    if (folderFiles && folderFiles.length > 0) {
      await supabase.storage
        .from('playbook')
        .remove((folderFiles as { storage_path: string }[]).map(f => f.storage_path))
    }
    await supabase.from('playbook_folders').delete().eq('id', folder.id)
    if (selectedFolder?.id === folder.id) setSelectedFolder(null)
    fetchFolders()
  }

  // ── Upload files ──────────────────────────────────────────────────────────────
  const uploadFiles = async (fileList: FileList | File[]) => {
    if (!user || !selectedFolder) return
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    const validFiles = Array.from(fileList).filter(f => allowed.includes(f.type))
    if (validFiles.length === 0) {
      setUploadError('Only images (JPG, PNG, GIF, WebP) and PDFs are accepted')
      return
    }
    setUploading(true); setUploadError(null)
    for (const file of validFiles) {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${selectedFolder.id}/${crypto.randomUUID()}.${ext}`
      const { error: storageErr } = await supabase.storage
        .from('playbook')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (storageErr) { setUploadError(storageErr.message); setUploading(false); return }
      const { error: dbErr } = await (supabase as any)
        .from('playbook_files')
        .insert({
          folder_id:    selectedFolder.id,
          name:         file.name.replace(/\.[^.]+$/, ''),
          storage_path: path,
          mime_type:    file.type,
          created_by:   user.id,
        })
      if (dbErr) { setUploadError(dbErr.message); setUploading(false); return }
    }
    setUploading(false)
    fetchFiles(selectedFolder.id)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
  }

  // ── Delete file ───────────────────────────────────────────────────────────────
  const handleDeleteFile = async (file: PlaybookFile) => {
    if (!confirm(`Remove "${file.name}"?`)) return
    await supabase.storage.from('playbook').remove([file.storage_path])
    await supabase.from('playbook_files').delete().eq('id', file.id)
    if (selectedFolder) fetchFiles(selectedFolder.id)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-near-black dark:text-gray-100 text-xl font-bold">Playbook</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* ── Folder panel ──────────────────────────────────────────────────── */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Folders</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleCreateFolder} className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="New folder name…"
              maxLength={80}
              className="flex-1 bg-gray-50 dark:bg-[#3A3A3C] border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm
                         text-near-black dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={folderSaving || !newFolderName.trim()}
              className="bg-brand text-white px-3 py-2 rounded-lg text-sm font-semibold
                         disabled:opacity-50 hover:bg-brand/90 transition-colors flex-shrink-0"
            >
              +
            </button>
          </form>
          {folderError && <p className="text-xs text-red-600">{folderError}</p>}

          {foldersLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : folders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No folders yet</p>
          ) : (
            <div className="space-y-1.5">
              {folders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => { if (renamingId !== folder.id) setSelectedFolder(folder) }}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer
                              border transition-all ${
                    selectedFolder?.id === folder.id
                      ? 'bg-brand/5 border-brand/30 border-l-2 border-l-brand'
                      : 'bg-white/80 dark:bg-[#2C2C2E] border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base flex-shrink-0">📁</span>

                  {renamingId === folder.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameFolder(folder.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameFolder(folder.id)
                        if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                      }}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 text-sm bg-transparent border-b border-brand outline-none text-near-black dark:text-gray-100"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-near-black dark:text-gray-100 truncate">
                      {folder.name}
                    </span>
                  )}

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setRenamingId(folder.id)
                        setRenameValue(folder.name)
                      }}
                      className="text-xs text-gray-400 hover:text-near-black transition-colors px-1 py-0.5"
                    >
                      ✎
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteFolder(folder) }}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors px-1 py-0.5"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── File panel ────────────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          {!selectedFolder ? (
            <div className="flex flex-col items-center justify-center py-16 text-center
                            border-2 border-dashed border-gray-200 rounded-2xl">
              <span className="text-3xl mb-3">📂</span>
              <p className="text-sm text-gray-400">Select a folder to manage its files</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {selectedFolder.name}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">
                  {files.length} file{files.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex items-center justify-center gap-3 border-2 border-dashed rounded-xl
                            px-4 py-3 cursor-pointer transition-colors ${
                  isDragging ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand/40'
                }`}
              >
                <span className="text-lg">{uploading ? '⏳' : isDragging ? '⬇️' : '📎'}</span>
                <span className="text-sm text-gray-500">
                  {uploading
                    ? 'Uploading…'
                    : isDragging
                    ? 'Drop files here'
                    : 'Drop images or PDFs, or click to upload'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

              {/* File grid */}
              {filesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No files yet — upload images or PDFs above
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map(file => {
                    const url = signedUrls[file.id]
                    return (
                      <div
                        key={file.id}
                        className="group relative bg-gray-100 dark:bg-[#3A3A3C] rounded-xl overflow-hidden aspect-square
                                   border border-gray-200 hover:border-brand/40 transition-all"
                      >
                        {file.mime_type === 'application/pdf' ? (
                          /* PDF tile */
                          <button
                            className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                            onClick={() => url && window.open(url, '_blank')}
                          >
                            <span className="text-3xl">📄</span>
                            <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 px-2 truncate w-full text-center">
                              {file.name}
                            </p>
                          </button>
                        ) : url ? (
                          <img
                            src={url}
                            alt={file.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setLightboxUrl(url)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all
                                        flex flex-col items-center justify-end p-2
                                        opacity-0 group-hover:opacity-100">
                          <p className="text-white text-[10px] font-medium truncate w-full text-center mb-1.5">
                            {file.name}
                          </p>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteFile(file) }}
                            className="text-white/80 hover:text-white text-xs bg-black/40 rounded px-2 py-0.5 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Playbook"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
