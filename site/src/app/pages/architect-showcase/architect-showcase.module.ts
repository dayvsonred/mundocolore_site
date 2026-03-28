import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArchitectShowcaseRoutingModule } from './architect-showcase-routing.module';
import { ArchitectShowcasePageComponent } from './architect-showcase-page.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { MetricsStripComponent } from './components/metrics-strip/metrics-strip.component';
import { ServicesSectionsComponent } from './components/services-sections/services-sections.component';
import { ProjectsGridComponent } from './components/projects-grid/projects-grid.component';
import { TestimonialsCarouselComponent } from './components/testimonials-carousel/testimonials-carousel.component';
import { FinalCtaComponent } from './components/final-cta/final-cta.component';

@NgModule({
  declarations: [
    ArchitectShowcasePageComponent,
    HeroSectionComponent,
    MetricsStripComponent,
    ServicesSectionsComponent,
    ProjectsGridComponent,
    TestimonialsCarouselComponent,
    FinalCtaComponent
  ],
  imports: [
    CommonModule,
    ArchitectShowcaseRoutingModule
  ]
})
export class ArchitectShowcaseModule {}
