import React, { useMemo, useState } from 'react';
import Markdown, { ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHightlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import { classNames, copyStr } from '../utils/misc';
import { ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

export default function MarkdownDisplay({ content }: { content: string }) {
  const preprocessedContent = useMemo(
    () => preprocessLaTeX(content),
    [content]
  );
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      rehypePlugins={[rehypeHightlight, rehypeKatex, rehypeCustomCopyButton]}
      components={{
        button: (props) => (
          <CopyCodeButton {...props} origContent={preprocessedContent} />
        ),
      }}
    >
      {preprocessedContent}
    </Markdown>
  );
}

const CopyCodeButton: React.ElementType<
  React.ClassAttributes<HTMLButtonElement> &
    React.HTMLAttributes<HTMLButtonElement> &
    ExtraProps & { origContent: string }
> = ({ node, origContent }) => {
  const startOffset = node?.position?.start.offset ?? 0;
  const endOffset = node?.position?.end.offset ?? 0;

  const copiedContent = useMemo(
    () =>
      origContent
        .substring(startOffset, endOffset)
        .replace(/^```[^\n]+\n/g, '')
        .replace(/```$/g, ''),
    [origContent, startOffset, endOffset]
  );

  return (
    <div
      className={classNames({
        'text-right sticky top-4 mb-2 mr-2 h-0': true,
        'display-none': !node?.position,
      })}
    >
      <CopyButton className="badge btn-mini" content={copiedContent} />
    </div>
  );
};

export const CopyButton = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={className}
      onClick={() => {
        copyStr(content);
        setCopied(true);
      }}
      onMouseLeave={() => setCopied(false)}
    >
      {copied ? 'Copied!' : '📋 Copy'}
    </button>
  );
};

/**
 * This injects the "button" element before each "pre" element.
 * The actual button will be replaced with a react component in the MarkdownDisplay.
 * We don't replace "pre" node directly because it will cause the node to re-render, which causes this bug: https://github.com/ggerganov/llama.cpp/issues/9608
 */
function rehypeCustomCopyButton() {
  return function (tree: Root) {
    visit(tree, 'element', function (node) {
      if (node.tagName === 'pre' && !node.properties.visited) {
        const preNode = { ...node };
        // replace current node
        preNode.properties.visited = 'true';
        node.tagName = 'div';
        node.properties = {
          className: 'relative my-4',
        };
        // add node for button
        const btnNode: ElementContent = {
          type: 'element',
          tagName: 'button',
          properties: {},
          children: [],
          position: node.position,
        };
        node.children = [btnNode, preNode];
      }
    });
  };
}

/**
 * The part below is copied and adapted from:
 * https://github.com/danny-avila/LibreChat/blob/main/client/src/utils/latex.ts
 * (MIT License)
 */

// Regex to check if the processed content contains any potential LaTeX patterns
const containsLatexRegex =
  /\\\(.*?\\\)|\\\[.*?\\\]|\$.*?\$|\\begin\{equation\}.*?\\end\{equation\}/;

// Regex for inline and block LaTeX expressions
const inlineLatex = new RegExp(/\\\((.+?)\\\)/, 'g');
const blockLatex = new RegExp(/\\\[(.*?[^\\])\\\]/, 'gs');

// Function to restore code blocks
const restoreCodeBlocks = (content: string, codeBlocks: string[]) => {
  return content.replace(
    /<<CODE_BLOCK_(\d+)>>/g,
    (_, index) => codeBlocks[index]
  );
};

// Regex to identify code blocks and inline code
const codeBlockRegex = /(```[\s\S]*?```|`.*?`)/g;

export const processLaTeX = (_content: string) => {
  let content = _content;
  // Temporarily replace code blocks and inline code with placeholders
  const codeBlocks: string[] = [];
  let index = 0;
  content = content.replace(codeBlockRegex, (match) => {
    codeBlocks[index] = match;
    return `<<CODE_BLOCK_${index++}>>`;
  });

  // Escape dollar signs followed by a digit or space and digit
  let processedContent = content.replace(/(\$)(?=\s?\d)/g, '\\$');

  // If no LaTeX patterns are found, restore code blocks and return the processed content
  if (!containsLatexRegex.test(processedContent)) {
    return restoreCodeBlocks(processedContent, codeBlocks);
  }

  // Convert LaTeX expressions to a markdown compatible format
  processedContent = processedContent
    .replace(inlineLatex, (_: string, equation: string) => `$${equation}$`) // Convert inline LaTeX
    .replace(blockLatex, (_: string, equation: string) => `$$${equation}$$`); // Convert block LaTeX

  // Restore code blocks
  return restoreCodeBlocks(processedContent, codeBlocks);
};

/**
 * Preprocesses LaTeX content by replacing delimiters and escaping certain characters.
 *
 * @param content The input string containing LaTeX expressions.
 * @returns The processed string with replaced delimiters and escaped characters.
 */
export function preprocessLaTeX(content: string): string {
  // Step 1: Protect code blocks
  const codeBlocks: string[] = [];
  content = content.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (_, code) => {
    codeBlocks.push(code);
    return `<<CODE_BLOCK_${codeBlocks.length - 1}>>`;
  });

  // Step 2: Protect existing LaTeX expressions
  const latexExpressions: string[] = [];

  // Protect block math ($$...$$), \[...\], and \(...\) as before.
  content = content.replace(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g,
    (match) => {
      latexExpressions.push(match);
      return `<<LATEX_${latexExpressions.length - 1}>>`;
    }
  );

  // Protect inline math ($...$) only if it does NOT match a currency pattern.
  // We assume a currency pattern is one where the inner content is purely numeric (with optional decimals).
  content = content.replace(/\$([^$]+)\$/g, (match, inner) => {
    if (/^\s*\d+(?:\.\d+)?\s*$/.test(inner)) {
      // This looks like a currency value (e.g. "$123" or "$12.34"),
      // so don't protect it.
      return match;
    } else {
      // Otherwise, treat it as a LaTeX expression.
      latexExpressions.push(match);
      return `<<LATEX_${latexExpressions.length - 1}>>`;
    }
  });

  // Step 3: Escape dollar signs that are likely currency indicators.
  // (Now that inline math is protected, this will only escape dollars not already protected)
  content = content.replace(/\$(?=\d)/g, '\\$');

  // Step 4: Restore LaTeX expressions
  content = content.replace(
    /<<LATEX_(\d+)>>/g,
    (_, index) => latexExpressions[parseInt(index)]
  );

  // Step 5: Restore code blocks
  content = content.replace(
    /<<CODE_BLOCK_(\d+)>>/g,
    (_, index) => codeBlocks[parseInt(index)]
  );

  // Step 6: Apply additional escaping functions
  content = escapeBrackets(content);
  content = escapeMhchem(content);

  return content;
}

export function escapeBrackets(text: string): string {
  const pattern =
    /(```[\S\s]*?```|`.*?`)|\\\[([\S\s]*?[^\\])\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (
      match: string,
      codeBlock: string | undefined,
      squareBracket: string | undefined,
      roundBracket: string | undefined
    ): string => {
      if (codeBlock != null) {
        return codeBlock;
      } else if (squareBracket != null) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket != null) {
        return `$${roundBracket}$`;
      }
      return match;
    }
  );
}

export function escapeMhchem(text: string) {
  return text.replaceAll('$\\ce{', '$\\\\ce{').replaceAll('$\\pu{', '$\\\\pu{');
}
