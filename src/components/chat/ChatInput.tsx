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
        <div className="border-t border-gray-200 bg-white p-3 flex items-end gap-2">
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
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#121E4D]/20 focus:border-[#121E4D] disabled:opacity-50"
            />
            <button
                type="button"
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                className="px-4 py-2 bg-[#121E4D] text-white rounded-lg text-sm font-medium hover:bg-[#1a2a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                ส่ง
            </button>
        </div>
    );
}
