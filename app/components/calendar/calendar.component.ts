import {Component, Input, Output, EventEmitter, HostListener, ElementRef}
from '@angular/core';
import {Events} from 'ionic-angular';
import * as moment from 'moment';
import {Dragula, DragulaService} from '../../../node_modules/ng2-dragula/ng2-dragula';
import * as shortid from 'shortid';


interface CalendarEvent {
  data?: any;
  id?: string;
  name: string;
  type?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  isExtension?: boolean;
  extensionMonthViewDayIdxs?: number[];
  icon?: string;
  ontap?: Function;
  onpress?: Function;
  ondoubletap?: Function;
}

interface CalendarDay {
  date: moment.Moment;
  events: CalendarEvent[];
}

interface MonthView {
  days: CalendarDay[];
  numberOfDaysThisMonth: number;
  firstDayOfMonth: moment.Moment;
  lastDayOfMonth: moment.Moment;
  selectedDate: moment.Moment;
}

interface WeekView {
  days: any[];
  firstDayOfWeek: moment.Moment;
  lastDayOfWeek: moment.Moment;
  selectedDate: moment.Moment;
}

interface CalendarControl {
  viewMode: string;
  dateSelection: moment.Moment;
  selectedYear: number;
  selectedMonth: string;
  selectedDay: number;
  monthView: MonthView;
  weekView: WeekView;
}

@Component({
  templateUrl: 'build/components/calendar/calendar.component.html',
  selector: 'ionic2-calendar',
  //styleUrls: ['build/components/calendar.component.css'], wait for: https://github.com/driftyco/ionic-cli/issues/1196
  directives: [Dragula],
  viewProviders: [DragulaService]
})
export class CalendarComponent {

  months: string[] = moment.months();
  weekDays: any[] = moment.weekdays();
  ctrl: CalendarControl;
  activeDragGroup: string;
  itemCameFromBag: any;
  draggingItem: any = null;
  draggingItemId: string;
  sizeClassChanged: boolean;
  sizeClass: string;

  @Input('calEvents') calEvents: any[];
  @Output() afterEventMove = new EventEmitter<any>();
  @Output() onEventTap = new EventEmitter<any>();
  @Output() onEventDoubleTap = new EventEmitter<any>();
  @Output() onEventPress = new EventEmitter<any>();

  constructor(private dragulaService: DragulaService,
    private calendarElement: ElementRef,
    public events: Events) {
    dragulaService.drag.subscribe((value) => {
      console.log(`drag: ${value[0]}`);
      this.onDrag(value.slice(1));
    });
    dragulaService.drop.subscribe((value) => {
      console.log(`drop: ${value[0]}`);
      this.onDrop(value.slice(1));
    });
    //    dragulaService.dropModel.subscribe((value) => {
    //      console.log(`dropModel: ${value[0]}`);
    //      this.onDropModel(value.slice(1));
    //    });
  }

  // In Dragula documentation it says dropModel for Angular2 also gives the
  // model on the controller, not just the HTML elements, but I see no
  // difference to onDrop function arguments. TRY AGAIN LATER!!
  //  private onDropModel(args) {
  //    let [bagName, el, target] = args;
  //    console.log('OnDropModel', bagName, el, target);
  //  }

  private onDrag(args) {
    let [e, el] = args;
    console.log('dragging', e, el);
    this.itemCameFromBag = el;
    this.draggingItem = e;
    this.draggingItemId = e.id;
    if (e.className.indexOf('is-continued') > 0 || e.className.indexOf('does-continue') > 0) {
      var found = false, idx = 0, currentClassName;
      while (!found && idx < e.classList.length) {
        currentClassName = e.classList[idx++];
        if (currentClassName.startsWith('multi-span-')) {
          this.activeDragGroup = currentClassName;
          //document.getElementsByClassName(currentClassName);
        }
      }
    }
  }
  private onDrop(args) {
    let [e, el] = args;
    var droppedOnGridItem = el.parentElement.parentElement;
    var droppedOnGridItemIdx = droppedOnGridItem.dataset.idx;
    this.activeDragGroup = '';
    // Move events date and Output event
    // FOR isExtension events, move date moved by on all dates and move in grids!
    var movedElement, daysMoved, isExtensionOffsetToStartDate = 0;
    this.ctrl.monthView.days[droppedOnGridItemIdx].events.some((d: any) => {
      if (d.id === this.draggingItemId) {
        movedElement = d;
        if (movedElement.isExtension) {
          var cameFromGridIdx = this.itemCameFromBag.parentElement.parentElement.dataset.idx;
          console.log('moved element date', movedElement.startDate,
            'grid item it came from date', this.ctrl.monthView.days[cameFromGridIdx].date,
            '\n\ndays difference', this.ctrl.monthView.days[cameFromGridIdx].date.diff(moment(movedElement.startDate).startOf('day'), 'days'));
          isExtensionOffsetToStartDate = this.ctrl.monthView.days[cameFromGridIdx].date.diff(moment(movedElement.startDate).startOf('day'), 'days');
        }
        daysMoved = this.ctrl.monthView.days[droppedOnGridItemIdx].date.diff(moment(d.startDate).startOf('day'), 'days');
        d.startDate = this.moveDateByDays(d.startDate, daysMoved - isExtensionOffsetToStartDate);
        d.endDate = this.moveDateByDays(d.endDate, daysMoved - isExtensionOffsetToStartDate);
        // Now we need to move it into the correct order of events:
        var movedElementCalEventsIdx = this.calEvents.indexOf(movedElement);
        // Splice it:
        this.calEvents.splice(movedElementCalEventsIdx, 1);
        // Reinsert it at the correct position:
        this.insertDate(movedElement);
        console.log('Changed d.startDate to', d.startDate, 'and end date', d.endDate, '{IDX}', movedElementCalEventsIdx);
        return true;
      } else {
        return false;
      }
    });
    if (movedElement.isExtension) {
      // Remove all multi-span copies of moved item:
      movedElement.extensionMonthViewDayIdxs.forEach((d: number) => {
        var indexOfExtendedItem = this.ctrl.monthView.days[d].events.indexOf(movedElement);
        console.log('index of moved element', indexOfExtendedItem);
        if (indexOfExtendedItem >= 0) {
          this.ctrl.monthView.days[d].events.splice(indexOfExtendedItem, 1);
        }
      });
      // Now find first, create event there and extend: (SHOULD CHECK IF THERE IS OVERFLOW OR UNDERFLOW AFTER ADDING DAYS MOVED!!)
      console.log('daysMoves', daysMoved, movedElement.extensionMonthViewDayIdxs[0]);
      movedElement.isExtension = false;
      var firstDayMovesTo = movedElement.extensionMonthViewDayIdxs[0] + (daysMoved - isExtensionOffsetToStartDate);

      console.log('isExtensionOffsetToStartDate', isExtensionOffsetToStartDate);
      // Only add the event if it is not the first one. If it is the fisrt,
      // dragula will already add it, but after our code has finished, so we
      // would have our element twice:
      if (isExtensionOffsetToStartDate > 0) {
        this.ctrl.monthView.days[Math.max(0, firstDayMovesTo)].events.push(movedElement);
      }
      // Make new multi-span copies for moved event:
      this.makeExtensionEvents(this.ctrl.monthView.days[Math.max(0, firstDayMovesTo)], firstDayMovesTo);
    }
    // Emit event:
    this.emitEventMoved({
      element: movedElement,
      // Need to change this to firstItemDate if multi-span is moved
      movedToDate: this.ctrl.monthView.days[droppedOnGridItemIdx].date.toDate()
    })
    this.draggingItem = null;
  }

  /**
   * Fires when a calendar event was moved on the calendar.
   * The object this event fires contains the calendar event that moved (with
   * the start and end date already adjusted and the a date object for the day
   * the calendar event has moved to.
   */
  private emitEventMoved(ev) {
    this.afterEventMove.emit(ev);
  }

  private moveDateByDays(date, days) {
    var m = moment(date);
    m.add(days, 'days');
    return m.toDate();
  }

  ngOnInit() {
    this.addMissingIds();
    this.ctrl = {
      viewMode: 'month',
      dateSelection: moment(),
      selectedYear: moment().year(),
      selectedMonth: this.months[moment().month()],
      selectedDay: moment().date(),
      monthView: {
        days: [],
        numberOfDaysThisMonth: 0,
        firstDayOfMonth: null,
        lastDayOfMonth: null,
        selectedDate: null
      },
      weekView: {
        days: [],
        firstDayOfWeek: null,
        lastDayOfWeek: null,
        selectedDate: null
      }
    };
    this.makeDaysInMonthViewList();
  }

  ngAfterViewInit() {
    // This returns 0 clientWidth for some reason at first??? That's why wrapped
    // in timeout, UPDATE: only seems a problem when in phone emulation mode in chrome!!
    setTimeout(() => {
      this.updateSize();
    }, 1500);
  }

  addMissingIds() {
    this.calEvents.forEach((d: any) => {
      if (!d.id) {
        d.id = shortid.generate();
      }
    });
  }

  selectDate(date) {
    this.events.publish('calendar-event:month-grid-cell-tap', date);
    this.ctrl.dateSelection = date.date;
    this.ctrl.monthView.selectedDate = date;
  }

  monthNum2monthStr(monthNum) {
    return this.months[monthNum];
  };

  monthStr2monthNum(monthStr: string) {
    return this.months.indexOf(monthStr);
    //return this.months.indexOf([monthStr]);
  }

  updateMainView = function() {
    if (this.ctrl.viewMode === 'month') {
      this.makeDaysInMonthViewList();
    } else if (this.ctrl.viewMode === 'week') {
      this.makeDaysInWeekViewList();
    }
  }

  plusMonth = function(amount: number) {
    this.ctrl.dateSelection.add(amount, 'month');
    this.ctrl.selectedMonth = this.monthNum2monthStr(this.ctrl.dateSelection.month())
    this.updateMainView();
  }

  setDateSelectionMonth($event) {
    console.log('change', $event);
    this.makeDaysInMonthViewList();
  }

  makeDaysInMonthViewList() {
    // List is 6x7, first need to find which day of the week the first is and then prepend from previous:
    // Must fill 42 cells, have n cells in this month...
    this.ctrl.monthView.numberOfDaysThisMonth = this.ctrl.dateSelection.daysInMonth();
    this.ctrl.monthView.firstDayOfMonth = moment(this.ctrl.dateSelection).startOf('month');
    this.ctrl.monthView.lastDayOfMonth = moment(this.ctrl.dateSelection).endOf('month');
    var firstDayOfMonthAsWeekday = this.ctrl.monthView.firstDayOfMonth.isoWeekday();
    //var lastDayOfMonthAsWeekday = this.ctrl.monthView.lastDayOfMonth.isoWeekday();
    var firstDayInViewOfPreviousMonth = moment(this.ctrl.monthView.firstDayOfMonth).subtract(firstDayOfMonthAsWeekday - 1, 'days');
    //    console.log('lastDayOfMonthAsWeekday', lastDayOfMonthAsWeekday, 'firstDayInViewOfPreviousMonth', firstDayInViewOfPreviousMonth);
    // Now we have the first and last dates of the grid view, let's make the grid:
    var currentDay = moment(firstDayInViewOfPreviousMonth);
    var days = [];
    var ctrlObj: any = {
      idx: 0,
      reachedEventListEnd: false,
      pastMaxDate: false,
      maxDate: moment(firstDayInViewOfPreviousMonth).add(42, 'days')
    };
    this.ctrl.monthView.days = [];
    for (var i = 0; i < 42; i++) {
      ctrlObj.currentDay = {
        date: moment(currentDay),
        events: []
      };
      if (!(ctrlObj.reachedEventListEnd || ctrlObj.pastMaxDate)) {
        this.findNextEvent(ctrlObj);
      }

      this.ctrl.monthView.days.push(ctrlObj.currentDay);
      currentDay.add(1, 'days');
    }
    // ALSO TO-DO: - Day, week and year view
    //             - Styles and classes for item, icon and text
    this.ctrl.monthView.days.forEach((d: CalendarDay, idx: number) => {
      this.makeExtensionEvents(d, idx);
    });
  }

  private eventFinishesOnDifferentDay(calEvent: CalendarEvent): boolean {
    return !moment(calEvent.startDate).isSame(calEvent.endDate, 'day');
  }

  private insertDate(elem) {
    var insertAt = null;
    this.calEvents.some((ce: CalendarEvent, idx: number) => {
      console.log(ce.startDate.getTime(), elem.startDate.getTime());
      if (ce.startDate.getTime() > elem.startDate.getTime()) {
        insertAt = idx;
        return true;
      }
      return false;
    });
    console.log('Inser at', insertAt, this.calEvents);
    if (insertAt !== null) {
      this.calEvents.splice(insertAt, 0, elem);
    } else {
      this.calEvents.push(elem);
    }
  }

  private makeExtensionEvents(d: CalendarDay, idx: number) {
    if (d.events.length > 0) {
      d.events.forEach((dd: any) => {
        if (dd.isExtension) {
          return;
        }
        dd.isExtension = this.eventFinishesOnDifferentDay(dd);
        dd.extensionMonthViewDayIdxs = [idx];
        var startDateEndOfDay = moment(dd.startDate).endOf('day'),
          endDateEndOfDay = moment(dd.endDate).endOf('day'),
          newEvent, daysPlus = 0;
        while (startDateEndOfDay.isBefore(endDateEndOfDay) && startDateEndOfDay.isBefore(this.ctrl.monthView.days[this.ctrl.monthView.days.length - 1].date)) {
          daysPlus++;
          dd.extensionMonthViewDayIdxs.push(idx + daysPlus);
          if (this.ctrl.monthView.days[idx + daysPlus].events.indexOf(dd) < 0) {
            this.ctrl.monthView.days[idx + daysPlus].events.push(dd);
          }
          startDateEndOfDay.add(1, 'days');
        }
        console.log('dd.extensionMonthViewDayIdxs', dd.extensionMonthViewDayIdxs);
      });
    }
  }

  findNextEvent(ctrlObj: any) {
    if (typeof this.calEvents === 'undefined') {
      return;
    }
    while (true) {
      if (ctrlObj.idx >= this.calEvents.length) {
        ctrlObj.reachedEventListEnd = true;
        return;
      }
      var stDate = this.calEvents[ctrlObj.idx].startDate.getTime();
      if (stDate > ctrlObj.maxDate.valueOf()) { //plus one day here
        ctrlObj.pastMaxDate = true;
        return;
      }
      if (ctrlObj.currentDay.date.valueOf() > stDate) {
        ctrlObj.idx = ctrlObj.idx + 1;
      } else if (ctrlObj.currentDay.date.valueOf() < stDate) {
        if (stDate > moment(ctrlObj.currentDay.date).add(1, 'days').valueOf()) {
          return;
        }
        // Reset isExtension, which could have been added previously:
        this.calEvents[ctrlObj.idx].isExtension = false;
        this.calEvents[ctrlObj.idx].extensionMonthViewDayIdxs = [];
        ctrlObj.currentDay.events.push(this.calEvents[ctrlObj.idx]);
        ctrlObj.idx = ctrlObj.idx + 1;
      }
    }
  }

  @HostListener('window:resize')
  updateSize() {
    var wkds;
    console.log('this.calendarElement.nativeElement.clientWidth', this.calendarElement.nativeElement.clientWidth);
    if (this.calendarElement.nativeElement.clientWidth < 400) {
      wkds = moment.weekdaysMin();
      if (this.sizeClass !== 'extra-small') {
        this.sizeClass = 'extra-small';
        this.sizeClassChanged = true;
      } else {
        this.sizeClassChanged = false;
      }
    } else if (this.calendarElement.nativeElement.clientWidth < 600) {
      wkds = moment.weekdaysShort();
      if (this.sizeClass !== 'small') {
        this.sizeClass = 'small';
        this.sizeClassChanged = true;
      } else {
        this.sizeClassChanged = false;
      }
    } else {
      wkds = moment.weekdays();
      if (this.sizeClass !== '') {
        this.sizeClass = '';
        this.sizeClassChanged = true;
      } else {
        this.sizeClassChanged = false;
      }
    }
    if (this.sizeClassChanged) {
      this.weekDays = wkds;
    }
  }

  tmpTapCount = 0;
  eventOnClick(item: CalendarEvent, $event) {
    $event.srcEvent.stopPropagation(); // <-- Doesn't seem to work
    this.tmpTapCount = $event.tapCount;
    setTimeout(() => {
      if (this.tmpTapCount === 1) {
        if (this.draggingItem === null) {
          this.events.publish('calendar-event:item-tap', item);
          if (typeof item.ontap === 'function') {
            item.ontap(item);
          } else if (this.onEventTap) {
            this.onEventTap.emit(item);
          }
        }
      } else if (this.tmpTapCount === 2) {
        this.events.publish('calendar-event:item-doubletap', item);
        if (typeof item.ondoubletap === 'function') {
          item.ondoubletap(item);
        } else if (this.onEventDoubleTap) {
          this.onEventDoubleTap.emit(item);
        }
      }
      this.tmpTapCount = 0;
    }, 300);
  }

  stopPressPropagation = false; // <-- Fix to stop mothDayGrid press event to
                                //     get triggered too.
  eventOnPress(item: CalendarEvent, $event) {
    $event.srcEvent.stopImmediatePropagation();
    $event.srcEvent.stopPropagation();
    this.stopPressPropagation = true;
    setTimeout(()=>{
      this.stopPressPropagation = false;
    }, 100);
    console.log('STOPPED PROPAGATION');
    if (this.draggingItem === null) {
      this.events.publish('calendar-event:item-press', item);
      if (typeof item.onpress === 'function') {
        item.onpress(item);
      } else if (this.onEventPress) {
        this.onEventPress.emit(item);
      }
    }
  }

  monthDayGridCellOnPress(item: CalendarEvent, $event) {
    $event.srcEvent.stopPropagation(); // <-- Doesn't seem to work
    if (this.draggingItem === null && this.tmpTapCount === 0 && !this.stopPressPropagation) {
      this.events.publish('calendar-event:month-grid-cell-press', item);
    }
  }

  addCalendarEvent(calEvent: CalendarEvent) {
    console.log('adding event', calEvent);
    if (typeof calEvent.id !== 'string') {
      calEvent.id = shortid.generate();
    }
    this.insertDate(calEvent);
    this.ctrl.monthView.days.some((d: CalendarDay) => {
      if (d.date.isSame(calEvent.startDate, 'day')) {
        d.events.push(calEvent);
        return true;
      }
      return false;
    });
  }
}
