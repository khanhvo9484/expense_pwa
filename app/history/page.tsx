"use client";

import { FooterMenu } from "@/components/footer-menu";
import { Card } from "@/components/ui/card";
import {
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { db, Expense } from "@/lib/db";
import { getCategoryIcon } from "@/lib/category-icons";
import categoriesData from "@/config/expense-categories.json";
import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  isSameMonth,
  getYear,
  getMonth,
  getDate,
  lastDayOfMonth,
  parseISO,
  isAfter,
  isBefore,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Empty } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export default function StatsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const getCategoryDetails = (categoryId: string) => {
    const category = categoriesData.categories.find(
      (cat) => cat.id === categoryId
    );
    return category || null;
  };

  useEffect(() => {
    db.init().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [currentMonth]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentMonth, selectedCategory, sortBy]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const now = new Date();

      // Determine if we're viewing current month
      const isViewingCurrentMonth = isSameMonth(currentMonth, now);

      // For current month, use current day; for past months, use last day of month
      const currentDay = isViewingCurrentMonth
        ? getDate(now)
        : getDate(lastDayOfMonth(currentMonth));

      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(
        new Date(getYear(currentMonth), getMonth(currentMonth), currentDay),
        "yyyy-MM-dd"
      );

      const monthExpenses = await db.getExpensesByDateRange(startDate, endDate);
      console.log("monthExpenses:", monthExpenses);
      // Sort by date descending (newest first)
      monthExpenses.sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
      );
      setExpenses(monthExpenses);

      // Calculate total for current period
      const sum = monthExpenses.reduce((acc, exp) => acc + exp.amount, 0);
      setTotal(sum);

      // Calculate total for same period in previous month
      const prevMonthDate = subMonths(currentMonth, 1);
      const prevStartDate = format(startOfMonth(prevMonthDate), "yyyy-MM-dd");
      const prevEndDate = format(
        new Date(getYear(prevMonthDate), getMonth(prevMonthDate), currentDay),
        "yyyy-MM-dd"
      );

      const prevMonthExpenses = await db.getExpensesByDateRange(
        prevStartDate,
        prevEndDate
      );

      const prevSum = prevMonthExpenses.reduce(
        (acc, exp) => acc + exp.amount,
        0
      );
      setPreviousTotal(prevSum);
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isCurrentMonth = () => {
    return isSameMonth(currentMonth, new Date());
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy");
  };

  const formatMonthYear = () => {
    return format(currentMonth, "MMMM yyyy");
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm");
  };

  // Filter and sort logic
  const filteredExpenses = expenses.filter((expense) => {
    if (selectedCategory === "all") return true;
    return expense.categoryId === selectedCategory;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "amount") {
      return b.amount - a.amount;
    }
    return parseISO(b.date).getTime() - parseISO(a.date).getTime();
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentExpenses = sortedExpenses.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getComparison = () => {
    if (previousTotal === 0) {
      return { percentChange: 0, isIncrease: false, diff: 0 };
    }
    const diff = total - previousTotal;
    const percentChange = (diff / previousTotal) * 100;
    return {
      percentChange: Math.abs(percentChange),
      isIncrease: diff > 0,
      diff: Math.abs(diff),
    };
  };

  const formatCompactAmount = (amount: number) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + "M";
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + "k";
    }
    return amount.toString();
  };

  const comparison = getComparison();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-black">
      {/* Header */}
      <Card className="flex items-center justify-between px-4 py-3 rounded-none rounded-b-xl border-x-0 border-t-0 shadow-sm gap-0">
        <h1 className="text-lg font-semibold">History</h1>
      </Card>

      {/* Month Selector */}
      <div className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-medium capitalize">
            {formatMonthYear()}
          </h2>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Total */}
        <Card className="relative overflow-hidden border-0 bg-primary dark:bg-slate-800">
          <div className="relative z-10 px-6 text-white">
            <p className="text-sm font-medium text-slate-300 mb-2">
              Total Expenses
            </p>
            <p className="text-4xl font-bold mb-3">
              {formatCompactAmount(total)} VND
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {expenses.length} transaction{expenses.length !== 1 ? "s" : ""}
              </p>
              {previousTotal > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-800/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-full px-3 py-1">
                  {comparison.isIncrease ? (
                    <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-green-400" />
                  )}
                  <span className="text-xs font-semibold">
                    {comparison.percentChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">vs last period</span>
                </div>
              )}
            </div>
          </div>
          {/* Subtle decorative element */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-slate-700/20 dark:bg-slate-600/20 rounded-full blur-3xl"></div>
        </Card>
      </div>

      {/* Filter and Sort Controls */}
      {expenses.length > 0 && (
        <div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={sortBy === "amount" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(sortBy === "date" ? "amount" : "date")}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === "date" ? "Date" : "Amount"}
            </Button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : sortedExpenses.length === 0 ? (
          <div className="px-4 py-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Calendar className="w-6 h-6" />
                </EmptyMedia>
                <EmptyTitle>
                  {selectedCategory === "all"
                    ? "No expenses yet"
                    : "No expenses in this category"}
                </EmptyTitle>
                <EmptyDescription>
                  {selectedCategory === "all"
                    ? "You have not recorded any expenses for this period. Start tracking your spending in the Chat tab."
                    : "Try selecting a different category or clear the filter."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="px-4 py-4">
            <Accordion type="single" collapsible className="space-y-2">
              {currentExpenses.map((expense) => {
                const categoryDetails = getCategoryDetails(expense.categoryId);
                const IconComponent = categoryDetails
                  ? getCategoryIcon(categoryDetails.icon)
                  : null;
                const color = categoryDetails?.color || "#3B82F6";

                return (
                  <AccordionItem
                    key={expense.id}
                    value={expense.id}
                    className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-full"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            {IconComponent && (
                              <IconComponent
                                className="w-4 h-4"
                                style={{ color }}
                              />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">
                              {expense.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(expense.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {expense.amount.toLocaleString("vi-VN")}
                          </p>
                          <p className="text-xs text-muted-foreground">VND</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-800">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                            }}
                          >
                            {IconComponent && (
                              <IconComponent className="w-3.5 h-3.5" />
                            )}
                            {expense.categoryName}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Amount
                            </p>
                            <p className="font-semibold">
                              {expense.amount.toLocaleString("vi-VN")} VND
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Date
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(expense.date)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Description
                          </p>
                          <p className="text-sm">{expense.description}</p>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created: {formatDateTime(expense.createdAt)}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToPage(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToPage(currentPage + 1)}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Menu */}
      <FooterMenu />
    </div>
  );
}
