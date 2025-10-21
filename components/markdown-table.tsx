"use client";

import React from "react";

export function MarkdownTable({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-wrapper" style={{ overflowX: "auto", margin: "16px 0" }}>
      <table {...props}>{children}</table>
    </div>
  );
}

export function MarkdownTableHead({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props}>{children}</thead>;
}

export function MarkdownTableBody({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>;
}

export function MarkdownTableRow({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props}>{children}</tr>;
}

export function MarkdownTableCell({ children, ...props }: any) {
  // React-markdown passes a 'node' prop that we can use to determine the tag type
  const isHeader = props.node?.tagName === "th";
  const Tag = isHeader ? "th" : "td";

  // Remove the node prop before spreading to avoid React warnings
  const { node, ...htmlProps } = props;

  return <Tag {...htmlProps}>{children}</Tag>;
}
