// Funcoes para gerenciar uploads no Supabase Storage
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Usar getSupabaseAdmin() para lazy init

const BUCKET_NAME = 'ia-images'

/**
 * Faz upload de uma imagem base64 para o Supabase Storage
 * @param base64Data - A imagem em base64 (sem o prefixo data:image/...)
 * @param userId - ID do usuário para organizar as imagens
 * @param conversaId - ID da conversa para referência
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadImageToStorage(
  base64Data: string,
  userId: string,
  conversaId: string
): Promise<string | null> {
  try {
    // Remover prefixo base64 se existir
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')

    // Converter base64 para buffer
    const buffer = Buffer.from(base64Clean, 'base64')

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${userId}/${conversaId}/${timestamp}-${randomId}.png`

    // Fazer upload
    const { data, error } = await getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // Cache por 1 ano
        upsert: false
      })

    if (error) {
      console.error('[Storage] Erro no upload:', error)
      return null
    }

    // Obter URL pública
    const { data: publicUrlData } = getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    console.log('[Storage] Upload concluído:', publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('[Storage] Erro ao fazer upload:', error)
    return null
  }
}

/**
 * Deleta uma imagem do storage
 * @param imageUrl - URL pública da imagem
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  try {
    // Extrair o path do arquivo da URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    if (pathParts.length < 2) return false

    const filePath = pathParts[1]

    const { error } = await getSupabaseAdmin().storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('[Storage] Erro ao deletar:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Storage] Erro ao deletar imagem:', error)
    return false
  }
}

/**
 * Verifica se uma URL é uma imagem do storage (não base64)
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('http') && url.includes(BUCKET_NAME)
}

/**
 * Verifica se uma string é base64
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/') || (str.length > 1000 && !str.startsWith('http'))
}
