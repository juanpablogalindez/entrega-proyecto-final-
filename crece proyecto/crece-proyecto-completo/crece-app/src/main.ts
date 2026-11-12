import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { addIcons } from 'ionicons';
import {
  searchOutline, schoolOutline, storefrontOutline, personOutline, homeOutline,
  locationOutline, timeOutline, logoWhatsapp, mapOutline,
  pricetagsOutline, receiptOutline, locateOutline, trashOutline,
  add, removeCircleOutline, addCircleOutline, playCircleOutline,
  documentTextOutline, documentOutline, bookOutline,
  restaurantOutline, cutOutline, hammerOutline, phonePortraitOutline, optionsOutline,
  medkitOutline, chatbubbleEllipsesOutline, imageOutline, notificationsOutline,
  shirtOutline, briefcaseOutline, appsOutline, createOutline, settingsOutline,
  helpCircleOutline, logOutOutline, heartOutline, heart, cartOutline, addOutline,
  closeOutline, starOutline, shieldCheckmark, shieldCheckmarkOutline,
  checkmarkCircle, checkmarkCircleOutline, checkmarkOutline, cameraOutline, cardOutline, businessOutline
} from 'ionicons/icons';

addIcons({
  'search-outline': searchOutline,
  'school-outline': schoolOutline,
  'storefront-outline': storefrontOutline,
  'person-outline': personOutline,
  'home-outline': homeOutline,
  'location-outline': locationOutline,
  'time-outline': timeOutline,
  'logo-whatsapp': logoWhatsapp,
  'map-outline': mapOutline,
  'pricetags-outline': pricetagsOutline,
  'receipt-outline': receiptOutline,
  'locate-outline': locateOutline,
  'trash-outline': trashOutline,
  'add': add,
  'remove-circle-outline': removeCircleOutline,
  'add-circle-outline': addCircleOutline,
  'play-circle-outline': playCircleOutline,
  'document-text-outline': documentTextOutline,
  'document-outline': documentOutline,
  'book-outline': bookOutline,
  'restaurant-outline': restaurantOutline,
  'cut-outline': cutOutline,
  'hammer-outline': hammerOutline,
  'phone-portrait-outline': phonePortraitOutline,
  'medkit-outline': medkitOutline,
  'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
  'image-outline': imageOutline,
  'notifications-outline': notificationsOutline,
  'options-outline': optionsOutline,
  'shirt-outline': shirtOutline,
  'briefcase-outline': briefcaseOutline,
  'apps-outline': appsOutline,
  'create-outline': createOutline,
  'settings-outline': settingsOutline,
  'help-circle-outline': helpCircleOutline,
  'log-out-outline': logOutOutline,
  'heart-outline': heartOutline,
  'heart': heart,
  'cart-outline': cartOutline,
  'add-outline': addOutline,
  'close-outline': closeOutline,
  'star-outline': starOutline,
  'shield-checkmark': shieldCheckmark,
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'checkmark-circle': checkmarkCircle,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'checkmark-outline': checkmarkOutline,
  'camera-outline': cameraOutline,
  'card-outline': cardOutline,
  'business-outline': businessOutline
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
