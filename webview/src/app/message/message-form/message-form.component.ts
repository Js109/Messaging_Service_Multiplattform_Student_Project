import {Component, Input, OnInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Topic} from '../../models/Topic';
import {Property} from '../../models/Property';
import {HttpClient} from '@angular/common/http';
import {Message} from '../../models/Message';
import {LocationData} from '../../models/LocationData';
import {fontFamilyToFontString} from '../../models/FontFamily';

enum OffsetType {
  Minute, Hour, Day, Week
}

@Component({
  selector: 'app-message-form',
  templateUrl: './message-form.component.html',
  styleUrls: ['./message-form.component.css']
})
export class MessageFormComponent implements OnInit {

  constructor(private http: HttpClient) { }

  topics: Topic[];

  properties: [Property, boolean][];

  messageValue: Message = {
    topic: '',
    properties: [],
    content: '',
    sender: '',
    title: '',
    links: [],
    starttime: '',
    endtime: '',
    attachment: '',
    logoAttachment: '',
    locationData: null,
  };
  get message(): Message {
    return this.messageValue;
  }
  @Input()
  set message(val) {
    this.messageValue = val;
    if (val.locationData != null) {
      this.locationData = val.locationData;
    }
    this.properties = this.properties.map(property => [property[0], val.properties.some(value => value === property[0].binding)]);
  }

  locationData: LocationData = {radius: 50};
  expirationOffset: number;
  expirationOffsetType: OffsetType = null;

  hasTopicPropertiesError = false;
  hasSenderError = false;
  hasTitleError = false;
  hasContentError = false;
  coordValueRangeError = false;
  onlyOneCoordError = false;
  urlErrors: boolean[] = [];
  hasUrlErrors;

  fontFamilyToFontString = fontFamilyToFontString;

  ngOnInit(): void {
    this.http.get(environment.backendApiPath + '/topic', {responseType: 'json'})
      .subscribe((topics: Topic[]) => this.topics = topics);
    this.http.get(environment.backendApiPath + '/property', {responseType: 'json'})
      .subscribe((properties: Property[]) => this.properties = properties.map(value => [value, false]));
  }

  /**
   * Fills the message with all elements from the form and then performs validation on it.
   * If validation is passed the callback will be called with the message.
   * Use this to process the message instead of using binding as this component does not set all values put into the form directly.
   * @param callback Method that will be called with the message if validation does not fail
   */
  processMessage(callback: (message: Message) => void): void {
    if (this.validateInputs()) {
      this.setEndtimeFromExpirationOffset();
      callback(this.message);
    }
  }

  validateInputs(): boolean {
    this.hasTopicPropertiesError = this.message.topic === '' && this.message.properties.length === 0;
    this.hasSenderError = this.message.sender === '';
    this.hasTitleError = this.message.title === '';
    this.hasContentError = this.message.content === '' && this.message.attachment.length === 0;
    const locationData = this.message.locationData;
    if (locationData != null) {
      this.coordValueRangeError = locationData.lat < -90 || locationData.lat > 90 || locationData.lng < -180 || locationData.lng > 180;
      this.onlyOneCoordError = (locationData.lat == null && locationData.lng != null)
        || (locationData.lat != null && locationData.lng == null);
    }
    const urlRegex = new RegExp(
      '((http|https)\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)');
    this.urlErrors = this.message.links.map((url) => !urlRegex.test(url));
    this.hasUrlErrors = this.urlErrors.some((element) => element);
    return !(this.hasTopicPropertiesError
      || this.hasSenderError
      || this.hasTitleError
      || this.hasContentError
      || this.coordValueRangeError
      || this.onlyOneCoordError
      || this.hasUrlErrors);
  }

  addLink(): void {
    this.message.links.push('');
  }

  trackById(index: number, element: any): number {
    return index;
  }

  removeLink(pos: number): void {
    this.message.links.splice(pos, 1);
  }

  fileSelect(event: any): void {
    this.loadFileAsBas64(event.target.files[0],
      result => this.message.attachment = result);
  }

  removeAttachment(): void {
    this.message.attachment = '';
  }

  logoSelect(event: any): void {
    this.loadFileAsBas64(event.target.files[0],
      result => this.message.logoAttachment = result);
  }

  /**
   * Loads a given file as base64 and passes it to the callback
   * @param file File to be loaded
   * @param callback function that gets called with the file content as base64
   */
  loadFileAsBas64(file: any, callback: (result: string) => void): void {
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target.result;
      if (result instanceof ArrayBuffer) {
        const imageDataToString = new Uint8Array(result).reduce((acc, val) => acc + String.fromCharCode(val), '');
        callback(window.btoa(imageDataToString));
      }
    };
    reader.readAsArrayBuffer(file);
  }

  removeLogo(): void {
    this.message.logoAttachment = '';
  }

  /**
   * Create a data url from the base64 image data.
   * This url can be set as the source for an image in html/css to display it.
   * @param imageData image data in base 64
   */
  getDataUrlFromImageByteArray(imageData: string): string {
    return 'data:image/png;base64,' + imageData;
  }

  propertiesSelect(): void {
    this.message.properties = this.properties.filter(value => value[1]).map(value => value[0].binding);
  }

  locationDataHide(): void {
    if (this.message.locationData == null) {
      this.message.locationData = this.locationData;
    } else {
      this.message.locationData = null;
    }
  }

  setEndtimeFromExpirationOffset(): void {
    if (this.expirationOffsetType != null && this.expirationOffset != null) {
      const currentTime = new Date();
      const referenceTime = (this.message.starttime != null && this.message.starttime.length !== 0)
        ? new Date(new Date(this.message.starttime).getTime() - currentTime.getTimezoneOffset() * 60 * 1000)
        : new Date(currentTime.getTime() - currentTime.getTimezoneOffset() * 60 * 1000);
      const referenceTimeInMillis = referenceTime.getTime();
      let endTimeInMillis = null;
      switch (this.expirationOffsetType) {
        case OffsetType.Minute: {
          endTimeInMillis = referenceTimeInMillis + (this.expirationOffset * 60 * 1000);
          break;
        }
        case OffsetType.Hour: {
          endTimeInMillis = referenceTimeInMillis + (this.expirationOffset * 60 * 60 * 1000);
          break;
        }
        case OffsetType.Day: {
          endTimeInMillis = referenceTimeInMillis + (this.expirationOffset * 24 * 60 * 60 * 1000);
          break;
        }
        case OffsetType.Week: {
          endTimeInMillis = referenceTimeInMillis + (this.expirationOffset * 7 * 24 * 60 * 60 * 1000);
          break;
        }
        default: {
          // statements;
          break;
        }
      }
      this.message.endtime = new Date(endTimeInMillis).toISOString();
    } else{
      this.message.endtime = null;
    }
  }
}
