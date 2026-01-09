import Link from 'next/link'
import { Stethoscope, BookOpen, Brain, FileText, Users, BarChart3, Sparkles, Check, ChevronRight, GraduationCap, Award, Clock, Target } from 'lucide-react'

export default function MedicinaLandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-b from-emerald-950 via-teal-950 to-cyan-950 font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-emerald-950/80 backdrop-blur-md px-4 md:px-10 py-3">
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
            <Link href="/medicina/login" className="flex items-center justify-center h-10 px-5 bg-white/10 text-white hover:bg-white/20 transition-colors rounded-lg text-sm font-semibold">
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
                className="flex items-center justify-center gap-2 h-14 px-8 bg-white/10 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-colors border border-white/20"
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
                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
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
                  className="group bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all"
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
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Escolha seu plano
              </h2>
              <p className="text-emerald-200 text-lg max-w-2xl mx-auto">
                Comece gratuitamente e evolua conforme sua necessidade
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Gratuito */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-2">Gratuito</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white">R$0</span>
                  <span className="text-emerald-300">/mês</span>
                </div>
                <p className="text-emerald-200/80 text-sm mb-6">Para começar a estudar</p>
                <Link
                  href="/medicina/cadastro"
                  className="block w-full py-3 text-center bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors mb-6"
                >
                  Criar Conta Grátis
                </Link>
                <ul className="space-y-3">
                  {[
                    '20 questões por dia',
                    '2 simulados por mês',
                    'Teoria básica (1º ano)',
                    '10 anotações',
                    'Fórum (apenas leitura)'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-200/80 text-sm">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium */}
              <div className="bg-gradient-to-b from-emerald-500/20 to-teal-500/20 rounded-2xl p-8 border-2 border-emerald-500 relative transform md:-translate-y-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full text-white text-sm font-bold">
                  Mais Popular
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white">R$50</span>
                  <span className="text-emerald-300">/mês</span>
                </div>
                <p className="text-emerald-200/80 text-sm mb-6">Para estudar com tudo</p>
                <Link
                  href="/medicina/cadastro?plano=premium"
                  className="block w-full py-3 text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors mb-6"
                >
                  Assinar Premium
                </Link>
                <ul className="space-y-3">
                  {[
                    'Questões ilimitadas',
                    '10 simulados por mês',
                    'Teoria completa (todos os anos)',
                    '100 anotações',
                    '100 perguntas IA/mês',
                    '20 resumos IA/mês',
                    'Exportar PDF/Word',
                    'Fórum completo'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-200/80 text-sm">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Residência */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 rounded-full text-white text-sm font-bold">
                  Completo
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Residência</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white">R$100</span>
                  <span className="text-emerald-300">/mês</span>
                </div>
                <p className="text-emerald-200/80 text-sm mb-6">Para quem quer garantir</p>
                <Link
                  href="/medicina/cadastro?plano=residencia"
                  className="block w-full py-3 text-center bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors mb-6"
                >
                  Assinar Residência
                </Link>
                <ul className="space-y-3">
                  {[
                    'Tudo do Premium',
                    'Simulados ilimitados',
                    '200 questões por simulado',
                    'IA ilimitada',
                    'Teoria nível Expert',
                    'Anotações ilimitadas',
                    'Histórico ilimitado',
                    'Destaque no fórum',
                    'Suporte prioritário'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-200/80 text-sm">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
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
                <div key={i} className="bg-white/5 rounded-2xl p-8 border border-white/10">
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
                className="flex items-center justify-center gap-2 h-14 px-8 bg-white/10 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-colors border border-white/20"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-black/30 border-t border-white/10 py-12 px-4 md:px-10">
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
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
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
