import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  chatboxOutline,
  peopleOutline,
  homeOutline,
} from 'ionicons/icons';

// Register commonly used icons globally to avoid per-component registration issues
addIcons({
  personCircleOutline,
  chatboxOutline,
  peopleOutline,
  homeOutline,
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
