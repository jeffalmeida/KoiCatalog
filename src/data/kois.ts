import type { Koi } from '../types'

export const initialKois: Koi[] = [
  {
    id: 'kohaku',
    name: 'Kohaku',
    nameJa: '紅白',
    description:
      'O koi mais clássico e popular. Corpo branco puro com manchas vermelhas (hi). "Tudo começa e termina no Kohaku" — é o ancestral das demais variedades e frequentemente o campeão das exposições.',
    image: '/images/koi/kohaku.jpg',
    group: 'Gosanke',
    colors: ['branco', 'vermelho'],
  },
  {
    id: 'sanke',
    name: 'Sanke',
    nameJa: '大正三色',
    description:
      'Também chamado Taisho Sanke ou Taisho Sanshoku. Base branca com manchas vermelhas e pretas. A característica que diferencia do Showa: NÃO tem preto na cabeça.',
    image: '/images/koi/sanke.jpg',
    group: 'Gosanke',
    colors: ['branco', 'vermelho', 'preto'],
  },
  {
    id: 'showa',
    name: 'Showa',
    nameJa: '昭和三色',
    description:
      'Base preta com manchas vermelhas e brancas. Diferente do Sanke, TEM preto na cabeça e nas nadadeiras peitorais (motoguro). Desenvolvido na era do imperador Shōwa.',
    image: '/images/koi/showa.jpg',
    group: 'Gosanke',
    colors: ['preto', 'vermelho', 'branco'],
  },
  {
    id: 'shiro-utsuri',
    name: 'Shiro Utsuri',
    nameJa: '白写り',
    description:
      'Chamado de "koi panda". Padrão preto e branco de alto contraste, com o preto presente também na cabeça. Pertence ao grupo Utsurimono (dois tons).',
    image: '/images/koi/shiro-utsuri.jpg',
    group: 'Utsurimono',
    colors: ['preto', 'branco'],
  },
  {
    id: 'hi-utsuri',
    name: 'Hi Utsuri',
    nameJa: '緋写り',
    description:
      'Apelidado de "koi tigre". Mesmas características do Shiro Utsuri, mas com manchas vermelhas profundas sobre a base preta. O vermelho costuma ser profundo e brilhante.',
    image: '/images/koi/hi-utsuri.jpg',
    group: 'Utsurimono',
    colors: ['preto', 'vermelho'],
  },
  {
    id: 'ki-utsuri',
    name: 'Ki Utsuri',
    nameJa: '黄写り',
    description:
      'A versão amarela do Utsuri. Base preta com manchas amarelas vibrantes. Uma das variedades mais raras — difícil de encontrar fora do Japão.',
    image: '/images/koi/ki-utsuri.jpg',
    group: 'Utsurimono',
    colors: ['preto', 'amarelo'],
  },
  {
    id: 'ogon',
    name: 'Ogon',
    nameJa: '黄金',
    description:
      'A "carpa dourada". Corpo inteiro metálico, geralmente dourado (Yamabuki Ogon) ou platina. As escamas têm brilho metálico — a variedade mais popular do grupo Hikarimono.',
    image: '/images/koi/ogon.jpg',
    group: 'Hikarimono',
    colors: ['dourado', 'metálico'],
  },
  {
    id: 'asagi',
    name: 'Asagi',
    nameJa: '浅黄',
    description:
      'Uma das variedades mais antigas. Dorso azul-acinzentado com escamas em padrão de rede e ventre avermelhado. A trança de vermelho na lateral (narablue) é sinal de qualidade.',
    image: '/images/koi/asagi.jpg',
    group: 'Kawarimono',
    colors: ['azul', 'cinza', 'vermelho'],
  },
  {
    id: 'shusui',
    name: 'Shusui',
    nameJa: '秋翠',
    description:
      'A versão Doitsu (sem escamas) do Asagi. Linha dorsal de escamas grandes e azuis, com padrão vermelho/laranja ao longo do corpo. Foi criado a partir do Asagi com carpa espelho alemã.',
    image: '/images/koi/shusui.jpg',
    group: 'Doitsu',
    colors: ['azul', 'laranja'],
  },
  {
    id: 'bekko',
    name: 'Bekko',
    nameJa: '別甲',
    description:
      'Base branca, vermelha ou amarela com manchas pretas (sumi) separadas, sem vermelho adicional. Considerado parecido com o Sanke, mas sem as manchas vermelhas.',
    image: '/images/koi/bekko.jpg',
    group: 'Kawarimono',
    colors: ['branco', 'preto'],
  },
  {
    id: 'goshiki',
    name: 'Goshiki',
    nameJa: '五色',
    description:
      'Literalmente "cinco cores". Uma base preta macia com vermelho, branco e um tom azulado que se destaca. Combina características do Kohaku e do Asagi.',
    image: '/images/koi/goshiki.jpg',
    group: 'Kawarimono',
    colors: ['preto', 'branco', 'vermelho', 'azul'],
  },
  {
    id: 'tancho',
    name: 'Tancho Kohaku',
    nameJa: '丹頂',
    description:
      'Kohaku com uma única mancha vermelha no topo da cabeça, lembrando a bandeira do Japão. Considerado de boa sorte no Japão. Se a mancha estiver bem centralizada, tem enorme valor.',
    image: '/images/koi/tancho.jpg',
    group: 'Kawarimono',
    colors: ['branco', 'vermelho'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    nameJa: 'プラチナ',
    description:
      'Variedade Hikarimono de corpo inteiro prateado ou platina, com brilho metálico uniforme (Purachina Ogon). Diferente do Yamabuki Ogon dourado: aqui o tom é prata fria, quase espelhada, sem manchas.',
    image: '/images/koi/platinum.svg',
    group: 'Hikarimono',
    colors: ['prata', 'platina', 'metálico'],
  },
  {
    id: 'shiro-muji',
    name: 'Shiro Muji',
    nameJa: '白無地',
    description:
      'Carpa totalmente branca, sem manchas, escamas ou padrões (muji = “sem desenho”). Diferente do Platinum Ogon metálico: o branco costuma ser mate ou levemente perolado. Variedade apreciada pela pureza da cor.',
    image: '/images/koi/shiro-muji.svg',
    group: 'Kawarimono',
    colors: ['branco'],
  },
]