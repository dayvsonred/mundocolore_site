import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { AccountPageComponent } from './account-page/account-page.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ProfileDetailsComponent } from './profile-details/profile-details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProfileDataComponent } from './profile-data/profile-data.component';
import { ProfileDataPixComponent } from './profile-data-pix/profile-data-pix.component';
import { ProfileChangeNameComponent } from './profile-change-name/profile-change-name.component';
import { BrandRegistrationComponent } from './brand-registration/brand-registration.component';
import { CollectionRegistrationComponent } from './collection-registration/collection-registration.component';
import { ProductRegistrationComponent } from './product-registration/product-registration.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    AccountRoutingModule
  ],
  declarations: [
    AccountPageComponent,
    ChangePasswordComponent,
    ProfileDetailsComponent,
    ProfileDataComponent,
    ProfileDataPixComponent,
    ProfileChangeNameComponent,
    BrandRegistrationComponent,
    CollectionRegistrationComponent,
    ProductRegistrationComponent
  ],
  exports: [AccountPageComponent]
})
export class AccountModule { }
