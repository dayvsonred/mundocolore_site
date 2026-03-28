import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { environment } from '../../../../environments/environment';
import { DonationModalComponent } from '../payment/donation-modal.component';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  Logado = false;
  assetsBaseUrl = environment.assetsBaseUrl;
  start = false;
  form: FormGroup;
  selectedFile: File | null = null;
  disableSubmit = false;
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
  loading = false;
  categories: Array<{ value: string; label: string }> = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private globalService: GlobalService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.titleService.setTitle('Criar Conta e Doação');
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      cpf: ['', [Validators.required, this.cpfValidator]],
      email: ['', [Validators.required, Validators.email], [this.emailValidator()]],
      senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(130)]],
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(130)]],
      meta: ['', [Validators.required, this.currencyValidator, Validators.maxLength(20)]],
      categoria: ['', Validators.required],
      acceptTerms: [true, Validators.requiredTrue],
      texto: [`
<h1>Digite aqui seu título</h1>

<p>Meu nome é <em>[Seu nome]</em> e estou passando por um momento difícil. Estou criando esta campanha com o objetivo de arrecadar fundos para <strong>[descrever a situação, exemplo: tratamento de saúde, reforma da casa, apoio à família, etc]</strong>.</p>

<p>Com sua ajuda, pretendo alcançar a meta de <strong>R$ [valor da meta]</strong>, que será utilizada para <em>[detalhar como o dinheiro será usado – por exemplo: exames, remédios, alimentação, aluguel, etc]</em>.</p>

<p>Sua contribuição, por menor que seja, fará uma enorme diferença em minha vida. E se não puder contribuir financeiramente, peço que compartilhe esta campanha com seus amigos e familiares. Toda ajuda conta! ❤️</p>

<p>Desde já, agradeço imensamente pelo apoio e solidariedade!</p>

<p><strong>Gratidão,</strong><br/>
  `, [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    });
  }

  ngOnInit() {
    this.start = true;
    const currentUser = this.globalService.getCurrentUser();
    if (currentUser) {
      this.Logado = true;
      // Pre-fill user data if logged in
      this.form.patchValue({
        fullName: currentUser.fullName,
        cpf: currentUser.cpf,
        email: currentUser.email,
      });
    }

    this.categories = this.globalService.getDonationCategories();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  submit(): void {
    if (this.form.invalid || !this.selectedFile) {
      if (!this.form.get('acceptTerms')?.value) {
        this.notificationService.openSnackBar('Você precisa aceitar os termos da plataforma.');
      } else {
        this.notificationService.openSnackBar('Preencha todos os campos corretamente e selecione uma imagem.');
      }
      this.form.markAllAsTouched(); // Mark all fields as touched to show errors
      return;
    }

    this.disableSubmit = true;
    this.loading = true; // Ativa o loading
    const formValues = this.form.value;
    const formData = new FormData();
    // Converte o valor monetário antes de enviar
    const metaValue = this.formatCurrencyForBackend(formValues.meta);
    formData.append('fullName', formValues.fullName);
    formData.append('cpf', formValues.cpf);
    formData.append('email', formValues.email);
    formData.append('senha', formValues.senha);
    formData.append('titulo', formValues.titulo);
    formData.append('meta', metaValue); // Usa o valor convertido
    formData.append('categoria', formValues.categoria);
    formData.append('texto', formValues.texto);
    formData.append('image', this.selectedFile);

    this.globalService.createUserAndDonation(formData).subscribe({
      next: (res) => {
        this.notificationService.openSnackBar('Usuário e Doação criados com sucesso!');
        //this.router.navigate(['/pg/' + res.nome_link], { queryParams: { firstTime: 'true' } });
        //this.disableSubmit = false;
        setTimeout(() => { // ➡️ Delay de 2 segundos
          this.loading = false;
          this.router.navigate(['/pg/' + res.nome_link], { queryParams: { firstTime: 'true' } });
          this.disableSubmit = false;
        }, 2500);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        // Verifica se o erro é de email já cadastrado
        if (err.message == "Erro Email já cadastrado") {
          // Adiciona erro ao campo email
          this.form.get('email')?.setErrors({ emailTaken: true });
          // Marca o campo como tocado para mostrar o erro
          this.form.get('email')?.markAsTouched();

          const currentEmail = this.form.get('email')?.value;

          // Adiciona o email ao array de inválidos
          this.globalService.addInvalidEmail(currentEmail);

          // Dispara a validação novamente
          this.form.get('email')?.updateValueAndValidity();

          this.notificationService.openSnackBar('Este email já está cadastrado. Por favor, use outro email.');
        } else {
          // Tratamento genérico para outros erros
          let errorMessage = 'Erro ao criar usuário e doação';
          if (err.error) errorMessage += ': ' + (typeof err.error === 'string' ? err.error : err.message);
          this.notificationService.openSnackBar(errorMessage);
        }
        //this.notificationService.openSnackBar('Erro ao criar usuário e doação: ' + err.message);
        this.disableSubmit = false;
      },
    });
  }

  emailValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;

      if (!email) {
        return of(null);
      }

      return of(this.globalService.isEmailInvalid(email)).pipe(
        map(isInvalid => isInvalid ? { emailTaken: true } : null)
      );
    };
  }

  logout(): void {
    this.authenticationService.logout();
    this.Logado = false;
    this.router.navigate(['/']);
  }

  cpfValidator(control: AbstractControl): ValidationErrors | null {
    const cpf = (control.value || '').replace(/[^\d]+/g, '');

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return { cpfInvalido: true };

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return { cpfInvalido: true };

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return { cpfInvalido: true };

    return null;
  }

  formatCurrencyInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja número

    if (!value) {
      value = '0';
    }

    // Divide o valor em reais e centavos
    const integerPart = value.slice(0, -2) || '0';
    const decimalPart = value.slice(-2).padStart(2, '0');

    // Adiciona os pontos como separadores de milhar
    let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (formattedInteger.length >= 3 && formattedInteger.charAt(0) == "0") {
      formattedInteger = formattedInteger.substring(1);
    }

    const formattedValue = `${formattedInteger},${decimalPart}`;
    input.value = formattedValue;
    this.form.patchValue({ [controlName]: formattedValue });
  }

  currencyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Verifica o formato básico
    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(value)) {
      return { invalidFormat: true };
    }

    // Converte para número para validações adicionais
    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));

    if (numericValue <= 0) {
      return { minValue: true };
    }

    return null;
  }

  // Adicione esta nova função para formatar o valor para o back-end
  private formatCurrencyForBackend(value: string): string {
    if (!value) return '0.00';

    // Remove todos os pontos (separadores de milhar)
    let numericValue = value.replace(/\./g, '');
    // Substitui a vírgula (separador decimal) por ponto
    numericValue = numericValue.replace(',', '.');

    // Garante que tem duas casas decimais
    if (!numericValue.includes('.')) {
      numericValue += '.00';
    }

    return numericValue;
  }
}
