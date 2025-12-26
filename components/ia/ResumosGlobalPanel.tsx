'use client'

import { useResumos } from '@/contexts/ResumosContext'
import VisualizadorResumoPanel from './VisualizadorResumoPanel'

export default function ResumosGlobalPanel() {
  const {
    resumoSelecionado,
    painelAberto,
    fecharPainel,
    compartilharResumo,
    salvarResumo,
    excluirResumo
  } = useResumos()

  return (
    <VisualizadorResumoPanel
      resumo={resumoSelecionado}
      isOpen={painelAberto}
      onClose={fecharPainel}
      onCompartilhar={compartilharResumo}
      onSalvar={salvarResumo}
      onExcluir={excluirResumo}
    />
  )
}
