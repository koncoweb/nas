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
import { InvoiceLineItem } from "@/types"
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"

interface InvoiceLineItemsTableProps {
  invoiceId: number
  lineItems: InvoiceLineItem[]
  onAdd: (item: Omit<InvoiceLineItem, "id" | "invoice_id" | "line_total">) => Promise<void>
  onEdit: (id: number, item: Partial<InvoiceLineItem>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  readonly?: boolean
}

export function InvoiceLineItemsTable({
  invoiceId,
  lineItems,
  onAdd,
  onEdit,
  onDelete,
  readonly = false,
}: InvoiceLineItemsTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InvoiceLineItem | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    quantity: 1,
    unit_price: 0,
  })
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    try {
      await onAdd(formData)
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to add line item:", error)
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
      console.error("Failed to edit line item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this line item?")) return
    setLoading(true)
    try {
      await onDelete(id)
    } catch (error) {
      console.error("Failed to delete line item:", error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (item: InvoiceLineItem) => {
    setEditingItem(item)
    setFormData({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      description: "",
      quantity: 1,
      unit_price: 0,
    })
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.line_total, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Invoice Line Items</h3>
        {!readonly && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
            disabled={loading}
          >
            <IconPlus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {!readonly && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readonly ? 4 : 5}
                  className="text-center text-muted-foreground"
                >
                  No line items added yet
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.line_total.toFixed(2)}
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
            {lineItems.length > 0 && (
              <TableRow>
                <TableCell colSpan={readonly ? 3 : 4} className="text-right font-semibold">
                  Total Amount:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  ${totalAmount.toFixed(2)}
                </TableCell>
                {!readonly && <TableCell />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">
                  Unit Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Line Total:</span>
                <span className="font-bold">
                  ${(formData.quantity * formData.unit_price).toFixed(2)}
                </span>
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
            <Button onClick={handleAdd} disabled={loading || !formData.description}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-unit_price">
                  Unit Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Line Total:</span>
                <span className="font-bold">
                  ${(formData.quantity * formData.unit_price).toFixed(2)}
                </span>
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
            <Button onClick={handleEdit} disabled={loading || !formData.description}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
