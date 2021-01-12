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
        this.rangeText = "AUTO STOP PRZY WARTOŚCI: " + appSettings.getNumber('range', 75);
        // Use the constructor to inject services.
    }
    SearchComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.phoneN = 'Tel: ' + appSettings.getString('phoneN', 'Podaj nr tel. opiekuna');
        this.auto = appSettings.getBoolean('auto', false);
        this.bgSource = appSettings.getBoolean('bgsource', false);
        this.rangeText = "AUTO STOP PRZY WARTOŚCI: " + appSettings.getNumber('range', 75) + "MG/DL";
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
                dialogs.alert({ message: "UWAGA WARTOŚĆ SPOZA ZAKRESU: 75 - 110 MG/DL", okButtonText: "OK" });
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
            message: "Podaj numer telefonu z którego będą przyjmowane komendy tj.: START, STOP, BOL X.X",
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
        Permissions.requestPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlYXJjaC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBcUU7QUFDckUseURBQTZDO0FBQzdDLHNEQUF3RDtBQUV4RCw0Q0FBcUM7QUFDckMsd0VBQXFFO0FBQ3JFLGtFQUFnRTtBQUNoRSwwRUFBdUU7QUFDdkUsSUFBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsaURBQW1EO0FBR25ELG1FQUFxRTtBQUNyRSxxREFBdUQ7QUFTdkQ7SUFpQkUseUJBQ1UsaUJBQW9DLEVBQ3BDLGVBQWdDLEVBQ2hDLGlCQUFvQyxFQUNwQyxrQkFBc0M7UUFIdEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNwQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1FBWGhELFlBQU8sR0FBRyxLQUFLLENBQUM7UUFLaEIsY0FBUyxHQUFXLDJCQUEyQixHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBUW5GLDBDQUEwQztJQUM1QyxDQUFDO0lBQ0Qsa0NBQVEsR0FBUjtRQUFBLGlCQWFDO1FBWkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLFNBQVMsR0FBRywyQkFBMkIsR0FBRyxXQUFX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QkFDVixNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWixJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNYLENBQUMsRUFKbUIsQ0FJbkIsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUF6TlUsZUFBZTtRQU4zQixnQkFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFdBQVcsRUFBRSx5QkFBeUI7WUFDdEMsU0FBUyxFQUFFLENBQUMseUJBQXlCLENBQUM7U0FDdkMsQ0FBQzt5Q0FtQjZCLHdCQUFpQjtZQUNuQixrQ0FBZTtZQUNiLHVDQUFpQjtZQUNoQix5Q0FBa0I7T0FyQnJDLGVBQWUsQ0EwTjNCO0lBQUQsc0JBQUM7Q0FBQSxBQTFORCxJQTBOQztBQTFOWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBjb21wb3NlIH0gZnJvbSAnbmF0aXZlc2NyaXB0LWVtYWlsJztcclxuaW1wb3J0ICogYXMgUGVybWlzc2lvbnMgZnJvbSAnbmF0aXZlc2NyaXB0LXBlcm1pc3Npb25zJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xyXG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XHJcbmltcG9ydCB7IERhdGFGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGEtZmFjYWRlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBEYXRhYmFzZVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvZGF0YWJhc2Uuc2VydmljZSc7XHJcbmltcG9ydCB7IFRyYWNlV3JpdGVyU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC90cmFjZS13cml0ZXIuc2VydmljZSc7XHJcbmltcG9ydCBSdW50aW1lID0gamF2YS5sYW5nLlJ1bnRpbWU7XHJcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2ZpbGUtc3lzdGVtXCI7XHJcbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZVwiO1xyXG5pbXBvcnQgeyBTd2l0Y2ggfSBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9zd2l0Y2hcIjtcclxuaW1wb3J0ICogYXMgYXBwU2V0dGluZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcclxuaW1wb3J0ICogYXMgZGlhbG9ncyBmcm9tIFwidG5zLWNvcmUtbW9kdWxlcy91aS9kaWFsb2dzXCI7XHJcbmltcG9ydCB7IHRvTnVtYmVycyB9IGZyb20gXCJAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL2RpYWdub3N0aWNzL3R5cGVzY3JpcHRfdmVyc2lvblwiO1xyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6IFwiU2VhcmNoXCIsXHJcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcclxuICB0ZW1wbGF0ZVVybDogXCIuL3NlYXJjaC5jb21wb25lbnQuaHRtbFwiLFxyXG4gIHN0eWxlVXJsczogW1wiLi9zZWFyY2guY29tcG9uZW50LnNjc3NcIl1cclxufSlcclxuZXhwb3J0IGNsYXNzIFNlYXJjaENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCB7XHJcbiAgc2xvd286IHN0cmluZztcclxuICBzbG93bzI6IHN0cmluZztcclxuICBuc1VybDogc3RyaW5nO1xyXG4gIG5zVXJsMjogc3RyaW5nO1xyXG4gIG5zS2V5OiBzdHJpbmc7XHJcbiAgcGhvbmVOOiBzdHJpbmc7XHJcbiAgLy9waG9uZTogc3RyaW5nID0gJyc7XHJcbiAgbnNLZXkyOiBzdHJpbmc7XHJcbiAgY2FyYnM6IHN0cmluZztcclxuICBwZW5kaW5nID0gZmFsc2U7XHJcbiAgYVJlZHVjZWQyOiBzdHJpbmc7XHJcbiAgYXV0bzogYm9vbGVhbjtcclxuICBiZ1NvdXJjZTogYm9vbGVhbjtcclxuICByYW5nZTogbnVtYmVyO1xyXG4gIHJhbmdlVGV4dDogc3RyaW5nID0gXCJBVVRPIFNUT1AgUFJaWSBXQVJUT8WaQ0k6IFwiICsgYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCdyYW5nZScsIDc1KTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcclxuICAgIHByaXZhdGUgZGF0YWJhc2VTZXJ2aWNlOiBEYXRhYmFzZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIGRhdGFGYWNhZGVTZXJ2aWNlOiBEYXRhRmFjYWRlU2VydmljZSxcclxuICAgIHByaXZhdGUgdHJhY2VXcml0ZXJTZXJ2aWNlOiBUcmFjZVdyaXRlclNlcnZpY2VcclxuICApIHtcclxuICAgIC8vIFVzZSB0aGUgY29uc3RydWN0b3IgdG8gaW5qZWN0IHNlcnZpY2VzLlxyXG4gIH1cclxuICBuZ09uSW5pdCgpOiB2b2lkIHtcclxuICAgIHRoaXMucGhvbmVOID0gJ1RlbDogJyArIGFwcFNldHRpbmdzLmdldFN0cmluZygncGhvbmVOJywgJ1BvZGFqIG5yIHRlbC4gb3BpZWt1bmEnKTtcclxuICAgIHRoaXMuYXV0byA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSk7XHJcbiAgICB0aGlzLmJnU291cmNlID0gYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYmdzb3VyY2UnLCBmYWxzZSk7XHJcbiAgICB0aGlzLnJhbmdlVGV4dCA9IFwiQVVUTyBTVE9QIFBSWlkgV0FSVE/FmkNJOiBcIiArIGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSkgKyBcIk1HL0RMXCI7XHJcbiAgICB0aGlzLnRyYWNlV3JpdGVyU2VydmljZS5zdWJzY3JpYmUoXHJcbiAgICAgICh7IG1lc3NhZ2UsIGRhdGUsIGNhdGVnb3J5LCBtZXNzYWdlVHlwZSB9KSA9PiB7XHJcbiAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0TG9ncyhkYXRlLCBtZXNzYWdlLCBtZXNzYWdlVHlwZSwgY2F0ZWdvcnkpO1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gICAgdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDcoKS50aGVuKCgpID0+XHJcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMubnNVcmwyICsgXCJmZmZmZmZmZmYzMzMzMzMzZlwiKVxyXG4gICAgKTtcclxuICB9XHJcbiAgZ2V0QkdSYW5nZSgpe1xyXG4gICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICB0aXRsZTogXCJQb2RhaiB3YXJ0b8WbxIcgcHJ6eSBqYWtpZWogbWEgem9zdGHEhyB3ecWCxIVjem9uYSBwb21wYVwiLFxyXG4gICAgICBtZXNzYWdlOiBcIldhcnRvxZvEhyBncmFuaWN6bmEgdG86XCIsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiLFxyXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICBpbnB1dFR5cGU6IGRpYWxvZ3MuaW5wdXRUeXBlLm51bWJlclxyXG4gICAgfSkudGhlbihyID0+IHtcclxuICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgci5yZXN1bHQgKyBcIiwgQSBUTyBURUtTVDpcIiArIHIudGV4dCk7XHJcbiAgICAgIHRoaXMucmFuZ2UgPSBOdW1iZXIoci50ZXh0KTtcclxuICAgICAgaWYodGhpcy5yYW5nZSA8IDc1IHx8IHRoaXMucmFuZ2UgPiAxMTApe1xyXG4gZGlhbG9ncy5hbGVydCh7bWVzc2FnZTogXCJVV0FHQSBXQVJUT8WaxIYgU1BPWkEgWkFLUkVTVTogNzUgLSAxMTAgTUcvRExcIiwgb2tCdXR0b25UZXh0OiBcIk9LXCJ9KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoJ3JhbmdlJywgdGhpcy5yYW5nZSk7XHJcbiAgICAgICAgdGhpcy5yYW5nZVRleHQgPSBcIkFVVE8gU1RPUCBQUlpZIFdBUlRPxZpDSTogXCIgKyB0aGlzLnJhbmdlICsgXCJNRy9ETFwiO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn1cclxuICBzZXRQaG9uZU51bWJlcigpe1xyXG4gICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICB0aXRsZTogXCJQb2RhaiBuciB0ZWwuIG9waWVrdW5hXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiUG9kYWogbnVtZXIgdGVsZWZvbnUgeiBrdMOzcmVnbyBixJlkxIUgcHJ6eWptb3dhbmUga29tZW5keSB0ai46IFNUQVJULCBTVE9QLCBCT0wgWC5YXCIsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiLFxyXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICBpbnB1dFR5cGU6IGRpYWxvZ3MuaW5wdXRUeXBlLm51bWJlclxyXG4gICAgfSkudGhlbihyID0+IHtcclxuICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgci5yZXN1bHQgKyBcIiwgQSBUTyBURUtTVDpcIiArIHIudGV4dCk7XHJcbiAgICAgIGlmIChyLnRleHQgPT09ICcnKSB7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdwaG9uZU4nLCAnUG9kYWogbnIgdGVsLiBvcGlla3VuYScpO1xyXG4gICAgICAgIHRoaXMucGhvbmVOID0gJ1BvZGFqIG5yIHRlbC4gb3BpZWt1bmEnO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIFBlcm1pc3Npb25zLnJlcXVlc3RQZXJtaXNzaW9uKFxyXG4gICAgICAgICAgYW5kcm9pZC5NYW5pZmVzdC5wZXJtaXNzaW9uLlNFTkRfU01TLCBcInplendvbGljIG5hIGN6eXRhbmllIFNNUz9cIlxyXG4gICAgICAgICkudGhlbigoKSA9PiBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihhbmRyb2lkLk1hbmlmZXN0LnBlcm1pc3Npb24uUkVBRF9TTVMpKTtcclxuICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoJ3Bob25lTicsIHIudGV4dCk7XHJcbiAgICAgICAgdGhpcy5waG9uZU4gPSAnVGVsOiAnICsgci50ZXh0O1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmRMb2dzKCkge1xyXG4gICAgY29uc3QgZG9jdW1lbnRzID0gZnMucGF0aC5qb2luKGFuZHJvaWQub3MuRW52aXJvbm1lbnQuZ2V0RXh0ZXJuYWxTdG9yYWdlRGlyZWN0b3J5KCkuZ2V0QWJzb2x1dGVQYXRoKCkudG9TdHJpbmcoKSk7XHJcbiAgICBjb25zdCBteUZvbGRlciA9IGZzLkZvbGRlci5mcm9tUGF0aChkb2N1bWVudHMpO1xyXG4gICAgUGVybWlzc2lvbnMucmVxdWVzdFBlcm1pc3Npb24oXHJcbiAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5XUklURV9FWFRFUk5BTF9TVE9SQUdFLFxyXG4gICAgKVxyXG4gICAgY29uc3QgbXlGaWxlID0gbXlGb2xkZXIuZ2V0RmlsZShcIm15LnR4dFwiKTtcclxuICAgIGNvbnN0IGEgPSBSdW50aW1lLmdldFJ1bnRpbWUoKS5leGVjKCdsb2djYXQgLXYgdGltZSAtZiAvc2RjYXJkL215LnR4dCAtZCcpO1xyXG4gICAgY29uc29sZS5sb2coXCJ0byB0YSB3aWVsa29zYyBwbGlrdTogXCIgKyBteUZpbGUuc2l6ZSk7XHJcbiAgICBpZiAobXlGaWxlLnNpemUgPiA1MDAwMDAwIClcclxuICAgIHtcclxuICAgICAgbXlGaWxlLnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHUgPSBzZXRJbnRlcnZhbCggKCkgPT4ge1xyXG4gICAgaWYgKGEuaXNBbGl2ZSgpID09PSBmYWxzZSl7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodSk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiQ0lPU3NcIik7XHJcbiAgICAgIFBlcm1pc3Npb25zLnJlcXVlc3RQZXJtaXNzaW9uKFxyXG4gICAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5XUklURV9FWFRFUk5BTF9TVE9SQUdFLFxyXG4gICAgICApLnRoZW4oKCkgPT5cclxuICAgICAgICBjb21wb3NlKHtcclxuICAgICAgICAgIHN1YmplY3Q6IFwiRGVidWcgbWVkLWxpbmstdWlcIixcclxuICAgICAgICAgIGJvZHk6IFwiYVJlZHVjZWQyXCIsXHJcbiAgICAgICAgICB0bzogW1wianJrZkBvMi5wbFwiXSxcclxuICAgICAgICAgICAgICAgICAgICBhdHRhY2htZW50czpcclxuICAgICAgICAgICAgICAgICAgICAgIFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbWVUeXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG15RmlsZS5wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZTogJ215LnR4dCdcclxuICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgfSlcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiQkFNIEJBTVwiKTtcclxuICAgIH1cclxuICAgIH0sIDUwMCk7XHJcbiAgfVxyXG5cclxuICBaYXBpc3ooKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImFhYWFhYVwiICsgdGhpcy5uc1VybCk7XHJcbiAgICBjb25zdCBzaGExID0gcmVxdWlyZShcInNoYTFcIik7XHJcbiAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnROUyh0aGlzLm5zVXJsLCBzaGExKHRoaXMubnNLZXkpLCB0aGlzLm5zS2V5KTtcclxuICAgIGNvbnNvbGUubG9nKFwiTlMgVVJMOiBcIiArIHRoaXMubnNVcmwgKyBcIiBkZGRkZGRkZGRkZCBcIiArIHRoaXMubnNLZXkpO1xyXG4gICAgdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDYoKS50aGVuKCgpID0+XHJcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuc2xvd28gKyBcImFSUlJSUlJSUlJSXCIpXHJcbiAgICApO1xyXG4gICAgaWYgKFxyXG4gICAgICB0aGlzLm5zVXJsLnN1YnN0cmluZygwLCA4KS50b1VwcGVyQ2FzZSgpICE9PSBcIkhUVFBTOi8vXCIgfHxcclxuICAgICAgdGhpcy5uc1VybC5zdWJzdHJpbmcodGhpcy5uc1VybC5sZW5ndGggLSAxLCB0aGlzLm5zVXJsLmxlbmd0aCkgPT09IFwiL1wiXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5zbG93bzIgPSBcIlrFgVkgQURSRVMgVVJMICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIVwiO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zbG93bzIgPSBcIk9LISBcIjtcclxuICAgIH1cclxuICB9XHJcbiAgb25DaGVja2VkQ2hhbmdlQXV0byhhcmdzOiBFdmVudERhdGEpIHtcclxuICAgIGNvbnN0IG15U3dpdGNoID0gYXJncy5vYmplY3QgYXMgU3dpdGNoO1xyXG4gICAgY29uc3QgaXNDaGVja2VkID0gbXlTd2l0Y2guY2hlY2tlZDsgLy8gYm9vbGVhblxyXG4gICAgaWYgKGlzQ2hlY2tlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImF1dG9cIiwgdHJ1ZSk7XHJcbiAgICAgIHRoaXMuYXV0byA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiYXV0b1wiLCBmYWxzZSk7XHJcbiAgICAgIHRoaXMuYXV0byA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nKTtcclxuICAgIH1cclxuICAgIH1cclxuICBvbkNoZWNrZWRDaGFuZ2VTb3VyY2UoYXJnczogRXZlbnREYXRhKSB7XHJcbiAgICBjb25zdCBteVN3aXRjaCA9IGFyZ3Mub2JqZWN0IGFzIFN3aXRjaDtcclxuICAgIGNvbnN0IGlzQ2hlY2tlZCA9IG15U3dpdGNoLmNoZWNrZWQ7IC8vIGJvb2xlYW5cclxuICAgIGlmIChpc0NoZWNrZWQgPT09IHRydWUpIHtcclxuICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImJnc291cmNlXCIsIHRydWUpO1xyXG4gICAgICB0aGlzLmJnU291cmNlID0gYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYmdzb3VyY2UnKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiYmdzb3VyY2VcIiwgZmFsc2UpO1xyXG4gICAgICB0aGlzLmJnU291cmNlID0gYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYmdzb3VyY2UnKTtcclxuICAgIH1cclxuICB9XHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQ2KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXROU0RhdGEoKS5zdWJzY3JpYmUoZyA9PiB7XHJcbiAgICAgICAgZy5tYXAoYm9sID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGJvbC5odHRwLnRvU3RyaW5nKCkgKyBcIkpKSkpKSkpcIiArIGJvbC5zZWNyZXQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICB0aGlzLnNsb3dvID1cclxuICAgICAgICAgICAgdGhpcy5zbG93bzIgK1xyXG4gICAgICAgICAgICBcIiAgXCIgK1xyXG4gICAgICAgICAgICBib2wuaHR0cC50b1N0cmluZygpICtcclxuICAgICAgICAgICAgXCIgXCIgK1xyXG4gICAgICAgICAgICBib2wuc2VjcmV0LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJhc1wiICsgdGhpcy5zbG93byk7XHJcbiAgICAgICAgcmVzb2x2ZSgpLCByZWplY3QoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQ3KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXROU0RhdGEoKS5zdWJzY3JpYmUoZyA9PiB7XHJcbiAgICAgICAgZy5tYXAoYm9sID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBib2wuaHR0cC50b1N0cmluZygpICsgXCI2NjY2NjY2NjY2NlwiICsgYm9sLnNlY3JldC50b1N0cmluZygpXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgdGhpcy5uc1VybDIgPSBib2wuaHR0cC50b1N0cmluZygpO1xyXG4gICAgICAgICAgdGhpcy5uc0tleTIgPSBib2wuaGFzaC50b1N0cmluZygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiYXNcIiArIHRoaXMubnNVcmwyKTtcclxuICAgICAgICByZXNvbHZlKCksIHJlamVjdCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBzZXROUyhhcmcpIHtcclxuICAgIGNvbnNvbGUubG9nKFwic2V0dHROU1wiKTtcclxuICAgIGNvbnNvbGUubG9nKGFyZy50ZXh0KTtcclxuICAgIHRoaXMubnNVcmwgPSBhcmcudGV4dDtcclxuICB9XHJcbiAgc2V0TlN1cmwoYXJnKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInNldHR0TlNVVVJSTFwiKTtcclxuICAgIGNvbnNvbGUubG9nKGFyZy50ZXh0KTtcclxuICAgIHRoaXMubnNLZXkgPSBhcmcudGV4dDtcclxuICB9XHJcbiAgZ2V0TlNEYXRhKCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7IGh0dHA6IHN0cmluZzsgc2VjcmV0OiBzdHJpbmc7IGhhc2g6IHN0cmluZyB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLk5TY29uZigpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgaHR0cDogYVswXSxcclxuICAgICAgICAgIHNlY3JldDogYVsxXSxcclxuICAgICAgICAgIGhhc2g6IGFbMl1cclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG4iXX0=