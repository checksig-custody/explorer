import type { RouteLocationRaw } from 'vue-router';

// 👉 Vertical nav section title
export interface NavSectionTitle {
  heading: string;
}

// 👉 Vertical nav link
declare type ATagTargetAttrValues =
  '_blank' | '_self' | '_parent' | '_top' | 'framename';
declare type ATagRelAttrValues =
  | 'alternate'
  | 'author'
  | 'bookmark'
  | 'external'
  | 'help'
  | 'license'
  | 'next'
  | 'nofollow'
  | 'noopener'
  | 'noreferrer'
  | 'prev'
  | 'search'
  | 'tag';

export interface NavLinkProps {
  to?: RouteLocationRaw | string | null | undefined;
  href?: string | undefined;
  target?: ATagTargetAttrValues | undefined;
  rel?: ATagRelAttrValues | undefined;
  i18n?: boolean | undefined;
}

export interface Icon {
  icon?: string | undefined;
  image?: string | undefined;
  size: string;
}

export interface NavLink extends NavLinkProps {
  title: string;
  icon?: Icon | undefined;
  badgeContent?: string | number | undefined;
  badgeClass?: string | undefined;
  disable?: boolean | undefined;
  order?: number | undefined;
}

// 👉 Vertical nav group
export interface NavGroup {
  title: string;
  icon?: Icon | undefined;
  badgeContent?: string | number | undefined;
  badgeClass?: string | undefined;
  children: (NavLink | NavGroup)[];
  disable?: boolean | undefined;
  order?: number | undefined;
  i18n?: boolean | undefined;
}

export declare type VerticalNavItems = (NavLink | NavGroup | NavSectionTitle)[];
export declare type HorizontalNavItems = (NavLink | NavGroup)[];
