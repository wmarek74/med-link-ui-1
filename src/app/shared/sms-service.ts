import { Injectable } from '@angular/core';
import * as TNSInbox from 'nativescript-sms-inbox';
import * as appSettings from 'tns-core-modules/application-settings';
import * as TNSsms from 'nativescript-temp-sms';

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  phoneNum: string;
  message: string;
  dateMessage: string;

  public getInboxMessages() {
    TNSInbox.getInboxes({ max: 1 }).then((res) => {
      console.log(JSON.stringify(res));
    }, (err) => {
      console.log('Error: ' + err);
    });
  }
  public getInboxMessagesFromNumber() { //fromNumber = "0712345678"
    return new Promise((resolve, reject) => {
      this.phoneNum = appSettings.getString('phoneN', null);
      if (this.phoneNum.match(/(^\d{9})/)) {
        TNSInbox.getInboxesFromNumber('+48' + this.phoneNum, { max: 1 }).then((res) => {
          console.log(JSON.stringify(res));
          const obj = JSON.parse(JSON.stringify(res));
          console.log(obj.data[0].message, "hpsassssss!");
          this.message = obj.data[0].message;
          this.dateMessage = obj.data[0].date;
          appSettings.setString('dateMessage', this.dateMessage);
        }, (err) => {
          console.log('Error: ' + err);
        });
      } else {
        console.log(" Prosze podać nr tel. opiekuna");
      }
      resolve(),
        reject();
    });
  }
  sendSms() {
    const sms = android.telephony.SmsManager.getDefault();
    sms.sendTextMessage(this.phoneNum, null, "Zmiana statusu pompy powiodła się", null, null);
    //TNSsms.sms(this.phoneNum, 'Udało się zatrzymać pompę');
  }


}
