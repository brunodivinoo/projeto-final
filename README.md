# 🗄️ Ferramentas de Banco de Dados Supabase

Kit completo de ferramentas CLI para gerenciar banco de dados Supabase.

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

As credenciais já estão configuradas no arquivo `.env.local`

## 🛠️ Ferramentas Disponíveis

### 1️⃣ db-admin.js - SQL Administrativo
Executar comandos SQL diretos (CREATE, ALTER, DROP, etc)

```bash
node db-admin.js sql "CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL)"
node db-admin.js sql "ALTER TABLE users ADD COLUMN email text"
node db-admin.js sql "ALTER TABLE users ENABLE ROW LEVEL SECURITY"
```

### 2️⃣ db-query.js - Consultas e Estruturas
Listar tabelas e visualizar estruturas

```bash
node db-query.js list-tables
node db-query.js describe users
```

### 3️⃣ db-manager.js - CRUD Completo
Operações de SELECT, INSERT, UPDATE, DELETE

```bash
# SELECT
node db-manager.js select users
node db-manager.js select users '{"name": "João"}'

# INSERT
node db-manager.js insert users '{"name": "Maria", "email": "maria@example.com"}'

# UPDATE
node db-manager.js update users '{"id": "123"}' '{"name": "Maria Silva"}'

# DELETE
node db-manager.js delete users '{"id": "123"}'
```

### 4️⃣ db-auth.js - Gerenciamento de Usuários
Criar, listar, deletar usuários e resetar senhas

```bash
node db-auth.js create usuario@email.com senha123
node db-auth.js list
node db-auth.js delete [user_id]
node db-auth.js reset-password [user_id] novaSenha123
```

### 5️⃣ db-storage.js - Upload/Download de Arquivos
Gerenciar buckets e arquivos

```bash
node db-storage.js list-buckets
node db-storage.js create-bucket avatars true
node db-storage.js upload avatars ./foto.jpg avatar.jpg
node db-storage.js download avatars avatar.jpg ./baixado.jpg
node db-storage.js list avatars
node db-storage.js delete avatars avatar.jpg
```

### 6️⃣ db-stats.js - Estatísticas e Performance
Visualizar estatísticas do banco

```bash
node db-stats.js overview
node db-stats.js table users
node db-stats.js size
node db-stats.js connections
```

### 7️⃣ db-backup.js - Backups
Criar backups em JSON, CSV ou SQL

```bash
node db-backup.js table users json
node db-backup.js table users csv
node db-backup.js table users sql
node db-backup.js all json
node db-backup.js restore users backup_users_2024.json
```

### 8️⃣ db-reports.js - Relatórios
Gerar relatórios HTML, CSV e dashboards

```bash
node db-reports.js html users "Relatório de Usuários"
node db-reports.js csv users
node db-reports.js dashboard
```

### 9️⃣ db-search.js - Busca Avançada
Buscar em tabelas com filtros

```bash
# Busca simples
node db-search.js simple users name João

# Busca em múltiplas colunas
node db-search.js multi users name,email joao

# Busca avançada com filtros
node db-search.js advanced users '{"age": {"gt": 18}, "status": {"eq": "active"}}'
```

### 🔟 db-realtime.js - Monitoramento em Tempo Real
Monitorar mudanças em tempo real

```bash
node db-realtime.js users
node db-realtime.js users INSERT
node db-realtime.js users UPDATE
node db-realtime.js users DELETE
```

### 1️⃣1️⃣ db-audit.js - Auditoria
Sistema de auditoria de mudanças

```bash
node db-audit.js enable users
node db-audit.js view users 50
node db-audit.js export users
```

### 1️⃣2️⃣ db-webhooks.js - Webhooks
Configurar webhooks para eventos

```bash
node db-webhooks.js create users https://example.com/webhook INSERT,UPDATE
node db-webhooks.js test https://example.com/webhook '{"test": true}'
node db-webhooks.js list
```

### 1️⃣3️⃣ db-automation.js - Jobs Agendados
Automatizar tarefas com cron jobs

```bash
node db-automation.js cleanup logs 30
node db-automation.js backup users
node db-automation.js list
node db-automation.js delete [job_id]
```

## 🚀 Fluxo de Trabalho Recomendado

### 1. Criar Estrutura do Banco
```bash
# Criar tabela
node db-admin.js sql "CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text UNIQUE, created_at timestamptz DEFAULT now())"

# Verificar estrutura
node db-query.js describe users

# Habilitar RLS
node db-admin.js sql "ALTER TABLE users ENABLE ROW LEVEL SECURITY"
```

### 2. Popular Dados
```bash
# Inserir registros
node db-manager.js insert users '{"name": "João Silva", "email": "joao@example.com"}'
node db-manager.js insert users '{"name": "Maria Santos", "email": "maria@example.com"}'

# Verificar
node db-manager.js select users
```

### 3. Configurar Automação
```bash
# Backup diário
node db-automation.js backup users

# Limpeza automática
node db-automation.js cleanup logs 30

# Auditoria
node db-audit.js enable users
```

### 4. Monitoramento
```bash
# Estatísticas
node db-stats.js overview
node db-stats.js table users

# Tempo real
node db-realtime.js users
```

## 📊 Exemplo de Uso Completo

```bash
# 1. Verificar tabelas existentes
node db-query.js list-tables

# 2. Criar nova tabela
node db-admin.js sql "CREATE TABLE produtos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, preco decimal(10,2), estoque integer, created_at timestamptz DEFAULT now())"

# 3. Inserir dados
node db-manager.js insert produtos '{"nome": "Notebook", "preco": 2500.00, "estoque": 10}'

# 4. Buscar
node db-search.js simple produtos nome Notebook

# 5. Gerar relatório
node db-reports.js html produtos "Relatório de Produtos"

# 6. Fazer backup
node db-backup.js table produtos json
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env.local`
- ⚠️ **NUNCA** exponha a `SERVICE_ROLE_KEY` publicamente
- ✅ Use `.gitignore` para proteger credenciais
- ✅ Use RLS (Row Level Security) em produção

## 📝 Notas

- Todas as ferramentas usam o Supabase Client com SERVICE_ROLE_KEY
- Certifique-se de ter as permissões necessárias
- Em produção, use variáveis de ambiente seguras

## 🐛 Troubleshooting

**Erro de conexão:**
```bash
node db-stats.js connections
```

**Tabela não encontrada:**
```bash
node db-query.js list-tables
```

**Erro de permissão:**
- Verifique se as credenciais em `.env.local` estão corretas
- Verifique se a SERVICE_ROLE_KEY está correta

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

✨ **Todas as ferramentas prontas para uso!**
