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
      highlightText: 'Use a página de catálogo para filtrar por tamanho, marca, cor e preço enquanto novas coleções são adicionadas ao sistema.'
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
      highlightTitle: 'As promoções acompanham os produtos cadastrados',
      highlightText: 'Quando um produto estiver marcado como promoção no sistema, ele pode ser encontrado no catálogo usando o filtro Promoções.'
    },
    contato: {
      kicker: 'Contato',
      title: 'Fale com a Mundo Colore',
      subtitle: 'Tire dúvidas sobre produtos, tamanhos, pedidos e novidades da loja.',
      actionLabel: 'Ir para o catálogo',
      actionRoute: '/catalog',
      cards: [
        { title: 'Atendimento', text: 'Envie sua dúvida sobre pedidos, entregas ou disponibilidade de produtos.' },
        { title: 'Tamanhos', text: 'Conte com a gente para escolher a grade mais adequada antes da compra.' },
        { title: 'Novidades', text: 'Acompanhe lançamentos e coleções especiais da mundocolorestore.' }
      ],
      highlightTitle: 'Canal aberto para comprar com confiança',
      highlightText: 'Enquanto o formulário definitivo não estiver integrado, use os canais oficiais da loja e o catálogo para consultar produtos disponíveis.'
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
