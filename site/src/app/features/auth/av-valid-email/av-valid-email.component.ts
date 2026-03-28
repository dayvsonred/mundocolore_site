import { Input, Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { delay, of } from 'rxjs';

@Component({
  selector: 'app-login-valid-email',
  templateUrl: './av-valid-email.component.html',
  styleUrls: ['./av-valid-email.component.scss'],
})
export class AvValidEmailComponent implements OnInit {

  form: FormGroup | any;
  private formSubmitAttempt: boolean | undefined;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  loading = false;
  submitted = false;
  returnUrl: string | undefined;
  error = '';
  tx = { pendente : "pendente", corp : "Foi enviado para sua conta de email um link para confirmar o email"};
  bar = { type: "indeterminate", value : 100 };
  barType: string = "indeterminate";
  indeterminate = 'indeterminate';
  validEmailOk = false;
  validEmail = true;
  userId = null;
  emailId = null;

  
  constructor(private router: Router,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private _snackBar: MatSnackBar,
    private route: ActivatedRoute 
  ) { }

  ngOnInit() {
    this.userId = this.route.snapshot.params['user'];
    this.emailId = this.route.snapshot.params['email'];

    if(this.userId != null && this.emailId != null){
      let aaa = this.delayGo();
      this.goValidEmail();
    }
  }

  delayGo() {
    return of(true).pipe(delay(1000));
  }

  goValidEmail(){
    console.log("goValidEmail");
    console.log(this.userId);
    console.log(this.emailId);


    this.authService.validEmailUser({
      email: this.emailId,
      user : this.userId
    }).subscribe({
      next: (res) => {
        console.log(" *********validEmailUser******** res");
        console.log(res);

        this.validEmailOk = true;
        this.validEmail = false;
        this.tx.pendente = "confirmado";
        this.tx.corp = "O email foi confirmado com sucesso!!!!";

      },
      error: (e) => e,
    })


  }

  loginUser() {
    this.router.navigate(['dashboard']);
  }

  openSnackBar() {
    this._snackBar.open('the passwords are different!!', 'Ok', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }

  goLogin(){
    this.router.navigate(['auth/login']);
  }

}
