"use client";

import { useI18n } from "@/components/i18n/language-provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LocalizedItems = {
  fallbackItems: string[];
  zhItems: string[];
  enItems: string[];
};

function useLocalizedItems({ fallbackItems, zhItems, enItems }: LocalizedItems) {
  const { language } = useI18n();

  if (language === "zh") {
    return zhItems.length ? zhItems : fallbackItems;
  }

  return enItems.length ? enItems : fallbackItems;
}

export function LocalizedScoreSummary({
  fallbackItems,
  zhItems,
  enItems,
}: LocalizedItems) {
  const items = useLocalizedItems({ fallbackItems, zhItems, enItems });

  if (!items.length) {
    return null;
  }

  return (
    <Card className="mt-4 border-sky-100 bg-sky-50/60">
      <CardHeader>
        <CardTitle>
          <LocalizedText k="result.scoreSummary" fallback="Score summary" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function LocalizedFeedbackList({
  title,
  titleKey,
  fallbackItems,
  zhItems,
  enItems,
}: LocalizedItems & {
  title: string;
  titleKey?: string;
}) {
  const items = useLocalizedItems({ fallbackItems, zhItems, enItems });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {titleKey ? <LocalizedText k={titleKey} fallback={title} /> : title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-2 text-sm leading-6 text-slate-700">
            {items.map((item) => (
              <li key={item} className="rounded-md bg-slate-50 p-3">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            <LocalizedText k="result.noItems" fallback="No items returned." />
          </p>
        )}
      </CardContent>
    </Card>
  );
}
