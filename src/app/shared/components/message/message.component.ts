import { Component, Input, input } from '@angular/core';

@Component({
  selector: 'app-message',
  imports: [],
  templateUrl: './message.component.html',
})
export class MessageComponent {
  message = input.required<string>();
  typeMessage = input.required<number>();

 }
