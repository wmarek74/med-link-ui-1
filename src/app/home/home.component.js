"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var data_service_1 = require("../shared/data.service");
var database_service_1 = require("~/app/shared/database.service");
var operators_1 = require("rxjs/operators");
var platform_1 = require("tns-core-modules/platform");
var sms_service_1 = require("../shared/sms-service");
var HomeComponent = /** @class */ (function () {
    function HomeComponent(dataService, databaseService, smsService) {
        this.dataService = dataService;
        this.databaseService = databaseService;
        this.smsService = smsService;
        this.webViewSrc = 'https://openaps.readthedocs.io/en/latest/docs/While%20You%20Wait%20For%20Gear/nightscout-setup.html';
    }
    HomeComponent.prototype.ngOnInit = function () {
        var _this = this;
        //this.smsService.getInboxMessages();
        //this.smsService.getInboxMessagesFromNumber();
        this.sendDatatoNightscout7().then(function () { return console.log(_this.webViewSrc + "ffffffffffffff111111"); });
    };
    HomeComponent.prototype.onRefresh = function () {
        var _this = this;
        this.sendDatatoNightscout7().then(function () { return console.log(_this.webViewSrc + "ffffffffffffff111111"); });
    };
    HomeComponent.prototype.onWebViewLoaded = function (args) {
        var webView = args.object;
        var nativeWebView = webView.nativeView; // equal to webView.android or webView.ios (depending on the platform)
        if (platform_1.isAndroid) {
            nativeWebView.getSettings().setAppCacheEnabled(true);
            nativeWebView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NORMAL);
            nativeWebView.getSettings().setJavaScriptEnabled(true);
            nativeWebView.getSettings().setDomStorageEnabled(true);
            nativeWebView.getSettings().setDatabaseEnabled(true);
            //nativeWebView.getSettings().setDatabasePath(dbpath); //check the documentation for info about dbpath
            nativeWebView.getSettings().setMinimumFontSize(1);
            nativeWebView.getSettings().setMinimumLogicalFontSize(1);
            //nativeWebView.setSupportZoom(true);
        }
    };
    HomeComponent.prototype.getNSData = function () {
        return this.databaseService.NSconf().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                http: a[0],
                secret: a[1],
                hash: a[2]
            }); });
        }));
    };
    HomeComponent.prototype.sendDatatoNightscout7 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getNSData().subscribe(function (g) {
                g.map(function (bol) {
                    console.log(bol.http.toString() + "66666666666" + bol.secret.toString());
                    _this.webViewSrc = bol.http.toString();
                });
                console.log("as" + _this.webViewSrc);
                resolve(),
                    reject();
            });
        });
    };
    HomeComponent = __decorate([
        core_1.Component({
            selector: "Home",
            moduleId: module.id,
            templateUrl: "./home.component.html"
        }),
        __metadata("design:paramtypes", [data_service_1.DataService,
            database_service_1.DatabaseService,
            sms_service_1.SmsService])
    ], HomeComponent);
    return HomeComponent;
}());
exports.HomeComponent = HomeComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9tZS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJob21lLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUFrRDtBQUNsRCx1REFBcUQ7QUFDckQsa0VBQWdFO0FBRWhFLDRDQUFxQztBQUdyQyxzREFBc0Q7QUFDdEQscURBQW1EO0FBUW5EO0lBRUUsdUJBQW1CLFdBQXdCLEVBQ3hCLGVBQWdDLEVBQ2hDLFVBQXNCO1FBRnRCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBSHpDLGVBQVUsR0FBVyxxR0FBcUcsQ0FBQztJQUcvRSxDQUFDO0lBRTdDLGdDQUFRLEdBQVI7UUFBQSxpQkFJQztRQUhDLHFDQUFxQztRQUNyQywrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDLGNBQU0sT0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxVQUFVLEdBQUcsc0JBQXNCLENBQUMsRUFBckQsQ0FBcUQsQ0FBQyxDQUFDO0lBQ2pHLENBQUM7SUFDRCxpQ0FBUyxHQUFUO1FBQUEsaUJBRUM7UUFEQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBTSxPQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSSxDQUFDLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxFQUFyRCxDQUFxRCxDQUFDLENBQUM7SUFDakcsQ0FBQztJQUNELHVDQUFlLEdBQWYsVUFBZ0IsSUFBZTtRQUM3QixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBaUIsQ0FBQztRQUV2QyxJQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsc0VBQXNFO1FBRWhILElBQUksb0JBQVMsRUFBRTtZQUNiLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRCxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pGLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RCxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkQsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JELHNHQUFzRztZQUN0RyxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELHFDQUFxQztTQUN0QztJQUNILENBQUM7SUFFRCxpQ0FBUyxHQUFUO1FBQ0UsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FDdkMsZUFBRyxDQUFDLFVBQUEsSUFBSTtZQUNOLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUM7Z0JBQ3BCLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNWLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNaLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ1gsQ0FBQyxFQUptQixDQUluQixDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQUNELDZDQUFxQixHQUFyQjtRQUFBLGlCQVlDO1FBWEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ2pDLEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBQSxDQUFDO2dCQUMxQixDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRztvQkFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsYUFBYSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDekUsS0FBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN4QyxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3BDLE9BQU8sRUFBRTtvQkFDUCxNQUFNLEVBQUUsQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBdkRVLGFBQWE7UUFMekIsZ0JBQVMsQ0FBQztZQUNULFFBQVEsRUFBRSxNQUFNO1lBQ2hCLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtZQUNuQixXQUFXLEVBQUUsdUJBQXVCO1NBQ3JDLENBQUM7eUNBR2dDLDBCQUFXO1lBQ1Asa0NBQWU7WUFDcEIsd0JBQVU7T0FKOUIsYUFBYSxDQXdEekI7SUFBRCxvQkFBQztDQUFBLEFBeERELElBd0RDO0FBeERZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBPbkluaXQgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xyXG5pbXBvcnQgeyBEYXRhU2VydmljZSB9IGZyb20gXCIuLi9zaGFyZWQvZGF0YS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IERhdGFiYXNlU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9kYXRhYmFzZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gXCJyeGpzL29wZXJhdG9yc1wiO1xyXG5pbXBvcnQgeyBXZWJWaWV3IH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvd2ViLXZpZXdcIjtcclxuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZGF0YS9vYnNlcnZhYmxlXCI7XHJcbmltcG9ydCB7IGlzQW5kcm9pZCB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3BsYXRmb3JtXCI7XHJcbmltcG9ydCB7IFNtc1NlcnZpY2UgfSBmcm9tIFwiLi4vc2hhcmVkL3Ntcy1zZXJ2aWNlXCI7XHJcblxyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6IFwiSG9tZVwiLFxyXG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXHJcbiAgdGVtcGxhdGVVcmw6IFwiLi9ob21lLmNvbXBvbmVudC5odG1sXCJcclxufSlcclxuZXhwb3J0IGNsYXNzIEhvbWVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xyXG4gIHdlYlZpZXdTcmM6IHN0cmluZyA9ICdodHRwczovL29wZW5hcHMucmVhZHRoZWRvY3MuaW8vZW4vbGF0ZXN0L2RvY3MvV2hpbGUlMjBZb3UlMjBXYWl0JTIwRm9yJTIwR2Vhci9uaWdodHNjb3V0LXNldHVwLmh0bWwnO1xyXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBkYXRhU2VydmljZTogRGF0YVNlcnZpY2UsXHJcbiAgICAgICAgICAgICAgcHVibGljIGRhdGFiYXNlU2VydmljZTogRGF0YWJhc2VTZXJ2aWNlLFxyXG4gICAgICAgICAgICAgIHB1YmxpYyBzbXNTZXJ2aWNlOiBTbXNTZXJ2aWNlKSB7fVxyXG5cclxuICBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIC8vdGhpcy5zbXNTZXJ2aWNlLmdldEluYm94TWVzc2FnZXMoKTtcclxuICAgIC8vdGhpcy5zbXNTZXJ2aWNlLmdldEluYm94TWVzc2FnZXNGcm9tTnVtYmVyKCk7XHJcbiAgICB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0NygpLnRoZW4oKCkgPT4gY29uc29sZS5sb2codGhpcy53ZWJWaWV3U3JjICsgXCJmZmZmZmZmZmZmZmZmZjExMTExMVwiKSk7XHJcbiAgfVxyXG4gIG9uUmVmcmVzaCgpe1xyXG4gICAgdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDcoKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKHRoaXMud2ViVmlld1NyYyArIFwiZmZmZmZmZmZmZmZmZmYxMTExMTFcIikpO1xyXG4gIH1cclxuICBvbldlYlZpZXdMb2FkZWQoYXJnczogRXZlbnREYXRhKSB7XHJcbiAgICBjb25zdCB3ZWJWaWV3ID0gYXJncy5vYmplY3QgYXMgV2ViVmlldztcclxuXHJcbiAgICBjb25zdCBuYXRpdmVXZWJWaWV3ID0gd2ViVmlldy5uYXRpdmVWaWV3OyAvLyBlcXVhbCB0byB3ZWJWaWV3LmFuZHJvaWQgb3Igd2ViVmlldy5pb3MgKGRlcGVuZGluZyBvbiB0aGUgcGxhdGZvcm0pXHJcblxyXG4gICAgaWYgKGlzQW5kcm9pZCkge1xyXG4gICAgICBuYXRpdmVXZWJWaWV3LmdldFNldHRpbmdzKCkuc2V0QXBwQ2FjaGVFbmFibGVkKHRydWUpO1xyXG4gICAgICBuYXRpdmVXZWJWaWV3LmdldFNldHRpbmdzKCkuc2V0Q2FjaGVNb2RlKGFuZHJvaWQud2Via2l0LldlYlNldHRpbmdzLkxPQURfTk9STUFMKTtcclxuICAgICAgbmF0aXZlV2ViVmlldy5nZXRTZXR0aW5ncygpLnNldEphdmFTY3JpcHRFbmFibGVkKHRydWUpO1xyXG4gICAgICBuYXRpdmVXZWJWaWV3LmdldFNldHRpbmdzKCkuc2V0RG9tU3RvcmFnZUVuYWJsZWQodHJ1ZSk7XHJcbiAgICAgIG5hdGl2ZVdlYlZpZXcuZ2V0U2V0dGluZ3MoKS5zZXREYXRhYmFzZUVuYWJsZWQodHJ1ZSk7XHJcbiAgICAgIC8vbmF0aXZlV2ViVmlldy5nZXRTZXR0aW5ncygpLnNldERhdGFiYXNlUGF0aChkYnBhdGgpOyAvL2NoZWNrIHRoZSBkb2N1bWVudGF0aW9uIGZvciBpbmZvIGFib3V0IGRicGF0aFxyXG4gICAgICBuYXRpdmVXZWJWaWV3LmdldFNldHRpbmdzKCkuc2V0TWluaW11bUZvbnRTaXplKDEpO1xyXG4gICAgICBuYXRpdmVXZWJWaWV3LmdldFNldHRpbmdzKCkuc2V0TWluaW11bUxvZ2ljYWxGb250U2l6ZSgxKTtcclxuICAgICAgLy9uYXRpdmVXZWJWaWV3LnNldFN1cHBvcnRab29tKHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0TlNEYXRhKCk6IE9ic2VydmFibGU8QXJyYXk8eyBodHRwOiBzdHJpbmc7IHNlY3JldDogc3RyaW5nOyBoYXNoOiBzdHJpbmcgfT4+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5OU2NvbmYoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIGh0dHA6IGFbMF0sXHJcbiAgICAgICAgICBzZWNyZXQ6IGFbMV0sXHJcbiAgICAgICAgICBoYXNoOiBhWzJdXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQ3KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXROU0RhdGEoKS5zdWJzY3JpYmUoZyA9PiB7XHJcbiAgICAgICAgZy5tYXAoYm9sID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGJvbC5odHRwLnRvU3RyaW5nKCkgKyBcIjY2NjY2NjY2NjY2XCIgKyBib2wuc2VjcmV0LnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgdGhpcy53ZWJWaWV3U3JjID0gYm9sLmh0dHAudG9TdHJpbmcoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImFzXCIgKyB0aGlzLndlYlZpZXdTcmMpO1xyXG4gICAgICAgIHJlc29sdmUoKSxcclxuICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=