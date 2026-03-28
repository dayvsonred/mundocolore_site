import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
//import { NGXLogger } from 'ngx-logger';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GlobalService } from 'src/app/core/services/global.service';


@Component({
  selector: 'app-profile-data-pix',
  templateUrl: './profile-data-pix.component.html',
  styleUrls: ['./profile-data-pix.component.css']
})
export class ProfileDataPixComponent implements OnInit {

  //form!: UntypedFormGroup;
  hideCurrentPassword: boolean;
  hideNewPassword: boolean;
  currentPassword!: string;
  newPassword!: string;
  newPasswordConfirm!: string;
  //disableSubmit!: boolean;
  exitBankAccount = false


  form: FormGroup;
  disableSubmit = false;
  banks = [
    { code: '001', name: 'Banco do Brasil' },
    { code: '033', name: 'Santander' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '237', name: 'Bradesco' },
    { code: '341', name: 'Itaú' },
    { code: '260', name: 'Nubank' },
    // Adicione mais bancos conforme necessário
  ];

  constructor(private authService: AuthenticationService,
    //private logger: NGXLogger,
    private spinnerService: SpinnerService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private globalService: GlobalService) {

    this.hideCurrentPassword = true;
    this.hideNewPassword = true;

    this.form = this.fb.group({
      banco: ['', Validators.required],
      banco_nome: [{ value: '', disabled: true }],
      agencia: ['', [Validators.required, Validators.pattern(/^\d{1,5}$/)]], // Validators.pattern(/^\d{4}$/)
      conta: ['', [Validators.required, Validators.pattern(/^\d{1,6}$/)]],  //Validators.pattern(/^\d{5,}-\d$/)
      digito: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z]{1}$/)]],
      cpf: ['', [Validators.required]],   //Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
      telefone: ['', [Validators.required]], //Validators.pattern(/^\(\d{2}\)\s9\d{4}-\d{4}$/)
      id: "",
      pix: ['', Validators.required]
    });

  }

  ngOnInit() {
    this.exitBankAccount = false;
    this.buscarDadosBancarios();
  }

  onBankChange(bankCode: string): void {
    const selectedBank = this.banks.find(bank => bank.code === bankCode);
    if (selectedBank) {
      this.form.patchValue({ banco_nome: selectedBank.name });
    }
  }

  submitBankAccount(): void {
    if (this.form.valid) {
      this.disableSubmit = true;
      const payload = this.form.getRawValue(); // Usa getRawValue para incluir campos desabilitados (banco_nome)
      payload.id_conta_old = payload.id;

      if (this.exitBankAccount) {
        this.globalService.changerBankAccount(payload)
          .subscribe({
            next: (response) => {
              console.log('Dados bancários salvos com sucesso!', response);
              this.notificationService.openSnackBar('Dados bancários salvos com sucesso!');
              this.disableSubmit = false;
              // Opcional: redirecionar ou mostrar mensagem de sucesso
            },
            error: (error) => {
              console.error('Erro ao salvar dados bancários:', error);
              this.notificationService.openSnackBar('Erro ao salvar dados bancários:.');
              this.disableSubmit = false;
              // Opcional: mostrar mensagem de erro
            }
          });
      } else {
        this.globalService.saveBankAccount(payload)
          .subscribe({
            next: (response) => {
              console.log('Dados bancários salvos com sucesso!', response);
              this.notificationService.openSnackBar('Dados bancários salvos com sucesso!');
              this.disableSubmit = false;
              // Opcional: redirecionar ou mostrar mensagem de sucesso
            },
            error: (error) => {
              console.error('Erro ao salvar dados bancários:', error);
              this.notificationService.openSnackBar('Erro ao salvar dados bancários:.');
              this.disableSubmit = false;
              // Opcional: mostrar mensagem de erro
            }
          });
      }
    }
  }

  buscarDadosBancarios(): void {
    this.globalService.getBankAccount()
      .subscribe({
        next: (response) => {
          if (response === null) {
            console.log('Nenhuma conta bancária encontrada.');
            this.exitBankAccount = false;

          } else {
            console.log('Dados bancários recebidos:', response);
            this.exitBankAccount = true;
            this.form.patchValue(response);
          }
        },
        error: (error) => {
          console.error('Erro ao buscar dados bancários:', error);
        }
      });
  }
}
