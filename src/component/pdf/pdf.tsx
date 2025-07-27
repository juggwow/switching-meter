"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function PDFComponent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = ()=>{};

  return (
    <div>
      <button onClick={reactToPrintFn}>Print</button>
      <div ref={contentRef} className="hidden">Content to print</div>
    </div>
  );
}
