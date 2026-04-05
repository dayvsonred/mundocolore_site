import { Component, OnInit } from '@angular/core';

interface Card {
  id: string;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit {
  cards: Card[] = [];

  ngOnInit() {
    this.loadMockCards();
  }

  loadMockCards() {
    this.cards = [
      {
        id: '1',
        lastFour: '4321',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        holderName: 'JOÃO SILVA',
        isDefault: true
      },
      {
        id: '2',
        lastFour: '8765',
        brand: 'Mastercard',
        expiryMonth: 8,
        expiryYear: 2026,
        holderName: 'JOÃO SILVA',
        isDefault: false
      }
    ];
  }

  addNewCard() {
    // TODO: Open add card dialog
    console.log('Add new card');
  }

  deleteCard(card: Card) {
    // TODO: Confirm and delete
    console.log('Delete card:', card);
  }

  getCardBrandIcon(brand: string): string {
    switch (brand.toLowerCase()) {
      case 'visa': return 'credit_card';
      case 'mastercard': return 'credit_card';
      default: return 'credit_card';
    }
  }
}