import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ id: string }>
}

async function getResumo(id: string) {
  const { data, error } = await supabase
    .from('resumos_ia')
    .select('id, titulo, resumo, disciplina, assunto, created_at, compartilhado')
    .eq('id', id)
    .single()

  if (error || !data || !data.compartilhado) {
    return null
  }

  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const resumo = await getResumo(id)

  if (!resumo) {
    return {
      title: 'Resumo nao encontrado | Estuda.ai',
    }
  }

  return {
    title: `${resumo.titulo} | Estuda.ai`,
    description: resumo.resumo.substring(0, 160),
    openGraph: {
      title: resumo.titulo,
      description: resumo.resumo.substring(0, 160),
      type: 'article',
    },
  }
}

export default async function ResumoCompartilhadoPage({ params }: PageProps) {
  const { id } = await params
  const resumo = await getResumo(id)

  if (!resumo) {
    notFound()
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#141A21]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1C252E] border-b border-gray-200 dark:border-[#283039] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Estuda.ai</span>
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Criar conta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#1C252E] rounded-2xl border border-gray-200 dark:border-[#283039] shadow-xl overflow-hidden">
          {/* Resumo Header */}
          <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/5 px-6 py-6 border-b border-gray-200 dark:border-[#283039]">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {resumo.titulo}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {resumo.disciplina && (
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                      {resumo.disciplina}
                    </span>
                  )}
                  {resumo.assunto && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">/</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {resumo.assunto}
                      </span>
                    </>
                  )}
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {formatarData(resumo.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Content */}
          <div className="p-6">
            <div className="bg-gray-50 dark:bg-[#141A21] rounded-xl p-6 border border-gray-200 dark:border-[#283039]">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed overflow-x-auto">
                {resumo.resumo}
              </pre>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-500/5 to-purple-600/10 px-6 py-6 border-t border-gray-200 dark:border-[#283039]">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Gere seus proprios resumos com IA gratuitamente!
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Comecar agora
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Resumo gerado com inteligencia artificial pelo{' '}
            <Link href="/" className="text-purple-500 hover:underline">
              Estuda.ai
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
