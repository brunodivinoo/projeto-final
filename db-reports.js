#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateHTMLReport(tableName, title = null) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000);
    
    if (error) throw error;
    
    const reportTitle = title || `Relatório - ${tableName}`;
    const timestamp = new Date().toLocaleString('pt-BR');
    
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .summary { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <div class="meta">Gerado em: ${timestamp}</div>
  
  <div class="summary">
    <strong>Resumo:</strong> ${data.length} registros encontrados
  </div>
  
  <table>
    <thead>
      <tr>
        ${columns.map(col => `<th>${col}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${columns.map(col => `<td>${row[col] !== null ? row[col] : '-'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
    
    const fileName = `report_${tableName}_${Date.now()}.html`;
    fs.writeFileSync(fileName, html);
    
    console.log('✅ Relatório HTML gerado com sucesso!');
    console.log(`📁 Arquivo: ${fileName}`);
    console.log(`📊 Registros: ${data.length}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function generateCSVReport(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    
    if (data.length === 0) {
      console.log('⚠️  Nenhum dado encontrado');
      return;
    }
    
    const columns = Object.keys(data[0]);
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const val = row[col];
        if (val === null) return '';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const fileName = `report_${tableName}_${Date.now()}.csv`;
    fs.writeFileSync(fileName, csv);
    
    console.log('✅ Relatório CSV gerado com sucesso!');
    console.log(`📁 Arquivo: ${fileName}`);
    console.log(`📊 Registros: ${data.length}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function generateDashboard() {
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    
    const stats = [];
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table.table_name)
        .select('*', { count: 'exact', head: true });
      
      stats.push({ table: table.table_name, count: count || 0 });
    }
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Banco de Dados</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 10px 0; color: #4CAF50; }
    .card .count { font-size: 32px; font-weight: bold; color: #333; }
    .meta { color: #666; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Dashboard - Banco de Dados</h1>
    <div class="meta">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    
    <div class="grid">
      ${stats.map(s => `
        <div class="card">
          <h3>${s.table}</h3>
          <div class="count">${s.count}</div>
          <div style="color: #666; margin-top: 5px;">registros</div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
    
    const fileName = `dashboard_${Date.now()}.html`;
    fs.writeFileSync(fileName, html);
    
    console.log('✅ Dashboard gerado com sucesso!');
    console.log(`📁 Arquivo: ${fileName}`);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'html':
    const table = process.argv[3];
    const title = process.argv[4];
    if (!table) {
      console.log('❌ Uso: node db-reports.js html [tabela] [título]');
      process.exit(1);
    }
    generateHTMLReport(table, title);
    break;
    
  case 'csv':
    const csvTable = process.argv[3];
    if (!csvTable) {
      console.log('❌ Uso: node db-reports.js csv [tabela]');
      process.exit(1);
    }
    generateCSVReport(csvTable);
    break;
    
  case 'dashboard':
    generateDashboard();
    break;
    
  default:
    console.log('Uso: node db-reports.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  html [tabela] [título]  Gerar relatório HTML');
    console.log('  csv [tabela]            Gerar relatório CSV');
    console.log('  dashboard               Gerar dashboard completo');
    process.exit(1);
}
