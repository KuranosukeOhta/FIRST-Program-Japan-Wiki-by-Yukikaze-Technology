import React, { useState } from 'react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
    const annotations = textItem.annotations || {};
    let classNames = '';
    
    if (annotations.bold) classNames += 'font-bold ';
    if (annotations.italic) classNames += 'italic ';
    if (annotations.underline) classNames += 'underline ';
    if (annotations.strikethrough) classNames += 'line-through ';
    if (annotations.code) {
      classNames += 'bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono ';
    }
    
    const color = annotations.color !== 'default' 
      ? `text-${annotations.color.replace('_background', 'bg')}` 
      : '';
    
    const content = (
      <span key={index} className={`${classNames} ${color}`}>
        {textItem.href ? (
          <a 
            href={textItem.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent-color underline hover:opacity-80"
          >
            {textItem.plain_text}
          </a>
        ) : (
          textItem.plain_text
        )}
      </span>
    );
    
    return content;
  });
};

// 各ブロックタイプのコンポーネント
const ParagraphBlock = ({ block }: { block: any }) => {
  return (
    <p className="my-4 leading-relaxed">
      {renderRichText(block.paragraph.rich_text)}
    </p>
  );
};

const HeadingBlock = ({ level, block, headingId }: { level: number; block: any; headingId?: string }) => {
  const id = headingId || `heading-${block.id.split('-')[0]}`;
  const richTextKey = `heading_${level}`;
  const textContent = block[richTextKey]?.rich_text;
  
  const HeadingTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  
  return React.createElement(
    HeadingTag,
    { 
      id,
      className: `font-bold ${
        level === 1 
          ? 'text-2xl mt-12 mb-4' 
          : level === 2 
            ? 'text-xl mt-10 mb-3 pb-1 border-b border-gray-200' 
            : 'text-lg mt-8 mb-2'
      }`
    },
    <>
      {renderRichText(textContent)}
      <a 
        href={`#${id}`} 
        className="ml-2 opacity-0 group-hover:opacity-100 hover:opacity-100 text-accent-color"
        aria-label="見出しへのリンク"
      >
        #
      </a>
    </>
  );
};

const BulletedListItem = ({ block }: { block: any }) => {
  return (
    <li className="my-1 ml-5 list-disc list-outside">
      {renderRichText(block.bulleted_list_item.rich_text)}
      {block.has_children && block.children && (
        <ul className="my-2">
          {block.children.map((child: any) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const NumberedListItem = ({ block }: { block: any }) => {
  return (
    <li className="my-1 ml-5 list-decimal list-outside">
      {renderRichText(block.numbered_list_item.rich_text)}
      {block.has_children && block.children && (
        <ol className="my-2">
          {block.children.map((child: any) => (
            <BlockRenderer key={child.id} block={child} />
          ))}
        </ol>
      )}
    </li>
  );
};

const TodoBlock = ({ block }: { block: any }) => {
  const checked = block.to_do.checked;
  return (
    <div className="flex items-start my-2">
      <div className="flex items-center h-6 mr-2">
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="w-4 h-4 border-gray-300 rounded accent-accent-color"
        />
      </div>
      <div className={checked ? 'line-through text-gray-500' : ''}>
        {renderRichText(block.to_do.rich_text)}
      </div>
    </div>
  );
};

const ToggleBlock = ({ block }: { block: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  
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
        {renderRichText(block.toggle.rich_text)}
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
  const language = block.code.language.toLowerCase() || 'javascript';
  const mappedLanguage = {
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
  }[language] || 'text';

  return (
    <div className="my-6 rounded-lg overflow-hidden">
      {block.code.caption && block.code.caption.length > 0 && (
        <div className="text-sm italic text-gray-500 mb-1">
          {renderRichText(block.code.caption)}
        </div>
      )}
      <div className="relative">
        <div className="absolute right-2 top-2 text-xs bg-gray-700 text-white px-2 py-1 rounded-md opacity-70">
          {language}
        </div>
        <SyntaxHighlighter
          language={mappedLanguage}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem 1rem 1rem 1rem',
            fontSize: '0.9rem',
            backgroundColor: '#282c34',
            borderRadius: '0.375rem',
          }}
        >
          {block.code.rich_text[0]?.plain_text || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const ImageBlock = ({ block }: { block: any }) => {
  let src = '';

  if (block.image.type === 'external') {
    src = block.image.external.url;
  } else if (block.image.type === 'file') {
    src = block.image.file.url;
  }

  const captionText = block.image.caption && block.image.caption.length > 0
    ? block.image.caption.map((c: any) => c.plain_text).join('')
    : '';

  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <Image
          src={src}
          alt={captionText || "画像"}
          width={800}
          height={450}
          className="w-full object-cover"
          style={{ 
            maxHeight: '500px',
            objectFit: 'contain' 
          }}
          unoptimized={block.image.type === 'external'}
        />
      </div>
      {captionText && (
        <figcaption className="mt-2 text-center text-sm text-gray-500">
          {captionText}
        </figcaption>
      )}
    </figure>
  );
};

const CalloutBlock = ({ block }: { block: any }) => {
  return (
    <div className="my-6 p-4 bg-accent-color bg-opacity-5 rounded-lg border-l-4 border-accent-color flex">
      {block.callout.icon && (
        <div className="mr-3 text-xl">{block.callout.icon.emoji}</div>
      )}
      <div>
        {renderRichText(block.callout.rich_text)}
      </div>
    </div>
  );
};

const QuoteBlock = ({ block }: { block: any }) => {
  return (
    <blockquote className="my-6 pl-4 py-1 border-l-4 border-accent-color bg-gray-50 rounded-r-md italic">
      <div className="py-2">
        {renderRichText(block.quote.rich_text)}
      </div>
    </blockquote>
  );
}; 