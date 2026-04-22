'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase'
import { OnboardingStep, type OnboardingData, type ExamType, MEDICAL_SPECIALTIES, TOP_INSTITUTIONS } from '@/types/prepamed'

const TOTAL_STEPS = 6

const EXAM_OPTIONS: { value: ExamType; label: string; description: string }[] = [
  { value: 'residencia_medica', label: 'Residência Médica', description: 'Concursos de residência em hospitais e universidades brasileiras' },
  { value: 'revalida', label: 'Revalida', description: 'Revalidação do diploma de medicina obtido no exterior' },
  { value: 'enare', label: 'ENARE', description: 'Exame Nacional de Residência' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.ExamType)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    exam_type: null,
    target_institutions: [],
    exam_date: null,
    specialties: [],
    study_hours_per_day: 4,
    full_name: '',
  })

  const update = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleArrayItem = useCallback(<T extends string>(key: 'specialties' | 'target_institutions', item: T) => {
    setData(prev => {
      const arr = prev[key] as T[]
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item],
      }
    })
  }, [])

  async function saveAndFinish() {
    setSaving(true)
    setError(null)
    const supabase = getSupabaseBrowser()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: upsertError } = await supabase
      .from('prepamed_profiles')
      .upsert({
        user_id: user.id,
        full_name: data.full_name,
        exam_type: data.exam_type,
        target_institutions: data.target_institutions,
        exam_date: data.exam_date,
        specialties: data.specialties,
        study_hours_per_day: data.study_hours_per_day,
        level: 1,
        xp: 0,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      setError('Erro ao salvar perfil. Tente novamente.')
      setSaving(false)
      return
    }

    // Grant XP for completing onboarding
    await supabase.from('prepamed_xp_events').insert({
      user_id: user.id,
      source: 'onboarding_complete',
      points: 50,
    })

    router.push('/app/dashboard')
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(s => (s + 1) as OnboardingStep)
    else saveAndFinish()
  }

  function back() {
    if (step > 1) setStep(s => (s - 1) as OnboardingStep)
  }

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const canProceed = (() => {
    switch (step) {
      case OnboardingStep.ExamType: return !!data.exam_type
      case OnboardingStep.Institutions: return data.target_institutions.length > 0
      case OnboardingStep.Goals: return !!data.exam_date && !!data.full_name
      case OnboardingStep.Specialties: return data.specialties.length > 0
      case OnboardingStep.StudyHours: return data.study_hours_per_day >= 1
      case OnboardingStep.Plan: return true
      default: return false
    }
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step counter */}
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-2">
            Passo {step} de {TOTAL_STEPS}
          </p>

          {/* Step content */}
          {step === OnboardingStep.ExamType && (
            <StepExamType value={data.exam_type} onChange={v => update('exam_type', v)} />
          )}
          {step === OnboardingStep.Institutions && (
            <StepInstitutions selected={data.target_institutions} toggle={item => toggleArrayItem('target_institutions', item)} />
          )}
          {step === OnboardingStep.Goals && (
            <StepGoals
              fullName={data.full_name}
              examDate={data.exam_date}
              onNameChange={v => update('full_name', v)}
              onDateChange={v => update('exam_date', v)}
            />
          )}
          {step === OnboardingStep.Specialties && (
            <StepSpecialties selected={data.specialties} toggle={item => toggleArrayItem('specialties', item)} />
          )}
          {step === OnboardingStep.StudyHours && (
            <StepStudyHours value={data.study_hours_per_day} onChange={v => update('study_hours_per_day', v)} />
          )}
          {step === OnboardingStep.Plan && (
            <StepPlan />
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={back}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
              >
                Voltar
              </button>
            )}
            <button
              onClick={step === TOTAL_STEPS ? saveAndFinish : next}
              disabled={!canProceed || saving}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
            >
              {saving ? 'Salvando...' : step === TOTAL_STEPS ? 'Começar!' : 'Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Exam type ────────────────────────────────────────
function StepExamType({ value, onChange }: { value: ExamType | null; onChange: (v: ExamType) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Qual prova você vai fazer?</h2>
      <p className="text-slate-500 text-sm mb-6">Vamos personalizar seu plano de estudos.</p>
      <div className="space-y-3">
        {EXAM_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full text-left px-4 py-4 rounded-xl border-2 transition ${
              value === opt.value
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <p className="font-semibold text-slate-900">{opt.label}</p>
            <p className="text-sm text-slate-500 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2: Target institutions ──────────────────────────────
function StepInstitutions({ selected, toggle }: { selected: string[]; toggle: (item: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Onde você quer passar?</h2>
      <p className="text-slate-500 text-sm mb-6">Selecione uma ou mais instituições.</p>
      <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
        {TOP_INSTITUTIONS.map(inst => (
          <button
            key={inst}
            onClick={() => toggle(inst)}
            className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${
              selected.includes(inst)
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-indigo-600 mt-3 font-medium">{selected.length} selecionada(s)</p>
      )}
    </div>
  )
}

// ── Step 3: Goals (name + exam date) ────────────────────────
function StepGoals({
  fullName, examDate, onNameChange, onDateChange
}: {
  fullName: string; examDate: string | null
  onNameChange: (v: string) => void; onDateChange: (v: string) => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Seus objetivos</h2>
      <p className="text-slate-500 text-sm mb-6">Informe seu nome e quando é sua prova.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seu nome</label>
          <input
            type="text"
            value={fullName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Como prefere ser chamado?"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data da prova (aproximada)</label>
          <input
            type="month"
            value={examDate?.slice(0, 7) ?? ''}
            onChange={e => onDateChange(e.target.value ? `${e.target.value}-01` : null as unknown as string)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Specialties ──────────────────────────────────────
function StepSpecialties({ selected, toggle }: { selected: string[]; toggle: (item: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Áreas de interesse</h2>
      <p className="text-slate-500 text-sm mb-6">Quais especialidades te interessam mais?</p>
      <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto">
        {MEDICAL_SPECIALTIES.map(spec => (
          <button
            key={spec}
            onClick={() => toggle(spec)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
              selected.includes(spec)
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 text-slate-600 hover:border-indigo-400'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-indigo-600 mt-3 font-medium">{selected.length} selecionada(s)</p>
      )}
    </div>
  )
}

// ── Step 5: Study hours per day ──────────────────────────────
function StepStudyHours({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const options = [1, 2, 3, 4, 5, 6, 8, 10]
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Horas de estudo por dia</h2>
      <p className="text-slate-500 text-sm mb-6">Vamos criar um cronograma realista pra você.</p>
      <div className="grid grid-cols-4 gap-3">
        {options.map(h => (
          <button
            key={h}
            onClick={() => onChange(h)}
            className={`py-4 rounded-xl border-2 font-bold text-lg transition ${
              value === h
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 text-slate-700 hover:border-indigo-400'
            }`}
          >
            {h}h
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 mt-4 text-center">
        Selecionado: <strong>{value} hora{value !== 1 ? 's' : ''}</strong> por dia
      </p>
    </div>
  )
}

// ── Step 6: Plan selection ───────────────────────────────────
function StepPlan() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Seu plano de acesso</h2>
      <p className="text-slate-500 text-sm mb-6">Comece grátis. Faça upgrade quando quiser.</p>
      <div className="space-y-3">
        <div className="border-2 border-indigo-600 bg-indigo-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-indigo-700">Grátis</span>
            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Selecionado</span>
          </div>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>✓ Acesso ao tutor IA (limitado)</li>
            <li>✓ 20 questões por dia</li>
            <li>✓ Flashcards básicos</li>
            <li>✓ Dashboard de progresso</li>
          </ul>
        </div>
        <div className="border border-slate-200 rounded-xl p-4 opacity-75">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700">Pro — R$ 49/mês</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Em breve</span>
          </div>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✓ IA ilimitada (Claude Sonnet)</li>
            <li>✓ Questões ilimitadas + simulados</li>
            <li>✓ Plano de estudos personalizado</li>
            <li>✓ OSCE com voz IA</li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center mt-4">Não precisa de cartão para começar.</p>
    </div>
  )
}
