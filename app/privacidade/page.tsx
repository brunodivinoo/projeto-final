import Link from 'next/link'
import { ArrowLeft, FileText, Shield, Database, Eye, Lock, Share2, Settings, Mail, Trash2 } from 'lucide-react'

export default function PrivacidadePage() {
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
            <Shield className="w-8 h-8 text-emerald-400" />
            Política de Privacidade
          </h1>
          <p className="text-slate-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          {/* Introdução */}
          <section className="mb-8">
            <div className="text-slate-300 space-y-3">
              <p>
                A PREPARAMED está comprometida em proteger sua privacidade. Esta Política de Privacidade
                explica como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando
                você utiliza nossa plataforma.
              </p>
              <p>
                Ao utilizar a PREPARAMED, você concorda com a coleta e uso de informações de acordo
                com esta política.
              </p>
            </div>
          </section>

          {/* Seção 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              1. Dados que Coletamos
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>Coletamos os seguintes tipos de informações:</p>

              <h3 className="text-lg font-medium text-white mt-4">1.1 Dados fornecidos por você:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Universidade/Instituição de ensino</li>
                <li>Ano de formatura previsto</li>
                <li>Foto de perfil (opcional)</li>
              </ul>

              <h3 className="text-lg font-medium text-white mt-4">1.2 Dados coletados automaticamente:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Endereço IP e localização aproximada</li>
                <li>Tipo de dispositivo e navegador</li>
                <li>Páginas visitadas e tempo de uso</li>
                <li>Desempenho em questões e simulados</li>
                <li>Interações com a IA Tutora</li>
              </ul>
            </div>
          </section>

          {/* Seção 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              2. Como Usamos seus Dados
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>Utilizamos suas informações para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer e personalizar nossos serviços educacionais</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Gerar relatórios de desempenho e estatísticas de estudo</li>
                <li>Melhorar a experiência da plataforma com base no uso</li>
                <li>Enviar comunicações importantes sobre sua conta</li>
                <li>Enviar novidades e conteúdos educacionais (com seu consentimento)</li>
                <li>Personalizar as respostas da IA Tutora</li>
                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              </ul>
            </div>
          </section>

          {/* Seção 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              3. Segurança dos Dados
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Criptografia SSL/TLS em todas as comunicações</li>
                <li>Armazenamento seguro em servidores certificados</li>
                <li>Autenticação segura com proteção contra ataques</li>
                <li>Acesso restrito aos dados por funcionários autorizados</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares com criptografia</li>
              </ul>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              4. Compartilhamento de Dados
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Não vendemos seus dados pessoais. Podemos compartilhar informações com:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Processadores de pagamento:</strong> Para processar transações de forma segura</li>
                <li><strong>Provedores de infraestrutura:</strong> Serviços de hospedagem e banco de dados</li>
                <li><strong>Serviços de IA:</strong> Para processar consultas à IA Tutora (dados anonimizados)</li>
                <li><strong>Autoridades legais:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="mt-4">
                Todos os terceiros com quem compartilhamos dados são obrigados contratualmente a
                proteger suas informações de acordo com esta política.
              </p>
            </div>
          </section>

          {/* Seção 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              5. Seus Direitos (LGPD)
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Retirar o consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados</li>
              </ul>
              <p className="mt-4">
                Para exercer qualquer desses direitos, entre em contato conosco pelo e-mail abaixo.
              </p>
            </div>
          </section>

          {/* Seção 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Cookies e Tecnologias Similares
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter você conectado à sua conta</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar o uso da plataforma</li>
                <li>Melhorar nossos serviços</li>
              </ul>
              <p className="mt-4">
                Você pode configurar seu navegador para recusar cookies, mas isso pode afetar
                a funcionalidade da plataforma.
              </p>
            </div>
          </section>

          {/* Seção 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-emerald-400" />
              7. Retenção de Dados
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Mantemos seus dados pessoais pelo tempo necessário para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer nossos serviços enquanto sua conta estiver ativa</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Resolver disputas e fazer cumprir nossos acordos</li>
              </ul>
              <p className="mt-4">
                Após o encerramento da conta, seus dados serão anonimizados ou excluídos
                em até 30 dias, exceto quando a retenção for exigida por lei.
              </p>
            </div>
          </section>

          {/* Seção 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Menores de Idade
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                A PREPARAMED é destinada a estudantes de medicina e profissionais da saúde.
                Não coletamos intencionalmente dados de menores de 18 anos. Se tomarmos conhecimento
                de que coletamos dados de um menor, tomaremos medidas para excluí-los.
              </p>
            </div>
          </section>

          {/* Seção 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Alterações nesta Política
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos
                sobre mudanças significativas por e-mail ou através de aviso na plataforma.
              </p>
              <p>
                Recomendamos revisar esta política periodicamente para estar ciente de
                como protegemos suas informações.
              </p>
            </div>
          </section>

          {/* Seção 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              10. Contato
            </h2>
            <div className="text-slate-300 space-y-3">
              <p>
                Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos,
                entre em contato:
              </p>
              <p className="text-emerald-400">privacidade@preparamed.com.br</p>
              <p className="mt-4 text-sm text-slate-400">
                Encarregado de Proteção de Dados (DPO): dpo@preparamed.com.br
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} PREPARAMED. Todos os direitos reservados.
            </p>
            <Link
              href="/termos"
              className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block"
            >
              Ver Termos de Uso
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
