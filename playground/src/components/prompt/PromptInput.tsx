import {useRef, useState} from "react";

type PromptInput = {
  placeholder: string;
  accentColor: string;
  maxLength: number;
  onCache?: (prompt: string) => void;
};

export const PromptInput = ({
  placeholder,
  accentColor,
  maxLength
}: PromptInput) => {
  const [prompt, setPrompt] = useState("");
  const [counter, setCounter] = useState(0);
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputHasFocus, setInputHasFocus] = useState(false);

  const lengthExceeded = counter > maxLength;

  return (
    <div className="flex flex-col gap-4 w-full h-full relative">
      <textarea
        ref={inputRef}
        className={`w-full h-full text-xs caret-${accentColor}-700 bg-transparent opacity-25 text-gray-300 p-2 pr-6 rounded-sm focus:opacity-100 focus:outline-none focus:border-${accentColor}-700 focus:ring-1 focus:ring-${accentColor}-700`}
        style={{resize: "none"}}
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          if (!composing) {
            setCounter(e.target.value.length);
          }
        }}
        onCompositionStart={(e) => {
          setComposing(true);
        }}
        onCompositionEnd={(e) => {
          setComposing(false);
          setCounter(e.currentTarget.value.length);
        }}
        onFocus={() => {
          setInputHasFocus(true);
        }}
        onBlur={() => {
          setInputHasFocus(false);
        }}
      />
      <div className={`absolute bottom-3 right-3 text-xs font-bold ${lengthExceeded ? 'text-red-500' : 'text-gray-300'}`}>
        {counter} / {maxLength} Tokens
      </div>
    </div>
  );
};
