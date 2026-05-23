import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  let router: jasmine.SpyObj<Router>;

  const product = {
    id: 'prod-1',
    name: 'Jaqueta teste',
    price: 199,
    image: 'https://example.com/image.jpg',
    description: 'Descricao',
    brand: 'Marca',
    collection: 'Colecao',
    type: 'Tipo',
    category: 'Categoria',
    size: ['M'],
    ageGroup: 'Adulto'
  };

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ProductCardComponent],
      providers: [{ provide: Router, useValue: router }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = product as any;
    fixture.detectChanges();
  });

  it('should navigate to the product detail when clicking the card area', () => {
    const card = fixture.debugElement.query(By.css('.product-card'));

    card.nativeElement.click();

    expect(router.navigate).toHaveBeenCalledWith(['/product', product.id]);
  });

  it('should navigate once when clicking the view button', () => {
    const button = fixture.debugElement.query(By.css('.btn-view'));

    button.nativeElement.click();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/product', product.id]);
  });
});
