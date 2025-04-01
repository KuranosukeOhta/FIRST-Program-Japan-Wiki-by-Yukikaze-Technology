import Link from 'next/link';

interface RelatedPageType {
  id: string;
  title: string;
  category?: string;
}

interface RelatedPagesProps {
  pages: RelatedPageType[];
}

export default function RelatedPages({ pages }: RelatedPagesProps) {
  if (!pages || pages.length === 0) {
    return <p className="text-gray-500 text-sm">関連ページはありません</p>;
  }

  return (
    <ul className="space-y-3">
      {pages.map((page) => (
        <li key={page.id}>
          <Link 
            href={`/wiki/${page.id}`} 
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {page.title}
          </Link>
          {page.category && (
            <span className="ml-2 text-xs text-gray-500">
              {page.category}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
} 