"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderTree } from "@/components/folder-tree"
import { FileText, Download, Sparkles, UserPlus, ArrowUpDown } from "lucide-react"

interface TreeNode {
  id: string
  name: string
  type: "folder" | "file"
  children?: TreeNode[]
  path: string
}

interface FileItem {
  id: string
  name: string
  type: string
  size: string
  date: string
  path: string
}

const folderStructure: TreeNode[] = [
  {
    id: "root",
    name: "Orthopedic Records",
    type: "folder",
    path: "Orthopedic Records",
    children: [
      {
        id: "2024",
        name: "2024",
        type: "folder",
        path: "Orthopedic Records/2024",
        children: [
          {
            id: "2024-dec",
            name: "December",
            type: "folder",
            path: "Orthopedic Records/2024/December",
            children: [
              {
                id: "2024-dec-knee",
                name: "Knee Osteoarthritis",
                type: "folder",
                path: "Orthopedic Records/2024/December/Knee Osteoarthritis",
                children: [
                  {
                    id: "2024-dec-knee-rajesh",
                    name: "Rajesh Kumar",
                    type: "folder",
                    path: "Orthopedic Records/2024/December/Knee Osteoarthritis/Rajesh Kumar",
                    children: [
                      {
                        id: "2024-dec-knee-rajesh-xray",
                        name: "X-Ray",
                        type: "folder",
                        path: "Orthopedic Records/2024/December/Knee Osteoarthritis/Rajesh Kumar/X-Ray",
                        children: [
                          {
                            id: "file-1",
                            name: "Knee_XRay_Bilateral.pdf",
                            type: "file",
                            path: "Orthopedic Records/2024/December/Knee Osteoarthritis/Rajesh Kumar/X-Ray/Knee_XRay_Bilateral.pdf",
                          },
                          {
                            id: "file-2",
                            name: "Knee_XRay_Right_Lateral.pdf",
                            type: "file",
                            path: "Orthopedic Records/2024/December/Knee Osteoarthritis/Rajesh Kumar/X-Ray/Knee_XRay_Right_Lateral.pdf",
                          },
                        ],
                      },
                      {
                        id: "2024-dec-knee-rajesh-pt",
                        name: "Physical Therapy",
                        type: "folder",
                        path: "Orthopedic Records/2024/December/Knee Osteoarthritis/Rajesh Kumar/Physical Therapy",
                        children: [
                          {
                            id: "file-3",
                            name: "PT_Assessment_Week3.pdf",
                            type: "file",
                            path: "Orthopedic Records/2024/December/Knee Osteoarthritis/Rajesh Kumar/Physical Therapy/PT_Assessment_Week3.pdf",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: "2024-dec-lumbar",
                name: "Lumbar Disc Herniation",
                type: "folder",
                path: "Orthopedic Records/2024/December/Lumbar Disc Herniation",
                children: [
                  {
                    id: "2024-dec-lumbar-priya",
                    name: "Priya Nair",
                    type: "folder",
                    path: "Orthopedic Records/2024/December/Lumbar Disc Herniation/Priya Nair",
                    children: [
                      {
                        id: "2024-dec-lumbar-priya-mri",
                        name: "MRI",
                        type: "folder",
                        path: "Orthopedic Records/2024/December/Lumbar Disc Herniation/Priya Nair/MRI",
                        children: [
                          {
                            id: "file-4",
                            name: "Lumbar_Spine_MRI_Sagittal.pdf",
                            type: "file",
                            path: "Orthopedic Records/2024/December/Lumbar Disc Herniation/Priya Nair/MRI/Lumbar_Spine_MRI_Sagittal.pdf",
                          },
                        ],
                      },
                      {
                        id: "2024-dec-lumbar-priya-surgical",
                        name: "Surgical Notes",
                        type: "folder",
                        path: "Orthopedic Records/2024/December/Lumbar Disc Herniation/Priya Nair/Surgical Notes",
                        children: [
                          {
                            id: "file-5",
                            name: "Pre_Op_Assessment.pdf",
                            type: "file",
                            path: "Orthopedic Records/2024/December/Lumbar Disc Herniation/Priya Nair/Surgical Notes/Pre_Op_Assessment.pdf",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: "2024-dec-rotator",
                name: "Rotator Cuff Tear",
                type: "folder",
                path: "Orthopedic Records/2024/December/Rotator Cuff Tear",
                children: [
                  {
                    id: "2024-dec-rotator-arjun",
                    name: "Arjun Patel",
                    type: "folder",
                    path: "Orthopedic Records/2024/December/Rotator Cuff Tear/Arjun Patel",
                    children: [
                      {
                        id: "2024-dec-rotator-arjun-mri",
                        name: "MRI",
                        type: "folder",
                        path: "Orthopedic Records/2024/December/Rotator Cuff Tear/Arjun Patel/MRI",
                        children: [
                          {
                            id: "file-6",
                            name: "Shoulder_MRI_Right.pdf",
                            type: "file",
                            path: "Orthopedic Records/2024/December/Rotator Cuff Tear/Arjun Patel/MRI/Shoulder_MRI_Right.pdf",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "2024-nov",
            name: "November",
            type: "folder",
            path: "Orthopedic Records/2024/November",
            children: [
              {
                id: "2024-nov-meniscal",
                name: "Meniscal Tear",
                type: "folder",
                path: "Orthopedic Records/2024/November/Meniscal Tear",
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "2023",
        name: "2023",
        type: "folder",
        path: "Orthopedic Records/2023",
        children: [
          {
            id: "2023-dec",
            name: "December",
            type: "folder",
            path: "Orthopedic Records/2023/December",
            children: [],
          },
        ],
      },
    ],
  },
]

export default function FolderExplorerPage() {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [sortBy, setSortBy] = useState("newest")
  const [filterType, setFilterType] = useState("all")

  // Get files from selected folder
  const filesInFolder: FileItem[] = selectedNode?.children
    ? selectedNode.children
      .filter((child) => child.type === "file")
      .map((child) => ({
        id: child.id,
        name: child.name,
        type: child.name.split(".").pop()?.toUpperCase() || "FILE",
        size: "2.4 MB",
        date: "2024-12-15",
        path: child.path,
      }))
    : []

  return (
    <main className="flex-1">
      <div className="container py-8 px-8">
        <PageHeader
          title="Folder Explorer"
          description="Browse orthopedic records by hierarchical folder structure"
        />

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Left: Tree Navigation */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Folder Structure</CardTitle>
              <p className="text-xs text-muted-foreground">Year → Month → Condition → Patient → Imaging Type</p>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto">
              <FolderTree data={folderStructure} onSelect={setSelectedNode} selectedId={selectedNode?.id || null} />
            </CardContent>
          </Card>

          {/* Right: Files Display */}
          <div className="space-y-6">
            {selectedNode ? (
              <>
                {/* Path Breadcrumb */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <span className="font-semibold text-foreground">Current Path:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{selectedNode.path}</span>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[160px]">
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="name">Alphabetical</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="pdf">PDF Only</SelectItem>
                          <SelectItem value="images">Images Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Files Grid */}
                {filesInFolder.length > 0 ? (
                  <div className="grid gap-4">
                    {filesInFolder.map((file) => (
                      <Card key={file.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-6 w-6 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{file.name}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {file.type}
                                  </Badge>
                                  <span>{file.size}</span>
                                  <span>•</span>
                                  <span>{file.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Attach</span>
                              </Button>
                              <Button variant="outline" size="sm">
                                <Sparkles className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Analyze AI</span>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                      <p className="text-muted-foreground">
                        {selectedNode.type === "folder" ? "This folder is empty" : "No files to display"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-24 text-center">
                  <FileText className="h-20 w-20 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a Folder</h3>
                  <p className="text-muted-foreground">Choose a folder from the tree to view its contents</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
