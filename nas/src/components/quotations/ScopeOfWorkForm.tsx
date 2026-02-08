"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { QuotationScopeWork } from "@/types"
import { IconPlus, IconPencil, IconTrash, IconGripVertical } from "@tabler/icons-react"

interface ScopeOfWorkFormProps {
  quotationId: number
  scopeWork: QuotationScopeWork[]
  onAdd: (item: Omit<QuotationScopeWork, "id" | "quotation_id">) => Promise<void>
  onEdit: (id: number, item: Partial<QuotationScopeWork>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  readonly?: boolean
}

export function ScopeOfWorkForm({
  quotationId,
  scopeWork,
  onAdd,
  onEdit,
  onDelete,
  readonly = false,
}: ScopeOfWorkFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<QuotationScopeWork | null>(null)
  const [formData, setFormData] = useState({
    step_number: scopeWork.length + 1,
    description: "",
    work_category: "",
  })
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    try {
      await onAdd(formData)
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to add scope of work item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingItem) return
    setLoading(true)
    try {
      await onEdit(editingItem.id, formData)
      setIsEditDialogOpen(false)
      setEditingItem(null)
      resetForm()
    } catch (error) {
      console.error("Failed to edit scope of work item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scope of work item?")) return
    setLoading(true)
    try {
      await onDelete(id)
    } catch (error) {
      console.error("Failed to delete scope of work item:", error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (item: QuotationScopeWork) => {
    setEditingItem(item)
    setFormData({
      step_number: item.step_number,
      description: item.description,
      work_category: item.work_category || "",
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      step_number: scopeWork.length + 1,
      description: "",
      work_category: "",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scope of Work</h3>
        {!readonly && (
          <Button
            onClick={() => {
              setFormData({
                ...formData,
                step_number: scopeWork.length + 1,
              })
              setIsAddDialogOpen(true)
            }}
            size="sm"
            disabled={loading}
          >
            <IconPlus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Step</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              {!readonly && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {scopeWork.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readonly ? 3 : 4}
                  className="text-center text-muted-foreground"
                >
                  No scope of work items added yet
                </TableCell>
              </TableRow>
            ) : (
              scopeWork.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconGripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{item.step_number}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="whitespace-pre-wrap">{item.description}</p>
                  </TableCell>
                  <TableCell>
                    {item.work_category && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {item.work_category}
                      </span>
                    )}
                  </TableCell>
                  {!readonly && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          disabled={loading}
                        >
                          <IconPencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                        >
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Scope of Work Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="step_number">
                  Step Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="step_number"
                  type="number"
                  min="1"
                  value={formData.step_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      step_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_category">Category (Optional)</Label>
                <Input
                  id="work_category"
                  value={formData.work_category}
                  onChange={(e) =>
                    setFormData({ ...formData, work_category: e.target.value })
                  }
                  placeholder="e.g., Preparation, Installation"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the work to be performed in this step"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={loading || !formData.description}>
              {loading ? "Adding..." : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Scope of Work Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-step_number">
                  Step Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-step_number"
                  type="number"
                  min="1"
                  value={formData.step_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      step_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-work_category">Category (Optional)</Label>
                <Input
                  id="edit-work_category"
                  value={formData.work_category}
                  onChange={(e) =>
                    setFormData({ ...formData, work_category: e.target.value })
                  }
                  placeholder="e.g., Preparation, Installation"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the work to be performed in this step"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingItem(null)
                resetForm()
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !formData.description}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
