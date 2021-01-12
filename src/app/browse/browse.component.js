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
                    _this.databaseService.getLastBg152().subscribe(function (a) { return console.log('a to jest #77777777777777777777 : ' + a + new Date()); });
                    _this.databaseService.getLastBg15().subscribe(function (bg) {
                        //bg.toString().split('-')[0];
                        _this.lastBg = bg.toString().split(',')[0];
                        _this.lastBgDate = bg.toString().split(',')[1];
                        console.log("Sugar: ", bg.toString().split(',')[0] + ' a tooo : ' + _this.lastBg.length + 'aaaa ' + _this.bgRange.length + 'this.lastBgDate: ' + _this.lastBgDate);
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
            //console.log("%%%%%%%%%%%%%%%%%%%%%%           :" + this.fa.btData);
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
            //this.btConn = appSettings.getBoolean("btBoolean", false);
            if (appSettings.getBoolean("btBoolean", false)) {
                _this.btConn = 'Połączono z pilotem';
            }
            else {
                _this.btConn = 'Rozłączono z pilotem';
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZS5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBcUU7QUFDckUsc0RBQXdEO0FBQ3hELHdFQUFxRTtBQUNyRSw0REFBaUU7QUFDakUsb0ZBQWlGO0FBQ2pGLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsa0VBQWdFO0FBQ2hFLGtEQUFvRDtBQUdwRCxxREFBdUQ7QUFTdkQ7SUFnQ0UseUJBQ1UsbUJBQXdDLEVBQ3hDLElBQVksRUFDWixZQUE0QixFQUM1QixFQUFxQixFQUNyQixlQUFnQyxFQUNoQyxxQkFBOEMsRUFDOUMsdUJBQWdEO1FBTmhELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7UUFDeEMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLGlCQUFZLEdBQVosWUFBWSxDQUFnQjtRQUM1QixPQUFFLEdBQUYsRUFBRSxDQUFtQjtRQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF5QjtRQUM5Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1FBNUIxRCxTQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1YsV0FBTSxHQUFZLFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFELFdBQU0sR0FBRyxFQUFFLENBQUM7UUFJWixVQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ1gsU0FBSSxHQUFZLEtBQUssQ0FBQztRQUl0QixnQkFBVyxHQUFZLFdBQVcsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLFVBQUssR0FBWSxLQUFLLENBQUM7UUFFdkIsVUFBSyxHQUFXLFNBQVMsQ0FBQztJQWdCMUIsQ0FBQztJQUVELGtDQUFRLEdBQVIsVUFBUyxHQUFHO1FBQ1YsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFB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QUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDO3dCQUNQLElBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxJQUFJLElBQUksS0FBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDOzRCQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3hDLEtBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUN0TSxLQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs0QkFDOUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxLQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJB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UUFDekQsQ0FBQyxDQUFDLENBQUM7UUFDSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQWpmVSxlQUFlO1FBTDNCLGdCQUFTLENBQUM7WUFDVCxRQUFRLEVBQUUsUUFBUTtZQUNsQixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsV0FBVyxFQUFFLHlCQUF5QjtTQUN2QyxDQUFDO3lDQWtDK0IsbUNBQW1CO1lBQ2xDLGFBQU07WUFDRSx1Q0FBYztZQUN4Qix1Q0FBaUI7WUFDSixrQ0FBZTtZQUNULG1EQUF1QjtZQUNyQixvREFBdUI7T0F2Qy9DLGVBQWUsQ0FrZjNCO0lBQUQsc0JBQUM7Q0FBQSxBQWxmRCxJQWtmQztBQWxmWSwwQ0FBZSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgTmdab25lLCBPbkRlc3Ryb3ksIE9uSW5pdCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XHJcbmltcG9ydCAqIGFzIFBlcm1pc3Npb25zIGZyb20gJ25hdGl2ZXNjcmlwdC1wZXJtaXNzaW9ucyc7XHJcbmltcG9ydCB7IERhdGFGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGEtZmFjYWRlLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBXaWRnZXRGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL3dpZGdldC1mYWNhZGUnO1xyXG5pbXBvcnQgeyBGb3JlZ3JvdW5kRmFjYWRlU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9mb3JlZ3JvdW5kLWZhY2FkZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgUHVtcEJsdWV0b290aEFwaVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvcHVtcC1ibHVldG9vdGgtYXBpLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBSYXdEYXRhU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9yYXctZGF0YS1wYXJzZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRGF0YWJhc2VTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL2RhdGFiYXNlLnNlcnZpY2UnO1xyXG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwiYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcclxuaW1wb3J0IHsgU3dpdGNoIH0gZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvc3dpdGNoXCI7XHJcbmltcG9ydCB7IEV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZVwiO1xyXG5pbXBvcnQgKiBhcyBkaWFsb2dzIGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2RpYWxvZ3NcIjtcclxuaW1wb3J0IHsgR2VzdHVyZUV2ZW50RGF0YSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL3VpL2dlc3R1cmVzXCI7XHJcblxyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICdCcm93c2UnLFxyXG4gIG1vZHVsZUlkOiBtb2R1bGUuaWQsXHJcbiAgdGVtcGxhdGVVcmw6ICcuL2Jyb3dzZS5jb21wb25lbnQuaHRtbCdcclxufSlcclxuZXhwb3J0IGNsYXNzIEJyb3dzZUNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95IHtcclxuICBsYXN0QmdEYXRlOiBzdHJpbmc7XHJcbiAgc2V0Qm9sVmFsU3RlcDogbnVtYmVyO1xyXG4gIHNldEJvbFZhbDogbnVtYmVyO1xyXG4gIHN0ZXBCb2w6IHN0cmluZztcclxuICBiZ1JhbmdlOiBzdHJpbmc7XHJcbiAgaXNmOiBzdHJpbmc7XHJcbiAgdGpuYXd3OiBzdHJpbmc7XHJcbiAgbWF4Qm9sdXM6IHN0cmluZztcclxuICBsYXN0Qmc6IHN0cmluZztcclxuICBkYXRlUmVmcmVzaDogc3RyaW5nO1xyXG4gIHRleHQgPSAnJztcclxuICBpc0J1c3k6IGJvb2xlYW4gPSBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKTtcclxuICBvdXRwdXQgPSAnJztcclxuICB1dWlkOiBzdHJpbmc7XHJcbiAgcHVtcFN0YW46IHN0cmluZztcclxuICBwdW1wRGF0YTogc3RyaW5nO1xyXG4gIGl0ZW1zID0gW107XHJcbiAgYm9vbDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gIGludDA6IG51bWJlcjtcclxuICBpbnRlcnZhbDogbnVtYmVyO1xyXG4gIGNvdW50ZXI6IG51bWJlcjtcclxuICBpc0NvbXBsZXRlZDogYm9vbGVhbiA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oXCJpc0NvbXBsZXRlZFwiLCBmYWxzZSk7XHJcbiAgYm9vbDI6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBpbnRlcnY6IG51bWJlcjtcclxuICBjb2xvcjogc3RyaW5nID0gJyMzZDVhZmUnO1xyXG4gIHN0b3BQZXJpb2RQdW1wOiBudW1iZXI7XHJcbiAgbWludXRhOiBzdHJpbmc7XHJcbiAgZ29kemluYTogc3RyaW5nO1xyXG4gIGNhdGVnb3J5Q2hlY2s6IHN0cmluZztcclxuICBidENvbm46IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHdpZGdldEZhY2FkZVNlcnZpY2U6IFdpZGdldEZhY2FkZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZSxcclxuICAgIHByaXZhdGUgcmF3RGF0YVBhcnNlOiBSYXdEYXRhU2VydmljZSxcclxuICAgIHByaXZhdGUgZmE6IERhdGFGYWNhZGVTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBkYXRhYmFzZVNlcnZpY2U6IERhdGFiYXNlU2VydmljZSxcclxuICAgIHByaXZhdGUgZm9yZWdyb3VuZFV0aWxTZXJ2aWNlOiBGb3JlZ3JvdW5kRmFjYWRlU2VydmljZSxcclxuICAgIHByaXZhdGUgcHVtcEJsdWV0b290aEFwaVNlcnZpY2U6IFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLFxyXG4gICkge1xyXG4gIH1cclxuXHJcbiAgc2F2ZVV1aWQoYXJnKSB7XHJcbiAgICB0aGlzLnV1aWQgPSBhcmcudGV4dC50b1N0cmluZygpLnNwbGl0KCcsJylbMV07XHJcbiAgICBjb25zb2xlLmxvZyhcIlRvIGplc3QgemFwaXNhbnkgVVVJRDpcIiArIHRoaXMudXVpZCk7XHJcbiAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRNQUModGhpcy51dWlkKTtcclxuICAgIHRoaXMuaXNDb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQ29tcGxldGVkXCIsIHRydWUpO1xyXG4gICAgLy90aGlzLndpZGdldEZhY2FkZVNlcnZpY2UudXBkYXRlV2lkZ2V0KCk7XHJcbiAgfVxyXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xyXG4gICAgY2xlYXJJbnRlcnZhbChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ2ludGVydicpKTtcclxuICB9XHJcblxyXG4gIGFkZFByb2ZpbGUoKSB7XHJcbiAgICBkaWFsb2dzLmNvbmZpcm0oe1xyXG4gICAgICB0aXRsZTogXCJDaGNlc3ogZG9kYcSHIGx1YiB1c3VuxIXEhyBwcm9maWwgdcW8eXRrb3duaWEgeiBwaWxvdGE/XCIsXHJcbiAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiVXN1xYRcIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIkRvZGFqXCIsXHJcbiAgICAgIG5ldXRyYWxCdXR0b25UZXh0OiBcIkFudWx1alwiXHJcbiAgICB9KS50aGVuKHQgPT4ge1xyXG4gICAgICAgIGlmICh0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICB0aGlzLmFkZFVzZXIoKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgdGhpcy5kZWxldGVVc2VyKCk7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJhbnVsb3dhbmUgd3liaWVyYW5pZSB1c2VyYVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIClcclxuICB9XHJcbiAgYWRkQm9sdXMoKSB7XHJcbiAgICBkaWFsb2dzLmFjdGlvbih7XHJcbiAgICAgIHRpdGxlOiBcIlBvZGFqIEJvbHVzXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiV3liaWVyeiByb2R6YWogYm9sdXNhOlwiLFxyXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICBhY3Rpb25zOiBbXCJCT0xVUyBaV1lLxYFZXCIsIFwiWiBLQUxLVUxBVE9SQSBCT0xVU0FcIl0sXHJcbiAgICB9KS50aGVuKHJjID0+IHtcclxuICAgICAgaWYgKHJjLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJaV1lLxYFZXCIpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJEaWFsb2cgY2xvc2VkIVwiICsgcmMgKyBcIiwgQSBUTyBURUtTVDE6XCIpO1xyXG4gICAgICAgIGRpYWxvZ3MucHJvbXB0KHtcclxuICAgICAgICAgIHRpdGxlOiBcIlBvZGFqIEJvbHVzXCIsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIlBvZGFqIGlsb8WbxIcgamVkbm9zdGVrOlwiLFxyXG4gICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICAgICAgaW5wdXRUeXBlOiBkaWFsb2dzLmlucHV0VHlwZS5waG9uZVxyXG4gICAgICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IHRydWUgJiYgci50ZXh0Lm1hdGNoKC8oXlxcZHsxfSkuKFxcZHsxfSkkLykpe1xyXG4gICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmZhLnNjYW5BbmRDb25uZWN0Qk9MKHIudGV4dC5yZXBsYWNlKCcsJywgJy4nKSlcclxuICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKSxcclxuICAgICAgICAgICAgICAgICgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgdGl0bGU6IFwiVXBzIVwiLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiTmFsZcW8eSBwb2RhxIcgYm9sdXMgdyBmb3JtYWNpZTogY3lmcmEuY3lmcmFcIixcclxuICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRGlhbG9nIGNsb3NlZCFcIiArIHIucmVzdWx0ICsgXCIsIEEgVE8gVEVLU1Qyc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Q6XCIgKyByLnRleHQucmVwbGFjZSgnLCcsICcuJykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyYy50b1N0cmluZygpLmluY2x1ZGVzKFwiS0FMS1VMQVRPUkFcIikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkRpYWxvZyBjbG9zZWQhXCIgKyByYyArIFwiLCBBIFRPIFRFS1NUMTpcIik7XHJcbiAgICAgICAgdGhpcy5mYS5nZXRDYWxjZnJvbUxvY2FsRGIoKS5zdWJzY3JpYmUoY2F0ZWdvcnkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5jYXRlZ29yeUNoZWNrID0gY2F0ZWdvcnkudG9TdHJpbmcoKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidGVuXCIgKyB0aGlzLmNhdGVnb3J5Q2hlY2sgKyBcIm5hcGlzXCIpO1xyXG4gICAgICAgICAgdGhpcy5tYXhCb2x1cyA9IGNhdGVnb3J5WzBdLnZhbHVlO1xyXG4gICAgICAgICAgdGhpcy5kYXRlUmVmcmVzaCA9IGNhdGVnb3J5WzBdLmRhdGVTdHJpbmc7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHRoaXMuY2F0ZWdvcnlDaGVjayAhPT0gJycpIHtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0Q2FsY2lzZigpLnN1YnNjcmliZShhID0+IHRoaXMuaXNmID0gYVswXVszXSk7XHJcbiAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0Q2FsY2puYXd3KCkuc3Vic2NyaWJlKGEgPT4gdGhpcy50am5hd3cgPSBhKTtcclxuICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRDYWxjU3RlcCgpLnN1YnNjcmliZShhID0+IHRoaXMuc3RlcEJvbCA9IGEpO1xyXG4gICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldENhbGNCZ1JhbmdlKCkuc3Vic2NyaWJlKGEgPT4gdGhpcy5iZ1JhbmdlID0gYS50b1N0cmluZygpKTtcclxuICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRMYXN0QmcxNTIoKS5zdWJzY3JpYmUoYSA9PiBjb25zb2xlLmxvZygnYSB0byBqZXN0ICM3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3NyA6ICcgKyBhICsgbmV3IERhdGUoKSkpO1xyXG4gICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldExhc3RCZzE1KCkuc3Vic2NyaWJlKGJnID0+IHtcclxuICAgICAgICAgIC8vYmcudG9TdHJpbmcoKS5zcGxpdCgnLScpWzBdO1xyXG5cclxuICAgICAgICAgIHRoaXMubGFzdEJnID0gYmcudG9TdHJpbmcoKS5zcGxpdCgnLCcpWzBdO1xyXG4gICAgICAgICAgdGhpcy5sYXN0QmdEYXRlID0gYmcudG9TdHJpbmcoKS5zcGxpdCgnLCcpWzFdO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJTdWdhcjogXCIgLCBiZy50b1N0cmluZygpLnNwbGl0KCcsJylbMF0gKyAnIGEgdG9vbyA6ICcgKyB0aGlzLmxhc3RCZy5sZW5ndGggKyAnYWFhYSAnICsgdGhpcy5iZ1JhbmdlLmxlbmd0aCArICd0aGlzLmxhc3RCZ0RhdGU6ICcgKyB0aGlzLmxhc3RCZ0RhdGUgKTtcclxuICAgICAgICAgIGlmICh0aGlzLmxhc3RCZy5sZW5ndGggPCAxICYmIHRoaXMuYmdSYW5nZS5sZW5ndGggPj0gMSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2h1Z2E6XCIgKyB0aGlzLmxhc3RCZyk7XHJcbiAgICAgICAgICAgIC8vc3JlZG5pYSB6IGJnIHJhbmdlXHJcbiAgICAgICAgICAgIHRoaXMubGFzdEJnID0gKChOdW1iZXIodGhpcy5iZ1JhbmdlLnNwbGl0KCctJylbMF0udHJpbSgpKSArIE51bWJlcih0aGlzLmJnUmFuZ2Uuc3BsaXQoJy0nKVsxXS50cmltKCkpKSAvIDIpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdEJnRGF0ZSA9ICdCUkFLIENVS1JVIFogT1NUQVROSUNIIDE1IE1JTiEnXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCcmFrIGluZm9tcmFjamkgbyBjdWtyemUgeiAxNSBtaW4gaSBrYWxrdWxhdG9yemUgYm9sdXNhXCIpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRpYWxvZ3MucHJvbXB0KHtcclxuICAgICAgICAgIHRpdGxlOiBcIlBvZGFqIEJvbHVzXCIsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcIlVXQUdBISBLQUxLVUxBVE9SIE5JRSBVV1pHTMSYRE5JQSBBS1RZV05FSiBJTlNVTElOWVwiICsgXCJcXG5cXG5Qb2RhaiBpbG/Fm8SHIHfEmWdsb3dvZGFuw7N3IHcgZ3JhbWFjaDogXCIsXHJcbiAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgICAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJBbnVsdWpcIixcclxuICAgICAgICAgIGlucHV0VHlwZTogZGlhbG9ncy5pbnB1dFR5cGUubnVtYmVyXHJcbiAgICAgICAgfSkudGhlbihyID0+IHtcclxuICAgICAgICAgIGlmKHIucmVzdWx0ID09PSB0cnVlICYmIHRoaXMubWF4Qm9sdXMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmJnUmFuZ2Uuc3BsaXQoJy0nKVswXSk7XHJcbiAgICAgICAgICB0aGlzLnNldEJvbFZhbCA9IChOdW1iZXIoci50ZXh0KSAvIDEwICogTnVtYmVyKHRoaXMudGpuYXd3KSkgKyAoTnVtYmVyKHRoaXMubGFzdEJnKSAtIChOdW1iZXIodGhpcy5iZ1JhbmdlLnNwbGl0KCctJylbMF0udHJpbSgpKSArIE51bWJlcih0aGlzLmJnUmFuZ2Uuc3BsaXQoJy0nKVsxXS50cmltKCkpKSAvIDIpIC8gTnVtYmVyKHRoaXMuaXNmKTtcclxuICAgICAgICAgIHRoaXMuc2V0Qm9sVmFsU3RlcCA9IE1hdGgucm91bmQodGhpcy5zZXRCb2xWYWwgLyBOdW1iZXIodGhpcy5zdGVwQm9sKSkgKiBOdW1iZXIodGhpcy5zdGVwQm9sKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwic2V0Qm9sVmFsU3RlcFwiICwgTWF0aC5yb3VuZCh0aGlzLnNldEJvbFZhbCAvIE51bWJlcih0aGlzLnN0ZXBCb2wpKSAqIE51bWJlcih0aGlzLnN0ZXBCb2wpKTtcclxuICAgICAgICAgICAgZGlhbG9ncy5wcm9tcHQoe1xyXG4gICAgICAgICAgICB0aXRsZTogXCJQb2RhaiBCb2x1c1wiLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIlxcbkN1a2llcjogXCIgKyB0aGlzLmxhc3RCZyArICcgJyArIHRoaXMubGFzdEJnRGF0ZSArIFwiXFxuT2TFm3dpZcW8ZW5pZTogXCIgKyB0aGlzLmRhdGVSZWZyZXNoLnN1YnN0cmluZygzLCAyMSkgKyBcIlxcblByemVsaWN6bmlrIFdXOiBcIiArIHRoaXMudGpuYXd3ICsgXCJcXG5Xc3DDs8WCY3p5bm5payB3cmHFvGxpd2/Fm2NpOiBcIiArIHRoaXMuaXNmICsgXCJcXG5aYWtyZXMgb2N6ZWtpd2FueTogXCIgKyB0aGlzLmJnUmFuZ2UgKyBcIlxcbktyb2sgQm9sdXNhOiBcIiArIHRoaXMuc3RlcEJvbCArIFwiXFxuTWF4IGJvbHVzOiBcIiArIHRoaXMubWF4Qm9sdXMgKyBcIlxcblN1Z2Vyb3dhbnkgYm9sdXM6IFwiICsgdGhpcy5zZXRCb2xWYWwudG9GaXhlZCgxKSArIFwiXFxuU1VHRVJPV0FOWSBCT0xVUyBQTyBVV1pHTMSYRE5JRU5JVSAnS1JPS1UgQk9MVVNBJzogXCIsXHJcbiAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiLFxyXG4gICAgICAgICAgICBkZWZhdWx0VGV4dDogdGhpcy5zZXRCb2xWYWxTdGVwLnRvRml4ZWQoMSkudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJBbnVsdWpcIixcclxuICAgICAgICAgICAgaW5wdXRUeXBlOiBkaWFsb2dzLmlucHV0VHlwZS5waG9uZVxyXG4gICAgICAgICAgfSkudGhlbihyciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyci5yZXN1bHQgPT09IHRydWUgJiYgcnIudGV4dC5tYXRjaCgvKF5cXGR7MX0pLihcXGR7MX0pJC8pICYmIE51bWJlcihyci50ZXh0KSA8PSBOdW1iZXIodGhpcy5tYXhCb2x1cykpIHtcclxuICAgICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIHRydWUpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZmEuc2NhbkFuZENvbm5lY3RCT0wocnIudGV4dC5yZXBsYWNlKCcsJywgJy4nKSlcclxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpLFxyXG4gICAgICAgICAgICAgICAgICAoKSA9PiBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlVwcyFcIixcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiTmFsZcW8eSBwb2RhxIcgYm9sdXMgdyBmb3JtYWNpZTogY3lmcmEuY3lmcmEga3TDs3J5IGplc3QgbW5pZWpzenkgb2QgbWF4LiBib2x1c1wiLFxyXG4gICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRGlhbG9nIGNsb3NlZCFcIiArIHIucmVzdWx0ICsgXCIsIEEgVE8gVEVLU1Qyc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Rmc2Q6XCIgKyByLnRleHQucmVwbGFjZSgnLCcsICcuJykpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJCcmFrIGRhbnljaCB6IGthbGt1bGF0b3JhIGJvbHVzYVwiLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIk5hbGXFvHkgeiBtZW51IHd5YnJhxIcgb3BjasSZICdPZMWbd2llxbwgdXN0YXdpZW5pYSBrYWxrdWxhdG9yYSBib2x1c2EnXCIsXHJcbiAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgfX1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcblxyXG4gIHJlZnJlc2hDYWxjKCkge1xyXG4gICAgZGlhbG9ncy5jb25maXJtKHtcclxuICAgICAgdGl0bGU6IFwiWm9zdGFuxIUgcG9icmFuZSBkYW5lIGRvIHVzdGF3aWVuaWEga2Fsa3VsYXRvcmEgYm9sdXNhXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiWm9zdGFuxIUgcG9icmFuZSBkYW5lIHRha2llIGphazogemFrcmVzIGRvY2Vsb3d5IGdsaWtlbWlpLCB3c3DDs8WCY3p5bm5payB3cmHFvGxpd2/Fm2NpIG5hIGluc3VsaW7EmSwgcHJ6ZWxpY3puaWtpIFdXLCBLcm9rIGJvbHVzYSBpIG1ha3N5bWFsbnkgYm9sdXNcIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICB9KS50aGVuKCAoKSA9PiB7XHJcbiAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgdHJ1ZSk7XHJcbiAgICAgIHRoaXMuZmEuZ2V0Q2FsY0RhdGEoKS50aGVuKCgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpLCAoKSA9PiBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwiaXNCdXN5XCIsIGZhbHNlKSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFkZFVzZXIoKSB7XHJcbiAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbigoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQyKCkuc3Vic2NyaWJlKCgpID0+XHJcbiAgICAgIGRpYWxvZ3MucHJvbXB0KHtcclxuICAgICAgICB0aXRsZTogXCJQb2RhaiBuciBwb21weVwiLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiVHfDs2ogbnIgcG9tcHkgdG86XCIsXHJcbiAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJBbnVsdWpcIixcclxuICAgICAgICBpbnB1dFR5cGU6IGRpYWxvZ3MuaW5wdXRUeXBlLm51bWJlclxyXG4gICAgICB9KS50aGVuKHIgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRGlhbG9nIGNsb3NlZCFcIiArIHIucmVzdWx0ICsgXCIsIEEgVE8gVEVLU1Q6XCIgKyByLnRleHQpO1xyXG4gICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQzKHIudGV4dCk7XHJcbiAgICAgIH0pLnRoZW4oKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMigpLnN1YnNjcmliZSgoKSA9PlxyXG4gICAgICAgIGRpYWxvZ3MucHJvbXB0KHtcclxuICAgICAgICAgIHRpdGxlOiBcIklNScSYIEkgTkFaV0lTS09cIixcclxuICAgICAgICAgIG1lc3NhZ2U6IFwiUG9kYWogaW1pxJkgaSBuYXp3aXNrb1wiLFxyXG4gICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiLFxyXG4gICAgICAgICAgaW5wdXRUeXBlOiBkaWFsb2dzLmlucHV0VHlwZS50ZXh0XHJcbiAgICAgICAgfSkudGhlbihyciA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQzKHJyLnRleHQpO1xyXG4gICAgICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApKSlcclxuICAgICkpO1xyXG4gIH1cclxuICBvbkxvbmdQcmVzcyhhcmdzOiBHZXN0dXJlRXZlbnREYXRhKSB7XHJcbiAgICBpZiAodGhpcy5wdW1wU3RhbiA9PT0gXCJaQVdJRcWaIFBPTVDEmFwiKXtcclxuICAgICAgZGlhbG9ncy5hY3Rpb24oe1xyXG4gICAgICAgIHRpdGxlOiBcIlpBVFJaWU1BSiBQT01QxJggTkE6IFwiLFxyXG4gICAgICAgIGNhbmNlbEJ1dHRvblRleHQ6IFwiQW51bHVqXCIsXHJcbiAgICAgICAgYWN0aW9uczogW1wiMTAgTUlOXCIsIFwiMTUgTUlOXCIsIFwiMjAgTUlOXCIsIFwiMzAgTUlOXCIsIFwiNjAgTUlOXCJdXHJcbiAgICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgICAgaWYoci50b1N0cmluZygpICE9PSAnQW51bHVqJykge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJFdnNlbnQgbmFtZTogXCIgKyBhcmdzLmV2ZW50TmFtZSArIHIubGVuZ3RoICsgXCJhc2Rhc2QgICAgXCIgKyByLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlByb3N6xJkgY3pla2HEhy4uLlwiKTtcclxuICAgICAgICAgIHRoaXMuZmEuc2NhbkFuZENvbm5lY3RTdG9wKCkudGhlbigoKSA9PiB0aGlzLnpvbmUucnVuKCgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgICBkYXRlLnNldE1pbnV0ZXMoZGF0ZS5nZXRNaW51dGVzKCkgKyBwYXJzZUludChyLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDAsIDIpLCAxMCkpO1xyXG4gICAgICAgICAgICAgIHRoaXMubWludXRhID0gZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICBpZihkYXRlLmdldE1pbnV0ZXMoKSA8IDEwKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubWludXRhID0gJzAnICsgdGhpcy5taW51dGE7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHRoaXMuZ29kemluYSA9IGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgIGlmKGRhdGUuZ2V0SG91cnMoKSA8IDEwKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ29kemluYSA9ICcwJyArIHRoaXMuZ29kemluYTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgY29uc3QgY3phcyA9IHRoaXMuZ29kemluYSArIFwiOlwiICsgdGhpcy5taW51dGE7XHJcbiAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdwdW1wU3RhbicsIFwiV1pOT1dJRU5JRSBQT01QWSBPIFwiICsgY3phcyk7XHJcbiAgICAgICAgICAgICAgdGhpcy5zdG9wUGVyaW9kUHVtcCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zdG9wQ29tbW9uKCksIDEwMDAgKiA2MCAqIHBhcnNlSW50KHIudG9TdHJpbmcoKS5zdWJzdHJpbmcoMCwgMiksIDEwKSk7XHJcbiAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKCdzdG9wUGVyaW9kUHVtcCcsIHRoaXMuc3RvcFBlcmlvZFB1bXApO1xyXG4gICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcFN0YW4gPSBcIlNwcmF3ZMW6IHN0YW4gcG9tcHkuIENvxZsgcG9zesWCbyBuaWUgdGFrXCI7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgeyBpZih0aGlzLnB1bXBTdGFuLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJXWk5PV0lFTklFXCIpKSB7XHJcbiAgICAgIGRpYWxvZ3MuY29uZmlybSh7XHJcbiAgICAgICAgdGl0bGU6IFwiQ3p5IGNoY2VzeiBhbnVsb3dhxIcgcMOzxbpuaWVqc3plIHfFgsSFY3plbmllIHBvbXB5P1wiLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiUG9tcGEgbXVzaSB6b3N0YcSHIHVydWNob21pb25hIHLEmWN6bmllXCIsXHJcbiAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgY2FuY2VsQnV0dG9uVGV4dDogXCJBbnVsdWpcIlxyXG4gICAgICB9KS50aGVuKHIgPT4ge1xyXG4gICAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBQUFBQUFBQUFBQUFBQUFBXCIpO1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCdzdG9wUGVyaW9kUHVtcCcpKTtcclxuICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdwdW1wU3RhbicsICdXWk7Dk1cgUE9NUMSYJyk7XHJcbiAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkZWxldGVVc2VyKCkge1xyXG4gICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpLnRoZW4oKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMigpLnN1YnNjcmliZSgoKSA9PlxyXG4gICAgICBkaWFsb2dzLmNvbmZpcm0oe1xyXG4gICAgICAgIHRpdGxlOiBcIlVTVVdBTklFIFBST0ZJTFVcIixcclxuICAgICAgICBtZXNzYWdlOiBcIkN6eSBuYSBwZXdubyBjaGNlc3ogdXN1bsSFxIcgcHJvZmlsIHXFvHl0a293bmlrYT9cIixcclxuICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIixcclxuICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiXHJcbiAgICAgIH0pLnRoZW4ociA9PiB7XHJcbiAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQzKFwiS0FTVUpcIik7XHJcbiAgICAgICAgICAvL3RoaXMuaXNCdXN5ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgKSk7XHJcbiAgfVxyXG5cclxuICBvbkNoZWNrZWRDaGFuZ2UoYXJnczogRXZlbnREYXRhKSB7XHJcbiAgICBjb25zdCBteVN3aXRjaCA9IGFyZ3Mub2JqZWN0IGFzIFN3aXRjaDtcclxuICAgIGNvbnN0IGlzQ2hlY2tlZCA9IG15U3dpdGNoLmNoZWNrZWQ7IC8vIGJvb2xlYW5cclxuICAgIGlmIChpc0NoZWNrZWQgPT09IHRydWUpIHtcclxuICAgICAgZGlhbG9ncy5jb25maXJtKHtcclxuICAgICAgICB0aXRsZTogXCJPc3dpYWRjemVuaWVcIixcclxuICAgICAgICBtZXNzYWdlOiBcIlByenlqbXVqxJkgZG8gd2lhZG9tb8WbY2kgaSB3eXJhxbxhbSB6Z29kxJksIMW8ZTpcXG5cIiArXHJcbiAgICAgICAgICBcIjEpIFByb2R1a3QgbmllIHN0YW5vd2kgemF0d2llcmR6b25lZ28gd3lyb2J1IG1lZHljem5lZ28sIHN0YW5vd2kgamVkeW5pZSBuYXJ6xJlkemllXFxuXCIgK1xyXG4gICAgICAgICAgXCJiYWRhd2N6ZSBpIHBvbW9jbmljemUgZGxhIHBhY2plbnTDs3cgeiBjdWtyenljxIU7XFxuXCIgK1xyXG4gICAgICAgICAgXCIyKSB1ZG9zdMSZcG5pZW5pZSBpIGtvcnp5c3RhbmllIHogUHJvZHVrdHUgbmFzdMSZcHVqZSB3ecWCxIVjem5pZSB3IGNlbGFjaCBpbmZvcm1hY3lqbnljaCBpXFxuXCIgK1xyXG4gICAgICAgICAgXCJzemtvbGVuaW93eWNoO1xcblwiICtcclxuICAgICAgICAgIFwiMykgUHJvZHVrdCBqZXN0IGRvc3RhcmN6YW55IGJleiBqYWtpZWprb2x3aWVrIGd3YXJhbmNqaSAod3lyYcW8b25laiBhbmkgZG9tbmllbWFuZWopO1xcblwiICtcclxuICAgICAgICAgIFwiNCkgb3Byb2dyYW1vd2FuaWUgemF3YXJ0ZSB3IFByb2R1a2NpZSBkemlhxYJhIG5hIGxpY2VuY2ppIG9wZW4gc291cmNlLCBhIGtvcnp5c3RhbmllIHpcXG5cIiArXHJcbiAgICAgICAgICBcIlByb2R1a3R1IG5pZSB3eW1hZ2EgcG9ub3N6ZW5pYSBqYWtpY2hrb2x3aWVrIG9wxYJhdCBsdWIgd3luYWdyb2R6ZW5pYSwgdyB0eW0gbmEgcnplY3pcXG5cIiArXHJcbiAgICAgICAgICBcInBvZG1pb3TDs3cgdXByYXduaW9ueWNoIGRvIG9wcm9ncmFtb3dhbmlhO1xcblwiICtcclxuICAgICAgICAgIFwiNSkgb3Byb2dyYW1vd2FuaWUgemF3YXJ0ZSB3IFByb2R1a2NpZSBuaWUgem9zdGHFgm8gemF0d2llcmR6b25lIHByemV6IMW8YWRuZWdvIHByb2R1Y2VudGE7XFxuXCIgK1xyXG4gICAgICAgICAgXCI2KSBQcm9kdWt0IG1vxbxlIG5pZSBkemlhxYJhxIcgbmllcHJ6ZXJ3YW5pZSwgdGVybWlub3dvLCBiZXpwaWVjem5pZSBpIGJlemLFgsSZZG5pZTtcXG5cIiArXHJcbiAgICAgICAgICBcIjcpIFByb2R1a3QgbW/FvGUgbmllIHdzcMOzxYJkemlhxYJhxIcgeiBpbm55bWkgb3Byb2dyYW1vd2FuaWFtaSBsdWIgaW5ueW1pIHNwcnrEmXRhbWk7XFxuXCIgK1xyXG4gICAgICAgICAgXCI4KSB3eW5pa2kgdXp5c2thbmUgeiB6d2nEhXprdSB6IGtvcnp5c3RhbmllbSBQcm9kdWt0dSBtb2fEhSBuaWUgYnnEhyBkb2vFgmFkbmUgaSByemV0ZWxuZTtcXG5cIiArXHJcbiAgICAgICAgICBcIjkpIG5pZSBwb3NpYWRhbSDFvGFkbnljaCBwcmF3IHfFgmFzbm/Fm2NpIGFuaSB1ZHppYcWCw7N3IHcgUHJvZHVrY2llO1xcblwiICtcclxuICAgICAgICAgIFwiMTApIGLEmWTEmSBrb3J6eXN0YcSHIHogUHJvZHVrdHUgdHlsa28gaSB3ecWCxIVjem5pZSBuYSBtb2plIHfFgmFzbmUgcnl6eWtvIGkgd8WCYXNuxIVcXG5cIiArXHJcbiAgICAgICAgICBcIm9kcG93aWVkemlhbG5vxZvEhztcXG5cIiArXHJcbiAgICAgICAgICBcIjExKSBixJlkxJkga29yenlzdGHEhyB6IFByb2R1a3R1IHR5bGtvIGkgd3nFgsSFY3puaWUgZG8gb3NvYmlzdGVnbyB1xbx5dGt1O1xcblwiICtcclxuICAgICAgICAgIFwiMTIpIG5pZSBixJlkxJkgdcW8eXdhxIcgYW5pIHBvbGVnYcSHIG5hIFByb2R1a2NpZSBwcnp5IHBvZGVqbW93YW5pdSBqYWtpY2hrb2x3aWVrIGRlY3l6amkgb1xcblwiICtcclxuICAgICAgICAgIFwiY2hhcmFrdGVyemUgbWVkeWN6bnltLCBkZWN5emppIHp3acSFemFueWNoIHogbGVjemVuaWVtLCBqYWsgcsOzd25pZcW8IG5pZSBixJlkxJkgdcW8eXdhxIdcXG5cIiArXHJcbiAgICAgICAgICBcIlByb2R1a3R1IGpha28gc3Vic3R5dHV0dSBkbGEgcHJvZmVzam9uYWxuZWogb3BpZWtpIG1lZHljem5lajtcXG5cIiArXHJcbiAgICAgICAgICBcIjEzKSB6b2Jvd2nEhXp1asSZIHNpxJkgcG9uaWXFm8SHIHdzemVsa2llIGtvc3p0eSBuYXByYXd5IGx1YiBzZXJ3aXN1IFByb2R1a3R1LlxcblwiICtcclxuICAgICAgICAgIFwiT8Wbd2lhZGN6YW0sIMW8ZSBuaWUgYsSZZMSZIGRvY2hvZHppxIcgd29iZWMgdHfDs3Jjw7N3IFByb2R1a3R1IGpha2ljaGtvbHdpZWsgcm9zemN6ZcWEIHogdHl0dcWCdVxcblwiICtcclxuICAgICAgICAgIFwibmllcHJhd2lkxYJvd2VnbyBkemlhxYJhbmlhIGx1YiBrb3J6eXN0YW5pYSB6IFByb2R1a3R1LCB3IHR5bSB3IHN6Y3plZ8OzbG5vxZtjaSBuaWUgYsSZZMSZIGRvY2hvZHppxIdcXG5cIiArXHJcbiAgICAgICAgICBcInJvc3pjemXFhCBkb3R5Y3rEhWN5Y2ggc3prw7NkIHBvd3N0YcWCeWNoIHcgd3luaWt1OlxcblwiICtcclxuICAgICAgICAgIFwiMSkgbmllcHJhd2lkxYJvd2VnbyBrb3J6eXN0YW5pYSB6IFByb2R1a3R1O1xcblwiICtcclxuICAgICAgICAgIFwiMikgYnJha3Ugc3ByYXdub8WbY2kgbHViIG9ncmFuaWN6ZW5pYSBzcHJhd25vxZtjaSBQcm9kdWt0dSwgYsWCxJlkw7N3IGkgdXN6a29kemXFhCBQcm9kdWt0dSxcXG5cIiArXHJcbiAgICAgICAgICBcIm9ww7PFum5pZcWEIHcgamVnbyBkemlhxYJhbml1O1xcblwiICtcclxuICAgICAgICAgIFwiMykgbmllc3Rvc293YW5pYSBzacSZIGRvIHphc2FkIGR6aWHFgmFuaWEgUHJvZHVrdHU7XFxuXCIgK1xyXG4gICAgICAgICAgXCI0KSBuaWV3xYJhxZtjaXdlZ28gcHJ6ZWNob3d5d2FuaWEgUHJvZHVrdHU7XFxuXCIgK1xyXG4gICAgICAgICAgXCI1KSBicmFrdSB6YWJlenBpZWN6ZW5pYSBQcm9kdWt0dSBwcnplZCB1c3prb2R6ZW5pYW1pLCB6bmlzemN6ZcWEIFByb2R1a3R1O1xcblwiICtcclxuICAgICAgICAgIFwiNikgcm96xYJhZG93YW5pYSBzacSZIFByb2R1a3R1IGx1YiBpbm55Y2ggc3ByesSZdMOzdyB6IG5pbSBwb8WCxIVjem9ueWNoO1xcblwiICtcclxuICAgICAgICAgIFwiNykgcHJvYmxlbcOzdyB6IGlubnltaSBzcHJ6xJl0YW1pIHBvxYLEhWN6b255bWkgeiBQcm9kdWt0ZW07XFxuXCIgK1xyXG4gICAgICAgICAgXCI4KSBwcm9ibGVtw7N3IGtvbXVuaWthY3lqbnljaCBwb21pxJlkenkgUHJvZHVrdGVtIGEgaW5ueW1pIHNwcnrEmXRhbWkgeiBuaW0gcG/FgsSFY3pvbnltaS5cIixcclxuICAgICAgICBva0J1dHRvblRleHQ6IFwiUG90d2llcmR6YW1cIixcclxuICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIkFudWx1alwiXHJcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICB0aGlzLnNldFBlcm1pc3Npb25zKCk7XHJcbiAgICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRTdGFuKHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBteVN3aXRjaC5jaGVja2VkID0gZmFsc2U7XHJcbiAgICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRTdGFuKGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiTUFNIENJRVwiKSk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5mb3JlZ3JvdW5kVXRpbFNlcnZpY2Uuc3RvcEZvcmVncm91bmQoKTtcclxuICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0U3RhbihmYWxzZSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNoYW5nZUNvbG9yQnV0dG9uKCl7XHJcbiAgICBpZiAodGhpcy5wdW1wU3RhbiA9PT0gXCJXWk7Dk1cgUE9NUMSYXCIpXHJcbiAgICB7XHJcbiAgICAgIHRoaXMuY29sb3IgPSAnR1JFRU4nXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAodGhpcy5wdW1wU3RhbiA9PT0gXCJaQVdJRcWaIFBPTVDEmFwiKSB7XHJcbiAgICAgICAgdGhpcy5jb2xvciA9ICdSRUQnXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5jb2xvciA9ICcjM2Q1YWZlJ1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHN0b3BDb21tb24oKXtcclxuICAgIGNsZWFyVGltZW91dChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3N0b3BQZXJpb2RQdW1wJykpO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCB0cnVlKTtcclxuICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcInB1bXBTdGFuXCIsIFwiUHJvc3rEmSBjemVrYcSHLi4uXCIpO1xyXG4gICAgdGhpcy5mYS5zY2FuQW5kQ29ubmVjdFN0b3AoKS50aGVuKCgpID0+IHRoaXMuem9uZS5ydW4oKCkgPT5cclxuICAgICAge1xyXG4gICAgICAgIHRoaXMucHVtcFN0YW4gPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpO1xyXG4gICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICApLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xyXG4gICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMucHVtcFN0YW4gPSBcIlNwcmF3ZMW6IHN0YW4gcG9tcHkuIENvxZsgcG9zesWCbyBuaWUgdGFrXCI7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9XHJcbiAgc3RvcCgpIHtcclxuICAgIGRpYWxvZ3MuY29uZmlybSh7XHJcbiAgICAgIHRpdGxlOiBcIkN6eSBuYSBwZXdubyBjaGNlc3ogem1pZW5pxIcgc3RhbiBwb21weT9cIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIlRha1wiLFxyXG4gICAgICBjYW5jZWxCdXR0b25UZXh0OiBcIk5pZVwiXHJcbiAgICB9KS50aGVuKHQgPT4ge1xyXG4gICAgICBpZiAodCA9PT0gdHJ1ZSkge1xyXG4gICAgIHRoaXMuc3RvcENvbW1vbigpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICB9KS50aGVuKCgpID0+IGNvbnNvbGUubG9nKFwiQ0lFS0FXRSBNSUVTSkNFICFARVdEU0ZTUkVSXCIpKVxyXG4gIH1cclxuXHJcbiAgc2NhbigpIHtcclxuICAgIC8vdGhpcy5mYS5nZXREYXRhRnJvbU5pZ2h0c2NvdXQoKTtcclxuICAgIHRoaXMuYm9vbCA9IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oXCJzb21lQm9vbGVhblwiLCBmYWxzZSk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKFwic29tZUJvb2xlYW5cIiwgdGhpcy5ib29sKTtcclxuXHJcbiAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihcclxuICAgICAgYW5kcm9pZC5NYW5pZmVzdC5wZXJtaXNzaW9uLkFDQ0VTU19DT0FSU0VfTE9DQVRJT05cclxuICAgICkudGhlbigoKSA9PlxyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0MigpLnN1YnNjcmliZShhID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRPIEplc3QgV3luaWsgc2thbm93YW5pYTogXCIgKyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnRhcmdldEJsdURldmljZVVVSUQgKyBhKTtcclxuICAgICAgICB0aGlzLml0ZW1zID0gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS50YXJnZXRCbHVEZXZpY2VVVUlEMjtcclxuICAgICAgfSkpO1xyXG4gIH1cclxuICBzZXRQZXJtaXNzaW9ucygpIHtcclxuICAgIFBlcm1pc3Npb25zLnJlcXVlc3RQZXJtaXNzaW9uKFxyXG4gICAgICBhbmRyb2lkLk1hbmlmZXN0LnBlcm1pc3Npb24uQUNDRVNTX0NPQVJTRV9MT0NBVElPTlxyXG4gICAgKVxyXG4gICAgICAudGhlbigoKSA9PlxyXG4gICAgICAgIFBlcm1pc3Npb25zLnJlcXVlc3RQZXJtaXNzaW9uKGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5CTFVFVE9PVEgpXHJcbiAgICAgIClcclxuICAgICAgLnRoZW4oKCkgPT5cclxuICAgICAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihcclxuICAgICAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5CTFVFVE9PVEhfQURNSU5cclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICAgLnRoZW4oKCkgPT5cclxuICAgICAgICBQZXJtaXNzaW9ucy5yZXF1ZXN0UGVybWlzc2lvbihcclxuICAgICAgICAgIGFuZHJvaWQuTWFuaWZlc3QucGVybWlzc2lvbi5XQUtFX0xPQ0tcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICAgLnRoZW4oKCkgPT4gUGVybWlzc2lvbnMucmVxdWVzdFBlcm1pc3Npb24oXHJcbiAgICAgICAgYW5kcm9pZC5NYW5pZmVzdC5wZXJtaXNzaW9uLldSSVRFX1NFVFRJTkdTXHJcbiAgICAgICkpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmVuYWJsZSgpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmZvcmVncm91bmRVdGlsU2VydmljZS5zdGFydEZvcmVncm91bmQoKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG5cclxuICAgICAgICAgIHRoaXMuZm9yZWdyb3VuZFV0aWxTZXJ2aWNlLnN0b3BGb3JlZ3JvdW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9XHJcbiAgZXhlY1NRTCgpe1xyXG4gICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZXhlY1NRTFN1Y2Nlc3NNb25pdG9yLnN1YnNjcmliZSh3eW5payA9PiB7XHJcbiAgICAgIHRoaXMucHVtcERhdGEgPSB0aGlzLmZhLmJ0RGF0YTtcclxuICAgICAgLy9jb25zb2xlLmxvZyhcIiUlJSUlJSUlJSUlJSUlJSUlJSUlJSUgICAgICAgICAgIDpcIiArIHRoaXMuZmEuYnREYXRhKTtcclxuICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcERhdGFcIiwgdGhpcy5mYS5idERhdGEpO1xyXG4gICAgICB0aGlzLmZvcmVncm91bmRVdGlsU2VydmljZS51cGRhdGVGb3JlZ3JvdW5kKCk7XHJcbiAgICAgIGlmICh3eW5pay50b1N0cmluZygpLmVuZHNXaXRoKCdzdXNwZW5kJykgJiYgIWFwcFNldHRpbmdzLmdldFN0cmluZygncHVtcFN0YW4nLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJXWk5PV0lFTklFXCIpKXtcclxuICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcInB1bXBTdGFuXCIsIFwiV1pOw5NXIFBPTVDEmFwiKTtcclxuICAgICAgICAgIHRoaXMucHVtcFN0YW4gPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoXCJwdW1wU3RhblwiKTtcclxuICAgICAgICAgIHRoaXMuY2hhbmdlQ29sb3JCdXR0b24oKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQU5PIE1BTVkgUE9NUEUgWkFXSUVTWk9OQTogXCIgKyB3eW5pay50b1N0cmluZygpLmVuZHNXaXRoKCdzdXNwZW5kJykgKyB0aGlzLnB1bXBTdGFuKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH1cclxuICAgICAgaWYgKHd5bmlrLnRvU3RyaW5nKCkuZW5kc1dpdGgoJ25vcm1hbCcpKVxyXG4gICAgICB7XHJcbiAgICAgICAgdGhpcy56b25lLnJ1biAoKCkgPT4ge1xyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJaQVdJRcWaIFBPTVDEmFwiKTtcclxuICAgICAgICAgIHRoaXMucHVtcFN0YW4gPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoXCJwdW1wU3RhblwiKTtcclxuICAgICAgICAgIHRoaXMuY2hhbmdlQ29sb3JCdXR0b24oKTtcclxuICAgICAgICAgIGNsZWFyVGltZW91dChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3N0b3BQZXJpb2RQdW1wJykpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJBTk8gTUFNWSBQT01QRSBVUlVDSE9NSU9OQTogXCIgKyB3eW5pay50b1N0cmluZygpLmVuZHNXaXRoKCdub3JtYWwnKSArIHRoaXMucHVtcFN0YW4pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gICAgY2xlYXJJbnRlcnZhbChhcHBTZXR0aW5ncy5nZXROdW1iZXIoKFwiaW50ZXJ2XCIpKSk7XHJcbiAgICB0aGlzLmludGVydiA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgdGhpcy51dWlkID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKFwiY291bnRlclwiKTtcclxuICAgICAgdGhpcy5wdW1wRGF0YSA9IGFwcFNldHRpbmdzLmdldFN0cmluZyhcImF1dG9zdG9wXCIsIFwiXCIpICsgYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKFwicHVtcERhdGFcIiwgJycpO1xyXG4gICAgICB0aGlzLnB1bXBTdGFuID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJaTUlFxYMgU1RBTiBQT01QWVwiKTtcclxuICAgICAgdGhpcy5pc0J1c3kgPSBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKFwiaXNCdXN5XCIpO1xyXG4gICAgICAvL3RoaXMuYnRDb25uID0gYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbihcImJ0Qm9vbGVhblwiLCBmYWxzZSk7XHJcbiAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKFwiYnRCb29sZWFuXCIsIGZhbHNlKSkge1xyXG4gICAgICAgIHRoaXMuYnRDb25uID0gJ1BvxYLEhWN6b25vIHogcGlsb3RlbScgO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgIHtcclxuICAgICAgICB0aGlzLmJ0Q29ubiA9ICdSb3rFgsSFY3pvbm8geiBwaWxvdGVtJztcclxuICAgICAgfVxyXG4gICAgICAvL2NvbnNvbGUubG9nKFwiNTUxXCIpO1xyXG4gICAgICB0aGlzLmNoYW5nZUNvbG9yQnV0dG9uKCk7XHJcbiAgICB9LCAxMDAwKTtcclxuICAgIGFwcFNldHRpbmdzLnNldE51bWJlcignaW50ZXJ2JywgdGhpcy5pbnRlcnYpO1xyXG5cclxuXHJcbiAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0U3RhbigpLnN1YnNjcmliZSh3eW5payA9PiB7XHJcbiAgICAgICB0aGlzLmJvb2wyID0gd3luaWsudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZSc7XHJcbiAgICAgfSk7XHJcbiAgICB0aGlzLmV4ZWNTUUwoKTtcclxuICB9XHJcbn1cclxuIl19