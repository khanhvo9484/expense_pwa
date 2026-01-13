// Database Access Layer for PWA - IndexedDB wrapper

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  date: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface AppSettings {
  apiKey?: string;
  selectedModel?: string;
  currency?: string;
  theme?: "light" | "dark" | "system";
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  date: string; // ISO date string (YYYY-MM-DD)
  createdAt: string;
}

class DatabaseAccessLayer {
  private dbName = "ExpenseTrackerDB";
  private version = 2; // Increment version for schema update
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create expenses store
        if (!db.objectStoreNames.contains("expenses")) {
          const expenseStore = db.createObjectStore("expenses", {
            keyPath: "id",
          });
          expenseStore.createIndex("date", "date", { unique: false });
          expenseStore.createIndex("categoryId", "categoryId", {
            unique: false,
          });
          expenseStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Create categories store
        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id" });
        }

        // Create settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }

        // Create chat messages store
        if (!db.objectStoreNames.contains("chatMessages")) {
          const chatStore = db.createObjectStore("chatMessages", {
            keyPath: "id",
          });
          chatStore.createIndex("date", "date", { unique: false });
          chatStore.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  // ==================== EXPENSES ====================

  async addExpense(
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): Promise<Expense> {
    const db = await this.ensureDb();
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readwrite");
      const store = transaction.objectStore("expenses");
      const request = store.add(newExpense);

      request.onsuccess = () => resolve(newExpense);
      request.onerror = () => reject(new Error("Failed to add expense"));
    });
  }

  async getExpense(id: string): Promise<Expense | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error("Failed to get expense"));
    });
  }

  async getAllExpenses(): Promise<Expense[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Failed to get expenses"));
    });
  }

  async getExpensesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const index = store.index("date");
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Failed to get expenses by date range"));
    });
  }

  async getExpensesByCategory(categoryId: string): Promise<Expense[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readonly");
      const store = transaction.objectStore("expenses");
      const index = store.index("categoryId");
      const request = index.getAll(categoryId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Failed to get expenses by category"));
    });
  }

  async updateExpense(
    id: string,
    updates: Partial<Omit<Expense, "id" | "createdAt">>
  ): Promise<Expense> {
    const db = await this.ensureDb();
    const existing = await this.getExpense(id);

    if (!existing) {
      throw new Error("Expense not found");
    }

    const updated: Expense = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readwrite");
      const store = transaction.objectStore("expenses");
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(new Error("Failed to update expense"));
    });
  }

  async deleteExpense(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["expenses"], "readwrite");
      const store = transaction.objectStore("expenses");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete expense"));
    });
  }

  // ==================== CATEGORIES ====================

  async addCategory(category: Omit<Category, "id">): Promise<Category> {
    const db = await this.ensureDb();
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");
      const request = store.add(newCategory);

      request.onsuccess = () => resolve(newCategory);
      request.onerror = () => reject(new Error("Failed to add category"));
    });
  }

  async getAllCategories(): Promise<Category[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Failed to get categories"));
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete category"));
    });
  }

  // ==================== SETTINGS ====================

  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(new Error("Failed to get setting"));
    });
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to set setting"));
    });
  }

  async deleteSetting(key: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete setting"));
    });
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
      const request = store.getAll();

      request.onsuccess = () => {
        const settings: Record<string, any> = {};
        request.result.forEach((item: { key: string; value: any }) => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      request.onerror = () => reject(new Error("Failed to get all settings"));
    });
  }

  // ==================== UTILITY ====================

  async clearAllData(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["expenses", "categories", "settings", "chatMessages"],
        "readwrite"
      );

      const promises = [
        transaction.objectStore("expenses").clear(),
        transaction.objectStore("categories").clear(),
        transaction.objectStore("settings").clear(),
        transaction.objectStore("chatMessages").clear(),
      ];

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Failed to clear data"));
    });
  }

  // ==================== CHAT MESSAGES ====================

  async addChatMessage(
    message: Omit<ChatMessage, "id" | "createdAt">
  ): Promise<ChatMessage> {
    const db = await this.ensureDb();
    const now = new Date().toISOString();
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["chatMessages"], "readwrite");
      const store = transaction.objectStore("chatMessages");
      const request = store.add(newMessage);

      request.onsuccess = () => resolve(newMessage);
      request.onerror = () => reject(new Error("Failed to add chat message"));
    });
  }

  async getChatMessagesByDate(date: string): Promise<ChatMessage[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["chatMessages"], "readonly");
      const store = transaction.objectStore("chatMessages");
      const index = store.index("date");
      const request = index.getAll(date);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Failed to get chat messages by date"));
    });
  }

  async getAllChatDates(): Promise<string[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["chatMessages"], "readonly");
      const store = transaction.objectStore("chatMessages");
      const index = store.index("date");
      const request = index.openKeyCursor(null, "nextunique");
      const dates: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          dates.push(cursor.key as string);
          cursor.continue();
        } else {
          resolve(dates);
        }
      };

      request.onerror = () => reject(new Error("Failed to get chat dates"));
    });
  }

  async deleteChatMessagesByDate(date: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["chatMessages"], "readwrite");
      const store = transaction.objectStore("chatMessages");
      const index = store.index("date");
      const request = index.openCursor(IDBKeyRange.only(date));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () =>
        reject(new Error("Failed to delete chat messages"));
    });
  }

  // ==================== UTILITY ====================

  async exportData(): Promise<{
    expenses: Expense[];
    categories: Category[];
    settings: Record<string, any>;
  }> {
    const [expenses, categories, settings] = await Promise.all([
      this.getAllExpenses(),
      this.getAllCategories(),
      this.getAllSettings(),
    ]);

    return { expenses, categories, settings };
  }

  async importData(data: {
    expenses?: Expense[];
    categories?: Category[];
    settings?: Record<string, any>;
  }): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ["expenses", "categories", "settings"],
        "readwrite"
      );

      if (data.expenses) {
        const expenseStore = transaction.objectStore("expenses");
        data.expenses.forEach((expense) => expenseStore.put(expense));
      }

      if (data.categories) {
        const categoryStore = transaction.objectStore("categories");
        data.categories.forEach((category) => categoryStore.put(category));
      }

      if (data.settings) {
        const settingsStore = transaction.objectStore("settings");
        Object.entries(data.settings).forEach(([key, value]) => {
          settingsStore.put({ key, value });
        });
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Failed to import data"));
    });
  }
}

// Export singleton instance
export const db = new DatabaseAccessLayer();
