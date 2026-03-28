import { ArchitectShowcaseData, ShowcaseLanguage } from './architect-showcase.models';
import { environment } from 'src/environments/environment';

const SHARED_PHOTO = `${environment.assetsBaseUrl}/assest/cmo_t_7.jpg`;

const SHOWCASE_DATA_PT: ArchitectShowcaseData = {
  brand: {
    logoText: 'Cloud Engineer Portfolio',
    logoTagline: 'Software Architecture and Engineering'
  },
  hero: {
    title: 'Arquitetura Cloud (AWS) e Projetos em Producao',
    subtitle: 'Lideranca tecnica para escalar produtos com seguranca, reduzir custo operacional e acelerar entregas com arquitetura moderna orientada a eventos.',
    primaryLabel: 'Ver Projetos',
    secondaryLabel: 'Falar com o Arquiteto',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Painel de arquitetura cloud e monitoramento em ambiente de producao'
  },
  architect: {
    name: 'Dayvison Vicente',
    title: 'Arquiteto de Software e Especialista em AWS/Cloud',
    bio: 'Mais de 15 anos em engenharia de software, liderando times para construir plataformas resilientes, seguras e com foco em resultado de negocio.',
    photoUrl: SHARED_PHOTO,
    highlights: [
      'Arquitetura orientada a eventos',
      'Governanca e seguranca cloud',
      'FinOps e otimizacao de custos',
      'Observabilidade ponta a ponta'
    ]
  },
  metrics: [
    { label: 'Anos de experiencia', value: '15+' },
    { label: 'Especialidade principal', value: 'AWS Cloud' },
    { label: 'Modelo de arquitetura', value: 'Serverless' },
    { label: 'Disciplina financeira', value: 'FinOps' },
    { label: 'Pilar tecnico', value: 'Seguranca' },
    { label: 'Objetivo operacional', value: 'Alta disponibilidade' }
  ],
  logos: ['SaaS', 'Marketplace', 'HealthTech', 'EdTech', 'FinTech', 'Logistica', 'Capital Markets & Structured Products Expertise', 'Payments'],
  services: [
    {
      title: 'Especialista em Cloud (AWS)',
      description: 'Arquitetura escalavel, segura e observavel para sistemas criticos, com desenhos tecnicos prontos para crescimento real de trafego.',
      bullets: [
        'Landing zones, IAM e rede com boas praticas',
        'Escalabilidade horizontal com servicos gerenciados',
        'Monitoracao, logs e alertas acionaveis',
        'Seguranca by design desde o inicio'
      ],
      iconKey: 'cloud',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'E-mails profissionais e envio de e-mails',
      description: 'Implantacao de e-mail profissional no dominio da empresa e trilhas transacionais para operacao com alta entregabilidade.',
      bullets: [
        'E-mail corporativo com dominio proprio',
        'Fluxos de boas-vindas, recuperacao de senha e recibos',
        'SPF, DKIM e DMARC para reputacao do dominio',
        'Monitoramento de bounce, abertura e cliques'
      ],
      iconKey: 'email',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Notificacoes',
      description: 'Comunicacao omnichannel com rastreabilidade completa para eventos de negocio e jornada do cliente.',
      bullets: [
        'Canais por e-mail, push e SMS/WhatsApp',
        'Filas e eventos para resiliencia no envio',
        'Reprocessamento seguro e trilha de auditoria',
        'Dashboards de entrega e latencia por canal'
      ],
      iconKey: 'notification',
      imageUrl: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Integracao de pagamentos',
      description: 'Implementacao de pagamentos com foco em conversao, seguranca e conciliacao confiavel para operacoes digitais.',
      bullets: [
        'Checkout com boleto, Pix, cartao de credito e Bitcoin',
        'Webhooks assinados e processamento idempotente',
        'Consolidacao de status e conciliacao financeira',
        'Camadas antifraude e compliance de dados'
      ],
      iconKey: 'payment',
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Servicos de IA atualizados',
      description: 'Aplicacao pratica de IA para atendimento, automacao e ganho de produtividade com integracao aos sistemas existentes.',
      bullets: [
        'Chatbots e assistentes para atendimento 24/7',
        'RAG e knowledge base para respostas contextualizadas',
        'Automacao de processos internos e operacionais',
        'Integracao com CRM, ERP e ferramentas de suporte'
      ],
      iconKey: 'ai',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Reducao de custo e migracao para Serverless',
      description: 'Evolucao de infraestrutura local para AWS Lambda e servicos gerenciados com foco direto em custo, elasticidade e time-to-market.',
      bullets: [
        'Mapeamento de cargas e estrategia de migracao',
        'Arquitetura orientada a eventos para reduzir acoplamento',
        'Aproveitamento de beneficios free/baixo custo quando aplicavel (AWS Free Tier)',
        'Governanca de custo continuo com FinOps'
      ],
      iconKey: 'serverless',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  projects: [
    {
      name: 'Plataforma de Doacoes de Alta Escala',
      summary: 'Ecossistema de arrecadacao com checkout multimeios, notificacoes em tempo real e painel operacional.',
      stack: ['Angular', 'Node.js', 'AWS Lambda', 'API Gateway', 'DynamoDB'],
      highlights: ['Latencia media abaixo de 200ms', 'Arquitetura event-driven', 'Observabilidade centralizada'],
      links: [
        { label: 'Ver caso', url: '#projetos' },
        { label: 'Arquitetura tecnica', url: '#servicos' }
      ]
    },
    {
      name: 'Motor de Notificacoes Omnichannel',
      summary: 'Pipeline unificado para envios transacionais em multiplos canais com retries e rastreabilidade.',
      stack: ['TypeScript', 'SQS', 'SNS', 'SES', 'CloudWatch'],
      highlights: ['99.9% de disponibilidade', 'Retentativas inteligentes', 'Auditoria de ponta a ponta'],
      links: [
        { label: 'Ver projeto', url: '#projetos' },
        { label: 'Solicitar demo', url: '#contato' }
      ]
    },
    {
      name: 'Assistente IA para Operacoes',
      summary: 'Assistente conectado a base de conhecimento para suporte tecnico e automacao de tarefas repetitivas.',
      stack: ['Angular', 'API REST', 'Vector Search', 'Pipelines de IA'],
      highlights: ['Atendimento 24/7', 'RAG com contexto do negocio', 'Integracao com sistemas legados'],
      links: [
        { label: 'Ver fluxos', url: '#depoimentos' },
        { label: 'Falar com especialista', url: '#contato' }
      ]
    }
  ],
  testimonials: [
    {
      quote: 'Nossa migracao para serverless reduziu custos e eliminou gargalos de deploy. A equipe entregou arquitetura e execucao com alto nivel tecnico.',
      name: 'Mariana Costa',
      role: 'CTO',
      company: 'Nexa Commerce'
    },
    {
      quote: 'A integracao de pagamentos com webhooks confiaveis resolveu problemas antigos de conciliacao e melhorou a experiencia no checkout.',
      name: 'Eduardo Martins',
      role: 'Head de Produto',
      company: 'Pulse Fintech'
    },
    {
      quote: 'O projeto de notificacoes e IA elevou nosso atendimento e trouxe visibilidade operacional real com metricas acionaveis.',
      name: 'Carla Ribeiro',
      role: 'Diretora de Operacoes',
      company: 'Orbit Health'
    }
  ],
  cta: {
    primaryLabel: 'Agendar conversa',
    secondaryLabel: 'Solicitar orcamento',
    note: 'Ver portfolio completo'
  },
  text: {
    metrics: {
      ariaLabel: 'Prova social e capacidades tecnicas'
    },
    services: {
      eyebrow: 'Servicos',
      title: 'Arquitetura e engenharia para operar com confianca em producao'
    },
    projects: {
      eyebrow: 'Projetos',
      title: 'Portfolios com impacto tecnico e resultado de negocio'
    },
    testimonials: {
      eyebrow: 'Depoimentos',
      title: 'Resultados percebidos por liderancas de produto e tecnologia',
      previousButton: 'Anterior',
      nextButton: 'Proximo',
      indicatorsAriaLabel: 'Indicadores de depoimentos',
      goToAriaPrefix: 'Ir para depoimento'
    },
    cta: {
      eyebrow: 'Pronto para o proximo nivel?',
      title: 'Vamos desenhar a arquitetura ideal para seu produto',
      description: 'Atuacao direta em discovery tecnico, arquitetura, implementacao e evolucao de plataforma para crescimento sustentavel.'
    }
  }
};

const SHOWCASE_DATA_EN: ArchitectShowcaseData = {
  brand: {
    logoText: 'Cloud Engineer Portfolio',
    logoTagline: 'Software Architecture and Engineering'
  },
  hero: {
    title: 'AWS Cloud Architecture and Production Projects',
    subtitle: 'Technical leadership to scale products securely, reduce operational cost, and speed up delivery with modern event-driven architecture.',
    primaryLabel: 'View Projects',
    secondaryLabel: 'Talk to the Architect',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Cloud architecture and monitoring dashboard in production'
  },
  architect: {
    name: 'Dayvison Vicente',
    title: 'Software Architect and AWS/Cloud Specialist',
    bio: 'Over 15 years in software engineering, leading teams to build resilient and secure platforms focused on business outcomes.',
    photoUrl: SHARED_PHOTO,
    highlights: [
      'Event-driven architecture',
      'Cloud governance and security',
      'FinOps and cost optimization',
      'End-to-end observability'
    ]
  },
  metrics: [
    { label: 'Years of experience', value: '15+' },
    { label: 'Primary expertise', value: 'AWS Cloud' },
    { label: 'Architecture model', value: 'Serverless' },
    { label: 'Financial discipline', value: 'FinOps' },
    { label: 'Technical pillar', value: 'Security' },
    { label: 'Operational goal', value: 'High availability' }
  ],
  logos: ['SaaS', 'Marketplace', 'HealthTech', 'EdTech', 'FinTech', 'Logistics', 'Capital Markets & Structured Products Expertise', 'Payments'],
  services: [
    {
      title: 'Cloud Specialist (AWS)',
      description: 'Scalable, secure, and observable architecture for critical systems, with technical designs ready for real traffic growth.',
      bullets: [
        'Landing zones, IAM, and networking best practices',
        'Horizontal scalability with managed services',
        'Monitoring, logs, and actionable alerts',
        'Security by design from day one'
      ],
      iconKey: 'cloud',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Professional email and email delivery',
      description: 'Company-domain email setup and transactional pipelines for high deliverability operations.',
      bullets: [
        'Corporate email with custom domain',
        'Welcome, password reset, and receipt flows',
        'SPF, DKIM, and DMARC for domain reputation',
        'Bounce, open, and click tracking'
      ],
      iconKey: 'email',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Notifications',
      description: 'Omnichannel communication with full traceability for business events and customer journeys.',
      bullets: [
        'Email, push, and SMS/WhatsApp channels',
        'Queues and events for resilient delivery',
        'Safe reprocessing and audit trails',
        'Delivery and latency dashboards by channel'
      ],
      iconKey: 'notification',
      imageUrl: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Payments integration',
      description: 'Payment implementation focused on conversion, security, and reliable reconciliation for digital operations.',
      bullets: [
        'Checkout with bank slip, Pix, credit card, and Bitcoin',
        'Signed webhooks and idempotent processing',
        'Status consolidation and financial reconciliation',
        'Anti-fraud layers and data compliance'
      ],
      iconKey: 'payment',
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Up-to-date AI services',
      description: 'Practical AI applications for customer service, automation, and productivity gains integrated with existing systems.',
      bullets: [
        'Chatbots and assistants for 24/7 support',
        'RAG and knowledge base for contextual answers',
        'Internal and operational workflow automation',
        'Integration with CRM, ERP, and support tools'
      ],
      iconKey: 'ai',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Cost reduction and serverless migration',
      description: 'Infrastructure evolution to AWS Lambda and managed services focused on cost, elasticity, and time-to-market.',
      bullets: [
        'Workload mapping and migration strategy',
        'Event-driven architecture to reduce coupling',
        'Leverage low-cost/free benefits when applicable (AWS Free Tier)',
        'Continuous FinOps cost governance'
      ],
      iconKey: 'serverless',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  projects: [
    {
      name: 'High-Scale Donations Platform',
      summary: 'Fundraising ecosystem with multi-method checkout, real-time notifications, and operational dashboard.',
      stack: ['Angular', 'Node.js', 'AWS Lambda', 'API Gateway', 'DynamoDB'],
      highlights: ['Average latency below 200ms', 'Event-driven architecture', 'Centralized observability'],
      links: [
        { label: 'View case', url: '#projetos' },
        { label: 'Technical architecture', url: '#servicos' }
      ]
    },
    {
      name: 'Omnichannel Notification Engine',
      summary: 'Unified pipeline for transactional delivery across multiple channels with retries and traceability.',
      stack: ['TypeScript', 'SQS', 'SNS', 'SES', 'CloudWatch'],
      highlights: ['99.9% availability', 'Smart retries', 'End-to-end auditing'],
      links: [
        { label: 'View project', url: '#projetos' },
        { label: 'Request demo', url: '#contato' }
      ]
    },
    {
      name: 'AI Assistant for Operations',
      summary: 'Assistant connected to a knowledge base for technical support and automation of repetitive tasks.',
      stack: ['Angular', 'REST API', 'Vector Search', 'AI Pipelines'],
      highlights: ['24/7 support', 'RAG with business context', 'Legacy system integration'],
      links: [
        { label: 'View flows', url: '#depoimentos' },
        { label: 'Talk to an expert', url: '#contato' }
      ]
    }
  ],
  testimonials: [
    {
      quote: 'Our serverless migration reduced costs and removed deployment bottlenecks. The team delivered architecture and execution at a high technical level.',
      name: 'Mariana Costa',
      role: 'CTO',
      company: 'Nexa Commerce'
    },
    {
      quote: 'The payments integration with reliable webhooks solved long-standing reconciliation issues and improved checkout experience.',
      name: 'Eduardo Martins',
      role: 'Head of Product',
      company: 'Pulse Fintech'
    },
    {
      quote: 'The notifications and AI project raised our support quality and brought real operational visibility with actionable metrics.',
      name: 'Carla Ribeiro',
      role: 'Operations Director',
      company: 'Orbit Health'
    }
  ],
  cta: {
    primaryLabel: 'Schedule a call',
    secondaryLabel: 'Request quote',
    note: 'View full portfolio'
  },
  text: {
    metrics: {
      ariaLabel: 'Social proof and technical capabilities'
    },
    services: {
      eyebrow: 'Services',
      title: 'Architecture and engineering to operate in production with confidence'
    },
    projects: {
      eyebrow: 'Projects',
      title: 'Portfolios with technical impact and business outcomes'
    },
    testimonials: {
      eyebrow: 'Testimonials',
      title: 'Results perceived by product and technology leaders',
      previousButton: 'Previous',
      nextButton: 'Next',
      indicatorsAriaLabel: 'Testimonial indicators',
      goToAriaPrefix: 'Go to testimonial'
    },
    cta: {
      eyebrow: 'Ready for the next level?',
      title: 'Let us design the right architecture for your product',
      description: 'Hands-on execution in technical discovery, architecture, implementation, and platform evolution for sustainable growth.'
    }
  }
};

const SHOWCASE_DATA_ES: ArchitectShowcaseData = {
  brand: {
    logoText: 'Cloud Engineer Portfolio',
    logoTagline: 'Software Architecture and Engineering'
  },
  hero: {
    title: 'Arquitectura Cloud (AWS) y Proyectos en Produccion',
    subtitle: 'Liderazgo tecnico para escalar productos con seguridad, reducir costo operativo y acelerar entregas con arquitectura moderna orientada a eventos.',
    primaryLabel: 'Ver Proyectos',
    secondaryLabel: 'Hablar con el Arquitecto',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Panel de arquitectura cloud y monitoreo en produccion'
  },
  architect: {
    name: 'Dayvison Vicente',
    title: 'Arquitecto de Software y Especialista en AWS/Cloud',
    bio: 'Mas de 15 anos en ingenieria de software, liderando equipos para construir plataformas resilientes y seguras, enfocadas en resultados de negocio.',
    photoUrl: SHARED_PHOTO,
    highlights: [
      'Arquitectura orientada a eventos',
      'Gobernanza y seguridad cloud',
      'FinOps y optimizacion de costos',
      'Observabilidad de punta a punta'
    ]
  },
  metrics: [
    { label: 'Anos de experiencia', value: '15+' },
    { label: 'Especialidad principal', value: 'AWS Cloud' },
    { label: 'Modelo de arquitectura', value: 'Serverless' },
    { label: 'Disciplina financiera', value: 'FinOps' },
    { label: 'Pilar tecnico', value: 'Seguridad' },
    { label: 'Objetivo operativo', value: 'Alta disponibilidad' }
  ],
  logos: ['SaaS', 'Marketplace', 'HealthTech', 'EdTech', 'FinTech', 'Logistica', 'Capital Markets & Structured Products Expertise', 'Payments'],
  services: [
    {
      title: 'Especialista en Cloud (AWS)',
      description: 'Arquitectura escalable, segura y observable para sistemas criticos, con disenos tecnicos listos para crecimiento real de trafico.',
      bullets: [
        'Landing zones, IAM y red con buenas practicas',
        'Escalabilidad horizontal con servicios administrados',
        'Monitoreo, logs y alertas accionables',
        'Seguridad by design desde el inicio'
      ],
      iconKey: 'cloud',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Correos profesionales y envio de emails',
      description: 'Implementacion de correo profesional en el dominio de la empresa y flujos transaccionales de alta entregabilidad.',
      bullets: [
        'Correo corporativo con dominio propio',
        'Flujos de bienvenida, recuperacion de clave y recibos',
        'SPF, DKIM y DMARC para reputacion del dominio',
        'Monitoreo de rebote, apertura y clics'
      ],
      iconKey: 'email',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Notificaciones',
      description: 'Comunicacion omnicanal con trazabilidad completa para eventos de negocio y el recorrido del cliente.',
      bullets: [
        'Canales por email, push y SMS/WhatsApp',
        'Colas y eventos para resiliencia de envio',
        'Reprocesamiento seguro y auditoria',
        'Dashboards de entrega y latencia por canal'
      ],
      iconKey: 'notification',
      imageUrl: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Integracion de pagos',
      description: 'Implementacion de pagos enfocada en conversion, seguridad y conciliacion confiable para operaciones digitales.',
      bullets: [
        'Checkout con boleto, Pix, tarjeta de credito y Bitcoin',
        'Webhooks firmados y procesamiento idempotente',
        'Consolidacion de estados y conciliacion financiera',
        'Capas antifraude y cumplimiento de datos'
      ],
      iconKey: 'payment',
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Servicios de IA actualizados',
      description: 'Aplicacion practica de IA para atencion, automatizacion y ganancia de productividad integrada con sistemas existentes.',
      bullets: [
        'Chatbots y asistentes para atencion 24/7',
        'RAG y base de conocimiento para respuestas contextualizadas',
        'Automatizacion de procesos internos y operativos',
        'Integracion con CRM, ERP y herramientas de soporte'
      ],
      iconKey: 'ai',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Reduccion de costos y migracion a Serverless',
      description: 'Evolucion de infraestructura hacia AWS Lambda y servicios administrados con foco directo en costo, elasticidad y time-to-market.',
      bullets: [
        'Mapeo de cargas y estrategia de migracion',
        'Arquitectura orientada a eventos para reducir acoplamiento',
        'Aprovechamiento de beneficios free/de bajo costo cuando aplique (AWS Free Tier)',
        'Gobernanza continua de costos con FinOps'
      ],
      iconKey: 'serverless',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  projects: [
    {
      name: 'Plataforma de Donaciones de Alta Escala',
      summary: 'Ecosistema de recaudacion con checkout multimodal, notificaciones en tiempo real y panel operativo.',
      stack: ['Angular', 'Node.js', 'AWS Lambda', 'API Gateway', 'DynamoDB'],
      highlights: ['Latencia promedio por debajo de 200ms', 'Arquitectura event-driven', 'Observabilidad centralizada'],
      links: [
        { label: 'Ver caso', url: '#projetos' },
        { label: 'Arquitectura tecnica', url: '#servicos' }
      ]
    },
    {
      name: 'Motor de Notificaciones Omnicanal',
      summary: 'Pipeline unificado para envios transaccionales en multiples canales con reintentos y trazabilidad.',
      stack: ['TypeScript', 'SQS', 'SNS', 'SES', 'CloudWatch'],
      highlights: ['99.9% de disponibilidad', 'Reintentos inteligentes', 'Auditoria de punta a punta'],
      links: [
        { label: 'Ver proyecto', url: '#projetos' },
        { label: 'Solicitar demo', url: '#contato' }
      ]
    },
    {
      name: 'Asistente IA para Operaciones',
      summary: 'Asistente conectado a base de conocimiento para soporte tecnico y automatizacion de tareas repetitivas.',
      stack: ['Angular', 'API REST', 'Vector Search', 'Pipelines de IA'],
      highlights: ['Atencion 24/7', 'RAG con contexto de negocio', 'Integracion con sistemas legados'],
      links: [
        { label: 'Ver flujos', url: '#depoimentos' },
        { label: 'Hablar con especialista', url: '#contato' }
      ]
    }
  ],
  testimonials: [
    {
      quote: 'Nuestra migracion a serverless redujo costos y elimino cuellos de botella de despliegue. El equipo entrego arquitectura y ejecucion con alto nivel tecnico.',
      name: 'Mariana Costa',
      role: 'CTO',
      company: 'Nexa Commerce'
    },
    {
      quote: 'La integracion de pagos con webhooks confiables resolvio problemas historicos de conciliacion y mejoro la experiencia de checkout.',
      name: 'Eduardo Martins',
      role: 'Head de Producto',
      company: 'Pulse Fintech'
    },
    {
      quote: 'El proyecto de notificaciones e IA elevo nuestra atencion y trajo visibilidad operativa real con metricas accionables.',
      name: 'Carla Ribeiro',
      role: 'Directora de Operaciones',
      company: 'Orbit Health'
    }
  ],
  cta: {
    primaryLabel: 'Agendar conversacion',
    secondaryLabel: 'Solicitar presupuesto',
    note: 'Ver portfolio completo'
  },
  text: {
    metrics: {
      ariaLabel: 'Prueba social y capacidades tecnicas'
    },
    services: {
      eyebrow: 'Servicios',
      title: 'Arquitectura e ingenieria para operar en produccion con confianza'
    },
    projects: {
      eyebrow: 'Proyectos',
      title: 'Portfolios con impacto tecnico y resultado de negocio'
    },
    testimonials: {
      eyebrow: 'Testimonios',
      title: 'Resultados percibidos por lideres de producto y tecnologia',
      previousButton: 'Anterior',
      nextButton: 'Siguiente',
      indicatorsAriaLabel: 'Indicadores de testimonios',
      goToAriaPrefix: 'Ir al testimonio'
    },
    cta: {
      eyebrow: 'Listo para el siguiente nivel?',
      title: 'Disenemos la arquitectura ideal para tu producto',
      description: 'Ejecucion directa en discovery tecnico, arquitectura, implementacion y evolucion de plataforma para crecimiento sostenible.'
    }
  }
};

export const ARCHITECT_SHOWCASE_DATA_BY_LANGUAGE: Record<ShowcaseLanguage, ArchitectShowcaseData> = {
  pt: SHOWCASE_DATA_PT,
  en: SHOWCASE_DATA_EN,
  es: SHOWCASE_DATA_ES
};
