import type { BackupFile } from './types'
import { getAllCards, getAllDecks, mergeImportedData } from './db'

export const BACKUP_VERSION = 1
export const LAST_EXPORT_KEY = 'jl_last_export_at'

export async function exportBackup(): Promise<BackupFile> {
  const decks = await getAllDecks()
  const cards = await getAllCards()
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    decks,
    cards,
  }
}

export function downloadBackup(data: BackupFile): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const date = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `japanese-learning-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
  localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString())
}

function isBackupFile(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false
  const o = data as Record<string, unknown>
  return (
    typeof o.version === 'number' &&
    typeof o.exportedAt === 'string' &&
    Array.isArray(o.decks) &&
    Array.isArray(o.cards)
  )
}

export async function importBackupFromFile(file: File): Promise<{
  addedDeckCount: number
  addedCardCount: number
  skippedDeckCount: number
  skippedCardCount: number
}> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('无法解析备份文件，请确认是有效的 JSON')
  }

  if (!isBackupFile(parsed)) {
    throw new Error('备份文件格式不正确')
  }

  if (parsed.version > BACKUP_VERSION) {
    throw new Error(`备份版本 ${parsed.version} 高于当前应用支持的版本 ${BACKUP_VERSION}`)
  }

  return mergeImportedData(parsed.decks, parsed.cards)
}

export function getLastExportAt(): string | null {
  return localStorage.getItem(LAST_EXPORT_KEY)
}
