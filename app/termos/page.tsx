import Link from 'next/link'
import { ArrowLeft, FileText, Shield, Users, AlertCircle, Scale, Clock, Mail } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/medicina"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-semibold">PREPARAMED</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Scale className="w-8 h-8 text-emerald-400" />
            Termos de Uso
          </h1>
          <p className="text-slate-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          {/* Seção 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              1. Aceitação dos Termos
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Ao acessar e utilizar a plataforma PREPARAMED, você concorda com estes Termos de Uso.
                Se você não concordar com algum destes termos, por favor, não utilize nossos serviços.
              </p>
              <p>
                A PREPARAMED é uma plataforma educacional voltada para estudantes de medicina que se preparam
                para provas de residência médica, oferecendo recursos como questões, flashcards, resumos e
                inteligência artificial para auxiliar nos estudos.
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              2. Uso da Plataforma
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>Ao utilizar a PREPARAMED, você concorda em:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer informações verdadeiras e atualizadas no cadastro</li>
                <li>Manter a segurança da sua conta e senha</li>
                <li>Não compartilhar sua conta com terceiros</li>
                <li>Utilizar o conteúdo apenas para fins educacionais pessoais</li>
                <li>Não reproduzir, distribuir ou comercializar o conteúdo da plataforma</li>
                <li>Não utilizar a IA para gerar conteúdo ilícito ou antiético</li>
              </ul>
            </div>
          </section>

          {/* Seção 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-400" />
              3. Conteúdo Educacional
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                O conteúdo disponibilizado na PREPARAMED, incluindo questões, explicações e respostas
                geradas por IA, tem caráter exclusivamente educacional e não substitui:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Consultas médicas ou orientação profissional de saúde</li>
                <li>Livros-texto e materiais acadêmicos oficiais</li>
                <li>Diretrizes e protocolos médicos oficiais</li>
              </ul>
              <p className="mt-4">
                A plataforma não se responsabiliza pelo uso inadequado das informações ou por decisões
                tomadas com base no conteúdo disponibilizado.
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              4. Planos e Pagamentos
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                A PREPARAMED oferece planos gratuitos e pagos. Para planos pagos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Os pagamentos são processados de forma segura por parceiros homologados</li>
                <li>A cobrança é recorrente conforme o plano escolhido</li>
                <li>O cancelamento pode ser feito a qualquer momento pelo painel do usuário</li>
                <li>Após o cancelamento, o acesso permanece até o fim do período pago</li>
                <li>Não há reembolso proporcional para cancelamentos antecipados</li>
              </ul>
            </div>
          </section>

          {/* Seção 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Propriedade Intelectual
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Todo o conteúdo da plataforma, incluindo textos, imagens, logotipos, código-fonte e
                design, é protegido por direitos autorais e pertence à PREPARAMED ou seus licenciadores.
              </p>
              <p>
                É expressamente proibido copiar, modificar, distribuir ou criar trabalhos derivados
                do conteúdo sem autorização prévia por escrito.
              </p>
            </div>
          </section>

          {/* Seção 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Limitação de Responsabilidade
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                A PREPARAMED não garante que a plataforma estará disponível de forma ininterrupta
                ou livre de erros. Não nos responsabilizamos por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Interrupções temporárias do serviço</li>
                <li>Perda de dados por falhas técnicas</li>
                <li>Resultados obtidos nas provas de residência</li>
                <li>Uso indevido da plataforma por terceiros</li>
              </ul>
            </div>
          </section>

          {/* Seção 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Modificações dos Termos
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                A PREPARAMED reserva-se o direito de modificar estes Termos de Uso a qualquer momento.
                As alterações entrarão em vigor imediatamente após sua publicação na plataforma.
              </p>
              <p>
                O uso continuado da plataforma após modificações constitui aceitação dos novos termos.
              </p>
            </div>
          </section>

          {/* Seção 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              8. Contato
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso, entre em contato:
              </p>
              <p className="text-emerald-400">suporte@preparamed.com.br</p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} PREPARAMED. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
