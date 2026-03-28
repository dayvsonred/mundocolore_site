import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Injector } from '@angular/core';
import { GlobalService } from 'src/app/core/services/global.service';
import { Router } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-donation-new',
  templateUrl: './donation-new.component.html',
  styleUrls: ['./donation-new.component.css']
})
export class DonationNewComponent implements OnInit {
  private logger!: NGXLogger | undefined;

  donationForm: FormGroup;
  selectedFile: File | null = null;
  valorCapanha: any = "0";
  categories: Array<{ value: string; label: string }> = [];
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '200px',
    minHeight: '150px',
    placeholder: 'Descreva sua campanha',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    toolbarHiddenButtons: [['bold']],
  };

  constructor(private fb: FormBuilder,
    private notificationService: NotificationService,
    private titleService: Title,
    private injector: Injector,
    private globalService: GlobalService,
    private router: Router) {
    this.donationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(130)]],
      amount: ['', [Validators.required, this.currencyValidator]],
      message: [`
<h1>Digite aqui seu título</h1>

<p>Meu nome é <em>[Seu nome]</em> e estou passando por um momento difícil. Estou criando esta campanha com o objetivo de arrecadar fundos para <strong>[descrever a situação, exemplo: tratamento de saúde, reforma da casa, apoio à família, etc]</strong>.</p>

<p>Com sua ajuda, pretendo alcançar a meta de <strong>R$ [valor da meta]</strong>, que será utilizada para <em>[detalhar como o dinheiro será usado – por exemplo: exames, remédios, alimentação, aluguel, etc]</em>.</p>

<p>Sua contribuição, por menor que seja, fará uma enorme diferença em minha vida. E se não puder contribuir financeiramente, peço que compartilhe esta campanha com seus amigos e familiares. Toda ajuda conta! ❤️</p>

<p>Desde já, agradeço imensamente pelo apoio e solidariedade!</p>

<p><strong>Gratidão,</strong><br/>
  `, [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      category: ['', Validators.required],
      image: [null]
    });
  }

  ngOnInit() {
    this.titleService.setTitle(APP_NAME);
    this.notificationService.openSnackBar('Donation loaded');
    this.categories = this.globalService.getDonationCategories();

  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.donationForm.patchValue({ image: this.selectedFile }); // Se necessário armazenar no formulário
    }
  }

  sendForm(): void {
    if (this.donationForm.invalid || !this.selectedFile) {
      this.notificationService.openSnackBar('Preencha todos os campos obrigatórios e selecione uma imagem.');
      this.donationForm.markAllAsTouched();
      return;
    }


    if (this.donationForm.valid) {
      const formValues = this.donationForm.value;
      const rawAmount = formValues.amount as string;
      const numericAmount = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));

      const formData = new FormData();
      formData.append('name', formValues.name);
      formData.append('valor', numericAmount.toString());
      formData.append('texto', formValues.message || '');
      formData.append('area', formValues.category);

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      this.globalService.donationCreate(formData).subscribe({
        next: (donatoNew) => {
          this.notificationService.openSnackBar('Doação criada com sucesso!');
          this.router.navigate(['donation/view', donatoNew.nome_link]);
        },
        error: (err) => {
          console.error('Erro ao criar doação:', err);
          this.notificationService.openSnackBar('Erro ao criar doação.');
        }
      });
    } else {
      this.notificationService.openSnackBar('Preencha todos os campos obrigatórios.');
    }
  }

  logMessage(message: string): void {
    if (!this.logger) {
      this.logger = this.injector.get(NGXLogger);
    }
    this.logger.log(message);
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja número

    if (!value) {
      value = '0';
    }

    // Divide o valor em reais e centavos
    const integerPart = value.slice(0, -2) || '0'; // Parte inteira (mínimo "0")
    const decimalPart = value.slice(-2).padStart(2, '0'); // Últimos dois dígitos como centavos

    // Adiciona os pontos como separadores de milhar
    let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (formattedInteger.length >= 3 && formattedInteger.charAt(0) == "0") {
      let ajust = formattedInteger.substring(1)
      formattedInteger = ajust;
    }
    // Combina a parte formatada com os centavos
    const formattedValue = `${formattedInteger},${decimalPart}`;

    // Atualiza o campo com o valor formatado
    input.value = formattedValue;

    // Atualiza o FormControl com o valor formatado
    this.donationForm.patchValue({ amount: formattedValue });
  }

    currencyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(value)) {
      return { invalidFormat: true };
    }

    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (numericValue <= 0) {
      return { minValue: true };
    }

    return null;
  }
}


