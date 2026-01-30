// Components de Chat centralizado
export { QuickActions, generatePersonalizedActions } from './QuickActions'
export type { QuickAction, UserProfileForActions } from './QuickActions'

export { ChatHistory, categorizeConversation } from './ChatHistory'
export type { Conversation } from './ChatHistory'

export { UsageLimits } from './UsageLimits'
export type { UsageLimitsProps } from './UsageLimits'

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
  EstatisticasQuestoes
} from './QuestaoInterativa'
export type { QuestaoData, Alternativa, GabaritoComentado } from './QuestaoInterativa'
