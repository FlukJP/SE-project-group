"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";

interface Props {
    onSend: (content: string) => void;
    disabled?: boolean;
}

// Renders a textarea message input with auto-resize and send-on-Enter support
export default function ChatInput({ onSend, disabled }: Props) {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Dynamically adjusts textarea height up to a maximum of 120px based on content
    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }
    }, []);

    // Trims, sends the message, and resets the textarea
    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
        textareaRef.current?.focus();
    };

    // Triggers send on Enter key press, allowing Shift+Enter for newlines
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-[#DCD0C0] bg-white p-3 flex items-end gap-2">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder="พิมพ์ข้อความ..."
                disabled={disabled}
                rows={1}
                style={{ maxHeight: "120px" }}
                className="flex-1 resize-none border border-[#DCD0C0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 focus:border-[#D9734E] disabled:opacity-50 bg-white text-[#4A3B32] placeholder-[#A89F91]"
            />
            <button
                type="button"
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                className="px-4 py-2 bg-[#D9734E] text-white rounded-lg text-sm font-medium hover:bg-[#C25B38] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                ส่ง
            </button>
        </div>
    );
}
