import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Address, AddressPayload, AddressService } from 'src/app/core/services/address.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AddressesComponent implements OnInit {
  readonly maxAddresses = 10;

  addresses: Address[] = [];
  loading = false;
  saving = false;

  isFormOpen = false;
  isEditing = false;
  editingAddressId: string | null = null;

  addressForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private notificationService: NotificationService
  ) {
    this.addressForm = this.fb.group({
      observation: ['', [Validators.required]],
      complement: ['', [Validators.required]],
      number: ['', [Validators.required]],
      street: ['', [Validators.required]],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: [{ value: 'Brasil', disabled: true }],
      zip_code: ['', [Validators.required]],
      is_default: [false]
    });
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  get canAddAddress(): boolean {
    return this.addresses.length < this.maxAddresses;
  }

  loadAddresses(): void {
    this.loading = true;
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.loading = false;
        this.addresses = [...addresses].sort((a, b) => {
          if (a.is_default === b.is_default) {
            return 0;
          }
          return a.is_default ? -1 : 1;
        });
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.openSnackBar(this.extractErrorMessage(error, 'Nao foi possivel carregar os enderecos.'));
      }
    });
  }

  addNewAddress(): void {
    if (!this.canAddAddress) {
      this.notificationService.openSnackBar('Voce pode cadastrar no maximo 10 enderecos.');
      return;
    }

    this.isFormOpen = true;
    this.isEditing = false;
    this.editingAddressId = null;
    this.addressForm.reset({
      observation: '',
      complement: '',
      number: '',
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      is_default: this.addresses.length === 0
    });
  }

  editAddress(address: Address): void {
    this.isFormOpen = true;
    this.isEditing = true;
    this.editingAddressId = address.id;

    this.addressForm.reset({
      observation: address.observation,
      complement: address.complement,
      number: address.number,
      street: address.street,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      is_default: address.is_default
    });
  }

  cancelForm(): void {
    this.isFormOpen = false;
    this.isEditing = false;
    this.editingAddressId = null;
    this.addressForm.reset({
      observation: '',
      complement: '',
      number: '',
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      is_default: false
    });
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const payload: AddressPayload = {
      observation: this.normalize(this.addressForm.get('observation')?.value),
      complement: this.normalize(this.addressForm.get('complement')?.value),
      number: this.normalize(this.addressForm.get('number')?.value),
      street: this.normalize(this.addressForm.get('street')?.value),
      neighborhood: this.normalize(this.addressForm.get('neighborhood')?.value),
      city: this.normalize(this.addressForm.get('city')?.value),
      state: this.normalize(this.addressForm.get('state')?.value),
      zip_code: this.normalize(this.addressForm.get('zip_code')?.value),
      is_default: !!this.addressForm.get('is_default')?.value
    };

    this.saving = true;

    const request$ =
      this.isEditing && this.editingAddressId
        ? this.addressService.updateAddress(this.editingAddressId, payload)
        : this.addressService.createAddress(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelForm();
        this.loadAddresses();
        this.notificationService.openSnackBar(
          this.isEditing ? 'Endereco atualizado com sucesso.' : 'Endereco adicionado com sucesso.'
        );
      },
      error: (error) => {
        this.saving = false;
        this.notificationService.openSnackBar(this.extractErrorMessage(error, 'Nao foi possivel salvar o endereco.'));
      }
    });
  }

  deleteAddress(address: Address): void {
    const confirmed = window.confirm('Deseja realmente excluir este endereco?');
    if (!confirmed) {
      return;
    }

    this.addressService.deleteAddress(address.id).subscribe({
      next: () => {
        this.loadAddresses();
        this.notificationService.openSnackBar('Endereco removido com sucesso.');
      },
      error: (error) => {
        this.notificationService.openSnackBar(this.extractErrorMessage(error, 'Nao foi possivel remover o endereco.'));
      }
    });
  }

  setAsDefault(address: Address): void {
    if (address.is_default) {
      return;
    }

    const payload: AddressPayload = {
      observation: address.observation,
      complement: address.complement,
      number: address.number,
      street: address.street,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      is_default: true
    };

    this.addressService.updateAddress(address.id, payload).subscribe({
      next: () => {
        this.loadAddresses();
        this.notificationService.openSnackBar('Endereco padrao atualizado.');
      },
      error: (error) => {
        this.notificationService.openSnackBar(this.extractErrorMessage(error, 'Nao foi possivel definir endereco padrao.'));
      }
    });
  }

  private normalize(value: string): string {
    return (value || '').trim();
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return (
      error?.error?.message ||
      error?.error?.error ||
      (typeof error?.error === 'string' ? error.error : '') ||
      fallback
    );
  }
}
