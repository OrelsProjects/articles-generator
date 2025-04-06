import type { LucideIcon } from "lucide-react"
import type { UniqueIdentifier } from "@dnd-kit/core"
import { NoteDraft } from "@/types/note"

export interface StatusItem {
  id: UniqueIdentifier
  content: string
  status: UniqueIdentifier
  author?: string
  avatar?: string
  createdAt: string
  noteDraft?: NoteDraft
}

export interface StatusColumn {
  id: UniqueIdentifier
  title: string
  items: StatusItem[]
  color?: string
  icon?: LucideIcon
}

export interface StatusBoardProps {
  initialColumns: StatusColumn[]
  onStatusChange?: (item: StatusItem, newStatus: UniqueIdentifier, previousStatus: UniqueIdentifier | null) => Promise<void> | void
  onSelectItem?: (itemId: UniqueIdentifier, showModal?: boolean) => void
  onNewItem?: (columnId: UniqueIdentifier) => void | Promise<unknown>
  selectedItem?: UniqueIdentifier
  className?: string
  debug?: boolean
  hideArchiveColumn?: boolean
}

