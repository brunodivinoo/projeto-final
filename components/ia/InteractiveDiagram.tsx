'use client'

import { useState } from 'react'
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react'

interface InteractiveDiagramProps {
  type: 'ecg' | 'metabolism' | 'anatomy' | 'pathway' | 'comparison' | 'timeline'
  title: string
  data?: Record<string, unknown>
}

// Componente de onda ECG
function ECGWave({ type, label, description, color = "#10b981" }: {
  type: string
  label: string
  description?: string
  color?: string
}) {
  const getPath = () => {
    switch(type) {
      case 'normal':
        return "M 0 50 L 15 50 L 18 50 Q 22 48 25 50 L 30 50 L 32 50 L 35 20 L 38 55 L 40 50 L 55 50 Q 60 40 65 50 L 80 50 Q 85 55 90 50 L 100 50"
      case 'hyperacute':
        return "M 0 50 L 15 50 L 18 50 Q 22 48 25 50 L 30 50 L 32 50 L 35 15 L 38 55 L 40 45 L 55 35 Q 65 10 75 35 L 90 45 L 100 50"
      case 'acute':
        return "M 0 50 L 10 50 L 12 50 Q 15 48 18 50 L 22 50 L 24 50 L 27 25 L 30 55 L 32 30 L 50 25 Q 60 20 70 40 L 85 55 L 100 50"
      case 'subacute':
        return "M 0 50 L 8 50 L 10 65 L 14 65 L 16 50 L 18 50 L 20 50 L 23 30 L 26 55 L 28 50 L 45 50 Q 55 70 65 50 L 80 50 L 100 50"
      case 'chronic':
        return "M 0 50 L 8 50 L 10 65 L 14 65 L 16 50 L 18 50 L 20 50 L 23 35 L 26 52 L 28 50 L 50 50 Q 55 55 60 50 L 80 50 L 100 50"
      case 'st_elevation':
        return "M 0 50 L 15 50 L 18 50 Q 22 48 25 50 L 28 50 L 30 50 L 33 25 L 36 52 L 38 35 L 55 30 Q 65 25 75 45 L 90 50 L 100 50"
      default:
        return "M 0 50 L 100 50"
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-white/10">
      <svg viewBox="0 0 100 70" className="w-full h-20">
        <rect x="0" y="0" width="100" height="70" fill="#0f172a" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="2"/>
        <path d={getPath()} fill="none" stroke={color} strokeWidth="2"/>
      </svg>
      <p className="font-semibold text-sm text-center mt-1 text-white">{label}</p>
      {description && <p className="text-xs text-white/60 text-center">{description}</p>}
    </div>
  )
}

// Grid de derivações do ECG
function ECGGrid({ highlights = {}, title }: {
  highlights?: { elevation?: string[], depression?: string[], qwave?: string[] }
  title?: string
}) {
  const leads = [
    ['DI', 'aVR', 'V1', 'V4'],
    ['DII', 'aVL', 'V2', 'V5'],
    ['DIII', 'aVF', 'V3', 'V6']
  ]

  const getLeadStyle = (lead: string) => {
    if (highlights.elevation?.includes(lead)) {
      return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: '↑ST' }
    }
    if (highlights.depression?.includes(lead)) {
      return { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', icon: '↓ST' }
    }
    if (highlights.qwave?.includes(lead)) {
      return { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', icon: 'Q' }
    }
    return { bg: 'bg-slate-800', border: 'border-white/10', text: 'text-white/60', icon: '' }
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
      {title && <h4 className="font-bold text-center mb-3 text-white">{title}</h4>}
      <div className="grid grid-cols-4 gap-2">
        {leads.flat().map((lead) => {
          const style = getLeadStyle(lead)
          return (
            <div
              key={lead}
              className={`${style.bg} ${style.border} border-2 rounded p-2 text-center transition-all hover:scale-105`}
            >
              <p className={`font-bold ${style.text}`}>{lead}</p>
              {style.icon && (
                <p className={`text-xs font-semibold ${style.text}`}>{style.icon}</p>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-white/60">Supra ST</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-white/60">Infra ST</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-white/60">Onda Q</span>
        </span>
      </div>
    </div>
  )
}

// Diagrama de ECG IAM interativo
function ECGIAMDiagram() {
  const [activeSection, setActiveSection] = useState('evolution')

  const sections = [
    { id: 'evolution', label: 'Evolução' },
    { id: 'locations', label: 'Localização' },
    { id: 'criteria', label: 'Critérios' }
  ]

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex flex-wrap justify-center gap-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
              activeSection === section.id
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-slate-800 text-white/60 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
        {activeSection === 'evolution' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center text-white">Evolução Temporal do IAM</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-red-900/30 rounded-xl p-3 border border-red-500/30">
                <h4 className="font-bold text-red-400 text-center text-sm mb-2">HIPERAGUDO</h4>
                <p className="text-xs text-center text-white/40 mb-2">Minutos a horas</p>
                <ECGWave type="hyperacute" label="T Hiperagudas" color="#ef4444" />
                <ul className="text-xs mt-2 space-y-1 text-white/60">
                  <li>• T altas e apiculadas</li>
                  <li>• ST começa a elevar</li>
                </ul>
              </div>

              <div className="bg-orange-900/30 rounded-xl p-3 border border-orange-500/30">
                <h4 className="font-bold text-orange-400 text-center text-sm mb-2">AGUDO</h4>
                <p className="text-xs text-center text-white/40 mb-2">Horas a dias</p>
                <ECGWave type="acute" label="Supra ST" color="#f97316" />
                <ul className="text-xs mt-2 space-y-1 text-white/60">
                  <li>• Supra ST convexo</li>
                  <li>• Ondas Q surgem</li>
                </ul>
              </div>

              <div className="bg-yellow-900/30 rounded-xl p-3 border border-yellow-500/30">
                <h4 className="font-bold text-yellow-400 text-center text-sm mb-2">SUBAGUDO</h4>
                <p className="text-xs text-center text-white/40 mb-2">Dias a semanas</p>
                <ECGWave type="subacute" label="T Invertidas + Q" color="#eab308" />
                <ul className="text-xs mt-2 space-y-1 text-white/60">
                  <li>• ST normaliza</li>
                  <li>• T inverte</li>
                </ul>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-500/30">
                <h4 className="font-bold text-slate-300 text-center text-sm mb-2">CRÔNICO</h4>
                <p className="text-xs text-center text-white/40 mb-2">{'>'}2 semanas</p>
                <ECGWave type="chronic" label="Onda Q" color="#94a3b8" />
                <ul className="text-xs mt-2 space-y-1 text-white/60">
                  <li>• Q permanente</li>
                  <li>• T pode normalizar</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'locations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center text-white">Localização por Território</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-white/10">
                <div className="bg-red-600 text-white p-2">
                  <h4 className="font-bold text-center text-sm">IAM ANTERIOR</h4>
                  <p className="text-xs text-center text-red-200">DA</p>
                </div>
                <div className="p-3">
                  <ECGGrid
                    highlights={{
                      elevation: ['V1', 'V2', 'V3', 'V4'],
                      depression: ['DII', 'DIII', 'aVF']
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl overflow-hidden border border-white/10">
                <div className="bg-blue-600 text-white p-2">
                  <h4 className="font-bold text-center text-sm">IAM INFERIOR</h4>
                  <p className="text-xs text-center text-blue-200">CD/Cx</p>
                </div>
                <div className="p-3">
                  <ECGGrid
                    highlights={{
                      elevation: ['DII', 'DIII', 'aVF'],
                      depression: ['DI', 'aVL']
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl overflow-hidden border border-white/10">
                <div className="bg-green-600 text-white p-2">
                  <h4 className="font-bold text-center text-sm">IAM LATERAL</h4>
                  <p className="text-xs text-center text-green-200">Cx/Diagonal</p>
                </div>
                <div className="p-3">
                  <ECGGrid
                    highlights={{
                      elevation: ['DI', 'aVL', 'V5', 'V6'],
                      depression: ['V1', 'V2']
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'criteria' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center text-white">Critérios Diagnósticos</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                <h4 className="font-semibold text-red-400 mb-3">Supra ST em V2-V3:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">♂ &lt;40a</span>
                    <span className="text-white">≥ 2,5 mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-800 text-white px-2 py-1 rounded text-xs">♂ ≥40a</span>
                    <span className="text-white">≥ 2,0 mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-pink-600 text-white px-2 py-1 rounded text-xs">♀</span>
                    <span className="text-white">≥ 1,5 mm</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30">
                <h4 className="font-semibold text-orange-400 mb-3">Onda Q Patológica:</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800 rounded p-2">
                    <p className="font-bold text-orange-400">≥ 40 ms</p>
                    <p className="text-xs text-white/40">Duração</p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="font-bold text-orange-400">≥ 25%</p>
                    <p className="text-xs text-white/40">da onda R</p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="font-bold text-orange-400">V1-V3</p>
                    <p className="text-xs text-white/40">Qualquer Q</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Diagrama de metabolismo de carboidratos
function MetabolismDiagram() {
  const [activeTab, setActiveTab] = useState('glycolysis')

  const tabs = [
    { id: 'glycolysis', label: 'Glicólise' },
    { id: 'krebs', label: 'Krebs' },
    { id: 'etc', label: 'Cadeia Resp.' }
  ]

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-white/60 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
        {activeTab === 'glycolysis' && (
          <div className="max-w-md mx-auto space-y-3">
            <h3 className="text-lg font-bold text-center text-white">Glicólise</h3>
            <p className="text-center text-white/40 text-sm">Citoplasma | 10 reações</p>

            <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/20">
              <h4 className="font-bold text-red-400 text-sm mb-2">INVESTIMENTO (-2 ATP)</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-slate-800 rounded p-2 text-center text-blue-400 font-semibold">GLICOSE (6C)</div>
                <div className="text-center text-white/40">↓ Hexoquinase (-1 ATP)</div>
                <div className="bg-slate-800 rounded p-2 text-center text-blue-400">Glicose-6-P</div>
                <div className="text-center text-white/40">↓ PFK-1 (-1 ATP)</div>
                <div className="bg-slate-800 rounded p-2 text-center text-blue-400">Frutose-1,6-bisP</div>
              </div>
            </div>

            <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/20">
              <h4 className="font-bold text-green-400 text-sm mb-2">RENDIMENTO (+4 ATP, +2 NADH)</h4>
              <div className="space-y-2 text-sm">
                <div className="bg-slate-800 rounded p-2 text-center text-green-400">2× G3P (3C)</div>
                <div className="text-center text-white/40">↓ (+2 NADH, +2 ATP)</div>
                <div className="bg-slate-800 rounded p-2 text-center text-green-400">2× PEP</div>
                <div className="text-center text-white/40">↓ Piruvato Quinase (+2 ATP)</div>
                <div className="bg-slate-800 rounded p-2 text-center text-orange-400 font-bold">2× PIRUVATO (3C)</div>
              </div>
            </div>

            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
              <h4 className="font-bold text-blue-400 text-sm text-center">RENDIMENTO LÍQUIDO</h4>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-green-400">2 ATP</p>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-yellow-400">2 NADH</p>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-orange-400">2 Piruvato</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'krebs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center text-white">Ciclo de Krebs</h3>
            <p className="text-center text-white/40 text-sm">Matriz Mitocondrial | 8 reações</p>

            <div className="relative max-w-md mx-auto">
              <svg viewBox="0 0 300 300" className="w-full">
                {/* Círculo central */}
                <circle cx="150" cy="150" r="100" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.3"/>

                {/* Entrada Acetil-CoA */}
                <text x="150" y="30" textAnchor="middle" fill="#ec4899" fontSize="12" fontWeight="bold">Acetil-CoA (2C)</text>
                <line x1="150" y1="35" x2="150" y2="55" stroke="#ec4899" strokeWidth="2"/>

                {/* Compostos do ciclo */}
                <circle cx="150" cy="70" r="22" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="150" y="73" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Citrato</text>

                <circle cx="230" cy="110" r="22" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="230" y="113" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Isocitrato</text>

                <circle cx="250" cy="180" r="25" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="250" y="177" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">α-Ceto-</text>
                <text x="250" y="187" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">glutarato</text>

                <circle cx="200" cy="250" r="22" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="200" y="247" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Succinil</text>
                <text x="200" y="257" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">CoA</text>

                <circle cx="100" cy="250" r="22" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="100" y="253" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Succinato</text>

                <circle cx="50" cy="180" r="22" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="50" y="183" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Fumarato</text>

                <circle cx="70" cy="110" r="22" fill="#1e3a5f" stroke="#10b981" strokeWidth="2"/>
                <text x="70" y="113" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Malato</text>

                <circle cx="110" cy="60" r="25" fill="#1e3a5f" stroke="#ef4444" strokeWidth="2"/>
                <text x="110" y="57" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">Oxalo-</text>
                <text x="110" y="67" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">acetato</text>
              </svg>
            </div>

            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20 max-w-md mx-auto">
              <h4 className="font-bold text-blue-400 text-sm text-center">POR ACETIL-CoA</h4>
              <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs">
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-yellow-400">3 NADH</p>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-orange-400">1 FADH₂</p>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-green-400">1 GTP</p>
                </div>
                <div className="bg-slate-800 rounded p-2">
                  <p className="font-bold text-red-400">2 CO₂</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'etc' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center text-white">Cadeia Transportadora de Elétrons</h3>
            <p className="text-center text-white/40 text-sm">Membrana Mitocondrial Interna</p>

            <div className="bg-gradient-to-b from-blue-900/30 to-slate-900/30 rounded-lg p-4">
              <p className="text-xs text-center text-blue-400 mb-3">Espaço Intermembranas (H⁺ alto)</p>

              <div className="flex justify-around items-end">
                <div className="text-center">
                  <div className="bg-red-600 rounded-lg p-2 text-white text-xs font-bold">I</div>
                  <p className="text-xs text-white/60 mt-1">NADH</p>
                  <p className="text-xs text-blue-400">4 H⁺↑</p>
                </div>
                <div className="text-center">
                  <div className="bg-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold">Q</div>
                </div>
                <div className="text-center">
                  <div className="bg-orange-600 rounded-lg p-2 text-white text-xs font-bold">II</div>
                  <p className="text-xs text-white/60 mt-1">FADH₂</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-600 rounded-lg p-2 text-white text-xs font-bold">III</div>
                  <p className="text-xs text-blue-400 mt-1">4 H⁺↑</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold">c</div>
                </div>
                <div className="text-center">
                  <div className="bg-blue-600 rounded-lg p-2 text-white text-xs font-bold">IV</div>
                  <p className="text-xs text-blue-400 mt-1">2 H⁺↑</p>
                  <p className="text-xs text-green-400">O₂→H₂O</p>
                </div>
                <div className="text-center">
                  <div className="bg-pink-600 rounded-lg p-2 text-white text-xs font-bold">V</div>
                  <p className="text-xs text-pink-400 mt-1">ATP</p>
                </div>
              </div>

              <p className="text-xs text-center text-blue-400 mt-3">Matriz Mitocondrial (H⁺ baixo)</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/20 text-center">
                <p className="font-bold text-yellow-400">NADH</p>
                <p className="text-2xl font-bold text-yellow-300">~2.5 ATP</p>
              </div>
              <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-500/20 text-center">
                <p className="font-bold text-orange-400">FADH₂</p>
                <p className="text-2xl font-bold text-orange-300">~1.5 ATP</p>
              </div>
            </div>

            <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/20 text-center max-w-md mx-auto">
              <h4 className="font-bold text-green-400">Total por Glicose</h4>
              <p className="text-3xl font-bold text-green-300 mt-2">30-32 ATP</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente principal
export default function InteractiveDiagram({ type, title }: InteractiveDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const renderContent = () => {
    switch (type) {
      case 'ecg':
        return <ECGIAMDiagram />
      case 'metabolism':
        return <MetabolismDiagram />
      default:
        return (
          <div className="text-center text-white/60 p-8">
            Diagrama interativo não disponível para este tipo.
          </div>
        )
    }
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/98 overflow-auto">
        <div className="min-h-screen p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900/95 p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h2 className="text-white font-semibold">{title}</h2>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-4 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-white/80 text-sm font-medium">{title}</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Interativo</span>
        </div>
        <button
          onClick={() => setIsFullscreen(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          title="Tela cheia"
        >
          <Maximize2 className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  )
}
