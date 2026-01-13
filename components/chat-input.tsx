"use client";

import { useState } from "react";
import { Send, ShoppingCart, Utensils, Coffee, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const quickCategories = [
  {
    id: "groceries",
    name: "Groceries",
    icon: ShoppingCart,
    color: "#EF4444",
    bgLight: "#FEE2E2",
  },
  {
    id: "dining-out",
    name: "Dining Out",
    icon: Utensils,
    color: "#F97316",
    bgLight: "#FFEDD5",
  },
  {
    id: "coffee-tea",
    name: "Coffee & Tea",
    icon: Coffee,
    color: "#0891B2",
    bgLight: "#CFFAFE",
  },
];

export function ChatInput({ onSend, onFocus, onBlur }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof quickCategories)[0] | null
  >(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
      setSelectedCategory(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCategorySelect = (category: (typeof quickCategories)[0]) => {
    setSelectedCategory(category);
  };

  const handleRemoveCategory = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="mx-2">
      {/* Selected Category Tag */}
      {selectedCategory && (
        <div className="mb-2 flex items-center justify-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg"
            style={{ backgroundColor: selectedCategory.color }}
          >
            <selectedCategory.icon className="w-4 h-4" />
            {selectedCategory.name}
            <button
              onClick={handleRemoveCategory}
              className="ml-1 hover:bg-white/30 rounded-full p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Access Categories */}
      <div className="mb-2 flex items-center justify-center gap-2">
        {quickCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory?.id === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all shadow-sm ${
                isSelected
                  ? "ring-2 ring-offset-2 scale-105"
                  : "hover:scale-105 hover:shadow-md"
              }`}
              style={{
                backgroundColor: isSelected ? category.color : category.bgLight,
                color: isSelected ? "white" : category.color,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Input */}
      <Card className="flex items-center gap-2 p-3 rounded-xl mb-2 gap-2 flex-row shadow-md">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          enterKeyHint="send"
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-muted rounded-full text-base outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </Card>
    </div>
  );
}
