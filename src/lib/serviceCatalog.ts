export type ServiceItem = {
 id: string;
 name: string;
 price: string;
 duration: string;
 description: string;
 features: string[];
 category: string;
 highlight?: 'popular';
};

export const serviceCatalog: ServiceItem[] = [
 {
 id: 's1',
 name: 'Lavagem Simples',
 price: '300 MT',
 duration: '24 min',
 description: 'Lavagem por fora, limpeza das rodas e aspiracao basica para o dia a dia.',
 features: ['Lavagem por fora', 'Aspiracao basica', 'Rodas'],
 category: 'Viaturas Ligeiras',
 },
 {
 id: 's2',
 name: 'Lavagem Completa',
 price: '500 MT',
 duration: '35 min',
 description: 'Lavagem interior e exterior, com aspiracao completa, limpeza detalhada de vidros e um acabamento bonito.',
 features: ['Lavagem interior e exterior', 'Aspiracao completa', 'Limpeza detalhada de vidros', 'Toque final'],
 category: 'Viaturas Ligeiras',
 highlight: 'popular',
 },
 {
 id: 's9',
 name: 'Lavagem Completa + Chassi',
 price: '750 MT',
 duration: '50 min',
 description: 'O mesmo pacote da lavagem completa, agora com limpeza adicional de chassi para remover lama, poeira e sujidade acumulada na parte inferior da viatura.',
 features: ['Lavagem interior e exterior', 'Aspiracao completa', 'Limpeza detalhada de vidros', 'Lavagem de chassi'],
 category: 'Viaturas Ligeiras',
 },
 {
 id: 's11',
 name: 'Lavagem de Motor',
 price: '250 MT',
 duration: '20 min',
 description: 'Lavagem dedicada apenas ao motor, com cuidado nas partes sensiveis e remocao de poeira, oleo leve e sujidade acumulada.',
 features: ['Lavagem so de motor', 'Desengordurar leve', 'Componentes sensiveis protegidos', 'Acabamento limpo'],
 category: 'Viaturas Ligeiras',
 },
 {
 id: 's3',
 name: 'Super Lavagem Completa',
 price: '2.500 MT',
 duration: '70 min',
 description: 'Servico completo para quem quer um tratamento mais profundo, com motor, chassis e interior bem cuidado.',
 features: ['Motor', 'Chassis', 'Interior completo', 'Acabamento especial'],
 category: 'Viaturas Ligeiras',
 },
 {
 id: 's4',
 name: 'Limpeza de Bancos',
 price: '2.500 MT',
 duration: '95 min',
 description: 'Limpeza profunda dos bancos, teto e carpetes para tirar manchas, poeira e maus cheiros.',
 features: ['Bancos', 'Teto', 'Carpetes', 'Eliminar odores'],
 category: 'Limpeza & Brilho',
 },
 {
 id: 's5',
 name: 'Polimento de Pintura',
 price: '4.500 MT',
 duration: '190 min',
 description: 'Polimento para devolver brilho intenso e deixar a pintura com melhor aparencia.',
 features: ['Tirar marcas leves', 'Brilho intenso', 'Protecao', 'Acabamento premium'],
 category: 'Limpeza & Brilho',
 },
 {
 id: 's10',
 name: 'Pacote Empresarial',
 price: 'Desde 3.500 MT',
 duration: 'Sob consulta',
 description: 'Pacote especial para empresas publicas, privadas, sociedades e frotas com atendimento recorrente e condicoes comerciais.',
 features: ['Preco inicial', 'Frotas e empresas', 'Plano recorrente', 'Orcamento personalizado'],
 category: 'Empresas & Frotas',
 },
 {
 id: 's6',
 name: 'Lavagem de Motas',
 price: '150 MT',
 duration: '16 min',
 description: 'Lavagem cuidada para motas, com atencao as carenagens, corrente, rodas e partes sensiveis.',
 features: ['Carenagens', 'Corrente', 'Rodas', 'Acabamento rapido'],
 category: 'Motas, Camiões & Maquinas',
 },
 {
 id: 's7',
 name: 'Lavagem de Camiões',
 price: '1.500 MT',
 duration: '95 min',
 description: 'Lavagem forte da cabine e do chassis para tirar lama, poeira e graxa do trabalho do dia.',
 features: ['Cabine', 'Chassis', 'Tirar graxa', 'Limpeza pesada'],
 category: 'Motas, Camiões & Maquinas',
 },
 {
 id: 's8',
 name: 'Lavagem de Maquinas',
 price: '2.000 MT',
 duration: '140 min',
 description: 'Limpeza tecnica para tratores e outras maquinas, com foco em lama, oleo e sujidade pesada.',
 features: ['Desengordurar', 'Tirar lama', 'Limpeza tecnica', 'Equipamento pesado'],
 category: 'Motas, Camiões & Maquinas',
 },
];

export const featuredHomeServices = ['s2', 's9', 's10', 's5'];

export const groupedServices = [
 {
 category: 'Viaturas Ligeiras (Particulares)',
 items: serviceCatalog.filter((service) => service.category === 'Viaturas Ligeiras'),
 },
 {
 category: 'Limpeza & Brilho',
 items: serviceCatalog.filter((service) => service.category === 'Limpeza & Brilho'),
 },
 {
 category: 'Empresas & Frotas',
 items: serviceCatalog.filter((service) => service.category === 'Empresas & Frotas'),
 },
 {
 category: 'Motas, Camiões & Maquinas',
 items: serviceCatalog.filter((service) => service.category === 'Motas, Camiões & Maquinas'),
 },
];
