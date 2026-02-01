'use client';

interface MockResultsProps {
  isVisible: boolean;
  searchQuery: { metier: string; ville: string };
}

// Ce composant n'est plus utilisé car les résultats sont affichés directement dans page.tsx
// Mais on le garde pour compatibilité avec l'import
export default function MockResults({ isVisible, searchQuery }: MockResultsProps) {
  return null;
}
