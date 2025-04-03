const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .envファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// バックアップとして.envも読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 環境変数を正規化（Next.jsとの互換性のため）
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_AUTH_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 環境変数を表示
console.log('環境変数:');
console.log('NOTION_API_KEY:', NOTION_API_KEY ? '設定されています' : '設定されていません');
console.log('NOTION_DATABASE_ID:', NOTION_DATABASE_ID ? '設定されています' : '設定されていません');
console.log('SUPABASE_URL:', SUPABASE_URL ? '設定されています' : '設定されていません');
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '設定されています' : '設定されていません');

// APIキーが設定されていなければ終了
if (!NOTION_API_KEY) {
  console.error('NOTION_API_KEYが設定されていません。');
  process.exit(1);
}

// データベースIDが設定されていなければ終了
if (!NOTION_DATABASE_ID) {
  console.error('NOTION_DATABASE_IDが設定されていません。');
  process.exit(1);
}

// Supabase認証情報が設定されていなければ終了
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabaseの認証情報が設定されていません。');
  process.exit(1);
}

// axiosによるNotion APIアクセス関数
async function fetchDatabase(databaseId) {
  return axios({
    method: 'get',
    url: `https://api.notion.com/v1/databases/${databaseId}`,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    }
  });
}

async function queryDatabase(databaseId) {
  return axios({
    method: 'post',
    url: `https://api.notion.com/v1/databases/${databaseId}/query`,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });
}

async function fetchBlockChildren(blockId) {
  return axios({
    method: 'get',
    url: `https://api.notion.com/v1/blocks/${blockId}/children`,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    }
  });
}

// タイトル抽出ヘルパー関数
function extractTitle(page) {
  try {
    // タイトルプロパティを抽出
    if (!page.properties) {
      return '無題';
    }
    
    // プロパティからタイトルを探す
    const titleProp = Object.values(page.properties).find(
      (prop) => prop.type === 'title'
    );
    
    if (titleProp?.title?.[0]?.plain_text) {
      return titleProp.title[0].plain_text;
    }
    
    return '無題';
  } catch (error) {
    console.error('タイトル抽出エラー:', error);
    return '無題';
  }
}

// カテゴリー抽出ヘルパー関数
function extractCategory(page) {
  try {
    // プロパティがない場合は空文字を返す
    if (!page.properties) {
      return '';
    }
    
    // カテゴリープロパティを抽出
    const categoryProp = page.properties.Category || page.properties.カテゴリー;
    
    if (categoryProp?.select?.name) {
      return categoryProp.select.name;
    }
    
    return '';
  } catch (error) {
    console.error('カテゴリ抽出エラー:', error);
    return '';
  }
}

// メイン同期処理
async function syncNotionToSupabase() {
  try {
    // Supabaseクライアントを初期化
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
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
    console.log(`Notionデータベース(${NOTION_DATABASE_ID})からページ一覧を取得中...`);
    
    const pagesResponse = await queryDatabase(NOTION_DATABASE_ID);
    const pages = pagesResponse.data.results;
    
    let pagesCount = 0;
    let blocksCount = 0;
    const errors = [];
    
    console.log(`${pages.length}ページを処理します...`);
    
    // 各ページを処理
    for (const page of pages) {
      try {
        console.log(`ページ処理中: ${page.id}`);
        
        // ページオブジェクトがpageタイプであるか確認
        if (page.object !== 'page') {
          console.error(`不正なページオブジェクト: ${page.id}`);
          errors.push({ id: page.id, error: '不正なページオブジェクト', type: 'page' });
          continue;
        }
        
        // ページデータをSupabaseに保存
        const pageData = {
          id: page.id,
          title: extractTitle(page),
          category: extractCategory(page),
          last_synced_at: new Date().toISOString(),
          raw_data: page,
          properties: page.properties || {},
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
        console.log(`ブロックデータ取得中: ${page.id}`);
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
          const block = blocks[i];
          
          // ブロックデータをSupabaseに保存
          const blockData = {
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
        
        console.log(`ページ完了: ${page.id} (${blocks.length}ブロック)`);
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
    
    console.log('同期完了:');
    console.log(`- ページ数: ${pagesCount}`);
    console.log(`- ブロック数: ${blocksCount}`);
    console.log(`- エラー数: ${errors.length}`);
    
    return {
      success: true,
      pagesCount,
      blocksCount,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('同期エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// スクリプト実行
syncNotionToSupabase()
  .then(result => {
    if (result.success) {
      console.log('同期が成功しました！');
    } else {
      console.error('同期に失敗しました:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('予期せぬエラーが発生しました:', error);
    process.exit(1);
  }); 