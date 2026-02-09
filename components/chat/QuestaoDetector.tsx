'use client'

import { useMemo, useCallback, memo} from 'react'
import { QuestaoInterativa, type QuestaoData } from './QuestaoInterativa'

interface QuestaoDetectorProps {
  conteudo: string
  onResponder?: (questao: QuestaoData, letra: string, acertou: boolean, tempoSegundos: number) => void
  onProxima?: () => void
  questoesRespondidas?: Set<number>
}

/**
 * Detecta questões no formato ```questao {...} ``` no conteúdo do chat
 * e renderiza o componente QuestaoInterativa
 */
function QuestaoDetectorRaw({
  conteudo,
  onResponder,
  onProxima,
  questoesRespondidas = new Set()
}: QuestaoDetectorProps) {
  // Função para remover conteúdo de gabarito do texto
  const removerGabarito = (texto: string): string => {
    // Remove seções de gabarito comentado que aparecem como markdown
    let limpo = texto

    // Padrões de gabarito a remover
    const padroesGabarito = [
      /---\s*\n?\s*\*?\*?📚?\s*GABARITO COMENTADO[\s\S]*?(?=---|\n```questao|$)/gi,
      /\*?\*?📚?\s*GABARITO COMENTADO\s*-?\s*Questão\s*\d+\*?\*?[\s\S]*?(?=\*?\*?📚?\s*GABARITO COMENTADO|\n```questao|$)/gi,
      /✅\s*Resposta correta:[\s\S]*?(?=\n```questao|✅\s*Resposta correta|$)/gi,
      /🔬\s*EXPLICAÇÃO DETALHADA:[\s\S]*?(?=\n```questao|🔬\s*EXPLICAÇÃO DETALHADA|$)/gi,
      /❌\s*POR QUE AS OUTRAS ESTÃO ERRADAS:[\s\S]*?(?=\n```questao|❌\s*POR QUE|$)/gi,
      /💡\s*DICA DE MEMORIZAÇÃO:[\s\S]*?(?=\n```questao|💡\s*DICA|$)/gi,
      /📖\s*REFERÊNCIAS BIBLIOGRÁFICAS[\s\S]*?(?=\n```questao|📖\s*REFERÊNCIAS|$)/gi,
      /🔗\s*TEMAS RELACIONADOS:[\s\S]*?(?=\n```questao|🔗\s*TEMAS|$)/gi,
      /🖼️\s*IMAGENS DE REFERÊNCIA:[\s\S]*?(?=\n```questao|🖼️\s*IMAGENS|$)/gi,
      /📌\s*Fonte:[\s\S]*?(?=\n\n|\n```questao|$)/gi,
      /\*?\*?Alternativa\s+[A-E]\s*\([^)]+\)\*?\*?:[\s\S]*?(?=\*?\*?Alternativa|```questao|$)/gi,
    ]

    for (const padrao of padroesGabarito) {
      limpo = limpo.replace(padrao, '')
    }

    // Limpar linhas vazias extras
    limpo = limpo.replace(/\n{3,}/g, '\n\n').trim()

    return limpo
  }

  // Extrair questões do conteúdo
  const partes = useMemo(() => {
    const resultado: Array<{ tipo: 'texto' | 'questao'; conteudo: string; questao?: QuestaoData }> = []

    // Regex para encontrar blocos de questão
    const questaoRegex = /```questao\s*([\s\S]*?)```/g

    let lastIndex = 0
    let match

    while ((match = questaoRegex.exec(conteudo)) !== null) {
      // Adicionar texto antes da questão (removendo gabarito)
      if (match.index > lastIndex) {
        const textoAntes = removerGabarito(conteudo.slice(lastIndex, match.index).trim())
        if (textoAntes) {
          resultado.push({ tipo: 'texto', conteudo: textoAntes })
        }
      }

      // Tentar parsear a questão
      try {
        const questaoJson = match[1].trim()
        const questao = JSON.parse(questaoJson) as QuestaoData

        // Validar campos obrigatórios
        if (questao.numero && questao.enunciado && questao.alternativas && questao.gabarito_comentado) {
          resultado.push({
            tipo: 'questao',
            conteudo: match[0],
            questao
          })
        } else {
          // JSON inválido como questão, mostrar como texto
          resultado.push({ tipo: 'texto', conteudo: match[0] })
        }
      } catch {
        // Erro de parsing, mostrar como texto
        resultado.push({ tipo: 'texto', conteudo: match[0] })
      }

      lastIndex = match.index + match[0].length
    }

    // Adicionar texto restante (removendo gabarito)
    if (lastIndex < conteudo.length) {
      const textoRestante = removerGabarito(conteudo.slice(lastIndex).trim())
      if (textoRestante) {
        resultado.push({ tipo: 'texto', conteudo: textoRestante })
      }
    }

    return resultado
  }, [conteudo])

  const handleResponder = useCallback((questao: QuestaoData) => {
    return (letra: string, acertou: boolean, tempoSegundos: number) => {
      onResponder?.(questao, letra, acertou, tempoSegundos)
    }
  }, [onResponder])

  // Se não há questões, retornar null (o componente pai renderiza o texto normalmente)
  const temQuestao = partes.some(p => p.tipo === 'questao')
  if (!temQuestao) {
    return null
  }

  return (
    <div className="space-y-4">
      {partes.map((parte, index) => {
        if (parte.tipo === 'texto') {
          // O texto será renderizado pelo ArtifactRenderer
          // Aqui só renderizamos se houver texto entre questões
          return (
            <div key={index} className="prose prose-slate prose-sm max-w-none text-xs md:text-sm">
              {parte.conteudo}
            </div>
          )
        }

        if (parte.tipo === 'questao' && parte.questao) {
          const jaRespondida = questoesRespondidas.has(parte.questao.numero)

          return (
            <QuestaoInterativa
              key={`questao-${parte.questao.numero}`}
              questao={parte.questao}
              onResponder={handleResponder(parte.questao)}
              onProxima={onProxima}
              showTimer={!jaRespondida}
              autoShowGabarito={false}
            />
          )
        }

        return null
      })}
    </div>
  )
}

/**
 * Hook para verificar se um conteúdo contém questões
 */
export function useTemQuestao(conteudo: string): boolean {
  return useMemo(() => {
    const questaoRegex = /```questao\s*\{[\s\S]*?\}[\s\S]*?```/
    return questaoRegex.test(conteudo)
  }, [conteudo])
}

/**
 * Extrai questões do conteúdo
 */
export function extrairQuestoes(conteudo: string): QuestaoData[] {
  const questoes: QuestaoData[] = []
  const questaoRegex = /```questao\s*([\s\S]*?)```/g

  let match
  while ((match = questaoRegex.exec(conteudo)) !== null) {
    try {
      const questao = JSON.parse(match[1].trim()) as QuestaoData
      if (questao.numero && questao.enunciado && questao.alternativas && questao.gabarito_comentado) {
        questoes.push(questao)
      }
    } catch {
      // Ignorar erros de parsing
    }
  }

  return questoes
}

export const QuestaoDetector = memo(QuestaoDetectorRaw)
