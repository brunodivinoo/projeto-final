'use client'

interface MarkdownTextProps {
  text: string
  className?: string
}

export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  // Funcao para processar markdown simples
  const processMarkdown = (content: string): string => {
    // Processar negrito **texto**
    let processed = content.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')

    // Processar italico *texto* (mas nao **texto**)
    processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')

    // Processar codigo `texto`
    processed = processed.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono text-purple-600 dark:text-purple-400">$1</code>')

    // Processar listas com - ou •
    processed = processed.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

    // Processar listas numeradas
    processed = processed.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

    // Wrap listas consecutivas em <ul>
    processed = processed.replace(/((?:<li[^>]*>.*<\/li>\s*)+)/g, '<ul class="space-y-1">$1</ul>')

    // Processar quebras de linha
    processed = processed.replace(/\n/g, '<br />')

    // Processar titulos menores (###)
    processed = processed.replace(/###\s+(.+?)(?:<br \/>|$)/g, '<h4 class="font-bold text-base mt-3 mb-1">$1</h4>')

    // Processar titulos medios (##)
    processed = processed.replace(/##\s+(.+?)(?:<br \/>|$)/g, '<h3 class="font-bold text-lg mt-3 mb-1">$1</h3>')

    // Processar titulos grandes (#)
    processed = processed.replace(/#\s+(.+?)(?:<br \/>|$)/g, '<h2 class="font-bold text-xl mt-3 mb-1">$1</h2>')

    return processed
  }

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processMarkdown(text) }}
    />
  )
}
