// Panel sayfalarının ortak çerçevesi: başlık, açıklama, sağda işlem düğmesi.
export default function PageContainer({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-8 md:px-6 md:pt-4">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}
