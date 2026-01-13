export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private static async callGroqAPI(
    config: AIConfig,
    messages: AIMessage[]
  ): Promise<AIResponse> {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: messages,
            temperature: config.temperature ?? 0.7,
            max_tokens: config.maxTokens ?? 1024,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API error: ${response.status}`
        );
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      return {
        success: true,
        message: aiResponse,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Future: Add support for other AI providers
  // private static async callOpenAI(...) {}
  // private static async callAnthropic(...) {}
  // private static async callGemini(...) {}

  public static async sendMessage(
    userMessage: string,
    systemPrompt?: string
  ): Promise<AIResponse> {
    // Get configuration from localStorage
    const apiKey = localStorage.getItem("groq_api_key");
    const model =
      localStorage.getItem("selected_model") || "llama-3.3-70b-versatile";

    if (!apiKey) {
      return {
        success: false,
        error:
          "API key not configured. Please go to Settings to add your Groq API key.",
      };
    }

    const config: AIConfig = {
      apiKey,
      model,
    };

    const messages: AIMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: userMessage,
    });

    // Currently only supporting Groq, but can be extended
    return await this.callGroqAPI(config, messages);
  }

  public static async sendMessageWithHistory(
    userMessage: string,
    conversationHistory: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    const apiKey = localStorage.getItem("groq_api_key");
    const model =
      localStorage.getItem("selected_model") || "llama-3.3-70b-versatile";

    if (!apiKey) {
      return {
        success: false,
        error:
          "API key not configured. Please go to Settings to add your Groq API key.",
      };
    }

    const config: AIConfig = {
      apiKey,
      model,
    };

    const messages: AIMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push(...conversationHistory);
    messages.push({
      role: "user",
      content: userMessage,
    });

    return await this.callGroqAPI(config, messages);
  }
}
