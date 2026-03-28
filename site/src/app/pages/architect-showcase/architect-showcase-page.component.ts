import { Component } from '@angular/core';
import { ARCHITECT_SHOWCASE_DATA_BY_LANGUAGE } from './architect-showcase.data';
import { ArchitectShowcaseData, ShowcaseLanguage } from './architect-showcase.models';

@Component({
  selector: 'app-architect-showcase-page',
  templateUrl: './architect-showcase-page.component.html',
  styleUrls: ['./architect-showcase-page.component.css']
})
export class ArchitectShowcasePageComponent {
  selectedLanguage: ShowcaseLanguage = 'pt';

  get data(): ArchitectShowcaseData {
    return ARCHITECT_SHOWCASE_DATA_BY_LANGUAGE[this.selectedLanguage];
  }

  onLanguageChange(language: ShowcaseLanguage): void {
    this.selectedLanguage = language;
  }
}
