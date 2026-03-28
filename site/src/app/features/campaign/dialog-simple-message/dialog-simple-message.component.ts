import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-simple-message',
  templateUrl: './dialog-simple-message.component.html',
  styleUrls: ['./dialog-simple-message.component.css']
})
export class DialogSimpleMessageComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogSimpleMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
