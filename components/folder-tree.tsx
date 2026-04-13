"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeNode {
  id: string
  name: string
  type: "folder" | "file"
  children?: TreeNode[]
  path: string
}

interface FolderTreeProps {
  data: TreeNode[]
  onSelect: (node: TreeNode) => void
  selectedId: string | null
}

function TreeItem({
  node,
  onSelect,
  selectedId,
  level = 0,
}: { node: TreeNode; onSelect: (node: TreeNode) => void; selectedId: string | null; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 2)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsOpen(!isOpen)
          }
          onSelect(node)
        }}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren && (
          <span className="flex-shrink-0">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}

        {node.type === "folder" ? (
          isOpen ? (
            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
          )
        ) : (
          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}

        <span className="truncate text-left">{node.name}</span>
      </button>

      {hasChildren && isOpen && (
        <div>
          {node.children?.map((child) => (
            <TreeItem key={child.id} node={child} onSelect={onSelect} selectedId={selectedId} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({ data, onSelect, selectedId }: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
      {data.map((node) => (
        <TreeItem key={node.id} node={node} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  )
}
