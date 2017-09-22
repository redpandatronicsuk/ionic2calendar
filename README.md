# No longer maintained

[![Greenkeeper badge](https://badges.greenkeeper.io/redpandatronicsuk/ionic2calendar.svg)](https://greenkeeper.io/)
I wrote this calendar component some time ago, when Ionic 2 was still in the beta phase. Back then I was very excited about the upcoming Ionic 2 release, but the Ionic team took way longer to build a release version of Ionic 2 (mainly because the Angular team was slow in releasing the next version of Angular) and I shifted my interests from Angular to React and from Ionic/Cordova to React Native. You could still use this code though as a starting point for writing your own Angular/Ionic based calendar and I will keep this repository for reference.

# Ionic 2 Calendar
## A responsive calendar directive for Ionic 2

### Demo
Demo <a href="https://redpandatronicsuk.github.io/ionic2calendar/">here</a>

### Installation
Clone this directory and in the base directory run `npm i` to install the
dependencies and `ionic serve` to test the app in the browser. If you need more
help on using Ionic 2, have a look  
<a href="http://ionicframework.com/docs/v2/">here</a>.

At the moment, if you want to use the calendar in your Ionic 2 app, you will
have to copy the folder *app/components/calendar* to your app. Once the calendar
directive is out of alpha stage, we will make a NPM repository for it.

### Usage
For an example of how to use calendar directive have a look at 
*app/pages/calendar*. In the component you will have to import the directive as:
```
import {CalendarComponent} from '../../components/calendar/calendar.component';
```
and add this property to the object passed to the @Component annotation function
```
directives: [CalendarComponent]
```
If you want to access methods of the calendar from the parents component, you
should also annotate the CalendarComponent as a ViewChild:
```
@ViewChild(CalendarComponent)
private calendarComponent: CalendarComponent;
```
then in the parent component we can, for example, access the calendar's
*addCalendarEvent* methods to add new calendar events. **NOTE:** Angular 2 and
Ionic 2 offer several options for Component interaction/communication. In Ionic
2 apps, using the Ionic 2 
<a href="http://ionicframework.com/docs/v2/api/util/Events/">Events API</a>
might be a better choice. We are still considering which option(s) to offer, if
you have any comments, please drop us a line.

Then in the components template use:
```
 <ionic2-calendar [calEvents]="calEvents" 
    (afterEventMove)="afterEventMoved($event)"
    (onEventTap)="onEventTap($event)"
    (onEventDoubletap)="onEventDoubleTap($event)"
    (onEventPress)="onEventPress($event)"></ionic2-calendar>
```
*calEvents* is the only required parameter. The other parameters are event
listeners in the calendar's parent component. Every event is also fired using
the Ionic 2 Events Api.

#### Input data structure
The calendar expects events in a array of the following form:
```typescript
[
    {
      id: 'item-1', // Value that will be used for the items id attribute, if
                    // no value is suplied a random one will be generated and
                    // used internally to identify items. If supplied, it must
                    // be unique.
      data: {}, // Optional object to hold custom data
      icon: 'alarm', // Icon of the alert. This is compulsory when using the 
                     // calendar on small screens, as the name of the event will
                     // not be displayed in the month grid. It has to be a valid
                     // IonicIcons icon name.
      class: 'class', // Class of the item in the month grid cell
      iconStyle: { color: 'green' }, // Style for the item's icon
      style: { color: 'red' }, // Style for the item
      name: 'Item 1', // Name of the item
      startDate: new Date(), // Start date
      endDate: new Date(this.now + this.millisInHour * 1), // End date
      allDay: false, // Boolean for all day events
      ontap: (item: CalendarEvent) => { // Custom on-tap function for the item
        this.nav.present(Toast.create({
          message: 'Custom click event',
          duration: 3000,
          position: 'bottom'
        }));
      },
      ondoubeltap: (item: CalendarEvent) => {...},
      onpress: (item: CalendarEvent) => {...},
    },
```
The class and style parameters can be strings, arrays or objects, the same as
[ngClass](https://angular.io/docs/ts/latest/api/common/index/NgClass-directive.html) 
and [ngStyle](https://angular.io/docs/ts/latest/api/common/index/NgStyle-directive.html) use.
If custom event handlers are given, they will be used instead of the default
event handler for a certain type of event. Ionic 2 events will be emitted in
either case. For more info, check out the TypeScript interface definitions in
*app/components/calendar/calendar.component.ts*.

### TO-DO:
- Day view
- Year view
- Transitions between views
- Code clean up and documentation
