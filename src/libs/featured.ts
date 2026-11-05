export interface FeaturedInfo {
  website?: string;
  moniker: string;
}

// Whether a validator is run by one of the endpoint providers: its website
// ends with the provider, or its moniker contains it. A node may omit the
// moniker, so it is read only when the website did not match, as on master.
export function isFeatured(endpoints: string[], who?: FeaturedInfo) {
  if (!who) return false;
  return (
    endpoints.findIndex((x) => {
      const site = who.website;
      if (site?.substring(0, site.lastIndexOf('.')).endsWith(x)) return true;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- a node may omit the moniker the types call required
      return (who.moniker?.toLowerCase().search(x.toLowerCase()) ?? -1) > -1;
    }) > -1
  );
}
