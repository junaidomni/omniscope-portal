import { useState, useEffect, useRef } from "react";
import { MentionItem } from "@/components/MentionAutocomplete";

interface UseMentionsProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

export function useMentions({ textareaRef, value, onChange }: UseMentionsProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const mentionStartRef = useRef<number>(-1);

  // Detect @ mentions
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);

    // Find the last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) {
      setMentionQuery(null);
      setMentionPosition(null);
      return;
    }

    // Check if there's a space after the @ (which would close the mention)
    const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
    if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
      setMentionQuery(null);
      setMentionPosition(null);
      return;
    }

    // Valid mention query
    const query = textAfterAt;
    setMentionQuery(query);
    mentionStartRef.current = lastAtIndex;

    // Calculate position for autocomplete popup
    const { top, left, height } = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    
    // Position below the textarea
    setMentionPosition({
      top: top + height + 4,
      left: left,
    });
  }, [value, textareaRef]);

  const handleMentionSelect = (mention: MentionItem) => {
    if (mentionStartRef.current === -1) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBefore = value.slice(0, mentionStartRef.current);
    const textAfter = value.slice(cursorPosition);

    // Format mention based on type
    const mentionText = `@${mention.type}:${mention.id}:${mention.name}`;
    const newValue = textBefore + mentionText + " " + textAfter;

    onChange(newValue);

    // Reset mention state
    setMentionQuery(null);
    setMentionPosition(null);
    mentionStartRef.current = -1;

    // Move cursor after the mention
    setTimeout(() => {
      const newCursorPos = textBefore.length + mentionText.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const closeMentionAutocomplete = () => {
    setMentionQuery(null);
    setMentionPosition(null);
    mentionStartRef.current = -1;
  };

  return {
    mentionQuery,
    mentionPosition,
    handleMentionSelect,
    closeMentionAutocomplete,
  };
}

// Helper to parse mentions from message content
export function parseMentions(content: string): {
  text: string;
  mentions: Array<{ type: string; id: number; name: string; start: number; end: number }>;
} {
  const mentionRegex = /@(user|meeting|contact|task):(\d+):([^@\s]+)/g;
  const mentions: Array<{ type: string; id: number; name: string; start: number; end: number }> = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      type: match[1],
      id: parseInt(match[2]),
      name: match[3],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return { text: content, mentions };
}

// Helper to render mentions as clickable elements
export function renderMentions(content: string) {
  const { text, mentions } = parseMentions(content);
  
  if (mentions.length === 0) {
    return [content];
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  mentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.start > lastIndex) {
      parts.push(text.slice(lastIndex, mention.start));
    }

    // Add mention as styled element (plain text for now, can be enhanced later)
    parts.push(`@${mention.name}`);

    lastIndex = mention.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
