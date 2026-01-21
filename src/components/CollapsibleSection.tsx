/**
 * CollapsibleSection Component
 * Reusable collapsible section with icon, title, description, and animated content
 */

import { ReactNode } from "react";
import { LucideIcon, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CollapsibleSectionProps {
  /** Icon component to display in the header */
  icon: LucideIcon;
  /** Section title */
  title: string;
  /** Section description shown below the title */
  description: string;
  /** Whether the section is currently open */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Content to render inside the collapsible section */
  children: ReactNode;
  /** Optional custom className for the content wrapper */
  contentClassName?: string;
}

export function CollapsibleSection({
  icon: Icon,
  title,
  description,
  isOpen,
  onOpenChange,
  children,
  contentClassName = "space-y-3 sm:space-y-4",
}: CollapsibleSectionProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="group rounded-lg border bg-card transition-all data-[state=open]:ring-2 data-[state=open]:ring-primary/20"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-label={`Toggle ${title} section`}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="px-4 pb-4">
          <div className={`border-t pt-4 ${contentClassName}`}>{children}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsibleSection;
