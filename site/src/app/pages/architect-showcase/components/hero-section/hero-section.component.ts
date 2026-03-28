import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ArchitectProfile, BrandContent, HeroContent, ShowcaseLanguage } from '../../architect-showcase.models';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HeroSectionComponent {
  @Input() brand!: BrandContent;
  @Input() hero!: HeroContent;
  @Input() architect!: ArchitectProfile;
  @Input() selectedLanguage: ShowcaseLanguage = 'pt';
  @Output() languageChange = new EventEmitter<ShowcaseLanguage>();

  readonly languages: Array<{ code: ShowcaseLanguage; flagUrl: string; label: string; tooltip: string }> = [
    {
      code: 'pt',
      flagUrl: 'https://d39d9tndfl7lxp.cloudfront.net/assest/bandeira-brasil.jpg',
      label: 'Portugues',
      tooltip: 'Selecione o idioma brasileiro.'
    },
    {
      code: 'en',
      flagUrl: 'https://d39d9tndfl7lxp.cloudfront.net/assest/bandeira-usa.jpg',
      label: 'English',
      tooltip: 'Choose the English language.'
    },
    {
      code: 'es',
      flagUrl: 'https://d39d9tndfl7lxp.cloudfront.net/assest/bandeira-espanha.jpg',
      label: 'Espanol',
      tooltip: 'Elija el idioma espanol.'
    }
  ];

  selectLanguage(language: ShowcaseLanguage): void {
    if (this.selectedLanguage === language) {
      return;
    }
    this.languageChange.emit(language);
  }
}
