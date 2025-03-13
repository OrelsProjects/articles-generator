import type { LucideIcon } from "lucide-react"
import type { UniqueIdentifier } from "@dnd-kit/core"

export interface StatusItem {
  id: UniqueIdentifier
  content: string
  status: UniqueIdentifier
  author?: string
  avatar?: string
  createdAt: string
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
  onStatusChange?: (item: StatusItem, newStatus: UniqueIdentifier) => Promise<void> | void
  onSelectItem?: (itemId: UniqueIdentifier) => void
  onNewItem?: (columnId: UniqueIdentifier) => void | Promise<unknown>
  selectedItem?: UniqueIdentifier
  className?: string
  debug?: boolean
  hideArchiveColumn?: boolean
}

