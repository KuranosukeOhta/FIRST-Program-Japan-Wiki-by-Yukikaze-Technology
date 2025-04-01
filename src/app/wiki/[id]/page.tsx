import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, ExternalLink } from 'lucide-react';
import { BlockRenderer } from '@/components/notion/BlockRenderer';

async function getPageDetail(id: string) {
  // 開発環境のみダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    return {
      page: {
        id,
        title: `Wiki ページ ${id}`,
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
                text: { content: 'これはダミーのWikiページです。' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        },
        {
          id: 'block2',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: '見出し' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        },
        {
          id: 'block3',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'このページは開発環境用のダミーデータです。' },
                annotations: { bold: false, italic: false, underline: false }
              }
            ]
          }
        }
      ],
      relatedPages: []
    };
  }
  
  try {
    // ベースURLが設定されていない場合はダミーデータを返す
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.warn('NEXT_PUBLIC_BASE_URL が設定されていません。ダミーデータを使用します。');
      // 開発モードのダミーデータを返す
      return getPageDetail(id);
    }
    
    // 完全なURLを使用
    const res = await fetch(`${baseUrl}/api/wiki/${id}`, {
      next: { revalidate: 60 } // 1分ごとに再検証
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return notFound();
      }
      throw new Error('ページの取得に失敗しました');
    }
    
    return await res.json();
  } catch (error) {
    console.error('APIエラー:', error);
    // エラー時はダミーデータを返す
    return {
      page: {
        id,
        title: `Page ${id}`,
        category: 'エラー',
        last_edited_time: new Date().toISOString(),
        created_time: new Date().toISOString()
      },
      blocks: [],
      relatedPages: []
    };
  }
}

export default async function WikiDetailPage({ params }: { params: { id: string } }) {
  const { page, blocks, relatedPages } = await getPageDetail(params.id);
  
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
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{page.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              作成: {new Date(page.created_time).toLocaleDateString('ja-JP')}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              更新: {new Date(page.last_edited_time).toLocaleDateString('ja-JP')}
            </div>
            {page.category && (
              <Link href={`/wiki?category=${encodeURIComponent(page.category)}`} className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                {page.category}
              </Link>
            )}
            {page.url && (
              <a 
                href={page.url} 
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
            {blocks.map((block: any) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
      
      {/* サイドバー */}
      <div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-6 sticky top-4">
          <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">関連ページ</h3>
          
          {relatedPages && relatedPages.length > 0 ? (
            <ul className="space-y-3">
              {relatedPages.map((relatedPage: any) => (
                <li key={relatedPage.id}>
                  <Link 
                    href={`/wiki/${relatedPage.id}`} 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {relatedPage.title}
                  </Link>
                  {relatedPage.category && (
                    <span className="ml-2 text-xs text-gray-500">
                      {relatedPage.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">関連ページはありません</p>
          )}
        </div>
      </div>
    </div>
  );
} 