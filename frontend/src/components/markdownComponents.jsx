import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 leading-relaxed text-sm text-slate-800 whitespace-pre-wrap line-height-1.5">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-3">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-3">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 pl-4 italic text-gray-500 mb-3">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-blue-600 underline hover:text-blue-800">
      {children}
    </a>
  ),
};

export default markdownComponents;
