import { permanentRedirect } from "next/navigation";

type SignupRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupRedirectPage({
  searchParams,
}: SignupRedirectPageProps) {
  const params = await searchParams;
  const query = buildQueryString(params);

  permanentRedirect(query ? `/register?${query}` : "/register");
}

function buildQueryString(
  params: Awaited<SignupRedirectPageProps["searchParams"]>,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          query.append(key, item);
        }
      }
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  return query.toString();
}
