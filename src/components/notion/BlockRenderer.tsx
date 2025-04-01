import React from 'react';

type BlockRendererProps = {
  block: any;
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const blockType = block.type;
  
  switch (blockType) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading_1':
      return <HeadingBlock level={1} block={block} />;
    case 'heading_2':
      return <HeadingBlock level={2} block={block} />;
    case 'heading_3':
      return <HeadingBlock level={3} block={block} />;
    case 'bulleted_list_item':
      return <BulletedListItem block={block} />;
    case 'numbered_list_item':
      return <NumberedListItem block={block} />;
    case 'to_do':
      return <TodoBlock block={block} />;
    case 'toggle':
      return <ToggleBlock block={block} />;
    case 'code':
      return <CodeBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'divider':
      return <div className="my-4 border-b border-gray-200" />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'quote':
      return <QuoteBlock block={block} />;
    default:
      return (
        <div className="p-2 border border-gray-200 rounded">
          <p className="text-sm text-gray-500">未対応のブロックタイプ: {blockType}</p>
        </div>
      );
  }
};

const renderRichText = (richTextArray: any[]) => {
  if (!richTextArray || richTextArray.length === 0) {
    return null;
  }
  
  return richTextArray.map((textItem, index) => {
    const { plain_text, annotations = {}, href } = textItem;
    
    if (!plain_text) return null;
    
    let classNames = '';
    if (annotations.bold) classNames += ' font-bold';
    if (annotations.italic) classNames += ' italic';
    if (annotations.underline) classNames += ' underline';
    if (annotations.strikethrough) classNames += ' line-through';
    if (annotations.code) classNames += ' font-mono bg-gray-100 px-1 rounded';
    
    const content = (
      <span key={index} className={classNames.trim() || undefined}>
        {plain_text}
      </span>
    );
    
    // リンクの場合はaタグでラップ
    if (href) {
      return (
        <a key={index} href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    
    return content;
  });
};

// 各ブロックタイプのコンポーネント
const ParagraphBlock = ({ block }: { block: any }) => {
  const text = block.content?.paragraph?.rich_text || [];
  if (text.length === 0) return <p className="my-2">&nbsp;</p>;
  
  return <p className="my-2">{renderRichText(text)}</p>;
};

const HeadingBlock = ({ level, block }: { level: number; block: any }) => {
  const type = `heading_${level}`;
  const text = block.content?.[type]?.rich_text || [];
  
  switch (level) {
    case 1:
      return <h1 className="text-3xl font-bold mt-6 mb-4">{renderRichText(text)}</h1>;
    case 2:
      return <h2 className="text-2xl font-bold mt-5 mb-3">{renderRichText(text)}</h2>;
    case 3:
      return <h3 className="text-xl font-bold mt-4 mb-2">{renderRichText(text)}</h3>;
    default:
      return <h4 className="text-lg font-bold mt-3 mb-2">{renderRichText(text)}</h4>;
  }
};

const BulletedListItem = ({ block }: { block: any }) => {
  const text = block.content?.bulleted_list_item?.rich_text || [];
  
  return (
    <li className="ml-5 list-disc my-1">
      {renderRichText(text)}
    </li>
  );
};

const NumberedListItem = ({ block }: { block: any }) => {
  const text = block.content?.numbered_list_item?.rich_text || [];
  
  return (
    <li className="ml-5 list-decimal my-1">
      {renderRichText(text)}
    </li>
  );
};

const TodoBlock = ({ block }: { block: any }) => {
  const text = block.content?.to_do?.rich_text || [];
  const checked = block.content?.to_do?.checked || false;
  
  return (
    <div className="flex items-start my-2">
      <input 
        type="checkbox" 
        checked={checked} 
        readOnly 
        className="mt-1 mr-2" 
      />
      <div>{renderRichText(text)}</div>
    </div>
  );
};

const ToggleBlock = ({ block }: { block: any }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const text = block.content?.toggle?.rich_text || [];
  
  return (
    <div className="my-2">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center w-full text-left font-medium"
      >
        <span className="mr-2">{isOpen ? '▼' : '▶'}</span>
        {renderRichText(text)}
      </button>
      {isOpen && block.has_children && (
        <div className="ml-6 mt-2 pl-2 border-l-2 border-gray-200">
          {/* 子ブロックのレンダリングはサポートされていない */}
          <p className="text-sm text-gray-500">子ブロックの表示は現在サポートされていません</p>
        </div>
      )}
    </div>
  );
};

const CodeBlock = ({ block }: { block: any }) => {
  const text = block.content?.code?.rich_text || [];
  const language = block.content?.code?.language || 'plain text';
  
  return (
    <div className="my-4">
      <div className="bg-gray-800 text-gray-200 rounded-t px-3 py-1 text-xs">
        {language}
      </div>
      <pre className="bg-gray-100 p-4 overflow-x-auto rounded-b">
        <code>{text.map((t: { plain_text: string }) => t.plain_text).join('')}</code>
      </pre>
    </div>
  );
};

const ImageBlock = ({ block }: { block: any }) => {
  let imageUrl = '';
  
  // 画像URLの取得（ファイルタイプによって異なる）
  if (block.content?.image?.type === 'external') {
    imageUrl = block.content?.image?.external?.url || '';
  } else if (block.content?.image?.type === 'file') {
    imageUrl = block.content?.image?.file?.url || '';
  }
  
  const caption = block.content?.image?.caption?.map((c: any) => c.plain_text).join('') || '';
  
  if (!imageUrl) {
    return (
      <div className="my-4 p-4 border border-gray-200 rounded text-center text-gray-500">
        画像を読み込めません
      </div>
    );
  }
  
  return (
    <figure className="my-4">
      <img 
        src={imageUrl} 
        alt={caption || '画像'} 
        className="mx-auto max-w-full h-auto rounded"
      />
      {caption && (
        <figcaption className="text-center text-sm text-gray-500 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

const CalloutBlock = ({ block }: { block: any }) => {
  const text = block.content?.callout?.rich_text || [];
  const emoji = block.content?.callout?.icon?.emoji || '💡';
  
  return (
    <div className="my-4 p-4 bg-gray-50 rounded flex items-start">
      <div className="mr-2 text-xl">{emoji}</div>
      <div>{renderRichText(text)}</div>
    </div>
  );
};

const QuoteBlock = ({ block }: { block: any }) => {
  const text = block.content?.quote?.rich_text || [];
  
  return (
    <blockquote className="my-4 pl-4 border-l-4 border-gray-300 italic">
      {renderRichText(text)}
    </blockquote>
  );
}; 