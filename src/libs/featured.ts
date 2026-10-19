// value, or fallback when value is falsy: `||` with the types checked. It is
// not orDefault from utils because the node test runs this file without the
// `@/` alias.
function orDefault<T, F>(value: T | undefined, fallback: F): T | F {
  if (value) return value;
  return fallback;
}

export interface FeaturedInfo {
  website?: string;
  moniker: string;
}

// Whether a validator is run by one of the endpoint providers: its website
// ends with the provider, or its moniker contains it.
export function isFeatured(endpoints: string[], who?: FeaturedInfo) {
  if (!who) return false;
  return (
    endpoints.findIndex((x) =>
      orDefault(
        who.website?.substring(0, who.website.lastIndexOf('.')).endsWith(x),
        who.moniker.toLowerCase().search(x.toLowerCase()) > -1
      )
    ) > -1
  );
}
