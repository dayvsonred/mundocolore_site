import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { NGXLogger } from 'ngx-logger';
import { NotificationService } from 'src/app/core/services/notification.service';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {

  constructor(
    //private logger: NGXLogger,
    private notificationService: NotificationService,
    private titleService: Title
  ) { }

  ngOnInit() {
    this.titleService.setTitle(APP_NAME);
    //this.logger.log('Users loaded');
  }
}


