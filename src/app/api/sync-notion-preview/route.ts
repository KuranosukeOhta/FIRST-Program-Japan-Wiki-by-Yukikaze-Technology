import { NextResponse } from 'next/server';
import { extractTitle, extractCategory, extractAuthors, extractStatus, isPublished, getNotionPageUrl } from '@/lib/notion';
import { createSupabaseAdmin } from '@/lib/supabase';
import { 
  PageObjectResponse, 
  PartialPageObjectResponse,
  BlockObjectResponse,
  PartialBlockObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import axios from 'axios';

// axiosによるNotion APIアクセス関数
async function fetchDatabase(databaseId: string) {
  return axios({
    method: 'get',
    url: `https://api.notion.com/v1/databases/${databaseId}`,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    }
  });
}

// ページング処理を含むデータベースクエリ関数
async function queryDatabase(databaseId: string, startCursor?: string, pageSize: number = 10) {
  const body: any = {
    page_size: pageSize
  };
  
  if (startCursor) {
    body.start_cursor = startCursor;
  }
  
  return axios({
    method: 'post',
    url: `https://api.notion.com/v1/databases/${databaseId}/query`,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    data: body
  });
}

async function fetchBlockChildren(blockId: string) {
  return axios({
    method: 'get',
    url: `https://api.notion.com/v1/blocks/${blockId}/children`,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    }
  });
}

interface SyncParams {
  publishedOnly?: boolean;
  pageSize?: number;
  maxPages?: number; // 処理する最大ページ数（バッチ処理のため）
  startCursor?: string;
  debugLog?: boolean;
}

// NotionのAPIからのレスポンスに対応する型
interface NotionPage {
  id: string;
  object: string;
  properties: any;
  created_time?: string;
  last_edited_time?: string;
  has_children?: boolean;
  type?: string;
  [key: string]: any;
}

interface NotionBlock {
  id: string;
  object: string;
  type: string;
  has_children: boolean;
  created_time?: string;
  last_edited_time?: string;
  [key: string]: any;
}

export async function POST(request: Request) {
  // リクエストパラメータの取得
  let params: SyncParams = {};
  try {
    const body = await request.json();
    params = body;
  } catch (e) {
    // ボディがない場合はデフォルト値を使用
    params = {
      publishedOnly: false, // プレビュー版は全てのページを同期
      pageSize: 10,
      maxPages: undefined, // 制限なし
      debugLog: true
    };
  }
  
  // 認証チェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SYNC_API_SECRET}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  
  try {
    // Supabaseクライアントを初期化
    const supabase = createSupabaseAdmin();
    
    // 同期ステータスレコードを作成
    const { data: syncStatus, error: syncError } = await supabase
      .from('notion_sync_status')
      .insert([{ 
        last_sync_time: new Date().toISOString(),
        status: 'running',
        pages_synced: 0,
        blocks_synced: 0
      }])
      .select()
      .single();
    
    if (syncError) {
      console.error('同期ステータス作成エラー:', syncError);
    }
    
    const syncId = syncStatus?.id;
    
    // 同期前にnotion_blocksとnotion_pagesテーブルのデータを削除
    console.log('データベースのテーブルをクリアしています...');
    
    // notion_blocksのデータを削除
    const { error: blocksDeleteError } = await supabase
      .from('notion_blocks')
      .delete()
      .neq('id', 'dummy'); // 全レコード削除のためのダミー条件
    
    if (blocksDeleteError) {
      console.error('notion_blocksテーブル削除エラー:', blocksDeleteError);
    } else {
      console.log('notion_blocksテーブルをクリアしました');
    }
    
    // notion_pagesのデータを削除
    const { error: pagesDeleteError } = await supabase
      .from('notion_pages')
      .delete()
      .neq('id', 'dummy'); // 全レコード削除のためのダミー条件
    
    if (pagesDeleteError) {
      console.error('notion_pagesテーブル削除エラー:', pagesDeleteError);
    } else {
      console.log('notion_pagesテーブルをクリアしました');
    }
    
    // Notionデータベースからページ一覧を取得
    const databaseId = process.env.NOTION_DATABASE_ID as string;
    console.log(`Notionデータベース(${databaseId})からページ一覧を取得中...`);
    
    let startCursor = params.startCursor;
    let hasMore = true;
    let processedPages = 0;
    let totalPages = 0;
    let totalPagesFetched = 0;
    
    let pagesCount = 0;
    let blocksCount = 0;
    const errors: any[] = [];
    
    // ページを取得して処理するループ
    while (hasMore && (!params.maxPages || processedPages < params.maxPages)) {
      const pageSize = params.pageSize || 10;
      const pagesResponse = await queryDatabase(databaseId, startCursor, pageSize);
      const pages = pagesResponse.data.results;
      const nextCursor = pagesResponse.data.next_cursor;
      hasMore = pagesResponse.data.has_more;
      startCursor = nextCursor;
      
      totalPagesFetched += pages.length;
      
      // この取得したページバッチのログ
      console.log(`${pages.length}ページを取得しました (合計 ${totalPagesFetched}ページ)...`);
      
      // プレビュー版は全てのページを同期（フィルタリングなし）
      const filteredPages = pages;
      
      console.log(`プレビュー版: ${filteredPages.length}ページを全て同期します（ステータスによるフィルタリングなし）`);
      
      totalPages += filteredPages.length;
      
      // 各ページを処理
      for (const page of filteredPages as NotionPage[]) {
        try {
          processedPages++;
          const pageTitle = extractTitle(page);
          const pageUrl = getNotionPageUrl(page.id);
          
          if (params.debugLog) {
            console.log(`ページ処理中 (${processedPages}/${totalPages}): ${pageTitle}`);
            console.log(`- ID: ${page.id}`);
            console.log(`- URL: ${pageUrl}`);
          } else {
            console.log(`ページ処理中: ${page.id} - ${pageTitle}`);
          }
          
          // ページオブジェクトがpageタイプであるか確認
          if (page.object !== 'page') {
            console.error(`不正なページオブジェクト: ${page.id}`);
            errors.push({ id: page.id, error: '不正なページオブジェクト', type: 'page' });
            continue;
          }
          
          // プロパティをすべて抽出
          const pageCategory = extractCategory(page);
          const pageAuthors = extractAuthors(page);
          const pageStatus = extractStatus(page);
          
          // ページデータをSupabaseに保存
          const pageData: {
            id: string;
            title: string;
            category: string;
            authors: string[];
            status: string;
            last_synced_at: string;
            raw_data: any;
            properties: any;
            created_time?: string;
            last_edited_time?: string;
            notion_url: string;
            [key: string]: any;
          } = {
            id: page.id,
            title: pageTitle,
            category: pageCategory,
            authors: pageAuthors,
            status: pageStatus,
            last_synced_at: new Date().toISOString(),
            raw_data: page,
            properties: page.properties || {},
            notion_url: pageUrl
          };
          
          // 存在する場合のみプロパティを追加
          if (page.created_time) {
            pageData.created_time = page.created_time;
          }
          
          if (page.last_edited_time) {
            pageData.last_edited_time = page.last_edited_time;
          }
          
          const { error: pageError } = await supabase
            .from('notion_pages')
            .upsert(pageData);
          
          if (pageError) {
            console.error(`ページ保存エラー(${page.id}):`, pageError);
            errors.push({ id: page.id, error: pageError.message, type: 'page' });
            continue;
          }
          
          pagesCount++;
          
          // ページのブロック（コンテンツ）を取得
          if (params.debugLog) {
            console.log(`ブロックデータ取得中: ${page.id} (${pageTitle})`);
          } else {
            console.log(`ブロックデータ取得中: ${page.id}`);
          }
          
          const blocksResponse = await fetchBlockChildren(page.id);
          const blocks = blocksResponse.data.results;
          
          // 既存のブロックを削除（クリーンアップ）
          const { error: deleteError } = await supabase
            .from('notion_blocks')
            .delete()
            .eq('page_id', page.id);
          
          if (deleteError) {
            console.error(`ブロック削除エラー(${page.id}):`, deleteError);
          }
          
          // 新しいブロックを挿入
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i] as NotionBlock;
            
            // 進捗状況ログ（多数のブロックがある場合）
            if (params.debugLog && blocks.length > 20 && i % 20 === 0) {
              console.log(`  - ブロック処理中: ${i+1}/${blocks.length}`);
            }
            
            // ブロックデータをSupabaseに保存
            const blockData: {
              id: string;
              page_id: string;
              type: string;
              content: any;
              has_children: boolean;
              sort_order: number;
              last_synced_at: string;
              created_time?: string;
              last_edited_time?: string;
              [key: string]: any;
            } = {
              id: block.id,
              page_id: page.id,
              type: block.type || 'unknown',
              content: block,
              has_children: block.has_children || false,
              sort_order: i,
              last_synced_at: new Date().toISOString()
            };
            
            // 存在する場合のみプロパティを追加
            if (block.created_time) {
              blockData.created_time = block.created_time;
            }
            
            if (block.last_edited_time) {
              blockData.last_edited_time = block.last_edited_time;
            }
            
            const { error: blockError } = await supabase
              .from('notion_blocks')
              .insert(blockData);
            
            if (blockError) {
              console.error(`ブロック保存エラー(${block.id}):`, blockError);
              errors.push({ id: block.id, error: blockError.message, type: 'block' });
              continue;
            }
            
            blocksCount++;
          }
          
          if (params.debugLog) {
            console.log(`ページ完了: ${page.id} - "${pageTitle}" (${blocks.length}ブロック) [${processedPages}/${totalPages}]`);
            // 進捗率を計算して表示（合計ページ数が判明している場合）
            if (totalPagesFetched > 0) {
              const progressPercent = Math.round((processedPages / totalPagesFetched) * 100);
              console.log(`全体の進捗: ${progressPercent}% (${processedPages}/${totalPagesFetched}ページ)`);
            }
          } else {
            console.log(`ページ完了: ${page.id} (${blocks.length}ブロック)`);
          }
        } catch (pageError: any) {
          console.error(`ページ処理エラー(${page.id}):`, pageError);
          errors.push({ id: page.id, error: pageError.message, type: 'page_process' });
        }
      }
      
      // 最大ページ数に達した、またはこれ以上ページがない場合はループを終了
      if (!hasMore || (params.maxPages && processedPages >= params.maxPages)) {
        break;
      }
    }
    
    // 次のカーソルがある場合（まだページが残っている場合）のログ
    if (hasMore) {
      console.log(`まだ処理していないページがあります。next_cursor: ${startCursor}`);
    }
    
    // 同期ステータスを更新
    if (syncId) {
      await supabase
        .from('notion_sync_status')
        .update({
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          pages_synced: pagesCount,
          blocks_synced: blocksCount,
          error_message: errors.length > 0 ? JSON.stringify(errors) : null
        })
        .eq('id', syncId);
    }
    
    return NextResponse.json({
      success: true,
      pagesCount,
      blocksCount,
      totalPagesFetched,
      processedPages,
      hasMorePages: hasMore,
      nextCursor: startCursor,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error: any) {
    console.error('同期エラー:', error);
    
    return NextResponse.json({
      error: 'データ同期中にエラーが発生しました',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 