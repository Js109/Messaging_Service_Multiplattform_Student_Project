import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MessageComponent} from './message/message.component';
import {PropertyComponent} from './property/property.component';
import {TopicComponent} from './topic/topic.component';

const routes: Routes = [
  { path: '', redirectTo: '/message', pathMatch: 'full'},
  { path: 'message', component: MessageComponent },
  { path: 'property', component: PropertyComponent },
  { path: 'topic', component: TopicComponent}
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ]
})
export class AppRoutingModule { }
