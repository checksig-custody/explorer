// daisyui ships no types for its theme table.
declare module 'daisyui/src/theming/themes' {
  const themes: Record<string, Record<string, string>>;
  export default themes;
}
