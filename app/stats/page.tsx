"use client";

import { FooterMenu } from "@/components/footer-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { Expense, Category } from "@/lib/db";
import expenseCategoriesConfig from "@/config/expense-categories.json";
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  subMonths,
} from "date-fns";
import {
  Pie,
  PieChart,
  Cell,
  Legend,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Empty } from "@/components/ui/empty";
import { ArrowUp, ArrowDown, Minus, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  total: number;
  color: string;
  percentage: number;
}

interface DailyExpense {
  date: string;
  amount: number;
}

export default function StatsPage() {
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>(
    []
  );
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadMonthlyStats();
  }, [selectedDate]);

  const loadMonthlyStats = async () => {
    try {
      setLoading(true);
      const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");

      const expenses = await db.getExpensesByDateRange(monthStart, monthEnd);

      // Get previous month data for comparison
      const previousMonth = subMonths(selectedDate, 1);
      const prevMonthStart = format(startOfMonth(previousMonth), "yyyy-MM-dd");
      const prevMonthEnd = format(endOfMonth(previousMonth), "yyyy-MM-dd");
      const prevExpenses = await db.getExpensesByDateRange(
        prevMonthStart,
        prevMonthEnd
      );
      const prevTotal = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setPreviousMonthTotal(prevTotal);

      // Group by date for daily chart
      const dailyMap = new Map<string, number>();
      expenses.forEach((expense) => {
        const current = dailyMap.get(expense.date) || 0;
        dailyMap.set(expense.date, current + expense.amount);
      });

      // Create daily data for all days in month
      const allDays = eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      });
      const dailyData = allDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return {
          date: format(day, "dd"),
          amount: dailyMap.get(dateStr) || 0,
        };
      });
      setDailyExpenses(dailyData);

      // Group by category and calculate totals
      const categoryMap = new Map<string, number>();

      expenses.forEach((expense) => {
        const current = categoryMap.get(expense.categoryId) || 0;
        categoryMap.set(expense.categoryId, current + expense.amount);
      });

      // Calculate total
      const total = Array.from(categoryMap.values()).reduce(
        (sum, amount) => sum + amount,
        0
      );
      setTotalAmount(total);

      // Calculate percentage change
      if (prevTotal > 0) {
        const change = ((total - prevTotal) / prevTotal) * 100;
        setPercentageChange(change);
      } else if (total > 0) {
        setPercentageChange(100);
      } else {
        setPercentageChange(0);
      }

      // Build category expenses with colors from config
      const categoryData: CategoryExpense[] = Array.from(categoryMap.entries())
        .map(([categoryId, amount]) => {
          const category = expenseCategoriesConfig.categories.find(
            (c) => c.id === categoryId
          );
          return {
            categoryId,
            categoryName: category?.name || categoryId,
            total: amount,
            color: category?.color || "#94a3b8",
            percentage: total > 0 ? (amount / total) * 100 : 0,
          };
        })
        .sort((a, b) => b.total - a.total);

      setCategoryExpenses(categoryData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart config
  const chartConfig = categoryExpenses.reduce((config, cat) => {
    config[cat.categoryId] = {
      label: cat.categoryName,
      color: cat.color,
    };
    return config;
  }, {} as Record<string, { label: string; color?: string }>);

  // Prepare chart data
  const chartData = categoryExpenses.map((cat) => ({
    category: cat.categoryName,
    amount: cat.total,
    fill: cat.color,
  }));

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-black">
      {/* Header */}
      <Card className="flex items-center justify-between px-4 py-3 rounded-none rounded-b-xl border-x-0 border-t-0 shadow-sm gap-0">
        <h1 className="text-lg font-semibold">Stats</h1>
      </Card>

      {/* Content */}

      <div className="flex-1 overflow-auto p-4 pb-24 space-y-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Loading...
              </div>
            </CardContent>
          </Card>
        ) : categoryExpenses.length === 0 ? (
          <Empty
            title="No expenses yet"
            description="Start tracking your expenses for this month"
          />
        ) : (
          <>
            {/* Total Card */}
            <Card className="">
              <CardHeader className="pb-2">
                <CardDescription>
                  Total Expenses{" "}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {format(selectedDate, "MMMM yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>{" "}
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-[oklch(0.205_0_0)]">
                  {totalAmount.toLocaleString("vi-VN")} ₫
                </CardTitle>
                {previousMonthTotal > 0 || totalAmount > 0 ? (
                  <div className="flex items-center gap-2 mt-2">
                    {percentageChange > 0 ? (
                      <>
                        <ArrowUp className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-500 font-medium">
                          +{percentageChange.toFixed(1)}% from last month
                        </span>
                      </>
                    ) : percentageChange < 0 ? (
                      <>
                        <ArrowDown className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">
                          {percentageChange.toFixed(1)}% from last month
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-medium">
                          No change from last month
                        </span>
                      </>
                    )}
                  </div>
                ) : null}
              </CardHeader>
            </Card>

            {/* Daily Expense Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Expenses</CardTitle>
                <CardDescription>
                  {format(new Date(), "MMMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount",
                      color: "oklch(0.205 0 0)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <LineChart data={dailyExpenses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => (
                            <span className="font-bold">
                              {Number(value).toLocaleString("vi-VN")} ₫
                            </span>
                          )}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="oklch(0.205 0 0)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.205 0 0)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pie Chart Card */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>
                  Breakdown for {format(new Date(), "MMMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[300px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className="flex items-center justify-between gap-4">
                              <span>{name}</span>
                              <span className="font-bold">
                                {Number(value).toLocaleString("vi-VN")} ₫
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={chartData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ percent }: { percent: number }) =>
                        `${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                {/* Category List */}
                <div className="mt-6 space-y-3">
                  {categoryExpenses.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium">
                          {cat.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {cat.percentage.toFixed(1)}%
                        </span>
                        <span className="text-sm font-semibold min-w-[100px] text-right">
                          {cat.total.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Footer Menu */}
      <FooterMenu />
    </div>
  );
}
