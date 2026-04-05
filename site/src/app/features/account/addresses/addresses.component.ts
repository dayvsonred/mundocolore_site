import { Component, OnInit } from '@angular/core';

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
  type: 'delivery' | 'billing';
}

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AddressesComponent implements OnInit {
  addresses: Address[] = [];

  ngOnInit() {
    this.loadMockAddresses();
  }

  loadMockAddresses() {
    this.addresses = [
      {
        id: '1',
        name: 'Casa',
        street: 'Rua das Flores, 123',
        city: 'São Paulo - SP',
        zipCode: '01234-567',
        phone: '(11) 99999-9999',
        isDefault: true,
        type: 'delivery'
      },
      {
        id: '2',
        name: 'Trabalho',
        street: 'Av. Paulista, 456',
        city: 'São Paulo - SP',
        zipCode: '01310-100',
        phone: '(11) 88888-8888',
        isDefault: false,
        type: 'billing'
      }
    ];
  }

  editAddress(address: Address) {
    // TODO: Open edit dialog
    console.log('Edit address:', address);
  }

  deleteAddress(address: Address) {
    // TODO: Confirm and delete
    console.log('Delete address:', address);
  }

  addNewAddress() {
    // TODO: Open add dialog
    console.log('Add new address');
  }
}