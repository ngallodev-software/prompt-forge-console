import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type HelpTipProps = {
  label: string;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
  contentClassName?: string;
};

export function HelpTip({
  label,
  content,
  side = "top",
  className,
  iconClassName,
  contentClassName,
}: HelpTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
        >
          <CircleHelp className={cn("h-3.5 w-3.5", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} align="center" className={cn("max-w-xs text-xs leading-5", contentClassName)}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
