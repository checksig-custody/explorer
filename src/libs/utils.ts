export function getLocalObject(name: string): unknown {
  const text = localStorage.getItem(name);
  if (text) {
    return JSON.parse(text) as unknown;
  }
  return null;
}

export function getLocalChains() {
  return 'osmosis';
}

export const percent = (num: number) => {
  return parseFloat((num * 100).toFixed(2));
};

export function stringToUint8Array(str: string) {
  const arr = [];
  for (let i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }
  return new Uint8Array(arr);
}

export function uint8ArrayToString(arr: Uint8Array) {
  let str = '';
  for (let i = 0, j = arr.length; i < j; ++i) {
    str += String.fromCharCode(arr[i] ?? 0);
  }
  return str;
}

const COUNT_ABBRS = ['', 'K', 'M', 'B', 't', 'q', 's', 'S', 'o', 'n', 'd', 'U', 'D', 'T', 'Qt', 'Qd', 'Sd', 'St'];

export function formatNumber(count: number, withAbbr = false, decimals = 2) {
  const i = count === 0 ? count : Math.floor(Math.log(count) / Math.log(1000));
  const value = parseFloat((count / 1000 ** i).toFixed(decimals));
  const abbr = COUNT_ABBRS[i];
  if (withAbbr && abbr) {
    return `${String(value)}${abbr}`;
  }
  return value;
}

export function formatTokenAmount(
  assets: { base: string; exponent: number }[],
  tokenAmount: string | number,
  decimals = 2,
  tokenDenom: string | { denom_trace?: { base_denom?: string } } = 'uatom',
  format = true
) {
  const denom = typeof tokenDenom === 'string' ? tokenDenom : tokenDenom.denom_trace?.base_denom;
  const asset = assets.find((a) => a.base === denom);
  const exp = asset ? asset.exponent : String(denom).startsWith('gravity') ? 18 : 6;

  const amount = Number(tokenAmount) / 10 ** exp;
  if (amount > 10) {
    if (format) {
      return numberWithCommas(parseFloat(amount.toFixed(decimals)));
    }
    return parseFloat(amount.toFixed(decimals));
  }
  return parseFloat(amount.toFixed(exp));
}

export function numberWithCommas(x: number | string) {
  const parts = x.toString().split('.');
  parts[0] = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function isToken(value: object | object[]) {
  if (Array.isArray(value)) {
    return value.some((x: object) => Object.keys(x).includes('denom'));
  }
  return Object.keys(value).includes('denom');
}
export function isStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.some((x) => typeof x === 'string');
  }
  return false;
}

export function isHexAddress(v: string) {
  // const re = /^[A-Z\d]{40}$/
  // return re.test(v)
  return v.length === 28;
}

export function isBech32Address(v?: string) {
  if (!v) return '';
  const pattern = /^[a-z\d]+1[a-z\d]{38}$/g;
  return v.search(pattern) > -1;
}

export function formatSeconds(value?: string) {
  if (!value) return '';
  const duration = Number(value.replace(/s/, ''));
  if (duration > 24 * 60 * 60) {
    return `${(duration / (24 * 60 * 60)).toFixed()} days`;
  }
  if (duration > 60 * 60) {
    return `${(duration / (60 * 60)).toFixed()} hours`;
  }
  if (duration > 60) {
    return `${String(duration / 60)} mins`;
  }
  return value;
}

export function hexToRgb(hex: string) {
  // remove '#'
  hex = hex.replace('#', '');
  // red
  const r = parseInt(hex.substring(0, 2), 16);
  // green
  const g = parseInt(hex.substring(2, 4), 16);
  // blue
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    color: `rgb(${String(r)}, ${String(g)}, ${String(b)})`,
    r,
    g,
    b,
  };
}

export function rgbToHsl(color: string) {
  color = color.replace('rgb(', '');
  color = color.replace(')', '');
  const colorList = color.split(',');
  // console.log(colorList, 'colorList')
  const r = parseInt(colorList[0] ?? '') / 255;
  const g = parseInt(colorList[1] ?? '') / 255;
  const b = parseInt(colorList[2] ?? '') / 255;
  // console.log(r,g,b, '88')
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s: number,
    l = (max + min) / 2;

  if (max == min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h / 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return {
    color: `hsl(${String(h)}, ${String(s)}%, ${String(l)}%)`,
    value: `${String(h)} ${String(s)} ${String(l)}`,
    h,
    s,
    l,
  };
}
