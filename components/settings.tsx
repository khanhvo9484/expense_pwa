"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Key, Brain } from "lucide-react";

const availableModels = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B Versatile" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B" },
];

export function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage or your preferred storage
    localStorage.setItem("groq_api_key", apiKey);
    localStorage.setItem("selected_model", selectedModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your expense tracking assistant
          </p>
        </div>

        {/* API Key Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <CardTitle>API Configuration</CardTitle>
            </div>
            <CardDescription>
              Enter your Groq API key to enable AI-powered expense tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Groq API Key</FieldLabel>
              <Input
                type="password"
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <FieldDescription>
                Get your API key from{" "}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.groq.com
                </a>
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle>AI Model</CardTitle>
            </div>
            <CardDescription>
              Choose the language model for processing your expenses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Model</FieldLabel>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Different models offer varying speeds and capabilities
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
        >
          <Save className="w-5 h-5" />
          {saved ? "Settings Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
