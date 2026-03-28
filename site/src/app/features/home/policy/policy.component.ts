import { Component, OnInit } from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Meta, Title } from '@angular/platform-browser';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit {
  appName = APP_NAME;
  assetsBaseUrl = environment.assetsBaseUrl;
isMobile: any;
toggleSidebar() {
throw new Error('Method not implemented.');
}
  Logado = false;
  policies = [
    {
      id: 'terms', title: 'Termos de Uso', content: `
      <h2>Termos de Uso</h2>
      <p>Bem-vindo à plataforma ${APP_NAME}. Ao utilizar nossa plataforma, você concorda com os seguintes termos:</p>
      <ul>
        <li><strong>Elegibilidade</strong>: Usuários devem ter pelo menos 18 anos ou permissão de um responsável legal.</li>
        <li><strong>Uso Permitido</strong>: A plataforma ${APP_NAME} deve ser usada apenas para criar ou apoiar campanhas de doação legítimas.</li>
        <li><strong>Proibições</strong>: É proibido usar a plataforma para atividades ilegais, fraudulentas ou que violem direitos de terceiros.</li>
        <li><strong>Responsabilidade</strong>: Você é responsável pelo conteúdo das campanhas que cria, incluindo imagens e textos.</li>
      </ul>
      <p>Nos reservamos o direito de suspender ou encerrar contas que violem estes termos, conforme a Lei 13.019/2014 (Marco Regulatório das Organizações da Sociedade Civil).</p>
    `},
    {
      id: 'privacy', title: 'Política de Privacidade', content: `
      <h2>Política de Privacidade</h2>
      <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018), protegemos seus dados pessoais:</p>
      <ul>
        <li><strong>Coleta de Dados</strong>: Coletamos nome, CPF, e-mail e informações de pagamento apenas para processar doações e criar contas.</li>
        <li><strong>Uso de Dados</strong>: Seus dados são usados para gerenciar campanhas, enviar recibos e comunicações relacionadas.</li>
        <li><strong>Compartilhamento</strong>: Não compartilhamos seus dados com terceiros, exceto para cumprir obrigações legais ou processar pagamentos.</li>
        <li><strong>Segurança</strong>: Utilizamos criptografia SSL e armazenamento seguro para proteger seus dados.</li>
        <li><strong>Direitos</strong>: Você pode solicitar acesso, correção ou exclusão de seus dados entrando em contato conosco.</li>
      </ul>
      <p>Entre em contato pelo e-mail contato@dadiva.org para exercer seus direitos sob a LGPD.</p>
    `},
    {
      id: 'donation', title: 'Política de Doação', content: `
      <h2>Política de Doação</h2>
      <p>Nossa plataforma facilita doações para causas verificadas:</p>
      <ul>
        <li><strong>Processamento</strong>: Doações são processadas via parceiros de pagamento confiáveis, com taxas transparentes.</li>
        <li><strong>Transparência</strong>: Cada campanha exibe relatórios de impacto e uso dos fundos.</li>
        <li><strong>Taxas</strong>: Uma taxa administrativa de até 5% pode ser aplicada para manutenção da plataforma.</li>
        <li><strong>Verificação</strong>: Todas as campanhas são revisadas para garantir legitimidade.</li>
      </ul>
    `},
    {
      id: 'security', title: 'Política de Segurança', content: `
      <h2>Política de Segurança</h2>
      <p>Garantimos a segurança das transações e dados:</p>
      <ul>
        <li><strong>Criptografia</strong>: Todas as transações usam SSL/TLS para proteção.</li>
        <li><strong>Autenticação</strong>: Contas são protegidas por senhas seguras e verificação de e-mail.</li>
        <li><strong>Monitoramento</strong>: Monitoramos atividades suspeitas para prevenir fraudes.</li>
      </ul>
    `},
    {
      id: 'community', title: 'Diretrizes da Comunidade', content: `
      <h2>Diretrizes da Comunidade</h2>
      <p>Para manter um ambiente respeitoso:</p>
      <ul>
        <li><strong>Respeito</strong>: Não toleramos discurso de ódio, discriminação ou assédio.</li>
        <li><strong>Conteúdo</strong>: Campanhas devem ser claras, honestas e não enganosas.</li>
        <li><strong>Moderação</strong>: Reservamo-nos o direito de remover conteúdo que viole estas diretrizes.</li>
      </ul>
    `},
    {
      id: 'refund', title: 'Política de Reembolso', content: `
      <h2>Política de Reembolso</h2>
      <p>Reembolsos são processados em casos específicos:</p>
      <ul>
        <li><strong>Falha</strong>: Em caso de cadastros de doações por engano ou em duplicidade, o reembolso pode ser solicitado mediante e-mail.</li>
        <li><strong>Condições</strong>: Reembolsos podem ser solicitados em até 7 dias após a doação, conforme o Código de Defesa do Consumidor (Lei 8.078/1990).</li>
        <li><strong>Processo</strong>: Entre em contato pelo e-mail contato@dadiva.org com o comprovante da doação.</li>
        <li><strong>Exceções</strong>: Doações já transferidas para a campanha não são reembolsáveis, salvo em casos de erro ou fraude.</li>
      </ul>
    `},
  ];

  activePolicy: string = 'terms'; // Default to first policy

  constructor(private titleService: Title, private globalService: GlobalService,  private authenticationService: AuthenticationService, private router: Router) {
    this.titleService.setTitle(APP_NAME + ' - Políticas');
  }

  selectPolicy(id: string): void {
    this.activePolicy = id;
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



}




