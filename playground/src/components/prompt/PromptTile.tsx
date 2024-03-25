import {useEffect, useRef} from "react";
import {PromptInput} from "@/components/prompt/PromptInput";

type PromptProps = {
  prompt: string;
  accentColor: string;
  onCache?: (prompt: string) => void;
};

export const PromptTile = ({ prompt, accentColor, onCache }: PromptProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef, prompt]);

  return (
    <PromptInput
      accentColor={accentColor}
      placeholder="Design the bot's prompt here..."
      maxLength={4000}
      onCache={onCache}
    />
  );
};
