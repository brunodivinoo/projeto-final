// Dados estaticos do NutriVida - App de Nutricao para Mulheres

export const MENSAGENS_MOTIVACIONAIS = [
  "Voce esta fazendo um trabalho incrivel!",
  "Cada pequeno passo conta. Continue assim!",
  "Seja gentil com seu corpo, ele faz tanto por voce!",
  "Hoje e um novo dia cheio de possibilidades!",
  "Voce e mais forte do que imagina!",
  "Progresso, nao perfeicao!",
  "Seu corpo merece cuidado e carinho!",
  "Descanse quando precisar. Voce merece!",
  "Celebre cada vitoria, por menor que seja!",
  "Voce esta no caminho certo!",
  "Lembre-se: isso e uma maratona, nao uma corrida!",
  "Seu esforco vai valer a pena!",
  "A mudanca comeca de dentro para fora!",
  "Acredite no seu potencial!",
  "Cuide de voce como cuidaria de quem ama!",
  "Seu bem-estar e prioridade!",
  "Pequenas escolhas diarias fazem grandes diferencas!",
  "Voce ja deu o primeiro passo, isso e incrivel!"
]

export const DICAS_DIARIAS = [
  { icon: "water", texto: "Beba um copo de agua assim que acordar" },
  { icon: "egg", texto: "Nunca pule o cafe da manha" },
  { icon: "salad", texto: "Metade do prato deve ser vegetais" },
  { icon: "walk", texto: "10 minutos de caminhada ja fazem diferenca" },
  { icon: "sleep", texto: "Tente dormir pelo menos 7 horas" },
  { icon: "fruit", texto: "Tenha frutas lavadas e prontas na geladeira" },
  { icon: "phone", texto: "Cada vez que pegar o celular, beba agua" },
  { icon: "stretch", texto: "5 minutos de alongamento aliviam tensoes" },
  { icon: "tea", texto: "Substitua refrigerante por cha ou agua com limao" },
  { icon: "protein", texto: "Inclua proteina em todas as refeicoes" },
  { icon: "fiber", texto: "Fibras ajudam na saciedade - inclua mais vegetais" },
  { icon: "mindful", texto: "Coma devagar e aprecie sua refeicao" }
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
  { id: "omega3", nome: "Omega 3", descricao: "Saude cardiovascular e cerebral", dose: "1000mg/dia", horario: "Com refeicao", essencial: true, icon: "fish" },
  { id: "vitd", nome: "Vitamina D", descricao: "Ossos e imunidade", dose: "2000 UI/dia", horario: "Manha", essencial: true, icon: "sun" },
  { id: "ferro", nome: "Ferro", descricao: "Previne anemia", dose: "18mg/dia", horario: "Jejum", essencial: true, icon: "strength" },
  { id: "calcio", nome: "Calcio", descricao: "Saude ossea", dose: "1000mg/dia", horario: "Dividir em 2x", essencial: true, icon: "bone" },
  { id: "b12", nome: "Vitamina B12", descricao: "Energia e sistema nervoso", dose: "2.4mcg/dia", horario: "Manha", essencial: false, icon: "zap" },
  { id: "colageno", nome: "Colageno", descricao: "Pele, cabelos e articulacoes", dose: "10g/dia", horario: "Manha ou noite", essencial: false, icon: "sparkle" },
  { id: "probiotico", nome: "Probiotico", descricao: "Saude intestinal", dose: "1 capsula/dia", horario: "Jejum", essencial: false, icon: "gut" },
  { id: "magnesio", nome: "Magnesio", descricao: "Relaxamento e sono", dose: "400mg/dia", horario: "Noite", essencial: false, icon: "moon" },
  { id: "biotina", nome: "Biotina", descricao: "Cabelos e unhas fortes", dose: "30mcg/dia", horario: "Manha", essencial: false, icon: "hair" },
  { id: "zinco", nome: "Zinco", descricao: "Imunidade e pele", dose: "8mg/dia", horario: "Com refeicao", essencial: false, icon: "shield" }
]

export interface Alimento {
  nome: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  porcao: string
  icon: string
  unidade?: string
  quantidade_compra?: string
}

export const ALIMENTOS_DATABASE: Record<string, Alimento[]> = {
  proteinas: [
    { nome: "Frango (peito)", calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6, porcao: "100g", icon: "drumstick", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Frango (coxa)", calorias: 209, proteinas: 26, carboidratos: 0, gorduras: 11, porcao: "100g", icon: "drumstick", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Frango (asa)", calorias: 203, proteinas: 30, carboidratos: 0, gorduras: 8, porcao: "100g", icon: "drumstick", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Ovos", calorias: 155, proteinas: 13, carboidratos: 1.1, gorduras: 11, porcao: "2 unid", icon: "egg", unidade: "duzia", quantidade_compra: "1 duzia" },
    { nome: "Salmao", calorias: 208, proteinas: 20, carboidratos: 0, gorduras: 13, porcao: "100g", icon: "fish", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Carne magra (patinho)", calorias: 219, proteinas: 35, carboidratos: 0, gorduras: 8, porcao: "100g", icon: "beef", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Carne magra (acem)", calorias: 250, proteinas: 26, carboidratos: 0, gorduras: 15, porcao: "100g", icon: "beef", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Carne moida magra", calorias: 212, proteinas: 26, carboidratos: 0, gorduras: 12, porcao: "100g", icon: "beef", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Alcatra", calorias: 230, proteinas: 30, carboidratos: 0, gorduras: 12, porcao: "100g", icon: "beef", unidade: "kg", quantidade_compra: "500g" },
    { nome: "File mignon", calorias: 194, proteinas: 29, carboidratos: 0, gorduras: 8, porcao: "100g", icon: "beef", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Costela bovina", calorias: 304, proteinas: 24, carboidratos: 0, gorduras: 23, porcao: "100g", icon: "beef", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Tilapia", calorias: 96, proteinas: 20, carboidratos: 0, gorduras: 1.7, porcao: "100g", icon: "fish", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Bacalhau", calorias: 136, proteinas: 29, carboidratos: 0, gorduras: 1.2, porcao: "100g", icon: "fish", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Sardinha", calorias: 208, proteinas: 25, carboidratos: 0, gorduras: 11, porcao: "100g", icon: "fish", unidade: "lata", quantidade_compra: "2 latas" },
    { nome: "Atum em agua", calorias: 116, proteinas: 26, carboidratos: 0, gorduras: 0.8, porcao: "100g", icon: "fish", unidade: "lata", quantidade_compra: "2 latas" },
    { nome: "Camarao", calorias: 99, proteinas: 24, carboidratos: 0.2, gorduras: 0.3, porcao: "100g", icon: "shrimp", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Peito de peru", calorias: 104, proteinas: 17, carboidratos: 4.2, gorduras: 1.7, porcao: "100g", icon: "turkey", unidade: "g", quantidade_compra: "200g" },
    { nome: "Presunto magro", calorias: 107, proteinas: 18, carboidratos: 1, gorduras: 3, porcao: "100g", icon: "meat", unidade: "g", quantidade_compra: "200g" },
    { nome: "Linguica de frango", calorias: 165, proteinas: 18, carboidratos: 2, gorduras: 9, porcao: "100g", icon: "sausage", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Carne de porco (lombo)", calorias: 143, proteinas: 27, carboidratos: 0, gorduras: 3, porcao: "100g", icon: "pork", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Queijo cottage", calorias: 98, proteinas: 11, carboidratos: 3.4, gorduras: 4.3, porcao: "100g", icon: "cheese", unidade: "g", quantidade_compra: "400g" },
    { nome: "Queijo branco (minas)", calorias: 264, proteinas: 17, carboidratos: 3, gorduras: 21, porcao: "100g", icon: "cheese", unidade: "g", quantidade_compra: "500g" },
    { nome: "Queijo mussarela", calorias: 280, proteinas: 28, carboidratos: 2, gorduras: 17, porcao: "100g", icon: "cheese", unidade: "g", quantidade_compra: "400g" },
    { nome: "Queijo prato", calorias: 360, proteinas: 23, carboidratos: 2, gorduras: 29, porcao: "100g", icon: "cheese", unidade: "g", quantidade_compra: "300g" },
    { nome: "Ricota", calorias: 140, proteinas: 12, carboidratos: 3, gorduras: 9, porcao: "100g", icon: "cheese", unidade: "g", quantidade_compra: "500g" },
    { nome: "Iogurte grego", calorias: 97, proteinas: 9, carboidratos: 3.6, gorduras: 5, porcao: "100g", icon: "milk", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Iogurte natural", calorias: 61, proteinas: 3.5, carboidratos: 4.7, gorduras: 3.3, porcao: "100g", icon: "milk", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Whey protein", calorias: 120, proteinas: 24, carboidratos: 3, gorduras: 1.5, porcao: "30g", icon: "dumbbell", unidade: "kg", quantidade_compra: "900g" },
    { nome: "Tofu", calorias: 76, proteinas: 8, carboidratos: 1.9, gorduras: 4.8, porcao: "100g", icon: "tofu", unidade: "g", quantidade_compra: "400g" },
    { nome: "Tempeh", calorias: 193, proteinas: 19, carboidratos: 9, gorduras: 11, porcao: "100g", icon: "tofu", unidade: "g", quantidade_compra: "400g" }
  ],
  carboidratos: [
    { nome: "Arroz integral", calorias: 111, proteinas: 2.6, carboidratos: 23, gorduras: 0.9, porcao: "100g", icon: "rice", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Arroz branco", calorias: 130, proteinas: 2.7, carboidratos: 28, gorduras: 0.3, porcao: "100g", icon: "rice", unidade: "kg", quantidade_compra: "5kg" },
    { nome: "Arroz parboilizado", calorias: 123, proteinas: 2.5, carboidratos: 27, gorduras: 0.3, porcao: "100g", icon: "rice", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Arroz negro", calorias: 101, proteinas: 3, carboidratos: 21, gorduras: 0.6, porcao: "100g", icon: "rice", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Pao integral", calorias: 247, proteinas: 13, carboidratos: 41, gorduras: 4.2, porcao: "100g", icon: "bread", unidade: "unid", quantidade_compra: "1 pacote" },
    { nome: "Pao frances", calorias: 300, proteinas: 8, carboidratos: 58, gorduras: 3.1, porcao: "100g", icon: "bread", unidade: "unid", quantidade_compra: "10 unid" },
    { nome: "Pao de forma", calorias: 274, proteinas: 9, carboidratos: 50, gorduras: 4, porcao: "100g", icon: "bread", unidade: "unid", quantidade_compra: "1 pacote" },
    { nome: "Pao australiano", calorias: 260, proteinas: 8, carboidratos: 48, gorduras: 4, porcao: "100g", icon: "bread", unidade: "unid", quantidade_compra: "1 pacote" },
    { nome: "Aveia", calorias: 389, proteinas: 17, carboidratos: 66, gorduras: 7, porcao: "100g", icon: "wheat", unidade: "g", quantidade_compra: "500g" },
    { nome: "Aveia em flocos", calorias: 394, proteinas: 14, carboidratos: 67, gorduras: 7, porcao: "100g", icon: "wheat", unidade: "g", quantidade_compra: "500g" },
    { nome: "Batata doce", calorias: 86, proteinas: 1.6, carboidratos: 20, gorduras: 0.1, porcao: "100g", icon: "potato", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Batata inglesa", calorias: 77, proteinas: 2, carboidratos: 17, gorduras: 0.1, porcao: "100g", icon: "potato", unidade: "kg", quantidade_compra: "2kg" },
    { nome: "Batata baroa (mandioquinha)", calorias: 75, proteinas: 0.9, carboidratos: 18, gorduras: 0.2, porcao: "100g", icon: "potato", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Mandioca (aipim)", calorias: 125, proteinas: 1, carboidratos: 30, gorduras: 0.3, porcao: "100g", icon: "potato", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Inhame", calorias: 97, proteinas: 2, carboidratos: 23, gorduras: 0.1, porcao: "100g", icon: "potato", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Cara", calorias: 95, proteinas: 2, carboidratos: 22, gorduras: 0.1, porcao: "100g", icon: "potato", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Macarrao integral", calorias: 124, proteinas: 5, carboidratos: 25, gorduras: 0.5, porcao: "100g", icon: "pasta", unidade: "g", quantidade_compra: "500g" },
    { nome: "Macarrao comum", calorias: 131, proteinas: 5, carboidratos: 27, gorduras: 0.6, porcao: "100g", icon: "pasta", unidade: "g", quantidade_compra: "500g" },
    { nome: "Macarrao de arroz", calorias: 109, proteinas: 0.9, carboidratos: 25, gorduras: 0.2, porcao: "100g", icon: "pasta", unidade: "g", quantidade_compra: "400g" },
    { nome: "Tapioca", calorias: 130, proteinas: 0, carboidratos: 32, gorduras: 0, porcao: "30g", icon: "flatbread", unidade: "g", quantidade_compra: "500g" },
    { nome: "Cuscuz", calorias: 112, proteinas: 4, carboidratos: 23, gorduras: 0.2, porcao: "100g", icon: "grain", unidade: "g", quantidade_compra: "500g" },
    { nome: "Feijao carioca", calorias: 77, proteinas: 5, carboidratos: 14, gorduras: 0.5, porcao: "100g", icon: "bean", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Feijao preto", calorias: 77, proteinas: 4.5, carboidratos: 14, gorduras: 0.5, porcao: "100g", icon: "bean", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Feijao branco", calorias: 67, proteinas: 4.9, carboidratos: 12, gorduras: 0.4, porcao: "100g", icon: "bean", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Lentilha", calorias: 116, proteinas: 9, carboidratos: 20, gorduras: 0.4, porcao: "100g", icon: "bean", unidade: "g", quantidade_compra: "500g" },
    { nome: "Grao-de-bico", calorias: 164, proteinas: 9, carboidratos: 27, gorduras: 2.6, porcao: "100g", icon: "bean", unidade: "g", quantidade_compra: "500g" },
    { nome: "Ervilha", calorias: 81, proteinas: 5, carboidratos: 14, gorduras: 0.4, porcao: "100g", icon: "bean", unidade: "lata", quantidade_compra: "2 latas" },
    { nome: "Quinoa", calorias: 120, proteinas: 4.4, carboidratos: 21, gorduras: 1.9, porcao: "100g", icon: "grain", unidade: "g", quantidade_compra: "500g" },
    { nome: "Amaranto", calorias: 102, proteinas: 4, carboidratos: 19, gorduras: 1.6, porcao: "100g", icon: "grain", unidade: "g", quantidade_compra: "300g" },
    { nome: "Milho", calorias: 86, proteinas: 3, carboidratos: 19, gorduras: 1.2, porcao: "100g", icon: "corn", unidade: "unid", quantidade_compra: "6 espigas" },
    { nome: "Pipoca (milho)", calorias: 375, proteinas: 11, carboidratos: 78, gorduras: 4, porcao: "100g", icon: "corn", unidade: "g", quantidade_compra: "500g" },
    { nome: "Farinha de trigo", calorias: 360, proteinas: 10, carboidratos: 75, gorduras: 1, porcao: "100g", icon: "wheat", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Farinha de aveia", calorias: 395, proteinas: 14, carboidratos: 68, gorduras: 7, porcao: "100g", icon: "wheat", unidade: "g", quantidade_compra: "500g" },
    { nome: "Farinha de amendoas", calorias: 575, proteinas: 21, carboidratos: 20, gorduras: 50, porcao: "100g", icon: "nut", unidade: "g", quantidade_compra: "300g" }
  ],
  vegetais: [
    { nome: "Brocolis", calorias: 34, proteinas: 2.8, carboidratos: 7, gorduras: 0.4, porcao: "100g", icon: "broccoli", unidade: "maco", quantidade_compra: "2 macos" },
    { nome: "Couve-flor", calorias: 25, proteinas: 2, carboidratos: 5, gorduras: 0.3, porcao: "100g", icon: "broccoli", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Espinafre", calorias: 23, proteinas: 2.9, carboidratos: 3.6, gorduras: 0.4, porcao: "100g", icon: "leaf", unidade: "maco", quantidade_compra: "2 macos" },
    { nome: "Couve", calorias: 27, proteinas: 2.9, carboidratos: 4.4, gorduras: 0.4, porcao: "100g", icon: "leaf", unidade: "maco", quantidade_compra: "2 macos" },
    { nome: "Couve de bruxelas", calorias: 43, proteinas: 3.4, carboidratos: 9, gorduras: 0.3, porcao: "100g", icon: "leaf", unidade: "g", quantidade_compra: "300g" },
    { nome: "Rucula", calorias: 25, proteinas: 2.6, carboidratos: 3.7, gorduras: 0.7, porcao: "100g", icon: "leaf", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Agriao", calorias: 11, proteinas: 2.3, carboidratos: 1.3, gorduras: 0.1, porcao: "100g", icon: "leaf", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Acelga", calorias: 19, proteinas: 1.8, carboidratos: 3.7, gorduras: 0.2, porcao: "100g", icon: "leaf", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Abobrinha", calorias: 17, proteinas: 1.2, carboidratos: 3.1, gorduras: 0.3, porcao: "100g", icon: "zucchini", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Abobora", calorias: 26, proteinas: 1, carboidratos: 6.5, gorduras: 0.1, porcao: "100g", icon: "pumpkin", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Abobora cabotia", calorias: 40, proteinas: 1.4, carboidratos: 9, gorduras: 0.1, porcao: "100g", icon: "pumpkin", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Cenoura", calorias: 41, proteinas: 0.9, carboidratos: 10, gorduras: 0.2, porcao: "100g", icon: "carrot", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Beterraba", calorias: 43, proteinas: 1.6, carboidratos: 10, gorduras: 0.2, porcao: "100g", icon: "beet", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Tomate", calorias: 18, proteinas: 0.9, carboidratos: 3.9, gorduras: 0.2, porcao: "100g", icon: "tomato", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Tomate cereja", calorias: 18, proteinas: 0.9, carboidratos: 3.9, gorduras: 0.2, porcao: "100g", icon: "tomato", unidade: "bandeja", quantidade_compra: "1 bandeja" },
    { nome: "Pepino", calorias: 15, proteinas: 0.7, carboidratos: 3.6, gorduras: 0.1, porcao: "100g", icon: "cucumber", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Alface americana", calorias: 15, proteinas: 1.4, carboidratos: 2.9, gorduras: 0.2, porcao: "100g", icon: "lettuce", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Alface crespa", calorias: 15, proteinas: 1.3, carboidratos: 2.9, gorduras: 0.2, porcao: "100g", icon: "lettuce", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Alface roxa", calorias: 16, proteinas: 1.3, carboidratos: 3.3, gorduras: 0.2, porcao: "100g", icon: "lettuce", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Berinjela", calorias: 25, proteinas: 1, carboidratos: 6, gorduras: 0.2, porcao: "100g", icon: "eggplant", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Pimentao verde", calorias: 26, proteinas: 1, carboidratos: 6, gorduras: 0.3, porcao: "100g", icon: "pepper", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Pimentao vermelho", calorias: 31, proteinas: 1, carboidratos: 6, gorduras: 0.3, porcao: "100g", icon: "pepper", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Pimentao amarelo", calorias: 27, proteinas: 1, carboidratos: 6.3, gorduras: 0.2, porcao: "100g", icon: "pepper", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Cebola", calorias: 40, proteinas: 1.1, carboidratos: 9.3, gorduras: 0.1, porcao: "100g", icon: "onion", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Cebola roxa", calorias: 40, proteinas: 1.1, carboidratos: 9.3, gorduras: 0.1, porcao: "100g", icon: "onion", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Alho", calorias: 149, proteinas: 6.4, carboidratos: 33, gorduras: 0.5, porcao: "100g", icon: "garlic", unidade: "cabeca", quantidade_compra: "1 cabeca" },
    { nome: "Gengibre", calorias: 80, proteinas: 1.8, carboidratos: 18, gorduras: 0.8, porcao: "100g", icon: "ginger", unidade: "g", quantidade_compra: "100g" },
    { nome: "Repolho verde", calorias: 25, proteinas: 1.3, carboidratos: 6, gorduras: 0.1, porcao: "100g", icon: "cabbage", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Repolho roxo", calorias: 31, proteinas: 1.4, carboidratos: 7, gorduras: 0.2, porcao: "100g", icon: "cabbage", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Chuchu", calorias: 19, proteinas: 0.8, carboidratos: 4.3, gorduras: 0.1, porcao: "100g", icon: "vegetable", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Vagem", calorias: 31, proteinas: 1.8, carboidratos: 7, gorduras: 0.1, porcao: "100g", icon: "bean", unidade: "g", quantidade_compra: "300g" },
    { nome: "Quiabo", calorias: 33, proteinas: 1.9, carboidratos: 7, gorduras: 0.2, porcao: "100g", icon: "vegetable", unidade: "g", quantidade_compra: "300g" },
    { nome: "Aspargos", calorias: 20, proteinas: 2.2, carboidratos: 3.9, gorduras: 0.1, porcao: "100g", icon: "asparagus", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Palmito", calorias: 26, proteinas: 2.5, carboidratos: 5, gorduras: 0.4, porcao: "100g", icon: "vegetable", unidade: "vidro", quantidade_compra: "1 vidro" },
    { nome: "Champignon", calorias: 22, proteinas: 3.1, carboidratos: 3.3, gorduras: 0.3, porcao: "100g", icon: "mushroom", unidade: "bandeja", quantidade_compra: "200g" },
    { nome: "Shimeji", calorias: 33, proteinas: 2.2, carboidratos: 6.8, gorduras: 0.2, porcao: "100g", icon: "mushroom", unidade: "bandeja", quantidade_compra: "200g" },
    { nome: "Shitake", calorias: 34, proteinas: 2.2, carboidratos: 7, gorduras: 0.5, porcao: "100g", icon: "mushroom", unidade: "bandeja", quantidade_compra: "200g" },
    { nome: "Rabanete", calorias: 16, proteinas: 0.7, carboidratos: 3.4, gorduras: 0.1, porcao: "100g", icon: "radish", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Nabo", calorias: 28, proteinas: 0.9, carboidratos: 6.4, gorduras: 0.1, porcao: "100g", icon: "vegetable", unidade: "unid", quantidade_compra: "3 unid" },
    { nome: "Aipo (salsa)", calorias: 16, proteinas: 0.7, carboidratos: 3, gorduras: 0.2, porcao: "100g", icon: "celery", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Alho-poro", calorias: 61, proteinas: 1.5, carboidratos: 14, gorduras: 0.3, porcao: "100g", icon: "vegetable", unidade: "unid", quantidade_compra: "2 unid" }
  ],
  frutas: [
    { nome: "Banana", calorias: 89, proteinas: 1.1, carboidratos: 23, gorduras: 0.3, porcao: "100g", icon: "banana", unidade: "kg", quantidade_compra: "1kg (penca)" },
    { nome: "Banana prata", calorias: 98, proteinas: 1.3, carboidratos: 26, gorduras: 0.1, porcao: "100g", icon: "banana", unidade: "kg", quantidade_compra: "1kg (penca)" },
    { nome: "Maca", calorias: 52, proteinas: 0.3, carboidratos: 14, gorduras: 0.2, porcao: "100g", icon: "apple", unidade: "unid", quantidade_compra: "6 unid" },
    { nome: "Maca verde", calorias: 58, proteinas: 0.3, carboidratos: 15, gorduras: 0.2, porcao: "100g", icon: "apple", unidade: "unid", quantidade_compra: "6 unid" },
    { nome: "Pera", calorias: 57, proteinas: 0.4, carboidratos: 15, gorduras: 0.1, porcao: "100g", icon: "pear", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Laranja", calorias: 47, proteinas: 0.9, carboidratos: 12, gorduras: 0.1, porcao: "100g", icon: "orange", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Tangerina (mexerica)", calorias: 53, proteinas: 0.8, carboidratos: 13, gorduras: 0.3, porcao: "100g", icon: "orange", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Limao", calorias: 29, proteinas: 1.1, carboidratos: 9, gorduras: 0.3, porcao: "100g", icon: "lemon", unidade: "unid", quantidade_compra: "6 unid" },
    { nome: "Morango", calorias: 32, proteinas: 0.7, carboidratos: 7.7, gorduras: 0.3, porcao: "100g", icon: "strawberry", unidade: "bandeja", quantidade_compra: "1 bandeja (300g)" },
    { nome: "Amora", calorias: 43, proteinas: 1.4, carboidratos: 10, gorduras: 0.5, porcao: "100g", icon: "berry", unidade: "bandeja", quantidade_compra: "1 bandeja (150g)" },
    { nome: "Framboesa", calorias: 52, proteinas: 1.2, carboidratos: 12, gorduras: 0.7, porcao: "100g", icon: "berry", unidade: "bandeja", quantidade_compra: "1 bandeja (150g)" },
    { nome: "Mirtilo (blueberry)", calorias: 57, proteinas: 0.7, carboidratos: 14, gorduras: 0.3, porcao: "100g", icon: "berry", unidade: "bandeja", quantidade_compra: "1 bandeja (150g)" },
    { nome: "Mamao", calorias: 43, proteinas: 0.5, carboidratos: 11, gorduras: 0.3, porcao: "100g", icon: "papaya", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Mamao formosa", calorias: 45, proteinas: 0.5, carboidratos: 11, gorduras: 0.1, porcao: "100g", icon: "papaya", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Melancia", calorias: 30, proteinas: 0.6, carboidratos: 7.6, gorduras: 0.2, porcao: "100g", icon: "watermelon", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Melao", calorias: 34, proteinas: 0.8, carboidratos: 8, gorduras: 0.2, porcao: "100g", icon: "melon", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Abacate", calorias: 160, proteinas: 2, carboidratos: 9, gorduras: 15, porcao: "100g", icon: "avocado", unidade: "unid", quantidade_compra: "2 unid" },
    { nome: "Uva", calorias: 69, proteinas: 0.7, carboidratos: 18, gorduras: 0.2, porcao: "100g", icon: "grape", unidade: "kg", quantidade_compra: "500g" },
    { nome: "Uva passa", calorias: 299, proteinas: 3.1, carboidratos: 79, gorduras: 0.5, porcao: "100g", icon: "grape", unidade: "g", quantidade_compra: "200g" },
    { nome: "Manga", calorias: 60, proteinas: 0.8, carboidratos: 15, gorduras: 0.4, porcao: "100g", icon: "mango", unidade: "unid", quantidade_compra: "2 unid" },
    { nome: "Kiwi", calorias: 61, proteinas: 1.1, carboidratos: 15, gorduras: 0.5, porcao: "100g", icon: "kiwi", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Abacaxi", calorias: 50, proteinas: 0.5, carboidratos: 13, gorduras: 0.1, porcao: "100g", icon: "pineapple", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Goiaba", calorias: 68, proteinas: 2.6, carboidratos: 14, gorduras: 1, porcao: "100g", icon: "guava", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Pessego", calorias: 39, proteinas: 0.9, carboidratos: 10, gorduras: 0.3, porcao: "100g", icon: "peach", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Ameixa", calorias: 46, proteinas: 0.7, carboidratos: 11, gorduras: 0.3, porcao: "100g", icon: "plum", unidade: "unid", quantidade_compra: "6 unid" },
    { nome: "Damasco seco", calorias: 241, proteinas: 3.4, carboidratos: 63, gorduras: 0.5, porcao: "100g", icon: "apricot", unidade: "g", quantidade_compra: "200g" },
    { nome: "Figo", calorias: 74, proteinas: 0.8, carboidratos: 19, gorduras: 0.3, porcao: "100g", icon: "fig", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Maracuja", calorias: 68, proteinas: 2, carboidratos: 12, gorduras: 2, porcao: "100g", icon: "passionfruit", unidade: "unid", quantidade_compra: "4 unid" },
    { nome: "Acerola", calorias: 32, proteinas: 0.4, carboidratos: 8, gorduras: 0.3, porcao: "100g", icon: "cherry", unidade: "g", quantidade_compra: "300g" },
    { nome: "Caju", calorias: 43, proteinas: 1, carboidratos: 10, gorduras: 0.4, porcao: "100g", icon: "fruit", unidade: "unid", quantidade_compra: "6 unid" },
    { nome: "Pitaya", calorias: 50, proteinas: 1.2, carboidratos: 11, gorduras: 0.4, porcao: "100g", icon: "dragonfruit", unidade: "unid", quantidade_compra: "2 unid" },
    { nome: "Coco fresco", calorias: 354, proteinas: 3.3, carboidratos: 15, gorduras: 33, porcao: "100g", icon: "coconut", unidade: "unid", quantidade_compra: "1 unid" },
    { nome: "Acai polpa", calorias: 58, proteinas: 0.8, carboidratos: 6, gorduras: 3.9, porcao: "100g", icon: "berry", unidade: "pacote", quantidade_compra: "2 pacotes" },
    { nome: "Jabuticaba", calorias: 58, proteinas: 0.6, carboidratos: 14, gorduras: 0.1, porcao: "100g", icon: "berry", unidade: "g", quantidade_compra: "300g" }
  ],
  outros: [
    { nome: "Azeite de oliva", calorias: 884, proteinas: 0, carboidratos: 0, gorduras: 100, porcao: "100ml", icon: "olive", unidade: "ml", quantidade_compra: "500ml" },
    { nome: "Oleo de coco", calorias: 862, proteinas: 0, carboidratos: 0, gorduras: 100, porcao: "100ml", icon: "coconut", unidade: "ml", quantidade_compra: "200ml" },
    { nome: "Manteiga", calorias: 717, proteinas: 0.9, carboidratos: 0.1, gorduras: 81, porcao: "100g", icon: "butter", unidade: "g", quantidade_compra: "200g" },
    { nome: "Manteiga ghee", calorias: 900, proteinas: 0, carboidratos: 0, gorduras: 100, porcao: "100g", icon: "butter", unidade: "g", quantidade_compra: "200g" },
    { nome: "Castanha-do-para", calorias: 656, proteinas: 14, carboidratos: 12, gorduras: 66, porcao: "100g", icon: "nut", unidade: "g", quantidade_compra: "200g" },
    { nome: "Castanha de caju", calorias: 553, proteinas: 18, carboidratos: 30, gorduras: 44, porcao: "100g", icon: "nut", unidade: "g", quantidade_compra: "200g" },
    { nome: "Amendoas", calorias: 579, proteinas: 21, carboidratos: 22, gorduras: 50, porcao: "100g", icon: "nut", unidade: "g", quantidade_compra: "200g" },
    { nome: "Nozes", calorias: 654, proteinas: 15, carboidratos: 14, gorduras: 65, porcao: "100g", icon: "nut", unidade: "g", quantidade_compra: "200g" },
    { nome: "Amendoim", calorias: 567, proteinas: 26, carboidratos: 16, gorduras: 49, porcao: "100g", icon: "peanut", unidade: "g", quantidade_compra: "300g" },
    { nome: "Pasta de amendoim", calorias: 588, proteinas: 25, carboidratos: 20, gorduras: 50, porcao: "100g", icon: "peanut", unidade: "g", quantidade_compra: "500g" },
    { nome: "Tahine", calorias: 595, proteinas: 17, carboidratos: 21, gorduras: 54, porcao: "100g", icon: "seed", unidade: "g", quantidade_compra: "250g" },
    { nome: "Mel", calorias: 304, proteinas: 0.3, carboidratos: 82, gorduras: 0, porcao: "100g", icon: "honey", unidade: "g", quantidade_compra: "500g" },
    { nome: "Melado de cana", calorias: 290, proteinas: 0, carboidratos: 75, gorduras: 0, porcao: "100g", icon: "honey", unidade: "ml", quantidade_compra: "350ml" },
    { nome: "Acucar mascavo", calorias: 380, proteinas: 0, carboidratos: 95, gorduras: 0, porcao: "100g", icon: "sugar", unidade: "g", quantidade_compra: "500g" },
    { nome: "Acucar demerara", calorias: 377, proteinas: 0, carboidratos: 97, gorduras: 0, porcao: "100g", icon: "sugar", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Chia", calorias: 486, proteinas: 17, carboidratos: 42, gorduras: 31, porcao: "100g", icon: "seed", unidade: "g", quantidade_compra: "200g" },
    { nome: "Linhaça", calorias: 534, proteinas: 18, carboidratos: 29, gorduras: 42, porcao: "100g", icon: "seed", unidade: "g", quantidade_compra: "200g" },
    { nome: "Gergelim", calorias: 573, proteinas: 18, carboidratos: 23, gorduras: 50, porcao: "100g", icon: "seed", unidade: "g", quantidade_compra: "150g" },
    { nome: "Semente de girassol", calorias: 584, proteinas: 21, carboidratos: 20, gorduras: 51, porcao: "100g", icon: "seed", unidade: "g", quantidade_compra: "200g" },
    { nome: "Semente de abobora", calorias: 559, proteinas: 30, carboidratos: 11, gorduras: 49, porcao: "100g", icon: "seed", unidade: "g", quantidade_compra: "200g" },
    { nome: "Leite integral", calorias: 61, proteinas: 3.2, carboidratos: 4.8, gorduras: 3.3, porcao: "100ml", icon: "milk", unidade: "L", quantidade_compra: "1L" },
    { nome: "Leite desnatado", calorias: 35, proteinas: 3.4, carboidratos: 5, gorduras: 0.1, porcao: "100ml", icon: "milk", unidade: "L", quantidade_compra: "1L" },
    { nome: "Leite de amendoas", calorias: 17, proteinas: 0.6, carboidratos: 0.6, gorduras: 1.5, porcao: "100ml", icon: "milk", unidade: "L", quantidade_compra: "1L" },
    { nome: "Leite de coco", calorias: 154, proteinas: 1.4, carboidratos: 1.6, gorduras: 16, porcao: "100ml", icon: "milk", unidade: "ml", quantidade_compra: "500ml" },
    { nome: "Leite de aveia", calorias: 45, proteinas: 1, carboidratos: 7, gorduras: 1.5, porcao: "100ml", icon: "milk", unidade: "L", quantidade_compra: "1L" },
    { nome: "Creme de leite", calorias: 292, proteinas: 2.1, carboidratos: 2.8, gorduras: 30, porcao: "100g", icon: "cream", unidade: "caixa", quantidade_compra: "2 caixas" },
    { nome: "Granola", calorias: 471, proteinas: 10, carboidratos: 64, gorduras: 20, porcao: "100g", icon: "cereal", unidade: "g", quantidade_compra: "500g" },
    { nome: "Granola sem acucar", calorias: 411, proteinas: 12, carboidratos: 55, gorduras: 16, porcao: "100g", icon: "cereal", unidade: "g", quantidade_compra: "500g" },
    { nome: "Cacau em po", calorias: 228, proteinas: 20, carboidratos: 58, gorduras: 14, porcao: "100g", icon: "chocolate", unidade: "g", quantidade_compra: "200g" },
    { nome: "Chocolate amargo 70%", calorias: 598, proteinas: 8, carboidratos: 46, gorduras: 43, porcao: "100g", icon: "chocolate", unidade: "g", quantidade_compra: "100g" },
    { nome: "Gelatina sem sabor", calorias: 335, proteinas: 85, carboidratos: 0, gorduras: 0, porcao: "100g", icon: "jelly", unidade: "g", quantidade_compra: "30g" },
    { nome: "Molho de tomate", calorias: 29, proteinas: 1.3, carboidratos: 6, gorduras: 0.1, porcao: "100g", icon: "tomato", unidade: "g", quantidade_compra: "340g" },
    { nome: "Extrato de tomate", calorias: 82, proteinas: 4.3, carboidratos: 19, gorduras: 0.5, porcao: "100g", icon: "tomato", unidade: "g", quantidade_compra: "340g" },
    { nome: "Shoyu (molho de soja)", calorias: 53, proteinas: 8, carboidratos: 5, gorduras: 0, porcao: "100ml", icon: "sauce", unidade: "ml", quantidade_compra: "500ml" },
    { nome: "Vinagre de maca", calorias: 21, proteinas: 0, carboidratos: 0.9, gorduras: 0, porcao: "100ml", icon: "vinegar", unidade: "ml", quantidade_compra: "750ml" },
    { nome: "Cafe em po", calorias: 2, proteinas: 0.1, carboidratos: 0, gorduras: 0, porcao: "100ml", icon: "coffee", unidade: "g", quantidade_compra: "500g" },
    { nome: "Cha verde", calorias: 1, proteinas: 0, carboidratos: 0, gorduras: 0, porcao: "200ml", icon: "tea", unidade: "caixa", quantidade_compra: "1 caixa" },
    { nome: "Cha de camomila", calorias: 1, proteinas: 0, carboidratos: 0, gorduras: 0, porcao: "200ml", icon: "tea", unidade: "caixa", quantidade_compra: "1 caixa" }
  ],
  temperos: [
    { nome: "Sal", calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, porcao: "1g", icon: "salt", unidade: "kg", quantidade_compra: "1kg" },
    { nome: "Pimenta do reino", calorias: 251, proteinas: 10, carboidratos: 64, gorduras: 3, porcao: "100g", icon: "pepper", unidade: "g", quantidade_compra: "50g" },
    { nome: "Oregano", calorias: 265, proteinas: 9, carboidratos: 69, gorduras: 4, porcao: "100g", icon: "herb", unidade: "g", quantidade_compra: "30g" },
    { nome: "Manjericao", calorias: 23, proteinas: 3, carboidratos: 2.7, gorduras: 0.6, porcao: "100g", icon: "herb", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Salsa", calorias: 36, proteinas: 3, carboidratos: 6, gorduras: 0.8, porcao: "100g", icon: "herb", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Cebolinha", calorias: 30, proteinas: 3, carboidratos: 5, gorduras: 0.7, porcao: "100g", icon: "herb", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Coentro", calorias: 23, proteinas: 2, carboidratos: 4, gorduras: 0.5, porcao: "100g", icon: "herb", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Alecrim", calorias: 131, proteinas: 3, carboidratos: 21, gorduras: 6, porcao: "100g", icon: "herb", unidade: "maco", quantidade_compra: "1 maco" },
    { nome: "Canela em po", calorias: 247, proteinas: 4, carboidratos: 81, gorduras: 1, porcao: "100g", icon: "cinnamon", unidade: "g", quantidade_compra: "50g" },
    { nome: "Curcuma (acafrao)", calorias: 312, proteinas: 10, carboidratos: 65, gorduras: 3, porcao: "100g", icon: "spice", unidade: "g", quantidade_compra: "50g" },
    { nome: "Pimenta calabresa", calorias: 282, proteinas: 12, carboidratos: 50, gorduras: 6, porcao: "100g", icon: "pepper", unidade: "g", quantidade_compra: "50g" },
    { nome: "Paprica defumada", calorias: 282, proteinas: 14, carboidratos: 54, gorduras: 13, porcao: "100g", icon: "spice", unidade: "g", quantidade_compra: "50g" },
    { nome: "Cominho", calorias: 375, proteinas: 18, carboidratos: 44, gorduras: 22, porcao: "100g", icon: "spice", unidade: "g", quantidade_compra: "50g" },
    { nome: "Louro", calorias: 313, proteinas: 8, carboidratos: 75, gorduras: 8, porcao: "100g", icon: "leaf", unidade: "g", quantidade_compra: "10g" },
    { nome: "Noz-moscada", calorias: 525, proteinas: 6, carboidratos: 49, gorduras: 36, porcao: "100g", icon: "spice", unidade: "unid", quantidade_compra: "3 unid" }
  ],
  congelados: [
    { nome: "Legumes congelados mix", calorias: 45, proteinas: 2, carboidratos: 9, gorduras: 0.3, porcao: "100g", icon: "frozen", unidade: "pacote", quantidade_compra: "1 pacote (500g)" },
    { nome: "Brocolis congelado", calorias: 35, proteinas: 3, carboidratos: 7, gorduras: 0.4, porcao: "100g", icon: "broccoli", unidade: "pacote", quantidade_compra: "1 pacote (300g)" },
    { nome: "Ervilha congelada", calorias: 81, proteinas: 5, carboidratos: 14, gorduras: 0.4, porcao: "100g", icon: "bean", unidade: "pacote", quantidade_compra: "1 pacote (300g)" },
    { nome: "Frutas vermelhas congeladas", calorias: 50, proteinas: 0.8, carboidratos: 12, gorduras: 0.4, porcao: "100g", icon: "berry", unidade: "pacote", quantidade_compra: "1 pacote (300g)" },
    { nome: "Acai congelado", calorias: 58, proteinas: 0.8, carboidratos: 6, gorduras: 3.9, porcao: "100g", icon: "berry", unidade: "pacote", quantidade_compra: "2 pacotes" },
    { nome: "Polpa de fruta", calorias: 45, proteinas: 0.4, carboidratos: 11, gorduras: 0.2, porcao: "100g", icon: "fruit", unidade: "pacote", quantidade_compra: "4 polpas" }
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
      { id: "c1", nome: "Classico Nutritivo", descricao: "2 fatias pao integral + 2 ovos mexidos + 1 fatia queijo branco + 1 banana", calorias: 420, proteinas: 22, carboidratos: 45, gorduras: 18, ingredientes: ["Pao integral", "Ovos", "Queijo branco (minas)", "Banana"], restritivo: false },
      { id: "c2", nome: "Tapioca Fitness", descricao: "Tapioca + 2 col queijo cottage + tomate + oregano + 1 fruta", calorias: 280, proteinas: 15, carboidratos: 38, gorduras: 8, ingredientes: ["Tapioca", "Queijo cottage", "Tomate"], restritivo: false },
      { id: "c3", nome: "Vitamina Power", descricao: "Leite + banana + aveia + mel + chia", calorias: 350, proteinas: 12, carboidratos: 52, gorduras: 10, ingredientes: ["Leite integral", "Banana", "Aveia", "Mel", "Chia"], restritivo: false },
      { id: "c4", nome: "Panqueca Proteica", descricao: "2 panquecas (banana + aveia + ovo) + pasta de amendoim + frutas", calorias: 420, proteinas: 18, carboidratos: 48, gorduras: 16, ingredientes: ["Banana", "Aveia", "Ovos", "Pasta de amendoim"], restritivo: false },
      { id: "c5", nome: "Bowl de Iogurte", descricao: "Iogurte grego + granola + frutas vermelhas + mel + castanhas", calorias: 380, proteinas: 15, carboidratos: 42, gorduras: 14, ingredientes: ["Iogurte grego", "Granola", "Morango", "Mel", "Castanha-do-para"], restritivo: false },
      { id: "c6", nome: "Light Matinal", descricao: "2 ovos cozidos + 1 fatia pao integral + cafe sem acucar", calorias: 220, proteinas: 16, carboidratos: 15, gorduras: 12, ingredientes: ["Ovos", "Pao integral"], restritivo: true },
      { id: "c7", nome: "Iogurte Simples", descricao: "Iogurte desnatado + 2 col aveia + 5 morangos", calorias: 180, proteinas: 12, carboidratos: 24, gorduras: 3, ingredientes: ["Iogurte grego", "Aveia", "Morango"], restritivo: true },
      { id: "c8", nome: "Overnight Oats", descricao: "Aveia + leite + chia + banana + cacau em po", calorias: 340, proteinas: 14, carboidratos: 50, gorduras: 10, ingredientes: ["Aveia", "Leite integral", "Chia", "Banana", "Cacau em po"], restritivo: false },
      { id: "c9", nome: "Crepioca Recheada", descricao: "Crepioca (ovo + tapioca) + queijo + tomate + rucula", calorias: 300, proteinas: 18, carboidratos: 28, gorduras: 12, ingredientes: ["Ovos", "Tapioca", "Queijo branco (minas)", "Tomate", "Rucula"], restritivo: false }
    ]
  },
  lanche_manha: {
    titulo: "Lanche da Manha",
    horario: "10h",
    importancia: "Mantem o metabolismo ativo e evita fome excessiva",
    opcoes: [
      { id: "lm1", nome: "Iogurte + Aveia", descricao: "1 iogurte natural + 2 col aveia + canela", calorias: 180, proteinas: 8, carboidratos: 22, gorduras: 6, ingredientes: ["Iogurte grego", "Aveia"], restritivo: false },
      { id: "lm2", nome: "Fruta + Castanhas", descricao: "1 maca + 4 castanhas-do-para", calorias: 160, proteinas: 4, carboidratos: 18, gorduras: 10, ingredientes: ["Maca", "Castanha-do-para"], restritivo: false },
      { id: "lm3", nome: "Sanduiche Mini", descricao: "1 fatia pao integral + queijo branco + tomate", calorias: 150, proteinas: 8, carboidratos: 16, gorduras: 6, ingredientes: ["Pao integral", "Queijo branco (minas)", "Tomate"], restritivo: false },
      { id: "lm4", nome: "Banana + Amendoim", descricao: "1 banana + 1 col pasta de amendoim", calorias: 200, proteinas: 6, carboidratos: 26, gorduras: 9, ingredientes: ["Banana", "Pasta de amendoim"], restritivo: false },
      { id: "lm5", nome: "Fruta Solo", descricao: "1 maca ou 1 pera", calorias: 80, proteinas: 0.5, carboidratos: 20, gorduras: 0.3, ingredientes: ["Maca"], restritivo: true },
      { id: "lm6", nome: "Mix de Nuts", descricao: "30g de mix de castanhas e amendoas", calorias: 180, proteinas: 5, carboidratos: 6, gorduras: 16, ingredientes: ["Castanha-do-para", "Amendoas", "Castanha de caju"], restritivo: true },
      { id: "lm7", nome: "Banana com Canela", descricao: "1 banana amassada com canela e chia", calorias: 120, proteinas: 2, carboidratos: 26, gorduras: 2, ingredientes: ["Banana", "Canela em po", "Chia"], restritivo: false }
    ]
  },
  almoco: {
    titulo: "Almoco",
    horario: "12h30",
    importancia: "Principal refeicao - energia para o resto do dia",
    opcoes: [
      { id: "a1", nome: "Tradicional Brasileiro", descricao: "Arroz + feijao + frango grelhado + salada + legumes refogados", calorias: 580, proteinas: 38, carboidratos: 55, gorduras: 18, ingredientes: ["Arroz integral", "Feijao carioca", "Frango (peito)", "Alface americana", "Tomate", "Brocolis", "Azeite de oliva"], restritivo: false },
      { id: "a2", nome: "Carne com Legumes", descricao: "Arroz integral + carne magra + abobrinha + cenoura + salada", calorias: 550, proteinas: 35, carboidratos: 48, gorduras: 22, ingredientes: ["Arroz integral", "Carne magra (patinho)", "Abobrinha", "Cenoura", "Alface americana"], restritivo: false },
      { id: "a3", nome: "Macarrao Fitness", descricao: "Macarrao integral + molho de tomate caseiro + frango desfiado + salada", calorias: 520, proteinas: 32, carboidratos: 58, gorduras: 14, ingredientes: ["Macarrao integral", "Tomate", "Frango (peito)", "Alface americana"], restritivo: false },
      { id: "a4", nome: "Peixe Mediterraneo", descricao: "Salmao grelhado + batata doce + brocolis + azeite", calorias: 480, proteinas: 30, carboidratos: 35, gorduras: 22, ingredientes: ["Salmao", "Batata doce", "Brocolis", "Azeite de oliva"], restritivo: false },
      { id: "a5", nome: "Low Carb Basico", descricao: "Frango grelhado + 2 col arroz + salada grande (sem feijao)", calorias: 350, proteinas: 35, carboidratos: 25, gorduras: 12, ingredientes: ["Frango (peito)", "Arroz integral", "Alface americana", "Tomate", "Pepino"], restritivo: true },
      { id: "a6", nome: "Peixe Light", descricao: "Tilapia grelhada + legumes no vapor + salada", calorias: 280, proteinas: 32, carboidratos: 15, gorduras: 8, ingredientes: ["Tilapia", "Brocolis", "Cenoura", "Alface americana"], restritivo: true },
      { id: "a7", nome: "Strogonoff Fit", descricao: "Strogonoff de frango + arroz integral + salada", calorias: 520, proteinas: 34, carboidratos: 48, gorduras: 18, ingredientes: ["Frango (peito)", "Creme de leite", "Arroz integral", "Alface americana", "Tomate"], restritivo: false },
      { id: "a8", nome: "Feijoada Light", descricao: "Feijoada com carnes magras + arroz + couve + laranja", calorias: 580, proteinas: 32, carboidratos: 52, gorduras: 24, ingredientes: ["Feijao preto", "Carne magra (patinho)", "Arroz branco", "Couve", "Laranja"], restritivo: false },
      { id: "a9", nome: "Buddha Bowl", descricao: "Quinoa + grao-de-bico + legumes assados + tahine", calorias: 450, proteinas: 18, carboidratos: 55, gorduras: 18, ingredientes: ["Quinoa", "Grao-de-bico", "Brocolis", "Cenoura", "Tahine"], restritivo: false },
      { id: "a10", nome: "Escondidinho Fit", descricao: "Pure de batata doce + frango desfiado + queijo", calorias: 480, proteinas: 30, carboidratos: 45, gorduras: 18, ingredientes: ["Batata doce", "Frango (peito)", "Queijo mussarela"], restritivo: false }
    ]
  },
  lanche_tarde: {
    titulo: "Lanche da Tarde",
    horario: "15h30",
    importancia: "Evita chegar com muita fome no jantar",
    opcoes: [
      { id: "lt1", nome: "Vitamina Energetica", descricao: "Leite + banana + aveia + cacau", calorias: 280, proteinas: 10, carboidratos: 38, gorduras: 9, ingredientes: ["Leite integral", "Banana", "Aveia"], restritivo: false },
      { id: "lt2", nome: "Sanduiche Natural", descricao: "Pao integral + peito de peru + queijo branco + alface", calorias: 250, proteinas: 18, carboidratos: 25, gorduras: 8, ingredientes: ["Pao integral", "Peito de peru", "Queijo branco (minas)", "Alface americana"], restritivo: false },
      { id: "lt3", nome: "Smoothie Verde", descricao: "Espinafre + banana + leite + mel", calorias: 180, proteinas: 6, carboidratos: 32, gorduras: 3, ingredientes: ["Espinafre", "Banana", "Leite integral", "Mel"], restritivo: false },
      { id: "lt4", nome: "Iogurte + Chia", descricao: "Iogurte desnatado + 1 col chia + canela", calorias: 120, proteinas: 10, carboidratos: 12, gorduras: 4, ingredientes: ["Iogurte grego", "Chia"], restritivo: true },
      { id: "lt5", nome: "Shake Proteico", descricao: "Whey + leite desnatado + gelo", calorias: 150, proteinas: 28, carboidratos: 8, gorduras: 2, ingredientes: ["Whey protein", "Leite desnatado"], restritivo: true },
      { id: "lt6", nome: "Acai Fit", descricao: "Acai sem acucar + banana + granola sem acucar", calorias: 280, proteinas: 5, carboidratos: 40, gorduras: 10, ingredientes: ["Acai polpa", "Banana", "Granola sem acucar"], restritivo: false },
      { id: "lt7", nome: "Wrap de Frango", descricao: "Wrap integral + frango desfiado + cream cheese + alface", calorias: 300, proteinas: 22, carboidratos: 28, gorduras: 12, ingredientes: ["Pao integral", "Frango (peito)", "Queijo cottage", "Alface americana"], restritivo: false }
    ]
  },
  jantar: {
    titulo: "Jantar",
    horario: "19h",
    importancia: "Refeicao mais leve para boa digestao noturna",
    opcoes: [
      { id: "j1", nome: "Sopa Nutritiva", descricao: "Sopa de legumes com frango desfiado + 1 fatia pao", calorias: 320, proteinas: 25, carboidratos: 32, gorduras: 10, ingredientes: ["Frango (peito)", "Cenoura", "Abobrinha", "Batata doce", "Pao integral"], restritivo: false },
      { id: "j2", nome: "Omelete Recheada", descricao: "Omelete 3 ovos + legumes + queijo + salada + torradas", calorias: 380, proteinas: 24, carboidratos: 20, gorduras: 22, ingredientes: ["Ovos", "Espinafre", "Tomate", "Queijo branco (minas)", "Pao integral", "Alface americana"], restritivo: false },
      { id: "j3", nome: "Salada Caesar Fit", descricao: "Mix folhas + frango grelhado + croutons integrais + parmesao", calorias: 350, proteinas: 30, carboidratos: 18, gorduras: 18, ingredientes: ["Alface americana", "Frango (peito)", "Pao integral", "Queijo branco (minas)"], restritivo: false },
      { id: "j4", nome: "Peixe com Legumes", descricao: "Tilapia assada + legumes grelhados + azeite", calorias: 280, proteinas: 28, carboidratos: 15, gorduras: 12, ingredientes: ["Tilapia", "Abobrinha", "Berinjela", "Pimentao verde", "Azeite de oliva"], restritivo: false },
      { id: "j5", nome: "Sopa Detox", descricao: "Sopa de legumes (sem batata/macarrao) com frango", calorias: 180, proteinas: 22, carboidratos: 12, gorduras: 5, ingredientes: ["Frango (peito)", "Abobrinha", "Cenoura", "Couve"], restritivo: true },
      { id: "j6", nome: "Salada Proteica", descricao: "Mix folhas + frango + ovo cozido + azeite", calorias: 250, proteinas: 28, carboidratos: 8, gorduras: 12, ingredientes: ["Alface americana", "Espinafre", "Frango (peito)", "Ovos", "Azeite de oliva"], restritivo: true },
      { id: "j7", nome: "Creme de Legumes", descricao: "Creme de abobora com gengibre + torrada", calorias: 220, proteinas: 6, carboidratos: 35, gorduras: 6, ingredientes: ["Abobora", "Gengibre", "Pao integral", "Creme de leite"], restritivo: false },
      { id: "j8", nome: "Tacos Fit", descricao: "Tortilha integral + carne moida + salada + guacamole", calorias: 400, proteinas: 28, carboidratos: 30, gorduras: 20, ingredientes: ["Pao integral", "Carne moida magra", "Alface americana", "Tomate", "Abacate"], restritivo: false },
      { id: "j9", nome: "Frango ao Curry", descricao: "Frango com curry + legumes + arroz de couve-flor", calorias: 320, proteinas: 32, carboidratos: 18, gorduras: 14, ingredientes: ["Frango (peito)", "Couve-flor", "Cenoura", "Leite de coco"], restritivo: true }
    ]
  },
  ceia: {
    titulo: "Ceia",
    horario: "21h",
    importancia: "Opcional - apenas se sentir fome antes de dormir",
    opcoes: [
      { id: "ce1", nome: "Leite Dourado", descricao: "Leite morno + curcuma + canela + mel", calorias: 140, proteinas: 4, carboidratos: 18, gorduras: 4, ingredientes: ["Leite integral", "Mel", "Curcuma (acafrao)", "Canela em po"], restritivo: false },
      { id: "ce2", nome: "Iogurte Noturno", descricao: "Iogurte natural + gotas de mel", calorias: 120, proteinas: 6, carboidratos: 14, gorduras: 5, ingredientes: ["Iogurte grego", "Mel"], restritivo: false },
      { id: "ce3", nome: "Fruta Leve", descricao: "1 maca ou 1 pera", calorias: 80, proteinas: 0.5, carboidratos: 20, gorduras: 0.2, ingredientes: ["Maca"], restritivo: false },
      { id: "ce4", nome: "Cha Puro", descricao: "Cha de camomila ou erva-doce", calorias: 5, proteinas: 0, carboidratos: 1, gorduras: 0, ingredientes: ["Cha de camomila"], restritivo: true },
      { id: "ce5", nome: "Gelatina Diet", descricao: "1 taca de gelatina diet", calorias: 20, proteinas: 2, carboidratos: 2, gorduras: 0, ingredientes: ["Gelatina sem sabor"], restritivo: true },
      { id: "ce6", nome: "Banana Assada", descricao: "Banana assada com canela e nozes", calorias: 150, proteinas: 2, carboidratos: 28, gorduras: 5, ingredientes: ["Banana", "Canela em po", "Nozes"], restritivo: false }
    ]
  }
}

export interface Exercicio {
  nome: string
  series: number
  reps: string
  tempo: string
  dica: string
  musculos?: string[]
  video_url?: string
}

export interface Treino {
  nome: string
  duracao: string
  foco: string
  exercicios: Exercicio[]
  nivel: 'iniciante' | 'intermediario' | 'avancado'
  equipamento: string[]
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
    nome: "Fase 1 - Iniciante",
    semanas: "1-4",
    descricao: "Foco em condicionar o corpo de forma suave",
    frequencia: "3-4x por semana",
    treinos: {
      treinoA: {
        nome: "Treino A - Inferior",
        duracao: "20-25 min",
        foco: "Gluteos, pernas e core",
        nivel: "iniciante",
        equipamento: ["Nenhum"],
        exercicios: [
          { nome: "Agachamento livre", series: 3, reps: "12", tempo: "60s", dica: "Pes na largura dos ombros, descer devagar", musculos: ["Quadriceps", "Gluteos"] },
          { nome: "Elevacao de quadril", series: 3, reps: "15", tempo: "45s", dica: "Contrair gluteo no topo por 2 segundos", musculos: ["Gluteos", "Posteriores"] },
          { nome: "Afundo estatico", series: 2, reps: "10 cada", tempo: "45s", dica: "Manter joelho alinhado com o pe", musculos: ["Quadriceps", "Gluteos"] },
          { nome: "Abducao deitada", series: 3, reps: "15 cada", tempo: "30s", dica: "Movimento controlado, nao usar impulso", musculos: ["Gluteo medio"] },
          { nome: "Prancha", series: 3, reps: "20-30s", tempo: "30s", dica: "Corpo reto, abdomen bem contraido", musculos: ["Core", "Abdomen"] }
        ]
      },
      treinoB: {
        nome: "Treino B - Superior + Core",
        duracao: "20-25 min",
        foco: "Bracos, costas e abdomen",
        nivel: "iniciante",
        equipamento: ["Garrafa de agua"],
        exercicios: [
          { nome: "Flexao no joelho", series: 3, reps: "8-10", tempo: "60s", dica: "Descer ate o peito quase tocar o chao", musculos: ["Peitoral", "Triceps"] },
          { nome: "Remada com garrafa", series: 3, reps: "12 cada", tempo: "45s", dica: "Usar garrafa de 2L, puxar ate a cintura", musculos: ["Costas", "Biceps"] },
          { nome: "Triceps no banco", series: 3, reps: "10", tempo: "45s", dica: "Cotovelos apontando para tras", musculos: ["Triceps"] },
          { nome: "Prancha lateral", series: 2, reps: "15-20s cada", tempo: "30s", dica: "Quadril alto, corpo alinhado", musculos: ["Obliquos"] },
          { nome: "Abdominal crunch", series: 3, reps: "15", tempo: "30s", dica: "Nao puxar a cabeca, olhar para o teto", musculos: ["Abdomen"] }
        ]
      },
      cardio: {
        nome: "Cardio Leve",
        duracao: "20-30 min",
        foco: "Condicionamento cardiovascular",
        nivel: "iniciante",
        equipamento: ["Nenhum"],
        exercicios: [
          { nome: "Caminhada", series: 1, reps: "20-30 min", tempo: "-", dica: "Ritmo de conversa, no parque ou esteira", musculos: ["Cardiovascular"] }
        ]
      }
    }
  },
  fase2: {
    nome: "Fase 2 - Intermediario",
    semanas: "5-8",
    descricao: "Aumentar intensidade gradualmente",
    frequencia: "4-5x por semana",
    treinos: {
      treinoC: {
        nome: "Treino C - Pernas Intenso",
        duracao: "25-30 min",
        foco: "Gluteos e posteriores",
        nivel: "intermediario",
        equipamento: ["Cadeira", "Garrafa"],
        exercicios: [
          { nome: "Agachamento sumo", series: 3, reps: "15", tempo: "60s", dica: "Pes bem afastados, pontas para fora", musculos: ["Gluteos", "Adutores"] },
          { nome: "Stiff", series: 3, reps: "12", tempo: "60s", dica: "Pernas semi-flexionadas, sentir posterior", musculos: ["Posteriores", "Gluteos"] },
          { nome: "Afundo bulgaro", series: 3, reps: "10 cada", tempo: "60s", dica: "Pe de tras em cadeira ou sofa", musculos: ["Quadriceps", "Gluteos"] },
          { nome: "Gluteo 4 apoios", series: 3, reps: "15 cada", tempo: "45s", dica: "Elevar perna flexionada, contrair no topo", musculos: ["Gluteos"] },
          { nome: "Ponte elevada", series: 3, reps: "15", tempo: "45s", dica: "Pes em superficie elevada", musculos: ["Gluteos", "Posteriores"] },
          { nome: "Panturrilha", series: 3, reps: "20", tempo: "30s", dica: "Lento e controlado", musculos: ["Panturrilha"] }
        ]
      },
      treinoD: {
        nome: "Treino D - Superior Completo",
        duracao: "25-30 min",
        foco: "Bracos, costas e ombros",
        nivel: "intermediario",
        equipamento: ["Garrafa", "Mochila"],
        exercicios: [
          { nome: "Flexao inclinada", series: 3, reps: "10-12", tempo: "60s", dica: "Maos no sofa para facilitar", musculos: ["Peitoral", "Triceps"] },
          { nome: "Remada curvada", series: 3, reps: "12", tempo: "60s", dica: "Usar galao de agua ou mochila", musculos: ["Costas", "Biceps"] },
          { nome: "Elevacao lateral", series: 3, reps: "12", tempo: "45s", dica: "Garrafas como peso", musculos: ["Deltoides"] },
          { nome: "Triceps frances", series: 3, reps: "12", tempo: "45s", dica: "Garrafa atras da cabeca", musculos: ["Triceps"] },
          { nome: "Rosca biceps", series: 3, reps: "12", tempo: "45s", dica: "Galao ou garrafas", musculos: ["Biceps"] },
          { nome: "Prancha com elevacao", series: 3, reps: "10 cada", tempo: "45s", dica: "Alternar elevacao de bracos", musculos: ["Core", "Ombros"] }
        ]
      },
      treinoE: {
        nome: "Treino E - Core + HIIT",
        duracao: "25 min",
        foco: "Abdomen e queima calorica",
        nivel: "intermediario",
        equipamento: ["Nenhum"],
        exercicios: [
          { nome: "Abdominal bicicleta", series: 3, reps: "20 total", tempo: "45s", dica: "Cotovelo toca joelho oposto", musculos: ["Abdomen", "Obliquos"] },
          { nome: "Prancha", series: 3, reps: "40-45s", tempo: "30s", dica: "Desafio: aguentar mais!", musculos: ["Core"] },
          { nome: "Mountain climber", series: 3, reps: "20 total", tempo: "45s", dica: "Joelhos alternados ao peito", musculos: ["Core", "Cardiovascular"] },
          { nome: "Abdominal infra", series: 3, reps: "15", tempo: "45s", dica: "Elevar quadril do chao", musculos: ["Abdomen inferior"] },
          { nome: "Burpee modificado", series: 3, reps: "8", tempo: "60s", dica: "Sem salto se necessario", musculos: ["Full body"] }
        ]
      }
    }
  },
  fase3: {
    nome: "Fase 3 - Avancado",
    semanas: "9-12",
    descricao: "Treinos mais desafiadores para resultados",
    frequencia: "5-6x por semana",
    treinos: {
      treinoF: {
        nome: "Treino F - Pernas Power",
        duracao: "35-40 min",
        foco: "Gluteos, quadriceps e posteriores",
        nivel: "avancado",
        equipamento: ["Mochila", "Caneleira"],
        exercicios: [
          { nome: "Agachamento sumo", series: 4, reps: "15", tempo: "60s", dica: "Pode adicionar peso (mochila)", musculos: ["Gluteos", "Adutores"] },
          { nome: "Afundo bulgaro", series: 3, reps: "12 cada", tempo: "60s", dica: "Ir mais fundo", musculos: ["Quadriceps", "Gluteos"] },
          { nome: "Stiff unilateral", series: 3, reps: "10 cada", tempo: "60s", dica: "Uma perna de cada vez", musculos: ["Posteriores"] },
          { nome: "Agachamento + salto", series: 3, reps: "10", tempo: "60s", dica: "Salto suave ao subir", musculos: ["Quadriceps", "Gluteos"] },
          { nome: "Gluteo 4 apoios + peso", series: 3, reps: "20 cada", tempo: "45s", dica: "Caneleira ou garrafa", musculos: ["Gluteos"] },
          { nome: "Ponte com peso", series: 3, reps: "15", tempo: "45s", dica: "Peso no quadril", musculos: ["Gluteos", "Posteriores"] }
        ]
      },
      treinoG: {
        nome: "Treino G - Superior Avancado",
        duracao: "35-40 min",
        foco: "Bracos, costas, peito e ombros",
        nivel: "avancado",
        equipamento: ["Mochila", "Garrafa"],
        exercicios: [
          { nome: "Flexao completa", series: 3, reps: "12-15", tempo: "60s", dica: "Se conseguir, otimo!", musculos: ["Peitoral", "Triceps"] },
          { nome: "Remada concentrada", series: 3, reps: "12 cada", tempo: "60s", dica: "Foco na contracao", musculos: ["Costas", "Biceps"] },
          { nome: "Pike push-up", series: 3, reps: "8-10", tempo: "60s", dica: "Ombros, quadril alto", musculos: ["Deltoides", "Triceps"] },
          { nome: "Triceps no banco", series: 3, reps: "15", tempo: "45s", dica: "Descer bem", musculos: ["Triceps"] },
          { nome: "Rosca martelo", series: 3, reps: "12", tempo: "45s", dica: "Galoes ou pesos", musculos: ["Biceps", "Antebracos"] },
          { nome: "Superman", series: 3, reps: "15", tempo: "45s", dica: "Elevar bracos e pernas", musculos: ["Lombar", "Gluteos"] }
        ]
      },
      treinoH: {
        nome: "Treino H - HIIT Full Body",
        duracao: "30 min",
        foco: "Queima maxima de calorias",
        nivel: "avancado",
        equipamento: ["Nenhum"],
        exercicios: [
          { nome: "Jumping jacks", series: 3, reps: "30s", tempo: "15s", dica: "Ritmo acelerado", musculos: ["Cardiovascular"] },
          { nome: "Agachamento + salto", series: 3, reps: "30s", tempo: "15s", dica: "Explosao!", musculos: ["Quadriceps", "Gluteos"] },
          { nome: "Mountain climber", series: 3, reps: "30s", tempo: "15s", dica: "O mais rapido possivel", musculos: ["Core", "Cardiovascular"] },
          { nome: "Burpee", series: 3, reps: "30s", tempo: "15s", dica: "Modificado se precisar", musculos: ["Full body"] },
          { nome: "Prancha + toque ombro", series: 3, reps: "30s", tempo: "15s", dica: "Alternar toques", musculos: ["Core", "Ombros"] },
          { nome: "High knees", series: 3, reps: "30s", tempo: "15s", dica: "Joelhos bem alto", musculos: ["Cardiovascular"] }
        ]
      }
    }
  },
  yoga: {
    nome: "Yoga e Alongamento",
    semanas: "Qualquer fase",
    descricao: "Flexibilidade e relaxamento",
    frequencia: "2-3x por semana",
    treinos: {
      alongamento: {
        nome: "Alongamento Completo",
        duracao: "15-20 min",
        foco: "Flexibilidade e relaxamento muscular",
        nivel: "iniciante",
        equipamento: ["Tapete"],
        exercicios: [
          { nome: "Gato-vaca", series: 1, reps: "10x", tempo: "-", dica: "Movimentos suaves, sincronizar com respiracao", musculos: ["Coluna", "Core"] },
          { nome: "Cachorro olhando para baixo", series: 1, reps: "30s", tempo: "-", dica: "Empurrar o quadril para cima", musculos: ["Posteriores", "Costas"] },
          { nome: "Alongamento de quadril", series: 1, reps: "30s cada", tempo: "-", dica: "Respirar fundo e relaxar", musculos: ["Flexores do quadril"] },
          { nome: "Torção deitada", series: 1, reps: "30s cada", tempo: "-", dica: "Ombros no chao", musculos: ["Coluna", "Obliquos"] },
          { nome: "Crianca (child pose)", series: 1, reps: "1 min", tempo: "-", dica: "Relaxar completamente", musculos: ["Costas", "Quadril"] }
        ]
      },
      yogaBasico: {
        nome: "Yoga para Iniciantes",
        duracao: "25-30 min",
        foco: "Equilibrio, forca e flexibilidade",
        nivel: "iniciante",
        equipamento: ["Tapete"],
        exercicios: [
          { nome: "Saudacao ao Sol", series: 3, reps: "ciclo completo", tempo: "-", dica: "Fluir entre as posicoes", musculos: ["Full body"] },
          { nome: "Guerreiro I", series: 1, reps: "30s cada lado", tempo: "-", dica: "Quadril alinhado", musculos: ["Pernas", "Core"] },
          { nome: "Guerreiro II", series: 1, reps: "30s cada lado", tempo: "-", dica: "Olhar para a mao da frente", musculos: ["Pernas", "Bracos"] },
          { nome: "Arvore (Tree pose)", series: 1, reps: "30s cada lado", tempo: "-", dica: "Foco em um ponto fixo", musculos: ["Equilibrio", "Core"] },
          { nome: "Ponte (Bridge)", series: 3, reps: "30s", tempo: "30s", dica: "Apertar gluteos no topo", musculos: ["Gluteos", "Core"] },
          { nome: "Savasana", series: 1, reps: "5 min", tempo: "-", dica: "Relaxamento final", musculos: ["Relaxamento"] }
        ]
      }
    }
  }
}

// Tipos de receitas para IA
export const TIPOS_RECEITAS = [
  { id: 'cafe', nome: 'Cafe da Manha', icon: '🌅', cor: 'orange' },
  { id: 'lanche', nome: 'Lanche', icon: '🍎', cor: 'red' },
  { id: 'almoco', nome: 'Almoco/Jantar', icon: '🍽️', cor: 'blue' },
  { id: 'sobremesa', nome: 'Sobremesa Fit', icon: '🍨', cor: 'pink' },
  { id: 'smoothie', nome: 'Smoothie', icon: '🥤', cor: 'purple' },
  { id: 'sopa', nome: 'Sopa', icon: '🥣', cor: 'green' },
  { id: 'salada', nome: 'Salada', icon: '🥗', cor: 'emerald' },
  { id: 'proteina', nome: 'Alta Proteina', icon: '💪', cor: 'amber' }
]
