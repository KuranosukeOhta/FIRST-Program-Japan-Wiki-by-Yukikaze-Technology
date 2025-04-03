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
      return <div className="my-8 border-b border-gray-200" />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'quote':
      return <QuoteBlock block={block} />;
    default:
      return (
        <div className="my-4 p-4 bg-gray-50 border border-gray-100 rounded text-sm text-gray-500">
          未対応のブロックタイプ: {blockType}
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
    if (annotations.code) classNames += ' font-mono text-sm px-1.5 py-0.5 bg-gray-100 rounded text-pink-600';
    
    const content = (
      <span key={index} className={classNames.trim() || undefined}>
        {plain_text}
      </span>
    );
    
    // リンクの場合はaタグでラップ
    if (href) {
      return (
        <a key={index} href={href} className="text-blue-600 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
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
  if (text.length === 0) return <p className="my-6">&nbsp;</p>;
  
  return <p className="my-6 leading-relaxed text-gray-800">{renderRichText(text)}</p>;
};

const HeadingBlock = ({ level, block }: { level: number; block: any }) => {
  const type = `heading_${level}`;
  const text = block.content?.[type]?.rich_text || [];
  
  const id = text.map((t: any) => t.plain_text || '').join('').toLowerCase().replace(/\s+/g, '-');
  
  switch (level) {
    case 1:
      return (
        <h1 id={id} className="text-2xl font-bold mt-10 mb-6 pb-1 border-b border-gray-200">
          {renderRichText(text)}
          <a href={`#${id}`} className="ml-2 text-gray-300 opacity-0 hover:opacity-100 transition-opacity">#</a>
        </h1>
      );
    case 2:
      return (
        <h2 id={id} className="text-xl font-bold mt-8 mb-4">
          {renderRichText(text)}
          <a href={`#${id}`} className="ml-2 text-gray-300 opacity-0 hover:opacity-100 transition-opacity">#</a>
        </h2>
      );
    case 3:
      return (
        <h3 id={id} className="text-lg font-bold mt-6 mb-3">
          {renderRichText(text)}
          <a href={`#${id}`} className="ml-2 text-gray-300 opacity-0 hover:opacity-100 transition-opacity">#</a>
        </h3>
      );
    default:
      return <h4 className="text-base font-bold mt-5 mb-2">{renderRichText(text)}</h4>;
  }
};

const BulletedListItem = ({ block }: { block: any }) => {
  const text = block.content?.bulleted_list_item?.rich_text || [];
  
  return (
    <li className="ml-6 my-2 relative before:content-[''] before:absolute before:w-1.5 before:h-1.5 before:bg-gray-500 before:rounded-full before:-left-4 before:top-2">
      {renderRichText(text)}
    </li>
  );
};

const NumberedListItem = ({ block }: { block: any }) => {
  const text = block.content?.numbered_list_item?.rich_text || [];
  
  return (
    <li className="ml-6 my-2 list-decimal">
      {renderRichText(text)}
    </li>
  );
};

const TodoBlock = ({ block }: { block: any }) => {
  const text = block.content?.to_do?.rich_text || [];
  const checked = block.content?.to_do?.checked || false;
  
  return (
    <div className="flex items-start my-3">
      <div className={`flex-shrink-0 w-5 h-5 mr-2 mt-0.5 border rounded ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
      <div className={checked ? 'line-through text-gray-500' : 'text-gray-800'}>
        {renderRichText(text)}
      </div>
    </div>
  );
};

const ToggleBlock = ({ block }: { block: any }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const text = block.content?.toggle?.rich_text || [];
  
  return (
    <div className="my-4 border border-gray-100 rounded overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center w-full text-left font-medium p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="mr-2 text-gray-500">{isOpen ? '▼' : '▶'}</span>
        <span className="font-medium">{renderRichText(text)}</span>
      </button>
      {isOpen && block.has_children && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <p className="text-sm text-gray-500">子ブロックの表示は現在サポートされていません</p>
        </div>
      )}
    </div>
  );
};

const CodeBlock = ({ block }: { block: any }) => {
  const text = block.content?.code?.rich_text || [];
  const language = block.content?.code?.language || 'plain text';
  const codeContent = text.map((t: { plain_text: string }) => t.plain_text).join('');
  
  return (
    <div className="my-6 overflow-hidden rounded-lg shadow-sm">
      <div className="bg-gray-800 text-gray-400 py-2 px-4 text-xs flex justify-between items-center">
        <span>{language}</span>
      </div>
      <pre className="bg-gray-900 p-4 overflow-x-auto text-gray-200 text-sm">
        <code>{codeContent}</code>
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
      <div className="my-6 p-4 border border-gray-200 rounded text-center text-gray-500">
        画像を読み込めません
      </div>
    );
  }
  
  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-lg shadow-sm">
        <img 
          src={imageUrl} 
          alt={caption || '画像'} 
          className="w-full h-auto object-cover"
        />
      </div>
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
    <div className="my-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 flex items-start">
      <div className="mr-3 text-xl leading-none">{emoji}</div>
      <div className="flex-1 text-blue-800">
        {renderRichText(text)}
      </div>
    </div>
  );
};

const QuoteBlock = ({ block }: { block: any }) => {
  const text = block.content?.quote?.rich_text || [];
  
  return (
    <blockquote className="my-6 pl-5 py-1 border-l-4 border-gray-200 text-gray-700 italic">
      {renderRichText(text)}
    </blockquote>
  );
}; 