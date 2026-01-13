import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  icon?: "success" | "error" | "info";
}

const IconComponent = ({ type }: { type: "success" | "error" | "info" }) => {
  const iconClass = "w-4 h-4 mr-2 flex-shrink-0 mt-0.5";
  switch (type) {
    case "success":
      return (
        <CheckCircle2
          className={cn(iconClass, "text-green-600 dark:text-green-400")}
        />
      );
    case "error":
      return (
        <XCircle className={cn(iconClass, "text-red-600 dark:text-red-400")} />
      );
    case "info":
      return (
        <Info className={cn(iconClass, "text-blue-500 dark:text-blue-400")} />
      );
  }
};

const formatMessage = (text: string) => {
  // Split by newlines and process each line
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    // Regex to find amounts in format: number,number VND or numberK/k
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    const amountRegex = /([\d,]+(?:\.\d+)?\s*(?:VND|vnd|đ|vnđ|k|K))/g;
    let match;

    while ((match = amountRegex.exec(line)) !== null) {
      // Add text before the amount
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      // Add the amount with highlighting
      parts.push(
        <span
          key={`${lineIndex}-${match.index}`}
          className="font-semibold text-amber-600 dark:text-amber-400"
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <span key={lineIndex}>
        {parts.length > 0 ? parts : line}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

export function ChatMessage({
  message,
  isUser,
  timestamp,
  icon,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2 shadow-sm",
            isUser
              ? "bg-primary text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          <div className="flex items-start text-sm leading-relaxed break-words">
            {icon && !isUser && <IconComponent type={icon} />}
            <p className="flex-1">{formatMessage(message)}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500 mt-1 px-2">{timestamp}</span>
      </div>
    </div>
  );
}
