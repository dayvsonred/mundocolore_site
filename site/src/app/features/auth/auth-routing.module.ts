import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { PasswordResetRequestComponent } from './password-reset-request/password-reset-request.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { NewUserComponent } from './new-user/new-user.component';
import { AvValidEmailComponent } from './av-valid-email/av-valid-email.component';
import { EmailConfirmationComponent } from './email-confirmation/email-confirmation.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'password-reset-request', component: PasswordResetRequestComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'new-user', component: NewUserComponent },
  { path: 'confirmar-email', component: EmailConfirmationComponent },
  { path: 'email-confirmation', component: EmailConfirmationComponent },
  { path: 'valid-email', component: AvValidEmailComponent },
  { path: 'valid-email/:user/:email', component: AvValidEmailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
