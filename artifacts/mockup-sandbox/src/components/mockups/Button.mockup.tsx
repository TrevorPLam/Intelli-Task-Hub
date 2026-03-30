import React from "react";
import { Button } from "../ui/button";

/**
 * Button Mockup Component
 * 
 * Demonstrates various button variants and sizes from the shadcn/ui button component.
 * This component validates that the mockup discovery pipeline works end-to-end.
 */
export default function ButtonMockup() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Button Variants</h2>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Button Sizes</h2>
        
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Button States</h2>
        
        <div className="flex flex-wrap gap-4">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button className="opacity-50 cursor-not-allowed">Custom State</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Interactive Examples</h2>
        
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => alert("Clicked!")}>Click Me</Button>
          <Button 
            variant="outline" 
            onMouseDown={(e) => e.currentTarget.classList.add("scale-95")}
            onMouseUp={(e) => e.currentTarget.classList.remove("scale-95")}
          >
            Press Me
          </Button>
        </div>
      </div>
    </div>
  );
}
