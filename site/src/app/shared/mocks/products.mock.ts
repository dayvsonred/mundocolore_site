import { Product } from '../../core/models/product.model';

export const PRODUCTS_MOCK: Product[] = [
  {
    id: 1,
    name: 'Vestido Rosa Princesa',
    price: 89.90,
    image: 'assets/images/dress1.jpg',
    images: ['assets/images/dress1.jpg', 'assets/images/dress1-2.jpg'],
    description: 'Vestido delicado em rosa suave, perfeito para festas infantis.',
    category: 'Vestidos',
    size: ['2', '4', '6', '8'],
    ageGroup: '2-8 anos',
    isNew: true
  },
  {
    id: 2,
    name: 'Conjunto Azul Marinho',
    price: 129.90,
    image: 'assets/images/set1.jpg',
    description: 'Conjunto completo com calça e blusa em azul marinho.',
    category: 'Conjuntos',
    size: ['2', '4', '6'],
    ageGroup: '2-6 anos',
    isPromotion: true
  },
  // Adicionar mais produtos
];