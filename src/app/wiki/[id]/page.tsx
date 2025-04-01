import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, ExternalLink } from 'lucide-react';
import { BlockRenderer } from '@/components/notion/BlockRenderer';
import RelatedPages from '@/components/RelatedPages';
import { getPageDetail } from '@/lib/data';

interface PageProps {
  params: {
    id: string;
  };
}

// ページデータの型定義
interface PageData {
  page: {
    id: string;
    title: string;
    category?: string;
    last_edited_time: string;
    created_time: string;
    url?: string;
  };
  blocks: any[];
  relatedPages: Array<{
    id: string;
    title: string;
    category?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const pageData = await fetchPageData(params.id);
  
  return {
    title: `${pageData?.page?.title || 'ページが見つかりません'} | FIRST Japan Wiki`,
    description: pageData?.page?.category ? `${pageData.page.category}カテゴリの記事です` : 'FIRST Program Japan Wikiのページです',
  };
}

async function fetchPageData(id: string): Promise<PageData | null> {
  // 開発環境のみダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    return {
      page: {
        id,
        title: 'FRC 2024 ルール概要（開発モード）',
        category: 'FRC',
        last_edited_time: new Date().toISOString(),
        created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1週間前
      },
      blocks: [
        {
          id: 'block1',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'これは開発モードのダミーページです。' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        }
      ],
      relatedPages: [
        { id: '2', title: 'FTC パーツリスト', category: 'FTC' },
        { id: '3', title: 'プログラミング入門', category: 'チュートリアル' }
      ]
    };
  }
  
  try {
    // 本番環境では直接Supabaseからデータを取得
    return await getPageDetail(id);
  } catch (error) {
    console.error(`ページ詳細取得エラー (ID: ${id}):`, error);
    return null;
  }
}

export default async function WikiDetailPage({ params }: PageProps) {
  const pageData = await fetchPageData(params.id);
  
  if (!pageData) {
    notFound();
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* メインコンテンツ */}
      <div className="lg:col-span-3">
        <div className="mb-6">
          <Link 
            href="/wiki" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            ウィキ一覧に戻る
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{pageData.page.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              作成: {new Date(pageData.page.created_time).toLocaleDateString('ja-JP')}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              更新: {new Date(pageData.page.last_edited_time).toLocaleDateString('ja-JP')}
            </div>
            {pageData.page.category && (
              <Link href={`/wiki?category=${encodeURIComponent(pageData.page.category)}`} className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {pageData.page.category}
              </Link>
            )}
            {pageData.page.url && (
              <a 
                href={pageData.page.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                原文を見る
              </a>
            )}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
          {/* ブロックレンダリング */}
          <div className="prose max-w-none">
            {pageData.blocks.map((block: any) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
      
      {/* サイドバー */}
      <div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6 sticky top-4">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">関連ページ</h3>
          
          <RelatedPages pages={pageData.relatedPages || []} />
          
        </div>
      </div>
    </div>
  );
} 