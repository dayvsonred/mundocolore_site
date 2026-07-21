import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface StorePageCard {
  title: string;
  text: string;
}

interface StorePageContent {
  kicker: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionRoute: string;
  cards: StorePageCard[];
  highlightTitle: string;
  highlightText: string;
  contactEmail?: string;
  contactNote?: string;
}

@Component({
  selector: 'app-store-page',
  templateUrl: './store-page.component.html',
  styleUrls: ['./store-page.component.scss']
})
export class StorePageComponent implements OnInit, OnDestroy {
  readonly logoPath = 'assets/images/logo-mundo-colore.jpg';
  page!: StorePageContent;

  private routeSubscription?: Subscription;

  private readonly pages: Record<string, StorePageContent> = {
    colecoes: {
      kicker: 'Coleções Mundo Colore',
      title: 'Escolha por coleção e encontre combinações para cada fase',
      subtitle: 'Uma curadoria organizada por estação, ocasião e conforto para deixar a compra mais simples.',
      actionLabel: 'Ver catálogo completo',
      actionRoute: '/catalog',
      cards: [
        { title: 'Verão colorido', text: 'Peças leves, estampas alegres e tecidos pensados para dias quentes.' },
        { title: 'Outono confortável', text: 'Looks de meia estação com toque macio e combinações fáceis.' },
        { title: 'Essenciais do dia a dia', text: 'Bodies, conjuntos, camisetas e calças para a rotina das crianças.' }
      ],
      highlightTitle: 'Coleções pensadas para comprar com menos esforço',
      highlightText: 'Use o catálogo para filtrar por tamanho, marca, cor e preço e encontrar a escolha certa para cada criança.'
    },
    promocoes: {
      kicker: 'Promoções',
      title: 'Ofertas selecionadas para completar o guarda-roupa infantil',
      subtitle: 'Acompanhe itens com condições especiais e oportunidades para montar looks completos.',
      actionLabel: 'Ver produtos em promoção',
      actionRoute: '/catalog',
      cards: [
        { title: 'Kits combinando', text: 'Conjuntos e peças coordenadas para vestir com praticidade.' },
        { title: 'Últimas unidades', text: 'Produtos com estoque limitado podem aparecer com preços especiais.' },
        { title: 'Novidades com cupom', text: 'Campanhas sazonais para aproveitar lançamentos com desconto.' }
      ],
      highlightTitle: 'Boas oportunidades para deixar a infância ainda mais colorida',
      highlightText: 'Os produtos em promoção aparecem no catálogo com suas condições atualizadas para uma compra simples e transparente.'
    },
    contato: {
      kicker: 'Vamos conversar?',
      title: 'Cuidamos de cada detalhe para sua compra ser leve e feliz',
      subtitle: 'A Mundo Colore é uma loja de roupas infantis feita para acompanhar descobertas, brincadeiras e momentos especiais. Se precisar de ajuda, nossa equipe está pertinho.',
      actionLabel: 'Conhecer nossos produtos',
      actionRoute: '/catalog',
      cards: [
        { title: 'Dúvidas sobre produtos', text: 'Converse com a gente sobre modelos, tecidos, cores e disponibilidade.' },
        { title: 'Ajuda com tamanhos', text: 'Conte um pouco sobre o que procura e ajudamos a escolher a numeração ideal.' },
        { title: 'Pedidos e entregas', text: 'Envie os dados do pedido para receber orientações sobre pagamento, envio ou troca.' }
      ],
      highlightTitle: 'Um atendimento atencioso para toda a família',
      highlightText: 'Queremos que escolher roupas para os pequenos seja uma experiência tranquila. Escreva para nós e responderemos com todo o carinho.',
      contactEmail: 'contato@mundocolorestore.com',
      contactNote: 'Este é o nosso canal oficial para dúvidas, sugestões e atendimento sobre pedidos.'
    }
  };

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.resolvePage();
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.resolvePage());
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  navigateToAction(): void {
    this.router.navigate([this.page.actionRoute]);
  }

  private resolvePage(): void {
    const routeKey = this.router.url.split('?')[0].split('/').filter(Boolean)[0] || 'colecoes';
    this.page = this.pages[routeKey] || this.pages['colecoes'];
  }
}
