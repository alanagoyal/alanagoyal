"use client";

import React from "react";
import { Button } from "./ui/button";

interface TableToolbarProps {
  onInsertTable: (rows: number, cols: number) => void;
}

export function TableToolbar({ onInsertTable }: TableToolbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rows, setRows] = React.useState(3);
  const [cols, setCols] = React.useState(3);

  const createTableMarkdown = () => {
    onInsertTable(rows, cols);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
        Insert Table
      </Button>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 rounded-md border bg-background p-4 shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rows</label>
              <input
                type="number"
                min="2"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Columns</label>
              <input
                type="number"
                min="2"
                max="10"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <Button onClick={createTableMarkdown} className="w-full">
              Insert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
