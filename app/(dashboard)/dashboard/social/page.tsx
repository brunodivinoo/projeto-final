'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'

export default function SocialPage() {
  const [postText, setPostText] = useState('')
  const [hours] = useState(1)
  const [minutes] = useState(25)
  const [seconds] = useState(0)

  const friends = [
    { name: 'Alex M.', status: 'Estudando', online: 'green', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaDOpy7Sj4hEmq3x-N_fXg7KDaAgeTCsBmB_KVvjM7IdbtCGFtfsfw2I7_JGr9kvJFecrHEBeZg7rcG8h5zxnzSPRVUdjSje61edQ93g-snkz3fK8t9bHWdr_nNzqQypSo6czKFodUkulHPOSdlQVrRsgwX3UEoGb2S7bT8PmTTXLRSt7juPf4_EKjS44gPoWH6ggXpFwUkiFZcaUwujJvVutPKV0tFKeFvEggmE0MVoAVaesjRQf8H1hGQ37SLPsny_UklP2CPQ0' },
    { name: 'Jessica T.', status: 'Offline', online: 'gray', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArR6V4pXiJzgTMJi86-5Ig6zOv2MOeZLEX0x6Ipx4hPdGq2qImkX5pSgOoXf6joIcwmxaQoGG4q8VXgLxMy28wdM6ZLqPeZ3rm_eknbrq5fnm1ZhVvV4b146KmfN8fFuP3yvIpc4c9Vy-P_z6ucOloEoveW1g22u39-ySH4m6AjH8QjPhG8QHPRZUEF0Vgu7U1vvbie-8lrN9UXNdkDoFndEKc782ift7ZU4YkbuINI22pExiHopjX2wMtoWCL7Z8xQzYzXk9ENK0' },
    { name: 'David K.', status: 'Ausente', online: 'yellow', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcuC524H9B55DkgcjNpwHl4eym3dEk7o75Sf9Y-7sZtG4j4ZwLjNkNhWGBGKDR1laH-yHAZk-4H_iv0swz9-ZG6skTgXQk5nT-CzStzP-XClZNZie48e3RPTypx4O1RFlyu7nU-d74wXlNrSEj0BmCSIU0BseCkbXOGyw8dxkNXVrcL63PcXEYLYMSA0Jr4Ni5LXIXWICziCsmDQaKDFPMppx3pxwSmmQ2DScUB47A6oi2ckGaNWy-Pfbt1Ar3k3zcw8Cj5r6pqRk' }
  ]

  const groups = [
    { name: 'Ciência da Computação 101', members: 124, posts: 5, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', abbr: 'CC' },
    { name: 'Literatura Inglesa', members: 42, posts: 0, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', abbr: 'LI' }
  ]

  return (
    <div className="min-h-screen">
      <Header title="StudySocial" />

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Main Feed */}
        <main className="flex flex-col flex-1 min-w-0 gap-6">
          {/* Post Creation */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] shadow-sm overflow-hidden">
            <div className="flex items-start p-4 gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 resize-none h-20 text-base"
                  placeholder="Compartilhe seu progresso de estudos ou faça uma pergunta..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#1c2127] border-t border-slate-200 dark:border-[#283039]">
              <div className="flex gap-4 text-primary">
                <button className="flex items-center gap-2 hover:bg-primary/10 px-2 py-1 rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">image</span>
                  <span className="text-sm font-medium hidden sm:block">Foto</span>
                </button>
                <button className="flex items-center gap-2 hover:bg-primary/10 px-2 py-1 rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">poll</span>
                  <span className="text-sm font-medium hidden sm:block">Enquete</span>
                </button>
              </div>
              <button className="cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-6 bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors">
                Postar
              </button>
            </div>
          </div>

          {/* Post 1 */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sarah Jenkins</h4>
                    <p className="text-xs text-slate-500">2 horas atrás • Biologia 101</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
              <p className="text-slate-900 dark:text-white text-sm mb-4 leading-relaxed">
                Acabei de finalizar uma sessão intensa de estudos para a prova de anatomia! Consegui focar por 2.5 horas seguidas. Os flashcards ajudaram muito. 🧠💪
              </p>
              <div className="flex items-center gap-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sessão Completa</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">02 h 30 min</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2 border-t border-slate-200 dark:border-[#283039]">
                <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                  <span className="text-sm">24</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                  <span className="text-sm">8</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors ml-auto">
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Post 2 */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">GF</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Grupo de Física</h4>
                    <p className="text-xs text-slate-500">Postado por Mike Chen • 5 min atrás</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-900 dark:text-white text-sm mb-3 leading-relaxed">
                Alguém tem boas anotações sobre Mecânica Quântica da aula de ontem? Perdi os últimos 15 minutos.
              </p>
              <div className="flex items-center gap-6 pt-2 border-t border-slate-200 dark:border-[#283039]">
                <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                  <span className="text-sm">2</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                  <span className="text-sm">Responder</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="flex flex-col w-full lg:w-80 shrink-0 gap-6">
          {/* Focus Timer */}
          <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cronômetro de Foco</h3>
              <span className="material-symbols-outlined text-primary cursor-pointer">more_horiz</span>
            </div>
            <div className="flex gap-2 mb-4 justify-between">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-[#283039] text-slate-900 dark:text-white text-lg font-bold">
                  {String(hours).padStart(2, '0')}
                </div>
                <span className="text-xs text-slate-500">Hr</span>
              </div>
              <div className="text-xl font-bold self-center -mt-5 text-slate-900 dark:text-white">:</div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-[#283039] text-slate-900 dark:text-white text-lg font-bold">
                  {String(minutes).padStart(2, '0')}
                </div>
                <span className="text-xs text-slate-500">Min</span>
              </div>
              <div className="text-xl font-bold self-center -mt-5 text-slate-900 dark:text-white">:</div>
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-[#283039] text-slate-900 dark:text-white text-lg font-bold">
                  {String(seconds).padStart(2, '0')}
                </div>
                <span className="text-xs text-slate-500">Seg</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20">
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#283039] text-slate-900 dark:text-white flex items-center justify-center hover:opacity-80">
                <span className="material-symbols-outlined">stop</span>
              </button>
            </div>
            <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors">
              Postar Resultado
            </button>
          </div>

          {/* Friends */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-[#283039] flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Amigos</h3>
              <button className="text-slate-500 hover:text-primary" title="Adicionar Amigo">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </button>
            </div>
            <div className="flex flex-col p-2">
              {friends.map((friend, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#283039] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-9 h-9"
                        style={{ backgroundImage: `url("${friend.avatar}")` }}
                      />
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${
                        friend.online === 'green' ? 'bg-green-500' :
                        friend.online === 'yellow' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      } border-2 border-white dark:border-[#111418] rounded-full`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{friend.name}</p>
                      <p className={`text-[10px] font-medium ${
                        friend.online === 'green' ? 'text-green-500' :
                        friend.online === 'yellow' ? 'text-yellow-500' :
                        'text-slate-500'
                      }`}>
                        {friend.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groups */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-[#283039] flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Seus Grupos</h3>
              <a className="text-xs font-bold text-primary hover:underline" href="#">Criar</a>
            </div>
            <div className="flex flex-col p-2 gap-2">
              {groups.map((group, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-[#283039] cursor-pointer border border-transparent hover:border-primary/30 transition-all">
                  <div className={`flex items-center justify-center w-8 h-8 rounded ${group.color} font-bold text-xs`}>
                    {group.abbr}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{group.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {group.members} membros{group.posts > 0 ? ` • ${group.posts} novos posts` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
