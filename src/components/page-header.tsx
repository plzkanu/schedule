import { PageBreadcrumb, type BreadcrumbItem } from "@/components/page-breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb ? (
          <PageBreadcrumb items={breadcrumb} className="mb-3" />
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
