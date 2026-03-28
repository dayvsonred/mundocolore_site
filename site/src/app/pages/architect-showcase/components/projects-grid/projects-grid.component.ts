import { Component, Input } from '@angular/core';
import { ProjectItem } from '../../architect-showcase.models';

@Component({
  selector: 'app-projects-grid',
  templateUrl: './projects-grid.component.html',
  styleUrls: ['./projects-grid.component.css']
})
export class ProjectsGridComponent {
  @Input() projects: ProjectItem[] = [];
  @Input() eyebrow = 'Projects';
  @Input() title = '';
}
