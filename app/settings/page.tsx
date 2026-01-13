"use client";

import { FooterMenu } from "@/components/footer-menu";
import { Settings } from "@/components/settings";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-black">
      {/* Header */}
      <Card className="flex items-center justify-between px-4 py-3 rounded-none rounded-b-xl border-x-0 border-t-0 shadow-sm gap-0">
        <h1 className="text-lg font-semibold">Settings</h1>
      </Card>

      {/* Content */}
      <Settings />

      {/* Footer Menu */}
      <FooterMenu />
    </div>
  );
}
