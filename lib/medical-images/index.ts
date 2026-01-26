/**
 * Exportações do módulo de imagens médicas BRASILEIRAS
 * 
 * Todas as imagens vêm de fontes acadêmicas brasileiras confiáveis
 * com referências bibliográficas no formato ABNT
 */

export {
  searchMedicalImages,
  getRelevantMedicalImages,
  formatImagesForChat,
  getBibliographicReferences,
  clearImageCache,
  type MedicalImage,
  type ImageSearchResult
} from './sources'
