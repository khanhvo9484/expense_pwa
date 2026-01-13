import { AIService } from "./ai-service";
import expenseCategories from "@/config/expense-categories.json";

export interface ExtractedExpense {
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  date: string; // ISO date string
  confidence: "high" | "medium" | "low";
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedExpense;
  error?: string;
  needsManualCategory?: boolean;
}

export class ExpenseExtractor {
  // Parse Vietnamese date references
  static parseDate(text: string): string {
    const normalized = text.toLowerCase();
    const today = new Date();

    // Yesterday variations
    if (
      normalized.includes("hôm qua") ||
      normalized.includes("hom qua") ||
      normalized.includes("qua")
    ) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split("T")[0];
    }

    // Tomorrow variations
    if (
      normalized.includes("ngày mai") ||
      normalized.includes("ngay mai") ||
      normalized.includes("mai")
    ) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }

    // Today or no date mentioned
    return today.toISOString().split("T")[0];
  }

  // Parse Vietnamese amount format (20k, 15k, 100, etc.)
  static parseAmount(text: string): number | null {
    // Match patterns like: 20k, 20K, 20.5k, 20,5k, 100, 100000
    const patterns = [
      /(\d+(?:[.,]\d+)?)\s*k/i, // 20k, 20.5k, 20,5k
      /(\d+(?:[.,]\d+)?)\s*(?:nghìn|ngàn)/i, // 20 nghìn
      /(\d+(?:[.,]\d+)?)\s*triệu/i, // 2 triệu (millions)
      /(\d{1,3}(?:[.,]\d{3})*)/g, // 100,000 or 100.000
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let numStr = match[1] || match[0];
        numStr = numStr.replace(/,/g, ".");
        const num = parseFloat(numStr);

        if (
          text.toLowerCase().includes("triệu") ||
          text.toLowerCase().includes("trieu")
        ) {
          return num * 1000000;
        } else if (
          text.toLowerCase().includes("k") ||
          text.toLowerCase().includes("nghìn") ||
          text.toLowerCase().includes("ngàn")
        ) {
          return num * 1000;
        } else if (num > 0) {
          // If number is small (< 1000), likely using k notation without k
          // If large (>= 1000), use as is
          return num;
        }
      }
    }

    return null;
  }

  // Find matching category from config
  static findCategory(
    categoryName: string
  ): { id: string; name: string } | null {
    const normalized = categoryName.toLowerCase().trim();

    // Direct matches
    const category = expenseCategories.categories.find(
      (cat) => cat.name.toLowerCase() === normalized || cat.id === normalized
    );

    if (category) {
      return { id: category.id, name: category.name };
    }

    // Fuzzy matching with Vietnamese keywords
    const vietnameseMapping: Record<string, string> = {
      groceries: ["chợ", "siêu thị", "rau", "thịt", "cá", "thực phẩm", "đồ ăn"],
      "dining-out": [
        "nhà hàng",
        "quán ăn",
        "ăn ngoài",
        "buffet",
        "cơm",
        "phở",
        "bún",
      ],
      "coffee-tea": ["cà phê", "cafe", "trà", "sinh tố", "nước"],
      "public-transit": [
        "xe buýt",
        "xe bus",
        "tàu",
        "metro",
        "grab bike",
        "xe ôm",
      ],
      "taxi-rideshare": ["grab", "taxi", "uber", "gojek", "be"],
      fuel: ["xăng", "dầu"],
      parking: ["đậu xe", "gửi xe", "giữ xe"],
      clothing: ["quần áo", "áo", "quần", "giày", "dép", "thời trang"],
      electronics: [
        "điện thoại",
        "máy tính",
        "laptop",
        "tai nghe",
        "sạc",
        "điện tử",
      ],
      "home-furniture": ["nội thất", "đồ gia dụng", "nhà cửa"],
      "movies-streaming": ["phim", "rạp", "netflix", "xem phim"],
      gaming: ["game", "trò chơi"],
      "gym-fitness": ["gym", "thể thao", "tập", "yoga"],
      electricity: ["điện", "tiền điện"],
      water: ["nước", "tiền nước"],
      internet: ["internet", "mạng", "wifi"],
      "mobile-phone": ["điện thoại", "cước", "sim"],
      rent: ["thuê nhà", "tiền nhà", "tiền trọ"],
      "doctor-medical": ["bác sĩ", "khám", "bệnh viện", "y tế"],
      pharmacy: ["thuốc", "nhà thuốc"],
      dental: ["nha khoa", "răng"],
      books: ["sách", "truyện"],
      "online-courses": ["khóa học", "học"],
      tuition: ["học phí", "học"],
      flight: ["máy bay", "vé máy bay"],
      hotel: ["khách sạn", "homestay", "nghỉ"],
      "haircut-salon": ["cắt tóc", "salon", "gội đầu"],
      "skincare-cosmetics": ["mỹ phẩm", "son", "kem", "skincare"],
      laundry: ["giặt", "giặt ủi"],
      "pet-care": ["thú cưng", "chó", "mèo"],
      "gifts-donations": ["quà", "tặng", "từ thiện"],
      subscriptions: ["đăng ký", "subscription", "gói"],
    };

    for (const [categoryId, keywords] of Object.entries(vietnameseMapping)) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        const cat = expenseCategories.categories.find(
          (c) => c.id === categoryId
        );
        if (cat) {
          return { id: cat.id, name: cat.name };
        }
      }
    }

    return null;
  }

  // Extract expense using AI
  static async extractWithAI(text: string): Promise<ExtractionResult> {
    const systemPrompt = `You are an expense extraction assistant for Vietnamese users. Extract expense information from Vietnamese text including date references.

Categories available: ${expenseCategories.categories
      .map((c) => `${c.id} (${c.name})`)
      .join(", ")}

Rules:
1. Extract the amount (convert k to thousand, e.g., 20k = 20000)
2. Identify the category based on the description
3. Parse date references: "hôm qua"/"qua" = yesterday, "ngày mai"/"mai" = tomorrow, otherwise = today
4. Return date in YYYY-MM-DD format
5. Keep the original description (without the date reference)
6. Respond ONLY with JSON in this exact format:
{
  "amount": <number>,
  "categoryId": "<category-id>",
  "categoryName": "<category-name>",
  "description": "<original description>",
  "date": "<YYYY-MM-DD>"
}

Examples:
Input: "mua sách 20k"
Output: {"amount": 20000, "categoryId": "books", "categoryName": "Books", "description": "mua sách", "date": "2026-01-11"}

Input: "hôm qua đổ xăng 50k"
Output: {"amount": 50000, "categoryId": "fuel", "categoryName": "Fuel", "description": "đổ xăng", "date": "2026-01-10"}

Input: "ngày mai đi chợ 30k"
Output: {"amount": 30000, "categoryId": "groceries", "categoryName": "Groceries", "description": "đi chợ", "date": "2026-01-12"}`;

    const response = await AIService.sendMessage(text, systemPrompt);

    if (!response.success) {
      return {
        success: false,
        error: response.error,
        needsManualCategory: true,
      };
    }

    try {
      // Try to parse JSON from response
      const jsonMatch = response.message!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the parsed data
      if (!parsed.amount || !parsed.categoryId) {
        throw new Error("Invalid response format");
      }

      // Verify category exists
      const category = this.findCategory(parsed.categoryId);
      if (!category) {
        throw new Error("Invalid category");
      }

      // Use parsed date or fallback to parseDate
      const date = parsed.date || this.parseDate(text);

      return {
        success: true,
        data: {
          amount: parsed.amount,
          categoryId: category.id,
          categoryName: category.name,
          description: parsed.description || text,
          date,
          confidence: "high",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to parse AI response",
        needsManualCategory: true,
      };
    }
  }

  // Fallback: Extract using regex only
  static extractWithRegex(text: string): ExtractionResult {
    const amount = this.parseAmount(text);

    if (!amount) {
      return {
        success: false,
        error: "Could not extract amount",
        needsManualCategory: true,
      };
    }

    // Parse date
    const date = this.parseDate(text);

    // Try to guess category from keywords
    const category = this.findCategory(text);

    if (!category) {
      return {
        success: true,
        data: {
          amount,
          categoryId: "other",
          categoryName: "Other",
          description: text,
          date,
          confidence: "low",
        },
        needsManualCategory: true,
      };
    }

    return {
      success: true,
      data: {
        amount,
        categoryId: category.id,
        categoryName: category.name,
        description: text,
        date,
        confidence: "medium",
      },
    };
  }

  // Main extraction method with fallback
  static async extract(text: string): Promise<ExtractionResult> {
    // First try AI extraction
    const aiResult = await this.extractWithAI(text);

    if (aiResult.success && aiResult.data) {
      return aiResult;
    }

    // Fallback to regex
    console.log("AI extraction failed, using regex fallback");
    return this.extractWithRegex(text);
  }
}
