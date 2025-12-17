'use client'
import { Header } from '@/components/layout/Header'
import { useState } from 'react'

interface Revisao {
  id: number
  topico: string
  materia: string
  status: 'atrasado' | 'hoje' | 'agendado' | 'concluido'
  proximaRevisao: string
  cicloProgresso: number
}

const revisoesExemplo: Revisao[] = [
  {
    id: 1,
    topico: 'Logaritmos',
    materia: 'Matemática',
    status: 'atrasado',
    proximaRevisao: 'Há 2 dias',
    cicloProgresso: 30,
  },
  {
    id: 2,
    topico: 'Revolução Francesa',
    materia: 'História',
    status: 'hoje',
    proximaRevisao: 'Hoje',
    cicloProgresso: 55,
  },
  {
    id: 3,
    topico: 'Citologia',
    materia: 'Biologia',
    status: 'agendado',
    proximaRevisao: 'Em 3 dias',
    cicloProgresso: 15,
  },
  {
    id: 4,
    topico: 'Cinemática',
    materia: 'Física',
    status: 'agendado',
    proximaRevisao: 'Em 5 dias',
    cicloProgresso: 80,
  },
  {
    id: 5,
    topico: 'Estequiometria',
    materia: 'Química',
    status: 'concluido',
    proximaRevisao: '--',
    cicloProgresso: 100,
  },
]

export default function RevisoesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPage, setCurrentPage] = useState(1)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'atrasado':
        return {
          label: 'Atrasado',
          bgClass: 'bg-red-100 dark:bg-red-500/10',
          textClass: 'text-red-700 dark:text-red-400',
          borderClass: 'border-red-200 dark:border-red-500/20',
          dotClass: 'bg-red-500',
        }
      case 'hoje':
        return {
          label: 'Hoje',
          bgClass: 'bg-yellow-100 dark:bg-yellow-500/10',
          textClass: 'text-yellow-700 dark:text-yellow-400',
          borderClass: 'border-yellow-200 dark:border-yellow-500/20',
          dotClass: 'bg-yellow-500',
        }
      case 'agendado':
        return {
          label: 'Agendado',
          bgClass: 'bg-slate-100 dark:bg-slate-700/50',
          textClass: 'text-slate-600 dark:text-slate-300',
          borderClass: 'border-slate-200 dark:border-slate-600/50',
          dotClass: 'bg-slate-400',
        }
      case 'concluido':
        return {
          label: 'Concluído',
          bgClass: 'bg-emerald-100 dark:bg-emerald-500/10',
          textClass: 'text-emerald-700 dark:text-emerald-400',
          borderClass: 'border-emerald-200 dark:border-emerald-500/20',
          dotClass: 'bg-emerald-500',
        }
      default:
        return {
          label: status,
          bgClass: 'bg-slate-100 dark:bg-slate-700/50',
          textClass: 'text-slate-600 dark:text-slate-300',
          borderClass: 'border-slate-200 dark:border-slate-600/50',
          dotClass: 'bg-slate-400',
        }
    }
  }

  const getActionButton = (status: string) => {
    if (status === 'atrasado' || status === 'hoje') {
      return (
        <button className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-[#111418] transition-all">
          Revisar
        </button>
      )
    } else if (status === 'concluido') {
      return (
        <button className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none transition-all">
          Reiniciar
        </button>
      )
    } else {
      return (
        <button className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none transition-all">
          Detalhes
        </button>
      )
    }
  }

  const getProgressBarColor = (status: string) => {
    return status === 'concluido' ? 'bg-emerald-500' : 'bg-primary'
  }

  const getProximaRevisaoColor = (status: string) => {
    if (status === 'atrasado') {
      return 'text-red-600 dark:text-red-400 font-medium'
    }
    return 'text-slate-600 dark:text-slate-300'
  }

  return (
    <div className="min-h-screen">
      <Header title="Minhas Revisões" />

      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Minhas Revisões
            </h1>
            <p className="text-slate-500 dark:text-[#9dabb9] text-base font-normal leading-normal">
              Gerencie seus ciclos de estudo e mantenha o foco no progresso.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#2a3441] rounded-full px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">12 dias seguidos</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#2a3441] shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                Pendentes Hoje
              </p>
              <span className="material-symbols-outlined text-yellow-500 bg-yellow-500/10 p-1 rounded-md">
                warning
              </span>
            </div>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">12</p>
              <p className="text-emerald-500 text-sm font-medium mb-1 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-0.5">trending_up</span> +2%
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#2a3441] shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                Para Amanhã
              </p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-md">
                calendar_today
              </span>
            </div>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">5</p>
              <p className="text-slate-400 text-sm font-medium mb-1">Normal</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#2a3441] shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
                Taxa de Acerto
              </p>
              <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-1 rounded-md">
                check_circle
              </span>
            </div>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">85%</p>
              <p className="text-emerald-500 text-sm font-medium mb-1 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-0.5">trending_up</span> +5%
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center justify-center gap-x-2 rounded-lg bg-slate-200 dark:bg-[#283039] px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
              <span className="text-slate-700 dark:text-white text-sm font-medium">Por Matéria</span>
              <span className="material-symbols-outlined text-[20px] text-slate-700 dark:text-white">
                expand_more
              </span>
            </button>
            <button className="flex items-center justify-center gap-x-2 rounded-lg bg-primary text-white px-4 py-2 hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20">
              <span className="text-sm font-medium">Urgência</span>
              <span className="material-symbols-outlined text-[20px]">sort</span>
            </button>
            <button className="flex items-center justify-center gap-x-2 rounded-lg bg-slate-200 dark:bg-[#283039] px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
              <span className="text-slate-700 dark:text-white text-sm font-medium">Dificuldade</span>
              <span className="material-symbols-outlined text-[20px] text-slate-700 dark:text-white">
                expand_more
              </span>
            </button>
          </div>
          <div className="relative w-full md:w-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            </span>
            <input
              className="bg-white dark:bg-[#192633] border border-slate-200 dark:border-[#2a3441] text-slate-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 placeholder-slate-400"
              placeholder="Buscar tópico..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Revisions Table */}
        <div className="@container w-full">
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-[#2a3441] bg-white dark:bg-[#192633] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#1c2127] border-b border-slate-200 dark:border-[#2a3441]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Matéria / Tópico
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-48">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      Próxima Revisão
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      Ciclo
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-40 text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#2a3441]">
                  {revisoesExemplo.map((revisao) => {
                    const statusConfig = getStatusConfig(revisao.status)
                    return (
                      <tr
                        key={revisao.id}
                        className="group hover:bg-slate-50 dark:hover:bg-[#1c2127]/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {revisao.topico}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {revisao.materia}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full ${statusConfig.bgClass} px-2.5 py-1 text-xs font-medium ${statusConfig.textClass} border ${statusConfig.borderClass}`}
                          >
                            <span className={`size-1.5 rounded-full ${statusConfig.dotClass}`}></span>{' '}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className={`text-sm ${getProximaRevisaoColor(revisao.status)}`}>
                            {revisao.proximaRevisao}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full ${getProgressBarColor(revisao.status)} rounded-full`}
                                style={{ width: `${revisao.cicloProgresso}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {revisao.cicloProgresso}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">{getActionButton(revisao.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-[#2a3441] px-4 py-3 bg-white dark:bg-[#192633] sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-400">
                    Mostrando <span className="font-medium">1</span> até{' '}
                    <span className="font-medium">5</span> de <span className="font-medium">20</span>{' '}
                    resultados
                  </p>
                </div>
                <div>
                  <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <a
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
                      href="#"
                    >
                      <span className="sr-only">Anterior</span>
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </a>
                    <a
                      aria-current="page"
                      className="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      href="#"
                    >
                      1
                    </a>
                    <a
                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
                      href="#"
                    >
                      2
                    </a>
                    <a
                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
                      href="#"
                    >
                      3
                    </a>
                    <a
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0"
                      href="#"
                    >
                      <span className="sr-only">Próximo</span>
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-600">
            © 2024 StudyMaster. Focado no seu sucesso.
          </p>
        </div>
      </div>
    </div>
  )
}
