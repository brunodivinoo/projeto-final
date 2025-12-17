'use client'

import { useState } from 'react'

export default function SocialPage() {
  const [postText, setPostText] = useState('')
  const [search, setSearch] = useState('')
  const [hours] = useState(1)
  const [minutes] = useState(25)
  const [seconds] = useState(0)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const posts = [
    {
      id: 1,
      author: 'Sarah Jenkins',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmvKw8utZraa5avmei48WtC5gSqIxW7F66QEix6P98SHakBXCtKx-kDqPJf2--NkXj74DIey0Ld5BLXazGq96klgnY1vhTvbD-CEWUr32PYmqFJm_cKZQ-aoYPNDgvp7pSMYQt0RefBStWpSBGO7EqaDHkFwFjIDsvxMmEZJXbNRLX91bnRSme08yflpUZIkzb62VhPdRNwyW6mx_aEio6WmP94URiyyDjD5cXMipJCFm2uMDrCJmvdvcguH6iS_uPU2YYHWSd-Ro',
      time: '2 horas atrás',
      category: 'Biologia 101',
      content: 'Just finished a massive study session for the upcoming anatomy exam! Managed to focus for 2.5 hours straight. The flashcards really helped. 🧠💪',
      session: { hours: 2, minutes: 30 },
      likes: 24,
      comments: 8,
      hasLiked: false
    },
    {
      id: 2,
      author: 'Grupo de Física',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-73SfW9EMEJEiq2ffwWgCKjhBz9x_JHKxY-E4xHg75jqFiskghYTUb1pY0Td8gsS-pZmUZXyLN42624HpS9gkbxXX98yuxk30SaVzV4efDzsWf7ujzTgW0kRqgs_dF2PPi6cAPqsZYrPBoqEWaJATQ6MtudE_p2UVlFzSrV9IloAlb0XRDmPqxQbTPQT2LYXQyqxhllmPZHQD3V3XUwhim2Cqjs8po5fjKFb83kPcQKTsHzt86nrhDmkf-rOL1RNkyAu-tKFNKU8',
      time: '5 min atrás',
      postedBy: 'Mike Chen',
      content: 'Does anyone have good notes on Quantum Mechanics from yesterday\'s lecture? I missed the last 15 minutes.',
      likes: 2,
      comments: 0,
      hasLiked: false
    },
    {
      id: 3,
      author: 'Emily Rossi',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBM26zsPR_uOUBBFaIdeOwfCMk4BsoXdRBa-Y2sFSM5iSFID_arljoxMyrml2xgqixRw6mh4vog4-lPCAShZW5j9bb9wd4p6yg8hCZa7aVMKWJncOvLcsLh0qObgnxcuRGuoTfyA2R-RzntP9GURijGXrfFQfkDX160uokOFuu91y6_uzbs8_9seUn-cMMVnaRr7YC2bheZALWuPqb6Cyzo-YVKxKQCm81KNlU7BchkjXZLnp2bsdn_zzLUCiSGtlR349cms9BeF8',
      time: '45 min atrás',
      category: 'Biblioteca',
      content: 'Finally organized my desk setup! Ready for finals week. 📚✨',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCK64jOu2bKDbP0OAkHcujQQm8Q4qlXqX2dbp4hV7YXRDJY4JZdj0_-7838QxMiut5Rfw-AdvjImJU-26RGDVQ8Ncenql4n-Y_Z4U6uxdtvmGKys8Ron7ynzl02OKvnzMStpnQZsJ2z7kQixGzMOtUutevSVnrrT-hzDEUHM8gZWf072_agPBB3O_VLyUawIL-o0bSbqMo0-LTpFKXhsKy7Jp40xfgkwmNeL2d8Dr3dsk69K9ow5FwMUT9s0UAkETz5CM8im0VQnqw',
      likes: 156,
      comments: 12,
      hasLiked: true
    }
  ]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const upcomingSessions = [
    { month: 'OUT', day: 24, title: 'Revisão de Cálculo', time: '14:00', type: 'Grupo', active: true },
    { month: 'OUT', day: 25, title: 'Projeto de História', time: '10:00', type: 'Individual', active: false }
  ]

  const friends = [
    {
      name: 'Alex M.',
      status: 'Estudando',
      online: 'green',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaDOpy7Sj4hEmq3x-N_fXg7KDaAgeTCsBmB_KVvjM7IdbtCGFtfsfw2I7_JGr9kvJFecrHEBeZg7rcG8h5zxnzSPRVUdjSje61edQ93g-snkz3fK8t9bHWdr_nNzqQypSo6czKFodUkulHPOSdlQVrRsgwX3UEoGb2S7bT8PmTTXLRSt7juPf4_EKjS44gPoWH6ggXpFwUkiFZcaUwujJvVutPKV0tFKeFvEggmE0MVoAVaesjRQf8H1hGQ37SLPsny_UklP2CPQ0'
    },
    {
      name: 'Jessica T.',
      status: 'Offline',
      online: 'gray',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArR6V4pXiJzgTMJi86-5Ig6zOv2MOeZLEX0x6Ipx4hPdGq2qImkX5pSgOoXf6joIcwmxaQoGG4q8VXgLxMy28wdM6ZLqPeZ3rm_eknbrq5fnm1ZhVvV4b146KmfN8fFuP3yvIpc4c9Vy-P_z6ucOloEoveW1g22u39-ySH4m6AjH8QjPhG8QHPRZUEF0Vgu7U1vvbie-8lrN9UXNdkDoFndEKc782ift7ZU4YkbuINI22pExiHopjX2wMtoWCL7Z8xQzYzXk9ENK0'
    },
    {
      name: 'David K.',
      status: 'Ausente',
      online: 'yellow',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcuC524H9B55DkgcjNpwHl4eym3dEk7o75Sf9Y-7sZtG4j4ZwLjNkNhWGBGKDR1laH-yHAZk-4H_iv0swz9-ZG6skTgXQk5nT-CzStzP-XClZNZie48e3RPTypx4O1RFlyu7nU-d74wXlNrSEj0BmCSIU0BseCkbXOGyw8dxkNXVrcL63PcXEYLYMSA0Jr4Ni5LXIXWICziCsmDQaKDFPMppx3pxwSmmQ2DScUB47A6oi2ckGaNWy-Pfbt1Ar3k3zcw8Cj5r6pqRk'
    }
  ]

  const groups = [
    { name: 'Ciência da Computação 101', members: 124, posts: 5, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', abbr: 'CC' },
    { name: 'Literatura Inglesa', members: 42, posts: 0, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', abbr: 'LI' }
  ]

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#111418] dark:text-white overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] dark:border-[#283039] bg-white dark:bg-[#111418] px-4 md:px-10 py-3">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 text-[#111418] dark:text-white cursor-pointer">
            <div className="size-8 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] hidden md:block">StudySocial</h2>
          </div>
          <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-[#9dabb9] flex border-none bg-[#f0f2f4] dark:bg-[#283039] items-center justify-center pl-4 rounded-l-lg border-r-0">
                <span className="material-symbols-outlined text-[24px]">search</span>
              </div>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-0 border-none bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white placeholder:text-[#9dabb9] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                placeholder="Pesquisar amigos, grupos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
        </div>
        <div className="flex flex-1 justify-end gap-4 md:gap-8">
          <div className="flex gap-2">
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white hover:bg-[#e0e2e4] dark:hover:bg-[#3b4754] transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white hover:bg-[#e0e2e4] dark:hover:bg-[#3b4754] transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20 cursor-pointer"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBiaumMkhPpa3ZWgewVm4N7ajV_Y54CuyhaUWgbrtNNxwScqamk7t7tnj_xVtBxxknL92hfLM8M9SfjDKj6mvNfeZcxfEKDzM63JcbMqmhP7DDIY-2C9_e3A3z9ZtFw-qgTWaHvGvKOfZ27gXy3zCa1iExkk4QVZhFl-BcXJMqgpEnRz5kvUe9w-6XrGs18jkNgDPFmYexdH0_cjDDQ4uomLfNP10jHdGhhIUmxr1dw4xV72mYzWfN6iuUbKKsmcXscGPVPixzI9S0")' }}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 justify-center py-5 px-4 md:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row max-w-[1280px] w-full gap-6">
          {/* Left Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
            {/* Navigation */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039]">
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">person</span>
                <p className="text-sm font-medium leading-normal">Perfil do Usuário</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary dark:bg-[#283039] dark:text-white hover:bg-primary/20 transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px] fill-1">groups</span>
                <p className="text-sm font-medium leading-normal">Social</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">home</span>
                <p className="text-sm font-medium leading-normal">Página Inicial</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">quiz</span>
                <p className="text-sm font-medium leading-normal">Questões</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">assignment</span>
                <p className="text-sm font-medium leading-normal">Simulados</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">style</span>
                <p className="text-sm font-medium leading-normal">Flashcards</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">donut_large</span>
                <p className="text-sm font-medium leading-normal">Ciclos de Estudo</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">history_edu</span>
                <p className="text-sm font-medium leading-normal">Revisões</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                <p className="text-sm font-medium leading-normal">Planos de Estudo</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#637588] dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors" href="#">
                <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                <p className="text-sm font-medium leading-normal">Central IA</p>
              </a>
            </div>

            {/* Focus Timer */}
            <div className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#111418] dark:text-white">Cronômetro de Foco</h3>
                <span className="material-symbols-outlined text-primary cursor-pointer">more_horiz</span>
              </div>
              <div className="flex gap-2 mb-4 justify-between">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex h-12 w-full items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white text-lg font-bold">
                    {String(hours).padStart(2, '0')}
                  </div>
                  <span className="text-xs text-text-secondary">Hr</span>
                </div>
                <div className="text-xl font-bold self-center -mt-5 text-[#111418] dark:text-white">:</div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex h-12 w-full items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white text-lg font-bold">
                    {String(minutes).padStart(2, '0')}
                  </div>
                  <span className="text-xs text-text-secondary">Min</span>
                </div>
                <div className="text-xl font-bold self-center -mt-5 text-[#111418] dark:text-white">:</div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="flex h-12 w-full items-center justify-center rounded-lg bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white text-lg font-bold">
                    {String(seconds).padStart(2, '0')}
                  </div>
                  <span className="text-xs text-text-secondary">Seg</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <button className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20">
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
                <button className="size-10 rounded-full bg-[#f0f2f4] dark:bg-[#283039] text-[#111418] dark:text-white flex items-center justify-center hover:opacity-80">
                  <span className="material-symbols-outlined">stop</span>
                </button>
              </div>
              <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors">
                Postar Resultado
              </button>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="flex flex-col flex-1 min-w-0 gap-6">
            {/* Post Creation */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm overflow-hidden">
              <div className="flex items-start p-4 gap-3">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAgyAhon_P0p5iTCvNy32cZrAsW2gnQYHlzCPolhFTKtD5fjmyGcE05gmB27zWZLNAa6FI27MG0h_4eIiyNDvwWUSV8q5Q5d_WPNxt_lxEbQgLgL87wDDgnNYAuB2plXIXfcgSxioRN-s-uyIhMsCeWeVn3_gICq5tRiZFNzqOMrVAPDXAlfzvDtnQHCG2mz0qZsBir3MwzC9fJf93ZH2oxF-Lg3T8aHfry-Xn4aeTlGuNynl-l-lx9EZM-CREIw_6QSaiIE43sbfY")' }}
                />
                <div className="flex-1">
                  <textarea
                    className="w-full bg-transparent border-none text-[#111418] dark:text-white placeholder:text-[#9dabb9] focus:ring-0 resize-none h-20 text-base"
                    placeholder="Compartilhe seu progresso de estudos ou faça uma pergunta..."
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-[#f9fafb] dark:bg-[#1c2127] border-t border-[#e5e7eb] dark:border-[#283039]">
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

            {/* Post 1 - Sarah Jenkins */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmvKw8utZraa5avmei48WtC5gSqIxW7F66QEix6P98SHakBXCtKx-kDqPJf2--NkXj74DIey0Ld5BLXazGq96klgnY1vhTvbD-CEWUr32PYmqFJm_cKZQ-aoYPNDgvp7pSMYQt0RefBStWpSBGO7EqaDHkFwFjIDsvxMmEZJXbNRLX91bnRSme08yflpUZIkzb62VhPdRNwyW6mx_aEio6WmP94URiyyDjD5cXMipJCFm2uMDrCJmvdvcguH6iS_uPU2YYHWSd-Ro")' }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#111418] dark:text-white">Sarah Jenkins</h4>
                      <p className="text-xs text-text-secondary">2 horas atrás • Biologia 101</p>
                    </div>
                  </div>
                  <button className="text-text-secondary hover:text-[#111418] dark:hover:text-white">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                <p className="text-[#111418] dark:text-white text-sm mb-4 leading-relaxed">
                  Just finished a massive study session for the upcoming anatomy exam! Managed to focus for 2.5 hours straight. The flashcards really helped. 🧠💪
                </p>
                <div className="flex items-center gap-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                  <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">timer</span>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Sessão Completa</p>
                    <p className="text-lg font-bold text-[#111418] dark:text-white">02 h 30 min</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-2 border-t border-[#e5e7eb] dark:border-[#283039]">
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                    <span className="text-sm">24</span>
                  </button>
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="text-sm">8</span>
                  </button>
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors ml-auto">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Post 2 - Grupo de Física */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB-73SfW9EMEJEiq2ffwWgCKjhBz9x_JHKxY-E4xHg75jqFiskghYTUb1pY0Td8gsS-pZmUZXyLN42624HpS9gkbxXX98yuxk30SaVzV4efDzsWf7ujzTgW0kRqgs_dF2PPi6cAPqsZYrPBoqEWaJATQ6MtudE_p2UVlFzSrV9IloAlb0XRDmPqxQbTPQT2LYXQyqxhllmPZHQD3V3XUwhim2Cqjs8po5fjKFb83kPcQKTsHzt86nrhDmkf-rOL1RNkyAu-tKFNKU8")' }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#111418] dark:text-white">Grupo de Física</h4>
                      <p className="text-xs text-text-secondary">Postado por Mike Chen • 5 min atrás</p>
                    </div>
                  </div>
                  <button className="text-text-secondary hover:text-[#111418] dark:hover:text-white">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                <p className="text-[#111418] dark:text-white text-sm mb-3 leading-relaxed">
                  Does anyone have good notes on Quantum Mechanics from yesterday&apos;s lecture? I missed the last 15 minutes.
                </p>
                <div className="flex items-center gap-6 pt-2 border-t border-[#e5e7eb] dark:border-[#283039]">
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                    <span className="text-sm">2</span>
                  </button>
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="text-sm">Responder</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Post 3 - Emily Rossi */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDBM26zsPR_uOUBBFaIdeOwfCMk4BsoXdRBa-Y2sFSM5iSFID_arljoxMyrml2xgqixRw6mh4vog4-lPCAShZW5j9bb9wd4p6yg8hCZa7aVMKWJncOvLcsLh0qObgnxcuRGuoTfyA2R-RzntP9GURijGXrfFQfkDX160uokOFuu91y6_uzbs8_9seUn-cMMVnaRr7YC2bheZALWuPqb6Cyzo-YVKxKQCm81KNlU7BchkjXZLnp2bsdn_zzLUCiSGtlR349cms9BeF8")' }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#111418] dark:text-white">Emily Rossi</h4>
                      <p className="text-xs text-text-secondary">45 min atrás • Biblioteca</p>
                    </div>
                  </div>
                </div>
                <p className="text-[#111418] dark:text-white text-sm mb-4 leading-relaxed">
                  Finally organized my desk setup! Ready for finals week. 📚✨
                </p>
                <div
                  className="w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 bg-cover bg-center"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCK64jOu2bKDbP0OAkHcujQQm8Q4qlXqX2dbp4hV7YXRDJY4JZdj0_-7838QxMiut5Rfw-AdvjImJU-26RGDVQ8Ncenql4n-Y_Z4U6uxdtvmGKys8Ron7ynzl02OKvnzMStpnQZsJ2z7kQixGzMOtUutevSVnrrT-hzDEUHM8gZWf072_agPBB3O_VLyUawIL-o0bSbqMo0-LTpFKXhsKy7Jp40xfgkwmNeL2d8Dr3dsk69K9ow5FwMUT9s0UAkETz5CM8im0VQnqw")' }}
                />
                <div className="flex items-center gap-6 pt-2 border-t border-[#e5e7eb] dark:border-[#283039]">
                  <button className="flex items-center gap-2 text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px] fill-1">thumb_up</span>
                    <span className="text-sm">156</span>
                  </button>
                  <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="text-sm">12</span>
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="flex flex-col w-full lg:w-80 shrink-0 gap-6">
            {/* Upcoming Sessions */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="p-4 border-b border-[#e5e7eb] dark:border-[#283039] flex justify-between items-center">
                <h3 className="text-base font-bold text-[#111418] dark:text-white">Próximas Sessões</h3>
                <a className="text-xs font-bold text-primary hover:underline" href="#">Ver Tudo</a>
              </div>
              <div className="flex flex-col p-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-xs font-bold">OUT</span>
                    <span className="text-lg font-bold leading-none">24</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111418] dark:text-white">Revisão de Cálculo</p>
                    <p className="text-xs text-text-secondary">14:00 - Grupo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#f0f2f4] dark:bg-[#283039] text-text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-xs font-bold">OUT</span>
                    <span className="text-lg font-bold leading-none">25</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111418] dark:text-white">Projeto de História</p>
                    <p className="text-xs text-text-secondary">10:00 - Individual</p>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button className="w-full h-8 rounded-lg border border-dashed border-[#9dabb9] text-text-secondary text-xs font-medium hover:border-primary hover:text-primary transition-colors">
                  + Agendar Sessão
                </button>
              </div>
            </div>

            {/* Friends */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="p-4 border-b border-[#e5e7eb] dark:border-[#283039] flex justify-between items-center">
                <h3 className="text-base font-bold text-[#111418] dark:text-white">Amigos</h3>
                <div className="flex gap-2">
                  <button className="text-text-secondary hover:text-primary" title="Adicionar Amigo">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col p-2">
                {friends.map((friend, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-[#283039] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9"
                          style={{ backgroundImage: `url("${friend.avatar}")` }}
                        />
                        <div className={`absolute bottom-0 right-0 size-2.5 ${
                          friend.online === 'green' ? 'bg-green-500' :
                          friend.online === 'yellow' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        } border-2 border-white dark:border-[#111418] rounded-full`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111418] dark:text-white">{friend.name}</p>
                        <p className={`text-[10px] font-medium ${
                          friend.online === 'green' ? 'text-green-500' :
                          friend.online === 'yellow' ? 'text-yellow-500' :
                          'text-text-secondary'
                        }`}>
                          {friend.status}
                        </p>
                      </div>
                    </div>
                    <button className="text-text-secondary hover:text-red-500">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Groups */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#111418] border border-[#e5e7eb] dark:border-[#283039] shadow-sm">
              <div className="p-4 border-b border-[#e5e7eb] dark:border-[#283039] flex justify-between items-center">
                <h3 className="text-base font-bold text-[#111418] dark:text-white">Seus Grupos</h3>
                <a className="text-xs font-bold text-primary hover:underline" href="#">Criar</a>
              </div>
              <div className="flex flex-col p-2 gap-2">
                {groups.map((group, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-[#f0f2f4] dark:bg-[#283039] cursor-pointer border border-transparent hover:border-primary/30 transition-all">
                    <div className={`flex items-center justify-center size-8 rounded ${group.color} font-bold text-xs`}>
                      {group.abbr}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111418] dark:text-white">{group.name}</p>
                      <p className="text-[10px] text-text-secondary">
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
    </div>
  )
}
