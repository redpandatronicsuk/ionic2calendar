import {Component} from '@angular/core';
import {Modal, NavController, ViewController, NavParams} from 'ionic-angular';

@Component({
  templateUrl: 'build/pages/calendar/calendar-new-event-modal.component.html'
})
export class CalendarNewEventModal {
  name: string = '';
  startDate: string;
  endDate: string;
  constructor(private viewCtrl: ViewController, params: NavParams) {
    var date = params.get('date');
    this.startDate = date.toISOString();
    this.endDate = new Date(date.getTime() + 1000 * 60 * 60).toISOString();
  }

  save() {
    this.viewCtrl.dismiss({
      name: this.name,
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate)
    });
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
