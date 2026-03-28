import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from 'src/app/core/services/global.service';

interface NewsPost {
  id: string;
  title: string;
  content: string[];
}

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
    Logado = false;
  posts: NewsPost[] = [
    {
      id: 'impacto-2025',
      title: 'Nosso Impacto em 2025',
      content: [
        'Em 2025, milhares de doações chegaram a projetos que cuidam de saúde, educação e segurança alimentar.',
        'Com transparência e rastreabilidade, cada pessoa pôde acompanhar o destino da sua contribuição.',
        'O resultado foi um impacto real e mensurável nas comunidades atendidas, com histórias de transformação que inspiram.'
      ]
    },
    {
      id: 'educacao-2025',
      title: 'Atualizações da Plataforma',
      content: [
        'Implementamos melhorias de performance para tornar o processo de doação mais rápido e confiável.',
        'Novas camadas de segurança e monitoramento antifraude aumentam a proteção dos usuários.',
        'Também adicionamos recursos de acompanhamento de impacto para facilitar a conexão com as causas.'
      ]
    }
  ];
  openIndex: number | null = 0;

  constructor(private route: ActivatedRoute, private globalService: GlobalService,) { }


  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['post'];
      const index = this.posts.findIndex((post) => post.id === id);
      this.openIndex = index >= 0 ? index : 0;
    });
      const currentUser = this.globalService.getCurrentUser();
    if (currentUser) {
      this.Logado = true;
    }
  }

}
