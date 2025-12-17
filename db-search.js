#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchInTable(tableName, column, searchTerm, options = {}) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Busca com LIKE ou ILIKE
    if (options.caseSensitive) {
      query = query.like(column, `%${searchTerm}%`);
    } else {
      query = query.ilike(column, `%${searchTerm}%`);
    }
    
    // Limite de resultados
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`\n🔍 Resultados da busca em "${tableName}.${column}":\n`);
    console.log(`Termo: "${searchTerm}"`);
    console.log(`Encontrados: ${data.length} registros\n`);
    
    if (data.length > 0) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Nenhum resultado encontrado.');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function fullTextSearch(tableName, columns, searchTerm) {
  try {
    // Busca em múltiplas colunas
    const { data: allData, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    
    const results = allData.filter(row => {
      return columns.some(col => {
        const value = row[col];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
    
    console.log(`\n🔍 Busca em múltiplas colunas de "${tableName}":\n`);
    console.log(`Colunas: ${columns.join(', ')}`);
    console.log(`Termo: "${searchTerm}"`);
    console.log(`Encontrados: ${results.length} registros\n`);
    
    if (results.length > 0) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log('Nenhum resultado encontrado.');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

async function advancedSearch(tableName, filters) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Aplicar múltiplos filtros
    Object.entries(filters).forEach(([column, condition]) => {
      if (condition.eq) query = query.eq(column, condition.eq);
      if (condition.neq) query = query.neq(column, condition.neq);
      if (condition.gt) query = query.gt(column, condition.gt);
      if (condition.lt) query = query.lt(column, condition.lt);
      if (condition.gte) query = query.gte(column, condition.gte);
      if (condition.lte) query = query.lte(column, condition.lte);
      if (condition.like) query = query.like(column, condition.like);
      if (condition.ilike) query = query.ilike(column, condition.ilike);
      if (condition.is) query = query.is(column, condition.is);
      if (condition.in) query = query.in(column, condition.in);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`\n🔍 Busca avançada em "${tableName}":\n`);
    console.log(`Filtros aplicados: ${Object.keys(filters).length}`);
    console.log(`Encontrados: ${data.length} registros\n`);
    
    if (data.length > 0) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Nenhum resultado encontrado.');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

const command = process.argv[2];

switch (command) {
  case 'simple':
    const table = process.argv[3];
    const column = process.argv[4];
    const term = process.argv[5];
    
    if (!table || !column || !term) {
      console.log('❌ Uso: node db-search.js simple [tabela] [coluna] [termo]');
      process.exit(1);
    }
    searchInTable(table, column, term);
    break;
    
  case 'multi':
    const multiTable = process.argv[3];
    const columnsStr = process.argv[4];
    const multiTerm = process.argv[5];
    
    if (!multiTable || !columnsStr || !multiTerm) {
      console.log('❌ Uso: node db-search.js multi [tabela] [col1,col2,col3] [termo]');
      process.exit(1);
    }
    
    const columns = columnsStr.split(',');
    fullTextSearch(multiTable, columns, multiTerm);
    break;
    
  case 'advanced':
    const advTable = process.argv[3];
    const filtersJson = process.argv[4];
    
    if (!advTable || !filtersJson) {
      console.log('❌ Uso: node db-search.js advanced [tabela] \'{"coluna": {"eq": "valor"}}\'');
      console.log('\nOperadores disponíveis: eq, neq, gt, lt, gte, lte, like, ilike, is, in');
      process.exit(1);
    }
    
    const filters = JSON.parse(filtersJson);
    advancedSearch(advTable, filters);
    break;
    
  default:
    console.log('Uso: node db-search.js [comando] [argumentos]');
    console.log('\nComandos disponíveis:');
    console.log('  simple [tabela] [coluna] [termo]           Busca simples');
    console.log('  multi [tabela] [col1,col2] [termo]         Busca em múltiplas colunas');
    console.log('  advanced [tabela] \'{"filtros": {...}}\'     Busca avançada');
    process.exit(1);
}
