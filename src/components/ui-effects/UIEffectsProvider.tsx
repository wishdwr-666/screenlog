"use client";
import { DynamicEnvironment } from "@/components/environment/DynamicEnvironment";

export function UIEffectsProvider({ children }: { children: React.ReactNode }) {
  return <DynamicEnvironment>{children}</DynamicEnvironment>;
}
