import Image from 'next/image';

/** Logo SonarExtractor (blanc) — à utiliser uniquement sur fond sombre */
export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const heights = { sm: 64, md: 88, lg: 110, xl: 140 };
  const h = heights[size];
  return (
    <Image
      src="/logo.svg"
      alt="SonarExtractor"
      width={h * 3.5}
      height={h}
      className="object-contain"
      priority
    />
  );
}
