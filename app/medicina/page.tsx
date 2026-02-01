import Link from 'next/link'
import { Stethoscope, BookOpen, Brain, FileText, Users, BarChart3, Sparkles, Check, ChevronRight, GraduationCap, Award, Clock, Target } from 'lucide-react'

export default function MedicinaLandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-b from-emerald-950 via-teal-950 to-cyan-950 font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 bg-emerald-950/80 backdrop-blur-md px-4 md:px-10 py-3">
        <Link href="/medicina" className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PREPARAMED</span>
        </Link>
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-9">
            <a className="text-emerald-200 text-sm font-medium hover:text-white transition-colors" href="#recursos">Recursos</a>
            <a className="text-emerald-200 text-sm font-medium hover:text-white transition-colors" href="#planos">Planos</a>
            <a className="text-emerald-200 text-sm font-medium hover:text-white transition-colors" href="#depoimentos">Depoimentos</a>
          </div>
          <div className="flex gap-3">
            <Link href="/medicina/login" className="flex items-center justify-center h-10 px-5 bg-slate-100 text-white hover:bg-slate-200 transition-colors rounded-lg text-sm font-semibold">
              Entrar
            </Link>
            <Link href="/medicina/cadastro" className="flex items-center justify-center h-10 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-colors rounded-lg text-sm font-semibold shadow-lg shadow-emerald-500/20">
              Começar Grátis
            </Link>
          </div>
        </div>
        <div className="flex md:hidden">
          <Link href="/medicina/login" className="text-white p-2">
            <Stethoscope className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 px-4 md:px-10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Mais de 85.000 questões comentadas
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6">
              Sua aprovação na<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                residência médica
              </span>
              <br />começa aqui
            </h1>
            <p className="text-lg md:text-xl text-emerald-200 max-w-2xl mx-auto mb-10">
              A plataforma completa para estudantes de medicina. Questões comentadas, teoria detalhada, IA tutora 24/7 e muito mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/medicina/cadastro"
                className="flex items-center justify-center gap-2 h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-2xl shadow-emerald-500/30"
              >
                Começar Agora - É Grátis
                <ChevronRight className="w-5 h-5" />
              </Link>
              <a
                href="#recursos"
                className="flex items-center justify-center gap-2 h-14 px-8 bg-slate-100 text-white font-semibold text-lg rounded-xl hover:bg-slate-200 transition-colors border border-slate-300"
              >
                Ver Recursos
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
              {[
                { value: '85.000+', label: 'Questões', icon: FileText },
                { value: '36', label: 'Disciplinas', icon: BookOpen },
                { value: '24/7', label: 'IA Tutora', icon: Brain },
                { value: '10.000+', label: 'Estudantes', icon: Users }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
                  <stat.icon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-emerald-300 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 bg-black/20" id="recursos">
          <div className="max-w-6xl mx-auto px-4 md:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Tudo para sua aprovação
              </h2>
              <p className="text-emerald-200 text-lg max-w-2xl mx-auto">
                Ferramentas desenvolvidas especialmente para estudantes de medicina que querem passar na residência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: FileText,
                  title: 'Banco de Questões',
                  description: '+85.000 questões de provas reais com gabarito comentado. ENARE, USP, UNICAMP e todas as principais bancas.',
                  color: 'emerald'
                },
                {
                  icon: BookOpen,
                  title: 'Biblioteca de Teoria',
                  description: 'Conteúdo completo de todas as disciplinas, com 3 níveis de profundidade: básico, avançado e expert.',
                  color: 'teal'
                },
                {
                  icon: Brain,
                  title: 'IA Tutora 24/7',
                  description: 'Tire dúvidas a qualquer hora. A IA explica conceitos, ajuda a entender questões e gera resumos personalizados.',
                  color: 'cyan'
                },
                {
                  icon: Target,
                  title: 'Simulados Completos',
                  description: 'Monte simulados personalizados ou faça provas anteriores completas com timer e análise de desempenho.',
                  color: 'emerald'
                },
                {
                  icon: GraduationCap,
                  title: 'Anotações Inteligentes',
                  description: 'Faça anotações vinculadas a questões e teorias. Exporte em PDF ou Word para revisar offline.',
                  color: 'teal'
                },
                {
                  icon: BarChart3,
                  title: 'Estatísticas Detalhadas',
                  description: 'Acompanhe seu progresso por disciplina, identifique pontos fracos e compare com outros estudantes.',
                  color: 'cyan'
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group bg-slate-100 rounded-2xl p-8 border border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-emerald-200/80">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-20" id="planos">
          <div className="max-w-6xl mx-auto px-4 md:px-10">
            <div className="text-center mb-12">
              {/* Urgência e escassez */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-sm font-medium mb-6 animate-pulse">
                <Clock className="w-4 h-4" />
                🔥 Oferta por tempo limitado - Economize até 40%
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Invista no seu <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">futuro</span>
              </h2>
              <p className="text-emerald-200 text-lg max-w-2xl mx-auto">
                Milhares de estudantes já conquistaram sua vaga na residência. Você é o próximo!
              </p>
              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-emerald-950 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
                <span className="text-emerald-300 text-sm ml-2">+2.847 alunos esta semana</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Gratuito */}
              <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200 hover:border-slate-300 transition-all">
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-xs font-medium mb-4">
                    BÁSICO
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-black text-white">R$0</span>
                  </div>
                  <p className="text-emerald-200/60 text-sm">Para sempre grátis</p>
                </div>
                <Link
                  href="/medicina/cadastro"
                  className="block w-full py-3.5 text-center bg-slate-100 text-white font-semibold rounded-xl hover:bg-slate-200 transition-all mb-6"
                >
                  Começar Grátis
                </Link>
                <ul className="space-y-3">
                  {[
                    '10 questões por dia',
                    'Teoria básica',
                    '10 anotações',
                    'Estatísticas básicas',
                    'Trial de 4h completo'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-200/70 text-sm">
                      <Check className="w-5 h-5 text-emerald-500/50 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium - Destaque */}
              <div className="relative bg-gradient-to-b from-emerald-500/30 via-emerald-500/20 to-teal-500/10 rounded-2xl p-8 border-2 border-emerald-400 transform md:-translate-y-6 md:scale-105 shadow-2xl shadow-emerald-500/20">
                {/* Badges */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white text-sm font-bold shadow-lg">
                    ⭐ MAIS ESCOLHIDO
                  </span>
                </div>
                <div className="absolute -right-2 top-8 rotate-12">
                  <span className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold shadow-lg">
                    -25%
                  </span>
                </div>

                <div className="text-center mb-6 pt-2">
                  <span className="inline-block px-3 py-1 bg-emerald-500/30 rounded-full text-emerald-300 text-xs font-medium mb-4">
                    RECOMENDADO
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                  {/* Preço com desconto */}
                  <div className="mb-2">
                    <span className="text-slate-500 line-through text-lg">R$79,90</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-slate-600 text-xl">R$</span>
                    <span className="text-5xl font-black text-white">59</span>
                    <span className="text-slate-600 text-xl">,90</span>
                    <span className="text-emerald-300 text-sm">/mês</span>
                  </div>
                  <p className="text-emerald-300 text-sm mt-2 font-medium">
                    💰 Economia de R$240/ano
                  </p>
                </div>
                <Link
                  href="/medicina/cadastro?plano=premium"
                  className="block w-full py-4 text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/30 mb-6 text-lg"
                >
                  🚀 Quero ser Premium
                </Link>
                <ul className="space-y-3">
                  {[
                    { text: 'Questões ilimitadas', highlight: true },
                    { text: '5 simulados por mês', highlight: false },
                    { text: 'Teoria avançada', highlight: false },
                    { text: '100 anotações', highlight: false },
                    { text: '100 perguntas IA/mês', highlight: true },
                    { text: '15 resumos IA/mês', highlight: false },
                    { text: '50 flashcards', highlight: false },
                    { text: 'Suporte por e-mail', highlight: false }
                  ].map((item, i) => (
                    <li key={i} className={`flex items-start gap-3 text-sm ${item.highlight ? 'text-white font-medium' : 'text-emerald-200/80'}`}>
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {item.text}
                    </li>
                  ))}
                </ul>
                {/* Garantia */}
                <div className="mt-6 pt-4 border-t border-emerald-500/30 text-center">
                  <p className="text-emerald-300/80 text-xs flex items-center justify-center gap-1">
                    <Award className="w-4 h-4" />
                    7 dias de garantia ou seu dinheiro de volta
                  </p>
                </div>
              </div>

              {/* Residência */}
              <div className="relative bg-gradient-to-b from-amber-500/20 to-orange-500/10 rounded-2xl p-8 border border-amber-500/30 hover:border-amber-500/50 transition-all">
                {/* Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-sm font-bold shadow-lg">
                    👑 COMPLETO
                  </span>
                </div>
                <div className="absolute -right-2 top-8 rotate-12">
                  <span className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold shadow-lg">
                    -40%
                  </span>
                </div>

                <div className="text-center mb-6 pt-2">
                  <span className="inline-block px-3 py-1 bg-amber-500/30 rounded-full text-amber-300 text-xs font-medium mb-4">
                    APROVAÇÃO GARANTIDA
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">Residência</h3>
                  {/* Preço com desconto */}
                  <div className="mb-2">
                    <span className="text-slate-500 line-through text-lg">R$249,90</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-slate-600 text-xl">R$</span>
                    <span className="text-5xl font-black text-white">149</span>
                    <span className="text-slate-600 text-xl">,90</span>
                    <span className="text-amber-300 text-sm">/mês</span>
                  </div>
                  <p className="text-amber-300 text-sm mt-2 font-medium">
                    💰 Economia de R$1.200/ano
                  </p>
                </div>
                <Link
                  href="/medicina/cadastro?plano=residencia"
                  className="block w-full py-4 text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/30 mb-6 text-lg"
                >
                  👑 Garantir minha vaga
                </Link>
                <ul className="space-y-3">
                  {[
                    { text: 'Tudo do Premium +', highlight: true },
                    { text: 'Simulados ilimitados', highlight: true },
                    { text: 'IA Tutora ilimitada', highlight: true },
                    { text: 'Teoria nível Expert', highlight: false },
                    { text: 'Anotações ilimitadas', highlight: false },
                    { text: 'Flashcards ilimitados', highlight: false },
                    { text: 'Histórico completo', highlight: false },
                    { text: 'Suporte prioritário 24h', highlight: true },
                    { text: 'Destaque no fórum', highlight: false }
                  ].map((item, i) => (
                    <li key={i} className={`flex items-start gap-3 text-sm ${item.highlight ? 'text-white font-medium' : 'text-amber-200/80'}`}>
                      <Check className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      {item.text}
                    </li>
                  ))}
                </ul>
                {/* Garantia */}
                <div className="mt-6 pt-4 border-t border-amber-500/30 text-center">
                  <p className="text-amber-300/80 text-xs flex items-center justify-center gap-1">
                    <Award className="w-4 h-4" />
                    7 dias de garantia ou seu dinheiro de volta
                  </p>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-emerald-200/50 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Pagamento seguro
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Cancele quando quiser
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                Suporte humanizado
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-20 bg-black/20" id="depoimentos">
          <div className="max-w-6xl mx-auto px-4 md:px-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Quem usa, aprova
              </h2>
              <p className="text-emerald-200 text-lg">
                Estudantes de todo o Brasil já estão se preparando com o PREPARAMED
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Dra. Marina Silva',
                  course: 'Aprovada em Clínica Médica - USP',
                  quote: 'As questões comentadas e a teoria detalhada fizeram toda a diferença na minha preparação. Recomendo demais!'
                },
                {
                  name: 'Dr. Pedro Santos',
                  course: 'Aprovado em Cirurgia - UNICAMP',
                  quote: 'A IA tutora é incrível! Sempre que tinha dúvida, ela me explicava de um jeito que eu entendia.'
                },
                {
                  name: 'Dra. Ana Oliveira',
                  course: 'Aprovada em Pediatria - UNIFESP',
                  quote: 'Os simulados me ajudaram muito a entender o ritmo da prova. Consegui gabaritar várias questões!'
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Award className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-emerald-400 text-sm">{testimonial.course}</div>
                    </div>
                  </div>
                  <p className="text-emerald-200/80 italic">&quot;{testimonial.quote}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20">
          <div className="max-w-4xl mx-auto px-4 md:px-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Comece sua jornada hoje
            </h2>
            <p className="text-emerald-200 text-lg mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de estudantes que já estão se preparando para a residência médica com o PREPARAMED.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/medicina/cadastro"
                className="flex items-center justify-center gap-2 h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-2xl shadow-emerald-500/30"
              >
                Criar Conta Grátis
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/medicina/login"
                className="flex items-center justify-center gap-2 h-14 px-8 bg-slate-100 text-white font-semibold text-lg rounded-xl hover:bg-slate-200 transition-colors border border-slate-300"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-black/30 border-t border-slate-200 py-12 px-4 md:px-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">PREPARAMED</span>
                </div>
                <p className="text-emerald-200/60 text-sm">
                  A plataforma nº 1 para estudantes de medicina que querem passar na residência.
                </p>
              </div>
              {/* Links */}
              <div className="flex flex-col gap-3">
                <h4 className="text-white font-bold">Produto</h4>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#recursos">Recursos</a>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#planos">Planos</a>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#depoimentos">Depoimentos</a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-white font-bold">Suporte</h4>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#">FAQ</a>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#">Contato</a>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#">Ajuda</a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-white font-bold">Legal</h4>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#">Termos de Uso</a>
                <a className="text-emerald-200/60 hover:text-white transition-colors text-sm" href="#">Privacidade</a>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-emerald-200/40 text-sm">
                © 2026 PREPARAMED. Todos os direitos reservados.
              </p>
              <Link href="/" className="text-emerald-200/60 hover:text-white transition-colors text-sm">
                Voltar para Estuda
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
