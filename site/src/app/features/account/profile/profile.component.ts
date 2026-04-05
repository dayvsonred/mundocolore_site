import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;

  user = {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@email.com',
    cpf: '123.456.789-00',
    birthDate: '1990-01-15',
    gender: 'Masculino'
  };

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.profileForm.patchValue(this.user);
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadUserData(); // Reset form if canceling
    }
  }

  onSave() {
    if (this.profileForm.valid) {
      // TODO: Save to API
      Object.assign(this.user, this.profileForm.value);
      this.isEditing = false;
      console.log('Profile saved:', this.user);
    }
  }

  onCancel() {
    this.toggleEdit();
  }
}