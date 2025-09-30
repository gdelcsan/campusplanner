import { PropsWithChildren } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ColorCustomizer } from "@/components/ColorCustomizer";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="font-extrabold text-xl tracking-tight">
            <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
              Campus Planner
            </span>
          </a>
          <div className="flex items-center gap-1">
            <ColorCustomizer />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
