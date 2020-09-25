import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageFormComponent } from './message-form.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('MessageFormComponent', () => {
  let component: MessageFormComponent;
  let fixture: ComponentFixture<MessageFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageFormComponent ],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
