import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

type ProfileUser = {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  gender: string;
};

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  loading = false;
  saving = false;
  readonly defaultGender = 'Prefiro nao informar';
  readonly genderOptions = [
    'Prefiro nao informar',
    'Masculino',
    'Feminino',
    'Outro'
  ];

  user: ProfileUser = {
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    phone: '',
    birthDate: '',
    gender: 'Prefiro nao informar'
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: [''],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      cpf: ['', [Validators.required]],
      phone: [''],
      birthDate: [''],
      gender: [this.defaultGender]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.loading = true;

    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.loading = false;
        this.user = this.toProfileUser(profile);
        this.patchForm();
      },
      error: () => {
        this.loading = false;
        const fallbackUser = this.authService.getCurrentUser();
        if (fallbackUser) {
          this.user = this.toProfileUser(fallbackUser);
          this.patchForm();
        }
        this.notificationService.openSnackBar('Nao foi possivel carregar os dados do perfil.');
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.patchForm();
    }
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const firstName = (this.profileForm.get('firstName')?.value || '').trim();
    const lastName = (this.profileForm.get('lastName')?.value || '').trim();
    const name = `${firstName} ${lastName}`.trim();

    this.authService.updateProfile({
      name,
      cpf: this.profileForm.get('cpf')?.value || '',
      phone: this.profileForm.get('phone')?.value || '',
      birth_date: this.profileForm.get('birthDate')?.value || '',
      gender: this.profileForm.get('gender')?.value || this.defaultGender
    }).subscribe({
      next: (profile) => {
        this.saving = false;
        this.user = this.toProfileUser(profile);
        this.patchForm();
        this.isEditing = false;
        this.notificationService.openSnackBar('Dados atualizados com sucesso.');
      },
      error: (errorMessage) => {
        this.saving = false;
        this.notificationService.openSnackBar(
          typeof errorMessage === 'string' ? errorMessage : 'Nao foi possivel atualizar o perfil.'
        );
      }
    });
  }

  onCancel(): void {
    this.toggleEdit();
  }

  private patchForm(): void {
    this.profileForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      cpf: this.user.cpf,
      phone: this.user.phone,
      birthDate: this.user.birthDate,
      gender: this.user.gender || this.defaultGender
    });
  }

  private toProfileUser(source: any): ProfileUser {
    const fullName = source?.name || source?.fullName || '';
    const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/).filter(Boolean);

    return {
      firstName: firstName || '',
      lastName: lastNameParts.join(' '),
      email: source?.email || '',
      cpf: source?.cpf || '',
      phone: source?.phone || '',
      birthDate: source?.birth_date || '',
      gender: source?.gender || this.defaultGender
    };
  }
}
