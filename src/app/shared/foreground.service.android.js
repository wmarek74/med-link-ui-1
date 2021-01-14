"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Application = require("tns-core-modules/application");
var PendingIntent = android.app.PendingIntent;
var ForegroundService = /** @class */ (function (_super) {
    __extends(ForegroundService, _super);
    function ForegroundService() {
        return _super.call(this) || this;
    }
    ForegroundService.prototype.onCreate = function () {
        _super.prototype.onCreate.call(this);
    };
    ForegroundService.prototype.onDestroy = function () {
        _super.prototype.onDestroy.call(this);
        this.stopForeground(true);
    };
    ForegroundService.prototype.onBind = function (param0) {
        console.log(param0);
        return null;
    };
    ForegroundService.prototype.onStartCommand = function (intent, flags, startId) {
        _super.prototype.onStartCommand.call(this, intent, flags, startId);
        this.startForeground(1, this.createNotification(intent));
        console.log("start foreground onstartCommad");
        return android.app.Service.START_STICKY;
    };
    ForegroundService.prototype.createNotification = function (intent) {
        this.disableDozeMode();
        //intent.putExtra('title', 'Medlink');
        var openActivityIntent = new android.content.Intent();
        openActivityIntent.setClassName(Application.android.context, 'com.tns.NativeScriptActivity');
        openActivityIntent.setFlags(android.content.Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED | android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        var openActivityPendingIntent = PendingIntent.getActivity(Application.android.context, 0, openActivityIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        this.createNotificationChannel();
        return this.getNotificationBuilder()
            .setSmallIcon(android.R.drawable.btn_star)
            .setContentTitle(this.getTitle(intent))
            .setContentIntent(openActivityPendingIntent)
            .build();
    };
    ForegroundService.prototype.disableDozeMode = function () {
        if (android.os.Build.VERSION.SDK_INT >= 24) {
            var intent = new android.content.Intent();
            var context = Application.android.context;
            var packageName = context.getPackageName();
            var pm = context.getSystemService(android.content.Context.POWER_SERVICE);
            intent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                console.log('udalo sie usunac optymaliazacje baterii');
                intent.setData(android.net.Uri.parse('package:' + packageName));
                context.startActivity(intent);
            }
            // this.wakeScreenByActivity();
        }
    };
    ForegroundService.prototype.getNotificationBuilder = function () {
        if (!android.support.v4.os.BuildCompat.isAtLeastO()) {
            // Not Oreo, not creating notification channel as compatibility issues may exist
            return new android.support.v4.app.NotificationCompat.Builder(this);
        }
        return new android.support.v4.app.NotificationCompat.Builder(this, 'TNS-ForegroundService-1');
    };
    ForegroundService.prototype.updateNotification = function () {
        //this.createNotification("a");
        var importance = android.support.v4.app.NotificationManagerCompat.IMPORTANCE_LOW;
        var mChannel = new android.app.NotificationChannel('TNS-ForegroundService-1', 'TNS-ForegroundService-1', importance);
        //Notification notification=getMyActivityNotification(text);
        // NotificationManager mNotificationManager=(NotificationManager)getSystemService(Context.NOTIFICATION_SERVICE);
        var nm = this.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
        nm.notify(1, mChannel);
    };
    ForegroundService.prototype.createNotificationChannel = function () {
        if (!android.support.v4.os.BuildCompat.isAtLeastO()) {
            // Not Oreo, not creating notification channel as compatibility issues may exist
            return;
        }
        var importance = android.support.v4.app.NotificationManagerCompat.IMPORTANCE_LOW;
        var mChannel = new android.app.NotificationChannel('TNS-ForegroundService-1', 'TNS-ForegroundService-1', importance);
        var nm = this.getSystemService(android.content.Context.NOTIFICATION_SERVICE);
        nm.createNotificationChannel(mChannel);
    };
    ForegroundService.prototype.getTitle = function (intent) {
        if (null == intent || intent.equals(null)) {
            console.log("Nie bylo intentu ??" + intent);
        }
        else {
            if (intent.hasExtra('title')) {
                var title = intent.getStringExtra('title').toString();
                if (title) {
                    if (title === null) {
                        return "MED-LINK2";
                    }
                    else {
                        return title;
                    }
                }
                else {
                    return 'MED-LINK';
                }
            }
            else {
                console.log("BAD ERROR!!");
                return 'MED-LINK3';
            }
        }
    };
    ForegroundService.prototype.onStart = function (intent, startId) {
        _super.prototype.onStart.call(this, intent, startId);
    };
    ForegroundService = __decorate([
        JavaProxy('com.tns.ForegroundService'),
        __metadata("design:paramtypes", [])
    ], ForegroundService);
    return ForegroundService;
}(android.app.Service));
exports.ForegroundService = ForegroundService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yZWdyb3VuZC5zZXJ2aWNlLmFuZHJvaWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmb3JlZ3JvdW5kLnNlcnZpY2UuYW5kcm9pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBEQUE0RDtBQUM1RCxJQUFPLGFBQWEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQztBQUdqRDtJQUF1QyxxQ0FBbUI7SUFDeEQ7ZUFFRSxpQkFBTztJQUNULENBQUM7SUFFTSxvQ0FBUSxHQUFmO1FBQ0UsaUJBQU0sUUFBUSxXQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVNLHFDQUFTLEdBQWhCO1FBQ0UsaUJBQU0sU0FBUyxXQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRU0sa0NBQU0sR0FBYixVQUFjLE1BQThCO1FBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sMENBQWMsR0FBckIsVUFDRSxNQUE4QixFQUM5QixLQUFhLEVBQ2IsT0FBZTtRQUVmLGlCQUFNLGNBQWMsWUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUU5QyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztJQUMxQyxDQUFDO0lBRU8sOENBQWtCLEdBQTFCLFVBQ0UsTUFBOEI7UUFFOUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLHNDQUFzQztRQUN0QyxJQUFNLGtCQUFrQixHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FB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TSxLQUFLLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDeEQsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO3dCQUNsQixPQUFPLFdBQVcsQ0FBQTtxQkFDbkI7eUJBQU07d0JBQ0wsT0FBTyxLQUFLLENBQUM7cUJBQ2Q7aUJBQ0Y7cUJBQU07b0JBQ0wsT0FBTyxVQUFVLENBQUM7aUJBQ25CO2FBQ0Y7aUJBQU07Z0JBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDM0IsT0FBTyxXQUFXLENBQUM7YUFDcEI7U0FDRjtJQUNILENBQUM7SUFFTSxtQ0FBTyxHQUFkLFVBQWUsTUFBOEIsRUFBRSxPQUFlO1FBQzVELGlCQUFNLE9BQU8sWUFBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQXJKVSxpQkFBaUI7UUFEN0IsU0FBUyxDQUFDLDJCQUEyQixDQUFDOztPQUMxQixpQkFBaUIsQ0FzSjdCO0lBQUQsd0JBQUM7Q0FBQSxBQXRKRCxDQUF1QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FzSnpEO0FBdEpZLDhDQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEFwcGxpY2F0aW9uIGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb24nO1xyXG5pbXBvcnQgUGVuZGluZ0ludGVudCA9IGFuZHJvaWQuYXBwLlBlbmRpbmdJbnRlbnQ7XHJcblxyXG5ASmF2YVByb3h5KCdjb20udG5zLkZvcmVncm91bmRTZXJ2aWNlJylcclxuZXhwb3J0IGNsYXNzIEZvcmVncm91bmRTZXJ2aWNlIGV4dGVuZHMgYW5kcm9pZC5hcHAuU2VydmljZSB7XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgKXtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgb25DcmVhdGUoKTogdm9pZCB7XHJcbiAgICBzdXBlci5vbkNyZWF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG9uRGVzdHJveSgpOiB2b2lkIHtcclxuICAgIHN1cGVyLm9uRGVzdHJveSgpO1xyXG4gICAgdGhpcy5zdG9wRm9yZWdyb3VuZCh0cnVlKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvbkJpbmQocGFyYW0wOiBhbmRyb2lkLmNvbnRlbnQuSW50ZW50KTogYW5kcm9pZC5vcy5JQmluZGVyIHtcclxuICAgIGNvbnNvbGUubG9nKHBhcmFtMCk7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvblN0YXJ0Q29tbWFuZChcclxuICAgIGludGVudDogYW5kcm9pZC5jb250ZW50LkludGVudCxcclxuICAgIGZsYWdzOiBudW1iZXIsXHJcbiAgICBzdGFydElkOiBudW1iZXJcclxuICApIHtcclxuICAgIHN1cGVyLm9uU3RhcnRDb21tYW5kKGludGVudCwgZmxhZ3MsIHN0YXJ0SWQpO1xyXG4gICAgdGhpcy5zdGFydEZvcmVncm91bmQoMSwgdGhpcy5jcmVhdGVOb3RpZmljYXRpb24oaW50ZW50KSk7XHJcbiAgICBjb25zb2xlLmxvZyhcInN0YXJ0IGZvcmVncm91bmQgb25zdGFydENvbW1hZFwiKTtcclxuXHJcbiAgICByZXR1cm4gYW5kcm9pZC5hcHAuU2VydmljZS5TVEFSVF9TVElDS1k7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNyZWF0ZU5vdGlmaWNhdGlvbihcclxuICAgIGludGVudDogYW5kcm9pZC5jb250ZW50LkludGVudFxyXG4gICk6IGFuZHJvaWQuYXBwLk5vdGlmaWNhdGlvbiB7XHJcbiAgICB0aGlzLmRpc2FibGVEb3plTW9kZSgpO1xyXG4gICAgLy9pbnRlbnQucHV0RXh0cmEoJ3RpdGxlJywgJ01lZGxpbmsnKTtcclxuICAgIGNvbnN0IG9wZW5BY3Rpdml0eUludGVudCA9IG5ldyBhbmRyb2lkLmNvbnRlbnQuSW50ZW50KCk7XHJcbiAgICBvcGVuQWN0aXZpdHlJbnRlbnQuc2V0Q2xhc3NOYW1lKEFwcGxpY2F0aW9uLmFuZHJvaWQuY29udGV4dCwgJ2NvbS50bnMuTmF0aXZlU2NyaXB0QWN0aXZpdHknKTtcclxuICAgIG9wZW5BY3Rpdml0eUludGVudC5zZXRGbGFncyhhbmRyb2lkLmNvbnRlbnQuSW50ZW50LkZMQUdfQUNUSVZJVFlfUkVTRVRfVEFTS19JRl9ORUVERUQgfCBhbmRyb2lkLmNvbnRlbnQuSW50ZW50LkZMQUdfQUNUSVZJVFlfTkVXX1RBU0spO1xyXG4gICAgY29uc3Qgb3BlbkFjdGl2aXR5UGVuZGluZ0ludGVudCA9IFBlbmRpbmdJbnRlbnQuZ2V0QWN0aXZpdHkoQXBwbGljYXRpb24uYW5kcm9pZC5jb250ZXh0LCAwLCBvcGVuQWN0aXZpdHlJbnRlbnQsIFBlbmRpbmdJbnRlbnQuRkxBR19VUERBVEVfQ1VSUkVOVCk7XHJcblxyXG5cclxuICAgIHRoaXMuY3JlYXRlTm90aWZpY2F0aW9uQ2hhbm5lbCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0Tm90aWZpY2F0aW9uQnVpbGRlcigpXHJcbiAgICAgIC5zZXRTbWFsbEljb24oYW5kcm9pZC5SLmRyYXdhYmxlLmJ0bl9zdGFyKVxyXG4gICAgICAuc2V0Q29udGVudFRpdGxlKHRoaXMuZ2V0VGl0bGUoaW50ZW50KSlcclxuICAgICAgLnNldENvbnRlbnRJbnRlbnQob3BlbkFjdGl2aXR5UGVuZGluZ0ludGVudClcclxuICAgICAgLmJ1aWxkKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGRpc2FibGVEb3plTW9kZSgpIHtcclxuICAgIGlmIChhbmRyb2lkLm9zLkJ1aWxkLlZFUlNJT04uU0RLX0lOVCA+PSAyNCkge1xyXG4gICAgICBjb25zdCBpbnRlbnQgPSBuZXcgYW5kcm9pZC5jb250ZW50LkludGVudCgpO1xyXG4gICAgICBjb25zdCBjb250ZXh0ID0gQXBwbGljYXRpb24uYW5kcm9pZC5jb250ZXh0O1xyXG4gICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IGNvbnRleHQuZ2V0UGFja2FnZU5hbWUoKTtcclxuICAgICAgY29uc3QgcG0gPSBjb250ZXh0LmdldFN5c3RlbVNlcnZpY2UoXHJcbiAgICAgICAgYW5kcm9pZC5jb250ZW50LkNvbnRleHQuUE9XRVJfU0VSVklDRVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaW50ZW50LnNldEZsYWdzKGFuZHJvaWQuY29udGVudC5JbnRlbnQuRkxBR19BQ1RJVklUWV9ORVdfVEFTSyk7XHJcblxyXG4gICAgICBpZiAoIXBtLmlzSWdub3JpbmdCYXR0ZXJ5T3B0aW1pemF0aW9ucyhwYWNrYWdlTmFtZSkpIHtcclxuICAgICAgICBpbnRlbnQuc2V0QWN0aW9uKFxyXG4gICAgICAgICAgYW5kcm9pZC5wcm92aWRlci5TZXR0aW5ncy5BQ1RJT05fUkVRVUVTVF9JR05PUkVfQkFUVEVSWV9PUFRJTUlaQVRJT05TXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zb2xlLmxvZygndWRhbG8gc2llIHVzdW5hYyBvcHR5bWFsaWF6YWNqZSBiYXRlcmlpJyk7XHJcbiAgICAgICAgaW50ZW50LnNldERhdGEoYW5kcm9pZC5uZXQuVXJpLnBhcnNlKCdwYWNrYWdlOicgKyBwYWNrYWdlTmFtZSkpO1xyXG4gICAgICAgIGNvbnRleHQuc3RhcnRBY3Rpdml0eShpbnRlbnQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB0aGlzLndha2VTY3JlZW5CeUFjdGl2aXR5KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldE5vdGlmaWNhdGlvbkJ1aWxkZXIoKSB7XHJcbiAgICBpZiAoIWFuZHJvaWQuc3VwcG9ydC52NC5vcy5CdWlsZENvbXBhdC5pc0F0TGVhc3RPKCkpIHtcclxuICAgICAgLy8gTm90IE9yZW8sIG5vdCBjcmVhdGluZyBub3RpZmljYXRpb24gY2hhbm5lbCBhcyBjb21wYXRpYmlsaXR5IGlzc3VlcyBtYXkgZXhpc3RcclxuICAgICAgcmV0dXJuIG5ldyBhbmRyb2lkLnN1cHBvcnQudjQuYXBwLk5vdGlmaWNhdGlvbkNvbXBhdC5CdWlsZGVyKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgYW5kcm9pZC5zdXBwb3J0LnY0LmFwcC5Ob3RpZmljYXRpb25Db21wYXQuQnVpbGRlcihcclxuICAgICAgdGhpcyxcclxuICAgICAgJ1ROUy1Gb3JlZ3JvdW5kU2VydmljZS0xJ1xyXG4gICAgKTtcclxuICB9XHJcbiAgcHVibGljIHVwZGF0ZU5vdGlmaWNhdGlvbigpe1xyXG4gICAgLy90aGlzLmNyZWF0ZU5vdGlmaWNhdGlvbihcImFcIik7XHJcbiAgICAgY29uc3QgaW1wb3J0YW5jZSA9XHJcbiAgICAgICBhbmRyb2lkLnN1cHBvcnQudjQuYXBwLk5vdGlmaWNhdGlvbk1hbmFnZXJDb21wYXQuSU1QT1JUQU5DRV9MT1c7XHJcbiAgICAgY29uc3QgbUNoYW5uZWwgPSBuZXcgYW5kcm9pZC5hcHAuTm90aWZpY2F0aW9uQ2hhbm5lbChcclxuICAgICAgICdUTlMtRm9yZWdyb3VuZFNlcnZpY2UtMScsXHJcbiAgICAgICAnVE5TLUZvcmVncm91bmRTZXJ2aWNlLTEnLFxyXG4gICAgICAgaW1wb3J0YW5jZVxyXG4gICAgICk7XHJcblxyXG4gICAgLy9Ob3RpZmljYXRpb24gbm90aWZpY2F0aW9uPWdldE15QWN0aXZpdHlOb3RpZmljYXRpb24odGV4dCk7XHJcbiAgICAvLyBOb3RpZmljYXRpb25NYW5hZ2VyIG1Ob3RpZmljYXRpb25NYW5hZ2VyPShOb3RpZmljYXRpb25NYW5hZ2VyKWdldFN5c3RlbVNlcnZpY2UoQ29udGV4dC5OT1RJRklDQVRJT05fU0VSVklDRSk7XHJcbiAgICAgY29uc3Qgbm0gPSB0aGlzLmdldFN5c3RlbVNlcnZpY2UoXHJcbiAgICAgICBhbmRyb2lkLmNvbnRlbnQuQ29udGV4dC5OT1RJRklDQVRJT05fU0VSVklDRVxyXG4gICAgICk7XHJcbiAgICAgbm0ubm90aWZ5KDEsIG1DaGFubmVsKTtcclxuICB9XHJcbiAgcHJpdmF0ZSBjcmVhdGVOb3RpZmljYXRpb25DaGFubmVsKCkge1xyXG4gICAgaWYgKCFhbmRyb2lkLnN1cHBvcnQudjQub3MuQnVpbGRDb21wYXQuaXNBdExlYXN0TygpKSB7XHJcbiAgICAgIC8vIE5vdCBPcmVvLCBub3QgY3JlYXRpbmcgbm90aWZpY2F0aW9uIGNoYW5uZWwgYXMgY29tcGF0aWJpbGl0eSBpc3N1ZXMgbWF5IGV4aXN0XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGltcG9ydGFuY2UgPVxyXG4gICAgICBhbmRyb2lkLnN1cHBvcnQudjQuYXBwLk5vdGlmaWNhdGlvbk1hbmFnZXJDb21wYXQuSU1QT1JUQU5DRV9MT1c7XHJcbiAgICBjb25zdCBtQ2hhbm5lbCA9IG5ldyBhbmRyb2lkLmFwcC5Ob3RpZmljYXRpb25DaGFubmVsKFxyXG4gICAgICAnVE5TLUZvcmVncm91bmRTZXJ2aWNlLTEnLFxyXG4gICAgICAnVE5TLUZvcmVncm91bmRTZXJ2aWNlLTEnLFxyXG4gICAgICBpbXBvcnRhbmNlXHJcbiAgICApO1xyXG4gICAgdmFyIG5tID0gdGhpcy5nZXRTeXN0ZW1TZXJ2aWNlKFxyXG4gICAgICBhbmRyb2lkLmNvbnRlbnQuQ29udGV4dC5OT1RJRklDQVRJT05fU0VSVklDRVxyXG4gICAgKTtcclxuICAgIG5tLmNyZWF0ZU5vdGlmaWNhdGlvbkNoYW5uZWwobUNoYW5uZWwpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBnZXRUaXRsZShpbnRlbnQ6IGFuZHJvaWQuY29udGVudC5JbnRlbnQpOiBzdHJpbmcge1xyXG4gICAgaWYgKG51bGwgPT0gaW50ZW50IHx8IGludGVudC5lcXVhbHMobnVsbCkpXHJcbiAgICB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiTmllIGJ5bG8gaW50ZW50dSA/P1wiICsgaW50ZW50KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgaWYgKGludGVudC5oYXNFeHRyYSgndGl0bGUnKSkge1xyXG5cclxuICAgICAgICBjb25zdCB0aXRsZSA9IGludGVudC5nZXRTdHJpbmdFeHRyYSgndGl0bGUnKS50b1N0cmluZygpO1xyXG4gICAgICAgIGlmICh0aXRsZSkge1xyXG4gICAgICAgICAgaWYgKHRpdGxlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIk1FRC1MSU5LMlwiXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGl0bGU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiAnTUVELUxJTksnO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkJBRCBFUlJPUiEhXCIpO1xyXG4gICAgICAgIHJldHVybiAnTUVELUxJTkszJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIG9uU3RhcnQoaW50ZW50OiBhbmRyb2lkLmNvbnRlbnQuSW50ZW50LCBzdGFydElkOiBudW1iZXIpIHtcclxuICAgIHN1cGVyLm9uU3RhcnQoaW50ZW50LCBzdGFydElkKTtcclxuICB9XHJcbn1cclxuIl19