import {Component, ViewChild} from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';
import {CalendarNewEventModal} from './calendar-new-event-modal.component';
import {Alert, NavController, Events, Toast, Modal} from 'ionic-angular';
import * as moment from 'moment';

@Component({
  templateUrl: 'build/pages/calendar/calendar.html',
  directives: [CalendarComponent]
})
export class CalendarPage {
  @ViewChild(CalendarComponent)
  private calendarComponent: CalendarComponent;

  now: number = Date.now();
  millisInHour: number = 1000 * 60 * 60;
  millisInDay: number = this.millisInHour * 24;
  calEvents = [
    {
      data: {},
      icon: 'alarm',
      class: 'class',
      iconStyle: { color: 'green' },
      style: { color: 'red' },
      name: 'Item 1',
      type: 'event',
      startDate: new Date(),
      endDate: new Date(this.now + this.millisInHour * 1),
      allDay: false,
      ontap: (item: any) => {
        this.nav.present(Toast.create({
          message: 'Custom click event for Item 1',
          duration: 3000,
          position: 'bottom'
        }));
      }
    },
    {
      data: {},
      class: 'class',
      icon: 'jet',
      name: 'Item 2',
      type: 'event',
      startDate: new Date(this.now + this.millisInHour * 3),
      endDate: new Date(this.now + this.millisInHour * 4 + this.millisInDay * 3),
      allDay: false,
      onpress: (item: any) => {
        item.style = { color: 'pink', 'font-weight': 'bolder' };
        item.name = 'pressed';
      },
      ontap: (item: any) => {
        item.style = { color: 'white', 'font-weight': 'normal' }
        item.name = 'tapped';
      },
      ondoubletap: (item: any) => {
        item.style = { color: 'black', 'font-weight': '100' };
        item.name = 'dubbletapped';
      }
    },
    {
      data: {},
      class: 'class',
      icon: 'globe',
      name: 'Item 3',
      type: 'event',
      startDate: new Date(this.now + this.millisInDay),
      endDate: new Date(this.now + this.millisInDay * 2 + this.millisInHour * 3),
      allDay: false
    }
  ];

  constructor(private nav: NavController, public events: Events) {
    events.subscribe('calendar-event:item-press', (event: any) => {
      console.log('calendar-event:item-press', event);
      this.onEventPressed(event[0]);
    });
    events.subscribe('calendar-event:month-grid-cell-press', (event: any) => {
      console.log('calendar-event:month-grid-cell-press', event);
      this.onMonthGridPressed(event[0]);
    });
  }

  afterEventMoved($event) {
    console.log('event moved parent', $event);
    this.nav.present(Toast.create({
      message: `Moved ${$event.element.name} to ${moment($event.element.startDate).format('MMM Do')}`,
      duration: 3000,
      position: 'top'
    }));
  }

  onEventTap($event) {
    console.log('GENERIC ON EVENT TAP', $event);
    this.nav.present(Alert.create({
      title: `Clicked: ${$event.name}`,
      message: `From ${moment($event.startDate).calendar()} to ${moment($event.endDate).calendar()}`,
      buttons: ['Ok']
    }));
  }

  onEventPressed($event) {
    console.log('GENERIC ON EVENT PRESS', $event);
  }

  onMonthGridPressed($event) {
    console.log('GENERIC ON MONTHGRID PRESS', $event);
    this.showNewEventModal($event.date.toDate());
  }

  showNewEventModal(date?: Date) {
    if (!date) {
      date = new Date();
    }
    let newEventModal = Modal.create(CalendarNewEventModal, { date: date });
    newEventModal.onDismiss(data => {
      if (data) {
        this.calendarComponent.addCalendarEvent(data);
      }
    });
    this.nav.present(newEventModal);
  }
}
