'use client';

// "Download as PDF" (plan F6.4): the browser's print dialog, where "Save as PDF" is one of the
// choices. The print style (globals.css, print: classes) turns the page into a clean A4 guide.
export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()}
      className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-s2 print:hidden">
      {label}
    </button>
  );
}
