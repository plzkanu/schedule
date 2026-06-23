"use client";

interface GanttTaskHeaderProps {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
}

export function GanttTaskHeader({
  headerHeight,
  rowWidth,
  fontFamily,
  fontSize,
}: GanttTaskHeaderProps) {
  return (
    <div
      className="flex items-end border-b border-r border-slate-200 bg-slate-50 px-3 pb-2.5 text-xs font-semibold text-slate-500"
      style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}
    >
      태스크
    </div>
  );
}
