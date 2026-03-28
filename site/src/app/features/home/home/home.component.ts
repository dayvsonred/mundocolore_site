import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Meta, Title } from '@angular/platform-browser';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  appName = APP_NAME;
  Logado = false;
  contactForm: FormGroup;
  impactInView = false;
  featuresInView = false;
  whatWeDoInView = false;
  assetsBaseUrl = environment.assetsBaseUrl;
  currentTestimonialIndex = 0;
  private testimonialInterval?: ReturnType<typeof setInterval>;
  metrics = [
    { label: 'Doações Realizadas', target: 20000, suffix: '+', display: 0 },
    { label: 'Projetos Financiados', target: 200, suffix: '+', display: 0 },
    { label: 'Vidas Impactadas', target: 4000, suffix: '+', display: 0 },
  ];
  private impactObserver?: IntersectionObserver;
  private featuresObserver?: IntersectionObserver;
  private whatWeDoObserver?: IntersectionObserver;
  private metricsAnimated = false;
  @ViewChild('impactSection') impactSection?: ElementRef<HTMLElement>;
  @ViewChild('featuresSection') featuresSection?: ElementRef<HTMLElement>;
  @ViewChild('whatWeDoSection') whatWeDoSection?: ElementRef<HTMLElement>;
  features = [
    {
      title: 'Pagamentos Seguros',
      description: 'Doações protegidas com criptografia e monitoramento antifraude.',
      icon: `${environment.assetsBaseUrl}/assest/bloqueio-inteligente.png`,
    },
    {
      title: 'Transparência Total',
      description: 'Acompanhe cada etapa e veja o impacto real da sua doação.',
      icon: `${environment.assetsBaseUrl}/assest/comunidade-online.png`,
    },
    {
      title: 'Comunidade Engajada',
      description: 'Conecte-se a pessoas e causas que transformam vidas.',
      icon: `${environment.assetsBaseUrl}/assest/reconhecimento-de-olho.png`,
    },
  ];
  testimonials = [
    {
      name: 'Mariana Oliveira',
      role: 'Doadora',
      text: 'Doei com confiança e recebi atualizações claras. Ver o impacto real foi emocionante.',
      avatarIcon: 'person',
    },
    {
      name: 'Hiago Lima',
      role: 'Voluntário',
      text: 'A plataforma conecta pessoas de verdade. O processo é simples e transparente.',
      avatarIcon: 'person',
    },
    {
      name: 'Camila Rocha',
      role: 'Beneficiária',
      text: 'A doação chegou no momento certo. Sou muito grata por essa rede de apoio.',
      avatarIcon: 'person',
    },
    {
      name: 'Pedro Alves',
      role: 'Doador',
      text: 'Segurança e credibilidade fizeram a diferença. Hoje faço parte dessa comunidade.',
      avatarIcon: 'person',
    },
  ];
  blogPosts = [
    {
      title: 'Nosso Impacto em 2025',
      excerpt: 'Saiba como suas doações transformaram vidas este ano.',
      link: '/home/novidades',
      queryParams: { post: 'impacto-2025' }
    },
    {
      title: 'Atualizações da Plataforma',
      excerpt: 'Acompanhe melhorias, novidades e evoluções contínuas do nosso sistema.',
      link: '/home/novidades',
      queryParams: { post: 'educacao-2025' }
    },
  ];
  teamMembers = [
    { name: 'Marina Oliveira', role: 'CMO – Chief Marketing Officer (Diretor de Marketing)', email: 'domains@thepuregrace.com', image: `${environment.assetsBaseUrl}/assest/cmo_v1.png`, style: "" },
    { name: 'Dayvson Vicente', role: ' CTO – Chief Technology Officer (Diretor de Tecnologia) ', email: 'admin@thepuregrace.com', image: `${environment.assetsBaseUrl}/assest/cto_v1.png`, style: "" },
  ];
  router: any;

  constructor(
    private fb: FormBuilder,
    private titleService: Title,
    private notificationService: NotificationService,
    private meta: Meta,
    private authenticationService: AuthenticationService,
    private globalService: GlobalService,
    private http: HttpClient
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

  ngAfterViewInit(): void {
    const impact = this.impactSection?.nativeElement;
    if (impact) {
      this.impactObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            this.impactInView = true;
            if (!this.metricsAnimated) {
              this.metricsAnimated = true;
              this.animateMetrics();
            }
          }
        },
        { threshold: 0.35 }
      );

      this.impactObserver.observe(impact);
    }

    const features = this.featuresSection?.nativeElement;
    if (features) {
      this.featuresObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          this.featuresInView = entry.isIntersecting;
        },
        { threshold: 0.25 }
      );

      this.featuresObserver.observe(features);
    }

    const whatWeDo = this.whatWeDoSection?.nativeElement;
    if (whatWeDo) {
      this.whatWeDoObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          this.whatWeDoInView = entry.isIntersecting;
        },
        { threshold: 0.3 }
      );

      this.whatWeDoObserver.observe(whatWeDo);
    }

    this.startTestimonialsAutoSlide();
  }

  ngOnDestroy(): void {
    this.impactObserver?.disconnect();
    this.featuresObserver?.disconnect();
    this.whatWeDoObserver?.disconnect();
    this.stopTestimonialsAutoSlide();
  }

  logout(): void {
    this.authenticationService.logout();
    this.Logado = false;
    this.router.navigate(['/']);
  }

  async submitContact(): Promise<void> {
    if (this.contactForm.invalid) {
      this.notificationService.openSnackBar('Preencha todos os campos corretamente.');
      this.contactForm.markAllAsTouched();
      return;
    }

    const ip = await this.getUserIP(); // Aguarda IP

    const formValues = this.contactForm.value;
    const payload = {
      nome: formValues.name,
      email: formValues.email,
      mensagem: formValues.message,
      ip: ip,
      location: 'Desconhecida', // Pode adicionar geolocalização no futuro
      token: 'browser-123',     // Ou gerar dinamicamente
    };

    this.globalService.sendContactMessage(payload).subscribe({
      next: () => {
        this.notificationService.openSnackBar('Mensagem enviada com sucesso!');
        this.contactForm.reset();
        // Reset com valores padrão
        this.contactForm.reset({
          name: '',
          email: '',
          message: ''
        });

        Object.keys(this.contactForm.controls).forEach(key => {
          const control = this.contactForm.get(key);
          control?.markAsPristine();
          control?.markAsUntouched();
          control?.updateValueAndValidity();
        });

      },
      error: (err) => {
        this.notificationService.openSnackBar(err);
      }
    });
  }


  getUserIP(): Promise<string> {
    return this.http.get<any>('https://api.ipify.org?format=json')
      .toPromise()
      .then((res) => res.ip)
      .catch(() => '0.0.0.0');
  }

  formatMetricValue(metric: { display: number; target: number; suffix: string }): string {
    const formatted = Math.round(metric.display).toLocaleString('pt-BR');
    return `${formatted}${metric.suffix}`;
  }

  private animateMetrics(): void {
    const duration = 1400;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.metrics = this.metrics.map((metric) => ({
        ...metric,
        display: metric.target * eased,
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private startTestimonialsAutoSlide(): void {
    if (this.testimonials.length <= 1) {
      return;
    }
    this.testimonialInterval = setInterval(() => {
      this.nextTestimonial();
    }, 5000);
  }

  private stopTestimonialsAutoSlide(): void {
    if (this.testimonialInterval) {
      clearInterval(this.testimonialInterval);
      this.testimonialInterval = undefined;
    }
  }

  pauseTestimonials(): void {
    this.stopTestimonialsAutoSlide();
  }

  resumeTestimonials(): void {
    this.startTestimonialsAutoSlide();
  }

  nextTestimonial(): void {
    this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
  }

  goToTestimonial(index: number): void {
    this.currentTestimonialIndex = index;
  }
}
