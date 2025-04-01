import { Client } from "npm:@notionhq/client@2.2.14";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTION_API_KEY = "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";
const NOTION_DATABASE_ID = "1c5a2a5cb4ea80f6ab25d8cd39588366";

// オプションリクエストのハンドラ
const handleOptionsRequest = async (req: Request) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

// PINGリクエスト用のハンドラ（CORS検出用）
const handlePingRequest = async (req: Request) => {
  // 1x1の透明GIF (データURI)
  const transparentGif = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const binaryData = atob(transparentGif);
  const uint8Array = new Uint8Array(binaryData.length);
  
  for (let i = 0; i < binaryData.length; i++) {
    uint8Array[i] = binaryData.charCodeAt(i);
  }
  
  return new Response(uint8Array.buffer, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};

serve(async (req) => {
  // プリフライトリクエスト対応
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest(req);
  }
  
  // URL用意
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // PING（CORS検出用）対応
  if (path === 'ping') {
    return handlePingRequest(req);
  }
  
  // 認証チェック
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized: No auth header', {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Notionクライアントの認証
  let notion;
  try {
    notion = new Client({
      auth: NOTION_API_KEY,
    });
    const user = await notion.users.me();
    console.log("Successfully authenticated with Notion as:", user.name);
  } catch (authError) {
    console.error("Notion Authentication Error:", authError);
    return new Response(
      JSON.stringify({
        error: "Failed to authenticate with Notion. Please verify your API key.",
        details: authError.message,
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // リクエストURLからパスとパラメータを解析
  console.log(`Request path: ${path}`);

  try {
    // エンドポイントに基づいて適切な処理を行う
    switch (path) {
      case "notion":
        // 全データベースエントリを取得（元の機能）
        return await getAllPages(notion);
      
      case "page":
        // 特定のページの詳細を取得
        const pageId = url.searchParams.get("id");
        if (!pageId) {
          return new Response(
            JSON.stringify({ error: "Page ID is required" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
        return await getPage(notion, pageId);
      
      case "blocks":
        // ページブロックの取得
        const blockPageId = url.searchParams.get("id");
        const recursive = url.searchParams.get("recursive") === "true";
        
        if (!blockPageId) {
          return new Response(
            JSON.stringify({ error: "Page ID is required for blocks" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
        return await getBlocks(notion, blockPageId, recursive);
      
      case "child-blocks":
        // 特定のブロックの子ブロックを取得
        const blockId = url.searchParams.get("id");
        const fetchRecursive = url.searchParams.get("recursive") === "true";
        
        if (!blockId) {
          return new Response(
            JSON.stringify({ error: "Block ID is required" }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
        return await getChildBlocks(notion, blockId, fetchRecursive);
      
      case "categories":
        // データベースからカテゴリーのリストを取得
        return await getCategories(notion);
      
      default:
        // 不明なエンドポイント
        return new Response(
          JSON.stringify({ error: "Unknown endpoint" }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred processing the request",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// 全ページを取得する関数
async function getAllPages(notion) {
  try {
    if (!NOTION_DATABASE_ID) {
      throw new Error("Database ID is required");
    }

    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      page_size: 100,
    });

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (dbError) {
    console.error("Notion Database Access Error:", dbError);
    
    if (dbError.message.includes("Could not find database")) {
      return new Response(
        JSON.stringify({
          error: "Database access error",
          details: "The database could not be found. Please ensure that:",
          steps: [
            "1. The database ID is correct",
            "2. The database is shared with your integration",
            "3. Your integration has been added as a connection in the Notion page"
          ]
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Failed to query the database",
        details: dbError.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// 特定のページの詳細を取得する関数
async function getPage(notion, pageId) {
  try {
    const response = await notion.pages.retrieve({
      page_id: pageId,
    });

    // 不足しているプロパティがあれば初期化
    if (!response.properties) {
      response.properties = {};
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Notion Page Retrieval Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to retrieve the page",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// ページのブロックを取得する関数
async function getBlocks(notion, pageId, recursive = false) {
  try {
    console.log(`ブロック取得開始: ページID = ${pageId}, 再帰処理 = ${recursive}`);
    const startTime = Date.now();

    // 最初のブロック取得
    let allBlocks = [];
    let hasMore = true;
    let nextCursor = undefined;
    const maxBlocks = 500; // 最大ブロック数を制限
    
    // ページネーションでブロックを取得
    while (hasMore && allBlocks.length < maxBlocks) {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: nextCursor,
      });
      
      const blocks = response.results || [];
      allBlocks = [...allBlocks, ...blocks];
      
      hasMore = response.has_more;
      nextCursor = response.next_cursor;
      
      // 一度に100ブロック以上ある場合は警告を出す
      if (hasMore && allBlocks.length >= maxBlocks) {
        console.warn(`ブロック数が多すぎるため取得を制限します (${maxBlocks}ブロック)`);
        break;
      }
    }
    
    // 再帰的に子ブロックを取得する場合（子ブロックが比較的少ない場合のみ対応）
    if (recursive && allBlocks.length > 0 && allBlocks.length < 100) {
      console.log(`${allBlocks.length}ブロックの子ブロックを再帰的に取得します`);
      
      const blocksWithChildren = await Promise.all(
        allBlocks.map(async (block) => {
          if (block.has_children) {
            try {
              const childBlocks = await getChildBlocks(notion, block.id, recursive);
              const childData = await childBlocks.json();
              return {
                ...block,
                children: childData.results || [],
              };
            } catch (childErr) {
              console.error(`子ブロック(${block.id})の取得中にエラー:`, childErr);
              return {
                ...block,
                children: [],
                childError: childErr.message
              };
            }
          }
          return block;
        })
      );
      allBlocks = blocksWithChildren;
    } else if (recursive && allBlocks.length >= 100) {
      console.warn(`ブロック数が多いため(${allBlocks.length}ブロック)、子ブロックの再帰取得をスキップします`);
    }

    const endTime = Date.now();
    console.log(`ブロック取得完了: ${allBlocks.length}ブロック, 処理時間: ${endTime - startTime}ms`);

    return new Response(
      JSON.stringify({
        results: allBlocks,
        has_more: hasMore,
        next_cursor: nextCursor,
        block_count: allBlocks.length,
        processing_time_ms: endTime - startTime
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Notion Blocks Retrieval Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to retrieve blocks",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// 特定のブロックの子ブロックを取得する関数
async function getChildBlocks(notion, blockId, recursive = false) {
  try {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    });

    // レスポンスが空の場合は空の結果を返す
    if (!response.results) {
      response.results = [];
    }

    // 再帰的に子ブロックを取得する場合
    if (recursive && response.results.length > 0) {
      const blocksWithChildren = await Promise.all(
        response.results.map(async (block) => {
          if (block.has_children) {
            const childBlocks = await getChildBlocks(notion, block.id, recursive);
            const childData = await childBlocks.json();
            return {
              ...block,
              children: childData.results || [],
            };
          }
          return block;
        })
      );
      response.results = blocksWithChildren;
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Notion Child Blocks Retrieval Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to retrieve child blocks",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// カテゴリーリストを取得する関数
async function getCategories(notion) {
  try {
    if (!NOTION_DATABASE_ID) {
      throw new Error("Database ID is required");
    }

    console.log("カテゴリー取得開始: データベースID =", NOTION_DATABASE_ID);

    // データベースの内容を取得
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      page_size: 100,
    });

    console.log(`データベースから${response.results?.length || 0}ページを取得しました`);

    // レスポンスの検証
    if (!response || !response.results) {
      console.error("Notion APIから無効なレスポンスを受信しました:", response);
      return new Response(
        JSON.stringify({ 
          categories: [], // 空の配列を返す
          debug: {
            timestamp: new Date().toISOString(),
            error: "無効なレスポンス",
            response: response
          }
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // デバッグ用に最初の3つのページのプロパティを保存
    const debugPages = (response.results.slice(0, 3) || []).map(page => ({
      id: page.id,
      title: page.properties?.title?.title?.[0]?.plain_text || 'No Title',
      properties: page.properties || {}
    }));

    // まずはデータベースの構造を取得
    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID,
    });

    // カテゴリーの候補となるプロパティ名
    const categoryPropertyNames = ['Category', 'カテゴリー', 'カテゴリ'];
    
    // データベース構造のログ出力
    if (database && database.properties) {
      console.log("データベース構造を取得しました:", 
        Object.keys(database.properties).map(key => 
          `${key}(${database.properties[key].type})`
        )
      );
    } else {
      console.warn("データベース構造が取得できませんでした");
    }

    // カテゴリーとして使えそうなプロパティを見つける
    const potentialCategoryProperties = [];
    
    for (const [key, prop] of Object.entries(database.properties || {})) {
      if (prop.type === 'select' || prop.type === 'multi_select') {
        potentialCategoryProperties.push({
          name: key,
          type: prop.type,
          id: prop.id
        });
      }
    }

    console.log("カテゴリーとして使えそうなプロパティ:", 
      potentialCategoryProperties.map(p => `${p.name}(${p.type})`)
    );

    // ページからカテゴリーを抽出
    const categories = new Set();
    const categoryDetails = [];
    
    // すべてのページをスキャンしてカテゴリー情報を収集
    (response.results || []).forEach((page) => {
      if (!page.properties) {
        console.log("プロパティが存在しないページがあります:", page.id);
        return;
      }

      // 既知の標準的なカテゴリー名をチェック
      categoryPropertyNames.forEach(propName => {
        const prop = page.properties[propName];
        if (!prop) return;
        
        // selectタイプの処理
        if (prop.type === 'select' && prop.select?.name) {
          categories.add(prop.select.name);
          categoryDetails.push({
            page_id: page.id,
            property_name: propName,
            type: 'select',
            value: prop.select.name
          });
        }
        // multi_selectタイプの処理
        else if (prop.type === 'multi_select' && prop.multi_select?.length > 0) {
          prop.multi_select.forEach(item => {
            if (item.name) {
              categories.add(item.name);
              categoryDetails.push({
                page_id: page.id,
                property_name: propName,
                type: 'multi_select',
                value: item.name
              });
            }
          });
        }
      });
      
      // カテゴリー候補のプロパティを走査
      potentialCategoryProperties.forEach(catProp => {
        // 既にチェック済みのプロパティはスキップ
        if (categoryPropertyNames.includes(catProp.name)) return;
        
        const prop = page.properties[catProp.name];
        if (!prop) return;
        
        if (prop.type === 'select' && prop.select?.name) {
          categories.add(prop.select.name);
          categoryDetails.push({
            page_id: page.id,
            property_name: catProp.name,
            type: 'select',
            value: prop.select.name
          });
        } 
        else if (prop.type === 'multi_select' && prop.multi_select?.length > 0) {
          prop.multi_select.forEach(item => {
            if (item.name) {
              categories.add(item.name);
              categoryDetails.push({
                page_id: page.id,
                property_name: catProp.name,
                type: 'multi_select',
                value: item.name
              });
            }
          });
        }
      });
      
      // その他のプロパティも確認（タイプが不明な場合）
      for (const [key, prop] of Object.entries(page.properties)) {
        // すでにチェック済みのプロパティはスキップ
        if (categoryPropertyNames.includes(key) || 
            potentialCategoryProperties.some(p => p.name === key)) {
          continue;
        }
        
        // 任意のselectタイプやmulti_selectタイプを見つけたら、カテゴリとして扱う
        if (prop.type === 'select' && prop.select?.name) {
          categories.add(prop.select.name);
          categoryDetails.push({
            page_id: page.id,
            property_name: key,
            type: 'select',
            value: prop.select.name
          });
        } 
        else if (prop.type === 'multi_select' && prop.multi_select?.length > 0) {
          prop.multi_select.forEach(item => {
            if (item.name) {
              categories.add(item.name);
              categoryDetails.push({
                page_id: page.id,
                property_name: key,
                type: 'multi_select',
                value: item.name
              });
            }
          });
        }
      }
    });

    // もしカテゴリーが一つも見つからない場合はデフォルトのカテゴリーを設定
    if (categories.size === 0) {
      categories.add('未分類');
      console.log('カテゴリーが見つからなかったため、デフォルト「未分類」を追加しました');
    }

    const categoriesArray = Array.from(categories).sort();
    console.log(`${categoriesArray.length}個のカテゴリーを発見しました:`, categoriesArray);

    // デバッグ情報とカテゴリー一覧を返す
    return new Response(
      JSON.stringify({ 
        categories: categoriesArray,
        debug: {
          timestamp: new Date().toISOString(),
          database_id: NOTION_DATABASE_ID,
          total_pages: response.results?.length || 0,
          database_structure: database.properties ? {
            properties: database.properties
          } : null,
          potential_category_properties: potentialCategoryProperties,
          category_details: categoryDetails,
          sample_pages: debugPages
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Categories Retrieval Error:", error);
    
    // エラー時も空の配列を返す
    return new Response(
      JSON.stringify({ 
        categories: [], // エラー時も空の配列を返す
        debug: {
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack
        }
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}