import {Component, NgZone, OnInit} from '@angular/core';
import {Message} from '../models/Message';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {HttpParams} from '@angular/common/http';
import {Topic} from '../models/Topic';
import {Property} from '../models/Property';
import {MessageFilter} from '../models/MessageFilter';

@Component({
  selector: 'app-message-history',
  templateUrl: './message-history.component.html',
  styleUrls: ['./message-history.component.css']
})
export class MessageHistoryComponent implements OnInit {

  constructor(private http: HttpClient, private ngZone: NgZone) {
  }

  messageFilter: MessageFilter = {
    searchString: '',
    starttimePeriod: '',
    endtimePeriod: '',
    topic: ''
  };

  topics: Topic[];
  properties: [Property, boolean][];
  messagesArray = [];
  hasDateRangeError = false;
  hasTopicPropertiesError = false;

  ngOnInit(): void {
    this.http.get(environment.backendApiPath + '/topic', {responseType: 'json'})
      .subscribe((topics: Topic[]) => this.topics = topics);
    this.http.get(environment.backendApiPath + '/property', {responseType: 'json'})
      .subscribe((properties: Property[]) => this.properties = properties.map(value => [value, false]));
  }

  validateInputs(): boolean {
    this.hasDateRangeError = ((this.messageFilter.starttimePeriod === '' && this.messageFilter.endtimePeriod !== '') ||
      (this.messageFilter.starttimePeriod !== '' && this.messageFilter.endtimePeriod === '') ||
      new Date(this.messageFilter.starttimePeriod).getTime() > new Date(this.messageFilter.endtimePeriod).getTime());
    return !(this.hasDateRangeError);
  }

  showMessages(): void {
    if (this.validateInputs()) {
      // Add safe, URL encoded search parameter if there is a search term
      const options =
        {
          params: new HttpParams().set('searchString', this.messageFilter.searchString)
            .set('startTimePeriod', this.messageFilter.starttimePeriod)
            .set('endTimePeriod', this.messageFilter.endtimePeriod).set('topic', this.messageFilter.topic)
        };

      this.http.get<Message[]>(environment.backendApiPath + '/message', options)
        .subscribe(
          value => {
            this.messagesArray = value;
            console.log(this.messagesArray);
          },
          error => {
            console.log(error);
          }
        );
    }
  }

  deleteMessage(id: number): void {
    this.http.delete(environment.backendApiPath + '/message/' + id, ).subscribe(
      value => {
        console.log(`send delete message with ${id}`);
      },
      error => {
        console.log(error);
      },
      () => {
        this.ngZone.run( () => {
          this.showMessages();
        });
      }
    );
  }

}