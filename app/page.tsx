import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-slate-200 bg-white/90 backdrop-blur-md px-4 md:px-10 py-3">
        <div className="flex items-center gap-4 text-slate-900">
          <div className="size-8 text-primary">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
              <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em]">Estuda</h2>
        </div>
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-9">
            <a className="text-slate-900 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#recursos">Recursos</a>
            <a className="text-slate-900 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#planos">Planos</a>
            <a className="text-slate-900 text-sm font-medium leading-normal hover:text-primary transition-colors" href="#contato">Contato</a>
          </div>
          <div className="flex gap-2">
            <Link href="/medicina" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-colors text-sm font-bold leading-normal tracking-[0.015em] shadow-md">
              <span className="truncate">Medicina</span>
            </Link>
            <Link href="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Login</span>
            </Link>
            <Link href="/cadastro" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white hover:bg-blue-600 transition-colors text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Cadastro</span>
            </Link>
          </div>
        </div>
        <div className="flex md:hidden">
          <button className="text-slate-900 p-2">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="w-full bg-white flex justify-center py-5">
          <div className="flex flex-col max-w-[1280px] flex-1 px-5 md:px-10 lg:px-40">
            <div className="flex flex-col-reverse gap-6 py-10 lg:flex-row lg:items-center">
              {/* Left Content */}
              <div className="flex flex-col gap-6 min-w-0 lg:min-w-[400px] lg:gap-8 flex-1">
                <div className="flex flex-col gap-4 text-left">
                  <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl lg:text-6xl">
                    Gerencie seus estudos.<br/>Conecte-se com o futuro.
                  </h1>
                  <h2 className="text-slate-500 text-base font-normal leading-relaxed md:text-lg max-w-[600px]">
                    A plataforma completa para organizar suas matérias, acompanhar seu progresso e interagir com outros estudantes em tempo real.
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/cadastro" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                    <span className="truncate">Começar Agora</span>
                  </Link>
                  <a href="#recursos" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-slate-100 text-slate-900 text-base font-bold leading-normal tracking-[0.015em] hover:bg-slate-200 transition-colors">
                    <span className="truncate">Saiba Mais</span>
                  </a>
                </div>
              </div>
              {/* Right Image */}
              <div className="w-full flex-1">
                <div className="w-full bg-center bg-no-repeat aspect-square md:aspect-video bg-cover rounded-2xl shadow-2xl" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAPn1pXvfYIywmPuhF-MCUCyoN1JXOTqvcEt2O5H-2oSxp5zH47UTGEFOqjZ7s5nw9H6bKz2xxFl60Xacmrf1BFnHz8ZA5iIaaV46qMvXJYAdJSWBl69rHlyTl-CwA5gyNPzphcvH7FbcGzwI8KL_ImhxOf_dUl3zb1Fa7z1yGqI0I8DxsL_Sny1KQo9_BQ47AFt2Qn1wkPp2vyDGD3P3V46fAWkF9zrPLmPxsNKHJj57zgbEDBJBcdeci_fMBlhTXhGP4ZxYVXVXw")'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full flex justify-center py-20 bg-background-light" id="recursos">
          <div className="flex flex-col max-w-[960px] flex-1 px-5 md:px-10">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-4 text-center items-center">
                <h2 className="text-slate-900 text-[32px] font-bold leading-tight md:text-4xl max-w-[720px]">
                  Tudo que você precisa para passar de ano
                </h2>
                <p className="text-slate-500 text-lg font-normal leading-normal max-w-[720px]">
                  Ferramentas poderosas para manter o foco e a motivação durante sua jornada acadêmica.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-primary w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 text-lg font-bold leading-tight">Planejador Inteligente</h3>
                    <p className="text-slate-500 text-sm font-normal leading-relaxed">
                      Crie cronogramas automáticos baseados nas suas datas de prova e trabalhos importantes.
                    </p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-primary w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-[28px]">groups</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 text-lg font-bold leading-tight">Grupos de Estudo</h3>
                    <p className="text-slate-500 text-sm font-normal leading-relaxed">
                      Encontre parceiros de estudo, compartilhe resumos e tire dúvidas em tempo real.
                    </p>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="flex flex-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-primary w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-[28px]">emoji_events</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 text-lg font-bold leading-tight">Gamificação</h3>
                    <p className="text-slate-500 text-sm font-normal leading-relaxed">
                      Ganhe recompensas, badges e suba no ranking por manter sua rotina de estudos em dia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="w-full flex justify-center py-20 bg-white" id="planos">
          <div className="flex flex-col max-w-[1080px] flex-1 px-5 md:px-10">
            <div className="text-center mb-12">
              <h2 className="text-slate-900 text-3xl font-bold mb-4">Escolha o plano ideal</h2>
              <p className="text-slate-500 text-lg">Comece de graça e evolua conforme seus estudos avançam.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-8 hover:border-primary/50 transition-colors">
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 text-lg font-bold leading-tight">Free</h3>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-4xl font-black leading-tight tracking-[-0.033em]">R$0</span>
                    <span className="text-base font-bold leading-tight text-slate-500">/mês</span>
                  </div>
                  <p className="text-slate-500 text-sm">Para quem está começando.</p>
                </div>
                <Link href="/cadastro" className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Criar Conta Grátis</span>
                </Link>
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    5 questões IA por dia
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    50 questões por dia
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    3 resumos por mês
                  </div>
                </div>
              </div>
              {/* Estuda PRO Plan (Highlighted) */}
              <div className="flex flex-col gap-6 rounded-xl border-2 border-primary bg-white p-8 relative shadow-xl transform md:-translate-y-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Popular</div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 text-lg font-bold leading-tight">Estuda PRO</h3>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-4xl font-black leading-tight tracking-[-0.033em]">R$29,90</span>
                    <span className="text-base font-bold leading-tight text-slate-500">/mês</span>
                  </div>
                  <p className="text-slate-500 text-sm">Recursos ilimitados para seu sucesso.</p>
                </div>
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white hover:bg-blue-600 transition-colors text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Assinar PRO</span>
                </button>
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    50 questões IA por dia
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    Chat IA ilimitado
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    100 páginas PDF/mês
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    XP 1.5x multiplicador
                  </div>
                </div>
              </div>
              {/* Anual Plan */}
              <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-8 hover:border-primary/50 transition-colors relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Economize 33%</div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 text-lg font-bold leading-tight">Estuda PRO Anual</h3>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-4xl font-black leading-tight tracking-[-0.033em]">R$239,90</span>
                    <span className="text-base font-bold leading-tight text-slate-500">/ano</span>
                  </div>
                  <p className="text-slate-500 text-sm">Melhor custo-benefício.</p>
                </div>
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Assinar Anual</span>
                </button>
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    Tudo do PRO mensal
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    Economia de R$119/ano
                  </div>
                  <div className="text-sm font-normal leading-normal flex gap-3 text-slate-700 items-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">check</span>
                    Suporte prioritário
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="w-full flex justify-center py-20 bg-background-light">
          <div className="flex flex-col max-w-[960px] flex-1 px-5 md:px-10">
            <div className="text-center mb-10">
              <h2 className="text-slate-900 text-3xl font-bold">Quem usa, aprova</h2>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-6 justify-center flex-wrap md:flex-nowrap">
              {/* Testimonial 1 */}
              <div className="flex flex-1 flex-col gap-4 text-center rounded-xl min-w-[250px] max-w-[320px] p-6 bg-white border border-slate-200 shadow-sm">
                <div className="bg-center bg-no-repeat w-20 h-20 bg-cover rounded-full self-center ring-4 ring-primary/20" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCu6iEWImaU-v6ot30R7G6bZj5ZClL_5lV2xk-5yOPB5f7IgOLwjNLPWX9haaDvuDoBi097Mwo1UUVwZpDkARGKZFLuQ7W5YD2TUuo5iCZkUVMhV_EJ9ZI5S4ubq412izB37jatteRgOOw5Mzrx9jMUv7TUCHxUAsNLpXNFXHQbzDbsBAUGKTSAGKFCRx7XfYv7Dq-YMu3w6UJ_WYp7y1ghbI8sxmI0vbbK_O_UnGuSouCg5fvwVOl8bpe-VwnxIxr1Unb4fzyNCDw")'}}></div>
                <div>
                  <p className="text-slate-900 text-lg font-bold leading-normal">Ana Silva</p>
                  <p className="text-primary text-sm font-medium">Medicina - USP</p>
                  <p className="text-slate-500 text-sm font-normal leading-relaxed mt-3">
                    &quot;O Estuda salvou meu semestre! A organização automática é incrível.&quot;
                  </p>
                </div>
              </div>
              {/* Testimonial 2 */}
              <div className="flex flex-1 flex-col gap-4 text-center rounded-xl min-w-[250px] max-w-[320px] p-6 bg-white border border-slate-200 shadow-sm">
                <div className="bg-center bg-no-repeat w-20 h-20 bg-cover rounded-full self-center ring-4 ring-primary/20" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBEXMlDuqY0MWLOpE6lh40g7GTIIOAQgyQ4jJVQ8EVZV1aCUKr9ykIui4SzTSztNKmZLc6sRqKYBmtFucggsqhNF7lpuYmec5xf0vKhsE25qExnCUQwcgcYpajhw95L7st4dufWz3y3_Iz-8Y1gJskstycbUxJCyaAKDs3W48Xib1TPszItP-7x7TiqOz0Oa679tLkVHTUnEr9W9T8IdjB9V_3JKP4pdEpxQy367trQ7y1NDn-dBNm8rvHJhI204oQrWWlbu3nF58o")'}}></div>
                <div>
                  <p className="text-slate-900 text-lg font-bold leading-normal">Carlos Souza</p>
                  <p className="text-primary text-sm font-medium">Direito - PUC</p>
                  <p className="text-slate-500 text-sm font-normal leading-relaxed mt-3">
                    &quot;Amei a função de grupos de estudo. Conheci muita gente focada.&quot;
                  </p>
                </div>
              </div>
              {/* Testimonial 3 */}
              <div className="flex flex-1 flex-col gap-4 text-center rounded-xl min-w-[250px] max-w-[320px] p-6 bg-white border border-slate-200 shadow-sm">
                <div className="bg-center bg-no-repeat w-20 h-20 bg-cover rounded-full self-center ring-4 ring-primary/20" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCO_dj5UFPi596CyFAFLe310eWTwz0SPT7zUD0QcI7nah6U5dQi4ncqWTggi7w_SKp-us-uycxTMdFMt0fT2fyJlQtmonJd-hOrCDR3ZDAhgKRysLsAA-_hmFwL60TijcPAvSlP8vyDhzHj5EqxABcQEHjzx38e-syoOZPJhX_sbBTLD3hwxeRZ8Ul3oNFAhZOPHgcpoVU-XcMdgjv_Bt03iwsEZH-sq8zKcjPChVBFib6dCVnN7Zdh88_iLhVkrzjJd7wkGHUw75c")'}}></div>
                <div>
                  <p className="text-slate-900 text-lg font-bold leading-normal">Beatriz Lima</p>
                  <p className="text-primary text-sm font-medium">Engenharia - Unicamp</p>
                  <p className="text-slate-500 text-sm font-normal leading-relaxed mt-3">
                    &quot;Muito fácil de organizar minhas revisões. As estatísticas ajudam muito.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-slate-200 py-12 px-5 md:px-10" id="contato">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="size-6 text-primary">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                  </svg>
                </div>
                <span className="text-xl font-bold">Estuda</span>
              </div>
              <p className="text-slate-500 text-sm">
                A plataforma nº 1 para estudantes que querem ir além.
              </p>
            </div>
            {/* Links 1 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-slate-900 font-bold">Produto</h4>
              <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#recursos">Recursos</a>
              <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#planos">Preços</a>
              <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Depoimentos</a>
            </div>
            {/* Links 2 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-slate-900 font-bold">Empresa</h4>
              <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Sobre Nós</a>
              <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Carreiras</a>
              <a className="text-slate-500 hover:text-primary transition-colors text-sm" href="#">Contato</a>
            </div>
            {/* Social */}
            <div className="flex flex-col gap-3">
              <h4 className="text-slate-900 font-bold">Redes Sociais</h4>
              <div className="flex gap-4">
                <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined">alternate_email</span>
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
            © 2025 Estuda. Todos os direitos reservados.
          </div>
        </footer>
      </main>
    </div>
  )
}
