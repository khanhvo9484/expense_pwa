"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { db } from "@/lib/db";
import { X, Calendar as CalendarIcon, Trash2 } from "lucide-react";

interface ChatHistoryProps {
  currentDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export function ChatHistory({
  currentDate,
  onDateSelect,
  onClose,
}: ChatHistoryProps) {
  const [chatDates, setChatDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(currentDate));

  useEffect(() => {
    loadChatDates();
  }, []);

  const loadChatDates = async () => {
    try {
      const dates = await db.getAllChatDates();
      const dateObjects = dates.map((d) => new Date(d));
      setChatDates(dateObjects);
    } catch (error) {
      console.error("Failed to load chat dates:", error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const dateStr = date.toISOString().split("T")[0];
      onDateSelect(dateStr);
    }
  };

  const handleDeleteDate = async (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete all chats from ${date.toLocaleDateString()}?`)) {
      return;
    }

    try {
      const dateStr = date.toISOString().split("T")[0];
      await db.deleteChatMessagesByDate(dateStr);
      await loadChatDates();

      // If deleted current date, switch to today
      if (dateStr === currentDate) {
        const today = new Date().toISOString().split("T")[0];
        onDateSelect(today);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={{
              hasChat: chatDates,
            }}
            modifiersStyles={{
              hasChat: {
                fontWeight: "bold",
                textDecoration: "underline",
              },
            }}
            className="rounded-md border"
          />

          {chatDates.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Dates with chats ({chatDates.length})
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {chatDates
                  .sort((a, b) => b.getTime() - a.getTime())
                  .map((date) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const isSelected = dateStr === currentDate;
                    return (
                      <div
                        key={dateStr}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => handleDateSelect(date)}
                      >
                        <span className="text-sm">
                          {date.toLocaleDateString("vi-VN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <button
                          onClick={(e) => handleDeleteDate(date, e)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {chatDates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No chat history yet. Start chatting to create history!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
