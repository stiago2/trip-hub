const FALLBACK_GRADIENTS: string[] = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #fda085 0%, #f6d365 100%)',
  'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
];

/**
 * Returns a CSS `background` value that layers a real city photo over a
 * gradient fallback. Uses loremflickr.com (free, no API key required).
 * The `lock` param makes the image deterministic per city name.
 * If the image fails to load the browser automatically shows the gradient
 * (native CSS multi-layer behaviour — no JS needed).
 */
export function destinationPhotoBg(city: string): string {
  const seed = [...city].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const url = `https://loremflickr.com/800/480/${encodeURIComponent(city)},travel?lock=${seed}`;
  const fallback = FALLBACK_GRADIENTS[seed % FALLBACK_GRADIENTS.length];
  return `url(${url}) center/cover, ${fallback}`;
}
