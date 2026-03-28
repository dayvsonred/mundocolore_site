import { Component, OnInit } from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Meta, Title } from '@angular/platform-browser';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-complaint',
  templateUrl: './complaint.component.html',
  styleUrls: ['./complaint.component.css']
})
export class ComplaintComponent implements OnInit {
  assetsBaseUrl = environment.assetsBaseUrl;
  appName = APP_NAME;
  Logado = false;
  contactForm: FormGroup;
  testimonials = [
    { name: 'João Silva', text: 'Minha doação fez a diferença! A plataforma é fácil de usar e transparente.', role: 'Doador' },
    { name: 'Maria Oliveira', text: 'Apoiar esta causa foi emocionante. A história deles me inspirou!', role: 'Voluntária' },
  ];
  blogPosts = [
    { title: 'Nosso Impacto em 2025', excerpt: 'Saiba como suas doações transformaram vidas este ano.', link: '/blog/impacto-2025' },
    { title: 'Nova Campanha de Educação', excerpt: 'Lançamos uma iniciativa para apoiar escolas locais.', link: '/blog/educacao-2025' },
  ];
  teamMembers = [
    { name: 'Ana Costa', role: 'Fundadora', image: 'https://becki.incognitothemes.com/assets/images/team/team-2.jpg' },
    { name: 'Pedro Almeida', role: 'Desenvolvedor', image: 'https://becki.incognitothemes.com/assets/images/team/team-1.jpg' },
  ];
  router: any;

  constructor(
    private fb: FormBuilder,
    private titleService: Title,
    private notificationService: NotificationService,
    private meta: Meta,
    private authenticationService: AuthenticationService,
    private globalService: GlobalService,
  ) {
    this.titleService.setTitle(APP_NAME + ' - Doar inspira vida');
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
    this.meta.addTags([
      { name: 'description', content: 'Doe para causas que transformam vidas com a ' + APP_NAME + ' Creative Agency.' },
      { name: 'keywords', content: 'doação, nonprofit, caridade, impacto social' },
    ]);
  }

  ngOnInit(): void {

    const currentUser = this.globalService.getCurrentUser();
    if (currentUser) {
      this.Logado = true;
    }


  }

  logout(): void {
    this.authenticationService.logout();
    this.Logado = false;
    this.router.navigate(['/']);
  }

  submitContact(): void {
    if (this.contactForm.invalid) {
      this.notificationService.openSnackBar('Preencha todos os campos corretamente.');
      this.contactForm.markAllAsTouched();
      return;
    }
    // Simulate API call
    this.notificationService.openSnackBar('Mensagem enviada com sucesso!');
    this.contactForm.reset();
  }
}



