import { LocalizedText } from "@/components/i18n/localized-text";
import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow?: string;
  eyebrowKey?: string;
  title: string;
  titleKey?: string;
  description: string;
  descriptionKey?: string;
};

export function PageHeader({
  eyebrow,
  eyebrowKey,
  title,
  titleKey,
  description,
  descriptionKey,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <Badge className="mb-4">
          {eyebrowKey ? (
            <LocalizedText k={eyebrowKey} fallback={eyebrow} />
          ) : (
            eyebrow
          )}
        </Badge>
      ) : null}
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {titleKey ? <LocalizedText k={titleKey} fallback={title} /> : title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        {descriptionKey ? (
          <LocalizedText k={descriptionKey} fallback={description} />
        ) : (
          description
        )}
      </p>
    </div>
  );
}
