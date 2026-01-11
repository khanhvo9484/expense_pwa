"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import expenseCategories from "@/config/expense-categories.json";
import { Expense } from "@/lib/db";

interface ExpenseEditDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    expenseId: string,
    updates: { categoryId: string; categoryName: string; date: string }
  ) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseEditDialog({
  expense,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: ExpenseEditDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  if (!expense) return null;

  // Initialize values when opening the dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && expense) {
      setSelectedCategory(expense.categoryId);
      setSelectedDate(parseISO(expense.date));
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    if (!selectedCategory || !selectedDate) return;

    const category = expenseCategories.categories.find(
      (c) => c.id === selectedCategory
    );
    if (!category) return;

    onSave(expense.id, {
      categoryId: category.id,
      categoryName: category.name,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this expense?")) {
      onDelete(expense.id);
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the category and date for this expense.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-semibold">
              {expense.amount.toLocaleString("vi-VN")} VND
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
              {expense.description}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="sm:mr-auto"
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selectedCategory || !selectedDate}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
