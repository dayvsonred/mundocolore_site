import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.component.html',
  styleUrls: ['./profile-details.component.css']
})
export class ProfileDetailsComponent implements OnInit {

  fullName: string = "";
  email: string = "";
  alias: string = "";
  id_user: any = null;
  profileImageUrl: any = null;
  hover = false;

  constructor(
    private authService: AuthenticationService,
    private globalService: GlobalService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit() {
    let user = this.globalService.getCurrentUser();
    console.log(user);
    this.id_user = user.id_user;
    this.fullName = user.fullName; //this.authService.getCurrentUser().fullName;
    this.email = user.email; //this.authService.getCurrentUser().email;
    this.getIMGPerfil();

      // Atualiza quando o nome for alterado em outro componente
    this.globalService.userName$.subscribe(newName => {
      this.fullName = newName;
    });

  }




  getIMGPerfil() {
    this.globalService.getUserProfileImage(this.id_user).subscribe({
      next: (url) => {
        console.log("1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq")
        console.log(url)
        this.profileImageUrl = url || 'assets/default-user.png';
      },
      error: (err) => {
        this.notificationService.openSnackBar(err);
      }
    });

  }

  triggerFileInput(): void {
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    input?.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);

      const user = this.globalService.getCurrentUser();
      const headers = {
        Authorization: `Bearer ${user.token}`,
      };

      this.globalService.uploadUserProfileImage(formData, headers).subscribe({
        next: (res) => {
          this.notificationService.openSnackBar('Imagem atualizada com sucesso!');
          this.getIMGPerfil();
        },
        error: (err) => {
          this.notificationService.openSnackBar('Erro ao atualizar imagem.');
        },
      });
    }
  }



}
