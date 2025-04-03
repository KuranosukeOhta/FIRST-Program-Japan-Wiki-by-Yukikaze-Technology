"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

type BlockRendererProps = {
  block: any;
  headingId?: string;
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, headingId }) => {
  const blockType = block.type;
  
  switch (blockType) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading_1':
      return <HeadingBlock level={1} block={block} headingId={headingId} />;
    case 'heading_2':
      return <HeadingBlock level={2} block={block} headingId={headingId} />;
    case 'heading_3':
      return <HeadingBlock level={3} block={block} headingId={headingId} />;
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
    // リッチテキストがない場合は空のスパンを返す
    if (!textItem) return <span key={`empty-${index}`}></span>;
    
    // プレーンテキストがない場合は空白を返す
    const content = textItem.text?.content || textItem.plain_text || '';
    if (!content) return <span key={`empty-${index}`}></span>;
    
    // スタイル適用
    let element = <span key={index}>{content}</span>;
    
    // アノテーション（装飾）の適用
    const annotations = textItem.annotations || {};
    if (annotations.bold) {
      element = <strong key={index}>{element}</strong>;
    }
    if (annotations.italic) {
      element = <em key={index}>{element}</em>;
    }
    if (annotations.strikethrough) {
      element = <del key={index}>{element}</del>;
    }
    if (annotations.underline) {
      element = <u key={index}>{element}</u>;
    }
    if (annotations.code) {
      element = <code key={index} className="px-1 py-0.5 bg-gray-100 rounded text-sm">{element}</code>;
    }
    
    // リンクの場合
    if (textItem.href || textItem.text?.link?.url) {
      const url = textItem.href || textItem.text?.link?.url;
      element = (
        <a 
          key={index}
          href={url} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {element}
        </a>
      );
    }
    
    return element;
  });
};

// コンテンツをパースする共通関数
const parseContent = (content: any, defaultValue: any) => {
  if (!content) return defaultValue;
  
  try {
    // すでにオブジェクトなら変換せずそのまま返す
    if (typeof content === 'object') return content;
    
    // 文字列ならJSONとしてパース
    if (typeof content === 'string') {
      return JSON.parse(content);
    }
    
    // 上記以外の場合はデフォルト値を返す
    return defaultValue;
  } catch (error) {
    console.error('コンテンツの解析に失敗しました:', error);
    return defaultValue;
  }
};

// 各ブロックタイプのコンポーネント
const ParagraphBlock = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { paragraph: { rich_text: [] } });
  const richText = content.paragraph?.rich_text || [];
  
  return (
    <p className="my-3 leading-relaxed">
      {renderRichText(richText)}
    </p>
  );
};

const HeadingBlock = ({ level, block, headingId }: { level: number; block: any; headingId?: string }) => {
  const content = parseContent(block.content, { [`heading_${level}`]: { rich_text: [] } });
  const richText = content[`heading_${level}`]?.rich_text || [];
  
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const className = {
    1: 'text-3xl font-bold mt-10 mb-4 pb-2 border-b',
    2: 'text-2xl font-bold mt-8 mb-3',
    3: 'text-xl font-bold mt-6 mb-3',
  }[level];
  
  return (
    <HeadingTag id={headingId} className={className}>
      <a href={`#${headingId}`} className="heading-link">
        {renderRichText(richText)}
        <span className="heading-anchor opacity-0 group-hover:opacity-100 ml-2 text-blue-500">
          #
        </span>
      </a>
    </HeadingTag>
  );
};

const BulletedListItem = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { bulleted_list_item: { rich_text: [] } });
  const richText = content.bulleted_list_item?.rich_text || [];
  
  return (
    <li className="my-1">
      {renderRichText(richText)}
      {block.has_children && block.children && (
        <ul className="list-disc pl-5 my-2">
          {block.children.map((child: any) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const NumberedListItem = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { numbered_list_item: { rich_text: [] } });
  const richText = content.numbered_list_item?.rich_text || [];
  
  return (
    <li className="my-1">
      {renderRichText(richText)}
      {block.has_children && block.children && (
        <ol className="list-decimal pl-5 my-2">
          {block.children.map((child: any) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </ol>
      )}
    </li>
  );
};

const TodoBlock = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { to_do: { rich_text: [], checked: false } });
  const richText = content.to_do?.rich_text || [];
  const checked = content.to_do?.checked || false;
  
  return (
    <div className="flex items-start my-2">
      <input 
        type="checkbox" 
        checked={checked}
        readOnly
        className="mt-1 mr-2"
      />
      <div className={checked ? 'line-through text-gray-500' : ''}>
        {renderRichText(richText)}
      </div>
    </div>
  );
};

const ToggleBlock = ({ block }: { block: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = parseContent(block.content, { toggle: { rich_text: [] } });
  const richText = content.toggle?.rich_text || [];
  
  return (
    <div className="my-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full text-left font-medium mb-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`mr-2 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        {renderRichText(richText)}
      </button>
      
      {isOpen && block.has_children && block.children && (
        <div className="pl-6 pt-2 border-l-2 border-gray-100">
          {block.children.map((child: any) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const CodeBlock = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { code: { language: 'text', rich_text: [] } });
  const language = content.code?.language?.toLowerCase() || 'text';
  const richText = content.code?.rich_text || [];
  const codeText = richText.map((rt: any) => rt.plain_text).join('');
  
  // 型安全な言語マッピング
  const languageMapping: Record<string, string> = {
    'plain text': 'text',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'python': 'python',
    'java': 'java',
    'c++': 'cpp',
    'c': 'c',
    'c#': 'csharp',
    'css': 'css',
    'html': 'html',
    'json': 'json',
    'yaml': 'yaml',
    'bash': 'bash',
    'shell': 'bash',
  };
  
  const mappedLanguage = languageMapping[language] || 'text';

  return (
    <div className="my-6 rounded-lg overflow-hidden">
      {content.code?.caption && content.code.caption.length > 0 && (
        <div className="text-sm italic text-gray-500 mb-1">
          {renderRichText(content.code.caption)}
        </div>
      )}
      <div className="relative">
        <div className="absolute right-2 top-2 text-xs bg-gray-700 text-white px-2 py-1 rounded-md opacity-70">
          {language}
        </div>
        <SyntaxHighlighter
          language={mappedLanguage}
          style={tomorrow}
          customStyle={{
            margin: 0,
            padding: '1rem 1rem 1rem 1rem',
            fontSize: '0.9rem',
            backgroundColor: '#282c34',
            borderRadius: '0.375rem',
          }}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ImageBlock = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { image: { type: 'external', external: { url: '' } } });
  const image = content.image || {};
  const url = (image.type === 'external' ? image.external?.url : image.file?.url) || '';
  const caption = image.caption || [];
  
  if (!url) {
    return (
      <div className="my-4 p-4 bg-red-50 rounded border border-red-200 text-sm text-red-600">
        画像が見つかりませんでした
      </div>
    );
  }
  
  return (
    <figure className="my-6">
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <Image
          src={url}
          alt={caption.map((c: any) => c.plain_text).join('') || '画像'}
          width={700}
          height={400}
          className="w-full h-auto object-cover"
          style={{ maxHeight: '500px' }}
        />
      </div>
      {caption.length > 0 && (
        <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
          {renderRichText(caption)}
        </figcaption>
      )}
    </figure>
  );
};

const CalloutBlock = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { callout: { rich_text: [], icon: { type: 'emoji', emoji: 'ℹ️' } } });
  const callout = content.callout || {};
  const richText = callout.rich_text || [];
  const icon = callout.icon?.emoji || 'ℹ️';
  
  return (
    <div className="my-6 p-4 bg-blue-50 rounded-md border-l-4 border-blue-300 flex">
      <div className="mr-3 text-xl">{icon}</div>
      <div className="flex-1">{renderRichText(richText)}</div>
    </div>
  );
};

const QuoteBlock = ({ block }: { block: any }) => {
  const content = parseContent(block.content, { quote: { rich_text: [] } });
  const richText = content.quote?.rich_text || [];
  
  return (
    <blockquote className="my-6 pl-4 py-1 border-l-4 border-accent-color bg-gray-50 rounded-r-md italic">
      <div className="py-2">
        {renderRichText(richText)}
      </div>
    </blockquote>
  );
}; 