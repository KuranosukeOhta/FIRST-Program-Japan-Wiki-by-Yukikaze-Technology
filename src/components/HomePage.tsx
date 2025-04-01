import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Bookmark, Tag, ArrowRight } from 'lucide-react';

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  last_edited_time: string;
}

interface NotionData {
  results: NotionPage[];
}

interface Category {
  name: string;
  pages: NotionPage[];
}

function HomePage() {
  const [recentPages, setRecentPages] = useState<NotionPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 全ページを取得
        const pagesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notion`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!pagesResponse.ok) {
          throw new Error('ページデータの取得に失敗しました');
        }

        const pagesData: NotionData = await pagesResponse.json();
        
        // 最近更新されたページ
        const sortedByEditTime = [...pagesData.results].sort(
          (a, b) => new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime()
        );
        setRecentPages(sortedByEditTime.slice(0, 5));
        
        // カテゴリー別にページを整理
        const categoryMap = new Map<string, NotionPage[]>();
        
        pagesData.results.forEach(page => {
          const category = getPageCategory(page);
          if (category) {
            if (!categoryMap.has(category)) {
              categoryMap.set(category, []);
            }
            categoryMap.get(category)?.push(page);
          }
        });
        
        const categoryArray: Category[] = [];
        categoryMap.forEach((pages, name) => {
          categoryArray.push({ name, pages: pages.slice(0, 5) });
        });
        
        setCategories(categoryArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPageTitle = (page: NotionPage) => {
    // page.propertiesが存在するか確認
    if (!page.properties) return 'Untitled';

    const titleProperty = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    );
    
    if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
      return titleProperty.title[0].plain_text;
    }
    
    return 'Untitled';
  };

  // カテゴリーを取得する関数
  const getPageCategory = (page: NotionPage): string | null => {
    // page.propertiesが存在するか確認
    if (!page.properties) return null;

    // 既存のプロパティ名でチェック
    const categoryProperty = page.properties.Category || page.properties.カテゴリー;
    if (categoryProperty?.select?.name) {
      return categoryProperty.select.name;
    }
    
    // プロパティを走査してselectタイプを探す
    for (const prop of Object.values(page.properties)) {
      if ((prop as any).type === 'select' && (prop as any).select?.name) {
        return (prop as any).select.name;
      }
    }
    
    // multi_selectの場合は最初の値を返す
    for (const prop of Object.values(page.properties)) {
      if ((prop as any).type === 'multi_select' && (prop as any).multi_select?.length > 0) {
        return (prop as any).multi_select[0].name;
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">エラー:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">FIRST Program Japan Wiki</h1>
          <p className="text-lg mb-6">
            FIRST Programに関する情報を収集し、共有するためのウィキサイトです。
            ロボティクスプログラムに関する知識、競技ルール、イベント情報などを見つけることができます。
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/wiki"
              className="bg-white text-indigo-600 hover:bg-gray-100 px-5 py-2 rounded-md font-medium flex items-center"
            >
              <Bookmark className="w-5 h-5 mr-2" />
              すべてのページを見る
            </Link>
            <Link
              href="/about"
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded-md font-medium"
            >
              このWikiについて
            </Link>
          </div>
        </div>
      </section>

      {/* 最近更新されたページ */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" />
            最近の更新
          </h2>
          <Link
            href="/wiki"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
          >
            すべて見る
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentPages.length > 0 ? (
            recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/wiki/${page.id}`}
                className="block p-3 hover:bg-gray-50 rounded-md border border-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">{getPageTitle(page)}</div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <span className="mr-3">
                    最終更新: {formatDate(page.last_edited_time)}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-gray-500 text-sm py-4">最近更新されたページがありません</div>
          )}
        </div>
      </section>

      {/* カテゴリー別ページ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <section key={category.name} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-indigo-500" />
                {category.name}
              </h2>
              <Link
                href={`/category/${encodeURIComponent(category.name)}`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                このカテゴリを見る
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2">
              {category.pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/wiki/${page.id}`}
                  className="block p-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="font-medium text-gray-900">{getPageTitle(page)}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default HomePage; 