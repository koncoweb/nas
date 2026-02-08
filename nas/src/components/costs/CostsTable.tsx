"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconEdit, IconTrash, IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { ProjectCost } from "@/types"

interface CostsTableProps {
  costs: (ProjectCost & {
    material_name?: string
    project_title?: string
    project_number?: string
  })[]
  onEdit?: (cost: ProjectCost) => void
  onDelete?: (costId: number) => void
  groupByCostType?: boolean
  showRunningTotal?: boolean
}

export function CostsTable({
  costs,
  onEdit,
  onDelete,
  groupByCostType = false,
  showRunningTotal = false,
}: CostsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCostTypeBadgeColor = (costType: string) => {
    switch (costType) {
      case "labor":
        return "bg-blue-100 text-blue-800"
      case "materials":
        return "bg-green-100 text-green-800"
      case "equipment":
        return "bg-purple-100 text-purple-800"
      case "other":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const toggleGroup = (costType: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(costType)) {
        newSet.delete(costType)
      } else {
        newSet.add(costType)
      }
      return newSet
    })
  }

  if (groupByCostType) {
    // Group costs by cost_type
    const groupedCosts = costs.reduce((acc, cost) => {
      if (!acc[cost.cost_type]) {
        acc[cost.cost_type] = []
      }
      acc[cost.cost_type].push(cost)
      return acc
    }, {} as Record<string, typeof costs>)

    // Calculate totals for each group
    const groupTotals = Object.entries(groupedCosts).map(([costType, groupCosts]) => ({
      costType,
      count: groupCosts.length,
      total: groupCosts.reduce((sum, cost) => sum + cost.total_cost, 0),
      costs: groupCosts,
    }))

    const grandTotal = groupTotals.reduce((sum, group) => sum + group.total, 0)

    return (
      <div className="space-y-4">
        {groupTotals.map((group) => {
          const isExpanded = expandedGroups.has(group.costType)

          return (
            <div key={group.costType} className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-muted cursor-pointer hover:bg-muted/80"
                onClick={() => toggleGroup(group.costType)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <IconChevronDown className="w-5 h-5" />
                  ) : (
                    <IconChevronRight className="w-5 h-5" />
                  )}
                  <Badge className={getCostTypeBadgeColor(group.costType)}>
                    {group.costType.charAt(0).toUpperCase() + group.costType.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {group.count} {group.count === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(group.total)}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Vendor</TableHead>
                        {(onEdit || onDelete) && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.costs.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell>{formatDate(cost.cost_date)}</TableCell>
                          <TableCell>{cost.description}</TableCell>
                          <TableCell>
                            {cost.material_name || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {cost.quantity ? cost.quantity.toFixed(2) : "-"}
                          </TableCell>
                          <TableCell>
                            {cost.unit_cost ? formatCurrency(cost.unit_cost) : "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(cost.total_cost)}
                          </TableCell>
                          <TableCell>
                            {cost.vendor || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          {(onEdit || onDelete) && (
                            <TableCell>
                              <div className="flex gap-2">
                                {onEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(cost)}
                                  >
                                    <IconEdit className="w-4 h-4" />
                                  </Button>
                                )}
                                {onDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(cost.id)}
                                  >
                                    <IconTrash className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )
        })}

        {showRunningTotal && (
          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
            <span className="text-lg font-semibold">Grand Total</span>
            <span className="text-2xl font-bold">{formatCurrency(grandTotal)}</span>
          </div>
        )}
      </div>
    )
  }

  // Regular table view (not grouped)
  let runningTotal = 0

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Vendor</TableHead>
              {showRunningTotal && <TableHead>Running Total</TableHead>}
              {(onEdit || onDelete) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showRunningTotal ? 10 : 9}
                  className="text-center text-muted-foreground"
                >
                  No costs recorded yet
                </TableCell>
              </TableRow>
            ) : (
              costs.map((cost) => {
                runningTotal += cost.total_cost
                return (
                  <TableRow key={cost.id}>
                    <TableCell>{formatDate(cost.cost_date)}</TableCell>
                    <TableCell>
                      <Badge className={getCostTypeBadgeColor(cost.cost_type)}>
                        {cost.cost_type.charAt(0).toUpperCase() + cost.cost_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell>
                      {cost.material_name || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {cost.quantity ? cost.quantity.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell>
                      {cost.unit_cost ? formatCurrency(cost.unit_cost) : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cost.total_cost)}
                    </TableCell>
                    <TableCell>
                      {cost.vendor || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    {showRunningTotal && (
                      <TableCell className="font-semibold">
                        {formatCurrency(runningTotal)}
                      </TableCell>
                    )}
                    {(onEdit || onDelete) && (
                      <TableCell>
                        <div className="flex gap-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(cost)}
                            >
                              <IconEdit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(cost.id)}
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {showRunningTotal && costs.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
          <span className="text-lg font-semibold">Total Costs</span>
          <span className="text-2xl font-bold">{formatCurrency(runningTotal)}</span>
        </div>
      )}
    </div>
  )
}
