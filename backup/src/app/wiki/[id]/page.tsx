import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, ExternalLink } from 'lucide-react';
import { BlockRenderer } from '@/components/notion/BlockRenderer';

async function getPageDetail(id: string) {
  // 本番環境ではAPI呼び出しになる
  // クライアント側の開発時はダミーデータを返す
  if (process.env.NODE_ENV === 'development') {
    // ダミーページデータ
    const dummyPage = {
      id,
      title: 'FRC 2024 ルール概要',
      category: 'FRC',
      created_time: '2024-01-10T12:00:00Z',
      last_edited_time: '2024-01-15T12:00:00Z',
    };
    
    // ダミーブロックデータ
    const dummyBlocks = [
      {
        id: 'block1',
        type: 'paragraph',
        content: {
          paragraph: {
            rich_text: [
              { plain_text: 'このページではFRC 2024のルール概要について説明します。', annotations: {} }
            ]
          }
        }
      },
      {
        id: 'block2',
        type: 'heading_1',
        content: {
          heading_1: {
            rich_text: [
              { plain_text: '競技の概要', annotations: { bold: true } }
            ]
          }
        }
      },
      {
        id: 'block3',
        type: 'paragraph',
        content: {
          paragraph: {
            rich_text: [
              { plain_text: 'FRC 2024の競技テーマは「', annotations: {} },
              { plain_text: 'CRESCENDO', annotations: { bold: true } },
              { plain_text: '」です。音楽をテーマにした競技で、ロボットが音符を集めて得点を競います。', annotations: {} }
            ]
          }
        }
      },
      {
        id: 'block4',
        type: 'heading_2',
        content: {
          heading_2: {
            rich_text: [
              { plain_text: '得点方法', annotations: {} }
            ]
          }
        }
      },
      {
        id: 'block5',
        type: 'bulleted_list_item',
        content: {
          bulleted_list_item: {
            rich_text: [
              { plain_text: '音符の収集: 1個につき2点', annotations: {} }
            ]
          }
        }
      },
      {
        id: 'block6',
        type: 'bulleted_list_item',
        content: {
          bulleted_list_item: {
            rich_text: [
              { plain_text: '音符の設置: 1個につき5点', annotations: {} }
            ]
          }
        }
      },
      {
        id: 'block7',
        type: 'bulleted_list_item',
        content: {
          bulleted_list_item: {
            rich_text: [
              { plain_text: 'ハーモニー達成: 15点', annotations: {} }
            ]
          }
        }
      },
      {
        id: 'block8',
        type: 'code',
        content: {
          code: {
            rich_text: [{ plain_text: 'totalScore = notes * 2 + placed * 5 + (harmony ? 15 : 0);', annotations: {} }],
            language: 'javascript'
          }
        }
      }
    ];
    
    // 関連ページ
    const relatedPages = [
      { id: '8', title: 'FRC 競技戦略', category: 'FRC' },
      { id: '2', title: 'FTC パーツリスト', category: 'FTC' },
      { id: '3', title: 'プログラミング入門', category: 'チュートリアル' }
    ];
    
    return {
      page: dummyPage,
      blocks: dummyBlocks,
      relatedPages
    };
  }
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/wiki/${id}`, {
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
    throw error;
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
            ページ一覧に戻る
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