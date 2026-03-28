import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
//import { NGXLogger } from 'ngx-logger';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GlobalService } from 'src/app/core/services/global.service';


@Component({
  selector: 'app-profile-change-name',
  templateUrl: './profile-change-name.component.html',
  styleUrls: ['./profile-change-name.component.css']
})
export class ProfileChangeNameComponent implements OnInit {

  //form!: UntypedFormGroup;
  hideCurrentPassword: boolean;
  hideNewPassword: boolean;
  currentPassword!: string;
  newPassword!: string;
  newPasswordConfirm!: string;
  //disableSubmit!: boolean;
  exitBankAccount = false
  id_user = "";
  fullName = "";


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
      name: ['', Validators.required]
    });

  }

  ngOnInit() {
    this.exitBankAccount = false;
    let user = this.globalService.getCurrentUser();
    console.log(user);
    this.id_user = user.id_user;
    this.fullName = user.fullName;
  }

   submitUpdateUserName() {
    if (this.form.valid) {
      this.disableSubmit = true;
      const formPayload = this.form.getRawValue();

      const payload = {
        id_user: this.id_user,
        old_name: this.fullName,
        new_name: formPayload.name
      };

      this.globalService.changeUserName(payload).subscribe({
        next: () => {
          this.notificationService.openSnackBar('Nome alterado com sucesso!');
          this.disableSubmit = false;
        },
        error: (err) => {
          this.disableSubmit = false;
          this.notificationService.openSnackBar('Erro ao alterar nome: ' + err);
        }
      });
    }
  }

}
