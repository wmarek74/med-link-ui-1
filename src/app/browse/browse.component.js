"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var Permissions = require("nativescript-permissions");
var data_facade_service_1 = require("~/app/shared/data-facade.service");
var widget_facade_1 = require("~/app/shared/widget-facade");
var foreground_facade_service_1 = require("~/app/shared/foreground-facade.service");
var pump_bluetooth_api_service_1 = require("~/app/shared/pump-bluetooth-api.service");
var raw_data_parse_service_1 = require("~/app/shared/raw-data-parse.service");
var database_service_1 = require("~/app/shared/database.service");
var appSettings = require("application-settings");
var dialogs = require("tns-core-modules/ui/dialogs");
var BrowseComponent = /** @class */ (function () {
    function BrowseComponent(widgetFacadeService, zone, rawDataParse, fa, databaseService, foregroundUtilService, pumpBluetoothApiService) {
        this.widgetFacadeService = widgetFacadeService;
        this.zone = zone;
        this.rawDataParse = rawDataParse;
        this.fa = fa;
        this.databaseService = databaseService;
        this.foregroundUtilService = foregroundUtilService;
        this.pumpBluetoothApiService = pumpBluetoothApiService;
        this.text = '';
        this.isBusy = appSettings.getBoolean("isBusy", false);
        this.output = '';
        this.items = [];
        this.bool = false;
        this.isCompleted = appSettings.getBoolean("isCompleted", false);
        this.bool2 = false;
        this.color = '#3d5afe';
    }
    BrowseComponent.prototype.saveUuid = function (arg) {
        this.uuid = arg.text.toString().split(',')[1];
        console.log("To jest zapisany UUID:" + this.uuid);
        this.databaseService.insertMAC(this.uuid);
        this.isCompleted = true;
        appSettings.setBoolean("isCompleted", true);
        //this.widgetFacadeService.updateWidget();
    };
    BrowseComponent.prototype.ngOnDestroy = function () {
        clearInterval(appSettings.getNumber('interv'));
    };
    BrowseComponent.prototype.addProfile = function () {
        var _this = this;
        dialogs.confirm({
            title: "Chcesz dodać lub usunąć profil użytkownia z pilota?",
            cancelButtonText: "Usuń",
            okButtonText: "Dodaj",
            neutralButtonText: "Anuluj"
        }).then(function (t) {
            if (t === true) {
                _this.addUser();
                appSettings.setBoolean("isBusy", true);
            }
            if (t === false) {
                _this.deleteUser();
                appSettings.setBoolean("isBusy", false);
            }
            else {
                console.log("anulowane wybieranie usera");
            }
        });
    };
    BrowseComponent.prototype.addBolus = function () {
        var _this = this;
        dialogs.action({
            title: "Podaj Bolus",
            message: "Wybierz rodzaj bolusa:",
            cancelButtonText: "Anuluj",
            actions: ["BOLUS ZWYKŁY", "Z KALKULATORA BOLUSA"],
        }).then(function (rc) {
            if (rc.toString().includes("ZWYKŁY")) {
                console.log("Dialog closed!" + rc + ", A TO TEKST1:");
                dialogs.prompt({
                    title: "Podaj Bolus",
                    message: "Podaj ilość jednostek:",
                    okButtonText: "OK",
                    cancelButtonText: "Anuluj",
                    inputType: dialogs.inputType.phone
                }).then(function (r) {
                    if (r.result === true && r.text.match(/(^\d{1}).(\d{1})$/)) {
                        appSettings.setBoolean("isBusy", true);
                        _this.fa.scanAndConnectBOL(r.text.replace(',', '.'))
                            .then(function () { return appSettings.setBoolean("isBusy", false); }, function () { return appSettings.setBoolean("isBusy", false); });
                    }
                    else {
                        var options = {
                            title: "Ups!",
                            message: "Należy podać bolus w formacie: cyfra.cyfra",
                            okButtonText: "OK"
                        };
                        alert(options);
                    }
                    console.log("Dialog closed!" + r.result + ", A TO TEKST2sdfsdfsdfsdfsdfsdfsdfsdfsd:" + r.text.replace(',', '.'));
                });
            }
            if (rc.toString().includes("KALKULATORA")) {
                console.log("Dialog closed!" + rc + ", A TO TEKST1:");
                _this.fa.getCalcfromLocalDb().subscribe(function (category) {
                    _this.categoryCheck = category.toString();
                    console.log("ten" + _this.categoryCheck + "napis");
                    _this.maxBolus = category[0].value;
                    _this.dateRefresh = category[0].dateString;
                });
                if (_this.categoryCheck !== '') {
                    _this.databaseService.getCalcisf().subscribe(function (a) { return _this.isf = a[0][3]; });
                    _this.databaseService.getCalcjnaww().subscribe(function (a) { return _this.tjnaww = a; });
                    _this.databaseService.getCalcStep().subscribe(function (a) { return _this.stepBol = a; });
                    _this.databaseService.getCalcBgRange().subscribe(function (a) { return _this.bgRange = a.toString(); });
                    _this.databaseService.getLastBg15().subscribe(function (bg) {
                        //bg.toString().split('-')[0];
                        console.log("Sugar: ", bg.toString().split(',')[0]);
                        _this.lastBg = bg.toString().split(',')[0];
                        _this.lastBgDate = bg.toString().split(',')[1];
                        if (_this.lastBg.length < 1 && _this.bgRange.length >= 1) {
                            console.log("shuga:" + _this.lastBg);
                            //srednia z bg range
                            _this.lastBg = ((Number(_this.bgRange.split('-')[0].trim()) + Number(_this.bgRange.split('-')[1].trim())) / 2).toString();
                            _this.lastBgDate = 'BRAK CUKRU Z OSTATNICH 15 MIN!';
                        }
                        else {
                            console.log("Brak infomracji o cukrze z 15 min i kalkulatorze bolusa");
                        }
                    });
                    dialogs.prompt({
                        title: "Podaj Bolus",
                        message: "UWAGA! KALKULATOR NIE UWZGLĘDNIA AKTYWNEJ INSULINY" + "\n\nPodaj ilość węglowodanów w gramach: ",
                        okButtonText: "OK",
                        cancelable: false,
                        cancelButtonText: "Anuluj",
                        inputType: dialogs.inputType.number
                    }).then(function (r) {
                        if (r.result === true && _this.maxBolus.length > 0) {
                            console.log(_this.bgRange.split('-')[0]);
                            _this.setBolVal = (Number(r.text) / 10 * Number(_this.tjnaww)) + (Number(_this.lastBg) - (Number(_this.bgRange.split('-')[0].trim()) + Number(_this.bgRange.split('-')[1].trim())) / 2) / Number(_this.isf);
                            _this.setBolValStep = Math.round(_this.setBolVal / Number(_this.stepBol)) * Number(_this.stepBol);
                            console.log("setBolValStep", Math.round(_this.setBolVal / Number(_this.stepBol)) * Number(_this.stepBol));
                            dialogs.prompt({
                                title: "Podaj Bolus",
                                message: "\nCukier: " + _this.lastBg + ' ' + _this.lastBgDate + "\nOdświeżenie: " + _this.dateRefresh.substring(3, 21) + "\nPrzelicznik WW: " + _this.tjnaww + "\nWspółczynnik wrażliwości: " + _this.isf + "\nZakres oczekiwany: " + _this.bgRange + "\nKrok Bolusa: " + _this.stepBol + "\nMax bolus: " + _this.maxBolus + "\nSugerowany bolus: " + _this.setBolVal.toFixed(1) + "\nSUGEROWANY BOLUS PO UWZGLĘDNIENIU 'KROKU BOLUSA': ",
                                okButtonText: "OK",
                                defaultText: _this.setBolValStep.toFixed(1).toString(),
                                cancelButtonText: "Anuluj",
                                inputType: dialogs.inputType.phone
                            }).then(function (rr) {
                                if (rr.result === true && rr.text.match(/(^\d{1}).(\d{1})$/) && Number(rr.text) <= Number(_this.maxBolus)) {
                                    appSettings.setBoolean("isBusy", true);
                                    _this.fa.scanAndConnectBOL(rr.text.replace(',', '.'))
                                        .then(function () { return appSettings.setBoolean("isBusy", false); }, function () { return appSettings.setBoolean("isBusy", false); });
                                }
                                else {
                                    var options = {
                                        title: "Ups!",
                                        message: "Należy podać bolus w formacie: cyfra.cyfra który jest mniejszy od max. bolus",
                                        okButtonText: "OK"
                                    };
                                    alert(options);
                                }
                                console.log("Dialog closed!" + r.result + ", A TO TEKST2sdfsdfsdfsdfsdfsdfsdfsdfsd:" + r.text.replace(',', '.'));
                            });
                        }
                    });
                }
                else {
                    var options = {
                        title: "Brak danych z kalkulatora bolusa",
                        message: "Należy z menu wybrać opcję 'Odśwież ustawienia kalkulatora bolusa'",
                        okButtonText: "OK"
                    };
                    alert(options);
                }
            }
        });
    };
    BrowseComponent.prototype.refreshCalc = function () {
        var _this = this;
        dialogs.confirm({
            title: "Zostaną pobrane dane do ustawienia kalkulatora bolusa",
            message: "Zostaną pobrane dane takie jak: zakres docelowy glikemii, współczynnik wrażliwości na insulinę, przeliczniki WW, Krok bolusa i maksymalny bolus",
            okButtonText: "OK",
        }).then(function () {
            appSettings.setBoolean("isBusy", true);
            _this.fa.getCalcData().then(function () { return appSettings.setBoolean("isBusy", false); }, function () { return appSettings.setBoolean("isBusy", false); });
        });
    };
    BrowseComponent.prototype.addUser = function () {
        var _this = this;
        this.pumpBluetoothApiService.scanAndConnect().then(function () { return _this.pumpBluetoothApiService.read2().subscribe(function () {
            return dialogs.prompt({
                title: "Podaj nr pompy",
                message: "Twój nr pompy to:",
                okButtonText: "OK",
                cancelButtonText: "Anuluj",
                inputType: dialogs.inputType.number
            }).then(function (r) {
                console.log("Dialog closed!" + r.result + ", A TO TEKST:" + r.text);
                _this.pumpBluetoothApiService.sendCommand3(r.text);
            }).then(function () { return _this.pumpBluetoothApiService.read2().subscribe(function () {
                return dialogs.prompt({
                    title: "IMIĘ I NAZWISKO",
                    message: "Podaj imię i nazwisko",
                    okButtonText: "OK",
                    cancelButtonText: "Anuluj",
                    inputType: dialogs.inputType.text
                }).then(function (rr) {
                    _this.pumpBluetoothApiService.sendCommand3(rr.text);
                    _this.zone.run(function () { return appSettings.setBoolean("isBusy", false); });
                });
            }); });
        }); });
    };
    BrowseComponent.prototype.onLongPress = function (args) {
        var _this = this;
        if (this.pumpStan === "ZAWIEŚ POMPĘ") {
            dialogs.action({
                title: "ZATRZYMAJ POMPĘ NA: ",
                cancelButtonText: "Anuluj",
                actions: ["10 MIN", "15 MIN", "20 MIN", "30 MIN", "60 MIN"]
            }).then(function (r) {
                if (r.toString() !== 'Anuluj') {
                    console.log("Evsent name: " + args.eventName + r.length + "asdasd    " + r.toString());
                    appSettings.setBoolean("isBusy", true);
                    appSettings.setString("pumpStan", "Proszę czekać...");
                    _this.fa.scanAndConnectStop().then(function () { return _this.zone.run(function () {
                        var date = new Date();
                        date.setMinutes(date.getMinutes() + parseInt(r.toString().substring(0, 2), 10));
                        _this.minuta = date.getMinutes().toString();
                        if (date.getMinutes() < 10) {
                            _this.minuta = '0' + _this.minuta;
                        }
                        _this.godzina = date.getHours().toString();
                        if (date.getHours() < 10) {
                            _this.godzina = '0' + _this.godzina;
                        }
                        var czas = _this.godzina + ":" + _this.minuta;
                        appSettings.setString('pumpStan', "WZNOWIENIE POMPY O " + czas);
                        _this.stopPeriodPump = setTimeout(function () { return _this.stopCommon(); }, 1000 * 60 * parseInt(r.toString().substring(0, 2), 10));
                        appSettings.setNumber('stopPeriodPump', _this.stopPeriodPump);
                        appSettings.setBoolean("isBusy", false);
                    }); }, function () {
                        _this.zone.run(function () {
                            appSettings.setBoolean("isBusy", false);
                            _this.pumpStan = "Sprawdź stan pompy. Coś poszło nie tak";
                        });
                    });
                }
            });
        }
        else {
            if (this.pumpStan.toString().includes("WZNOWIENIE")) {
                dialogs.confirm({
                    title: "Czy chcesz anulować późniejsze włączenie pompy?",
                    message: "Pompa musi zostać uruchomiona ręcznie",
                    okButtonText: "OK",
                    cancelButtonText: "Anuluj"
                }).then(function (r) {
                    if (r) {
                        console.log("AAAAAAAAAAAAAAAA");
                        clearTimeout(appSettings.getNumber('stopPeriodPump'));
                        appSettings.setString('pumpStan', 'WZNÓW POMPĘ');
                        appSettings.setBoolean("isBusy", false);
                    }
                });
            }
        }
    };
    BrowseComponent.prototype.deleteUser = function () {
        var _this = this;
        this.pumpBluetoothApiService.scanAndConnect().then(function () { return _this.pumpBluetoothApiService.read2().subscribe(function () {
            return dialogs.confirm({
                title: "USUWANIE PROFILU",
                message: "Czy na pewno chcesz usunąć profil użytkownika?",
                okButtonText: "OK",
                cancelButtonText: "Anuluj"
            }).then(function (r) {
                if (r) {
                    _this.pumpBluetoothApiService.sendCommand3("KASUJ");
                    //this.isBusy = false;
                }
            });
        }); });
    };
    BrowseComponent.prototype.onCheckedChange = function (args) {
        var _this = this;
        var mySwitch = args.object;
        var isChecked = mySwitch.checked; // boolean
        if (isChecked === true) {
            dialogs.confirm({
                title: "Oswiadczenie",
                message: "Przyjmuję do wiadomości i wyrażam zgodę, że:\n" +
                    "1) Produkt nie stanowi zatwierdzonego wyrobu medycznego, stanowi jedynie narzędzie\n" +
                    "badawcze i pomocnicze dla pacjentów z cukrzycą;\n" +
                    "2) udostępnienie i korzystanie z Produktu następuje wyłącznie w celach informacyjnych i\n" +
                    "szkoleniowych;\n" +
                    "3) Produkt jest dostarczany bez jakiejkolwiek gwarancji (wyrażonej ani domniemanej);\n" +
                    "4) oprogramowanie zawarte w Produkcie działa na licencji open source, a korzystanie z\n" +
                    "Produktu nie wymaga ponoszenia jakichkolwiek opłat lub wynagrodzenia, w tym na rzecz\n" +
                    "podmiotów uprawnionych do oprogramowania;\n" +
                    "5) oprogramowanie zawarte w Produkcie nie zostało zatwierdzone przez żadnego producenta;\n" +
                    "6) Produkt może nie działać nieprzerwanie, terminowo, bezpiecznie i bezbłędnie;\n" +
                    "7) Produkt może nie współdziałać z innymi oprogramowaniami lub innymi sprzętami;\n" +
                    "8) wyniki uzyskane z związku z korzystaniem Produktu mogą nie być dokładne i rzetelne;\n" +
                    "9) nie posiadam żadnych praw własności ani udziałów w Produkcie;\n" +
                    "10) będę korzystać z Produktu tylko i wyłącznie na moje własne ryzyko i własną\n" +
                    "odpowiedzialność;\n" +
                    "11) będę korzystać z Produktu tylko i wyłącznie do osobistego użytku;\n" +
                    "12) nie będę używać ani polegać na Produkcie przy podejmowaniu jakichkolwiek decyzji o\n" +
                    "charakterze medycznym, decyzji związanych z leczeniem, jak również nie będę używać\n" +
                    "Produktu jako substytutu dla profesjonalnej opieki medycznej;\n" +
                    "13) zobowiązuję się ponieść wszelkie koszty naprawy lub serwisu Produktu.\n" +
                    "Oświadczam, że nie będę dochodzić wobec twórców Produktu jakichkolwiek roszczeń z tytułu\n" +
                    "nieprawidłowego działania lub korzystania z Produktu, w tym w szczególności nie będę dochodzić\n" +
                    "roszczeń dotyczących szkód powstałych w wyniku:\n" +
                    "1) nieprawidłowego korzystania z Produktu;\n" +
                    "2) braku sprawności lub ograniczenia sprawności Produktu, błędów i uszkodzeń Produktu,\n" +
                    "opóźnień w jego działaniu;\n" +
                    "3) niestosowania się do zasad działania Produktu;\n" +
                    "4) niewłaściwego przechowywania Produktu;\n" +
                    "5) braku zabezpieczenia Produktu przed uszkodzeniami, zniszczeń Produktu;\n" +
                    "6) rozładowania się Produktu lub innych sprzętów z nim połączonych;\n" +
                    "7) problemów z innymi sprzętami połączonymi z Produktem;\n" +
                    "8) problemów komunikacyjnych pomiędzy Produktem a innymi sprzętami z nim połączonymi.",
                okButtonText: "Potwierdzam",
                cancelButtonText: "Anuluj"
            }).then(function (result) {
                if (result === true) {
                    _this.setPermissions();
                    _this.databaseService.insertStan(true);
                }
                else {
                    mySwitch.checked = false;
                    _this.databaseService.insertStan(false);
                }
            }, function () { return console.log("MAM CIE"); });
        }
        else {
            this.foregroundUtilService.stopForeground();
            this.databaseService.insertStan(false);
        }
    };
    BrowseComponent.prototype.changeColorButton = function () {
        if (this.pumpStan === "WZNÓW POMPĘ") {
            this.color = 'GREEN';
        }
        else {
            if (this.pumpStan === "ZAWIEŚ POMPĘ") {
                this.color = 'RED';
            }
            else {
                this.color = '#3d5afe';
            }
        }
    };
    BrowseComponent.prototype.stopCommon = function () {
        var _this = this;
        clearTimeout(appSettings.getNumber('stopPeriodPump'));
        appSettings.setBoolean("isBusy", true);
        appSettings.setString("pumpStan", "Proszę czekać...");
        this.fa.scanAndConnectStop().then(function () { return _this.zone.run(function () {
            _this.pumpStan = appSettings.getString("pumpStan", "ZMIEŃ STAN POMPY");
            appSettings.setBoolean("isBusy", false);
        }); }, function () {
            _this.zone.run(function () {
                appSettings.setBoolean("isBusy", false);
                _this.pumpStan = "Sprawdź stan pompy. Coś poszło nie tak";
            });
        });
    };
    BrowseComponent.prototype.stop = function () {
        var _this = this;
        dialogs.confirm({
            title: "Czy na pewno chcesz zmienić stan pompy?",
            okButtonText: "Tak",
            cancelButtonText: "Nie"
        }).then(function (t) {
            if (t === true) {
                _this.stopCommon();
            }
            else {
                appSettings.setBoolean("isBusy", false);
            }
        }).then(function () { return console.log("CIEKAWE MIESJCE !@EWDSFSRER"); });
    };
    BrowseComponent.prototype.scan = function () {
        var _this = this;
        //this.fa.getDataFromNightscout();
        this.bool = appSettings.getBoolean("someBoolean", false);
        appSettings.setBoolean("someBoolean", this.bool);
        Permissions.requestPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION).then(function () {
            return _this.pumpBluetoothApiService.scanAndConnect2().subscribe(function (a) {
                console.log("TO Jest Wynik skanowania: " + _this.pumpBluetoothApiService.targetBluDeviceUUID + a);
                _this.items = _this.pumpBluetoothApiService.targetBluDeviceUUID2;
            });
        });
    };
    BrowseComponent.prototype.setPermissions = function () {
        var _this = this;
        Permissions.requestPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION)
            .then(function () {
            return Permissions.requestPermission(android.Manifest.permission.BLUETOOTH);
        })
            .then(function () {
            return Permissions.requestPermission(android.Manifest.permission.BLUETOOTH_ADMIN);
        })
            .then(function () {
            return Permissions.requestPermission(android.Manifest.permission.WAKE_LOCK);
        })
            .then(function () { return Permissions.requestPermission(android.Manifest.permission.WRITE_SETTINGS); })
            .then(function () {
            _this.pumpBluetoothApiService.enable();
            try {
                _this.foregroundUtilService.startForeground();
            }
            catch (e) {
                console.error(e);
                _this.foregroundUtilService.stopForeground();
            }
        });
    };
    BrowseComponent.prototype.execSQL = function () {
        var _this = this;
        this.databaseService.execSQLSuccessMonitor.subscribe(function (wynik) {
            _this.pumpData = _this.fa.btData;
            console.log("%%%%%%%%%%%%%%%%%%%%%%           :" + _this.fa.btData);
            appSettings.setString("pumpData", _this.fa.btData);
            _this.foregroundUtilService.updateForeground();
            if (wynik.toString().endsWith('suspend') && !appSettings.getString('pumpStan', "ZMIEŃ STAN POMPY").toString().includes("WZNOWIENIE")) {
                _this.zone.run(function () {
                    appSettings.setString("pumpStan", "WZNÓW POMPĘ");
                    _this.pumpStan = appSettings.getString("pumpStan");
                    _this.changeColorButton();
                    console.log("ANO MAMY POMPE ZAWIESZONA: " + wynik.toString().endsWith('suspend') + _this.pumpStan);
                });
            }
            if (wynik.toString().endsWith('normal')) {
                _this.zone.run(function () {
                    appSettings.setString("pumpStan", "ZAWIEŚ POMPĘ");
                    _this.pumpStan = appSettings.getString("pumpStan");
                    _this.changeColorButton();
                    clearTimeout(appSettings.getNumber('stopPeriodPump'));
                    console.log("ANO MAMY POMPE URUCHOMIONA: " + wynik.toString().endsWith('normal') + _this.pumpStan);
                });
            }
        });
    };
    BrowseComponent.prototype.ngOnInit = function () {
        var _this = this;
        clearInterval(appSettings.getNumber(("interv")));
        this.interv = setInterval(function () {
            _this.uuid = appSettings.getString("counter");
            _this.pumpData = appSettings.getString("autostop", "") + appSettings.getString("pumpData", '');
            _this.pumpStan = appSettings.getString("pumpStan", "ZMIEŃ STAN POMPY");
            _this.isBusy = appSettings.getBoolean("isBusy");
            //console.log("551");
            _this.changeColorButton();
        }, 1000);
        appSettings.setNumber('interv', this.interv);
        this.databaseService.getStan().subscribe(function (wynik) {
            _this.bool2 = wynik.toString().toLowerCase() === 'true';
        });
        this.execSQL();
    };
    BrowseComponent = __decorate([
        core_1.Component({
            selector: 'Browse',
            moduleId: module.id,
            templateUrl: './browse.component.html'
        }),
        __metadata("design:paramtypes", [widget_facade_1.WidgetFacadeService,
            core_1.NgZone,
            raw_data_parse_service_1.RawDataService,
            data_facade_service_1.DataFacadeService,
            database_service_1.DatabaseService,
            foreground_facade_service_1.ForegroundFacadeService,
            pump_bluetooth_api_service_1.PumpBluetoothApiService])
    ], BrowseComponent);
    return BrowseComponent;
}());
exports.BrowseComponent = BrowseComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBcUU7QUFDckUsc0RBQXdEO0FBQ3hELHdFQUFxRTtBQUNyRSw0REFBaUU7QUFDakUsb0ZBQWlGO0FBQ2pGLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsa0VBQWdFO0FBQ2hFLGtEQUFvRDtBQUdwRCxxREFBdUQ7QUFTdkQ7SUErQkUseUJBQ1UsbUJBQXdDLEVBQ3hDLElBQVksRUFDWixZQUE0QixFQUM1QixFQUFxQixFQUNyQixlQUFnQyxFQUNoQyxxQkFBOEMsRUFDOUMsdUJBQWdEO1FBTmhELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7UUFDeEMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLGlCQUFZLEdBQVosWUFBWSxDQUFnQjtRQUM1QixPQUFFLEdBQUYsRUFBRSxDQUFtQjtRQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF5QjtRQUM5Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1FBM0IxRCxTQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1YsV0FBTSxHQUFZLFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFELFdBQU0sR0FBRyxFQUFFLENBQUM7UUFJWixVQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ1gsU0FBSSxHQUFZLEtBQUssQ0FBQztRQUl0QixnQkFBVyxHQUFZLFdBQVcsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLFVBQUssR0FBWSxLQUFLLENBQUM7UUFFdkIsVUFBSyxHQUFXLFNBQVMsQ0FBQztJQWUxQixDQUFDO0lBRUQsa0NBQVEsR0FBUixVQUFTLEdBQUc7UUFDVixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJ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c3Ryb3ksIE9uSW5pdCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XHJcbmltcG9ydCAqIGFzIFBlcm1pc3Npb25zIGZyb20gJ25hdGl2ZXNjcmlwdC1wZXJtaXNzaW9ucyc7XHJcbmltcG9ydCB7IERhdGFGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGEtZmFjYWRlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBXaWRnZXRGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL3dpZGdldC1mYWNhZGUnO1xyXG5pbXBvcnQgeyBGb3JlZ3JvdW5kRmFjYWRlU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9mb3JlZ3JvdW5kLWZhY2FkZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgUHVtcEJsdWV0b290aEFwaVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvcHVtcC1ibHVldG9vdGgtYXBpLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBSYXdEYXRhU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9yYXctZGF0YS1wYXJzZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRGF0YWJhc2VTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGFiYXNlLnNlcnZpY2UnO1xyXG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwiYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcclxuaW1wb3J0IHsgU3dpdGNoIH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvc3dpdGNoXCI7XHJcbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZVwiO1xyXG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcclxuaW1wb3J0IHsgR2VzdHVyZUV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2dlc3R1cmVzXCI7XHJcblxyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICdCcm93c2UnLFxyXG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXHJcbiAgdGVtcGxhdGVVcmw6ICcuL2Jyb3dzZS5jb21wb25lbnQuaHRtbCdcclxufSlcclxuZXhwb3J0IGNsYXNzIEJyb3dzZUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcclxuICBsYXN0QmdEYXRlOiBzdHJpbmc7XHJcbiAgc2V0Qm9sVmFsU3RlcDogbnVtYmVyO1xyXG4gIHNldEJvbFZhbDogbnVtYmVyO1xyXG4gIHN0ZXBCb2w6IHN0cmluZztcclxuICBiZ1JhbmdlOiBzdHJpbmc7XHJcbiAgaXNmOiBzdHJpbmc7XHJcbiAgdGpuYXd3OiBzdHJpbmc7XHJcbiAgbWF4Qm9sdXM6IHN0cmluZztcclxuICBsYXN0Qmc6IHN0cmluZztcclxuICBkYXRlUmVmcmVzaDogc3RyaW5nO1xyXG4gIHRleHQgPSAnJztcclxuICBpc0J1c3k6IGJvb2xlYW4gPSBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKTtcclxuICBvdXRwdXQgPSAnJztcclxuICB1dWlkOiBzdHJpbmc7XHJcbiAgcHVtcFN0YW46IHN0cmluZztcclxuICBwdW1wRGF0YTogc3RyaW5nO1xyXG4gIGl0ZW1zID0gW107XHJcbiAgYm9vbDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gIGludDA6IG51bWJlcjtcclxuICBpbnRlcnZhbDogbnVtYmVyO1xyXG4gIGNvdW50ZXI6IG51bWJlcjtcclxuICBpc0NvbXBsZXRlZDogYm9vbGVhbiA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oXCJpc0NvbXBsZXRlZFwiLCBmYWxzZSk7XHJcbiAgYm9vbDI6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBpbnRlcnY6IG51bWJlcjtcclxuICBjb2xvcjogc3RyaW5nID0gJyMzZDVhZmUnO1xyXG4gIHN0b3BQZXJpb2RQdW1wOiBudW1iZXI7XHJcbiAgbWludXRhOiBzdHJpbmc7XHJcbiAgZ29kemluYTogc3RyaW5nO1xyXG4gIGNhdGVnb3J5Q2hlY2s6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHdpZGdldEZhY2FkZVNlcnZpY2U6IFdpZGdldEZhY2FkZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZSxcclxuICAgIHByaXZhdGUgcmF3RGF0YVBhcnNlOiBSYXdEYXRhU2VydmljZSxcclxuICAgIHByaXZhdGUgZmE6IERhdGFGYWNhZGVTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBkYXRhYmFzZVNlcnZpY2U6IERhdGFiYXNlU2VydmljZSxcclxuICAgIHByaXZhdGUgZm9yZWdyb3VuZFV0aWxTZXJ2aWNlOiBGb3JlZ3JvdW5kRmFjYWRlU2VydmljZSxcclxuICAgIHByaXZhdGUgcHVtcEJsdWV0b290aEFwaVNlcnZpY2U6IFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLFxyXG4gICkge1xyXG4gIH1cclxuXHJcbiAgc2F2ZVV1aWQoYXJnKSB7XHJcbiAgICB0aGlzLnV1aWQgPSBhcmcudGV4dC50b1N0cmluZygpLnNwbGl0KCcsJylbMV07XHJcbiAgICBjb25zb2xlLmxvZyhcIlRvIGplc3QgemFwaXNhbnkgVVVJRDpcIiArIHRoaXMudXVpZCk7XHJcbiAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRNQUModGhpcy51dWlkKTtcclxuICAgIHRoaXMuaXNDb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQ29tcGxldGVkXCIsIHRydWUpO1xyXG4gICAgLy90aGlzLndpZGdldEZhY2FkZVNlcnZpY2UudXBkYXRlV2lkZ2V0KCk7XHJcbiAgfVxyXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xyXG4gICAgY2xlYXJJbnRlcnZhbChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ2ludGVydicpKTtcclxuICB9XHJcblxyXG4gIGFkZFByb2ZpbGUoKSB7XHJcbiAgICBkaWFsb2dzLmNvbmZpcm0oe1xyXG4gICAgICB0aXRsZTogXCJDaGNlc3ogZG9kYcSHIGx1YiB1c3VuxIXEhyBwcm9maWwgdcW8eXRrb3duaWEgeiBwaWxvdGE/XCIsXHJcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiVXN1xYRcIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIkRvZGFqXCIsXHJcbiAgICAgIG5ldXRyYWxCdXR0b25UZXh0OiBcIkFudWx1alwiXHJcbiAgICB9KS50aGVuKHQgPT4ge1xyXG4gICAgICAgIGlmICh0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICB0aGlzLmFkZFVzZXIoKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgdGhpcy5kZWxldGVVc2VyKCk7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJhbnVsb3dhbmUgd3liaWVyYW5pZSB1c2VyYVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIClcclxuICB9XHJcbiAgYWRkQm9sdXMoKSB7XHJcbiAgICBkaWFsb2dzLmFjdGlvbih7XHJcbiAgICAgIHRpdGxlOiBcIlBvZGFqIEJvbHVzXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiV3liaWVyeiByb2R6YWogYm9sdXNhOlwiLFxyXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICBhY3Rpb25zOiBbXCJCT0xVUyBaV1lLxYFZXCIsIFwiWiBLQUxLVUxBVE9SQSBCT0xVU0FcIl0sXHJcbiAgICB9KS50aGVuKHJjID0+IHtcclxuICAgICAgaWYgKHJjLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJaV1lLxYFZXCIpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgcmMgKyBcIiwgQSBUTyBURUtTVDE6XCIpO1xyXG4gICAgICAgIGRpYWxvZ3MucHJvbXB0KHtcclxuICAgICAgICAgIHRpdGxlOiBcIlBvZGFqIEJvbHVzXCIsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIlBvZGFqIGlsb8WbxIcgamVkbm9zdGVrOlwiLFxyXG4gICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICAgICAgaW5wdXRUeXBlOiBkaWFsb2dzLmlucHV0VHlwZS5waG9uZVxyXG4gICAgICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IHRydWUgJiYgci50ZXh0Lm1hdGNoKC8oXlxcZHsxfSkuKFxcZHsxfSkkLykpe1xyXG4gICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmZhLnNjYW5BbmRDb25uZWN0Qk9MKHIudGV4dC5yZXBsYWNlKCcsJywgJy4nKSlcclxuICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKSxcclxuICAgICAgICAgICAgICAgICgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgdGl0bGU6IFwiVXBzIVwiLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiTmFsZcW8eSBwb2RhxIcgYm9sdXMgdyBmb3JtYWNpZTogY3lmcmEuY3lmcmFcIixcclxuICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRGlhbG9nIGNsb3NlZCFcIiArIHIucmVzdWx0ICsgXCIsIEEgVE8gVEVLU1Qyc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Q6XCIgKyByLnRleHQucmVwbGFjZSgnLCcsICcuJykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyYy50b1N0cmluZygpLmluY2x1ZGVzKFwiS0FMS1VMQVRPUkFcIikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRpYWxvZyBjbG9zZWQhXCIgKyByYyArIFwiLCBBIFRPIFRFS1NUMTpcIik7XHJcbiAgICAgICAgdGhpcy5mYS5nZXRDYWxjZnJvbUxvY2FsRGIoKS5zdWJzY3JpYmUoY2F0ZWdvcnkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jYXRlZ29yeUNoZWNrID0gY2F0ZWdvcnkudG9TdHJpbmcoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidGVuXCIgKyB0aGlzLmNhdGVnb3J5Q2hlY2sgKyBcIm5hcGlzXCIpO1xyXG4gICAgICAgICAgdGhpcy5tYXhCb2x1cyA9IGNhdGVnb3J5WzBdLnZhbHVlO1xyXG4gICAgICAgICAgdGhpcy5kYXRlUmVmcmVzaCA9IGNhdGVnb3J5WzBdLmRhdGVTdHJpbmc7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHRoaXMuY2F0ZWdvcnlDaGVjayAhPT0gJycpIHtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0Q2FsY2lzZigpLnN1YnNjcmliZShhID0+IHRoaXMuaXNmID0gYVswXVszXSk7XHJcbiAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0Q2FsY2puYXd3KCkuc3Vic2NyaWJlKGEgPT4gdGhpcy50am5hd3cgPSBhKTtcclxuICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRDYWxjU3RlcCgpLnN1YnNjcmliZShhID0+IHRoaXMuc3RlcEJvbCA9IGEpO1xyXG4gICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldENhbGNCZ1JhbmdlKCkuc3Vic2NyaWJlKGEgPT4gdGhpcy5iZ1JhbmdlID0gYS50b1N0cmluZygpKTtcclxuICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRMYXN0QmcxNSgpLnN1YnNjcmliZShiZyA9PiB7XHJcbiAgICAgICAgICAvL2JnLnRvU3RyaW5nKCkuc3BsaXQoJy0nKVswXTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3VnYXI6IFwiICwgYmcudG9TdHJpbmcoKS5zcGxpdCgnLCcpWzBdKTtcclxuICAgICAgICAgIHRoaXMubGFzdEJnID0gYmcudG9TdHJpbmcoKS5zcGxpdCgnLCcpWzBdO1xyXG4gICAgICAgICAgdGhpcy5sYXN0QmdEYXRlID0gYmcudG9TdHJpbmcoKS5zcGxpdCgnLCcpWzFdO1xyXG4gICAgICAgICAgaWYgKHRoaXMubGFzdEJnLmxlbmd0aCA8IDEgJiYgdGhpcy5iZ1JhbmdlLmxlbmd0aCA+PSAxKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzaHVnYTpcIiArIHRoaXMubGFzdEJnKTtcclxuICAgICAgICAgICAgLy9zcmVkbmlhIHogYmcgcmFuZ2VcclxuICAgICAgICAgICAgdGhpcy5sYXN0QmcgPSAoKE51bWJlcih0aGlzLmJnUmFuZ2Uuc3BsaXQoJy0nKVswXS50cmltKCkpICsgTnVtYmVyKHRoaXMuYmdSYW5nZS5zcGxpdCgnLScpWzFdLnRyaW0oKSkpIC8gMikudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0QmdEYXRlID0gJ0JSQUsgQ1VLUlUgWiBPU1RBVE5JQ0ggMTUgTUlOISdcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkJyYWsgaW5mb21yYWNqaSBvIGN1a3J6ZSB6IDE1IG1pbiBpIGthbGt1bGF0b3J6ZSBib2x1c2FcIilcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICAgICAgdGl0bGU6IFwiUG9kYWogQm9sdXNcIixcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiVVdBR0EhIEtBTEtVTEFUT1IgTklFIFVXWkdMxJhETklBIEFLVFlXTkVKIElOU1VMSU5ZXCIgKyBcIlxcblxcblBvZGFqIGlsb8WbxIcgd8SZZ2xvd29kYW7Ds3cgdyBncmFtYWNoOiBcIixcclxuICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiLFxyXG4gICAgICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICAgICAgaW5wdXRUeXBlOiBkaWFsb2dzLmlucHV0VHlwZS5udW1iZXJcclxuICAgICAgICB9KS50aGVuKHIgPT4ge1xyXG4gICAgICAgICAgaWYoci5yZXN1bHQgPT09IHRydWUgJiYgdGhpcy5tYXhCb2x1cy5sZW5ndGggPiAwKXtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuYmdSYW5nZS5zcGxpdCgnLScpWzBdKTtcclxuICAgICAgICAgIHRoaXMuc2V0Qm9sVmFsID0gKE51bWJlcihyLnRleHQpIC8gMTAgKiBOdW1iZXIodGhpcy50am5hd3cpKSArIChOdW1iZXIodGhpcy5sYXN0QmcpIC0gKE51bWJlcih0aGlzLmJnUmFuZ2Uuc3BsaXQoJy0nKVswXS50cmltKCkpICsgTnVtYmVyKHRoaXMuYmdSYW5nZS5zcGxpdCgnLScpWzFdLnRyaW0oKSkpIC8gMikgLyBOdW1iZXIodGhpcy5pc2YpO1xyXG4gICAgICAgICAgdGhpcy5zZXRCb2xWYWxTdGVwID0gTWF0aC5yb3VuZCh0aGlzLnNldEJvbFZhbCAvIE51bWJlcih0aGlzLnN0ZXBCb2wpKSAqIE51bWJlcih0aGlzLnN0ZXBCb2wpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJzZXRCb2xWYWxTdGVwXCIgLCBNYXRoLnJvdW5kKHRoaXMuc2V0Qm9sVmFsIC8gTnVtYmVyKHRoaXMuc3RlcEJvbCkpICogTnVtYmVyKHRoaXMuc3RlcEJvbCkpO1xyXG4gICAgICAgICAgICBkaWFsb2dzLnByb21wdCh7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlBvZGFqIEJvbHVzXCIsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiXFxuQ3VraWVyOiBcIiArIHRoaXMubGFzdEJnICsgJyAnICsgdGhpcy5sYXN0QmdEYXRlICsgXCJcXG5PZMWbd2llxbxlbmllOiBcIiArIHRoaXMuZGF0ZVJlZnJlc2guc3Vic3RyaW5nKDMsIDIxKSArIFwiXFxuUHJ6ZWxpY3puaWsgV1c6IFwiICsgdGhpcy50am5hd3cgKyBcIlxcbldzcMOzxYJjenlubmlrIHdyYcW8bGl3b8WbY2k6IFwiICsgdGhpcy5pc2YgKyBcIlxcblpha3JlcyBvY3pla2l3YW55OiBcIiArIHRoaXMuYmdSYW5nZSArIFwiXFxuS3JvayBCb2x1c2E6IFwiICsgdGhpcy5zdGVwQm9sICsgXCJcXG5NYXggYm9sdXM6IFwiICsgdGhpcy5tYXhCb2x1cyArIFwiXFxuU3VnZXJvd2FueSBib2x1czogXCIgKyB0aGlzLnNldEJvbFZhbC50b0ZpeGVkKDEpICsgXCJcXG5TVUdFUk9XQU5ZIEJPTFVTIFBPIFVXWkdMxJhETklFTklVICdLUk9LVSBCT0xVU0EnOiBcIixcclxuICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgICAgIGRlZmF1bHRUZXh0OiB0aGlzLnNldEJvbFZhbFN0ZXAudG9GaXhlZCgxKS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICAgICAgICBpbnB1dFR5cGU6IGRpYWxvZ3MuaW5wdXRUeXBlLnBob25lXHJcbiAgICAgICAgICB9KS50aGVuKHJyID0+IHtcclxuICAgICAgICAgICAgaWYgKHJyLnJlc3VsdCA9PT0gdHJ1ZSAmJiByci50ZXh0Lm1hdGNoKC8oXlxcZHsxfSkuKFxcZHsxfSkkLykgJiYgTnVtYmVyKHJyLnRleHQpIDw9IE51bWJlcih0aGlzLm1heEJvbHVzKSkge1xyXG4gICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5mYS5zY2FuQW5kQ29ubmVjdEJPTChyci50ZXh0LnJlcGxhY2UoJywnLCAnLicpKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSksXHJcbiAgICAgICAgICAgICAgICAgICgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVXBzIVwiLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJOYWxlxbx5IHBvZGHEhyBib2x1cyB3IGZvcm1hY2llOiBjeWZyYS5jeWZyYSBrdMOzcnkgamVzdCBtbmllanN6eSBvZCBtYXguIGJvbHVzXCIsXHJcbiAgICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgci5yZXN1bHQgKyBcIiwgQSBUTyBURUtTVDJzZGZzZGZzZGZzZGZzZGZzZGZzZGZzZGZzZDpcIiArIHIudGV4dC5yZXBsYWNlKCcsJywgJy4nKSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkJyYWsgZGFueWNoIHoga2Fsa3VsYXRvcmEgYm9sdXNhXCIsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiTmFsZcW8eSB6IG1lbnUgd3licmHEhyBvcGNqxJkgJ09kxZt3aWXFvCB1c3Rhd2llbmlhIGthbGt1bGF0b3JhIGJvbHVzYSdcIixcclxuICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICB9fVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgcmVmcmVzaENhbGMoKSB7XHJcbiAgICBkaWFsb2dzLmNvbmZpcm0oe1xyXG4gICAgICB0aXRsZTogXCJab3N0YW7EhSBwb2JyYW5lIGRhbmUgZG8gdXN0YXdpZW5pYSBrYWxrdWxhdG9yYSBib2x1c2FcIixcclxuICAgICAgbWVzc2FnZTogXCJab3N0YW7EhSBwb2JyYW5lIGRhbmUgdGFraWUgamFrOiB6YWtyZXMgZG9jZWxvd3kgZ2xpa2VtaWksIHdzcMOzxYJjenlubmlrIHdyYcW8bGl3b8WbY2kgbmEgaW5zdWxpbsSZLCBwcnplbGljem5pa2kgV1csIEtyb2sgYm9sdXNhIGkgbWFrc3ltYWxueSBib2x1c1wiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgIH0pLnRoZW4oICgpID0+IHtcclxuICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCB0cnVlKTtcclxuICAgICAgdGhpcy5mYS5nZXRDYWxjRGF0YSgpLnRoZW4oKCkgPT4gYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSksICgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYWRkVXNlcigpIHtcclxuICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDIoKS5zdWJzY3JpYmUoKCkgPT5cclxuICAgICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICAgIHRpdGxlOiBcIlBvZGFqIG5yIHBvbXB5XCIsXHJcbiAgICAgICAgbWVzc2FnZTogXCJUd8OzaiBuciBwb21weSB0bzpcIixcclxuICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICAgIGlucHV0VHlwZTogZGlhbG9ncy5pbnB1dFR5cGUubnVtYmVyXHJcbiAgICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgci5yZXN1bHQgKyBcIiwgQSBUTyBURUtTVDpcIiArIHIudGV4dCk7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDMoci50ZXh0KTtcclxuICAgICAgfSkudGhlbigoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQyKCkuc3Vic2NyaWJlKCgpID0+XHJcbiAgICAgICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICAgICAgdGl0bGU6IFwiSU1JxJggSSBOQVpXSVNLT1wiLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJQb2RhaiBpbWnEmSBpIG5hendpc2tvXCIsXHJcbiAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgICAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiQW51bHVqXCIsXHJcbiAgICAgICAgICBpbnB1dFR5cGU6IGRpYWxvZ3MuaW5wdXRUeXBlLnRleHRcclxuICAgICAgICB9KS50aGVuKHJyID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDMocnIudGV4dCk7XHJcbiAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4gYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICkpKVxyXG4gICAgKSk7XHJcbiAgfVxyXG4gIG9uTG9uZ1ByZXNzKGFyZ3M6IEdlc3R1cmVFdmVudERhdGEpIHtcclxuICAgIGlmICh0aGlzLnB1bXBTdGFuID09PSBcIlpBV0lFxZogUE9NUMSYXCIpe1xyXG4gICAgICBkaWFsb2dzLmFjdGlvbih7XHJcbiAgICAgICAgdGl0bGU6IFwiWkFUUlpZTUFKIFBPTVDEmCBOQTogXCIsXHJcbiAgICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJBbnVsdWpcIixcclxuICAgICAgICBhY3Rpb25zOiBbXCIxMCBNSU5cIiwgXCIxNSBNSU5cIiwgXCIyMCBNSU5cIiwgXCIzMCBNSU5cIiwgXCI2MCBNSU5cIl1cclxuICAgICAgfSkudGhlbihyID0+IHtcclxuICAgICAgICBpZihyLnRvU3RyaW5nKCkgIT09ICdBbnVsdWonKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkV2c2VudCBuYW1lOiBcIiArIGFyZ3MuZXZlbnROYW1lICsgci5sZW5ndGggKyBcImFzZGFzZCAgICBcIiArIHIudG9TdHJpbmcoKSk7XHJcblxyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCB0cnVlKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcInB1bXBTdGFuXCIsIFwiUHJvc3rEmSBjemVrYcSHLi4uXCIpO1xyXG4gICAgICAgICAgdGhpcy5mYS5zY2FuQW5kQ29ubmVjdFN0b3AoKS50aGVuKCgpID0+IHRoaXMuem9uZS5ydW4oKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICAgIGRhdGUuc2V0TWludXRlcyhkYXRlLmdldE1pbnV0ZXMoKSArIHBhcnNlSW50KHIudG9TdHJpbmcoKS5zdWJzdHJpbmcoMCwgMiksIDEwKSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5taW51dGEgPSBkYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgIGlmKGRhdGUuZ2V0TWludXRlcygpIDwgMTApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW51dGEgPSAnMCcgKyB0aGlzLm1pbnV0YTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGhpcy5nb2R6aW5hID0gZGF0ZS5nZXRIb3VycygpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgaWYoZGF0ZS5nZXRIb3VycygpIDwgMTApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb2R6aW5hID0gJzAnICsgdGhpcy5nb2R6aW5hO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb25zdCBjemFzID0gdGhpcy5nb2R6aW5hICsgXCI6XCIgKyB0aGlzLm1pbnV0YTtcclxuICAgICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoJ3B1bXBTdGFuJywgXCJXWk5PV0lFTklFIFBPTVBZIE8gXCIgKyBjemFzKTtcclxuICAgICAgICAgICAgICB0aGlzLnN0b3BQZXJpb2RQdW1wID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnN0b3BDb21tb24oKSwgMTAwMCAqIDYwICogcGFyc2VJbnQoci50b1N0cmluZygpLnN1YnN0cmluZygwLCAyKSwgMTApKTtcclxuICAgICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoJ3N0b3BQZXJpb2RQdW1wJywgdGhpcy5zdG9wUGVyaW9kUHVtcCk7XHJcbiAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICksICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wU3RhbiA9IFwiU3ByYXdkxbogc3RhbiBwb21weS4gQ2/FmyBwb3N6xYJvIG5pZSB0YWtcIjtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7IGlmKHRoaXMucHVtcFN0YW4udG9TdHJpbmcoKS5pbmNsdWRlcyhcIldaTk9XSUVOSUVcIikpIHtcclxuICAgICAgZGlhbG9ncy5jb25maXJtKHtcclxuICAgICAgICB0aXRsZTogXCJDenkgY2hjZXN6IGFudWxvd2HEhyBww7PFum5pZWpzemUgd8WCxIVjemVuaWUgcG9tcHk/XCIsXHJcbiAgICAgICAgbWVzc2FnZTogXCJQb21wYSBtdXNpIHpvc3RhxIcgdXJ1Y2hvbWlvbmEgcsSZY3puaWVcIixcclxuICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiXHJcbiAgICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFBQUFBQUFBQUFBQUFBQUFcIik7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3N0b3BQZXJpb2RQdW1wJykpO1xyXG4gICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoJ3B1bXBTdGFuJywgJ1daTsOTVyBQT01QxJgnKTtcclxuICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRlbGV0ZVVzZXIoKSB7XHJcbiAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbigoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQyKCkuc3Vic2NyaWJlKCgpID0+XHJcbiAgICAgIGRpYWxvZ3MuY29uZmlybSh7XHJcbiAgICAgICAgdGl0bGU6IFwiVVNVV0FOSUUgUFJPRklMVVwiLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiQ3p5IG5hIHBld25vIGNoY2VzeiB1c3VuxIXEhyBwcm9maWwgdcW8eXRrb3duaWthP1wiLFxyXG4gICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiLFxyXG4gICAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiQW51bHVqXCJcclxuICAgICAgfSkudGhlbihyID0+IHtcclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDMoXCJLQVNVSlwiKTtcclxuICAgICAgICAgIC8vdGhpcy5pc0J1c3kgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICApKTtcclxuICB9XHJcblxyXG4gIG9uQ2hlY2tlZENoYW5nZShhcmdzOiBFdmVudERhdGEpIHtcclxuICAgIGNvbnN0IG15U3dpdGNoID0gYXJncy5vYmplY3QgYXMgU3dpdGNoO1xyXG4gICAgY29uc3QgaXNDaGVja2VkID0gbXlTd2l0Y2guY2hlY2tlZDsgLy8gYm9vbGVhblxyXG4gICAgaWYgKGlzQ2hlY2tlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICBkaWFsb2dzLmNvbmZpcm0oe1xyXG4gICAgICAgIHRpdGxlOiBcIk9zd2lhZGN6ZW5pZVwiLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiUHJ6eWptdWrEmSBkbyB3aWFkb21vxZtjaSBpIHd5cmHFvGFtIHpnb2TEmSwgxbxlOlxcblwiICtcclxuICAgICAgICAgIFwiMSkgUHJvZHVrdCBuaWUgc3Rhbm93aSB6YXR3aWVyZHpvbmVnbyB3eXJvYnUgbWVkeWN6bmVnbywgc3Rhbm93aSBqZWR5bmllIG5hcnrEmWR6aWVcXG5cIiArXHJcbiAgICAgICAgICBcImJhZGF3Y3plIGkgcG9tb2NuaWN6ZSBkbGEgcGFjamVudMOzdyB6IGN1a3J6eWPEhTtcXG5cIiArXHJcbiAgICAgICAgICBcIjIpIHVkb3N0xJlwbmllbmllIGkga29yenlzdGFuaWUgeiBQcm9kdWt0dSBuYXN0xJlwdWplIHd5xYLEhWN6bmllIHcgY2VsYWNoIGluZm9ybWFjeWpueWNoIGlcXG5cIiArXHJcbiAgICAgICAgICBcInN6a29sZW5pb3d5Y2g7XFxuXCIgK1xyXG4gICAgICAgICAgXCIzKSBQcm9kdWt0IGplc3QgZG9zdGFyY3phbnkgYmV6IGpha2llamtvbHdpZWsgZ3dhcmFuY2ppICh3eXJhxbxvbmVqIGFuaSBkb21uaWVtYW5laik7XFxuXCIgK1xyXG4gICAgICAgICAgXCI0KSBvcHJvZ3JhbW93YW5pZSB6YXdhcnRlIHcgUHJvZHVrY2llIGR6aWHFgmEgbmEgbGljZW5jamkgb3BlbiBzb3VyY2UsIGEga29yenlzdGFuaWUgelxcblwiICtcclxuICAgICAgICAgIFwiUHJvZHVrdHUgbmllIHd5bWFnYSBwb25vc3plbmlhIGpha2ljaGtvbHdpZWsgb3DFgmF0IGx1YiB3eW5hZ3JvZHplbmlhLCB3IHR5bSBuYSByemVjelxcblwiICtcclxuICAgICAgICAgIFwicG9kbWlvdMOzdyB1cHJhd25pb255Y2ggZG8gb3Byb2dyYW1vd2FuaWE7XFxuXCIgK1xyXG4gICAgICAgICAgXCI1KSBvcHJvZ3JhbW93YW5pZSB6YXdhcnRlIHcgUHJvZHVrY2llIG5pZSB6b3N0YcWCbyB6YXR3aWVyZHpvbmUgcHJ6ZXogxbxhZG5lZ28gcHJvZHVjZW50YTtcXG5cIiArXHJcbiAgICAgICAgICBcIjYpIFByb2R1a3QgbW/FvGUgbmllIGR6aWHFgmHEhyBuaWVwcnplcndhbmllLCB0ZXJtaW5vd28sIGJlenBpZWN6bmllIGkgYmV6YsWCxJlkbmllO1xcblwiICtcclxuICAgICAgICAgIFwiNykgUHJvZHVrdCBtb8W8ZSBuaWUgd3Nww7PFgmR6aWHFgmHEhyB6IGlubnltaSBvcHJvZ3JhbW93YW5pYW1pIGx1YiBpbm55bWkgc3ByesSZdGFtaTtcXG5cIiArXHJcbiAgICAgICAgICBcIjgpIHd5bmlraSB1enlza2FuZSB6IHp3acSFemt1IHoga29yenlzdGFuaWVtIFByb2R1a3R1IG1vZ8SFIG5pZSBiecSHIGRva8WCYWRuZSBpIHJ6ZXRlbG5lO1xcblwiICtcclxuICAgICAgICAgIFwiOSkgbmllIHBvc2lhZGFtIMW8YWRueWNoIHByYXcgd8WCYXNub8WbY2kgYW5pIHVkemlhxYLDs3cgdyBQcm9kdWtjaWU7XFxuXCIgK1xyXG4gICAgICAgICAgXCIxMCkgYsSZZMSZIGtvcnp5c3RhxIcgeiBQcm9kdWt0dSB0eWxrbyBpIHd5xYLEhWN6bmllIG5hIG1vamUgd8WCYXNuZSByeXp5a28gaSB3xYJhc27EhVxcblwiICtcclxuICAgICAgICAgIFwib2Rwb3dpZWR6aWFsbm/Fm8SHO1xcblwiICtcclxuICAgICAgICAgIFwiMTEpIGLEmWTEmSBrb3J6eXN0YcSHIHogUHJvZHVrdHUgdHlsa28gaSB3ecWCxIVjem5pZSBkbyBvc29iaXN0ZWdvIHXFvHl0a3U7XFxuXCIgK1xyXG4gICAgICAgICAgXCIxMikgbmllIGLEmWTEmSB1xbx5d2HEhyBhbmkgcG9sZWdhxIcgbmEgUHJvZHVrY2llIHByenkgcG9kZWptb3dhbml1IGpha2ljaGtvbHdpZWsgZGVjeXpqaSBvXFxuXCIgK1xyXG4gICAgICAgICAgXCJjaGFyYWt0ZXJ6ZSBtZWR5Y3pueW0sIGRlY3l6amkgendpxIV6YW55Y2ggeiBsZWN6ZW5pZW0sIGphayByw7N3bmllxbwgbmllIGLEmWTEmSB1xbx5d2HEh1xcblwiICtcclxuICAgICAgICAgIFwiUHJvZHVrdHUgamFrbyBzdWJzdHl0dXR1IGRsYSBwcm9mZXNqb25hbG5laiBvcGlla2kgbWVkeWN6bmVqO1xcblwiICtcclxuICAgICAgICAgIFwiMTMpIHpvYm93acSFenVqxJkgc2nEmSBwb25pZcWbxIcgd3N6ZWxraWUga29zenR5IG5hcHJhd3kgbHViIHNlcndpc3UgUHJvZHVrdHUuXFxuXCIgK1xyXG4gICAgICAgICAgXCJPxZt3aWFkY3phbSwgxbxlIG5pZSBixJlkxJkgZG9jaG9kemnEhyB3b2JlYyB0d8OzcmPDs3cgUHJvZHVrdHUgamFraWNoa29sd2llayByb3N6Y3plxYQgeiB0eXR1xYJ1XFxuXCIgK1xyXG4gICAgICAgICAgXCJuaWVwcmF3aWTFgm93ZWdvIGR6aWHFgmFuaWEgbHViIGtvcnp5c3RhbmlhIHogUHJvZHVrdHUsIHcgdHltIHcgc3pjemVnw7Nsbm/Fm2NpIG5pZSBixJlkxJkgZG9jaG9kemnEh1xcblwiICtcclxuICAgICAgICAgIFwicm9zemN6ZcWEIGRvdHljesSFY3ljaCBzemvDs2QgcG93c3RhxYJ5Y2ggdyB3eW5pa3U6XFxuXCIgK1xyXG4gICAgICAgICAgXCIxKSBuaWVwcmF3aWTFgm93ZWdvIGtvcnp5c3RhbmlhIHogUHJvZHVrdHU7XFxuXCIgK1xyXG4gICAgICAgICAgXCIyKSBicmFrdSBzcHJhd25vxZtjaSBsdWIgb2dyYW5pY3plbmlhIHNwcmF3bm/Fm2NpIFByb2R1a3R1LCBixYLEmWTDs3cgaSB1c3prb2R6ZcWEIFByb2R1a3R1LFxcblwiICtcclxuICAgICAgICAgIFwib3DDs8W6bmllxYQgdyBqZWdvIGR6aWHFgmFuaXU7XFxuXCIgK1xyXG4gICAgICAgICAgXCIzKSBuaWVzdG9zb3dhbmlhIHNpxJkgZG8gemFzYWQgZHppYcWCYW5pYSBQcm9kdWt0dTtcXG5cIiArXHJcbiAgICAgICAgICBcIjQpIG5pZXfFgmHFm2Npd2VnbyBwcnplY2hvd3l3YW5pYSBQcm9kdWt0dTtcXG5cIiArXHJcbiAgICAgICAgICBcIjUpIGJyYWt1IHphYmV6cGllY3plbmlhIFByb2R1a3R1IHByemVkIHVzemtvZHplbmlhbWksIHpuaXN6Y3plxYQgUHJvZHVrdHU7XFxuXCIgK1xyXG4gICAgICAgICAgXCI2KSByb3rFgmFkb3dhbmlhIHNpxJkgUHJvZHVrdHUgbHViIGlubnljaCBzcHJ6xJl0w7N3IHogbmltIHBvxYLEhWN6b255Y2g7XFxuXCIgK1xyXG4gICAgICAgICAgXCI3KSBwcm9ibGVtw7N3IHogaW5ueW1pIHNwcnrEmXRhbWkgcG/FgsSFY3pvbnltaSB6IFByb2R1a3RlbTtcXG5cIiArXHJcbiAgICAgICAgICBcIjgpIHByb2JsZW3Ds3cga29tdW5pa2FjeWpueWNoIHBvbWnEmWR6eSBQcm9kdWt0ZW0gYSBpbm55bWkgc3ByesSZdGFtaSB6IG5pbSBwb8WCxIVjem9ueW1pLlwiLFxyXG4gICAgICAgIG9rQnV0dG9uVGV4dDogXCJQb3R3aWVyZHphbVwiLFxyXG4gICAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiQW51bHVqXCJcclxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcclxuICAgICAgICAgIHRoaXMuc2V0UGVybWlzc2lvbnMoKTtcclxuICAgICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydFN0YW4odHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG15U3dpdGNoLmNoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydFN0YW4oZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgKCkgPT4gY29uc29sZS5sb2coXCJNQU0gQ0lFXCIpKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmZvcmVncm91bmRVdGlsU2VydmljZS5zdG9wRm9yZWdyb3VuZCgpO1xyXG4gICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRTdGFuKGZhbHNlKTtcclxuICAgIH1cclxuICB9XHJcbiAgY2hhbmdlQ29sb3JCdXR0b24oKXtcclxuICAgIGlmICh0aGlzLnB1bXBTdGFuID09PSBcIldaTsOTVyBQT01QxJhcIilcclxuICAgIHtcclxuICAgICAgdGhpcy5jb2xvciA9ICdHUkVFTidcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLnB1bXBTdGFuID09PSBcIlpBV0lFxZogUE9NUMSYXCIpIHtcclxuICAgICAgICB0aGlzLmNvbG9yID0gJ1JFRCdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmNvbG9yID0gJyMzZDVhZmUnXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgc3RvcENvbW1vbigpe1xyXG4gICAgY2xlYXJUaW1lb3V0KGFwcFNldHRpbmdzLmdldE51bWJlcignc3RvcFBlcmlvZFB1bXAnKSk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIHRydWUpO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJQcm9zesSZIGN6ZWthxIcuLi5cIik7XHJcbiAgICB0aGlzLmZhLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4gdGhpcy56b25lLnJ1bigoKSA9PlxyXG4gICAgICB7XHJcbiAgICAgICAgdGhpcy5wdW1wU3RhbiA9IGFwcFNldHRpbmdzLmdldFN0cmluZyhcInB1bXBTdGFuXCIsIFwiWk1JRcWDIFNUQU4gUE9NUFlcIik7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICksICgpID0+IHtcclxuICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5wdW1wU3RhbiA9IFwiU3ByYXdkxbogc3RhbiBwb21weS4gQ2/FmyBwb3N6xYJvIG5pZSB0YWtcIjtcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH1cclxuICBzdG9wKCkge1xyXG4gICAgZGlhbG9ncy5jb25maXJtKHtcclxuICAgICAgdGl0bGU6IFwiQ3p5IG5hIHBld25vIGNoY2VzeiB6bWllbmnEhyBzdGFuIHBvbXB5P1wiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiVGFrXCIsXHJcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiTmllXCJcclxuICAgIH0pLnRoZW4odCA9PiB7XHJcbiAgICAgIGlmICh0ID09PSB0cnVlKSB7XHJcbiAgICAgdGhpcy5zdG9wQ29tbW9uKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH0pLnRoZW4oKCkgPT4gY29uc29sZS5sb2coXCJDSUVLQVdFIE1JRVNKQ0UgIUBFV0RTRlNSRVJcIikpXHJcbiAgfVxyXG5cclxuICBzY2FuKCkge1xyXG4gICAgLy90aGlzLmZhLmdldERhdGFGcm9tTmlnaHRzY291dCgpO1xyXG4gICAgdGhpcy5ib29sID0gYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbihcInNvbWVCb29sZWFuXCIsIGZhbHNlKTtcclxuICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJzb21lQm9vbGVhblwiLCB0aGlzLmJvb2wpO1xyXG4gICAgUGVybWlzc2lvbnMucmVxdWVzdFBlcm1pc3Npb24oXHJcbiAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5BQ0NFU1NfQ09BUlNFX0xPQ0FUSU9OXHJcbiAgICApLnRoZW4oKCkgPT5cclxuICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdDIoKS5zdWJzY3JpYmUoYSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUTyBKZXN0IFd5bmlrIHNrYW5vd2FuaWE6IFwiICsgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS50YXJnZXRCbHVEZXZpY2VVVUlEICsgYSk7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UudGFyZ2V0Qmx1RGV2aWNlVVVJRDI7XHJcbiAgICAgIH0pKTtcclxuICB9XHJcbiAgc2V0UGVybWlzc2lvbnMoKSB7XHJcbiAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihcclxuICAgICAgYW5kcm9pZC5NYW5pZmVzdC5wZXJtaXNzaW9uLkFDQ0VTU19DT0FSU0VfTE9DQVRJT05cclxuICAgIClcclxuICAgICAgLnRoZW4oKCkgPT5cclxuICAgICAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihhbmRyb2lkLk1hbmlmZXN0LnBlcm1pc3Npb24uQkxVRVRPT1RIKVxyXG4gICAgICApXHJcbiAgICAgIC50aGVuKCgpID0+XHJcbiAgICAgICAgUGVybWlzc2lvbnMucmVxdWVzdFBlcm1pc3Npb24oXHJcbiAgICAgICAgICBhbmRyb2lkLk1hbmlmZXN0LnBlcm1pc3Npb24uQkxVRVRPT1RIX0FETUlOXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICAgIC50aGVuKCgpID0+XHJcbiAgICAgICAgUGVybWlzc2lvbnMucmVxdWVzdFBlcm1pc3Npb24oXHJcbiAgICAgICAgICBhbmRyb2lkLk1hbmlmZXN0LnBlcm1pc3Npb24uV0FLRV9MT0NLXHJcbiAgICAgICAgKVxyXG4gICAgICApXHJcbiAgICAgIC50aGVuKCgpID0+IFBlcm1pc3Npb25zLnJlcXVlc3RQZXJtaXNzaW9uKFxyXG4gICAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5XUklURV9TRVRUSU5HU1xyXG4gICAgICApKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5lbmFibGUoKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5mb3JlZ3JvdW5kVXRpbFNlcnZpY2Uuc3RhcnRGb3JlZ3JvdW5kKCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuXHJcbiAgICAgICAgICB0aGlzLmZvcmVncm91bmRVdGlsU2VydmljZS5zdG9wRm9yZWdyb3VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfVxyXG4gIGV4ZWNTUUwoKXtcclxuICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmV4ZWNTUUxTdWNjZXNzTW9uaXRvci5zdWJzY3JpYmUod3luaWsgPT4ge1xyXG4gICAgICB0aGlzLnB1bXBEYXRhID0gdGhpcy5mYS5idERhdGE7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSAgICAgICAgICAgOlwiICsgdGhpcy5mYS5idERhdGEpO1xyXG4gICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wRGF0YVwiLCB0aGlzLmZhLmJ0RGF0YSk7XHJcbiAgICAgIHRoaXMuZm9yZWdyb3VuZFV0aWxTZXJ2aWNlLnVwZGF0ZUZvcmVncm91bmQoKTtcclxuICAgICAgaWYgKHd5bmlrLnRvU3RyaW5nKCkuZW5kc1dpdGgoJ3N1c3BlbmQnKSAmJiAhYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdwdW1wU3RhbicsIFwiWk1JRcWDIFNUQU4gUE9NUFlcIikudG9TdHJpbmcoKS5pbmNsdWRlcyhcIldaTk9XSUVOSUVcIikpe1xyXG4gICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJXWk7Dk1cgUE9NUMSYXCIpO1xyXG4gICAgICAgICAgdGhpcy5wdW1wU3RhbiA9IGFwcFNldHRpbmdzLmdldFN0cmluZyhcInB1bXBTdGFuXCIpO1xyXG4gICAgICAgICAgdGhpcy5jaGFuZ2VDb2xvckJ1dHRvbigpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJBTk8gTUFNWSBQT01QRSBaQVdJRVNaT05BOiBcIiArIHd5bmlrLnRvU3RyaW5nKCkuZW5kc1dpdGgoJ3N1c3BlbmQnKSArIHRoaXMucHVtcFN0YW4pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfVxyXG4gICAgICBpZiAod3luaWsudG9TdHJpbmcoKS5lbmRzV2l0aCgnbm9ybWFsJykpXHJcbiAgICAgIHtcclxuICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiB7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpBV0lFxZogUE9NUMSYXCIpO1xyXG4gICAgICAgICAgdGhpcy5wdW1wU3RhbiA9IGFwcFNldHRpbmdzLmdldFN0cmluZyhcInB1bXBTdGFuXCIpO1xyXG4gICAgICAgICAgdGhpcy5jaGFuZ2VDb2xvckJ1dHRvbigpO1xyXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGFwcFNldHRpbmdzLmdldE51bWJlcignc3RvcFBlcmlvZFB1bXAnKSk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkFOTyBNQU1ZIFBPTVBFIFVSVUNIT01JT05BOiBcIiArIHd5bmlrLnRvU3RyaW5nKCkuZW5kc1dpdGgoJ25vcm1hbCcpICsgdGhpcy5wdW1wU3Rhbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgbmdPbkluaXQoKTogdm9pZCB7XHJcbiAgICBjbGVhckludGVydmFsKGFwcFNldHRpbmdzLmdldE51bWJlcigoXCJpbnRlcnZcIikpKTtcclxuICAgIHRoaXMuaW50ZXJ2ID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICB0aGlzLnV1aWQgPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoXCJjb3VudGVyXCIpO1xyXG4gICAgICB0aGlzLnB1bXBEYXRhID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKFwiYXV0b3N0b3BcIiwgXCJcIikgKyBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoXCJwdW1wRGF0YVwiLCAnJyk7XHJcbiAgICAgIHRoaXMucHVtcFN0YW4gPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpO1xyXG4gICAgICB0aGlzLmlzQnVzeSA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oXCJpc0J1c3lcIik7XHJcbiAgICAgIC8vY29uc29sZS5sb2coXCI1NTFcIik7XHJcbiAgICAgIHRoaXMuY2hhbmdlQ29sb3JCdXR0b24oKTtcclxuICAgIH0sIDEwMDApO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKCdpbnRlcnYnLCB0aGlzLmludGVydik7XHJcblxyXG5cclxuICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRTdGFuKCkuc3Vic2NyaWJlKHd5bmlrID0+IHtcclxuICAgICAgIHRoaXMuYm9vbDIgPSB3eW5pay50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgPT09ICd0cnVlJztcclxuICAgICB9KTtcclxuICAgIHRoaXMuZXhlY1NRTCgpO1xyXG4gIH1cclxufVxyXG4iXX0=