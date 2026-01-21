// Dados estáticos do NutriMãe

export const MENSAGENS_MOTIVACIONAIS = [
  "Voce esta fazendo um trabalho incrivel, mamae!",
  "Cada pequeno passo conta. Continue assim!",
  "Seu corpo criou uma vida. Seja gentil com ele!",
  "Hoje e um novo dia cheio de possibilidades!",
  "Voce e mais forte do que imagina!",
  "Progresso, nao perfeicao!",
  "Seu bebe tem a melhor mamae do mundo!",
  "Descanse quando precisar. Voce merece!",
  "Celebre cada vitoria, por menor que seja!",
  "Voce esta no caminho certo!",
  "Lembre-se: isso e uma maratona, nao uma corrida!",
  "Seu esforco vai valer a pena!"
]

export const DICAS_DIARIAS = [
  { icon: "water", texto: "Beba um copo de agua assim que acordar" },
  { icon: "egg", texto: "Nunca pule o cafe da manha" },
  { icon: "salad", texto: "Metade do prato deve ser vegetais" },
  { icon: "walk", texto: "10 minutos de caminhada ja fazem diferenca" },
  { icon: "sleep", texto: "Durma quando o bebe dormir" },
  { icon: "fruit", texto: "Tenha frutas lavadas e prontas na geladeira" },
  { icon: "phone", texto: "Cada vez que pegar o celular, beba agua" },
  { icon: "stretch", texto: "5 minutos de alongamento aliviam tensoes" }
]

export interface Suplemento {
  id: string
  nome: string
  descricao: string
  dose: string
  horario: string
  essencial: boolean
  icon: string
}

export const SUPLEMENTOS: Suplemento[] = [
  { id: "omega3", nome: "Omega 3", descricao: "Desenvolvimento cerebral do bebe", dose: "1000mg/dia", horario: "Com refeicao", essencial: true, icon: "fish" },
  { id: "vitd", nome: "Vitamina D", descricao: "Ossos e imunidade", dose: "2000 UI/dia", horario: "Manha", essencial: true, icon: "sun" },
  { id: "ferro", nome: "Ferro", descricao: "Previne anemia pos-parto", dose: "27mg/dia", horario: "Jejum", essencial: true, icon: "strength" },
  { id: "calcio", nome: "Calcio", descricao: "Saude ossea", dose: "1000mg/dia", horario: "Dividir em 2x", essencial: true, icon: "bone" },
  { id: "b12", nome: "Vitamina B12", descricao: "Energia e sistema nervoso", dose: "2.8mcg/dia", horario: "Manha", essencial: false, icon: "zap" },
  { id: "colageno", nome: "Colageno", descricao: "Pele e articulacoes", dose: "10g/dia", horario: "Manha ou noite", essencial: false, icon: "sparkle" },
  { id: "probiotico", nome: "Probiotico", descricao: "Saude intestinal", dose: "1 capsula/dia", horario: "Jejum", essencial: false, icon: "gut" },
  { id: "magnesio", nome: "Magnesio", descricao: "Relaxamento e sono", dose: "400mg/dia", horario: "Noite", essencial: false, icon: "moon" }
]

export interface Alimento {
  nome: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  porcao: string
  icon: string
}

export const ALIMENTOS_DATABASE: Record<string, Alimento[]> = {
  proteinas: [
    { nome: "Frango (peito)", calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6, porcao: "100g", icon: "drumstick" },
    { nome: "Ovos", calorias: 155, proteinas: 13, carboidratos: 1.1, gorduras: 11, porcao: "2 unid", icon: "egg" },
    { nome: "Salmao", calorias: 208, proteinas: 20, carboidratos: 0, gorduras: 13, porcao: "100g", icon: "fish" },
    { nome: "Carne magra", calorias: 250, proteinas: 26, carboidratos: 0, gorduras: 15, porcao: "100g", icon: "beef" },
    { nome: "Tilapia", calorias: 96, proteinas: 20, carboidratos: 0, gorduras: 1.7, porcao: "100g", icon: "fish" },
    { nome: "Peito de peru", calorias: 104, proteinas: 17, carboidratos: 4.2, gorduras: 1.7, porcao: "100g", icon: "turkey" },
    { nome: "Atum em agua", calorias: 116, proteinas: 26, carboidratos: 0, gorduras: 0.8, porcao: "100g", icon: "fish" },
    { nome: "Queijo cottage", calorias: 98, proteinas: 11, carboidratos: 3.4, gorduras: 4.3, porcao: "100g", icon: "cheese" },
    { nome: "Queijo branco", calorias: 264, proteinas: 17, carboidratos: 3, gorduras: 21, porcao: "100g", icon: "cheese" },
    { nome: "Iogurte grego", calorias: 97, proteinas: 9, carboidratos: 3.6, gorduras: 5, porcao: "100g", icon: "milk" },
    { nome: "Whey protein", calorias: 120, proteinas: 24, carboidratos: 3, gorduras: 1.5, porcao: "30g", icon: "dumbbell" }
  ],
  carboidratos: [
    { nome: "Arroz integral", calorias: 111, proteinas: 2.6, carboidratos: 23, gorduras: 0.9, porcao: "100g", icon: "rice" },
    { nome: "Arroz branco", calorias: 130, proteinas: 2.7, carboidratos: 28, gorduras: 0.3, porcao: "100g", icon: "rice" },
    { nome: "Pao integral", calorias: 247, proteinas: 13, carboidratos: 41, gorduras: 4.2, porcao: "100g", icon: "bread" },
    { nome: "Aveia", calorias: 389, proteinas: 17, carboidratos: 66, gorduras: 7, porcao: "100g", icon: "wheat" },
    { nome: "Batata doce", calorias: 86, proteinas: 1.6, carboidratos: 20, gorduras: 0.1, porcao: "100g", icon: "potato" },
    { nome: "Macarrao integral", calorias: 124, proteinas: 5, carboidratos: 25, gorduras: 0.5, porcao: "100g", icon: "pasta" },
    { nome: "Tapioca", calorias: 130, proteinas: 0, carboidratos: 32, gorduras: 0, porcao: "30g", icon: "flatbread" },
    { nome: "Feijao", calorias: 77, proteinas: 5, carboidratos: 14, gorduras: 0.5, porcao: "100g", icon: "bean" },
    { nome: "Grao-de-bico", calorias: 164, proteinas: 9, carboidratos: 27, gorduras: 2.6, porcao: "100g", icon: "bean" },
    { nome: "Quinoa", calorias: 120, proteinas: 4.4, carboidratos: 21, gorduras: 1.9, porcao: "100g", icon: "grain" }
  ],
  vegetais: [
    { nome: "Brocolis", calorias: 34, proteinas: 2.8, carboidratos: 7, gorduras: 0.4, porcao: "100g", icon: "broccoli" },
    { nome: "Espinafre", calorias: 23, proteinas: 2.9, carboidratos: 3.6, gorduras: 0.4, porcao: "100g", icon: "leaf" },
    { nome: "Couve", calorias: 27, proteinas: 2.9, carboidratos: 4.4, gorduras: 0.4, porcao: "100g", icon: "leaf" },
    { nome: "Abobrinha", calorias: 17, proteinas: 1.2, carboidratos: 3.1, gorduras: 0.3, porcao: "100g", icon: "zucchini" },
    { nome: "Cenoura", calorias: 41, proteinas: 0.9, carboidratos: 10, gorduras: 0.2, porcao: "100g", icon: "carrot" },
    { nome: "Tomate", calorias: 18, proteinas: 0.9, carboidratos: 3.9, gorduras: 0.2, porcao: "100g", icon: "tomato" },
    { nome: "Pepino", calorias: 15, proteinas: 0.7, carboidratos: 3.6, gorduras: 0.1, porcao: "100g", icon: "cucumber" },
    { nome: "Alface", calorias: 15, proteinas: 1.4, carboidratos: 2.9, gorduras: 0.2, porcao: "100g", icon: "lettuce" },
    { nome: "Berinjela", calorias: 25, proteinas: 1, carboidratos: 6, gorduras: 0.2, porcao: "100g", icon: "eggplant" },
    { nome: "Pimentao", calorias: 26, proteinas: 1, carboidratos: 6, gorduras: 0.3, porcao: "100g", icon: "pepper" }
  ],
  frutas: [
    { nome: "Banana", calorias: 89, proteinas: 1.1, carboidratos: 23, gorduras: 0.3, porcao: "100g", icon: "banana" },
    { nome: "Maca", calorias: 52, proteinas: 0.3, carboidratos: 14, gorduras: 0.2, porcao: "100g", icon: "apple" },
    { nome: "Laranja", calorias: 47, proteinas: 0.9, carboidratos: 12, gorduras: 0.1, porcao: "100g", icon: "orange" },
    { nome: "Morango", calorias: 32, proteinas: 0.7, carboidratos: 7.7, gorduras: 0.3, porcao: "100g", icon: "strawberry" },
    { nome: "Mamao", calorias: 43, proteinas: 0.5, carboidratos: 11, gorduras: 0.3, porcao: "100g", icon: "papaya" },
    { nome: "Melancia", calorias: 30, proteinas: 0.6, carboidratos: 7.6, gorduras: 0.2, porcao: "100g", icon: "watermelon" },
    { nome: "Abacate", calorias: 160, proteinas: 2, carboidratos: 9, gorduras: 15, porcao: "100g", icon: "avocado" },
    { nome: "Uva", calorias: 69, proteinas: 0.7, carboidratos: 18, gorduras: 0.2, porcao: "100g", icon: "grape" },
    { nome: "Manga", calorias: 60, proteinas: 0.8, carboidratos: 15, gorduras: 0.4, porcao: "100g", icon: "mango" },
    { nome: "Kiwi", calorias: 61, proteinas: 1.1, carboidratos: 15, gorduras: 0.5, porcao: "100g", icon: "kiwi" }
  ],
  outros: [
    { nome: "Azeite de oliva", calorias: 884, proteinas: 0, carboidratos: 0, gorduras: 100, porcao: "100ml", icon: "olive" },
    { nome: "Castanhas", calorias: 656, proteinas: 14, carboidratos: 12, gorduras: 66, porcao: "100g", icon: "nut" },
    { nome: "Pasta de amendoim", calorias: 588, proteinas: 25, carboidratos: 20, gorduras: 50, porcao: "100g", icon: "peanut" },
    { nome: "Mel", calorias: 304, proteinas: 0.3, carboidratos: 82, gorduras: 0, porcao: "100g", icon: "honey" },
    { nome: "Chia", calorias: 486, proteinas: 17, carboidratos: 42, gorduras: 31, porcao: "100g", icon: "seed" },
    { nome: "Leite integral", calorias: 61, proteinas: 3.2, carboidratos: 4.8, gorduras: 3.3, porcao: "100ml", icon: "milk" },
    { nome: "Leite desnatado", calorias: 35, proteinas: 3.4, carboidratos: 5, gorduras: 0.1, porcao: "100ml", icon: "milk" },
    { nome: "Granola", calorias: 471, proteinas: 10, carboidratos: 64, gorduras: 20, porcao: "100g", icon: "cereal" }
  ]
}

export interface OpcaoRefeicao {
  id: string
  nome: string
  descricao: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  ingredientes: string[]
  restritivo: boolean
}

export interface TipoRefeicao {
  titulo: string
  horario: string
  importancia: string
  opcoes: OpcaoRefeicao[]
}

export const REFEICOES_COMPLETAS: Record<string, TipoRefeicao> = {
  cafe: {
    titulo: "Cafe da Manha",
    horario: "7h",
    importancia: "Ativa o metabolismo e da energia para o dia",
    opcoes: [
      { id: "c1", nome: "Classico Nutritivo", descricao: "2 fatias pao integral + 2 ovos mexidos + 1 fatia queijo branco + 1 banana", calorias: 420, proteinas: 22, carboidratos: 45, gorduras: 18, ingredientes: ["Pao integral", "Ovos", "Queijo branco", "Banana"], restritivo: false },
      { id: "c2", nome: "Tapioca Fitness", descricao: "Tapioca + 2 col queijo cottage + tomate + oregano + 1 fruta", calorias: 280, proteinas: 15, carboidratos: 38, gorduras: 8, ingredientes: ["Tapioca", "Queijo cottage", "Tomate"], restritivo: false },
      { id: "c3", nome: "Vitamina Power", descricao: "Leite + banana + aveia + mel + chia", calorias: 350, proteinas: 12, carboidratos: 52, gorduras: 10, ingredientes: ["Leite integral", "Banana", "Aveia", "Mel", "Chia"], restritivo: false },
      { id: "c4", nome: "Panqueca Proteica", descricao: "2 panquecas (banana + aveia + ovo) + pasta de amendoim + frutas", calorias: 420, proteinas: 18, carboidratos: 48, gorduras: 16, ingredientes: ["Banana", "Aveia", "Ovos", "Pasta de amendoim"], restritivo: false },
      { id: "c5", nome: "Bowl de Iogurte", descricao: "Iogurte grego + granola + frutas vermelhas + mel + castanhas", calorias: 380, proteinas: 15, carboidratos: 42, gorduras: 14, ingredientes: ["Iogurte grego", "Granola", "Morango", "Mel", "Castanhas"], restritivo: false },
      { id: "c6", nome: "Light Matinal", descricao: "2 ovos cozidos + 1 fatia pao integral + cafe sem acucar", calorias: 220, proteinas: 16, carboidratos: 15, gorduras: 12, ingredientes: ["Ovos", "Pao integral"], restritivo: true },
      { id: "c7", nome: "Iogurte Simples", descricao: "Iogurte desnatado + 2 col aveia + 5 morangos", calorias: 180, proteinas: 12, carboidratos: 24, gorduras: 3, ingredientes: ["Iogurte grego", "Aveia", "Morango"], restritivo: true }
    ]
  },
  lanche_manha: {
    titulo: "Lanche da Manha",
    horario: "10h",
    importancia: "Mantem o metabolismo ativo e evita fome excessiva",
    opcoes: [
      { id: "lm1", nome: "Iogurte + Aveia", descricao: "1 iogurte natural + 2 col aveia + canela", calorias: 180, proteinas: 8, carboidratos: 22, gorduras: 6, ingredientes: ["Iogurte grego", "Aveia"], restritivo: false },
      { id: "lm2", nome: "Fruta + Castanhas", descricao: "1 maca + 4 castanhas-do-para", calorias: 160, proteinas: 4, carboidratos: 18, gorduras: 10, ingredientes: ["Maca", "Castanhas"], restritivo: false },
      { id: "lm3", nome: "Sanduiche Mini", descricao: "1 fatia pao integral + queijo branco + tomate", calorias: 150, proteinas: 8, carboidratos: 16, gorduras: 6, ingredientes: ["Pao integral", "Queijo branco", "Tomate"], restritivo: false },
      { id: "lm4", nome: "Banana + Amendoim", descricao: "1 banana + 1 col pasta de amendoim", calorias: 200, proteinas: 6, carboidratos: 26, gorduras: 9, ingredientes: ["Banana", "Pasta de amendoim"], restritivo: false },
      { id: "lm5", nome: "Fruta Solo", descricao: "1 maca ou 1 pera", calorias: 80, proteinas: 0.5, carboidratos: 20, gorduras: 0.3, ingredientes: ["Maca"], restritivo: true }
    ]
  },
  almoco: {
    titulo: "Almoco",
    horario: "12h30",
    importancia: "Principal refeicao - energia para o resto do dia",
    opcoes: [
      { id: "a1", nome: "Tradicional Brasileiro", descricao: "Arroz + feijao + frango grelhado + salada + legumes refogados", calorias: 580, proteinas: 38, carboidratos: 55, gorduras: 18, ingredientes: ["Arroz integral", "Feijao", "Frango (peito)", "Alface", "Tomate", "Brocolis", "Azeite de oliva"], restritivo: false },
      { id: "a2", nome: "Carne com Legumes", descricao: "Arroz integral + carne magra + abobrinha + cenoura + salada", calorias: 550, proteinas: 35, carboidratos: 48, gorduras: 22, ingredientes: ["Arroz integral", "Carne magra", "Abobrinha", "Cenoura", "Alface"], restritivo: false },
      { id: "a3", nome: "Macarrao Fitness", descricao: "Macarrao integral + molho de tomate caseiro + frango desfiado + salada", calorias: 520, proteinas: 32, carboidratos: 58, gorduras: 14, ingredientes: ["Macarrao integral", "Tomate", "Frango (peito)", "Alface"], restritivo: false },
      { id: "a4", nome: "Peixe Mediterraneo", descricao: "Salmao grelhado + batata doce + brocolis + azeite", calorias: 480, proteinas: 30, carboidratos: 35, gorduras: 22, ingredientes: ["Salmao", "Batata doce", "Brocolis", "Azeite de oliva"], restritivo: false },
      { id: "a5", nome: "Low Carb Basico", descricao: "Frango grelhado + 2 col arroz + salada grande (sem feijao)", calorias: 350, proteinas: 35, carboidratos: 25, gorduras: 12, ingredientes: ["Frango (peito)", "Arroz integral", "Alface", "Tomate", "Pepino"], restritivo: true },
      { id: "a6", nome: "Peixe Light", descricao: "Tilapia grelhada + legumes no vapor + salada", calorias: 280, proteinas: 32, carboidratos: 15, gorduras: 8, ingredientes: ["Tilapia", "Brocolis", "Cenoura", "Alface"], restritivo: true }
    ]
  },
  lanche_tarde: {
    titulo: "Lanche da Tarde",
    horario: "15h30",
    importancia: "Evita chegar com muita fome no jantar",
    opcoes: [
      { id: "lt1", nome: "Vitamina Energetica", descricao: "Leite + banana + aveia + cacau", calorias: 280, proteinas: 10, carboidratos: 38, gorduras: 9, ingredientes: ["Leite integral", "Banana", "Aveia"], restritivo: false },
      { id: "lt2", nome: "Sanduiche Natural", descricao: "Pao integral + peito de peru + queijo branco + alface", calorias: 250, proteinas: 18, carboidratos: 25, gorduras: 8, ingredientes: ["Pao integral", "Peito de peru", "Queijo branco", "Alface"], restritivo: false },
      { id: "lt3", nome: "Smoothie Verde", descricao: "Espinafre + banana + leite + mel", calorias: 180, proteinas: 6, carboidratos: 32, gorduras: 3, ingredientes: ["Espinafre", "Banana", "Leite integral", "Mel"], restritivo: false },
      { id: "lt4", nome: "Iogurte + Chia", descricao: "Iogurte desnatado + 1 col chia + canela", calorias: 120, proteinas: 10, carboidratos: 12, gorduras: 4, ingredientes: ["Iogurte grego", "Chia"], restritivo: true },
      { id: "lt5", nome: "Shake Proteico", descricao: "Whey + leite desnatado + gelo", calorias: 150, proteinas: 28, carboidratos: 8, gorduras: 2, ingredientes: ["Whey protein", "Leite desnatado"], restritivo: true }
    ]
  },
  jantar: {
    titulo: "Jantar",
    horario: "19h",
    importancia: "Refeicao mais leve para boa digestao noturna",
    opcoes: [
      { id: "j1", nome: "Sopa Nutritiva", descricao: "Sopa de legumes com frango desfiado + 1 fatia pao", calorias: 320, proteinas: 25, carboidratos: 32, gorduras: 10, ingredientes: ["Frango (peito)", "Cenoura", "Abobrinha", "Batata doce", "Pao integral"], restritivo: false },
      { id: "j2", nome: "Omelete Recheada", descricao: "Omelete 3 ovos + legumes + queijo + salada + torradas", calorias: 380, proteinas: 24, carboidratos: 20, gorduras: 22, ingredientes: ["Ovos", "Espinafre", "Tomate", "Queijo branco", "Pao integral", "Alface"], restritivo: false },
      { id: "j3", nome: "Salada Caesar Fit", descricao: "Mix folhas + frango grelhado + croutons integrais + parmesao", calorias: 350, proteinas: 30, carboidratos: 18, gorduras: 18, ingredientes: ["Alface", "Frango (peito)", "Pao integral", "Queijo branco"], restritivo: false },
      { id: "j4", nome: "Peixe com Legumes", descricao: "Tilapia assada + legumes grelhados + azeite", calorias: 280, proteinas: 28, carboidratos: 15, gorduras: 12, ingredientes: ["Tilapia", "Abobrinha", "Berinjela", "Pimentao", "Azeite de oliva"], restritivo: false },
      { id: "j5", nome: "Sopa Detox", descricao: "Sopa de legumes (sem batata/macarrao) com frango", calorias: 180, proteinas: 22, carboidratos: 12, gorduras: 5, ingredientes: ["Frango (peito)", "Abobrinha", "Cenoura", "Couve"], restritivo: true },
      { id: "j6", nome: "Salada Proteica", descricao: "Mix folhas + frango + ovo cozido + azeite", calorias: 250, proteinas: 28, carboidratos: 8, gorduras: 12, ingredientes: ["Alface", "Espinafre", "Frango (peito)", "Ovos", "Azeite de oliva"], restritivo: true }
    ]
  },
  ceia: {
    titulo: "Ceia",
    horario: "21h",
    importancia: "Opcional - apenas se sentir fome antes de dormir",
    opcoes: [
      { id: "ce1", nome: "Leite Dourado", descricao: "Leite morno + curcuma + canela + mel", calorias: 140, proteinas: 4, carboidratos: 18, gorduras: 4, ingredientes: ["Leite integral", "Mel"], restritivo: false },
      { id: "ce2", nome: "Iogurte Noturno", descricao: "Iogurte natural + gotas de mel", calorias: 120, proteinas: 6, carboidratos: 14, gorduras: 5, ingredientes: ["Iogurte grego", "Mel"], restritivo: false },
      { id: "ce3", nome: "Fruta Leve", descricao: "1 maca ou 1 pera", calorias: 80, proteinas: 0.5, carboidratos: 20, gorduras: 0.2, ingredientes: ["Maca"], restritivo: false },
      { id: "ce4", nome: "Cha Puro", descricao: "Cha de camomila ou erva-doce", calorias: 5, proteinas: 0, carboidratos: 1, gorduras: 0, ingredientes: [], restritivo: true },
      { id: "ce5", nome: "Gelatina Diet", descricao: "1 taca de gelatina diet", calorias: 20, proteinas: 2, carboidratos: 2, gorduras: 0, ingredientes: [], restritivo: true }
    ]
  }
}

export interface Exercicio {
  nome: string
  series: number
  reps: string
  tempo: string
  dica: string
}

export interface Treino {
  nome: string
  duracao: string
  foco: string
  exercicios: Exercicio[]
}

export interface FaseTreino {
  nome: string
  semanas: string
  descricao: string
  frequencia: string
  treinos: Record<string, Treino>
}

export const TREINOS_COMPLETOS: Record<string, FaseTreino> = {
  fase1: {
    nome: "Fase 1 - Adaptacao",
    semanas: "1-4",
    descricao: "Foco em recondicionar o corpo de forma suave",
    frequencia: "3-4x por semana",
    treinos: {
      treinoA: {
        nome: "Treino A - Inferior",
        duracao: "20-25 min",
        foco: "Gluteos, pernas e core",
        exercicios: [
          { nome: "Agachamento livre", series: 3, reps: "12", tempo: "60s", dica: "Pes na largura dos ombros, descer devagar" },
          { nome: "Elevacao de quadril", series: 3, reps: "15", tempo: "45s", dica: "Contrair gluteo no topo por 2 segundos" },
          { nome: "Afundo estatico", series: 2, reps: "10 cada", tempo: "45s", dica: "Manter joelho alinhado com o pe" },
          { nome: "Abducao deitada", series: 3, reps: "15 cada", tempo: "30s", dica: "Movimento controlado, nao usar impulso" },
          { nome: "Prancha", series: 3, reps: "20-30s", tempo: "30s", dica: "Corpo reto, abdomen bem contraido" }
        ]
      },
      treinoB: {
        nome: "Treino B - Superior + Core",
        duracao: "20-25 min",
        foco: "Bracos, costas e abdomen",
        exercicios: [
          { nome: "Flexao no joelho", series: 3, reps: "8-10", tempo: "60s", dica: "Descer ate o peito quase tocar o chao" },
          { nome: "Remada com garrafa", series: 3, reps: "12 cada", tempo: "45s", dica: "Usar garrafa de 2L, puxar ate a cintura" },
          { nome: "Triceps no banco", series: 3, reps: "10", tempo: "45s", dica: "Cotovelos apontando para tras" },
          { nome: "Prancha lateral", series: 2, reps: "15-20s cada", tempo: "30s", dica: "Quadril alto, corpo alinhado" },
          { nome: "Abdominal crunch", series: 3, reps: "15", tempo: "30s", dica: "Nao puxar a cabeca, olhar para o teto" }
        ]
      },
      cardio: {
        nome: "Cardio Leve",
        duracao: "20-30 min",
        foco: "Condicionamento cardiovascular",
        exercicios: [
          { nome: "Caminhada", series: 1, reps: "20-30 min", tempo: "-", dica: "Ritmo de conversa, pode levar bebe" }
        ]
      }
    }
  },
  fase2: {
    nome: "Fase 2 - Progressao",
    semanas: "5-8",
    descricao: "Aumentar intensidade gradualmente",
    frequencia: "4-5x por semana",
    treinos: {
      treinoC: {
        nome: "Treino C - Pernas Intenso",
        duracao: "25-30 min",
        foco: "Gluteos e posteriores",
        exercicios: [
          { nome: "Agachamento sumo", series: 3, reps: "15", tempo: "60s", dica: "Pes bem afastados, pontas para fora" },
          { nome: "Stiff", series: 3, reps: "12", tempo: "60s", dica: "Pernas semi-flexionadas, sentir posterior" },
          { nome: "Afundo bulgaro", series: 3, reps: "10 cada", tempo: "60s", dica: "Pe de tras em cadeira ou sofa" },
          { nome: "Gluteo 4 apoios", series: 3, reps: "15 cada", tempo: "45s", dica: "Elevar perna flexionada, contrair no topo" },
          { nome: "Ponte elevada", series: 3, reps: "15", tempo: "45s", dica: "Pes em superficie elevada" },
          { nome: "Panturrilha", series: 3, reps: "20", tempo: "30s", dica: "Lento e controlado" }
        ]
      },
      treinoD: {
        nome: "Treino D - Superior Completo",
        duracao: "25-30 min",
        foco: "Bracos, costas e ombros",
        exercicios: [
          { nome: "Flexao inclinada", series: 3, reps: "10-12", tempo: "60s", dica: "Maos no sofa para facilitar" },
          { nome: "Remada curvada", series: 3, reps: "12", tempo: "60s", dica: "Usar galao de agua ou mochila" },
          { nome: "Elevacao lateral", series: 3, reps: "12", tempo: "45s", dica: "Garrafas como peso" },
          { nome: "Triceps frances", series: 3, reps: "12", tempo: "45s", dica: "Garrafa atras da cabeca" },
          { nome: "Rosca biceps", series: 3, reps: "12", tempo: "45s", dica: "Galao ou garrafas" },
          { nome: "Prancha com elevacao", series: 3, reps: "10 cada", tempo: "45s", dica: "Alternar elevacao de bracos" }
        ]
      },
      treinoE: {
        nome: "Treino E - Core + HIIT",
        duracao: "25 min",
        foco: "Abdomen e queima calorica",
        exercicios: [
          { nome: "Abdominal bicicleta", series: 3, reps: "20 total", tempo: "45s", dica: "Cotovelo toca joelho oposto" },
          { nome: "Prancha", series: 3, reps: "40-45s", tempo: "30s", dica: "Desafio: aguentar mais!" },
          { nome: "Mountain climber", series: 3, reps: "20 total", tempo: "45s", dica: "Joelhos alternados ao peito" },
          { nome: "Abdominal infra", series: 3, reps: "15", tempo: "45s", dica: "Elevar quadril do chao" },
          { nome: "Burpee modificado", series: 3, reps: "8", tempo: "60s", dica: "Sem salto se necessario" }
        ]
      }
    }
  },
  fase3: {
    nome: "Fase 3 - Intensificacao",
    semanas: "9-12",
    descricao: "Treinos mais desafiadores para resultados",
    frequencia: "5-6x por semana",
    treinos: {
      treinoF: {
        nome: "Treino F - Pernas Power",
        duracao: "35-40 min",
        foco: "Gluteos, quadriceps e posteriores",
        exercicios: [
          { nome: "Agachamento sumo", series: 4, reps: "15", tempo: "60s", dica: "Pode adicionar peso (mochila)" },
          { nome: "Afundo bulgaro", series: 3, reps: "12 cada", tempo: "60s", dica: "Ir mais fundo" },
          { nome: "Stiff unilateral", series: 3, reps: "10 cada", tempo: "60s", dica: "Uma perna de cada vez" },
          { nome: "Agachamento + salto", series: 3, reps: "10", tempo: "60s", dica: "Salto suave ao subir" },
          { nome: "Gluteo 4 apoios + peso", series: 3, reps: "20 cada", tempo: "45s", dica: "Caneleira ou garrafa" },
          { nome: "Ponte com peso", series: 3, reps: "15", tempo: "45s", dica: "Peso no quadril" }
        ]
      },
      treinoG: {
        nome: "Treino G - Superior Avancado",
        duracao: "35-40 min",
        foco: "Bracos, costas, peito e ombros",
        exercicios: [
          { nome: "Flexao completa", series: 3, reps: "12-15", tempo: "60s", dica: "Se conseguir, otimo!" },
          { nome: "Remada concentrada", series: 3, reps: "12 cada", tempo: "60s", dica: "Foco na contracao" },
          { nome: "Pike push-up", series: 3, reps: "8-10", tempo: "60s", dica: "Ombros, quadril alto" },
          { nome: "Triceps no banco", series: 3, reps: "15", tempo: "45s", dica: "Descer bem" },
          { nome: "Rosca martelo", series: 3, reps: "12", tempo: "45s", dica: "Galoes ou pesos" },
          { nome: "Superman", series: 3, reps: "15", tempo: "45s", dica: "Elevar bracos e pernas" }
        ]
      },
      treinoH: {
        nome: "Treino H - HIIT Full Body",
        duracao: "30 min",
        foco: "Queima maxima de calorias",
        exercicios: [
          { nome: "Jumping jacks", series: 3, reps: "30s", tempo: "15s", dica: "Ritmo acelerado" },
          { nome: "Agachamento + salto", series: 3, reps: "30s", tempo: "15s", dica: "Explosao!" },
          { nome: "Mountain climber", series: 3, reps: "30s", tempo: "15s", dica: "O mais rapido possivel" },
          { nome: "Burpee", series: 3, reps: "30s", tempo: "15s", dica: "Modificado se precisar" },
          { nome: "Prancha + toque ombro", series: 3, reps: "30s", tempo: "15s", dica: "Alternar toques" },
          { nome: "High knees", series: 3, reps: "30s", tempo: "15s", dica: "Joelhos bem alto" }
        ]
      }
    }
  }
}
