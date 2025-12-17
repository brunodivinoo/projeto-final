#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;
    
    console.log('\n🪣 Buckets disponíveis:\n');
    data.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
    });
    console.log(`\n✅ Total: ${data.length} buckets`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function createBucket(bucketName, isPublic = false) {
  try {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic
    });
    
    if (error) throw error;
    
    console.log(`✅ Bucket "${bucketName}" criado com sucesso!`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function uploadFile(bucketName, filePath, destinationPath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = destinationPath || path.basename(filePath);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'auto',
        upsert: true
      });
    
    if (error) throw error;
    
    console.log('✅ Arquivo enviado com sucesso!');
    console.log(`📁 Path: ${data.path}`);
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    console.log(`🔗 URL: ${urlData.publicUrl}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function downloadFile(bucketName, filePath, localPath) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) throw error;
    
    const buffer = await data.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(buffer));
    
    console.log(`✅ Arquivo baixado com sucesso!`);
    console.log(`📁 Salvo em: ${localPath}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function listFiles(bucketName, folder = '') {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folder);
    
    if (error) throw error;
    
    console.log(`\n📂 Arquivos em "${bucketName}/${folder}":\n`);
    data.forEach(file => {
      const type = file.id ? '📄' : '📁';
      console.log(`  ${type} ${file.name}`);
    });
    console.log(`\n✅ Total: ${data.length} itens`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function deleteFile(bucketName, filePath) {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) throw error;
    
    console.log('✅ Arquivo deletado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'list-buckets':
    listBuckets();
    break;
    
  case 'create-bucket':
    const bucketName = process.argv[3];
    const isPublic = process.argv[4] === 'true';
    if (!bucketName) {
      console.log('❌ Uso: node db-storage.js create-bucket [nome] [true|false]');
      process.exit(1);
    }
    createBucket(bucketName, isPublic);
    break;
    
  case 'upload':
    const bucket = process.argv[3];
    const filePath = process.argv[4];
    const destPath = process.argv[5];
    if (!bucket || !filePath) {
      console.log('❌ Uso: node db-storage.js upload [bucket] [arquivo_local] [path_destino]');
      process.exit(1);
    }
    uploadFile(bucket, filePath, destPath);
    break;
    
  case 'download':
    const dlBucket = process.argv[3];
    const dlPath = process.argv[4];
    const localPath = process.argv[5];
    if (!dlBucket || !dlPath || !localPath) {
      console.log('❌ Uso: node db-storage.js download [bucket] [path_remoto] [path_local]');
      process.exit(1);
    }
    downloadFile(dlBucket, dlPath, localPath);
    break;
    
  case 'list':
    const listBucket = process.argv[3];
    const folder = process.argv[4] || '';
    if (!listBucket) {
      console.log('❌ Uso: node db-storage.js list [bucket] [folder]');
      process.exit(1);
    }
    listFiles(listBucket, folder);
    break;
    
  case 'delete':
    const delBucket = process.argv[3];
    const delPath = process.argv[4];
    if (!delBucket || !delPath) {
      console.log('❌ Uso: node db-storage.js delete [bucket] [path]');
      process.exit(1);
    }
    deleteFile(delBucket, delPath);
    break;
    
  default:
    console.log('Uso: node db-storage.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  list-buckets                           Listar buckets');
    console.log('  create-bucket [nome] [publico]         Criar bucket');
    console.log('  upload [bucket] [arquivo] [destino]    Upload arquivo');
    console.log('  download [bucket] [remoto] [local]     Download arquivo');
    console.log('  list [bucket] [pasta]                  Listar arquivos');
    console.log('  delete [bucket] [path]                 Deletar arquivo');
    process.exit(1);
}
