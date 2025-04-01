import { NextResponse } from 'next/server';
import { createNotionClient, extractTitle, extractCategory } from '@/lib/notion';
import { createSupabaseAdmin } from '@/lib/supabase';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export async function POST(request: Request) {
  // 認証チェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SYNC_API_SECRET}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }
  
  try {
    // Notion APIとSupabaseクライアントを初期化
    const notion = createNotionClient();
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
    
    // Notionデータベースからページ一覧を取得
    const databaseId = process.env.NOTION_DATABASE_ID;
    console.log(`Notionデータベース(${databaseId})からページ一覧を取得中...`);
    
    const pages = await notion.databases.query({
      database_id: databaseId as string,
    });
    
    let pagesCount = 0;
    let blocksCount = 0;
    const errors: any[] = [];
    
    console.log(`${pages.results.length}ページを処理します...`);
    
    // 各ページを処理
    for (const page of pages.results) {
      try {
        console.log(`ページ処理中: ${page.id}`);
        
        // ページオブジェクトがPageObjectResponseであるか確認
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
          properties: (page as any).properties || {},
        };
        
        // ページが完全なPageObjectResponseの場合のみ、追加のプロパティを設定
        if ('created_time' in page) {
          pageData['created_time'] = page.created_time;
        }
        
        if ('last_edited_time' in page) {
          pageData['last_edited_time'] = page.last_edited_time;
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
          
          const blockData = {
            id: block.id,
            page_id: page.id,
            type: block.type,
            content: block,
            has_children: 'has_children' in block ? block.has_children : false,
            sort_order: i,
            last_synced_at: new Date().toISOString()
          };
          
          // 存在する場合のみプロパティを追加
          if ('created_time' in block) {
            blockData['created_time'] = block.created_time;
          }
          
          if ('last_edited_time' in block) {
            blockData['last_edited_time'] = block.last_edited_time;
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
        
        console.log(`ページ完了: ${page.id} (${blocks.results.length}ブロック)`);
      } catch (pageError: any) {
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
    
    return NextResponse.json({
      success: true,
      pagesCount,
      blocksCount,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error: any) {
    console.error('同期エラー:', error);
    
    return NextResponse.json({
      error: 'データ同期中にエラーが発生しました',
      details: error.message
    }, { status: 500 });
  }
} 