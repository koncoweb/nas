"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MaterialRequestItem, Material } from "@/types"
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"

interface RequestItemsTableProps {
  items: MaterialRequestItem[]
  materials: Material[]
  onAddItem: (item: Omit<MaterialRequestItem, "id" | "material_request_id">) => Promise<void>
  onUpdateItem: (itemId: number, item: Partial<MaterialRequestItem>) => Promise<void>
  onDeleteItem: (itemId: number) => Promise<void>
  disabled?: boolean
}

export function RequestItemsTable({
  items,
  materials,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  disabled = false,
}: RequestItemsTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MaterialRequestItem | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    material_id: 0,
    description: "",
    quantity: 1,
    estimated_unit_cost: 0,
  })

  const resetForm = () => {
    setFormData({
      material_id: 0,
      description: "",
      quantity: 1,
      estimated_unit_cost: 0,
    })
  }

  const handleAddItem = async () => {
    setLoading(true)
    try {
      await onAddItem({
        material_id: formData.material_id || null,
        description: formData.description,
        quantity: formData.quantity,
        estimated_unit_cost: formData.estimated_unit_cost,
      } as any)
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to add item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = async () => {
    if (!editingItem) return
    setLoading(true)
    try {
      await onUpdateItem(editingItem.id, {
        material_id: formData.material_id || null,
        description: formData.description,
        quantity: formData.quantity,
        estimated_unit_cost: formData.estimated_unit_cost,
      } as any)
      setIsEditDialogOpen(false)
      setEditingItem(null)
      resetForm()
    } catch (error) {
      console.error("Failed to update item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    setLoading(true)
    try {
      await onDeleteItem(itemId)
    } catch (error) {
      console.error("Failed to delete item:", error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (item: MaterialRequestItem) => {
    setEditingItem(item)
    setFormData({
      material_id: item.material_id || 0,
      description: item.description,
      quantity: item.quantity,
      estimated_unit_cost: item.estimated_unit_cost,
    })
    setIsEditDialogOpen(true)
  }

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.id === parseInt(materialId))
    if (material) {
      setFormData((prev) => ({
        ...prev,
        material_id: material.id,
        description: material.name,
        estimated_unit_cost: material.unit_cost,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        material_id: 0,
      }))
    }
  }

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.estimated_unit_cost,
      0
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Request Items</h3>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          disabled={disabled || loading}
          size="sm"
        >
          <IconPlus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {!disabled && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={disabled ? 5 : 6} className="text-center text-muted-foreground">
                  No items added yet
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {(item as any).material_name || "Custom Item"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${Number(item.estimated_unit_cost).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(item.quantity * item.estimated_unit_cost).toFixed(2)}
                  </TableCell>
                  {!disabled && (
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
                          onClick={() => handleDeleteItem(item.id)}
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

      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="rounded-lg border bg-muted/50 p-4 min-w-[250px]">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Estimated Total:</span>
              <span className="font-bold text-lg">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material (Optional)</Label>
              <Select
                value={formData.material_id.toString()}
                onValueChange={handleMaterialChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a material or leave blank for custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Custom Item</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name} - ${Number(material.unit_cost).toFixed(2)}/{material.unit_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_unit_cost">
                  Unit Cost <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="estimated_unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimated_unit_cost}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimated_unit_cost: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
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
            <Button onClick={handleAddItem} disabled={loading || !formData.description}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-material">Material (Optional)</Label>
              <Select
                value={formData.material_id.toString()}
                onValueChange={handleMaterialChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a material or leave blank for custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Custom Item</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id.toString()}>
                      {material.name} - ${Number(material.unit_cost).toFixed(2)}/{material.unit_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estimated_unit_cost">
                  Unit Cost <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-estimated_unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimated_unit_cost}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimated_unit_cost: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
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
            <Button onClick={handleEditItem} disabled={loading || !formData.description}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


