import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { PaymentsService } from 'src/app/core/services/payments.service';
import { environment } from '../../../../environments/environment';
import { DialogSimpleMessageComponent } from '../dialog-simple-message/dialog-simple-message.component';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.css']
})
export class ShowComponent implements OnInit, OnDestroy {
  private readonly defaultDescription = 'Campanha de doacao no ThePureGrace. Contribua com seguranca e acompanhe a arrecadacao.';
  private readonly jsonLdScriptId = 'campaign-jsonld';
  assetsBaseUrl = environment.assetsBaseUrl;
  donation: any = null;
  mensagens: any[] = [];
  totalMensagensValor: any = 0;
  pixTotais: { valor_total: string; total_doadores: number } | null = null;
  total_doadores: any = 0;
  valor_total: any = 0;
  alcancado = 0;
  Logado = false;
  usuario = { name: "", email: "", date_create: "" };
  profileImageUrl = "";
  donateForm!: FormGroup;
  suggestedAmounts = [5, 10, 25, 50, 100, 200];
  isSubmitting = false;
  sliderImages: string[] = [];
  activeSlide = 0;
  private autoplayId?: number;
  showShareOptions = false;

  constructor(
    private notificationService: NotificationService,
    private globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private paymentsService: PaymentsService,
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.donateForm = this.fb.group({
      amount: [25, [Validators.required, Validators.min(5)]],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['firstTime'] === 'true') {
      this.showWelcomeDialog();
    }

    const logado = this.globalService.getCurrentUser();
    if (logado != null) {
      this.Logado = true;
    }

    const nomeLink = this.route.snapshot.paramMap.get('id');
    if (nomeLink) {
      this.fetchDonation(nomeLink);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.removeJsonLd();
  }

  fetchDonation(nomeLink: string): void {
    this.globalService.getDonationByLink(nomeLink)
      .subscribe({
        next: (response) => {
          this.donation = response;
          console.log('Doacao recebida:', this.donation);
          this.applyCampaignSeo();
          this.buildSliderImages();
          this.showMensagens();
          this.loadPixTotais();
          this.fetchUser(this.donation.id_user);
          this.getIMGPerfil(this.donation.id_user);
        },
        error: (error) => {
          console.error('Erro ao buscar doacao:', error);
        }
      });
  }

  openDonationModal(): void {
    this.startCheckout();
  }

  shareDonation(): void {
    const shareData = this.getShareData();
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          this.showShareOptions = false;
        })
        .catch(() => {
          this.showShareOptions = false;
        });
      return;
    }
    this.showShareOptions = !this.showShareOptions;
  }

  getShareLink(platform: 'whatsapp' | 'facebook' | 'twitter' | 'telegram' | 'email'): string {
    const shareData = this.getShareData();
    const encodedUrl = encodeURIComponent(shareData.url || window.location.href);
    const encodedText = encodeURIComponent(`${shareData.title} - ${shareData.text}`.trim());
    const encodedTitle = encodeURIComponent(shareData.title || 'Campanha de doacao');
    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedText}%0A${encodedUrl}`;
      default:
        return shareData.url || window.location.href;
    }
  }

  copyShareLink(): void {
    const url = this.getShareData().url || window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => this.notificationService.openSnackBar('Link copiado.'))
        .catch(() => this.notificationService.openSnackBar('Nao foi possivel copiar o link.'));
      return;
    }
    this.notificationService.openSnackBar('Nao foi possivel copiar o link.');
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${environment.urlBase}/images/${imagePath}`;
  }

  private getShareData(): { title: string; text: string; url: string } {
    const title = this.donation?.name ? `Campanha: ${this.donation.name}` : 'Campanha de doacao';
    const text = 'Ajude esta campanha com uma doacao.';
    const url = window.location.origin + window.location.pathname;
    return { title, text, url };
  }

  private applyCampaignSeo(): void {
    const campaignName = this.donation?.name || 'Campanha de doacao';
    const campaignCategory = this.donation?.area || 'Doacoes';
    const pageUrl = this.getCurrentPageUrl();
    const image = this.getPrimaryImageUrl();
    const description = this.buildCampaignDescription();

    this.titleService.setTitle(`${campaignName} | ${environment.nomeProjetoTitulo}`);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: environment.nomeProjetoTitulo });
    this.meta.updateTag({ property: 'og:title', content: campaignName });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: campaignName });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'keywords', content: `${campaignName}, campanha, doacao, ${campaignCategory}, mundocolorestore` });

    this.setCanonicalUrl(pageUrl);
    this.setJsonLd({
      name: campaignName,
      description,
      url: pageUrl,
      image,
      category: campaignCategory
    });
  }

  private buildCampaignDescription(): string {
    const plainText = this.stripHtml((this.donation?.texto || '').toString()).trim();
    if (!plainText) {
      return this.defaultDescription;
    }
    return plainText.length > 160 ? `${plainText.slice(0, 157)}...` : plainText;
  }

  private stripHtml(value: string): string {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getPrimaryImageUrl(): string {
    const imagePath = this.donation?.img_caminho || '';
    const fallback = `${this.assetsBaseUrl}/assest/logo_bb.png`;
    if (!imagePath) {
      return fallback;
    }
    return this.getImageUrl(imagePath);
  }

  private getCurrentPageUrl(): string {
    if (typeof window !== 'undefined' && window.location?.href) {
      return window.location.origin + window.location.pathname;
    }
    return '';
  }

  private setCanonicalUrl(url: string): void {
    if (!url) {
      return;
    }
    let link = this.document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: { name: string; description: string; url: string; image: string; category: string }): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = this.jsonLdScriptId;
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: data.name,
      description: data.description,
      url: data.url,
      image: data.image,
      about: {
        '@type': 'Thing',
        name: data.category
      },
      isPartOf: {
        '@type': 'WebSite',
        name: environment.nomeProjetoTitulo
      }
    });
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    const current = this.document.getElementById(this.jsonLdScriptId);
    if (current?.parentNode) {
      current.parentNode.removeChild(current);
    }
  }

  private buildSliderImages(): void {
    const raw = (this.donation?.images || this.donation?.imagens || this.donation?.img_caminho) ?? [];
    let list: any[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        list = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        list = String(raw).split(',');
      }
    } else {
      list = String(raw).split(',');
    }
    this.sliderImages = list
      .map((item: any) => this.normalizeImageItem(item))
      .filter((item: string) => !!item)
      .map((item: string) => this.getImageUrl(item))
      .slice(0, 10);

    if (this.sliderImages.length === 0 && typeof this.donation?.img_caminho === 'string' && this.donation.img_caminho.trim()) {
      this.sliderImages = [this.getImageUrl(this.donation.img_caminho.trim())];
    }

    console.log('Slider imagens:', {
      raw,
      total: this.sliderImages.length,
      first: this.sliderImages[0]
    });
    this.activeSlide = 0;
    this.startAutoplay();
  }

  private normalizeImageItem(item: any): string {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      return (item.url || item.path || item.img_caminho || item.image || item.caminho || item.file || '').toString().trim();
    }
    return '';
  }

  private startAutoplay(): void {
    if (this.sliderImages.length <= 1) {
      return;
    }
    this.stopAutoplay();
    this.autoplayId = window.setInterval(() => {
      this.nextSlide(true);
    }, 3000);
  }

  private stopAutoplay(): void {
    if (this.autoplayId) {
      clearInterval(this.autoplayId);
      this.autoplayId = undefined;
    }
  }

  prevSlide(): void {
    this.nextSlide(false, -1);
  }

  nextSlide(auto = false, direction = 1): void {
    if (!auto) {
      this.stopAutoplay();
    }
    if (this.sliderImages.length === 0) {
      return;
    }
    const total = this.sliderImages.length;
    this.activeSlide = (this.activeSlide + direction + total) % total;
  }

  calculateDaysAgo(date: string): number {
    const donationDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - donationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  resetPassword() {
    this.router.navigate(['/auth/reset-request']);
  }

  createUser() {
    this.router.navigate(['/auth/new-user']);
  }

  showMensagens() {
    this.donationOpen(this.donation.id);
    this.globalService.getDonationMensagens(this.donation.id).subscribe({
      next: (mensagens) => {
        this.mensagens = mensagens;
        console.log('Mensagens recebidas:', mensagens);
        console.log('Total arrecadado nas mensagens:', this.totalMensagensValor);
      },
      error: (err) => {
        this.notificationService.openSnackBar(err);
      }
    });
  }

  loadPixTotais(): void {
    this.globalService.getPixTotais(this.donation.id).subscribe({
      next: (data) => {
        this.pixTotais = data;
        console.log('Totais:', data);
        this.totalMensagensValor = data.valor_total;
        this.valor_total = data.valor_total;
        this.total_doadores = data.total_doadores;
      },
      error: (err) => {
        this.notificationService.openSnackBar(err);
      }
    });
  }

  calculateProgress() {
    const pt1 = this.donation.valor / this.valor_total;
    this.alcancado = 100 / pt1;
    return this.alcancado;
  }

  get collectedAmount(): number {
    return Number(this.valor_total || 0);
  }

  get goalAmount(): number {
    return Number(this.donation?.valor || 0);
  }

  get donorsCount(): number {
    return Number(this.total_doadores || 0);
  }

  get progressPercent(): number {
    if (!this.goalAmount) return 0;
    const pct = (this.collectedAmount / this.goalAmount) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  get missingAmount(): number {
    return Math.max(0, this.goalAmount - this.collectedAmount);
  }

  onAmountSelected(amount: number): void {
    this.donateForm.patchValue({ amount });
  }

  startCheckout(): void {
    if (!this.donation?.id) {
      this.notificationService.openSnackBar('Campanha nao encontrada.');
      return;
    }
    if (this.donateForm.invalid || this.isSubmitting) {
      this.donateForm.markAllAsTouched();
      return;
    }

    const amount = this.donateForm.get('amount')?.value || 0;
    const name = this.donateForm.get('name')?.value || '';
    const email = this.donateForm.get('email')?.value || '';

    const currentUrl = new URL(window.location.href);
    const successUrl = new URL(currentUrl.toString());
    const cancelUrl = new URL(currentUrl.toString());
    successUrl.searchParams.set('status', 'success');
    cancelUrl.searchParams.set('status', 'cancel');

    this.isSubmitting = true;
    this.paymentsService.createCheckoutSession({
      campaignId: this.donation.id,
      amount: Number(amount).toFixed(2),
      currency: 'BRL',
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      donor: {
        name,
        email
      }
    }).subscribe({
      next: (session) => {
        this.isSubmitting = false;
        if (!session.url) {
          this.notificationService.openSnackBar('Checkout indisponivel.');
          return;
        }
        window.location.href = session.url;
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.openSnackBar('Erro ao iniciar checkout.');
      }
    });
  }

  donationOpen(id_doacao: string) {
    this.globalService.sendDonationVisualization({
      id_doacao: id_doacao,
      id_user: "",
      visuaization: true,
      donation_like: false,
      love: false,
      shared: false,
      acesse_donation: true,
      create_pix: false,
      create_cartao: false,
      create_paypal: false,
      create_google: false,
      create_pag1: false,
      create_pag2: false,
      create_pag3: true,
      idioma: 'pt-BR',
      tema: 'normal',
      form: 'desktop',
      google: 'false',
      google_maps: 'false',
      google_ads: 'false',
      meta_pixel: 'false',
      Cookies_Stripe: 'false',
      Cookies_PayPal: 'false',
      visitor_info1_live: 'false'
    }).subscribe({
      next: () => {
        console.log('Visualizacao enviada com sucesso');
      },
      error: (err) => {
        console.error('Erro:', err);
      }
    });
  }

  fetchUser(userId: string): void {
    this.globalService.getUserById(userId).subscribe({
      next: (response) => {
        this.usuario = response;
        console.log('Usuario recebido:', response);
        this.usuario.date_create = this.formatDateCreate(response.date_create);
      },
      error: (error) => {
        console.error('Erro ao buscar usuario:', error);
      }
    });
  }

  formatDateCreate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    const formatted = date.toLocaleDateString('pt-BR', options);
    return `Usuario ativo desde ${formatted}`;
  }

  getIMGPerfil(id_user: string) {
    this.globalService.getUserProfileImage(id_user).subscribe({
      next: (url) => {
        this.profileImageUrl = url || 'assets/images/user.png';
      },
      error: (err) => {
        this.notificationService.openSnackBar(err);
      }
    });
  }

  showWelcomeDialog(): void {
    const baseUrl = window.location.origin + window.location.pathname;

    this.dialog.open(DialogSimpleMessageComponent, {
      width: '500px',
      data: {
        title: 'Bem-vindo!',
        message: `✔️ Este é seu link para compartilhar sua campanha: <a href="${baseUrl}" target="_blank" rel="noopener noreferrer">${baseUrl}</a>
      
✔️ Você pode acessar o site com o email e senha cadastrados.

✔️ O sistema tem um processo automático para transferir os valores doados. Um e-mail com instruções foi enviado para você.`
      }
    });
  }
}
