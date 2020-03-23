"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var nativescript_email_1 = require("nativescript-email");
var Permissions = require("nativescript-permissions");
var operators_1 = require("rxjs/operators");
var data_facade_service_1 = require("~/app/shared/data-facade.service");
var database_service_1 = require("~/app/shared/database.service");
var trace_writer_service_1 = require("~/app/shared/trace-writer.service");
var Runtime = java.lang.Runtime;
var fs = require("tns-core-modules/file-system");
var appSettings = require("tns-core-modules/application-settings");
var dialogs = require("tns-core-modules/ui/dialogs");
var SearchComponent = /** @class */ (function () {
    function SearchComponent(changeDetectorRef, databaseService, dataFacadeService, traceWriterService) {
        this.changeDetectorRef = changeDetectorRef;
        this.databaseService = databaseService;
        this.dataFacadeService = dataFacadeService;
        this.traceWriterService = traceWriterService;
        this.pending = false;
        this.rangeText = "AUTO STOP PRZY WARTOSCI: " + appSettings.getNumber('range', 75);
        // Use the constructor to inject services.
    }
    SearchComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.phoneN = 'Tel: ' + appSettings.getString('phoneN', 'Podaj nr tel. opiekuna');
        this.auto = appSettings.getBoolean('auto', false);
        this.bgSource = appSettings.getBoolean('bgsource', false);
        this.rangeText = "AUTO STOP PRZY WARTOSCI: " + appSettings.getNumber('range', 75) + "MG/DL";
        this.traceWriterService.subscribe(function (_a) {
            var message = _a.message, date = _a.date, category = _a.category, messageType = _a.messageType;
            _this.databaseService.insertLogs(date, message, messageType, category);
        });
        this.sendDatatoNightscout7().then(function () {
            return console.log(_this.nsUrl2 + "fffffffff3333333f");
        });
    };
    SearchComponent.prototype.getBGRange = function () {
        var _this = this;
        dialogs.prompt({
            title: "Podaj wartość przy jakiej ma zostać wyłączona pompa",
            message: "Wartość graniczna to:",
            okButtonText: "OK",
            cancelButtonText: "Anuluj",
            inputType: dialogs.inputType.number
        }).then(function (r) {
            console.log("Dialog closed!" + r.result + ", A TO TEKST:" + r.text);
            _this.range = Number(r.text);
            if (_this.range < 75 || _this.range > 110) {
                dialogs.alert({ message: "UWAGA WARTOŚC Z POZA ZAKRESU: 75 - 110 MG/DL", okButtonText: "OK" });
            }
            else {
                appSettings.setNumber('range', _this.range);
                _this.rangeText = "AUTO STOP PRZY WARTOŚCI: " + _this.range + "MG/DL";
            }
        });
    };
    SearchComponent.prototype.setPhoneNumber = function () {
        var _this = this;
        dialogs.prompt({
            title: "Podaj nr tel. opiekuna",
            message: "Podaj numer telefonu z którego będą przyjmowane komendy",
            okButtonText: "OK",
            cancelButtonText: "Anuluj",
            inputType: dialogs.inputType.number
        }).then(function (r) {
            console.log("Dialog closed!" + r.result + ", A TO TEKST:" + r.text);
            if (r.text === '') {
                appSettings.setString('phoneN', 'Podaj nr tel. opiekuna');
                _this.phoneN = 'Podaj nr tel. opiekuna';
            }
            else {
                Permissions.requestPermission(android.Manifest.permission.SEND_SMS, "zezwolic na czytanie SMS?").then(function () { return Permissions.requestPermission(android.Manifest.permission.READ_SMS); });
                appSettings.setString('phoneN', r.text);
                _this.phoneN = 'Tel: ' + r.text;
            }
        });
    };
    SearchComponent.prototype.sendLogs = function () {
        var documents = fs.path.join(android.os.Environment.getExternalStorageDirectory().getAbsolutePath().toString());
        var myFolder = fs.Folder.fromPath(documents);
        var myFile = myFolder.getFile("my.txt");
        var a = Runtime.getRuntime().exec('logcat -v time -f /sdcard/my.txt -d');
        console.log("to ta wielkosc pliku: " + myFile.size);
        if (myFile.size > 5000000) {
            myFile.remove();
        }
        var u = setInterval(function () {
            if (a.isAlive() === false) {
                clearInterval(u);
                console.log("CIOSs");
                Permissions.requestPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE).then(function () {
                    return nativescript_email_1.compose({
                        subject: "Debug med-link-ui",
                        body: "aReduced2",
                        to: ["jrkf@o2.pl"],
                        attachments: [{
                                mimeType: 'text',
                                path: myFile.path,
                                fileName: 'my.txt'
                            }]
                    });
                });
            }
            else {
                console.log("BAM BAM");
            }
        }, 500);
    };
    SearchComponent.prototype.Zapisz = function () {
        var _this = this;
        console.log("aaaaaa" + this.nsUrl);
        var sha1 = require("sha1");
        this.databaseService.insertNS(this.nsUrl, sha1(this.nsKey), this.nsKey);
        console.log("NS URL: " + this.nsUrl + " ddddddddddd " + this.nsKey);
        this.sendDatatoNightscout6().then(function () {
            return console.log(_this.slowo + "aRRRRRRRRRR");
        });
        if (this.nsUrl.substring(0, 8).toUpperCase() !== "HTTPS://" ||
            this.nsUrl.substring(this.nsUrl.length - 1, this.nsUrl.length) === "/") {
            this.slowo2 = "ZŁY ADRES URL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!";
        }
        else {
            this.slowo2 = "OK! ";
        }
    };
    SearchComponent.prototype.onCheckedChangeAuto = function (args) {
        var mySwitch = args.object;
        var isChecked = mySwitch.checked; // boolean
        if (isChecked === true) {
            appSettings.setBoolean("auto", true);
            this.auto = appSettings.getBoolean('auto');
        }
        else {
            appSettings.setBoolean("auto", false);
            this.auto = appSettings.getBoolean('auto');
        }
    };
    SearchComponent.prototype.onCheckedChangeSource = function (args) {
        var mySwitch = args.object;
        var isChecked = mySwitch.checked; // boolean
        if (isChecked === true) {
            appSettings.setBoolean("bgsource", true);
            this.bgSource = appSettings.getBoolean('bgsource');
        }
        else {
            appSettings.setBoolean("bgsource", false);
            this.bgSource = appSettings.getBoolean('bgsource');
        }
    };
    SearchComponent.prototype.sendDatatoNightscout6 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getNSData().subscribe(function (g) {
                g.map(function (bol) {
                    console.log(bol.http.toString() + "JJJJJJJ" + bol.secret.toString());
                    _this.slowo =
                        _this.slowo2 +
                            "  " +
                            bol.http.toString() +
                            " " +
                            bol.secret.toString();
                });
                console.log("as" + _this.slowo);
                resolve(), reject();
            });
        });
    };
    SearchComponent.prototype.sendDatatoNightscout7 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getNSData().subscribe(function (g) {
                g.map(function (bol) {
                    console.log(bol.http.toString() + "66666666666" + bol.secret.toString());
                    _this.nsUrl2 = bol.http.toString();
                    _this.nsKey2 = bol.hash.toString();
                });
                console.log("as" + _this.nsUrl2);
                resolve(), reject();
            });
        });
    };
    SearchComponent.prototype.setNS = function (arg) {
        console.log("setttNS");
        console.log(arg.text);
        this.nsUrl = arg.text;
    };
    SearchComponent.prototype.setNSurl = function (arg) {
        console.log("setttNSUURRL");
        console.log(arg.text);
        this.nsKey = arg.text;
    };
    SearchComponent.prototype.getNSData = function () {
        return this.databaseService.NSconf().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                http: a[0],
                secret: a[1],
                hash: a[2]
            }); });
        }));
    };
    SearchComponent = __decorate([
        core_1.Component({
            selector: "Search",
            moduleId: module.id,
            templateUrl: "./search.component.html",
            styleUrls: ["./search.component.scss"]
        }),
        __metadata("design:paramtypes", [core_1.ChangeDetectorRef,
            database_service_1.DatabaseService,
            data_facade_service_1.DataFacadeService,
            trace_writer_service_1.TraceWriterService])
    ], SearchComponent);
    return SearchComponent;
}());
exports.SearchComponent = SearchComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlYXJjaC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBcUU7QUFDckUseURBQTZDO0FBQzdDLHNEQUF3RDtBQUV4RCw0Q0FBcUM7QUFDckMsd0VBQXFFO0FBQ3JFLGtFQUFnRTtBQUNoRSwwRUFBdUU7QUFDdkUsSUFBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsaURBQW1EO0FBR25ELG1FQUFxRTtBQUNyRSxxREFBdUQ7QUFTdkQ7SUFpQkUseUJBQ1UsaUJBQW9DLEVBQ3BDLGVBQWdDLEVBQ2hDLGlCQUFvQyxFQUNwQyxrQkFBc0M7UUFIdEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNwQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1FBWGhELFlBQU8sR0FBRyxLQUFLLENBQUM7UUFLaEIsY0FBUyxHQUFXLDJCQUEyQixHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBUW5GLDBDQUEwQztJQUM1QyxDQUFDO0lBQ0Qsa0NBQVEsR0FBUjtRQUFBLGlCQWFDO1FBWkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLFNBQVMsR0FBRywyQkFBMkIsR0FBRyxXQUFX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Q0FBQyxFQUptQixDQUluQixDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQztJQXROVSxlQUFlO1FBTjNCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsUUFBUTtZQUNsQixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsV0FBVyxFQUFFLHlCQUF5QjtZQUN0QyxTQUFTLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQztTQUN2QyxDQUFDO3lDQW1CNkIsd0JBQWlCO1lBQ25CLGtDQUFlO1lBQ2IsdUNBQWlCO1lBQ2hCLHlDQUFrQjtPQXJCckMsZUFBZSxDQXVOM0I7SUFBRCxzQkFBQztDQUFBLEFBdk5ELElBdU5DO0FBdk5ZLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudCwgT25Jbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IGNvbXBvc2UgfSBmcm9tICduYXRpdmVzY3JpcHQtZW1haWwnO1xyXG5pbXBvcnQgKiBhcyBQZXJtaXNzaW9ucyBmcm9tICduYXRpdmVzY3JpcHQtcGVybWlzc2lvbnMnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsgRGF0YUZhY2FkZVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvZGF0YS1mYWNhZGUuc2VydmljZSc7XHJcbmltcG9ydCB7IERhdGFiYXNlU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9kYXRhYmFzZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgVHJhY2VXcml0ZXJTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL3RyYWNlLXdyaXRlci5zZXJ2aWNlJztcclxuaW1wb3J0IFJ1bnRpbWUgPSBqYXZhLmxhbmcuUnVudGltZTtcclxuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIjtcclxuaW1wb3J0IHsgRXZlbnREYXRhIH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZGF0YS9vYnNlcnZhYmxlXCI7XHJcbmltcG9ydCB7IFN3aXRjaCB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL3N3aXRjaFwiO1xyXG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xyXG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcclxuaW1wb3J0IHsgdG9OdW1iZXJzIH0gZnJvbSBcIkBhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvZGlhZ25vc3RpY3MvdHlwZXNjcmlwdF92ZXJzaW9uXCI7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogXCJTZWFyY2hcIixcclxuICBtb2R1bGVJZDogbW9kdWxlLmlkLFxyXG4gIHRlbXBsYXRlVXJsOiBcIi4vc2VhcmNoLmNvbXBvbmVudC5odG1sXCIsXHJcbiAgc3R5bGVVcmxzOiBbXCIuL3NlYXJjaC5jb21wb25lbnQuc2Nzc1wiXVxyXG59KVxyXG5leHBvcnQgY2xhc3MgU2VhcmNoQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0IHtcclxuICBzbG93bzogc3RyaW5nO1xyXG4gIHNsb3dvMjogc3RyaW5nO1xyXG4gIG5zVXJsOiBzdHJpbmc7XHJcbiAgbnNVcmwyOiBzdHJpbmc7XHJcbiAgbnNLZXk6IHN0cmluZztcclxuICBwaG9uZU46IHN0cmluZztcclxuICAvL3Bob25lOiBzdHJpbmcgPSAnJztcclxuICBuc0tleTI6IHN0cmluZztcclxuICBjYXJiczogc3RyaW5nO1xyXG4gIHBlbmRpbmcgPSBmYWxzZTtcclxuICBhUmVkdWNlZDI6IHN0cmluZztcclxuICBhdXRvOiBib29sZWFuO1xyXG4gIGJnU291cmNlOiBib29sZWFuO1xyXG4gIHJhbmdlOiBudW1iZXI7XHJcbiAgcmFuZ2VUZXh0OiBzdHJpbmcgPSBcIkFVVE8gU1RPUCBQUlpZIFdBUlRPU0NJOiBcIiArIGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXHJcbiAgICBwcml2YXRlIGRhdGFiYXNlU2VydmljZTogRGF0YWJhc2VTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBkYXRhRmFjYWRlU2VydmljZTogRGF0YUZhY2FkZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHRyYWNlV3JpdGVyU2VydmljZTogVHJhY2VXcml0ZXJTZXJ2aWNlXHJcbiAgKSB7XHJcbiAgICAvLyBVc2UgdGhlIGNvbnN0cnVjdG9yIHRvIGluamVjdCBzZXJ2aWNlcy5cclxuICB9XHJcbiAgbmdPbkluaXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLnBob25lTiA9ICdUZWw6ICcgKyBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ3Bob25lTicsICdQb2RhaiBuciB0ZWwuIG9waWVrdW5hJyk7XHJcbiAgICB0aGlzLmF1dG8gPSBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpO1xyXG4gICAgdGhpcy5iZ1NvdXJjZSA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2Jnc291cmNlJywgZmFsc2UpO1xyXG4gICAgdGhpcy5yYW5nZVRleHQgPSBcIkFVVE8gU1RPUCBQUlpZIFdBUlRPU0NJOiBcIiArIGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSkgKyBcIk1HL0RMXCI7XHJcbiAgICB0aGlzLnRyYWNlV3JpdGVyU2VydmljZS5zdWJzY3JpYmUoXHJcbiAgICAgICh7IG1lc3NhZ2UsIGRhdGUsIGNhdGVnb3J5LCBtZXNzYWdlVHlwZSB9KSA9PiB7XHJcbiAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0TG9ncyhkYXRlLCBtZXNzYWdlLCBtZXNzYWdlVHlwZSwgY2F0ZWdvcnkpO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gICAgdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDcoKS50aGVuKCgpID0+XHJcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMubnNVcmwyICsgXCJmZmZmZmZmZmYzMzMzMzMzZlwiKVxyXG4gICAgKTtcclxuICB9XHJcbiAgZ2V0QkdSYW5nZSgpe1xyXG4gICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICB0aXRsZTogXCJQb2RhaiB3YXJ0b8WbxIcgcHJ6eSBqYWtpZWogbWEgem9zdGHEhyB3ecWCxIVjem9uYSBwb21wYVwiLFxyXG4gICAgICBtZXNzYWdlOiBcIldhcnRvxZvEhyBncmFuaWN6bmEgdG86XCIsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiLFxyXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICBpbnB1dFR5cGU6IGRpYWxvZ3MuaW5wdXRUeXBlLm51bWJlclxyXG4gICAgfSkudGhlbihyID0+IHtcclxuICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgci5yZXN1bHQgKyBcIiwgQSBUTyBURUtTVDpcIiArIHIudGV4dCk7XHJcbiAgICAgIHRoaXMucmFuZ2UgPSBOdW1iZXIoci50ZXh0KTtcclxuICAgICAgaWYodGhpcy5yYW5nZSA8IDc1IHx8IHRoaXMucmFuZ2UgPiAxMTApe1xyXG4gZGlhbG9ncy5hbGVydCh7bWVzc2FnZTogXCJVV0FHQSBXQVJUT8WaQyBaIFBPWkEgWkFLUkVTVTogNzUgLSAxMTAgTUcvRExcIiwgb2tCdXR0b25UZXh0OiBcIk9LXCJ9KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoJ3JhbmdlJywgdGhpcy5yYW5nZSk7XHJcbiAgICAgICAgdGhpcy5yYW5nZVRleHQgPSBcIkFVVE8gU1RPUCBQUlpZIFdBUlRPxZpDSTogXCIgKyB0aGlzLnJhbmdlICsgXCJNRy9ETFwiO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn1cclxuICBzZXRQaG9uZU51bWJlcigpe1xyXG4gICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICB0aXRsZTogXCJQb2RhaiBuciB0ZWwuIG9waWVrdW5hXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiUG9kYWogbnVtZXIgdGVsZWZvbnUgeiBrdMOzcmVnbyBixJlkxIUgcHJ6eWptb3dhbmUga29tZW5keVwiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJBbnVsdWpcIixcclxuICAgICAgaW5wdXRUeXBlOiBkaWFsb2dzLmlucHV0VHlwZS5udW1iZXJcclxuICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiRGlhbG9nIGNsb3NlZCFcIiArIHIucmVzdWx0ICsgXCIsIEEgVE8gVEVLU1Q6XCIgKyByLnRleHQpO1xyXG4gICAgICBpZiAoci50ZXh0ID09PSAnJykge1xyXG4gICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZygncGhvbmVOJywgJ1BvZGFqIG5yIHRlbC4gb3BpZWt1bmEnKTtcclxuICAgICAgICB0aGlzLnBob25lTiA9ICdQb2RhaiBuciB0ZWwuIG9waWVrdW5hJztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihcclxuICAgICAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5TRU5EX1NNUywgXCJ6ZXp3b2xpYyBuYSBjenl0YW5pZSBTTVM/XCJcclxuICAgICAgICApLnRoZW4oKCkgPT4gUGVybWlzc2lvbnMucmVxdWVzdFBlcm1pc3Npb24oYW5kcm9pZC5NYW5pZmVzdC5wZXJtaXNzaW9uLlJFQURfU01TKSk7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdwaG9uZU4nLCByLnRleHQpO1xyXG4gICAgICAgIHRoaXMucGhvbmVOID0gJ1RlbDogJyArIHIudGV4dDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZW5kTG9ncygpIHtcclxuICAgIGNvbnN0IGRvY3VtZW50cyA9IGZzLnBhdGguam9pbihhbmRyb2lkLm9zLkVudmlyb25tZW50LmdldEV4dGVybmFsU3RvcmFnZURpcmVjdG9yeSgpLmdldEFic29sdXRlUGF0aCgpLnRvU3RyaW5nKCkpO1xyXG4gICAgY29uc3QgbXlGb2xkZXIgPSBmcy5Gb2xkZXIuZnJvbVBhdGgoZG9jdW1lbnRzKTtcclxuICAgIGNvbnN0IG15RmlsZSA9IG15Rm9sZGVyLmdldEZpbGUoXCJteS50eHRcIik7XHJcbiAgICBjb25zdCBhID0gUnVudGltZS5nZXRSdW50aW1lKCkuZXhlYygnbG9nY2F0IC12IHRpbWUgLWYgL3NkY2FyZC9teS50eHQgLWQnKTtcclxuICAgIGNvbnNvbGUubG9nKFwidG8gdGEgd2llbGtvc2MgcGxpa3U6IFwiICsgbXlGaWxlLnNpemUpO1xyXG4gICAgaWYgKG15RmlsZS5zaXplID4gNTAwMDAwMCApXHJcbiAgICB7XHJcbiAgICAgIG15RmlsZS5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB1ID0gc2V0SW50ZXJ2YWwoICgpID0+IHtcclxuICAgIGlmIChhLmlzQWxpdmUoKSA9PT0gZmFsc2Upe1xyXG4gICAgICBjbGVhckludGVydmFsKHUpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkNJT1NzXCIpO1xyXG4gICAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihcclxuICAgICAgICBhbmRyb2lkLk1hbmlmZXN0LnBlcm1pc3Npb24uV1JJVEVfRVhURVJOQUxfU1RPUkFHRSxcclxuICAgICAgKS50aGVuKCgpID0+XHJcbiAgICAgICAgY29tcG9zZSh7XHJcbiAgICAgICAgICBzdWJqZWN0OiBcIkRlYnVnIG1lZC1saW5rLXVpXCIsXHJcbiAgICAgICAgICBib2R5OiBcImFSZWR1Y2VkMlwiLFxyXG4gICAgICAgICAgdG86IFtcImpya2ZAbzIucGxcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0YWNobWVudHM6XHJcbiAgICAgICAgICAgICAgICAgICAgICBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW1lVHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBteUZpbGUucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWU6ICdteS50eHQnXHJcbiAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgIH0pXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIkJBTSBCQU1cIik7XHJcbiAgICB9XHJcbiAgICB9LCA1MDApO1xyXG4gIH1cclxuXHJcbiAgWmFwaXN6KCkge1xyXG4gICAgY29uc29sZS5sb2coXCJhYWFhYWFcIiArIHRoaXMubnNVcmwpO1xyXG4gICAgY29uc3Qgc2hhMSA9IHJlcXVpcmUoXCJzaGExXCIpO1xyXG4gICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0TlModGhpcy5uc1VybCwgc2hhMSh0aGlzLm5zS2V5KSwgdGhpcy5uc0tleSk7XHJcbiAgICBjb25zb2xlLmxvZyhcIk5TIFVSTDogXCIgKyB0aGlzLm5zVXJsICsgXCIgZGRkZGRkZGRkZGQgXCIgKyB0aGlzLm5zS2V5KTtcclxuICAgIHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQ2KCkudGhlbigoKSA9PlxyXG4gICAgICBjb25zb2xlLmxvZyh0aGlzLnNsb3dvICsgXCJhUlJSUlJSUlJSUlwiKVxyXG4gICAgKTtcclxuICAgIGlmIChcclxuICAgICAgdGhpcy5uc1VybC5zdWJzdHJpbmcoMCwgOCkudG9VcHBlckNhc2UoKSAhPT0gXCJIVFRQUzovL1wiIHx8XHJcbiAgICAgIHRoaXMubnNVcmwuc3Vic3RyaW5nKHRoaXMubnNVcmwubGVuZ3RoIC0gMSwgdGhpcy5uc1VybC5sZW5ndGgpID09PSBcIi9cIlxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuc2xvd28yID0gXCJaxYFZIEFEUkVTIFVSTCAhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISFcIjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc2xvd28yID0gXCJPSyEgXCI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIG9uQ2hlY2tlZENoYW5nZUF1dG8oYXJnczogRXZlbnREYXRhKSB7XHJcbiAgICBjb25zdCBteVN3aXRjaCA9IGFyZ3Mub2JqZWN0IGFzIFN3aXRjaDtcclxuICAgIGNvbnN0IGlzQ2hlY2tlZCA9IG15U3dpdGNoLmNoZWNrZWQ7IC8vIGJvb2xlYW5cclxuICAgIGlmIChpc0NoZWNrZWQgPT09IHRydWUpIHtcclxuICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJhdXRvXCIsIHRydWUpO1xyXG4gICAgICB0aGlzLmF1dG8gPSBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImF1dG9cIiwgZmFsc2UpO1xyXG4gICAgICB0aGlzLmF1dG8gPSBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJyk7XHJcbiAgICB9XHJcbiAgICB9XHJcbiAgb25DaGVja2VkQ2hhbmdlU291cmNlKGFyZ3M6IEV2ZW50RGF0YSkge1xyXG4gICAgY29uc3QgbXlTd2l0Y2ggPSBhcmdzLm9iamVjdCBhcyBTd2l0Y2g7XHJcbiAgICBjb25zdCBpc0NoZWNrZWQgPSBteVN3aXRjaC5jaGVja2VkOyAvLyBib29sZWFuXHJcbiAgICBpZiAoaXNDaGVja2VkID09PSB0cnVlKSB7XHJcbiAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJiZ3NvdXJjZVwiLCB0cnVlKTtcclxuICAgICAgdGhpcy5iZ1NvdXJjZSA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2Jnc291cmNlJyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImJnc291cmNlXCIsIGZhbHNlKTtcclxuICAgICAgdGhpcy5iZ1NvdXJjZSA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2Jnc291cmNlJyk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0NigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0TlNEYXRhKCkuc3Vic2NyaWJlKGcgPT4ge1xyXG4gICAgICAgIGcubWFwKGJvbCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhib2wuaHR0cC50b1N0cmluZygpICsgXCJKSkpKSkpKXCIgKyBib2wuc2VjcmV0LnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgdGhpcy5zbG93byA9XHJcbiAgICAgICAgICAgIHRoaXMuc2xvd28yICtcclxuICAgICAgICAgICAgXCIgIFwiICtcclxuICAgICAgICAgICAgYm9sLmh0dHAudG9TdHJpbmcoKSArXHJcbiAgICAgICAgICAgIFwiIFwiICtcclxuICAgICAgICAgICAgYm9sLnNlY3JldC50b1N0cmluZygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYXNcIiArIHRoaXMuc2xvd28pO1xyXG4gICAgICAgIHJlc29sdmUoKSwgcmVqZWN0KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0NygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0TlNEYXRhKCkuc3Vic2NyaWJlKGcgPT4ge1xyXG4gICAgICAgIGcubWFwKGJvbCA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYm9sLmh0dHAudG9TdHJpbmcoKSArIFwiNjY2NjY2NjY2NjZcIiArIGJvbC5zZWNyZXQudG9TdHJpbmcoKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHRoaXMubnNVcmwyID0gYm9sLmh0dHAudG9TdHJpbmcoKTtcclxuICAgICAgICAgIHRoaXMubnNLZXkyID0gYm9sLmhhc2gudG9TdHJpbmcoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImFzXCIgKyB0aGlzLm5zVXJsMik7XHJcbiAgICAgICAgcmVzb2x2ZSgpLCByZWplY3QoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgc2V0TlMoYXJnKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInNldHR0TlNcIik7XHJcbiAgICBjb25zb2xlLmxvZyhhcmcudGV4dCk7XHJcbiAgICB0aGlzLm5zVXJsID0gYXJnLnRleHQ7XHJcbiAgfVxyXG4gIHNldE5TdXJsKGFyZykge1xyXG4gICAgY29uc29sZS5sb2coXCJzZXR0dE5TVVVSUkxcIik7XHJcbiAgICBjb25zb2xlLmxvZyhhcmcudGV4dCk7XHJcbiAgICB0aGlzLm5zS2V5ID0gYXJnLnRleHQ7XHJcbiAgfVxyXG4gIGdldE5TRGF0YSgpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8eyBodHRwOiBzdHJpbmc7IHNlY3JldDogc3RyaW5nOyBoYXNoOiBzdHJpbmcgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5OU2NvbmYoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIGh0dHA6IGFbMF0sXHJcbiAgICAgICAgICBzZWNyZXQ6IGFbMV0sXHJcbiAgICAgICAgICBoYXNoOiBhWzJdXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuIl19