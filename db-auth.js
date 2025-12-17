#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createUser(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });
    
    if (error) throw error;
    
    console.log('✅ Usuário criado com sucesso!');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function listUsers() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    
    console.log('\n👥 Usuários cadastrados:\n');
    data.users.forEach(user => {
      console.log(`📧 ${user.email} (ID: ${user.id})`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}\n`);
    });
    console.log(`✅ Total: ${data.users.length} usuários`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function deleteUser(userId) {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) throw error;
    
    console.log('✅ Usuário deletado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function resetPassword(userId, newPassword) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (error) throw error;
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'create':
    const email = process.argv[3];
    const password = process.argv[4];
    const metadata = process.argv[5] ? JSON.parse(process.argv[5]) : {};
    
    if (!email || !password) {
      console.log('❌ Uso: node db-auth.js create [email] [senha] [metadata_json]');
      process.exit(1);
    }
    createUser(email, password, metadata);
    break;
    
  case 'list':
    listUsers();
    break;
    
  case 'delete':
    const userId = process.argv[3];
    if (!userId) {
      console.log('❌ Uso: node db-auth.js delete [user_id]');
      process.exit(1);
    }
    deleteUser(userId);
    break;
    
  case 'reset-password':
    const uid = process.argv[3];
    const newPass = process.argv[4];
    if (!uid || !newPass) {
      console.log('❌ Uso: node db-auth.js reset-password [user_id] [nova_senha]');
      process.exit(1);
    }
    resetPassword(uid, newPass);
    break;
    
  default:
    console.log('Uso: node db-auth.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  create [email] [senha] [metadata]  Criar usuário');
    console.log('  list                               Listar usuários');
    console.log('  delete [user_id]                   Deletar usuário');
    console.log('  reset-password [user_id] [senha]   Resetar senha');
    process.exit(1);
}
