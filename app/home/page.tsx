"use client";

import { FooterMenu } from "@/components/footer-menu";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-black">
      {/* Header */}
      <Card className="flex items-center justify-between px-4 py-3 rounded-none rounded-b-xl border-x-0 border-t-0 shadow-sm gap-0">
        <h1 className="text-lg font-semibold">Home</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-muted-foreground">Online</span>
        </div>
      </Card>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-muted-foreground">Home page coming soon...</p>
      </div>

      {/* Footer Menu */}
      <FooterMenu />
    </div>
  );
}
