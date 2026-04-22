export type ExamType = 'residencia_medica' | 'revalida' | 'enare'

export type PlanSlug = 'free' | 'basic' | 'pro'

export interface PrepaMedProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  exam_type: ExamType | null
  target_institutions: string[] | null
  exam_date: string | null
  study_hours_per_day: number
  specialties: string[] | null
  level: number
  xp: number
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  slug: PlanSlug
  price_brl: number
  features: Record<string, unknown>
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end: string | null
}

export interface XPEvent {
  id: string
  user_id: string
  source: string
  points: number
  created_at: string
}

export interface Achievement {
  id: string
  slug: string
  name: string
  description: string
  icon: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}

export enum OnboardingStep {
  ExamType = 1,
  Institutions = 2,
  Goals = 3,
  Specialties = 4,
  StudyHours = 5,
  Plan = 6,
}

export interface OnboardingData {
  exam_type: ExamType | null
  target_institutions: string[]
  exam_date: string | null
  specialties: string[]
  study_hours_per_day: number
  full_name: string
}

export const MEDICAL_SPECIALTIES = [
  'Clínica Médica',
  'Cirurgia Geral',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina de Família',
  'Cardiologia',
  'Neurologia',
  'Ortopedia',
  'Psiquiatria',
  'Dermatologia',
  'Oftalmologia',
  'Otorrinolaringologia',
  'Urologia',
  'Radiologia',
  'Anestesiologia',
  'Patologia',
  'Medicina do Trabalho',
  'Medicina de Urgência',
  'Infectologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Pneumologia',
  'Reumatologia',
  'Nefrologia',
  'Hematologia',
  'Oncologia',
  'Medicina Intensiva',
  'Cirurgia Plástica',
  'Cirurgia Vascular',
  'Medicina Nuclear',
] as const

export const TOP_INSTITUTIONS = [
  'USP - Universidade de São Paulo',
  'UNIFESP - Universidade Federal de São Paulo',
  'UNICAMP - Universidade Estadual de Campinas',
  'UFRJ - Universidade Federal do Rio de Janeiro',
  'UERJ - Universidade do Estado do Rio de Janeiro',
  'FMUSP - Faculdade de Medicina da USP',
  'FIOCRUZ',
  'Hospital das Clínicas (SP)',
  'Hospital das Clínicas (MG)',
  'Santa Casa de São Paulo',
  'Hospital Albert Einstein',
  'Hospital Sírio-Libanês',
  'INCOR',
  'HU - Hospital Universitário',
  'IMIP',
  'HUPE - Hospital Universitário Pedro Ernesto',
  'INCA',
  'UNESP',
  'UFMG',
  'UFBA',
] as const
