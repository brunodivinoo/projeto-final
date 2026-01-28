/**
 * Exportações do módulo de imagens médicas BRASILEIRAS
 * 
 * Todas as imagens vêm de fontes acadêmicas brasileiras confiáveis:
 * - MOL USP (Microscopia Online)
 * - UNICAMP (Anatomia Patológica)
 * - SciELO Brasil
 * - Fiocruz
 * - Universidades federais
 * 
 * Todas incluem referências bibliográficas no formato ABNT
 */

export {
  searchMedicalImages,
  formatarImagensParaChat,
  obterReferenciasABNT,
  clearImageCache,
  type ImagemMedicaBrasileira,
  type ResultadoBusca
} from './service'

// Re-exportar aliases em inglês para compatibilidade
export { 
  type ImagemMedicaBrasileira as MedicalImage,
  type ResultadoBusca as SearchResult 
} from './service'
