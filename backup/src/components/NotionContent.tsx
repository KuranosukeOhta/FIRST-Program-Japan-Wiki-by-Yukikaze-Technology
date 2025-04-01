import React, { useMemo, Component, ErrorInfo, ReactNode } from 'react';

interface TextContent {
  type: string;
  text?: {
    content: string;
    link?: {
      url: string;
    };
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  plain_text?: string;
  href?: string;
}

interface BlockContent {
  id?: string;
  object?: string;
  type: string;
  has_children?: boolean;
  archived?: boolean;
  children?: BlockContent[];
  paragraph?: {
    rich_text: TextContent[];
    color?: string;
  };
  heading_1?: {
    rich_text: TextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_2?: {
    rich_text: TextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_3?: {
    rich_text: TextContent[];
    color?: string;
    is_toggleable?: boolean;
  };
  bulleted_list_item?: {
    rich_text: TextContent[];
    color?: string;
    children?: BlockContent[];
  };
  numbered_list_item?: {
    rich_text: TextContent[];
    color?: string;
    children?: BlockContent[];
  };
  to_do?: {
    rich_text: TextContent[];
    checked: boolean;
    color?: string;
  };
  toggle?: {
    rich_text: TextContent[];
    color?: string;
    children?: BlockContent[];
  };
  code?: {
    rich_text: TextContent[];
    language: string;
    caption?: TextContent[];
  };
  callout?: {
    rich_text: TextContent[];
    icon: {
      type: string;
      emoji?: string;
      external?: {
        url: string;
      };
    };
    color?: string;
  };
  quote?: {
    rich_text: TextContent[];
    color?: string;
  };
  image?: {
    type: string;
    file?: {
      url: string;
      expiry_time?: string;
    };
    external?: {
      url: string;
    };
    caption?: TextContent[];
  };
  divider?: Record<string, never>;
  bookmark?: {
    url: string;
    caption?: TextContent[];
  };
  table?: {
    table_width: number;
    has_column_header: boolean;
    has_row_header: boolean;
  };
  table_row?: {
    cells: TextContent[][];
  };
  video?: {
    type: string;
    file?: {
      url: string;
      expiry_time?: string;
    };
    external?: {
      url: string;
    };
    caption?: TextContent[];
  };
  file?: {
    type: string;
    file?: {
      url: string;
      expiry_time?: string;
    };
    external?: {
      url: string;
    };
    caption?: TextContent[];
  };
  pdf?: {
    type: string;
    file?: {
      url: string;
      expiry_time?: string;
    };
    external?: {
      url: string;
    };
    caption?: TextContent[];
  };
  embed?: {
    url: string;
    caption?: TextContent[];
  };
  link_preview?: {
    url: string;
  };
  synced_block?: {
    synced_from?: {
      block_id: string;
    };
    children?: BlockContent[];
  };
  [key: string]: any; // その他のプロパティを許可
}

interface NotionContentProps {
  blocks: BlockContent[];
}

const RichText = ({ richText }: { richText: TextContent[] }) => {
  if (!richText || richText.length === 0) return null;

  return (
    <>
      {richText.map((text, index) => {
        let elementStyle = '';

        const annotations = text.annotations;
        if (annotations) {
          if (annotations.bold) elementStyle += ' font-bold';
          if (annotations.italic) elementStyle += ' italic';
          if (annotations.strikethrough) elementStyle += ' line-through';
          if (annotations.underline) elementStyle += ' underline';
          if (annotations.code) elementStyle += ' font-mono text-sm bg-gray-100 px-1 rounded';
          if (annotations.color && annotations.color !== 'default') {
            // TODO: Add color styling based on Notion colors
          }
        }

        const content = text.text?.content || text.plain_text || '';
        
        if (text.text?.link || text.href) {
          const href = text.text?.link?.url || text.href || '';
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-blue-600 hover:underline ${elementStyle}`}
            >
              {content}
            </a>
          );
        }

        return (
          <span key={index} className={elementStyle}>
            {content}
          </span>
        );
      })}
    </>
  );
};

// ブロックコンテンツから安全にリッチテキストを取得
const getSafeRichText = (block: BlockContent): TextContent[] => {
  // ブロックタイプに基づいてリッチテキストを取得
  const richTextByType: Record<string, TextContent[] | undefined> = {
    paragraph: block.paragraph?.rich_text,
    heading_1: block.heading_1?.rich_text,
    heading_2: block.heading_2?.rich_text,
    heading_3: block.heading_3?.rich_text,
    bulleted_list_item: block.bulleted_list_item?.rich_text,
    numbered_list_item: block.numbered_list_item?.rich_text,
    to_do: block.to_do?.rich_text,
    toggle: block.toggle?.rich_text,
    code: block.code?.rich_text,
    callout: block.callout?.rich_text,
    quote: block.quote?.rich_text,
  };

  return richTextByType[block.type] || [];
};

// 個別のブロックをレンダリングする関数
const renderBlock = (block: BlockContent, index: number): React.ReactNode => {
  const key = block.id || `block-${index}`;
  const hasRichText = (block[block.type]?.rich_text?.length ?? 0) > 0;
  const hasChildren = block.children && block.children.length > 0;

  let blockContent: React.ReactNode;
  
  switch (block.type) {
    case 'paragraph':
      blockContent = (
        <p className="text-gray-800">
          {hasRichText ? (
            <RichText richText={block.paragraph?.rich_text || []} />
          ) : (
            <span className="text-gray-400">空の段落</span>
          )}
        </p>
      );
      break;

    case 'heading_1':
      blockContent = (
        <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b">
          <RichText richText={block.heading_1?.rich_text || []} />
        </h1>
      );
      break;

    case 'heading_2':
      blockContent = (
        <h2 className="text-2xl font-bold mt-6 mb-3">
          <RichText richText={block.heading_2?.rich_text || []} />
        </h2>
      );
      break;

    case 'heading_3':
      blockContent = (
        <h3 className="text-xl font-semibold mt-4 mb-2">
          <RichText richText={block.heading_3?.rich_text || []} />
        </h3>
      );
      break;

    case 'bulleted_list_item':
      blockContent = (
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <RichText richText={block.bulleted_list_item?.rich_text || []} />
            {hasChildren && (
              <div className="mt-2">
                <BlockList blocks={block.children || []} />
              </div>
            )}
          </li>
        </ul>
      );
      break;

    case 'numbered_list_item':
      blockContent = (
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <RichText richText={block.numbered_list_item?.rich_text || []} />
            {hasChildren && (
              <div className="mt-2">
                <BlockList blocks={block.children || []} />
              </div>
            )}
          </li>
        </ol>
      );
      break;

    case 'to_do':
      const isChecked = block.to_do?.checked || false;
      blockContent = (
        <div className="flex items-start">
          <div className="flex items-center h-6 mr-2">
            <input 
              type="checkbox" 
              checked={isChecked} 
              readOnly 
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
          <div className={isChecked ? 'line-through text-gray-500' : ''}>
            <RichText richText={block.to_do?.rich_text || []} />
          </div>
        </div>
      );
      break;

    case 'toggle':
      blockContent = (
        <details className="my-2 border border-gray-200 rounded-md">
          <summary className="px-4 py-2 cursor-pointer hover:bg-gray-50">
            <RichText richText={block.toggle?.rich_text || []} />
          </summary>
          {hasChildren && (
            <div className="px-4 py-2 border-t border-gray-200">
              <BlockList blocks={block.children || []} />
            </div>
          )}
        </details>
      );
      break;

    case 'code':
      blockContent = (
        <div className="bg-gray-800 rounded-md overflow-x-auto">
          <pre className="p-4 text-sm text-gray-100 font-mono">
            <RichText richText={block.code?.rich_text || []} />
          </pre>
          {block.code?.language && (
            <div className="bg-gray-700 px-4 py-1 text-xs text-gray-300">
              {block.code.language}
            </div>
          )}
        </div>
      );
      break;

    case 'quote':
      blockContent = (
        <blockquote className="pl-4 border-l-4 border-gray-300 text-gray-700 italic">
          <RichText richText={block.quote?.rich_text || []} />
        </blockquote>
      );
      break;

    case 'callout':
      blockContent = (
        <div className="bg-gray-100 p-4 rounded-md flex">
          {block.callout?.icon?.emoji && (
            <div className="mr-2">{block.callout.icon.emoji}</div>
          )}
          {block.callout?.icon?.external?.url && (
            <div className="mr-2">
              <img 
                src={block.callout.icon.external.url} 
                alt="icon" 
                className="w-5 h-5 object-contain" 
              />
            </div>
          )}
          <div>
            <RichText richText={block.callout?.rich_text || []} />
          </div>
        </div>
      );
      break;

    case 'image':
      const imageUrl = block.image?.file?.url || block.image?.external?.url || '';
      blockContent = (
        <figure className="my-4">
          <img 
            src={imageUrl} 
            alt={block.image?.caption?.map(c => c.plain_text).join(' ') || '画像'} 
            className="max-w-full h-auto rounded-md"
          />
          {block.image?.caption && block.image.caption.length > 0 && (
            <figcaption className="mt-2 text-sm text-gray-500 text-center">
              <RichText richText={block.image.caption} />
            </figcaption>
          )}
        </figure>
      );
      break;

    case 'divider':
      blockContent = (
        <hr className="my-6 border-gray-300" />
      );
      break;

    case 'bookmark':
      blockContent = (
        <div className="my-4 border border-gray-300 rounded-md overflow-hidden">
          <a 
            href={block.bookmark?.url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-4 hover:bg-gray-50"
          >
            <div className="text-blue-600 mb-1 truncate">
              {block.bookmark?.url || 'ブックマーク'}
            </div>
            {block.bookmark?.caption && block.bookmark.caption.length > 0 && (
              <div className="text-sm text-gray-600">
                <RichText richText={block.bookmark.caption} />
              </div>
            )}
          </a>
        </div>
      );
      break;

    case 'video':
      const videoUrl = block.video?.file?.url || block.video?.external?.url || '';
      blockContent = (
        <figure className="my-4">
          {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
            <iframe
              src={videoUrl.replace('watch?v=', 'embed/')}
              className="w-full aspect-video rounded-md"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              src={videoUrl}
              controls
              className="w-full rounded-md"
            >
              Your browser does not support the video tag.
            </video>
          )}
          {block.video?.caption && block.video.caption.length > 0 && (
            <figcaption className="mt-2 text-sm text-gray-500 text-center">
              <RichText richText={block.video.caption} />
            </figcaption>
          )}
        </figure>
      );
      break;

    case 'file':
      const fileUrl = block.file?.file?.url || block.file?.external?.url || '';
      const fileName = fileUrl.split('/').pop() || 'ファイル';
      blockContent = (
        <div className="my-4">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center p-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
            {fileName}
          </a>
        </div>
      );
      break;

    case 'embed':
      blockContent = (
        <div className="my-4">
          <iframe
            src={block.embed?.url || ''}
            className="w-full border-0 min-h-[300px] rounded-md"
            allowFullScreen
          ></iframe>
          {block.embed?.caption && block.embed.caption.length > 0 && (
            <div className="mt-2 text-sm text-gray-500 text-center">
              <RichText richText={block.embed.caption} />
            </div>
          )}
        </div>
      );
      break;

    case 'link_preview':
      blockContent = (
        <div className="my-4 border border-gray-300 rounded-md p-4">
          <a
            href={block.link_preview?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {block.link_preview?.url || 'リンク'}
          </a>
        </div>
      );
      break;

    case 'table':
      // テーブルはここでは詳細に実装せず、存在だけ表示
      blockContent = (
        <div className="my-4 p-2 bg-gray-100 text-center rounded">
          テーブルコンテンツ (表示はサポートされていません)
        </div>
      );
      break;

    default:
      // サポートされていないブロックタイプの処理
      blockContent = (
        <div className="my-4 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
          <div className="text-yellow-800">
            <p className="font-semibold">サポートされていないブロックタイプ: {block.type}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-yellow-600 hover:text-yellow-800">詳細を表示</summary>
              <pre className="mt-2 p-2 bg-white text-xs overflow-auto rounded border border-yellow-200 max-h-64">
                {JSON.stringify(block, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      );
  }

  return (
    <div className="mb-4" id={key}>
      {blockContent}
      {/* 子ブロックがある場合にレンダリング（toggleとリスト以外の場合） */}
      {hasChildren && 
       block.type !== 'toggle' && 
       block.type !== 'bulleted_list_item' && 
       block.type !== 'numbered_list_item' && (
        <div className="pl-4 ml-2 border-l border-gray-200 mt-2">
          <BlockList blocks={block.children || []} />
        </div>
      )}
    </div>
  );
};

// エラーバウンダリコンポーネント
class ErrorBoundary extends Component<
  { children: ReactNode, fallback?: ReactNode },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: ReactNode, fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NotionContent rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // フォールバックUIを表示
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="bg-red-50 p-4 rounded-md border border-red-300">
          <h3 className="text-red-800 font-medium">コンテンツの表示中にエラーが発生しました</h3>
          <p className="text-red-700 text-sm mt-1">
            {this.state.error?.message || 'レンダリングエラー'}
          </p>
          <details className="mt-3">
            <summary className="text-xs cursor-pointer text-red-600">詳細を表示</summary>
            <pre className="mt-2 p-2 bg-white text-xs overflow-auto rounded max-h-64 border border-red-200">
              {this.state.error?.stack || 'スタックトレースなし'}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// ブロックリストコンポーネント - リストのレンダリングを処理
const BlockList = ({ blocks }: { blocks: BlockContent[] }) => {
  // ブロックリストをuseMemoでメモ化して再レンダリングを防止
  const renderedBlocks = useMemo(() => {
    if (!blocks || blocks.length === 0) return [];
    
    try {
      return renderGroupedBlocks();
    } catch (error) {
      console.error("BlockList renderGroupedBlocks error:", error);
      return [(
        <div key="error" className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">ブロックの表示中にエラーが発生しました</p>
          <details>
            <summary className="cursor-pointer text-sm text-red-600">詳細</summary>
            <p className="text-xs mt-1">{error instanceof Error ? error.message : "不明なエラー"}</p>
          </details>
        </div>
      )];
    }
  }, [blocks]);

  // リストアイテムのグループ化処理
  const renderGroupedBlocks = () => {
    const result: React.ReactNode[] = [];
    let bulletedItems: React.ReactNode[] = [];
    let numberedItems: React.ReactNode[] = [];
    
    const flushBulletedList = () => {
      if (bulletedItems.length > 0) {
        result.push(
          <ul key={`ul-${result.length}`} className="list-disc pl-6 space-y-2">
            {bulletedItems}
          </ul>
        );
        bulletedItems = [];
      }
    };
    
    const flushNumberedList = () => {
      if (numberedItems.length > 0) {
        result.push(
          <ol key={`ol-${result.length}`} className="list-decimal pl-6 space-y-2">
            {numberedItems}
          </ol>
        );
        numberedItems = [];
      }
    };
    
    blocks.forEach((block, index) => {
      try {
        const key = block.id || `block-${index}`;
        const hasChildren = block.children && block.children.length > 0;
        
        if (block.type === 'bulleted_list_item') {
          // 番号付きリストが進行中なら、それを終了
          flushNumberedList();
          
          bulletedItems.push(
            <li key={key}>
              <RichText richText={block.bulleted_list_item?.rich_text || []} />
              {hasChildren && (
                <div className="mt-2">
                  <BlockList blocks={block.children || []} />
                </div>
              )}
            </li>
          );
        } else if (block.type === 'numbered_list_item') {
          // 箇条書きリストが進行中なら、それを終了
          flushBulletedList();
          
          numberedItems.push(
            <li key={key}>
              <RichText richText={block.numbered_list_item?.rich_text || []} />
              {hasChildren && (
                <div className="mt-2">
                  <BlockList blocks={block.children || []} />
                </div>
              )}
            </li>
          );
        } else {
          // リスト以外のブロックの場合、進行中のリストを終了
          flushBulletedList();
          flushNumberedList();
          
          // 通常のブロックをレンダリング
          try {
            result.push(renderBlock(block, index));
          } catch (error) {
            console.error(`Error rendering block ${block.type}:`, error);
            // エラーが発生したブロックの代わりに表示するフォールバック要素
            result.push(
              <div key={key} className="my-4 p-3 border border-red-300 bg-red-50 rounded-md">
                <p className="text-red-700">このブロックの表示中にエラーが発生しました: {block.type}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-red-600">ブロックの詳細</summary>
                  <pre className="mt-2 p-2 bg-white text-xs overflow-auto rounded max-h-64 border border-red-200">
                    {JSON.stringify(block, null, 2)}
                  </pre>
                </details>
              </div>
            );
          }
        }
      } catch (error) {
        console.error(`Error processing block at index ${index}:`, error);
        // ブロック処理でエラーが発生した場合のフォールバック
        const key = block?.id || `block-error-${index}`;
        result.push(
          <div key={key} className="my-4 p-3 border border-red-300 bg-red-50 rounded-md">
            <p className="text-red-700">ブロック処理中にエラーが発生しました</p>
          </div>
        );
      }
    });
    
    // 最後のリストを終了
    flushBulletedList();
    flushNumberedList();
    
    return result;
  };
  
  return <>{renderedBlocks}</>;
};

const NotionContent = ({ blocks }: NotionContentProps) => {
  // メモ化して再レンダリングを最小限に抑える
  const memoizedContent = useMemo(() => {
    if (!blocks) {
      return (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </div>
      );
    }
    
    if (blocks.length === 0) {
      return <div className="text-gray-500">コンテンツがありません</div>;
    }

    // ブロックの検証を行い、明らかに不正なブロックがないか確認
    const validBlocks = blocks.filter(block => {
      // IDやtypeプロパティがない場合は不正とみなす
      if (!block || typeof block !== 'object') {
        console.error('不正なブロック形式:', block);
        return false;
      }
      
      // 最低限typeプロパティがあることを確認
      if (!block.type) {
        console.error('typeプロパティがないブロック:', block);
        return false;
      }
      
      return true;
    });

    if (validBlocks.length === 0) {
      return (
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-300">
          <h3 className="text-yellow-800 font-medium">表示可能なブロックが見つかりません</h3>
          <p className="text-yellow-700 text-sm mt-1">
            ブロックは正常に取得されましたが、表示可能な形式ではありません。
          </p>
          <details className="mt-3">
            <summary className="text-xs cursor-pointer text-yellow-600">詳細を表示</summary>
            <pre className="mt-2 p-2 bg-white text-xs overflow-auto rounded max-h-96 border border-yellow-200">
              {JSON.stringify(blocks, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    try {
      console.log(`${validBlocks.length}個のブロックをレンダリングします...`);
  
      return (
        <div className="notion-content">
          <BlockList blocks={validBlocks} />
        </div>
      );
    } catch (error) {
      console.error("ブロックのレンダリング中にエラーが発生しました:", error);
      return (
        <div className="bg-red-50 p-4 rounded-md border border-red-300">
          <h3 className="text-red-800 font-medium">コンテンツの表示中にエラーが発生しました</h3>
          <p className="text-red-700 text-sm mt-1">
            {error instanceof Error ? error.message : '不明なエラー'}
          </p>
          <details className="mt-3">
            <summary className="text-xs cursor-pointer text-red-600">ブロックデータを表示</summary>
            <pre className="mt-2 p-2 bg-white text-xs overflow-auto rounded max-h-96 border border-red-200">
              {JSON.stringify(blocks.slice(0, 10), null, 2)}
              {blocks.length > 10 && "... (残りのブロックは省略されました)"}
            </pre>
          </details>
        </div>
      );
    }
  }, [blocks]);

  return (
    <ErrorBoundary>
      {memoizedContent}
    </ErrorBoundary>
  );
};

export default React.memo(NotionContent); 