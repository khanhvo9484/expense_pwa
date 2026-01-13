"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X } from "lucide-react";
import expenseCategories from "@/config/expense-categories.json";

interface CategorySelectorProps {
  amount: number;
  description: string;
  defaultCategory?: string;
  onConfirm: (categoryId: string, categoryName: string) => void;
  onCancel: () => void;
}

export function CategorySelector({
  amount,
  description,
  defaultCategory,
  onConfirm,
  onCancel,
}: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    defaultCategory || ""
  );

  const handleConfirm = () => {
    const category = expenseCategories.categories.find(
      (c) => c.id === selectedCategory
    );
    if (category) {
      onConfirm(category.id, category.name);
    }
  };

  return (
    <Card className="p-4 mb-2 mx-2 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Expense detected:</p>
        <div className="space-y-1">
          <p className="font-semibold text-lg">
            {amount.toLocaleString("vi-VN")} VND
          </p>
          <p className="text-sm">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Category:</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a category..." />
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

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!selectedCategory}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-4 h-4" />
          Save Expense
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
