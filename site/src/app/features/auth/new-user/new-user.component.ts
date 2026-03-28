import { Input, Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

@Component({
  selector: 'app-creat-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
})
export class NewUserComponent implements OnInit {

  form: FormGroup | any;
  private formSubmitAttempt: boolean | undefined;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  loading = false;
  submitted = false;
  returnUrl: string | undefined;
  error = '';

  constructor(private router: Router,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      userName: ['', Validators.required],
      userEmail: ['', Validators.required],
      userLatitude: ['', Validators.required],
      userLogitude: ['', Validators.required],
      userOffshoot: ['', Validators.required],
      userCpf: ['', Validators.required],
      password: ['', Validators.required],
      passwordConfirm: ['', Validators.required],
    });
  }

  loginUser() {
    //execute your post rquest and set token in local storage or session storage or cokie storage
    //The token may be aby string. here i'm use my_token as the token.
    localStorage.setItem('token', 'my_token');

    this.router.navigate(['dashboard']);
  }


  onSubmit() {
    this.submitted = true;
    console.log("criando usuario");
    console.log(this.form.value.userName);
    console.log(this.form.value.password);
    console.log(this.form.value.passwordConfirm);

    if(this.form.value.password != this.form.value.passwordConfirm){
      this.openSnackBar();
      return;
    }

    this.authService.createNewUserLongin({
      email: this.form.value.userEmail,
      name : this.form.value.userName,
      password : this.form.value.password,
      cpf : this.form.value.userCpf,
      offshoot : "Cão",
      longitude : "00",
      latitude : "00"
    }).subscribe({
      next: (res) => res,
      error: (e) => e,
    })
  }

  isFieldInvalid(field: string) {
    return (
      (!this.form.get(field).valid && this.form.get(field).touched) ||
      (this.form.get(field).untouched && this.formSubmitAttempt)
    );
  }

  creatNewUser(){
    
  }

  openSnackBar() {
    this._snackBar.open('the passwords are different!!', 'Ok', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }

}
