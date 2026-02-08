"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { IconCash } from "@tabler/icons-react"

interface PaymentFormProps {
  invoiceId: number
  totalAmount: number
  amountPaid: number
  onSubmit: (payment: {
    amount: number
    payment_date: Date
    payment_method?: string
    notes?: string
  }) => Promise<void>
}

export function PaymentForm({
  invoiceId,
  totalAmount,
  amountPaid,
  onSubmit,
}: PaymentFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: totalAmount - amountPaid,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "",
    notes: "",
  })
  const [error, setError] = useState("")

  const remainingBalance = totalAmount - amountPaid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate amount
    if (formData.amount <= 0) {
      setError("Payment amount must be greater than 0")
      return
    }

    if (formData.amount > remainingBalance) {
      setError(`Payment amount cannot exceed remaining balance of $${Number(remainingBalance).toFixed(2)}`)
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        amount: formData.amount,
        payment_date: new Date(formData.payment_date),
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
      })
      setIsOpen(false)
      // Reset form
      setFormData({
        amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "",
        notes: "",
      })
    } catch (error) {
      setError("Failed to record payment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    // Reset form with remaining balance
    setFormData({
      amount: remainingBalance,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "",
      notes: "",
    })
    setError("")
    setIsOpen(true)
  }

  return (
    <>
      <Button onClick={handleOpen} disabled={remainingBalance <= 0}>
        <IconCash className="w-4 h-4 mr-2" />
        Record Payment
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">${Number(totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium">${Number(amountPaid).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">Remaining Balance:</span>
                  <span className="font-bold text-lg">
                    ${Number(remainingBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Payment Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBalance}
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_date: e.target.value })
                  }
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Input
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                  placeholder="e.g., Check, Wire Transfer, Credit Card"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Enter any additional notes (optional)"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
