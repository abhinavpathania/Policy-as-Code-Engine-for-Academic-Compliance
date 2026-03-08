"use client";

import React, { useRef, useEffect } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  placeholder?: string;
  isLoading?: boolean;
};

export default function SearchBar({ value, onChange, onSearch, placeholder, isLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim() && !isLoading) {
      e.preventDefault();
      onSearch();
    }
    if (e.key === "Escape") {
      onChange("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search-bar-container">
      <span className="search-icon">🔍</span>
      <input
        ref={inputRef}
        type="text"
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Search regulatory clauses..."}
        disabled={isLoading}
      />
      {value && (
        <button
          className="clear-btn"
          onClick={() => onChange("")}
          type="button"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      <button
        className="btn btn-primary"
        onClick={onSearch}
        disabled={!value.trim() || isLoading}
      >
        {isLoading ? "⏳" : "Search"}
      </button>
    </div>
  );
}
