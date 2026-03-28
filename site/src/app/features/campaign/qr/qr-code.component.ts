import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalService } from 'src/app/core/services/global.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit {
  //qrCodeUrl = 'https://i.pinimg.com/originals/38/d1/b7/38d1b77d32f3225095a32caa9c5c8732.png'; // Substitua pelo URL real do QR code
  //donationAmount = 98.88;
  //pixCode = '00020101021226850014BR.GOV.BCB.PIX2563qrcodespix-h.sejaefi.com.br/v2/f11cd32962494dae86d7427463c8117b5204000053039865802BR5905EFISA6008SAOPAULO62070503***6304FB8C';
  //pixCopiaECola = '00020101021226850014BR.GOV.BCB.PIX2563qrcodespix-h.sejaefi.com.br/v2/f11cd32962494dae86d7427463c8117b5204000053039865802BR5905EFISA6008SAOPAULO62070503***6304FB8C';
  //donationData: any;
  qrCodeUrl: string = '';
  pixCode: string = '';
  pixCopiaECola: string = '';
  donationAmount = 0;
  donationData: any;
  showQrCOde = false;

  ID_Transacao: string = '';
  ID_Vaquinha: string = '';
  Causa: string = '';
  dataFormatada: string = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private globalService: GlobalService,
    private datePipe: DatePipe
  ) {
    // Obtém os dados da navegação
    const navigation = this.router.getCurrentNavigation();
    this.donationData = navigation?.extras?.state?.['donationData'];
  }

  ngOnInit(): void {
    // Aqui você pode recuperar parâmetros da rota ou serviços para carregar dados dinâmicos
    const donationId = this.route.snapshot.paramMap.get('id');
    if (!this.donationData) {
      this.notificationService.openSnackBar('Erro: dados da doação não encontrados.');
      this.router.navigate(['/']);
      console.log('Nenhum dado de doação recebido');
      //this.location.back(); // Navigates to the previous page
      // Caso não haja dados, você pode redirecionar ou lidar de outra forma
      return;
    }

    this.dataFormatada = this.datePipe.transform(new Date(), 'dd/MM/yyyy') || '';

    console.log('Dados da doação recebidos:', this.donationData);
    this.donationAmount = this.donationData.amount;


      
      this.ID_Vaquinha = this.donationData.donationId;
      this.Causa  = 'Ajude no tratamento de '+ this.donationData.nome_link;

    const payload = {
      id: this.donationData.donationId, // ou use algum identificador real
      valor: this.donationAmount.toFixed(2),
      cpf: this.donationData.cpf?.replace(/\D/g, '') || '00000000000',
      nome: this.donationData.donorName || 'Doação Anônima',
      chave: 'dayvson.red@gmail.com', // ou chave PIX real
      mensagem: this.donationData.message || 'Pagamento de doação',
      anonimo: this.donationData.anonymouse || false
    };

    this.globalService.pixQrCodeCreate(payload).subscribe({
      next: (res) => {
        console.log(res);
        this.ID_Transacao = res.txid;
        this.pixCopiaECola = res.pixCopiaECola;
        this.pixCode = res.pixCopiaECola;
        this.qrCodeUrl = 'https://' + res.location;
        console.log('QR code gerado com sucesso:', res);
        this.showQrCOde = true;
      },
      error: (err) => {
        console.error('Erro ao gerar QR Code:', err);
        this.notificationService.openSnackBar(err);
      }
    });
  }

  copyPixCode(): void {
    navigator.clipboard.writeText(this.pixCode).then(() => {
      this.notificationService.openSnackBar('Código Pix copiado com sucesso!');
    }).catch(() => {
      this.notificationService.openSnackBar('Erro ao copiar o código Pix.'); //error
    });
  }
}

function uuidv4() {
  throw new Error('Function not implemented.');
}
