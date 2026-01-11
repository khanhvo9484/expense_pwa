"use client";

import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { FooterMenu } from "@/components/footer-menu";
import { CategorySelector } from "@/components/category-selector";
import { ChatHistory } from "@/components/chat-history";
import { Card } from "@/components/ui/card";
import { ExpenseExtractor } from "@/lib/expense-extractor";
import { db } from "@/lib/db";
import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  icon?: "success" | "error" | "info";
}

export default function ChatPage() {
  const [currentDate, setCurrentDate] = useState<string>(
    // Use dayjs
    dayjs().format("YYYY-MM-DD")
  );
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingExpense, setPendingExpense] = useState<{
    amount: number;
    description: string;
    date: string;
    categoryId?: string;
  } | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Initialize database on mount
  useEffect(() => {
    db.init().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat messages for current date
  useEffect(() => {
    const loadChatMessages = async () => {
      try {
        console.log("Loading messages for date:", currentDate);
        const chatMessages = await db.getChatMessagesByDate(currentDate);
        console.log("Loaded messages:", chatMessages);
        if (chatMessages.length === 0) {
          // Show welcome message for new day
          setMessages([
            {
              id: "welcome",
              text: "Hello! How can I help you today?",
              isUser: false,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        } else {
          setMessages(chatMessages);
        }
      } catch (error) {
        console.error("Failed to load chat messages:", error);
      }
    };

    loadChatMessages();
  }, [currentDate]);

  const saveChatMessage = async (message: Message) => {
    try {
      await db.addChatMessage({
        text: message.text,
        isUser: message.isUser,
        timestamp: message.timestamp,
        date: currentDate,
      });
    } catch (error) {
      console.error("Failed to save chat message:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    await saveChatMessage(newMessage);

    // Show typing indicator
    const typingId = crypto.randomUUID();
    const typingMessage: Message = {
      id: typingId,
      text: "Extracting expense...",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, typingMessage]);

    // Extract expense
    const result = await ExpenseExtractor.extract(text);

    // Remove typing indicator
    setMessages((prev) => prev.filter((msg) => msg.id !== typingId));

    if (result.success && result.data) {
      const {
        amount,
        categoryId,
        categoryName,
        description,
        date,
        confidence,
      } = result.data;

      // If confidence is low or needs manual category, show selector
      if (result.needsManualCategory || confidence === "low") {
        setPendingExpense({
          amount,
          description,
          date,
          categoryId: categoryId === "other" ? undefined : categoryId,
        });

        const responseMessage: Message = {
          id: crypto.randomUUID(),
          text: `I found an expense of ${amount.toLocaleString(
            "vi-VN"
          )} VND. Please confirm the category below.`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          icon: "info",
        };
        setMessages((prev) => [...prev, responseMessage]);
        await saveChatMessage(responseMessage);
      } else {
        // Auto-save with high/medium confidence
        await saveExpense(amount, categoryId, categoryName, description, date);
      }
    } else {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text:
          result.error ||
          "Could not extract expense information. Please try again with format like: 'mua sách 20k' or 'Đi chợ 15k'",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveChatMessage(errorMessage);
    }
  };

  const saveExpense = async (
    amount: number,
    categoryId: string,
    categoryName: string,
    description: string,
    date: string
  ) => {
    try {
      const expense = await db.addExpense({
        amount,
        categoryId,
        categoryName,
        description,
        date,
      });

      const successMessage: Message = {
        id: crypto.randomUUID(),
        text: `Saved! ${amount.toLocaleString(
          "vi-VN"
        )} VND - ${categoryName}\n"${description}"`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: "success",
      };
      setMessages((prev) => [...prev, successMessage]);
      await saveChatMessage(successMessage);
      setPendingExpense(null);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: `Failed to save expense: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        icon: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveChatMessage(errorMessage);
    }
  };

  const handleCategoryConfirm = (categoryId: string, categoryName: string) => {
    if (pendingExpense) {
      saveExpense(
        pendingExpense.amount,
        categoryId,
        categoryName,
        pendingExpense.description,
        pendingExpense.date
      );
    }
  };

  const handleCategoryCancel = async () => {
    setPendingExpense(null);
    const cancelMessage: Message = {
      id: crypto.randomUUID(),
      text: "Expense cancelled. Feel free to try again!",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: "info",
    };
    setMessages((prev) => [...prev, cancelMessage]);
    await saveChatMessage(cancelMessage);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-black">
      {/* Header */}
      <Card className="flex items-center justify-between px-4 py-3 rounded-none rounded-b-xl border-x-0 border-t-0 shadow-sm gap-0">
        <div>
          <h1 className="text-lg font-semibold">Chat</h1>
        </div>
        <div className="items-center gap-2 hidden">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Chat history"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 pb-[200px]"
      >
        <div className="text-sm text-center mb-2 text-gray-500 flex gap-2 justify-center items-center">
          <button
            onClick={() =>
              setCurrentDate(
                dayjs(currentDate).subtract(1, "day").format("YYYY-MM-DD")
              )
            }
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Previous day"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>{currentDate}</div>
          <Calendar className="w-5 h-5" />

          <button
            onClick={() =>
              setCurrentDate(
                dayjs(currentDate).add(1, "day").format("YYYY-MM-DD")
              )
            }
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Next day"
            disabled={currentDate === dayjs().format("YYYY-MM-DD")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
            icon={message.icon}
          />
        ))}
      </div>

      {/* Category Selector - Shows when manual selection needed */}
      {pendingExpense && (
        <div className="fixed bottom-[140px] left-0 right-0 max-w-md mx-auto bg-transparent z-10">
          <CategorySelector
            amount={pendingExpense.amount}
            description={pendingExpense.description}
            defaultCategory={pendingExpense.categoryId}
            onConfirm={handleCategoryConfirm}
            onCancel={handleCategoryCancel}
          />
        </div>
      )}

      {/* Chat Input - Fixed above footer */}
      <div className="fixed bottom-[76px] left-0 right-0 max-w-md mx-auto bg-transparent">
        <ChatInput onSend={handleSendMessage} onFocus={scrollToBottom} />
      </div>

      {/* Footer Menu */}
      <FooterMenu />

      {/* Chat History Modal */}
      {showHistory && (
        <ChatHistory
          currentDate={currentDate}
          onDateSelect={(date) => {
            console.log(date, "date");
            setCurrentDate(dayjs(date).add(1, "day").format("YYYY-MM-DD"));
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
