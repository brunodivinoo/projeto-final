// Components de Chat centralizado
export { QuickActions, generatePersonalizedActions, type QuickAction, type UserProfileForActions } from './QuickActions'
export { ChatHistory, categorizeConversation, type Conversation } from './ChatHistory'
export { UsageLimits, type UsageLimitsProps } from './UsageLimits'
export { ChatInput } from './ChatInput'

// Novos componentes do sistema de modos
export { 
  ModeSelector, 
  ModeSessionCard, 
  ModeChangeMarker, 
  ModeIndicator 
} from './ModeSelector'

export { 
  QuestaoInterativa, 
  EstatisticasQuestoes,
  type QuestaoData,
  type Alternativa,
  type GabaritoComentado
} from './QuestaoInterativa'
