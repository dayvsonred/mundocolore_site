import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface LegalItem {
  id: string;
  title: string;
  content: string[];
}

@Component({
  selector: 'app-legal',
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.css']
})
export class LegalComponent implements OnInit {
  items: LegalItem[] = [
    {
      id: 'termos',
      title: 'Termos',
      content: [
        'A plataforma ThePureGrace oferece serviços para criar e apoiar campanhas de doação, com foco em transparência, segurança e impacto social.',
        'Ao acessar e utilizar o site, você concorda com estes Termos de Uso e com as políticas aplicáveis, incluindo privacidade e cookies.',
        'Elegibilidade: você deve ter pelo menos 18 anos ou autorização legal para criar campanhas ou realizar doações.',
        'Campanhas de terceiros: a plataforma permite campanhas criadas por terceiros. O organizador é responsável pelo conteúdo, veracidade das informações e uso dos recursos arrecadados.',
        'Doações e pagamentos: os pagamentos são processados pela Stripe ou por parceiros autorizados. Ao doar, você concorda com os termos do provedor de pagamento.',
        'Taxas: podem existir taxas administrativas e encargos governamentais. Essas taxas podem variar conforme o método de pagamento, localidade e regras vigentes.',
        'Reembolsos: pedidos de reembolso são analisados caso a caso, conforme a política de doações e a legislação aplicável.',
        'Uso proibido: é vedado criar campanhas fraudulentas, enganosas, ilegais ou que violem direitos de terceiros.',
        'Termo de uso de conteúdo do usuário: ao publicar textos, imagens, vídeos ou campanhas, você declara que possui os direitos necessários, autorização do titular ou base legal válida para uso e divulgação.',
        'Proibição de conteúdo de terceiros sem autorização: é proibido publicar campanhas, fotos, marcas, nomes, obras ou qualquer material de terceiros sem permissão expressa do titular dos direitos.',
        'Responsabilidade do usuário: o usuário é integralmente responsável pelo conteúdo publicado, incluindo veracidade, titularidade, autorizações e eventuais danos causados a terceiros.',
        'Direitos autorais e retirada de conteúdo: a plataforma pode remover, bloquear ou suspender conteúdos e contas mediante denúncia ou suspeita de infração de direitos autorais, imagem, marca, privacidade ou uso indevido de doações.',
        'Isenção e indenização: na extensão permitida por lei, a plataforma não se responsabiliza por conteúdo de usuário nem por violações cometidas por usuários, e o usuário concorda em indenizar a plataforma por reclamações de terceiros decorrentes de suas publicações.',
        'Licença de uso para operação da plataforma: ao enviar conteúdo, você concede licença não exclusiva para hospedar, exibir, reproduzir e distribuir esse conteúdo apenas para operação, segurança, moderação e promoção da própria plataforma.',
        'Moderação: a ThePureGrace pode revisar, suspender ou remover campanhas e contas que violem estes termos, por motivos legais ou de segurança.',
        'Disponibilidade: o serviço pode ser alterado, suspenso ou descontinuado a qualquer momento por razões técnicas ou legais.',
        'Jurisdicional: estes termos são regidos pelas leis do Brasil, sem prejuízo de aplicação de leis locais quando o serviço for utilizado em outros países.',
        'Atualizações: podemos atualizar estes termos periodicamente. A continuidade do uso indica concordância com as mudanças.'
      ]
    },
    {
      id: 'termo-de-uso',
      title: 'Termo de uso de conteúdo e direitos autorais',
      content: [
        'Ao publicar qualquer campanha, texto, imagem, vídeo, logotipo, marca ou documento, o usuário declara que é o titular dos direitos ou possui autorização legal válida para uso e divulgação do conteúdo.',
        'É proibido publicar campanhas de terceiros sem consentimento, bem como utilizar imagens, nomes, marcas ou obras de terceiros sem autorização.',
        'O usuário é o único responsável pelo conteúdo que publica, incluindo veracidade das informações, origem do material e eventuais violações de direitos autorais, direito de imagem, privacidade ou outros direitos de terceiros.',
        'A plataforma pode, a qualquer momento, remover conteúdo, limitar alcance, bloquear campanha, suspender conta e cooperar com autoridades quando houver denúncia, indício de fraude ou suspeita de infração legal.',
        'Na extensão permitida pela lei, a plataforma não é responsável por danos causados por conteúdo publicado por usuários e não garante a legitimidade de materiais enviados por terceiros.',
        'O usuário concorda em defender, indenizar e isentar a plataforma por reclamações, perdas, custos e danos decorrentes de conteúdo que tenha publicado ou de uso indevido da plataforma.',
        'Ao enviar conteúdo, o usuário concede licença não exclusiva para armazenamento, exibição e processamento técnico do material para operação, segurança, moderação e divulgação da própria plataforma.'
      ]
    },
    {
      id: 'privacidade',
      title: 'Aviso de Privacidade',
      content: [
        'Coletamos apenas os dados necessários para processar doações e melhorar sua experiência.',
        'Seus dados são protegidos com práticas de segurança e não são vendidos a terceiros.',
        'Você pode solicitar acesso, correção ou exclusão de dados a qualquer momento.'
      ]
    },
    {
      id: 'legal',
      title: 'Informações de caráter legal',
      content: [
        'Atuamos em conformidade com a legislação vigente sobre doações, pagamentos e proteção de dados.',
        'Parcerias e campanhas passam por validações para garantir legitimidade e segurança.',
        'Em caso de dúvidas legais, entre em contato com nossa equipe de suporte.'
      ]
    },
    {
      id: 'cookies',
      title: 'Política de cookies',
      content: [
        'Usamos cookies para melhorar a navegação, medir desempenho e personalizar a experiência.',
        'Você pode gerenciar ou desativar cookies no seu navegador, sem comprometer funções essenciais.',
        'Ao continuar usando o site, você concorda com o uso de cookies conforme esta política.'
      ]
    },
    {
      id: 'termosbr',
      title: 'TERMOS DE SERVIÇO – THEPUREGRACE Última atualização: 2025',
      content: [
'1.  INTRODUÇÃO',
'',
'1.1 Objetivo Bem-vindo ao THEPUREGRACE. Estes Termos regulam o uso da',
'Plataforma digital THEPUREGRACE, incluindo site, aplicações móveis,',
'APIs, integrações e funcionalidades relacionadas.',
'',
'1.2 Parte Contratante Estes Termos são celebrados entre o Usuário e',
'THEPUREGRACE TECNOLOGIA LTDA, CNPJ nº [●], com sede em [Cidade/Estado],',
'Brasil. Usuários internacionais poderão ser atendidos por afiliadas ou',
'subsidiárias futuras.',
'',
'1.3 Natureza da Plataforma O THEPUREGRACE é uma plataforma tecnológica',
'de intermediação digital. Não é banco, instituição financeira, ONG ou',
'consultoria financeira.',
'',
'2.  DEFINIÇÕES Usuário: pessoa física ou jurídica que utiliza a',
'    Plataforma. Organizador: usuário que cria campanha. Doador: usuário',
'    que realiza doação. Beneficiário: destinatário dos valores',
'    arrecadados. Plataforma: ambiente digital THEPUREGRACE. Serviços:',
'    funcionalidades disponibilizadas na Plataforma.',
'',
'3.  SERVIÇOS PRESTADOS A Plataforma permite criação de campanhas e',
'    recebimento de doações via processadores de pagamento. O',
'    THEPUREGRACE não garante sucesso de arrecadações.',
'',
'4.  CONTA E ELEGIBILIDADE Usuários devem ter 18 anos ou mais e fornecer',
'    informações verdadeiras. São responsáveis pela segurança de suas',
'    credenciais.',
'',
'5.  PROCESSADORES DE PAGAMENTO As doações são processadas por terceiros',
'    como Stripe e PayPal. Taxas de processamento são aplicadas conforme',
'    regras do processador. O THEPUREGRACE pode reter valores',
'    temporariamente para prevenção a fraude.',
'',
'6.  RESPONSABILIDADES Organizadores devem utilizar recursos conforme',
'    descrito na campanha. Usuários são responsáveis por obrigações',
'    fiscais.',
'',
'7.  TRANSFERÊNCIAS E RETENÇÕES Transferências dependem do processador.',
'    Contas suspeitas podem ser suspensas. Valores não sacados podem ser',
'    devolvidos após 120 dias.',
'',
'8.  ARRECADAÇÕES PROIBIDAS Proibido arrecadar para atividades ilegais,',
'    fraudes, drogas ilícitas, lavagem de dinheiro, jogos de azar não',
'    autorizados ou atividades que violem a LGPD.',
'',
'9.  CONDUTA PROIBIDA Proibido uso de bots, manipulação de campanhas, uso',
'    indevido da Stripe ou conversão direta para criptomoedas para',
'    entrega ao beneficiário.',
'',
'10. MODERAÇÃO O THEPUREGRACE pode remover conteúdo, suspender contas e',
'    cooperar com autoridades.',
'',
'11. TARIFAS Atualmente não há taxa de plataforma. Taxas de processamento',
'    são aplicadas pelo processador de pagamento.',
'',
'12. PROPRIEDADE INTELECTUAL Marca e tecnologia pertencem ao',
'    THEPUREGRACE. É proibida engenharia reversa e uso indevido.',
'',
'13. PROTEÇÃO DE DADOS Tratamento de dados conforme LGPD (Lei',
'    13.709/2018). Usuários possuem direitos previstos no Art. 18 da',
'    LGPD.',
'',
'14. INTELIGÊNCIA ARTIFICIAL Recursos de IA podem ser utilizados.',
'    Conteúdo gerado é responsabilidade do Usuário.',
'',
'15. SERVIÇOS DE TERCEIROS Integrações com terceiros não geram',
'    responsabilidade por falhas externas.',
'',
'16. SUSPENSÃO OU ENCERRAMENTO Contas podem ser suspensas por violação',
'    destes Termos ou suspeita de fraude.',
'',
'17. LIMITAÇÃO DE RESPONSABILIDADE Responsabilidade limitada ao valor',
'    pago nos últimos 6 meses ou R$ 500,00, o que for maior, na forma da',
'    lei.',
'',
'18. INDENIZAÇÃO Usuário indenizará o THEPUREGRACE por danos decorrentes',
'    de uso indevido.',
'',
'19. RESOLUÇÃO DE DISPUTAS Aplicam-se as leis da República Federativa do',
'    Brasil. Foro eleito: Comarca de [Cidade/Estado].',
'',
'20. ALTERAÇÕES Estes Termos podem ser atualizados a qualquer momento.',
'    Uso contínuo implica aceitação.',
'',
'21. DISPOSIÇÕES GERAIS 21.1 Acordo Integral 21.2 Lei Aplicável – Brasil',
'    21.3 Separabilidade 21.4 Força Maior 21.5 Cessão 21.6 Avisos',
'    eletrônicos 21.7 Relação com futura Associação 21.8 Expansão',
'    Internacional 21.9 Independência jurídica entre Plataforma e futura',
'    Associação 21.10 Controles de Exportação aplicáveis',

      ]
    },
    {
      id: 'serviço',
      title: 'Termos de Serviço',
      content: [
        '1. Introdução',
'1.1. Objetivo dos Termos: boas-vindas ao THEPUREGRACE! Estes Termos de Serviço, os quais podem ser atualizados periodicamente, aplicam-se à Plataforma do THEPUREGRACE, incluindo nosso site em www.THEPUREGRACE.com, aplicativos móveis e quaisquer novos recursos que possamos adicionar. Estes Termos de Serviço são importantes porque definem a nossa relação com você ao usar a Plataforma. “THEPUREGRACE”, “nós”, “nos/conosco”, “nosso(a)(s)”, e outros termos semelhantes referem-se à parte com a qual você está contratando.',
'1.2. Aceitação dos Termos: ao usar qualquer um dos Serviços ou a Plataforma, você concorda com estes Termos de Serviço. Isso significa que você entende e aceita todas as regras de uso dos nossos Serviços. Se você estiver contribuindo para uma Arrecadação de fundos como Doador, iniciando uma Arrecadação de fundos, retirando fundos como Organizador ou Beneficiário ou interagindo com os serviços de alguma outra forma, estes termos se aplicam a você. Dependendo de onde você mora, você pode firmar este acordo com diferentes entidades do THEPUREGRACE. Se estiver localizado nos EUA, você está firmando contrato com a THEPUREGRACE. Se você estiver na Austrália, estará contratando a THEPUREGRACE Australia PTY Ltd. Se estiver no Reino Unido ou na Irlanda do Norte, estará contratando a THEPUREGRACE International Services UK Ltd. Se você estiver localizado em qualquer outro lugar do mundo, está firmando contrato com a THEPUREGRACE Ireland Limited. No entanto, a THEPUREGRACE, Inc. poderá aplicar e exercer nossos direitos previstos nestes Termos de Serviço em nome da parte com a qual você está contratando. Consulte a parte inferior destes Termos de Serviço para obter os endereços e as informações de contato de cada uma dessas pessoas jurídicas do THEPUREGRACE.',

'1.3. Breve Observação sobre Arbitragem: se estiver usando o THEPUREGRACE nos EUA, na Austrália ou no Canadá, você precisa conhecer nosso acordo de arbitragem. Ao usar nossos Serviços, você concorda que, se houver um desacordo ou problema jurídico entre você e o THEPUREGRACE, ele será resolvido por meio de arbitragem vinculante, e não no tribunal.  Você também renuncia ao seu direito de fazer parte de uma ação coletiva ou de julgamento com júri. Leia a seção “Resolução de Disputas e Arbitragem” destes Termos de Serviço para maiores informações.',

'2. Definições',
'Estes são os principais termos que você precisa saber e que serão mencionados nestes Termos de Serviço:',

'2.1. Conta: uma conta exclusiva criada por um usuário para acessar e utilizar os Serviços do THEPUREGRACE, que inclui informações pessoais, credenciais e registros de atividades. Isso não inclui Contas de Apoiador criadas em sites de ONG desenvolvido pelo THEPUREGRACE Pro.',

'2.2. Empresas Afiliadas: qualquer pessoa jurídica que, direta ou indiretamente, controle, seja controlada por ou esteja sob controle comum do THEPUREGRACE. Isso inclui subsidiárias, empresas controladoras e quaisquer outras pessoas jurídica relacionadas.',

'2.3. Provedores de serviços de IA: terceiros que implementam, fornecem ou dão suporte a ferramentas, sistemas, modelos ou infraestrutura de inteligência artificial usados pelo THEPUREGRACE para habilitar recursos ou funcionalidades relacionados à IA em conexão com os Serviços, incluindo, mas não se limitando a, ferramentas usadas para gerar texto, imagens, vídeos ou outro conteúdo do Usuário.',

'2.4. Beneficiário: pessoa física, pessoa jurídica ou o grupo em benefício de quem a Arrecadação de fundos correspondente é realizada e que é o destinatário pretendido dos fundos arrecadados.',

'2.5. Organização sem fins lucrativos certificada: qualquer organização sem fins lucrativos que tenha se cadastrado com êxito no Stripe Fund para receber doações.',

'2.6. Doador: qualquer pessoa física ou jurídica que contribua com fundos para uma Arrecadação de fundos nos Serviços ou por meio deles.',

'2.7. Arrecadação de fundos: uma arrecadação iniciada nos Serviços com a meta de arrecadar fundos para um objetivo específico a um Beneficiário.',

'2.8. THEPUREGRACE Pro: um conjunto de ferramentas, serviços e soluções de tecnologia de arrecadação de fundos fornecidos pelo THEPUREGRACE e suas Afiliadas para ONGs. Isso inclui tanto (a) a Plataforma THEPUREGRACE Pro (por exemplo, os sites, aplicativos e plataforma em nuvem, bem como os dados, informações, ferramentas e funcionalidades associados, que possibilitam as capacidades de arrecadação de fundos online da ONG, seja por meio de doações diretas, leilões, transmissões ao vivo ou outras tecnologias), quanto (b) os serviços relacionados ao THEPUREGRACE Pro (por exemplo, implementação, planejamento do site, configuração, integração ou implantação da Plataforma THEPUREGRACE Pro, gerenciamento de projetos e outros serviços de consultoria ou suporte). O THEPUREGRACE Pro é fornecido sob contratos separados entre o THEPUREGRACE e a ONG ou pessoa jurídica aplicável.',

'2.9. Mensagens: comunicações entre usuários enviadas por meio dos recursos de Mensagens na plataforma, que podem incluir texto, links, imagens ou outras mídias. As mensagens são distintas do conteúdo do Usuário e geralmente podem ser visualizadas apenas pelo remetente e pelos destinatários pretendidos, mas podem ser monitoradas, analisadas ou removidas pelo THEPUREGRACE como parte de nossos controles de proteção e moderação de conteúdo.',

'2.10. ONG: uma organização sem fins lucrativos (incluindo igrejas, universidades ou outras instituições de ensino) estabelecida para fins beneficentes segundo as leis aplicáveis e qualificada para receber doações por meio da Plataforma.',

'2.11. Site da ONG: um site, página de doações ou outra propriedade online criada ou operada por uma ONG de terceiro que usa o THEPUREGRACE Pro e por meio da qual os Usuários podem acessar, registrar-se ou fazer doações para a ONG. Embora um site da ONG possa ser identificado com o logotipo da ONG ou aparecer no domínio dela própria, as partes do site da ONG movimentado pela tecnologia do THEPUREGRACE (incluindo quaisquer páginas de doação) são regidas por estes Termos de Serviço.',

'2.12. Organizador: uma pessoa física ou jurídica (como uma organização sem fins lucrativos) que inicie e gerencie uma arrecadação de fundos na Plataforma.',

'2.13. Plataforma: todo o conjunto de Serviços online oferecidos pelo THEPUREGRACE e suas Afiliadas, incluindo o nosso site, os aplicativos móveis e qualquer software, serviços ou tecnologias relacionados, inclusive o THEPUREGRACE Pro.',

'2.14. Perfil: um recurso que permite aos Usuários compartilhar suas atividades no THEPUREGRACE com outros Usuários, incluindo Arrecadações de fundos que criaram ou para as quais doaram (a menos que a doação tenha sido anônima), acompanhar atividades no THEPUREGRACE ou destacar causas ou organizações com as quais se importam mais, além de seguir e interagir com outros Usuários.',

'2.15. Taxa recorrente: uma taxa fixa recorrente que podemos cobrar quando o doador configura uma doação recorrente para uma Arrecadação de fundos. Para saber mais sobre a Plataforma e a taxa recorrente em questão, acesse Preços do THEPUREGRACE.',

'2.16. Serviços: todos os recursos, funcionalidades e ferramentas oferecidos pelo THEPUREGRACE e suas Afiliadas por meio de sua Plataforma, permitindo que os Usuários criem e gerenciem Arrecadações de fundos, perfis, façam doações e interajam entre eles, incluindo o THEPUREGRACE Pro.',

'2.17. Conteúdo dos Serviços: todo o conteúdo e materiais fornecidos pelo THEPUREGRACE nos Serviços, inclusive textos, gráficos, logotipos, imagens e software, inclusive o THEPUREGRACE Pro, exceto o conteúdo do Usuário.',

'2.18. Software: o software e os aplicativos proprietários, incluindo cookies e tecnologias semelhantes, fornecidos e de propriedade da THEPUREGRACE que permitem aos usuários acessar e usar os Serviços.',

'2.19. Conta de Apoiador: conta criada por um Usuário em um site de ONG, disponibilizada pela THEPUREGRACE Pro, que pode permitir ao Usuário fazer doações, inscrever-se em eventos, acompanhar doações ou gerenciar atividades de arrecadação de fundos ou de doação. As contas de Apoiador são diferentes de contas na Plataforma THEPUREGRACE.',

'2.20. Recursos de terceiros: quaisquer sites, Serviços de terceiros, conteúdo, software, aplicativos, cookies e tecnologias semelhantes ou outros produtos ou recursos oferecidos por entidades que não sejam o THEPUREGRACE ou suas Afiliadas, os quais podem ser acessados por meio dos Serviços.',

'2.21. Tarifa de processamento de transações: uma tarifa cobrada pelo THEPUREGRACE ou por seus processadores de pagamento para processar doações. Para obter mais informações sobre a Plataforma e as tarifas de processamento de transações aplicáveis, acesse os Preços do THEPUREGRACE.',

'2.22. Transferências: o processo de movimentação de fundos arrecadados por meio dos Serviços, sob orientação do Beneficiário, para (i) a conta bancária do Beneficiário ou para (ii) outra conta designada pelo Beneficiário, que pode ser um de nossos parceiros para a entrega de um vale-presente ao Beneficiário para a totalidade ou parte dos fundos arrecadados.',

'2.23. Usuário: qualquer pessoa física ou jurídica que acesse, cadastre-se ou utilize a Plataforma, incluindo os Organizadores, Doadores e Beneficiários.',

'2.24. Conteúdo do Usuário: qualquer conteúdo, atividade ou informação, inclusive seu nome, mensagem de texto, imagens, vídeos e outros materiais que um Usuário publique, faça upload, envie ou de outra forma disponibilize ou compartilhe com outros Usuários nos ou através dos Serviços, inclusive com relação a alguma Arrecadação de fundos ou perfil, independentemente de tal conteúdo ser gerado usando inteligência artificial.',

'2.25. Conduta do Usuário: os comportamentos e as ações dos usuários ao usar ou acessar os Serviços.',

'3. Os Serviços que Prestamos',
'3.1. Descrição dos Serviços prestados: oferecemos uma Plataforma para pessoas físicas, jurídicas ou organizações sem fins lucrativos criarem Arrecadações de fundos para coletar doações monetárias de Doadores para si próprios, um Beneficiário terceiro ou uma ONG. Também oferecemos um recurso de Perfil que permite aos usuários compartilhar informações sobre suas atividades de arrecadação de fundos, destacar ou seguir causas que apoiam.',

'3.2. Nosso Função e Limitações: Nossos Serviços são uma ferramenta para realizar arrecadações e ajudar os organizadores a se conectarem com doadores; não somos um banco, processador de pagamentos, corretor, instituição de caridade ou consultor financeiro. Não solicitamos doações. A existência dos Serviços não é uma solicitação de doações e não participamos em atividades de solicitação para nós mesmos ou para terceiros em nossa Plataforma.  Não atuamos, nem pretendemos atuar, em nenhuma capacidade que exija registro, licenciamento ou conformidade como um captador de recursos profissional, captador de recursos comercial ou consultor profissional de captação de recursos em nenhum estado dos EUA, conforme tais condições são definidas pelas leis aplicáveis. Todas as informações fornecidas por meio de nossos Serviços são para seu conhecimento geral e não são fornecidas com a pretensão de serem aconselhamento profissional.  Se você precisar de aconselhamento específico, especialmente em relação a questões financeiras, jurídicas ou fiscais, consulte um profissional. Não controlamos nem endossamos nenhum Usuário, Arrecadador de Fundos ou causa, e não podemos garantir o sucesso de uma Arrecadação de Fundos.  Como Doador, cabe a você decidir se vale a pena contribuir para uma causa.',

'3.3. Modificação, suspensão ou rescisão dos Serviços: podemos alterar, pausar ou interromper todos ou alguns dos Serviços a qualquer momento e por qualquer motivo. Tentaremos evitar eventuais problemas que isso possa causar a você ou a outras pessoas, mas, às vezes, pode não ser possível avisa-lo com antecedência, especialmente se for uma emergência ou se exigido por lei. Não somos responsáveis e expressamente nos isentamos de toda a responsabilidade por quaisquer problemas ou supostas indenizações que essas alterações possam causar. Além disso, para aprimorar e personalizar sua experiência, podemos realizar testes, incluindo testes A/B, que envolvem a exibição de diferentes versões de nossos Serviços aos nossos usuários para avaliar e melhorar nossos Serviços e nosso desempenho.',

'3.4 Arrecadações de fundos e Perfis recomendados: quando você pesquisa ou navega no THEPUREGRACE, os resultados podem ser classificados com base em fatores como sua localização, contatos que você possa ter compartilhado conosco, a categoria da arrecadação de fundos ou uma causa, se concluirmos que você tenha interesse, proximidade da sua meta de arrecadação de fundos e há quanto tempo recebeu doações. Esses parâmetros nos ajudam a personalizar sua experiência e facilitar a localização de arrecadações de fundos que possam ser do seu interesse. Você pode usar filtros para influenciar como as arrecadações de fundos são exibidas para você.',

'4. Criação de Conta e Exigências de Elegibilidade',
'4.1. O que você precisa para o cadastro: ao cadastrar-se para usar determinados Serviços, você precisa fornecer informações corretas e completas a seu respeito. Isso inclui seu nome conforme consta em um documento oficial emitido pelo governo, seu endereço, número de telefone, profissão, data de nascimento e quaisquer fotos ou vídeos que você possa fornecer, caso esteja organizando uma Arrecadação de fundos ou adicionando informações ao seu perfil. É importante manter essas informações sempre atualizadas, para assegurar que tudo corra bem. Nosso Aviso de Privacidade e estes Termos de Serviço regem os dados de cadastro e outras informações fornecidas por você. O THEPUREGRACE oferece dois tipos de conta de usuário, dependendo de onde você acessa nossos Serviços: (1) conta usada para acessar e interagir com a Plataforma THEPUREGRACE; e (2) conta de Apoiador, que pode ser criada ao doar ou interagir com uma ONG por meio do site da ONG disponibilizado pelo THEPUREGRACE Pro. Cada tipo de conta está sujeito a estes Termos de Serviço, mas pode oferecer funções e acesso diferentes.',

'4.2. Conformidade com Serviços de Terceiros: Talvez você também precise se cadastrar em processadores de pagamento de terceiros com os quais trabalhamos, o que pode envolver a concordância com seus termos (fornecidos na seção Processador de Pagamento abaixo). Se, a qualquer momento, nós ou nossos processadores de pagamento descobrirmos que as informações que você nos forneceu estão incorretas, violam nossos Termos de Serviço ou os termos de serviço de nossos processadores de pagamento, ou se você usar indevidamente os fundos, poderemos suspender ou encerrar imediatamente seu acesso a todos ou a alguns de nossos Serviços. Você também poderá enfrentar processos criminais das autoridades governamentais aplicáveis.',

'4.3. Restrições de idade: se você tiver menos de 18 anos, está proibido de usar nossa Plataforma ou nossos Serviços. Ao utilizar nossa Plataforma ou nossos Serviços, você declara e garante que é maior de 18 anos. Não obstante o disposto acima, menores de 18 anos podem ser Beneficiários de Arrecadações de fundos em nossa Plataforma, desde que em conformidade com a Seção 9.4 abaixo.',

'4.4. Como Manter sua Conta Segura:  Você é responsável por manter a sua senha e as informações da conta em confidencialidade. Não compartilhe sua senha com ninguém. Caso acredite que alguém utilizou a sua Conta ou a Conta de Apoiador sem sua permissão, nos informe imediatamente.  Além disso, lembre-se sempre de sair da sua Conta ou Conta de Apoiador ao encerrar seu uso, especialmente se você estiver em um computador ao qual terceiros também tenham acesso.  Caso você deixe de manter sua Conta e/ou Conta de Apoiador segura e de cumprir estes Termos de Serviço, o THEPUREGRACE não será responsável por quaisquer prejuízos que possam ser incorridos a você. Para mais informações sobre como manter sua Conta e/ou Conta de Apoiador segura, acesse a página de segurança da Conta.',

'4.5. Serviços para dispositivos móveis e mensagens de texto: os Serviços incluem determinados recursos disponibilizados por meio de um dispositivo móvel, inclusive a capacidade de: (i) fazer upload de conteúdo do Usuário para a Plataforma; (ii) navegar na Plataforma; e, (iii) acessar certos itens por meio de um aplicativo baixado e instalado em um dispositivo móvel (coletivamente, os “Serviços para dispositivos móveis”). Na medida em que você acessar os Serviços Móveis, sua operadora de celular poderá cobrar tarifas padrão, tarifas de dados e outras tarifas aplicáveis. Além disso, determinadas operadoras podem proibir baixar, instalar ou usar determinados Serviços Móveis, e nem todos os Serviços Móveis funcionam com todas as operadoras ou aparelhos. Ao usar os Serviços Móveis, você concorda que poderemos nos comunicar com você em relação a sua conta ou segurança por SMS, MMS, mensagens de texto ou outros meios eletrônicos que poderemos enviar ao seu aparelho móvel, e que certas informações sobre a sua utilização dos Serviços Móveis nos poderão ser comunicadas. Além disso, ao configurar sua Conta do THEPUREGRACE, se você clicar em “Enviar código”, você concorda em receber mensagens de texto automáticas relacionadas à sua conta de ou em nome do THEPUREGRACE no número de telefone informado. Você pode responder STOP [PARE] a essas mensagens de texto para cancelar, salvo para mensagens de texto automatizadas relacionadas à segurança de sua conta. A frequência das mensagens varia. Podem ser aplicadas taxas de dados normais e mensagem. Antes de nos comunicarmos com você dessa forma, nós nos asseguraremos de cumprir todas as exigências adicionais que possam ser pertinentes segundo as leis e regulamentações locais. Caso mude ou desative o número do seu telefone celular, você concorda em atualizar sem demora os dados da sua Conta do THEPUREGRACE para assegurar que suas mensagens não sejam enviadas a quem adquirir o seu número antigo. Além disso, você concorda com os Termos de Serviço de SMS conforme aplicáveis ao referido fornecimento, recebimento e entrega de mensagens de texto pelo THEPUREGRACE.',

'5. Processadores de Pagamentos',
'O THEPUREGRACE, em si, não retém nenhum fundo arrecadado na nossa Plataforma, nem lida com o processamento real dos pagamentos. Em vez disso, usamos processadores de pagamento terceirizados para gerenciar e processar todas as doações para Arrecadações.  Para Transferir fundos de uma Arrecadações, você precisa informar os detalhes da sua conta bancária aos nossos parceiros processadores de pagamento.',

'Ao fazer uma Doação, configurar uma Arrecadação ou aceitar a função de Beneficiário de uma Arrecadação, você concorda com o processamento, o uso, a Transferência ou a divulgação de dados pelos Processadores de Pagamento de acordo com estes Termos de Serviço, bem como com todos e quaisquer termos aplicáveis estabelecidos pelos Processadores de Pagamento em questão.  Nossos Processadores de Pagamento atuais incluem: Adyen LLC (termos e condições da Adyen), Stripe, Inc. (termos de serviço da Stripe) e PayPal, Inc. (termos de serviço do PayPal) e termos do PayPal Giving Fund. Nosso processador de pagamentos atual para Organizadores e Beneficiários localizados no EEE (Espaço Econômico Europeu), Suíça e Reino Unido é a Adyen N.V., a qual tem contrato com a THEPUREGRACE Ireland, Ltd. e a THEPUREGRACE International Services UK Ltd. Consulte os termos e condições da Adyen NV aqui. O parceiro de pagamento do THEPUREGRACE na Austrália é a Adyen Australia. A Adyen Austrália faz contratos com a pessoa jurídica do THEPUREGRACE da Austrália, a THEPUREGRACE Australia Pty Ltd (ACN 627 702 630), a qual é a parte contratante responsável pelas operações que beneficiam o Usuário australiano. Para mais informações, consulte a Guia de Serviços Financeiros Combinados e a Declaração de Divulgação do Produto.',

'Para mais detalhes, inclusive sobre como tratamos os dados com esses processadores de pagamento terceirizados, consulte nosso Aviso de Privacidade, Adyen LLC (termos e condições da Adyen), Stripe, Inc. (termos de serviço da Stripe) e PayPal, Inc. (termos de serviço do PayPal).',

'6. Responsabilidade e Obrigações do Usuário',
'6.1. Organizadores: como Organizador, você declara e garante que todo o conteúdo do Usuário que você fornecer sobre a sua Arrecadação de fundos está correto, completo e claro.Isso se aplica independentemente de o conteúdo do Usuário ser fornecido diretamente por você, por meio de um representante ou gerado por um provedor de serviços de IA ou qualquer outra ferramenta de inteligência artificial. Você é responsável por descrever em sua Arrecadação de fundos como eles serão usados, e por garantir que os fundos arrecadados sejam usados exclusivamente para esse fim específico. Você pode publicar atualizações na sua Arrecadação de fundos para que os Doadores saibam como o dinheiro deles está sendo usado e outras informações relevantes. Se você estiver arrecadando fundos em nome de outra pessoa, deverá garantir que todos os valores arrecadados sejam entregues ao Beneficiário ou utilizados em benefício dele. Ao adicionar um Beneficiário, você abre mão do controle sobre as doações da sua Arrecadação de fundos em favor do Beneficiário. Ao organizar uma Arrecadação de fundos, você concorda em cumprir todas as leis e regulamentações aplicáveis à sua Arrecadação de fundos, incluindo, mas não se limitando, àquelas relacionadas a impostos e doações. Se você estiver usando dados pessoais de qualquer pessoa, incluindo, mas não se limitando a, nome, imagem ou aparência, deverá ter a devida autorização legal dessa pessoa para compartilhá-los conosco e publicá-los nos Serviços. Você também concorda em não fornecer nem oferecer bens ou serviços em troca de doações. Podemos compartilhar informações sobre sua Arrecadação de fundos com os Doadores, o Beneficiário, autoridades legais e conforme descrito em nosso Aviso de Privacidade.',

'(a)  Manutenção de informações corretas: é essencial manter seus detalhes de cadastro corretos e atualizados. Isso inclui a atualização do seu nome, endereço e imagens ou vídeos que você usa para representar a si mesmo ou sua organização. Isso ajuda a manter a transparência e a confiança dos Doadores, além de garantir o cumprimento destes Termos de Serviço e das exigências legais aplicáveis.',

'(b) Você Concorda em Cooperar: Ao organizar uma Arrecadação no THEPUREGRACE, você concorda em cooperar totalmente com qualquer solicitação de evidências que considerarmos necessária para verificar sua conformidade com estes Termos de Serviço.  Nossas solicitações podem incluir, dentre outras, pedir que você: (a) explique como os fundos foram ou serão manuseados; (b) forneça provas documentais das circunstâncias descritas na sua Arrecadação; (c) compartilhe a identidade de qualquer parte que receba, se beneficie ou participe do manuseio de toda ou qualquer parte dos fundos; (d) forneça provas de como os fundos foram ou serão usados; ou  (e) forneça provas de que o terceiro Beneficiário em questão consente com um plano de distribuição de fundos consistente com a descrição da sua Arrecadação.  Reservamo-nos o direito de recusar, condicionar, suspender, congelar ou banir Doações, Contas, Contas de Apoiadores, Arrecadações, Transferências ou outras operações que acreditemos, a nosso critério exclusivo, que possam violar estes Termos de Serviço ou prejudicar os interesses de nossos Usuários, de parceiros comerciais, do público ou do site THEPUREGRACE, ou que exponham você, o site THEPUREGRACE ou terceiros a riscos inaceitáveis para nós.',

'(c) Arrecadações de fundos em um site de ONG desenvolvido pelo THEPUREGRACE Pro: se você criar uma arrecadação de fundos em um site de ONG desenvolvido pelo THEPUREGRACE Pro, podemos fornecer acesso às informações de contato dos Doadores que contribuírem para sua Arrecadação de fundos (a menos que optem por doar anonimamente). Você pode usar essas informações do Doador somente para contatá-los sobre sua atividade de arrecadação de fundos – incluindo futuras atividades de arrecadação de fundos – em apoio à mesma ONG. Você não pode vender, compartilhar ou usar essas informações de doadores para qualquer finalidade não relacionada ou comercial. Você é o único responsável por cumprir todas as leis aplicáveis ao entrar em contato com Doadores, incluindo eventuais exigências de incluir instruções de cancelamento de inscrição ou atender a solicitações de descadastramento, conforme previsto em leis como a CAN-SPAM, o GDPR ou outras legislações semelhantes no local onde o Doador se encontra.',

'6.2. Doadores: ao doar dinheiro no THEPUREGRACE, é sua responsabilidade entender como a doação será utilizada, sendo a doação feita por sua própria conta e risco. Certifique-se de verificar regularmente a página da Arrecadação de fundos para saber das atualizações ou novas informações. Não nos responsabilizamos pelo que os Organizadores prometem ou oferecem em suas próprias Arrecadações de fundos. Também não somos responsáveis por verificar as informações que aparecem nas Arrecadações de fundos, nem garantimos que as doações serão utilizadas de acordo com qualquer finalidade de arrecadação indicada por um Usuário ou pela própria Arrecadação de fundos. No entanto, levamos muito a sério todas as denúncias de fraude ou uso indevido de fundos e tomaremos as medidas adequadas contra qualquer Arrecadador de fundos ou Usuário que violar os nossos Termos de Serviço. Também protegemos os Doadores por meio da Garantia de Doação THEPUREGRACE. A menos que você opte por fazer uma doação anônima, você autoriza o THEPUREGRACE a usar ou compartilhar seu nome ou informações de contato para promover doações correspondentes, sugerir metas de arrecadação de fundos ou para incentivar outras pessoas a doar, desde que, no entanto, o THEPUREGRACE obtenha consentimentos adicionais, se exigido pelas leis aplicáveis.',

'(a)  Como fazer Doações: ao doar para uma Arrecadação ou ONG por meio do THEPUREGRACE ou por um site de uma ONG criado pelo THEPUREGRACE Pro, você precisa utilizar um cartão de crédito ou outro método de pagamento que esteja vinculado à sua Conta ou Conta de Apoiador, conforme aplicável. Você declara e garante que suas informações de pagamento estão corretas e que você está legalmente autorizado a usar seu método de pagamento. Pode haver um valor mínimo para doação e, uma vez realizada a doação, o valor não será reembolsado, a menos que a THEPUREGRACE decida conceder um reembolso conforme a Seção 7.1(b) ou de acordo com a Garantia de Doação THEPUREGRACE. Quando fizer uma doação, salvaremos seu método de pagamento preferido para facilitar futuras doações. Usamos processadores de pagamento terceirizados para processar sua doação. Conforme explicado mais detalhadamente na Seção 5 “Processadores de Pagamento”, ao doar, você também concorda em permitir que nossos processadores de pagamentos tratem suas informações de pagamento de acordo com as regras deles e com estes Termos.  Para saber mais sobre as empresas que usamos para processar pagamentos e suas regras, consulte a seção “Processadores de Pagamento” acima.',

'(b)  Doações Recorrentes:  ao optar por doações recorrentes, você autoriza o THEPUREGRACE e seus fornecedores a realizarem cobrança do seu método de pagamento designado sem sua autorização adicional. Você concorda que o valor da doação que você especificar será cobrado do seu método de pagamento na frequência selecionada (por exemplo, mensalmente) até o que ocorrer primeiro entre (1) a Arrecadação selecionada deixar de ser uma Arrecadação válida e ativa; ou (2) assim que razoavelmente praticável após você optar por cancelar esta doação recorrente. Você poderá cancelar sua doação recorrente a qualquer momento entrando em contato com a nossa Equipe de Atendimento ou por meio do recurso de cancelamento na sua Conta ou Conta de Apoiador como parte dos Serviços. O cancelamento entrará em vigor imediatamente após o recebimento da sua solicitação de cancelamento, e nenhuma outra doação será processada após a data de cancelamento. No entanto, nenhuma doação processada antes do seu cancelamento será reembolsada, salvo se por outros motivos, como a invalidade da arrecadação.',

'(c)  Denúncia de Preocupações:  levamos muito a sério qualquer denúncia de fraude ou uso indevido de fundos.  Para saber mais sobre como lidamos com fraudes e uso indevido, acesse nossa página sobre Como Protegemos Nossa Comunidade. Se você tiver motivos para acreditar que um Usuário ou uma Arrecadação de Fundos não está arrecadando ou usando os fundos para a finalidade declarada, utilize o botão “Denunciar” que está disponível parte inferior de cada Arrecadação de Fundos para alertar nossa equipe sobre esse possível problema, e ele será investigado.',

'(d)  Sem Restrições ao Doar para ONGs: se você doar para uma ONG, seja no THEPUREGRACE ou por meio do Site da ONG, você não poderá decidir exatamente como sua doação será utilizada. Mesmo que você doe para um projeto específico ou diga à ONG como gostaria que sua doação fosse utilizada, essas instruções são apenas sugestões. A ONG tem a palavra final e poderá usar todas as doações a seu critério.',

'(e) Implicações Fiscais de Doações a ONGs:  Ao doar para uma ONG, você deve conversar com um consultor fiscal para saber se a sua doação é dedutível de impostos. O THEPUREGRACE não retém fundos para finalidades fiscais ou outros fins, bem como não garante que suas doações sejam dedutíveis de impostos ou qualificadas para créditos fiscais. O THEPUREGRACE também não será responsável por quaisquer reivindicações ou penalidades avaliadas por autoridades fiscais em relação à forma como sua doação é relatada por você ou por terceiros.',

'(f) Compartilhamos suas informações com ONGs para as quais você doa: em certos casos, podemos compartilhar suas informações pessoais (mesmo que você tenha optado por doar de forma anônima) com a ONG para a qual você doou, de acordo com o nosso Aviso de Privacidade. A ONG poderá usar essas informações apenas para se comunicar com você sobre o cumprimento de obrigações legais e para fins de arrecadação de fundos. O THEPUREGRACE não é responsável pela forma como a ONG usa suas informações.',

'(g) Doações por ACH :  Quando você doa para um Arrecadador de Fundos ou ONG por meio do THEPUREGRACE por uma transação de câmara de compensação automatizada (Automated clearing house, “ACH”), você autoriza o THEPUREGRACE a debitar eletronicamente da conta bancária que você vinculou à sua Conta ou Conta de Apoiador (e, se necessário, creditar eletronicamente sua conta para corrigir quaisquer débitos incorretos).  Você concorda que as transações por ACH que você autoriza estão em conformidade com todas as leis aplicáveis.  Você entende que esta autorização permanecerá em pleno vigor e efeito até que você notifique o Suporte THEPUREGRACE por meio da nossa Central de Ajuda que deseja revogar esta autorização.  Você entende que o THEPUREGRACE exige um aviso prévio de pelo menos dois dias para cancelar esta autorização.',

'(h) Doações feitas em Sites de ONGs criados pelo THEPUREGRACE Pro: o THEPUREGRACE fornece certa tecnologia de arrecadação para ONGs por meio de um conjunto de ferramentas e serviços conhecido como THEPUREGRACE Pro. Ao acessar, usar, cadastrar-se ou fazer uma doação por meio de um Site da ONG, seu uso do Site da ONG e sua atividade de doação serão regidos por estes Termos de Serviço, assim como se você estivesse usando o próprio site ou aplicativo do THEPUREGRACE. Estes Termos se aplicam independentemente de o Site daONG ter a marca da organização beneficente ou estar hospedado em seu próprio domínio.  Para fins de esclarecimento, todos os clientes da ONG que usam o THEPUREGRACE Pro estão sujeitos aos seus próprios contratos separados conosco, que contêm termos relacionados à nossa prestação de serviços a eles.',

'Se você doar para uma arrecadação de fundos criada por um organizador individual em um site de uma ONG, seu nome e endereço de e-mail também poderão ser compartilhados com esse organizador. O Organizador poderá usar essas informações apenas para entrar em contato com você sobre atividades de arrecadação de fundos em apoio à mesma ONG.',

'(i) Processadores de pagamento para ONGs: o THEPUREGRACE fez parceria com o PayPal e, em circunstâncias limitadas, com a Adyen ou Stripe, para doações a ONGs. Embora possa haver exceções, ONGs nos Estados Unidos, Reino Unido, Irlanda, Canadá e Austrália usarão, por padrão, o PayPal Giving Fund para processar Doações feitas por meio dos Serviços. A maneira pela qual as transações são processadas é explicada abaixo. As ONGs em outros países usarão, como padrão, a Adyen ou Stripe. Doações feitas a ONGs usando o THEPUREGRACE Pay para processar transações serão padronizadas para Stripe ou Paypal.',

'(j) PayPal Giving Fund:  nos EUA, as Doações para apoio a ONGs credenciadas serão feitas para o PayPal Giving Fund, uma organização beneficente pública 501(c)(3) registrada no IRS que concede doações. O PayPal Giving Fund recebe Doações dos Usuários como a ONG de registro e, em seguida, de acordo com suas políticas, concede os Fundos à Organização selecionada pelo Organizador e identificada na Arrecadação. Embora o PayPal Giving Fund tome várias medidas para tentar conceder os fundos doados de acordo com a preferência indicada pelo Doador, o PayPal Giving Fund mantém o controle exclusivo de todas as Doações. Se uma ONG credenciada não atender aos termos da Política de certificação de organizações sem fins lucrativos do PayPal Giving Fund e/ou não atender aos padrões de diligence prévia do PayPal Giving Fund para o recebimento de uma concessão de fundos doados a qualquer momento, o PayPal Giving Fund poderá reatribuir os fundos de acordo com sua Política de Entrega de Doações. Quando o PayPal Giving Fund receber a sua Doação, ele a concederá à Organização que você escolher, mas será o PayPal Giving Fund que emitirá o seu recibo fiscal. As doações feitas ao PayPal Giving Fund são regidas pela Política de Privacidade do PayPal Giving Fund e pelos Termos de Serviço do Doador.  As pessoas jurídicas do PayPal Giving Fund fora dos EUA também são ONGs registradas em seus países. Por exemplo, se um Organizador no Reino Unido iniciar uma Arrecadação para uma ONG no Reino Unido, o PayPal atuará como Processador de Pagamento, com o PayPal Giving Fund UK recebendo as Doações.  Em seguida, o PayPal Giving Fund UK concederá os fundos à Organização identificada na Arrecadação de acordo com suas políticas e emitirá um recibo fiscal para todas as Doações recebidas por meio dele.',

'6.3. Responsabilidade Fiscal para Organizadores e Beneficiários: não retemos fundos para finalidades fiscais ou por outros motivos. Você, como Organizador ou Beneficiário é o único responsável pelo pagamento dos devidos impostos relacionados às doações recebidas.  Cabe a você calcular, informar e pagar o valor correto do imposto às autoridades fiscais.',

'6.4. Perfis: ao usar seu perfil, você concorda em aderir a todas as condições relativas ao conteúdo do Usuário e à Conduta do Usuário definidas na Seção 8 (“Arrecadações proibidas e conteúdo do Usuário relacionado”) e na Seção 9 (“Conduta proibida do Usuário”) abaixo. Isso significa, entre outras coisas, que você não pode usar seu Perfil para postar conteúdo enganoso, falso ou ilegal. Não obstante o disposto acima, você pode usar um nome de usuário ou outro identificador em seu Perfil ou no URL público personalizado do seu perfil, mas nos reservamos o direito de removê-lo caso consideremos inadequado (por exemplo, se o titular de uma marca registrada reclamar sobre um nome de usuário ou identificador que não tenha relação direta com seu nome real, ou se ele violar estes Termos de Serviço de qualquer outra forma). O THEPUREGRACE se reserva o direito, a seu exclusivo critério e sem aviso prévio, de suspender seu Perfil e remover ou modificar qualquer conteúdo do Usuário incluído em seu Perfil que viole estes Termos de Serviço. Ao optar por tornar seu Perfil público, você reconhece que as informações do seu Perfil, suas atividades e o conteúdo do Usuário relacionado poderão ficar visíveis para outros Usuários e disponíveis em buscas na Plataforma THEPUREGRACE. Isso significa que seu nome de usuário e/ou nome, foto de perfil, biografia, atividades de arrecadação de fundos e doações, quem você segue e seus seguidores, bem como qualquer outra atividade realizada por você na Plataforma, poderão ficar visíveis para outras pessoas. Ao tornar seu Perfil público, você nos dá permissão para exibir informações associadas a ele – como seu nome de usuário, foto do perfil e interações (por exemplo, curtidas, seguidores) – em conexão com outros conteúdos ou contas, incluindo arrecadações de fundos, postagens públicas e em conteúdo ou outros recursos que aparecem na Plataforma ou por meio dela. Quando seu perfil está definido como privado, apenas informações limitadas, como seu nome, foto, biografia e contagens de seguidores e de pessoas que você segue permanecerão visíveis para outros Usuários, mas o restante de suas atividades na Plataforma THEPUREGRACE não será exibido publicamente. Você pode alterar suas configurações de conta para tornar seu Perfil público ou privado. Para mais informações sobre como seus dados serão coletados e usados, consulte nosso Aviso de Privacidade.',

'6.5. Mensagens: você não pode usar mensagens para assediar, solicitar pagamentos fora da plataforma, enviar spam ou golpes, compartilhar conteúdo ou adotar qualquer conduta que viole estes Termos de Serviço. Suas mensagens podem estar sujeitas a moderação e análise (inclusive por meio de ferramentas automatizadas, como IA) para garantir a proteção da Plataforma e de seus Usuários, assim como para aprimorar nossos Serviços. O THEPUREGRACE se reserva o direito de limitar o acesso às mensagens, remover mensagens ou tomar outras medidas de execução de acordo com estas condições.',

'7. Transferência, Retenções, Reembolsos e Estorno',
'7.1. Transferência: embora nos esforcemos para disponibilizar a Transferência a você prontamente, nossa capacidade de fazer isso depende dos Usuários fornecerem as informações corretas e nossos sistemas técnicos funcionarem como pretendido.  Você reconhece e concorda que: (i) a Transferência pode não estar disponível para uso imediato; (ii) não garantimos que a Transferência estará sempre disponível a você em um prazo específico, mas envidaremos esforços comercialmente razoáveis para fazer a Transferência assim que possível; (iii) você cooperará com qualquer solicitação que fizermos para obter evidências que considerarmos necessárias para verificar sua conformidade com estes Termos de Serviço; e (iv) na medida do permitido por lei, nós nos isentamos expressamente de toda e qualquer responsabilidade por qualquer atraso na Transferência ou pela sua incapacidade de acessar e usar os fundos doados em qualquer momento específico e por quaisquer consequências decorrentes do atraso ou incapacidade.  Envidaremos esforços comercialmente razoáveis para informar você sobre quando poderá receber a Transferência e para definir um prazo claro sempre que possível.',

'(a)  Você precisa fornecer informações corretas: você, como Organizador e/ou Beneficiário, é responsável por (i) verificar suas informações pessoais e de conta bancária em “Configurar transferências” o mais rápido possível; e (ii) assegurar que as informações que você fornece ao THEPUREGRACE e/ou suas Empresas Afiliadas para processar uma Transferência, inclusive informações de conta bancária, sejam corretas e atualizadas.',

'(b) Reembolsos: podemos, a nosso exclusivo critério, oferecer ou emitir um reembolso de Doações, que poderá compreender todo o valor doado a suas Arrecadações. Reembolsos podem ser emitidos com ou sem aviso prévio, dependendo das circunstâncias. Por exemplo, podemos reembolsar doadores com base na prevenção a fraudes, violação dos nossos Termos de Serviço, conformidade com regras de bandeiras de cartão, falta de fornecimento de comprovação solicitada quanto ao cumprimento dos nossos Termos de Serviço, obrigações legais ou outros motivos. Na medida permitida pela legislação aplicável, não seremos responsáveis perante você ou qualquer terceiro por quaisquer reivindicações, indenizações, custos, perdas ou outras consequências causadas por reembolsos, incluindo, mas não se limitando a, taxas de transação ou de saldo negativo. Sujeito à nossa Garantia de Doação THEPUREGRACE, determinaremos a resolução apropriada nos casos em que doadores, organizadores ou beneficiários solicitarem um reembolso. Quando um Beneficiário não quiser os fundos (ou a parte dos fundos que excede a meta da Arrecadação de fundos) e um Organizador ou Beneficiário solicitar um reembolso, ou quando o Beneficiário não concluir as etapas necessárias para retirar os fundos dentro de 120 dias a partir da primeira doação (salvo prorrogação a critério do THEPUREGRACE), o THEPUREGRACE poderá, a seu exclusivo critério, oferecer reembolsos aos doadores ou redirecionar os fundos para uma ONG verificada, cuja missão esteja alinhada com o propósito declarado da Arrecadação de fundos, quando apropriado e permitido por lei. Sempre que possível, notificaremos os doadores e ofereceremos uma oportunidade para que eles solicitem um reembolso antes de redirecionar os fundos para essa ONG. Nada nesta seção modificará ou limitará as condições da Garantia de Doação do THEPUREGRACE de forma alguma.',

'(c)  Transferência de Fundos em até 120 Dias: nossos processadores de pagamento não podem reter fundos indefinidamente.  Se você não Transferir as doações para a sua conta bancária no prazo de 120 (cento e vinte) dias após a primeira doação, nossos processadores de pagamento poderão, de acordo com as leis e os regulamentos pertinentes, reembolsar ou recolher os fundos arrecadados. Você será responsável por recorrer às autoridades governamentais apropriadas para reivindicar os fundos não transferidos.',

'7.2. Suspensões de Transferência: podemos, a nosso critério exclusivo, suspender uma Arrecadação, restringir Transferências, iniciar uma Transferência de ACH reversa, garantir reservas ou tomar medidas semelhantes para proteger nossos Usuários (qualquer uma dessas medidas pode ser chamada de “Suspensão”).  Podemos suspender sua Arrecadação ou a sua Conta por vários motivos, incluindo, mas não se limitando a:',

'(a)  precisarmos de mais informações para verificar se sua Arrecadação está em conformidade com os nossos Termos de Serviço ou se determinamos que uma Arrecadação ou Usuário violou nossos Termos de Serviço;',

'(b)  determinarmos que os fundos devem ser fornecidos diretamente a uma pessoa que não seja o Organizador, como um Beneficiário legal ou uma pessoa autorizada por lei a agir em nome de um Organizador;',

'(c)  tivermos determinados, a nosso exclusivo critério, que seu uso dos fundos mudou consideravelmente da finalidade original da Arrecadação, e que isso acarreta necessidade de reembolso aos Doadores;',

'(d)  a ação for necessária para cumprir uma ordem judicial, obrigação de fazer ou não fazer, mandado, ou conforme exigido pelas leis e regulamentos aplicáveis.',

'Se você tiver dúvidas sobre uma Suspensão da sua Arrecadação ou Conta, ou se precisar de informações sobre como resolver a Suspensão, consulte este artigo e verifique a conta de e-mail utilizada para se cadastrar para obter mais informações.',

'7.3. Estornos e Reembolsos do Processador de Pagamentos: ocasionalmente, um Doador poderá contestar a cobrança do cartão de crédito ou cobrança ACH por uma Doação feita por meio dos Serviços ou enviar uma solicitação de reembolso de acordo com a Garantia de Doação do THEPUREGRACE.  Caso acredite que ocorreu um erro em alguma de suas doações, por favor, Fale conosco imediatamente através da nossa Central de Ajuda para que possamos ajudar a resolver o problema. Quaisquer disputas de fraude ou estorno iniciado junto ao seu provedor de pagamentos podem ser contestadas por nós com base nesta autorização.  Em situações em que o Titular do Cartão não alegue a realização de fraude na doação (ou seja, que a operação não foi feita pelo Titular do Cartão), o Titular do Cartão deve sempre tentar resolver a disputa com o Organizador ou conosco antes de prosseguir com o estorno ou reembolso.',

'Cada solicitação será conferida para determinar se é legítima e, se determinarmos que a solicitação não é legítima, poderemos usar as informações enviadas por você e/ou à nossa disposição no momento da doação para defender essa solicitação. Além disso, defenderemos qualquer solicitação não fraudulenta com códigos de motivo como Mercadoria/Serviços não recebidos ou qualquer outro código que indique a não entrega, já que as operações processadas não THEPUREGRACE são doações sem a expectativa ou troca de bens ou serviços.',

'Se um Doador contestar sua operação junto ao emissor do cartão, ou se o banco ou o emissor do cartão contestar a operação em nome do titular do cartão e vir a ser um estorno ou devolução, o Doador renuncia, sem limitação, a quaisquer benefícios ou proteções da Garantia de Doação do THEPUREGRACE relacionados a essa Doação.',

'8. Arrecadações Proibidas e Conteúdo do Usuário Relacionado',
'Esta seção inclui nossas regras sobre Arrecadações e conteúdo do Usuário proibidos e/ou ilegais. Podemos remover qualquer mensagem ou Conteúdo –do Usuário – incluindo quaisquer Arrecadações de Fundos – que determinarmos que violem estes Termos de Serviço, independentemente de tal Usuário ter se envolvido em tal conduta alavancando inteligência artificial (“IA”) fornecida pela THEPUREGRACE, nossos provedores de serviços de IA ou de outra forma. Além disso, se você violar estes Termos de Serviço, poderemos proibir ou desativar o seu uso dos Serviços, interromper os pagamentos para qualquer Arrecadação de fundos, congelar ou suspender doações e transferências, denunciar você às autoridades policiais ou tomar qualquer outra medida judicial cabível.',

'Poderemos investigar uma Arrecadação de fundos, um Usuário ou conteúdo do Usuário a qualquer momento, para assegurar a conformidade com estes Termos de Serviço. Ao fazer isso, podemos considerar todo o material disponível, inclusive, dentre outros, mídias sociais, notícias relacionadas e qualquer outra informação que considerarmos relevante na nossa análise. Observe que, embora nos reservemos o direito de remover, editar ou modificar qualquer conteúdo na nossa Plataforma a nosso critério exclusivo, não somos obrigados a fazer isso. Isso inclui conteúdo ilegal, inexato, enganoso, que viole direitos de propriedade intelectual ou viole estes Termos de Serviço.',

'Você concorda que não usará os Serviços ou a Plataforma para arrecadar fundos, estabelecer uma Arrecadação de fundos ou publicar Conteúdo de Usuário para as finalidades de promover ou envolver:',

'8.1. violação de alguma lei, regulamento, exigência do setor, diretrizes de terceiros ou contratos aos quais você tenha obrigação vinculante, inclusive no caso de administradoras de cartões de pagamento que você utilizar em relação aos Serviços;',

'8.2. Arrecadações fraudulentas, enganosas, inexatas, desonestas ou impossíveis;',

'8.3. conteúdo ofensivo, explícito, de teor perverso ou sexual;',

'8.4. custos de resgate, exploração ou tráfico humano, vigilantismo, propinas ou gratificações;',

'8.5. compra ou uso por uma pessoa física ou jurídica de drogas, narcóticos, esteroides, substâncias controladas, produtos farmacêuticos ou afins ou terapias que sejam ilegais ou proibidas em nível estadual ou nacional;',

'8.6. atividades com, em ou que envolvam países, regiões, governos, pessoas físicas ou jurídicas sujeitos às sanções econômicas dos EUA e outras sanções econômicas no âmbito da lei pertinente, salvo se essas atividades forem expressamente autorizadas pela respectiva autoridade governamental e por nossos provedores de serviços de pagamento;',

'8.7. equipamentos ou armas destinados ao uso em conflitos ou por um grupo armado,  explosivos, munições, armas de fogo, facas ou outros armamentos ou acessórios;',

'8.8. qualquer atividade que apoie o terrorismo, extremismo, ódio, violência, assédio, bullying, discriminação, financiamento de terrorismo, financiamento de extremismo ou lavagem de dinheiro;',

'8.9. Conteúdo do Usuário que reflita, incite ou promova bullying, assédio, discriminação ou intolerância de qualquer tipo relacionado a raça, etnia, nacionalidade, filiação religiosa, orientação sexual, sexo, gênero, identidade de gênero, expressão de gênero, deficiências ou doenças;',

'8.10. a defesa legal de crimes financeiros e violentos, incluindo os relacionados à lavagem de dinheiro, assassinato, roubo, agressão, crimes sexuais ou crimes contra menores;',

'8.11. Conteúdo do Usuário que promova automutilação ou suicídio, exceto conforme permitido por lei em ambiente clínico;',

'8.12. jogos de azar, jogos e/ou qualquer outra atividade que exija valor de entrada e prêmio, inclusive, dentre outros, sorteios, jogos de cassino, apostas esportivas, esportes fantasia, corridas de cavalo e de galgos, bilhetes de loteria, rifas, leilões e outros empreendimentos que facilitem jogos de azar, jogos de habilidade ou sorte (sejam ou não definidos por lei como loteria), promoções que envolvem recompensas (monetárias ou outras) em troca de doações, como ingressos para eventos, entradas em sorteios, oportunidades de conhecer e cumprimentar, cartões-presente ou sorteios;',

'8.13. qualquer atividade que disfarce, oculte ou obscureça a origem dos fundos;',

'8.14. anuidades, investimentos com expectativa de retorno, empréstimos, participação societária ou contratos de loteria, sistema de consórcio, transações com bancos offshore ou transações semelhantes, empresas de serviços monetários (inclusive serviços de câmbio, desconto de cheques ou outros semelhantes), esquemas de pirâmide, esquemas do tipo “fique rico rápido” (ou seja, oportunidades de investimento ou outros serviços que prometam recompensas muito altas), marketing de rede e programas de marketing por recomendação, cobrança de dívidas ou criptomoedas;',

'8.15. o recebimento ou concessão de adiantamentos em dinheiro ou linhas de crédito para você mesmo ou para outra pessoa por qualquer motivo, incluindo, dentre outros, pagamentos próprios ou pagamentos para os quais não há finalidade aparente;',

'8.16. produtos ou serviços que infringem ou facilitem diretamente a violação de marcas, patentes, direitos autorais, segredos comerciais ou direitos de propriedade ou privacidade de terceiros, incluindo, dentre outros, músicas, filmes, software ou outros materiais licenciados falsificados sem a devida autorização do detentor dos direitos;',

'8.17. a promoção, o anúncio, a venda ou revenda de bens ou serviços;',

'8.18. Arrecadação eleitorais, a menos que a Arrecadação seja gerenciada diretamente pelo candidato ou seu comitê; qualquer arrecadação para fins eleitorais em um país em que o THEPUREGRACE não atue, a menos que seja administrada por uma organização registrada em um país em que o THEPUREGRACE atue;',

'8.19. qualquer tentativa de contornar ou burlar as regras e os regulamentos de processamento de pagamentos ou estes Termos de Serviço;',

'8.20. qualquer atividade que apresente ao THEPUREGRACE um risco inaceitável de perda financeira;',

'8.21. qualquer outra atividade que o THEPUREGRACE considere, a seu exclusivo critério, como: (a) inaceitável ou censurável; (b) uma restrição ou inibição a qualquer outra pessoa de usar ou usufruir dos Serviços; ou (c) uma exposição do THEPUREGRACE ou dos Usuários a algum perigo ou responsabilidade civil de qualquer tipo.',

'observe que se você estiver localizado no Reino Unido, poderá oferecer incentivos de doação (p. ex., um adesivo, enquanto durarem os estoques, para cada doação feita) em relação à sua Arrecadação.   Entretanto, você não tem permissão para oferecer concursos, competições, recompensas, brindes, rifas, sorteios ou atividade semelhante (individualmente, “Promoção”) nos ou por meio dos Serviços.',

'9. Conduta Proibida do Usuário',
'Esta seção inclui as nossas regras sobre Conduta do Usuário proibida e/ou ilegal. Podemos remover qualquer conteúdo do Usuário ou mensagens, incluindo Arrecadações de fundos, se determinarmos que o Usuário em questão adotou uma conduta do Usuário que viole estes Termos de Serviço, independentemente de tal conduta ter sido realizada com o uso de IA fornecida pelo THEPUREGRACE, por nossos provedores de serviços de IA ou por qualquer outro meio. Além disso, se você violar estes Termos de Serviço, poderemos proibir ou desativar o seu uso dos Serviços, interromper os pagamentos para qualquer Arrecadação de fundos, congelar ou suspender doações e transferências, denunciar você às autoridades policiais ou de outra forma tomar qualquer outra medida judicial cabível.',

'Ao usar os Serviços ou a nossa Plataforma, você concorda em:',

'9.1. não usar os Serviços para transmitir ou, de outra forma, carregar qualquer Conteúdo do Usuário que: (i) viole algum direito de propriedade intelectual ou outro direito de propriedade de qualquer parte; (ii) você não tenha o direito de upload, nos termos de qualquer lei ou relação de confiança ou contratual; (iii) contenha vírus de software ou algum outro código, arquivo ou programa de informática que vise a interrupção, a destruição ou a limitação da capacidade de funcionamento de qualquer software ou hardware de informática ou qualquer equipamento de telecomunicação; (iv) apresente ou crie risco de segurança ou de privacidade para qualquer pessoa; ou (v) constitua publicidade não autorizada ou não solicitada, material promocional, atividade comercial e/ou de vendas, “correspondência em massa“, “spam“, “correntes de cartas“, “esquemas de pirâmide“, “concursos“, “sorteios“ ou qualquer outra forma de solicitação;',

'9.2. não interferir ou interromper os servidores ou as redes conectadas ou usadas para fornecer os Serviços e seus respectivos recursos, ou desobedecer alguma exigência, procedimento, política ou regulação das redes conectadas ou usadas para fornecer os Serviços;',

'9.3. não colher, coletar, rasurar ou publicar informações de outras pessoas que possam identificá-las em nível individual;',

'9.4. não arrecadas fundos para um menor de idade, a menos que (i) você tenha obtido permissão expressa do responsável legal pelo menos; ou (ii) os fundos sejam Transferidos para uma conta fiduciária, UTMA [Uniform Transfer to Minors Act (Lei de Transferências Uniformes para Menores)] ou UGMA [Uniform Gifts to Minors Act (Lei de Bonificações Uniformes para Menores)] em benefício exclusivo do menor de idade;',

'9.5. não usar os Serviços em nome de um terceiro nem publicar dados pessoais ou outras informações sobre um terceiro, sem o consentimento expresso desse terceiro;',

'9.6. não usar a Conta, Conta de Apoiador ou URL de outro Usuário sem permissão, passar-se por qualquer pessoa física ou jurídica, declarar falsamente ou dar uma impressão falsa da sua afiliação com uma pessoa física ou jurídica, dar uma impressão falsa de ONG ou Arrecadação por meio dos Serviços ou publicar Conteúdo de Usuário em qualquer categoria ou área inadequada nos Serviços;',

'9.7. não criar nenhuma obrigação de responsabilidade para o THEPUREGRACE ou nos fazer perder (no todo ou em parte) os serviços de nosso(s) Provedor(es) de Serviços de Internet, empresa de hospedagem web ou qualquer outro de nossos fornecedores;',

'9.8. não obter acesso não autorizado aos Serviços, ou qualquer conta, sistema de informática ou rede conectada a esses Serviços, por qualquer meio ilícito ou não autorizado;',

'9.9. não obter nem tentar obter qualquer material ou informação que não tenha sido intencionalmente disponibilizada pelos Serviços;',

'9.10. não usar os Serviços para publicar, transmitir ou explorar de qualquer forma qualquer informação, software ou outro material para objetivos comerciais, ou que contenha publicidade, salvo pelo uso dos Serviços para atividades de captação de recursos que, segundo estes Termos, é expressamente permitido;',

'9.11. não transmitir um maior número de mensagens de solicitação por meio dos Serviços em um determinado período do que uma pessoa possa razoavelmente produzir no mesmo período ao usar um navegador web on-line convencional;',

'9.12. não realizar qualquer atividade ou envolver-se em qualquer conduta que seja incoerente com o ramo de atuação ou o objetivo dos Serviços;',

'9.13. não compartilhar sua senha ou credenciais de login com ninguém, por qualquer motivo;',

'9.14. não fazer nem aceitar qualquer Doação que saiba ou suspeite ser incorreta, suspeita ou fraudulenta;',

'9.15. não usar os Serviços em ou para beneficiar qualquer país, organização, pessoa física ou jurídica que esteja sob embargo ou bloqueio por parte de qualquer governo, inclusive os incluídos em alguma lista de sanções identificada pelo Gabinete de Controle de Ativos Estrangeiros dos EUA (Office of Foreign Asset Control, OFAC), nem conforme aplicável em seu país;',

'9.16. não usar bots, scripts automatizados, software ou qualquer outro método não expressamente autorizado pelo THEPUREGRACE para gerar seguidores ou números de seguidores artificialmente ou qualquer outra forma de engajamento não autêntico.',

'9.17. não tentar realizar indiretamente qualquer das ações mencionadas acima;',

'9.18. manter medidas de segurança razoáveis e padrão para proteger toda informação transmitida e recebida por meio dos Serviços, incluindo, sem limitação, aderindo a quaisquer procedimentos e controles de segurança requeridos de tempos em tempos pelo THEPUREGRACE;',

'9.19. manter uma cópia de todos os registros eletrônicos ou de outro tipo relacionados a Arrecadações e Doações, conforme necessários para que o THEPUREGRACE possa verificar a conformidade com estes Termos de Serviço, e disponibilizar esses registros quando o THEPUREGRACE os solicitar. Para mais clareza, o disposto acima não afeta nem limita as suas obrigações de manter documentação de acordo com o exigido pelas leis, regras e regulamentações pertinentes ou pelas autoridades competentes; e,',

'9.20. mediante solicitação do THEPUREGRACE, cooperar, na medida do possível e permitida nos termos da lei aplicável, na auditoria, investigação (inclusive, sem limitação, investigações pelo THEPUREGRACE, Processadores de Pagamento ou autoridades regulatórias ou governamentais) e nos esforços corretivos para corrigir qualquer violação ou irregularidade, suposta ou descoberta, de algum Usuário, Arrecadação ou Doação a qual você está relacionado.',

'9.21. não converter fundos arrecadados por meio da Plataforma em criptomoedas para fins de entrega desses fundos aos destinatários pretendidos, incluindo Beneficiários. Todos os fundos devem ser retirados e entregues em moeda fiduciária.',

'10. Moderação de Conteúdo e Denúncias de Arrecadações',
'Se você tiver motivos para acreditar que uma Arrecadação contém conteúdo ilegal ou conteúdo que viola estes Termos de Serviço ou as nossas políticas de moderação de conteúdo, use o botão “Denunciar” na Arrecadação para alertar nossa equipe sobre esse possível problema e investigaremos.  Se você não concordar com uma decisão tomada por nós em relação a um aviso ou reclamação relacionada ao Conteúdo do Usuário e/ou uso da Plataforma que seja ilegal ou proibido pelo THEPUREGRACE, você poderá usar nossos sistemas de Resolução de disputas disponíveis.Utilizamos uma combinação de regras de negócios, aprendizado de máquina e análise humana para identificar e corrigir violações dos nossos Termos de Serviço. Informações adicionais relacionadas à forma como moderamos o Conteúdo do Usuário, como protegemos as pessoas de conteúdo ilegal, o processo de denúncia ou apelação de violações, o processo de tratamento e resolução de reclamações e os sistemas de resolução de disputas disponíveis estão disponíveis em na nossa Central de Ajuda. Você reconhece que as regras desta seção relativas à moderação de conteúdo não prejudicam as políticas e os procedimentos disponíveis na nossa Central de Ajuda que regulam a forma como moderamos o Conteúdo do Usuário, como protegemos as pessoas de conteúdo ilegal, o processo para relatar ou recorrer de violações, o processo para tratamento e resolução de reclamações e os sistemas de resolução de disputas disponíveis.',

'11. Tarifas',
'11.1. Não cobramos uma Taxa de Plataforma: uma taxa de plataforma é uma cobrança inicial calculada, seja ela fixa ou baseada em porcentagem, para acessar ou usar um serviço específico em uma Plataforma. Não cobramos taxa de plataforma e não cobramos para criar ou manter uma Arrecadação de fundos. No entanto, a tarifa de processamento de transações se aplica às doações recebidas e, se os doadores escolherem doações recorrentes, cobraremos dos doadores uma taxa recorrente sobre cada doação. Não obstante o acima exposto, se você estiver usando nosso conjunto de ferramentas de arrecadação online para organizações sem fins lucrativos para impulsionar doações em seu próprio site, podem ser aplicadas tarifas à parte. Os termos de preços e tarifas do seu contrato vigente conosco permanecerão em vigor para quaisquer pagamentos viabilizados por nós no site da sua entidade até que o contrato seja encerrado, conforme suas disposições. Esses preços não serão modificados ao reivindicar seu perfil de ONG ou ao concordar com os Termos de Serviço do THEPUREGRACE.',

'11.2. A Taxa de Transação é cobrada em todas as Doações, e a Taxa Recorrente é cobrada sobre Doações Recorrentes:  uma Taxa de Transação é o custo de processamento de um pagamento.  Embora não haja taxas na Plataforma para iniciar ou manter uma Arrecadação, lembre-se de que uma Taxa de Operação, inclusive encargos de crédito e débito, é deduzida de cada doação pelos nossos Processadores de Pagamento para entregar suas doações com segurança. Se o doador optar por doações recorrentes, cobraremos uma Taxa de Recorrência por doação à Arrecadação selecionada. Para saber mais sobre nossas taxas, acesse Preços da THEPUREGRACE.',

'12. Direitos de Propriedade Intelectual, Licenças e Propriedade de Conteúdo',
'12.1. Propriedade Intelectual:  você reconhece que o Conteúdo dos Serviços está protegido por leis de direitos autorais, patentes, marcas e outros direitos de propriedade.  A tecnologia e o Software que atendem aos Serviços, ou são distribuídos em conexão com eles, são de propriedade do THEPUREGRACE, de nossas Empresas Afiliadas e nossos parceiros.',

'12.2. Uso das Marcas da THEPUREGRACE: o nome e os logotipos do THEPUREGRACE são marcas do THEPUREGRACE e de suas Afiliadas (coletivamente, “Marcas do THEPUREGRACE”). Outros nomes e logotipos de empresas, produtos e serviços exibidos nos nossos Serviços ou na Plataforma podem ser marcas de seus respectivos proprietários, que podem ou não ser afiliados a nós.  Nada nestes Termos de Serviço ou nos nossos Serviços concede a você permissão para usar as Marcas do THEPUREGRACE sem o nosso consentimento prévio por escrito. Todo patrimônio gerado pelo uso das Marcas do THEPUREGRACE nos beneficiam exclusivamente.',

'12.3. Não se apropriar indevidamente do conteúdo do nosso site: você concorda em não alterar, copiar, enquadrar, extrair, alugar, arrendar, emprestar, vender, distribuir ou criar obras derivadas com base nos Serviços, no Conteúdo dos Serviços ou no conteúdo do Usuário. Você concorda em não usar técnicas de mineração de dados, spiders, robôs, raspagem ou outros métodos semelhantes de coleta ou extração de dados para extrair ou copiar qualquer Conteúdo dos Serviços ou conteúdo do Usuário, em qualquer formato ou de qualquer forma relacionada ao uso dos Serviços. É expressamente proibido usar, raspar, rastrear ou de qualquer forma coletar qualquer conteúdo (conteúdo do Usuário ou outro) do THEPUREGRACE com a finalidade de treinar, desenvolver ou operar modelos de aprendizado de máquina, modelos de linguagem de grande escala ou quaisquer outros sistemas de inteligência artificial, incluindo modelos fundamentais ou de ponta, sem o consentimento prévio expresso e por escrito do THEPUREGRACE. Qualquer uso não autorizado de conteúdo do THEPUREGRACE, incluindo para treinamento de modelos de IA, constitui uma violação destes termos e pode resultar na suspensão ou encerramento da sua conta, além de medidas legais. Se bloquearmos o seu acesso aos Serviços (inclusive bloquear seu endereço IP), você concorda em não contornar esse bloqueio (p. ex., mascarando seu endereço IP ou usando um endereço IP proxy). Quaisquer direitos não expressamente concedidos por nós neste documento estão reservados.',

'12.4. Não Apropriar-se Indevidamente do nosso Software: você está proibido de copiar, modificar, criar trabalhos derivados, fazer engenharia reversa, desmontar ou tentar descobrir qualquer código-fonte do Software ou dos Serviços de qualquer forma.',

'12.5. Direitos e permissões sobre o conteúdo do Usuário que você compartilha: ao compartilhar conteúdo por meio dos nossos Serviços, incluindo por meio do seu Perfil ou ao interagir com IA, você declara e garante que é o proprietário do conteúdo ou que tem permissão para usá-lo e compartilhá-lo. Isso inclui todos os direitos autorais, marcas registradas e direitos relacionados à privacidade ou publicidade. Ao fazer upload, compartilhar ou disponibilizar qualquer conteúdo do Usuário em conexão com os Serviços, você concede ao THEPUREGRACE e suas Afiliadas uma licença mundial, isenta de royalties, transferível, sublicenciável, perpétua e irrevogável para copiar, exibir, distribuir, armazenar, modificar, traduzir, publicar, preparar obras derivadas ou utilizar de qualquer outra forma esse conteúdo do Usuário para qualquer finalidade, incluindo promoção, publicidade ou marketing dos nossos Serviços em qualquer meio de comunicação. Essa licença inclui o direito para nós e nossos provedores de serviços de IA de analisar e processar o conteúdo do Usuário para aprimorar e desenvolver os Serviços e tecnologias relacionadas, incluindo por meio do uso de aprendizado de máquina e modelos de IA (sejam generativos, preditivos ou de outro tipo). Essa licença nos permite, por exemplo, usar o conteúdo do Usuário para treinar e aprimorar modelos que apoiam recursos de segurança, prevenção de fraudes, moderação de conteúdo, atendimento ao cliente e otimização de produtos. Não utilizamos seu conteúdo para treinar modelos de IA com a finalidade de desenvolver produtos comerciais de IA de uso geral que não estejam relacionados aos Serviços. Você também reconhece que sua participação nos Serviços e o envio de conteúdo do Usuário são voluntários, que não receberá qualquer tipo de compensação financeira relacionada às licenças, renúncias e liberações aqui estabelecidas (ou à exploração delas pelo THEPUREGRACE), e que a única contrapartida por este acordo é a oportunidade de usar os Serviços.',

'12.6. Liberação e Renúncia de Direitos sobre o Conteúdo do Usuário: ao publicar qualquer Conteúdo do Usuário e até a extensão máxima permitida por lei, você renuncia irrevogavelmente a quaisquer direitos morais sobre seu Conteúdo do Usuário contra nós e nossos Usuários, bem como concorda em liberar e isentar o THEPUREGRACE, nossos contratados e nossos funcionários de (i) reivindicações por invasão de privacidade, publicidade ou difamação; (ii) responsabilidade civil decorrente do uso de seu nome, imagem ou semelhança, inclusive desfoque, distorção, alteração ou outros usos; e (iii) responsabilidade civil por reclamações feitas por você relacionadas ao seu Conteúdo do Usuário, nome, imagem ou semelhança. Ao publicar o Conteúdo do Usuário, você também renuncia ao direito de inspecionar ou aprovar qualquer versão intermediária ou finalizada do seu Conteúdo do Usuário. Se o seu Conteúdo do Usuário incluir alguém que não seja você, você declara e garante que obteve todas as permissões, renúncias e liberações necessárias dessas pessoas. Isso assegura que o THEPUREGRACE possa usar o conteúdo conforme descrito acima sem problemas judiciais.',

'12.7. Envios do Usuário e Feedback: qualquer conteúdo ou informação que você fornecer ao THEPUREGRACE, seja solicitado ou não, poderá ser acessado publicamente. Isso inclui qualquer informação que você publicar em fóruns, seções de comentários, pesquisas, comunicações de atendimento ao cliente ou quaisquer outros envios, como ideias, sugestões ou feedback sobre os Serviços (“Envios e Feedback”). Ao fazer Envios ou Feedback, você concorda que (i) não temos nenhuma obrigação de manter os Envios ou Feedback confidenciais; (ii) podemos já ter informações semelhantes em consideração ou desenvolvimento; (iii) podemos usar e distribuir os Envios e Feedback para qualquer finalidade, sem reconhecimento ou remuneração a você; (iv) você tem todos os direitos necessários para enviar esses Envios e Feedback; (v) você concede ao THEPUREGRACE uma  licença permanente, universal, isenta de royalties, irrevogável, não exclusiva e totalmente transferível para usar, reproduzir, executar, exibir, distribuir, adaptar, modificar, reformatar, criar trabalhos derivados e explorar outras informações, inclusive o direito de sublicenciar esses direitos; e (vi) você renuncia a direitos morais ou reivindicações equivalentes na medida permitida por lei.  Esta seção subsistirá mesmo após o encerramento da sua Conta ou do uso dos Serviços.',

'12.8. Reclamações de Direitos Autorais ou Marcas: respeitamos a propriedade intelectual de terceiros e pedimos que nossos Usuários façam o mesmo. Processaremos e investigaremos avisos de suposta violação de direitos autorais ou marcas e tomaremos as devidas medidas de acordo com a Lei dos Direitos de Autor do Milênio Digital (Digital Millennium Copyright Act, “DMCA”) ou outras leis locais de propriedade intelectual equivalentes.  A nosso critério exclusivo, podemos encerrar as Contas de qualquer Usuário que infrinja os direitos de propriedade intelectual de terceiros.',

'(a)  Aviso de Remoção:  se você acreditar que o seu trabalho consta no nosso site de uma forma que constitua violação de direitos autorais ou que seus direitos de propriedade intelectual foram violados de outra forma, você deve nos notificar por escrito, da seguinte forma:',

'Envie um e-mail para o nosso representante de direitos autorais no GFMLegal@THEPUREGRACE.com e escreva [“DMCA Takedown Request” (Solicitação de remoção no âmbito da DMCA)] na linha de assunto ou envie sua solicitação por correio para:',

'THEPUREGRACE Copyright Agent:',

'THEPUREGRACE',
'c/o Legal Department [Aos cuidados do Departamento Jurídico]',


'Para ter efeito, seu Aviso de Remoção precisa conter as seguintes informações:',

'Suas informações de contato completas (nome completo, endereço para correspondência e número de telefone).  Observe que podemos fornecer suas informações de contato à pessoa que publicou o conteúdo que você está denunciando.  Por esse motivo, você pode fornecer um endereço de e-mail profissional ou comercial;',
'uma descrição do trabalho protegido por direitos autorais que você alega ter sido violado;',
'uma descrição do conteúdo em nosso site que você alega violar seus direitos autorais;',
'uma descrição de onde o material que você alega estar infringindo está localizado nos Serviços. A maneira mais fácil de fazer isso é informar endereços da web (URLs) que levem diretamente ao conteúdo supostamente infrator.',
'Uma declaração de que:',
'Você acredita, de boa-fé, que o uso questionado não é autorizado pelo proprietário dos direitos autorais, seu representante ou pela lei;',
'As informações no seu aviso são precisas; e',
'Sob pena de perjúrio, você é o proprietário ou está autorizado a agir em nome do proprietário de um direito autoral exclusivo que supostamente está sendo violado.',
'Sua assinatura eletrônica ou física',
'(b) Contranotificação: se você acreita que o seu conteúdo do Usuário removido ou desativado não infringe direitos ou que possui autorização do proprietário, do agente do proprietário, ou conforme a lei, para enviar e usar esse conteúdo, você pode enviar uma contranotificação ao nosso agente de direitos autorais pelo e-mail GFMLegal@THEPUREGRACE.com ou pelo endereço indicado acima.',

'Para ter efeito, sua contranotificação precisa incluir as seguintes informações:',

'Suas informações de contato completas (nome completo, endereço para correspondência e número de telefone).  Observe que poderemos fornecer suas informações de contato à pessoa que reclamou do seu conteúdo.  Por esse motivo, você pode fornecer um endereço de e-mail profissional ou comercial;',
'identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled',
'Uma declaração de que',
'Você acredita, de boafé, que o conteúdo foi removido ou desativado devido a um erro ou identificação incorreta do conteúdo;',
'Você concorda com a jurisdição do Tribunal do Distrito Federal da comarca em que seu endereço está localizado.  Se você estver fora dos EUA, deverá consentir com a jurisdição de qualquer tribunal do Distrito Federal da comarca em que o THEPUREGRACE opere; e',
'Você aceitará a notificação de processo de ou em nome da pessoa que forneceu a notificação de remoção da DMCA ou de um representante dessa pessoa',
'Sua assinatura física ou eletrônica',
'Se recebermos uma contranotificação enviaremos uma cópia da contranotificação à parte reclamante original, informando a pessoa de que poderá substituir ou remover o conteúdo ou parar de desativá-lo em 10 dias úteis. A menos que a parte reclamante original entre com uma ação de pedido de ordem judicial contra o fornecedor do conteúdo ou Usuário, o conteúdo removido poderá ser substituído ou o acesso a ele será restaurado em 10 a 14 dias úteis ou mais após o recebimento da contranotificação.',

'13. Privacidade de dados',
'13.1. Aviso de Privacidde: no THEPUREGRACE, respeitamos a privacidade dos nossos Usuários. Para mais informações, leia nosso Aviso de Privacidade.  Ao utilizar os Serviços, você aceita nossa coleta, uso e compartilhamento de dados pessoais conforme descrito no Aviso de Privacidade.',

'13.2. Retenção de dados da Arrecadação de fundos: não somos obrigados a reter dados relacionados a nenhuma conta, conta de Apoiador ou Arrecadação de fundos após sua conclusão. Podemos excluir dados históricos ou encerrar contas de Apoiador ou contas inativas sem aviso prévio, exceto pelos dados que devemos manter para cumprir obrigações legais ou regulatórias de conformidade ou para estabelecer, exercer ou defender reivindicações legais.',

'13.3. Entendimento da visibilidade pública e das configurações de privacidade: algumas ações que você realiza em nossa Plataforma são públicas, como as postagens que você faz e o material que envia por upload (isso pode incluir desde descrições, fotos, vídeos, comentários até músicas e logotipos). Além disso, as informações do perfil que você fornece (como seu nome, organização, foto e biografia) podem ser vistas por outros usuários para ajudar as pessoas a se conectarem dentro do Serviço. Por exemplo, se você estiver organizando uma Arrecadação de fundos, poderá compartilhar dados pessoais, como uma internação hospitalar, que são informações sensíveis. Se você estiver fazendo uma doação, pode optar por exibi-la publicamente, o que significa que qualquer pessoa na internet, incluindo mecanismos de busca como o Google, poderá vê-la. Se quiser manter sua doação em sigilo, basta marcar a opção “Não mostrar as minhas informações publicamente na arrecadação” no momento da doação. Lembre-se de que o Organizador da Arrecadação de fundos, a equipe dele, o Beneficiário e outros ainda visualizarão suas informações conforme o nosso Aviso de Privacidade. As mensagens não são públicas, mas podem ser acessadas, analisadas ou divulgadas pelo THEPUREGRACE conforme nosso Aviso de Privacidade e estes Termos, inclusive para fins de moderação de conteúdo, segurança e conformidade legal.',

'13.4. Comunicações com Terceiros: ao usar os nossos Serviços para comunicar-se com terceiros (por exemplo, para discutir uma Arrecadação de fundos ou Doação), você confirma que possui a autoridade e os consentimentos necessários desse terceiro para compartilhar seus dados conosco e que o informou sobre como suas informações serão coletadas e utilizadas pelo THEPUREGRACE.  Você também concorda que podemos usar esses dados para entrar em contato com os terceiros ou fornecer a você um modelo ou mensagem pré-preenchida para facilitar a comunicação e que podemos enviar lembretes ou mensagens relacionadas a você e aos terceiros.  Sem limitar o acima exposto, caso você esteja enviando qualquer mensagem de texto para qualquer residente do Estado de Washington, você concorda que (i) não enviará, nem fará com que seja enviada, qualquer mensagem pré-preenchida fornecida por nós, (ii) você obterá o consentimento claro e afirmativo da pessoa antes de enviar a ela uma mensagem de texto e (iii) se o destinatário indicar que não deseja receber mensagens de texto adicionais, você garantirá que não enviará qualquer mensagem de texto adicional a ele.',

'14. Inteligência artificial',
'Inteligência artificial: etamos constantemente desenvolvendo novas tecnologias e recursos para aprimorar nossos Serviços. Por exemplo, podemos permitir que você utilize recursos de IA desenvolvidos por nós e/ou por nossos Provedores de Serviços de IA para facilitar a criação de textos, materiais ou outros conteúdos e para promover o uso dos nossos Serviços, como ajudar na redação de arrecadações de fundos e postagens, na criação de fotos ou vídeos para divulgar suas arrecadações ou, de modo geral, na otimização do uso dos nossos Serviços. Os recursos de IA também podem incluir um chatbot para conversas ou um agente de IA que auxiliará os usuários, orientando-os no processo de criação e gerenciamento da arrecadação de fundos. O uso desses recursos é oferecido exclusivamente para sua conveniência, e tais funcionalidades são disponibilizadas como se encontram, sem qualquer tipo de garantia.',

'(a) Gravações de bate-papo com IA: se você usar nosso agente de bate-papo com tecnologia de IA, informaremos quando você estiver interagindo com uma IA em vez de um humano. Além disso, seus bate-papos podem ser gravados e/ou monitorados por nós e por nossos Provedores de Serviços de IA para fins de treinamento, moderação de conteúdo e garantia de qualidade. Ao usar esses recursos de IA, você autoriza tais gravações. Não obstante o acima exposto, o THEPUREGRACE não é obrigado a analisar ou reter suas interações com a IA em nossa Plataforma.',

'(b) Precisão, limitações e responsabilidade do usuário da IA: o conteúdo gerado por IA é probabilístico, o que significa que pode não ser sempre único entre os usuários e pode conter erros, imprecisões ou conteúdo ofensivo que não reflete as opiniões do THEPUREGRACE. O conteúdo gerado por IA não deve ser utilizado para obter informações de caráter jurídico, financeiro, de saúde ou qualquer outro tipo de orientação profissional. Você é o único responsável por qualquer conteúdo que fornecer a qualquer agente de IA no THEPUREGRACE, bem como por revisar, editar e garantir a precisão e adequação de todo o conteúdo gerado por IA antes de incorporá-lo à sua arrecadação ou compartilhá-lo de outra forma. Seja criterioso antes de usar conteúdo gerado por IA na Plataforma, em mídias sociais ou em qualquer comunicação pública ou de arrecadação. Assim como todo conteúdo que você compartilha em nossa Plataforma, você é responsável por garantir que qualquer conteúdo gerado usando um agente de IA esteja em conformidade com estes Termos de Serviço, incluindo não compartilhar informações enganosas ou outro conteúdo do Usuário que infrinja os direitos de terceiros.',

'(c) arrecadação políticos e conteúdo gerado por IA: os usuários que utilizam conteúdo gerado por IA para comunicações relacionadas à arrecadação políticos são responsáveis por cumprir todas as leis aplicáveis, inclusive quaisquer requisitos para divulgar mídia gerada por IA em conexão com comunicações relacionadas à arrecadação políticos.  Os usuários não podem usar conteúdo gerado por IA de forma que tenha a intenção de enganar usuários ou eleitores, passar-se por candidatos ou enganar o público de outra forma, violando quaisquer leis aplicáveis.',

'(d) Moderação de conteúdo de IA: você reconhece que qualquer informação que você fornecer e qualquer informação gerada durante o uso de nossos recursos de IA serão compartilhadas com nosso Provedor de Serviços de IA para permitir o uso de nossos recursos de IA e para moderação de conteúdo e outras finalidades consistentes com nossos Termos de Serviço. Você não pode usar os Produtos de IA de modo que viole quaisquer condições ou políticas de qualquer Provedor de Serviços de IA.',

'(e) Outras restrições ao uso de IA: o conteúdo gerado por IA não pode ser usado para desenvolver modelos de aprendizado de máquina ou tecnologia relacionada. Nossos recursos opcionais de IA não podem ser interpretados como agentes do THEPUREGRACE e não podem nos vincular a obrigação alguma, seja ela legal ou de outra natureza. Não garantimos a disponibilidade dos recursos de IA em nenhuma ou todas as áreas geográficas e reservamo-nos o direito de modificar, limitar ou descontinuar o acesso aos recursos de IA em sua plataforma a qualquer momento.',

'Você não pode usar os Serviços, incluindo quaisquer recursos de IA disponíveis na Plataforma, para desenvolver modelos de aprendizado de máquina ou tecnologia relacionada.',

'15. Serviços e conteúdo de terceiros',
'15.1. Outros sites/links/serviços d terceiros: nossos Serviços podem depender de determinados recursos de terceiros, ou alguns terceiros podem incluir em nossos Serviços links para esses recursos de terceiros. Não temos controle sobre esses recursos de terceiros e não endossamos nem assumimos qualquer responsabilidade por esses recursos de terceiros. Ao usar nossos Serviços, você concorda que não nos responsabilizamos pelo conteúdo, funcionalidades, precisão ou legalidade desses recursos de terceiros, nem por quaisquer indenizações ou prejuízos que possam ser causados por eles. Em certas situações, recursos de terceiros podem incluir produtos ou serviços oferecidos por terceiros que você pode exibir ou que estejam disponíveis por meio dos Serviços e, nesse caso, você poderá estar sujeito aos termos de terceiros associados a esses recursos de terceiros. O THEPUREGRACE tem relações com determinados fornecedores desses produtos e serviços, e podemos ser pagos por esses fornecedores na forma de comissões relacionadas a esses produtos e serviços.',

'15.2. Aplicativos de software habilitados para produtos Apple: o THEPUREGRACE oferece aplicativos de software que se destinam a ser operados em conexão com produtos comercialmente disponíveis pela Apple Inc. (“Apple”), entre outras plataformas. Em relação ao software disponibilizado para seu uso em conexão com um produto com a marca Apple (esse software, “Software compatível com Apple”), além dos outros termos e condições estabelecidos nestes Termos de Serviço, aplicam-se os seguintes termos e condições:',

'(a)  O THEPUREGRACE e você confirmam que estes Termos de Serviço são celebrados unicamente entre o THEPUREGRACE e você, e não a Apple, e, da mesma forma que entre o THEPUREGRACE e a Apple, o THEPUREGRACE, não a Apple, é unicamente responsável pelo Software habilitado para produtos da Apple e o respectivo conteúdo (exceto Conteúdo do Usuário).',

'(b)  Você não pode usar o Software Habilitado para Produtos Apple de nenhuma maneira que esteja em violação ou não esteja de acordo com as Regras de Uso definidas para o Software Habilitado para Produtos Apple ou de qualquer forma que não esteja de acordo com os Termos de Serviço da App Store.',

'(c) Sua licença de uso do Software Habilitado para Produtos Apple é limitada a uma licença intransferível para o uso do Software Habilitado para Produtos Apple em um Produto iOS que você possua ou controle, conforme permitido pelas Regras de Uso definidas nos Termos de Serviço da App Store.',

'(d)  A Apple não tem nenhuma obrigação de fornecer qualquer manutenção ou serviços de suporte relacionados ao Software Habilitado para Produtos Apple.',

'(e)  A Apple não assume nenhuma responsabilidade por qualquer garantia de produto, seja esta explícita ou implícita pela legislação. Caso ocorra alguma falha no Software Habilitado para Produtos Apple em termos de conformidade com alguma garantia aplicável, você pode notificar a Apple e esta lhe reembolsará o preço da compra do Software Habilitado para Produtos Apple, se for o caso; e, na medida máxima permitida pela legislação aplicável, a Apple não terá nenhuma outra obrigação de garantia de qualquer tipo no que diz respeito ao Software Habilitado para Produtos Apple, nem por quaisquer reivindicações, perdas, indenizações, indenizações, custos ou despesas que possam ser atribuídas à falta de conformidade com alguma garantia, o que será de responsabilidade exclusiva do THEPUREGRACE, na medida em que não possa haver isenção de responsabilidade de acordo com a lei aplicável.',

'(f)  A THEPUREGRACE e você confirmam que a THEPUREGRACE, não a Apple, é responsável por resolver quaisquer reivindicações suas ou de terceiros relacionadas ao Software Habilitado para Produtos Apple ou a sua posse ou uso do Software Habilitado para Produtos Apple, inclusive, sem limitação: (i) reivindicações de responsabilidade civil sobre o produto; (ii) qualquer reivindicação de que o Software Habilitado para Produtos Apple não esteja de acordo com alguma exigência regulatória ou legal aplicável; e, (iii) reivindicações que possam surgir em relação à legislação de proteção ao consumidor ou outras leis semelhantes.',

'(g)  No caso de reivindicação por parte de um terceiro de que o Software Habilitado para Produtos Apple ou o uso ou a posse do Software Habilitado para Produtos Apple pelo usuário final infrinja direitos de propriedade intelectual desse terceiro, da mesma forma que entre o THEPUREGRACE e a Apple, o THEPUREGRACE, não a Apple, será totalmente responsável pela investigação, defesa, acordo e dispensa dessa reivindicação de infração de propriedade intelectual.',

'(h)  Se tiver alguma dúvida, reclamação ou reivindicação com respeito ao Software Habilitado para Produtos Apple, esclareça-as com o THEPUREGRACE da seguinte forma:',

'THEPUREGRACE',
'c/o Legal Dpartment [Aos cuidados do Departamento Jurídico]',


'Ou Legal@THEPUREGRACE.com',

'(i)  O THEPUREGRACE e você confirmam e concordam que a Apple e as subsidiárias da Apple são beneficiárias terceiras destes Termos de Serviço, no que diz respeito ao Software Habilitado para Produtos Apple, e que, ao aceitar os termos e condições destes Termos de Serviço, a Apple terá o direito (e será pressuposto que aceitou o direito) de impor estes Termos de Serviço a você no que diz respeito ao Software Habilitado para Produtos Apple, enquanto Beneficiária terceira deste. Da mesma forma, as partes confirmam e concordam que o THEPUREGRACE celebra esta cláusula (“Aplicativos de Software Habilitado para Produtos Apple”) para seu próprio benefício e em seu próprio nome e, também, como mandatária para benefício e em nome da Apple e de suas subsidiárias, no que diz respeito ao exercício e à imposição de todos os direitos, benefícios e recursos judiciais da Apple e de suas subsidiárias (mas sem nenhum ônus ou obrigação) sob esta cláusula (“Aplicativos de Software Habilitado para Produtos Apple”), direitos, benefícios e recursos judiciais os quais poderão ser impostos pelo THEPUREGRACE de modo autônomo e também como mandatária e em nome da Apple e de suas subsidiárias. O THEPUREGRACE poderá modificar, terminar ou rescindir estes Termos de Serviço sem consentimento da Apple ou de qualquer uma de suas subsidiárias.',

'16. Suspensão ou rescisão de contas',
'Você concorda que podemos, em respsta a preocupações com atividades fraudulentas ou ilegais ou com uma violação material destes Termos de Serviço, suspender ou encerrar sua Conta (ou qualquer parte dela), Conta de Apoiador, ou seu acesso aos Serviços e remover e descartar qualquer Conteúdo do Usuário ou dados a qualquer momento, inclusive qualquer Arrecadação que você possa ter organizado.  Na medida do permitido por lei, podemos tomar tais medidas sem qualquer responsabilidade civil perante você ou terceiros por quaisquer reivindicações, indenizações, custos ou perdas resultantes.  Podemos tomar essas medidas com ou sem aviso prévio.',

'16.1. Encerramento de contas: reservamo-nos o direito, sem limitações, de encerrar sua conta, conta de Apoiador ou desativar seu acesso aos Serviços nas seguintes circunstâncias: (i) não conseguimos confirmar que sua Arrecadação de fundos está em conformidade com estes Termos de Serviço; (ii) não conseguimos oferecer suporte técnico à sua conta ou conta de Apoiador; (iii) nossos processadores de pagamento não conseguem oferecer suporte à sua conta ou conta de Apoiador; (iv) o Beneficiário solicita a remoção da arrecadação de fundos; (v) sua conta ou conta de Apoiador se torna inativa ou é abandonada; (vi) sua conta ou conta de Apoiador apresenta atividade que represente risco ao THEPUREGRACE ou à sua comunidade; ou (vii) essa medida for exigida para cumprir ordem judicial, mandado, liminar ou conforme exigido pelas leis e regulamentos aplicáveis. Se fecharmos a sua conta ou conta de Apoiador ou, de outra forma, desativarmos o seu acesso aos Serviços por qualquer um desses motivos, também poderemos emitir reembolsos, conforme apropriado, de acordo com estes Termos de Serviço e a Garantia de Doação THEPUREGRACE.',

'17. Isenções de responsabilidade e limitações de responsabilidade',
'17.1. Isenção de garantia: SEU USO DOS SERVIÇOS OCORRE POR SUA PÓPRIA CONTA E RISCO. NA MEDIDA PERMITIDA PELA LEI APLICÁVEL, OS SERVIÇOS SÃO FORNECIDOS “NO ESTADO EM QUE SE ENCONTRAM“ E “CONFORME DISPONÍVEIS“. O THEPUREGRACE E CADA UMA DE SUAS AFILIADAS REJEITAM E EXCLUEM EXPRESSAMENTE, NA MÁXIMA MEDIDA PERMITIDA PELA LEGISLAÇÃO APLICÁVEL, TODAS AS GARANTIAS, CONDIÇÕES E DECLARAÇÕES DE QUALQUER TIPO, SEJAM EXPRESSAS, IMPLÍCITAS OU LEGAIS, INCLUINDO, ENTRE OUTRAS, AS GARANTIAS IMPLÍCITAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UMA FINALIDADE ESPECÍFICA, TITULARIDADE E NÃO VIOLAÇÃO DE DIREITOS.',

'SEM PREJUÍZO DAS  GARANTIAS PREVISTAS EM LEI, E SEM PREJUÍZO DAS EXIGÊNCIAS DE MODERAÇÃO DE CONTEÚDO CONFORME PRESCRITOS PELA LEGISLAÇÃO APLICÁVEL, O THEPUREGRACE E SUAS RESPECTIVAS EMPRESAS AFILIADAS NÃO FAZEM NENHUMA GARANTIA OU REIVINDICAÇÃO DE QUE: (I) OS SERVIÇOS ATENDERÃO A TODAS ÀS SUAS EXIGÊNCIAS; (II) OS SERVIÇOS FUNCIONARÃO DE MODO ININTERRUPTO, SEM ATRASOS, SEGURO OU SEM ERROS; (III) OS RESULTADOS OBTIDOS POR MEIO DO USO DOS SERVIÇOS SERÃO EXATOS OU CONFIÁVEIS; OU (IV) A QUALIDADE DE QUALQUER PRODUTO, SERVIÇO, INFORMAÇÃO OU OUTRO MATERIAL COMPRADO OU OBTIDO POR MEIO DO SERVIÇO ATENDERÁ ÀS SUAS EXPECTATIVAS.',

'TODAS AS INFORMAÇÕES E CONTEÚDOS DE TERCEIROS NOS SERVIÇOS SÃO APENAS PARA FINS INFORMATIVOS. A THEPUREGRACE E SUAS EMPRESAS AFILIADAS NÃO GARANTEM A EXATIDÃO, INTEGRIDADE, ATUALIDADE OU CONFIABILIDADE DESSAS INFORMAÇÕES. NENHUM CONTEÚDO TEM COMO OBJETIVO OFERECER CONSULTORIA FINANCEIRA, JURÍDICA, TRIBUTÁRIA OU OUTRO TIPO DE CONSULTORIA PROFISSIONAL. ANTES DE TOMAR DECISÕES SOBRE CAMPANHA, ORGANIZAÇÕES SEM FINS LUCRATIVOS, DOAÇÕES OU QUALQUER INFORMAÇÃO RELACIONADA, CONSULTE UM PROFISSIONAL DA ÁREA FINANCEIRA, JURÍDICA, TRIBUTÁRIA OU OUTRO PROFISSIONAL. VOCÊ RECONHECE QUE ACESSA TODAS AS INFORMAÇÕES E CONTEÚDOS DOS SERVIÇOS POR SUA CONTA E RISCO.',

'NÃO GARANTIMOS QUE QUALQUER CAMPANHA RECEBERÁ UM VALOR ESPECÍFICO DE DOAÇÕES OU QUALQUER DOAÇÃO. NÃO ENDOSSAMOS NENHUMA CAMPANHA, USUÁRIO OU CAUSA, E NÃO GARANTIMOS A PRECISÃO DAS INFORMAÇÕES FORNECIDAS POR MEIO DOS SERVIÇOS. COMO DOADOR, VOCÊ PRECISA DETERMINAR O VALOR E A ADEQUAÇÃO DE CONTRIBUIR PARA QUALQUER USUÁRIO OU CAMPANHA.',

'17.2. LIMITAÇÃO DE RESPONSABILIDADE: VOCÊ ENTENDE E CONCORDA EXPRESSAMENTE QUE, NA MÁXIMA MEDIDA PERMITIDA PELA LEGISLAÇÃO APLICÁVEL, NEM O THEPUREGRACE NEM QUALQUER UMA DE SUAS AFILIADAS SERÁ RESPONSÁVEL POR: (I) DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS, PUNITIVOS OU DISCIPLINARES; (II) DANOS POR LUCROS CESSANTES; (III) DANOS POR PERDA DE FUNDO DE COMÉRCIO; (IV) DANOS POR PERDA DE USO; (V) PERDA OU CORRUPÇÃO DE DADOS; OU (VI) OUTRAS PERDAS INTANGÍVEIS (MESMO QUE O THEPUREGRACE TENHA SIDO AVISADO SOBRE A POSSIBILIDADE DE TAIS DANOS), SEJA COM BASE EM CONTRATO, ATO ILÍCITO, NEGLIGÊNCIA, RESPONSABILIDADE OBJETIVA OU OUTRO, RESULTANTES DE: (A) USO OU IMPOSSIBILIDADE DE USO DOS SERVIÇOS, INCLUINDO QUAISQUER FUNCIONALIDADES DE IA; (B) CUSTO DE AQUISIÇÃO DE BENS E SERVIÇOS SUBSTITUTOS RESULTANTES DE QUAISQUER BENS, DADOS, INFORMAÇÕES OU SERVIÇOS ADQUIRIDOS OU OBTIDOS, MENSAGENS RECEBIDAS OU TRANSAÇÕES REALIZADAS POR MEIO DOS SERVIÇOS; (C) QUAISQUER PROMOÇÕES E PRÊMIOS OU RECOMPENSAS RELACIONADOS DISPONIBILIZADOS POR MEIO DOS SERVIÇOS; (D) ACESSO NÃO AUTORIZADO OU ALTERAÇÃO DE SUAS TRANSMISSÕES OU DADOS; (E) DECLARAÇÕES OU CONDUTA DE QUALQUER TERCEIRO NOS SERVIÇOS; OU (F) QUALQUER OUTRO ASSUNTO RELACIONADO AOS SERVIÇOS. NA MÁXIMA MEDIDA PERMITIDA PELA LEGISLAÇÃO APLICÁVEL, EM NENHUMA HIPÓTESE A RESPONSABILIDADE TOTAL DO THEPUREGRACE PERANTE VOCÊ POR TODOS OS DANOS, PERDAS (INCLUINDO RESPONSABILIDADE CONTRATUAL, POR NEGLIGÊNCIA, LEGAL OU OUTRA) OU CAUSAS DE PEDIR EXCEDERÁ O VALOR QUE VOCÊ PAGOU AO THEPUREGRACE NOS ÚLTIMOS SEIS (6) MESES OU, SE MAIOR, CEM DÓLARES AMERICANOS (US$ 100).',

'VOCÊ CONCORDA QUE NEM O THEPUREGRACE NEM QUALQUER DE SUAS AFILIADAS SERÃO RESPONSÁVEIS DE QUALQUER FORMA POR QUALQUER CONTEÚDO OU MATERIAL DE TERCEIROS (INCLUINDO USUÁRIOS), QUALQUER CONTEÚDO DE USUÁRIO (INCLUINDO, MAS NÃO SE LIMITANDO A, QUAISQUER ERROS OU OMISSÕES EM QUALQUER CONTEÚDO DE USUÁRIO), OU POR QUALQUER PERDA OU DANO DE QUALQUER TIPO INCORRIDO COMO RESULTADO DO USO DE TAL CONTEÚDO DE USUÁRIO. VOCÊ CONCORDA QUE O THEPUREGRACE NÃO É RESPONSÁVEL POR QUAISQUER AÇÕES QUE VOCÊ REALIZE BASEADO EM CONTEÚDO OU RESULTADOS GERADOS POR MEIO DE RECURSOS DE IA, NEM POR QUAISQUER ERROS, OMISSÕES OU REPRESENTAÇÕES ENGANOSAS CONTIDAS EM CONTEÚDO GERADO POR IA. O USO DESTES RECURSOS É POR SUA PRÓPRIA CONTA E RISCO. VOCÊ RECONHECE QUE O THEPUREGRACE NÃO FAZ A PRÉ-VERIFICAÇÃO DE TODO O CONTEÚDO DO USUÁRIO, MAS QUE O THEPUREGRACE E SEUS DESIGNADOS TERÃO O DIREITO (MAS NÃO A OBRIGAÇÃO), A SEU CRITÉRIO EXCLUSIVO, DE RECUSAR, REMOVER OU PERMITIR QUALQUER CONTEÚDO DE USUÁRIO DISPONÍVEL NOS SERVIÇOS A QUALQUER MOMENTO E POR QUALQUER MOTIVO, COM OU SEM AVISO, E SEM QUALQUER RESPONSABILIDADE PARA COM VOCÊ OU QUALQUER TERCEIRO POR QUAISQUER RECLAMAÇÕES, DANOS, CUSTOS OU PREJUÍZOS DECORRENTES DISSO. NÓS RENUNCIAMOS EXPRESSAMENTE A QUALQUER RESPONSABILIDADE PELO RESULTADO OU SUCESSO DE QUALQUER ARRECADAÇÃO DE FUNDOS.',

'ALGUMAS JURISDIÇÕES NÃO PERMITEM A EXCLUSÃO DE CERTAS GARANTIAS OU A LIMITAÇÃO OU EXCLUSÃO DE RESPONSABILIDADE CIVIL POR DANOS INCIDENTAIS OU CONSEQUENTES. ASSIM, ALGUMAS LIMITAÇÕES DISPOSTAS ANTERIORMENTE NESTE DOCUMENTO PODEM NÃO SE APLICAR AO SEU CASO INDIVIDUAL. CASO VOCÊ NÃO FIQUE SATISFEITO COM ALGUMA PARTE DO SERVIÇO OU COM ESTES TERMOS DE SERVIÇO, SEU ÚNICO RECURSO É PARAR DE USAR OS SERVIÇOS.',

'18. Indenização e isenção de responsabilidade',
'18.1. Obrigações dos usuários de indenizar oTHEPUREGRACE contra certos tipos de reclamações: na máxima extensão permitida pela legislação aplicável, você concorda em liberar, indenizar e isentar o THEPUREGRACE, suas afiliadas e seus diretores, funcionários, administradores e agentes de quaisquer perdas, indenizações, despesas (incluindo honorários advocatícios razoáveis), custos, sanções, multas, reivindicações e ações de qualquer tipo, decorrentes ou relacionadas ao seu uso dos Serviços, qualquer doação ou arrecadação de fundos, qualquer conteúdo do usuário ou conteúdo gerado por IA, sua conexão com os Serviços, sua violação destes Termos de Serviço ou sua violação de quaisquer direitos de terceiros. Você concorda que o THEPUREGRACE tem o direito de conduzir sua própria defesa em quaisquer reivindicações, a seu exclusivo critério, e que você indenizará o THEPUREGRACE pelos custos dessa defesa.',

'18.2. Renúncia a reivindicações: caso resida na Califórnia, EUA, você renuncia à Seção 1542 do Código Civil da Califórnia, que dispõe: “Uma renúncia geral não se estende a reivindicações que o credor ou a parte que renuncia não conhece ou suspeita existir em seu favor no momento da execução da renúncia, e que, se conhecidas, teriam afetado materialmente seu acordo com o devedor ou a parte liberada.” Se você for residente de outra jurisdição – dentro ou fora dos Estados Unidos – renuncia a qualquer estatuto ou doutrina comparável, na medida permitida por lei.',

'19. Resolução de disputas e arbitragem',
'19.1. USUÁRIOS DOS EUA E DE QUALQUER UTRO LUGAR DO MUNDO, SALVO DO ESPAÇO ECONÔMICO EUROPEU, REINO UNIDO E SUÍÇA:',

'LEIA ESTA SEÇÃO COM ATENÇÃO  ANTES DE USAR OS SERVIÇOS OU A PLATAFORMA, POIS ESTE CONTRATO AFETA SEUS DIREITOS E REGE A FORMA COMO AS POSSÍVEIS REIVINDICAÇÕES ENTRE VOCÊ E NÓS SERÃO RESOLVIDAS. Este Contrato exige que você arbitre disputas com o THEPUREGRACE e limita a maneira pela qual você pode buscar reparação. Este Contrato limita determinados direitos, inclusive o direito a um julgamento com júri, o direito de participar de qualquer forma de reivindicação, disputa ou ação coletiva, de classe ou representativa, e o direito a determinados recursos judiciais e formas de reparação.  Outros direitos que você ou nós teríamos no tribunal, como um recurso de apelação, também podem não estar disponíveis no processo de arbitragem descrito nesta seção.',

'(a) Resolução informal: você e o THEPUREGRACE concordam que os esforços informais, de boa-fé, para resolver disputas, podem, frequentemente, apresentar um resultado rápido, de baixo custo e mutuamente benéfico. No caso improvável de surgir um desacordo entre você e o THEPUREGRACE em relação a qualquer reivindicação ou controvérsia legal ou patrimonial decorrente, relacionada ou conectada de alguma forma aos Serviços ou à Plataforma (coletivamente, “Disputa”), antes de iniciar qualquer ação judicial, você deve primeiro entrar em contato conosco diretamente por e-mail em gfmlegal@THEPUREGRACE.com. Você deve informar seu nome, o endereço de e-mail associado à sua conta do THEPUREGRACE (se houver), uma descrição da disputa e a solução específica que está buscando.',

'Você concorda que o termo “Disputa” nestes Termos de Serviço terá o significado mais amplo possível. Estes Termos também abrangem qualquer Disputa entre você e os executivos, diretores, membros do conselho administrativo, agentes, funcionários, empresas afiliadas do THEPUREGRACE ou terceiros, se o THEPUREGRACE puder ser responsável, seja direta ou indiretamente, pela Disputa em questão.  Isso inclui Disputas decorrentes ou relacionadas à sua relação conosco, inclusive, sem limitação, disputas relacionadas a estes Termos de Serviço ou à violação, rescisão, execução, interpretação ou validade dos mesmos, seu uso dos serviços e/ou direitos de privacidade e/ou publicidade.',

'Durante os 60 dias a partir da data em que você entrou em contato conosco pela primeira vez para nos informar sobre a Disputa, você e nós concordamos em fazer o possível, de boa-fé, para resolver a Disputa. Você não iniciará nenhum processo judicial durante esse período. Uma prorrogação de prazo pode ser mutuamente acordada por você e por nós.',

'A participação em uma conferência informal de resolução de disputas é uma exigência que deve ser cumprida antes de iniciar uma arbitragem ou processo judicial. O prazo de prescrição e os prazos de taxas de registro serão suspensos enquanto as partes participarem do processo informal de resolução de disputas exigido por este parágrafo.',

'(b)  Acordo de Arbitragem Vinculante e Renúncia a Ações Coletivas: VOCÊ E O THEPUREGRACE CONCORDAM QUE QUALQUER DISPUTA DECORRENTE OU RELACIONADA A ESTE CONTRATO OU AOS NOSSOS SERVIÇOS É PESSOAL A VOCÊ E AO THEPUREGRACE.  VOCÊ E O THEPUREGRACE CONCORDAM QUE QUALQUER DISPUTA, REIVINDICAÇÃO OU CONTROVÉRSIA PRECISA SER ARBITRADA INDIVIDUALMENTE E NÃO EM FORMA DE CLASSE OU AÇÃO COLETIVA E NÃO EM UM TRIBUNAL DE JUSTIÇA. VOCÊ E NÓS, POR MEIO DESTE INSTRUMENTO, RENUNCIAMOS EXPRESSAMENTE A QUAISQUER DIREITOS DE PROCESSAR EM TRIBUNAL E DE RECEBER JULGAMENTO POR JUIZ OU JÚRI OU DE PARTICIPAR COMO REQUERENTE OU MEMBRO DE AÇÃO DE CLASSE EM QUALQUER AÇÃO COLETIVA OU PROCESSO REPRESENTATIVO.  O árbitro, e não um tribunal ou órgão federal, estadual ou municipal, terá autoridade exclusiva para resolver as disputas relacionadas à interpretação, aplicabilidade, executoriedade ou formação deste Acordo de Arbitragem, inclusive, dentre outros, qualquer alegação de que toda ou qualquer parte deste Acordo de Arbitragem é nula ou anulável.  Os procedimentos de arbitragem e o resultado da arbitragem estão sujeitos a determinadas regras de confidencialidade, e a conferência judicial do resultado da arbitragem é limitada.  A descoberta e os direitos de apelação na arbitragem são, de modo geral, mais limitados do que em uma ação judicial, e outros direitos que você e nós teríamos no tribunal podem não estar disponíveis na arbitragem. A decisão do árbitro será final e vinculante e poderá ser registrada como sentença em qualquer tribunal de jurisdição competente. Este Acordo de arbitragem de disputas, reivindicações ou controvérsias será aqui referido como “Acordo de Arbitragem”.',

'Não obstante o disposto acima, o Acordo de Arbitragem não exigirá a arbitragem das seguintes Disputas: (i) Disputas individuais qualificadas no juizado de pequenas causas, contanto que a ação individual permaneça no juizado de pequenas causas e avance apenas individualmente (não de classe, não representativa); (ii) uma ação de execução por meio do respectivo órgão federal, estadual ou municipal, se essa ação estiver disponível; ou (iii) medida cautelar ou outro recurso equitativo em um tribunal de jurisdição competente para qualquer disputa relacionada à infração real ou ameaçada ou outro uso indevido de direitos de propriedade intelectual (como marcas, imagem comercial, nomes de domínio, segredos comerciais, direitos autorais e patentes).',

'(c)  Processo, Regras e Fórum de Arbitragem: você e o THEPUREGRACE concordam que os termos deste Acordo de Arbitragem são regidos pela Lei referente a arbitragem federal dos EUA (Federal Arbitration Act, FAA) em todos os aspectos.  Se, por qualquer motivo, as regras e os procedimentos da FAA não puderem ser aplicados, será aplicada a lei estadual que rege os acordos de arbitragem do seu estado de residência.',

'A arbitragem será administrada pela American Arbitration Association (“AAA”) de acordo com suas Regras de Arbitragem do Consumidor (coletivamente, “Regras da AAA”), inclusive suas Regras Complementares de Arbitragem em Massa, conforme modificadas por estes Termos de Serviço. As Regras da AAA e os formulários estão disponíveis online em www.adr.org. Salvo se acordado de outro modo por escrito entre as partes, os procedimentos de arbitragem permanecerão confidenciais. Salvo se você e o THEPUREGRACE concordarem de outra forma, ou que o processo de Arbitragem em Massa descrito abaixo seja acionado, a arbitragem será conduzida no condado/município em que você reside. Qualquer solicitação de arbitragem apresentada à AAA deve estar em conformidade com os requisitos estabelecidos pela própria AAA nas suas Regras da AAA. Além disso, a solicitação deve incluir uma declaração certificando a realização da conferência de resolução informal de disputas, conforme descrito na seção de resolução informal de disputas acima. Uma cópia da Solicitação de Arbitragem deve ser enviada por e-mail ao advogado que representou o THEPUREGRACE no processo de resolução informal de disputas ou, na ausência de tal advogado, por e-mail para gfmlegal@THEPUREGRACE.com e por correio para Attn: Legal, PO Box 121270, 815 E Street, San Diego, CA, 92101, EUA.',

'Se a parte que solicitar a arbitragem for representada por advogado, o Pedido de Arbitragem incluirá também o nome, o número de telefone, o endereço de correspondência e o endereço de e-mail do advogado.  O advogado também precisa assinar o Pedido de Arbitragem.  Ao assinar a solicitação, o advogado declara, salvo melhor juízo, formado após uma investigação razoável conforme as circunstâncias, que (1) o Pedido de Arbitragem não está sendo protocolado para qualquer finalidade indevida, como perturbar, causar atrasos desnecessários ou aumentar, sem necessidade, o custo da resolução de disputas; (2) as reivindicações, defesas e outras alegações judiciais são garantidas pela legislação existente ou por um argumento não frívolo para estender, modificar ou reverter a lei existente ou para estabelecer uma nova lei; e (3) as alegações factuais e de indenizações têm apoio probatório ou, se especificamente identificadas, provavelmente teremos apoio probatório após uma oportunidade razoável para investigação ou descoberta adicional.',

'(d) Taxas de Arbitragem: sua responsabilidade pelo pagamento de taxas de protocolo da AAA, taxas de gestão de casos e remuneração do árbitro será exclusivamente conforme estabelecido nas Regras da AAA.',

'(e) Arbitragens em Massa: no caso de 25 ou mais Pedidos de Arbitragem de natureza semelhante serem apresentadas contra o THEPUREGRACE, em que a representação de todas as partes seja consistente ou coordenada em todos os casos, as Regras Complementares da AAA para Arbitragem em Massa se aplicarão.',

'Todas as partes concordam que os Pedidos de Arbitragem são de “natureza semelhante” se surgirem do mesmo evento ou cenário factual semelhante e levantarem questões jurídicas iguais ou semelhantes e buscarem reparação igual ou semelhante. Na medida em que as partes discordem quanto à aplicabilidade do processo de Arbitragem em Massa, a parte que discorda aconselhará a AAA, e a AAA indicará um único árbitro para o processo para determinar a aplicabilidade do processo de Arbitragem em Massa (“Árbitro do Processo”). Em um esforço para agilizar a resolução dessas disputas, as partes concordam que o Árbitro do Processo pode estabelecer os procedimentos necessários para resolver as disputas prontamente.  Caso os esforços iniciais para a resolução de disputas por meio da mediação da AAA-ICDR, conforme estabelecido na Seção MA-9 das Regras Complementares da AAA para Arbitragem em Massa, falhem e os casos prossigam, você consente que o Árbitro do Processo ordene que os processos prossigam de acordo com os seguintes termos em lotes:',

'O Árbitro do Processo agrupará e administrará os pedidos de arbitragem em lotes de no máximo 26 pedidos por lote (mais, na medida em que restem menos de 26 pedidos de arbitragem após o lote descrito acima, um lote final consistindo os pedidos restantes).  13 (treze) do lote inicial serão selecionados pelos requerentes e seus advogados coordenados e 13 (treze) serão selecionados pelo THEPUREGRACE.   Se houver alguma disputa sobre a seleção dos requerentes, o Árbitro do Processo terá o poder exclusivo de selecionar as reivindicações.  Os Pedidos de Arbitragem restantes serão suspensos, e quaisquer honorários do provedor de arbitragem serão avaliados em conexão com os Pedidos de Arbitragem até que sejam selecionados para prosseguir com procedimentos de arbitragem individuais como parte do processo em etapas aqui descrito.  Se as partes não conseguirem resolver os Pedidos de Arbitragem restantes após a conclusão dos vinte e seis procedimentos iniciais, as partes participarão de uma segunda sessão de mediação global. Caso essa segunda mediação não resulte em um acordo global, o processo em lote será repetido até que essa resolução seja alcançada.',

'Você concorda em cooperar, de boa-fé, com o THEPUREGRACE para implementar essa abordagem de lote para resolução e taxas, inclusive o pagamento de taxas de gestão de processo único e remuneração do árbitro para lotes, bem como quaisquer medidas para minimizar o tempo e os custos da arbitragem.  Qualquer prazo de prescrição aplicável ao seu Pedido de Arbitragem e aos prazos das taxas de protocolo será cobrado para disputas coordenadas em lote, contando do momento em que qualquer Pedido de Arbitragem for selecionado para o primeiro conjunto de procedimentos em lote até o momento em que seu Pedido de Arbitragem for selecionado para prosseguir com a arbitragem, retirada ou resolvida de outra forma.',

'Esta disposição de Arbitragem não será, de forma alguma, interpretada no sentido de autorizar arbitragem ou ação coletiva, de classe e/ou em massa de qualquer tipo, ou arbitragem que envolva reivindicações conjuntas ou consolidadas sob nenhuma circunstância, exceto conforme estabelecido nesta seção.  Se os termos relacionados a disputas em lote forem considerados inexequíveis para você ou o seu lote, eles serão cancelados e você concorda em arbitrar em processos individuais, conforme ordenado pelo Árbitro do processo, de acordo com esta seção.',

'(f)  Confidencialidade: ambas as partes concordam em manter a confidencialidade das disputas informais e dos processos de arbitragem, incluindo todas as informações trocadas entre nós e de qualquer oferta de acordo, salvo se exigido de outra forma pela legislação ou solicitado pelas autoridades judiciais, governamentais ou de cumprimento da lei. Cada uma das partes, contudo, poderá divulgar essas questões em confidencialidade aos nossos respectivos advogados, contadores, auditores e seguradoras.',

'(g)  Executoriedade: Se qualquer disposição destes Termos de Serviço ou desta seção de Resolução de Disputas for considerada inexequível, ilegal ou inválida por qualquer motivo, a inexequibilidade, ilegalidade ou invalidade não afetará nenhuma outra disposição destes Termos de Serviço ou desta seção de Resolução de Disputas, e estes Termos de Serviço e esta seção de Resolução de Disputas serão interpretados como se a disposição inexequível, ilegal ou inválida jamais existisse.',

'(h) Recusa: você pode optar por não participar deste Acordo de Arbitragem. Para recusar, você deve notificar o THEPUREGRACE por escrito no prazo máximo de 30 dias após passar a estar sujeito a este Acordo de Arbitragem, incluindo quaisquer atualizações do Acordo de Arbitragem. Sua notificação deve incluir seu nome e endereço, o título e o link da sua arrecadação de fundos no THEPUREGRACE (se houver), o endereço de e-mail que você usa para acessar sua conta ou conta de Apoiador no THEPUREGRACE (se tiver), e uma declaração CLARA de que você deseja recusar este Acordo de Arbitragem. Você precisa enviar o seu aviso de recusa para gfmlegal@THEPUREGRACE.com com o assunto “Arbitration Opt-Out Notice” (Aviso de Recusa de Arbitragem) na linha de assunto. Se você se recusar a aderir este Acordo de Arbitragem, todas as outras partes destes Termos de Serviço continuarão a ser aplicadas a você. O THEPUREGRACE continuará a honrar as recusas válidas de usuários que optaram corretamente por não aderir ao Acordo de Arbitragem em uma versão anterior dos Termos de Serviço.',

'(i)  Período para Reclamações: Você concorda que  qualquer reivindicação ou causa de pedir decorrente ou relacionada ao uso dos Serviços, da Plataforma ou destes Termos de Serviço tem de ser apresentada no prazo de 1 (um) ano após o surgimento da reivindicação ou causa de pedir, sob pena de prescrição, o que significa que você e o THEPUREGRACE não terão o direito de reivindicar a Reivindicação.',

'19.2. USUÁRIOS DO REINO UNIDO, DO ESPAÇO ECONÔMICO EUROPEU E DA SUÍÇA: estes Termos e qualquer disputa decorrente ou relacionada ao seu uso dos Serviços são regidos pelas leis da República da Irlanda, sujeitas a quaisquer disposições de ordem pública mais favoráveis previstas em sua legislação local, e os tribunais da República da Irlanda possuem jurisdição exclusiva, exceto enquanto a disposição de ordem pública prevista em sua legislação local permita a competência dos tribunais locais.',

'(a) Usuários na União Europeia, Noruega, Islândia ou Liechtenstein: Você tem o direito de submeter todas as disputas não resolvidas entre você e a THEPUREGRACE à arbitragem da plataforma de resolução de disputas online (ODR) administrada pela União Europeia: https://consumer-redress.ec.europa.eu/index_pt então em vigor, exceto que qualquer uma das partes poderá buscar medida cautelar/inibitórias por violação de direitos de propriedade intelectual ou outros direitos de proteção de dados em tribunal, e que a reclamações apresentada com base no Regulamento Geral de Proteção de Dados da UE ou do Reino Unido poderão ser resolvidas localmente perante tribunal competente ou mediante encaminhamento a autoridade reguladora de privacidade competente.',

'19.3. Disputas com outros usuários: você concorda que é o único responsável por suas interações com qualquer outro usuário em conexão com os Serviços e que nem o THEPUREGRACE nem suas Afiliadas terão qualquer responsabilidade ou obrigação a esse respeito. O THEPUREGRACE e as Afiliadas reservam o direito, mas não têm obrigação, de se envolver de qualquer forma em disputas entre você e qualquer outro usuário dos serviços.',

'20. Alterações aos Termos',
'20.1. Políticas sobre coo as alterações nos Termos de Serviço serão comunicadas e implementadas: reservamo-nos o direito, a nosso critério exclusivo, de alterar ou modificar partes destes Termos de Serviço a qualquer momento. Quando possível, forneceremos aviso prévio de 30 dias sobre alterações substanciais nestes Termos de Serviço e, se apropriado, poderemos informar os usuários sobre tais alterações por e-mail ou outros meios adequados. As alterações poderão ser feitas com pouco ou nenhum aviso se a alteração for exigida por lei. Se fizermos qualquer alteração, publicaremos os Termos de Serviço modificados nesta página e indicaremos a data da última revisão. O seu uso contínuo dos Serviços após a data de quaisquer dessas alterações constitui sua aceitação dos novos Termos de Serviço. Se não quiser aceitar os novos Termos de Serviço, você deve parar de usar os Serviços.',

'20.2. Vinculação à versão em inglês: na medida máxima permitida pela legislação aplicável, a versão destes Termos de Serviço em inglês é a versão vinculante, e as respectivas traduções para outros idiomas são disponibilizadas apenas a título de conveniência; em caso de discrepâncias entre a versão em inglês destes Termos de Serviço e suas respectivas traduções, a versão em inglês prevalecerá.',

'21. Disposições gerais',
'21.1. Acordo integral estes Termos de Serviço constituem o acordo integral entre você e o THEPUREGRACE, e regem o seu uso dos Serviços e da Plataforma, substituindo quaisquer acordos anteriores entre você e o THEPUREGRACE com relação aos Serviços. Você também pode estar sujeito a termos e condições adicionais que podem se aplicar quando você usar serviços de empresas afiliadas ou de terceiros, conteúdo de terceiros ou software de terceiros.',

'21.2. Lei aplicável: para usuários no Reino Unido, no Espaço Econômico Europeu e na Suíça, estes Termos de Serviço e qualquer disputa decorrente ou relacionada ao seu uso dos Serviços são regidos conforme definido acima em “Disputas – Usuários do Reino Unido, do Espaço Econômico Europeu e da Suíça”. Para todos os outros usuários, estes Termos de Serviço são regidos pelas leis do Estado da Califórnia, independentemente de conflitos entre leis. No que diz respeito a quaisquer disputas ou reivindicações que não estejam sujeitas a arbitragem, conforme disposto anteriormente, você e o THEPUREGRACE concordam em se submeter à jurisdição pessoal e exclusiva das varas estadual e federal situadas no Condado de San Mateo, na Califórnia.',

'21.3. Renúncia: o não exercício ou a falta de imposição de qualquer direito ou disposição constante destes Termos de Serviço pelo THEPUREGRACE não constituirá renúncia a este direito ou disposição.',

'21.4. Separabilidade: se qualquer disposição destes Termos de Serviço seja considerada inválida por um tribunal competente (ou seja de outra forma inválida), as partes concordam que o tribunal deverá empenhar-se para dar efeito às intenções das partes conforme refletido na disposição, e as demais disposições destes Termos de Serviço permanecerão em pleno vigor e efeito.',

'21.5. Versão impressa: uma versão impressa deste acordo e de qualquer aviso dado em forma eletrônica será admissível em processos judiciais ou administrativos baseados ou relacionados a este acordo, na mesma extensão e sujeita às mesmas condições que outros documentos e registros comerciais originalmente gerados e mantidos em formato impresso.',

'21.6. Cessão: você não pode ceder estes Termos de Serviço sem o consentimento prévio por escrito da THEPUREGRACE, mas a THEPUREGRACE e/ou suas Afiliadas podem ceder ou transferir estes Termos de Serviço, no todo ou em parte, sem qualquer restrição. A título de esclarecimento, o THEPUREGRACE e/ou suas Afiliadas podem, a qualquer momento, ceder nossos direitos ou delegar nossas obrigações aqui previstas, sem aviso prévio a você, em conexão com uma fusão, aquisição, reorganização ou venda de ações ou ativos, por força de lei ou por qualquer outro motivo.',

'21.7. Títulos das seções: os títulos das seções destes Termos de Serviço são somente para conveniência e não têm nenhum efeito jurídico ou contratual.',

'21.8. Avisos: na medida permitida pela legislação aplicável, os avisos a você poderão ser feitos por e-mail ou correio tradicional. Os Serviços também podem fornecer avisos a você sobre alterações nestes Termos de Serviço ou outros assuntos, exibindo avisos ou links para avisos de forma geral na Plataforma.',

'21.9. Força maior: salvo na medida em que a legislação aplicável disponha de outra forma, o THEPUREGRACE não será responsável por qualquer atraso ou falha no cumprimento resultante de causas fora de seu controle razoável, incluindo, mas não se limitando a, atos da natureza, guerra ou ameaças de guerra, terrorismo ou ameaças de terrorismo, motins, embargos, atos de autoridades civis ou militares, incêndios, inundações, acidentes, regulamentações ou orientações governamentais, ameaças à saúde reconhecidas, conforme determinado pela Organização Mundial da Saúde, pelos Centros de Controle e Prevenção de Doenças ou por autoridades governamentais locais ou agências de saúde, greves ou escassez ou restrição de meios de transporte, combustível, energia, mão de obra ou materiais.',

'21.10. Controles de exportação: o Software disponível associado aos Serviços e a transmissão dos dados aplicáveis, se houver, podem estar sujeitos a leis de controle de exportação e sanções econômicas dos EUA ou de outras jurisdições. Nenhum software pode ser baixado dos Serviços ou de alguma forma exportado ou reexportado de modo a infringir leis de controle de exportação e sanções econômicas. Baixar ou usar o software é de sua própria conta e risco. Você declara e garante que (i) não está localizado em um país que esteja sujeito a um embargo do Governo dos Estados Unidos, ou que tenha sido designado pelo Governo dos Estados Unidos como um país “que apoia o terrorismo”; (ii) não consta em nenhuma lista do Governo dos Estados Unidos de partes proibidas ou restritas; e (iii) não está localizado em qualquer outro país ou jurisdição da qual você seja impedido de usar os Serviços pela legislação aplicável.'
      
  ]
},
     ];
  openIndex: number | null = 0;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['item'];
      const index = this.items.findIndex((item) => item.id === id);
      this.openIndex = index >= 0 ? index : 0;
    });
  }
}
