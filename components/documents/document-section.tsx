"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Tag,
  Calendar,
  HardDrive,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DocumentEntry } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-store"

interface DocumentSectionProps {
  storageKey: string
  title: string
  icon: React.ElementType
  emptyMessage: string
}

const FILE_TYPES = ["PDF", "DOCX", "JPG", "PNG", "SCAN", "Other"]

export function DocumentSection({
  storageKey,
  title,
  icon: Icon,
  emptyMessage,
}: DocumentSectionProps) {
  const [documents, setDocuments] = useLocalStorage<DocumentEntry[]>(
    storageKey,
    []
  )
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [fileType, setFileType] = useState("PDF")
  const [fileSize, setFileSize] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase()
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q) ||
      doc.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  function handleAddTag() {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput("")
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleAdd() {
    if (!name) return
    const doc: DocumentEntry = {
      id: crypto.randomUUID(),
      name,
      description,
      dateAdded: new Date().toISOString().split("T")[0],
      fileType,
      fileSize: fileSize || "N/A",
      tags,
    }
    setDocuments([doc, ...documents])
    setName("")
    setDescription("")
    setFileType("PDF")
    setFileSize("")
    setTags([])
    setTagInput("")
    setOpen(false)
  }

  function handleDelete(id: string) {
    setDocuments(documents.filter((d) => d.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <Badge variant="secondary" className="font-mono text-xs">
            {documents.length}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, description, or tag..."
          className="pl-10 bg-card border-border text-foreground"
        />
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {search ? "No documents match your search." : emptyMessage}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="bg-card border-border hover:border-primary/30 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <CardTitle className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {doc.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {doc.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {doc.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {doc.dateAdded}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {doc.fileType}
                  </span>
                  {doc.fileSize !== "N/A" && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {doc.fileSize}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document to {title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">
                Document Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Employment Contract 2025"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">
                Description (optional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
                className="bg-secondary border-border text-foreground resize-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-sm text-muted-foreground">
                  File Type
                </Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((ft) => (
                      <SelectItem key={ft} value={ft}>
                        {ft}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label className="text-sm text-muted-foreground">
                  File Size (optional)
                </Label>
                <Input
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="e.g. 2.3 MB"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="bg-secondary border-border text-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
