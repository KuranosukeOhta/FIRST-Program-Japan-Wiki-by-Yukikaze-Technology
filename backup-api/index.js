// Express APIサーバー
import express from 'express';
import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// CORSヘッダーの設定
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// シンプルなテスト用APIエンドポイント
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: 'Hello World! APIが正常に動作しています。', 
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });
});

// Notion同期API
app.post('/api/sync-notion', async (req, res) => {
  // 環境変数から認証情報を取得
  const notion = new Client({ 
    auth: process.env.NOTION_API_KEY 
  });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // リクエスト認証チェック
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.SYNC_API_SECRET}`) {
    return res.status(401).json({ error: '認証エラー' });
  }
  
  try {
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
    
    // Notionデータベースからページ一覧を取得
    const databaseId = process.env.NOTION_DATABASE_ID;
    console.log(`Notionデータベース(${databaseId})からページ一覧を取得中...`);
    
    const pages = await notion.databases.query({
      database_id: databaseId,
    });
    
    let pagesCount = 0;
    let blocksCount = 0;
    const errors = [];
    
    console.log(`${pages.results.length}ページを処理します...`);
    
    // 各ページを処理
    for (const page of pages.results) {
      try {
        console.log(`ページ処理中: ${page.id}`);
        
        // ページデータをSupabaseに保存
        const { error: pageError } = await supabase
          .from('notion_pages')
          .upsert({
            id: page.id,
            title: extractTitle(page),
            category: extractCategory(page),
            created_time: page.created_time,
            last_edited_time: page.last_edited_time,
            properties: page.properties,
            raw_data: page,
            last_synced_at: new Date().toISOString()
          });
        
        if (pageError) {
          console.error(`ページ保存エラー(${page.id}):`, pageError);
          errors.push({ id: page.id, error: pageError.message, type: 'page' });
          continue;
        }
        
        pagesCount++;
        
        // ページのブロック（コンテンツ）を取得
        console.log(`ブロックデータ取得中: ${page.id}`);
        const blocks = await notion.blocks.children.list({
          block_id: page.id,
        });
        
        // 既存のブロックを削除（クリーンアップ）
        const { error: deleteError } = await supabase
          .from('notion_blocks')
          .delete()
          .eq('page_id', page.id);
        
        if (deleteError) {
          console.error(`ブロック削除エラー(${page.id}):`, deleteError);
        }
        
        // 新しいブロックを挿入
        for (let i = 0; i < blocks.results.length; i++) {
          const block = blocks.results[i];
          const { error: blockError } = await supabase
            .from('notion_blocks')
            .insert({
              id: block.id,
              page_id: page.id,
              type: block.type,
              content: block,
              has_children: 'has_children' in block ? block.has_children : false,
              sort_order: i,
              created_time: block.created_time,
              last_edited_time: block.last_edited_time,
              last_synced_at: new Date().toISOString()
            });
          
          if (blockError) {
            console.error(`ブロック保存エラー(${block.id}):`, blockError);
            errors.push({ id: block.id, error: blockError.message, type: 'block' });
            continue;
          }
          
          blocksCount++;
        }
        
        console.log(`ページ完了: ${page.id} (${blocks.results.length}ブロック)`);
      } catch (pageError) {
        console.error(`ページ処理エラー(${page.id}):`, pageError);
        errors.push({ id: page.id, error: pageError.message, type: 'page_process' });
      }
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
    
    return res.status(200).json({
      success: true,
      pagesCount,
      blocksCount,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('同期エラー:', error);
    
    // エラー状態を記録
    if (syncStatus?.id) {
      await supabase
        .from('notion_sync_status')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', syncStatus.id);
    }
    
    return res.status(500).json({
      error: 'データ同期中にエラーが発生しました',
      details: error.message
    });
  }
});

// ヘルパー関数
function extractTitle(page) {
  // タイトルプロパティを抽出（Notionの仕様に合わせて調整）
  const titleProp = Object.values(page.properties).find(
    (prop) => prop.type === 'title'
  );
  
  if (titleProp?.title?.[0]?.plain_text) {
    return titleProp.title[0].plain_text;
  }
  
  return '無題';
}

function extractCategory(page) {
  // カテゴリープロパティを抽出（実際のプロパティ名に合わせて調整）
  const categoryProp = page.properties.Category || page.properties.カテゴリー;
  
  if (categoryProp?.select?.name) {
    return categoryProp.select.name;
  }
  
  return '';
}

// Vercel Serverless Functions用のエクスポート
export default app; 