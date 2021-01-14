"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var operators_1 = require("rxjs/operators");
var database_service_1 = require("~/app/shared/database.service");
var sms_service_1 = require("~/app/shared/sms-service");
var nightscout_api_service_1 = require("~/app/shared/nightscout-api.service");
var pump_bluetooth_api_service_1 = require("~/app/shared/pump-bluetooth-api.service");
var raw_data_parse_service_1 = require("~/app/shared/raw-data-parse.service");
var wake_facade_service_1 = require("~/app/shared/wake-facade.service");
var appSettings = require("application-settings");
var sms_facade_service_1 = require("~/app/shared/sms-facade.service");
var Thread = java.lang.Thread;
var DataFacadeService = /** @class */ (function () {
    function DataFacadeService(databaseService, zone, smsFacadeService, smsService, nightscoutApiService, pumpBluetoothApiService, rawDataService, wakeFacadeService) {
        this.databaseService = databaseService;
        this.zone = zone;
        this.smsFacadeService = smsFacadeService;
        this.smsService = smsService;
        this.nightscoutApiService = nightscoutApiService;
        this.pumpBluetoothApiService = pumpBluetoothApiService;
        this.rawDataService = rawDataService;
        this.wakeFacadeService = wakeFacadeService;
        this.stanPump = "W TRAKCIE...";
        this.ww = /zakres\s(\d{1}):\s(.\W\d{3})\sJ\/WW\sstart\sgodz.\s(\d{2}:\d{2})/g;
        this.ww2 = /zakres\s(\d{1}):\s(.\W\d{3})\sJ\/WW\sstart\sgodz.\s(\d{2}:\d{2})/;
        this.isf = /zakres\s(\d{1}):\s\s?(\d{2,3})mg.dl\sstart\sgodz.\s(\d{2}:\d{2})/g;
        this.isf2 = /zakres\s(\d{1}):\s\s?(\d{2,3})mg.dl\sstart\sgodz.\s(\d{2}:\d{2})/;
        this.bgRange = /zakres\s(\d{1}):\s?(\d{2,3}-.\d{2,3})\sstart\sgodz.\s(\d{2}:\d{2})/g;
        this.bgRange2 = /zakres\s(\d{1}):\s?(\d{2,3}-.\d{2,3})\sstart\sgodz.\s(\d{2}:\d{2})/;
        this.databaseService.createTable();
    }
    DataFacadeService.prototype.clearInt = function () {
        clearInterval(appSettings.getNumber('int0'));
    };
    DataFacadeService.prototype.sendDataToLocalDb = function (pumpStatus) {
        return this.databaseService.insertBG(pumpStatus.bloodGlucose);
    };
    DataFacadeService.prototype.sendDataToLocalDb2 = function (pumpStatus) {
        return this.databaseService.insertTreatments(pumpStatus.lastBolus);
    };
    DataFacadeService.prototype.sendCalcToLacalDB = function (pumpStatus) {
        return this.databaseService.insertCalc(new Date().toString(), pumpStatus.calc.idVal, pumpStatus.calc.value, pumpStatus.calc.hours, pumpStatus.calc.category);
    };
    DataFacadeService.prototype.sendCalcToLacalDbMax = function (pumpStatus) {
        return this.databaseService.insertCalc(new Date().toString(), 1, pumpStatus.maximumBolusSetting, '00:00', 'max');
    };
    DataFacadeService.prototype.sendCalcToLacalDbstep = function (pumpStatus) {
        return this.databaseService.insertCalc(new Date().toString(), 1, pumpStatus.incrementStepSetting, '00:00', 'step');
    };
    DataFacadeService.prototype.sendDataToLocalDb3 = function (pumpStatus) {
        return this.databaseService.insertDeviceStatus(pumpStatus.insulinInPompLeft, pumpStatus.batteryVoltage, pumpStatus.data, pumpStatus.statusPump);
    };
    DataFacadeService.prototype.sendDataToLocalDb4 = function (pumpStatus) {
        return this.databaseService.insertTempBasal(pumpStatus.temporaryBasalMethodPercentage.percentsOfBaseBasal, pumpStatus.temporaryBasalMethodPercentage.timeLeftInMinutes, pumpStatus.temporaryBasalMethodPercentage.timestamp);
    };
    DataFacadeService.prototype.getDatafromLocalDb = function () {
        var _this = this;
        return this.databaseService.getBG().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                value: +a[0],
                date: new Date(a[1]),
                old: _this.setArrow(a[3])
            }); });
        }));
    };
    DataFacadeService.prototype.getDatafromLocalDb2 = function () {
        return this.databaseService.getTreatments().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                value: +a[0],
                date: new Date(a[1])
            }); });
        }));
    };
    DataFacadeService.prototype.getCalcfromLocalDb = function () {
        return this.databaseService.getCalc().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                idVal: +a[0],
                category: a[1],
                dateString: a[2],
                value: a[3],
                hour: a[4]
            }); });
        }));
    };
    DataFacadeService.prototype.getDatafromLocalDb3 = function () {
        return this.databaseService.getDS().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                reservoir: +a[0],
                voltage: +a[1],
                dateString: new Date(a[2]),
                percent: +a[3],
                status: a[4]
            }); });
        }));
    };
    DataFacadeService.prototype.getDatafromLocalDb4 = function () {
        return this.databaseService.getTempBasal().pipe(operators_1.map(function (rows) {
            return rows.map(function (a) { return ({
                percentsOfBasal: +a[0],
                minutes: +a[1],
                dateString: new Date(a[2])
            }); });
        }));
    };
    DataFacadeService.prototype.sendDatatoNightscout = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDatafromLocalDb().subscribe(function (glucoses) {
                _this.nightscoutApiService
                    .sendNewBG(glucoses)
                    .then(function (successValue) { return resolve(successValue); }, function (errorValue) { return reject(errorValue); });
            });
        });
    };
    DataFacadeService.prototype.sendDatatoNightscout2 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDatafromLocalDb2().subscribe(function (treatments) {
                _this.nightscoutApiService
                    .sendNewBol(treatments)
                    .then(function (successValue) { return resolve(successValue); }, function (errorValue) { return reject(errorValue); });
            });
        });
    };
    DataFacadeService.prototype.sendDatatoNightscout3 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDatafromLocalDb3().subscribe(function (deviceStatus) {
                _this.nightscoutApiService
                    .sendNewDevicestatus(deviceStatus)
                    .then(function (successValue) { return resolve(successValue); }, function (errorValue) { return reject(errorValue); });
            });
        });
    };
    DataFacadeService.prototype.getDataFromNightscout = function () {
        var _this = this;
        this.nightscoutApiService.getBGfromNs().then(function (svg) {
            console.log("TAAAAAAAAAAK2: " + JSON.stringify(svg));
            var obj = JSON.parse(JSON.stringify(svg[0]));
            console.log(obj.sgv, svg[0]);
            _this.databaseService.insertBGfromNs(obj.sgv, new Date(obj.dateString), 1);
            // this.databaseService.insertBG(JSON.stringify(svg))
        });
    };
    DataFacadeService.prototype.sendDatatoNightscout4 = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getDatafromLocalDb4().subscribe(function (tempbasal) {
                _this.nightscoutApiService
                    .sendNewTempBasal(tempbasal)
                    .then(function (successValue) { return resolve(successValue); }, function (errorValue) { return reject(errorValue); });
            });
        });
    };
    DataFacadeService.prototype.scanAndConnect = function () {
        var _this = this;
        appSettings.setBoolean('finish', false);
        //this.nightscoutApiService.BgCheck();
        this.pumpBluetoothApiService.scanAndConnect()
            .then(function (uidBt) {
            if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                console.log("Udało połączyć się z: " + uidBt);
                return Promise.resolve(uidBt);
            }
            else {
                console.log('Nie polaczyl sie jednak^^');
                return Promise.reject();
            }
        }, function (uidBt) {
            return Promise.reject();
        }
        //Poczekaj na OK+CONN
        ).then(function () {
            //mozna to bedzie usunc jak slawek zrobi ok+conn dla dalekiego zasigu
            appSettings.setBoolean('odczyt', true);
            setTimeout(function () {
                if (appSettings.getBoolean('odczyt', true)) {
                    _this.pumpBluetoothApiService.sendCommand4("OK+CONN").then(function () { return console.log('WYSYLAM NA WSZELI WYPADEK OK+CONN'); }, function () { return console.log('NIE  !!!!   WYSYLAM NA WSZELI WYPADEK OK+CONN'); });
                }
            }, 5000);
            _this.pumpBluetoothApiService.read7().subscribe(function (result) { appSettings.setBoolean('odczyt', false); _this.pumpBluetoothApiService.sendCommand4("OK+CONN").then(function () { return console.log('asaAAAAAAAAAAAAAAAAAAAAssA'); }); }, function () { console.log('Polecial blad wiec byla tu proba wyla. bt, 5 sec , i connect again  ale to skasowalem teraz jest tylko disconnect '); _this.pumpBluetoothApiService.disconnect(); }, function () {
                _this.transferDataFromPumpThenToApi();
            });
        }, function () {
            console.log('Chyba nie udalo sie polaczyc');
            //Promise.reject();
            //this.pumpBluetoothApiService.disconnect();
        })
            .then(function () {
            setTimeout(function () {
                // sprawdz czy nie rozlaczylo po 12 sec z BT i w razie co ponów połączenie.
                if (appSettings.getBoolean('finish', true)) {
                    console.log('Koniec procesu ');
                }
                else {
                    if (appSettings.getBoolean('btBoolean', false) || appSettings.getBoolean('retry', false)) {
                        console.log('akcja z ponawianiem odwolana');
                        appSettings.setBoolean('retry', false);
                    }
                    else {
                        console.log('zerwalo polaczenie wiec ponawiam jeszcze raz od razu');
                        _this.scanAndConnect();
                        appSettings.setBoolean('retry', true);
                    }
                }
            }, 15 * 1000);
            console.log('NN');
        }, function () { return console.log('wiec normalni sie konczy?'); });
    };
    DataFacadeService.prototype.scanAndConnectStop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.pumpBluetoothApiService
                    .scanAndConnect()
                    .then(function (uidBt) {
                    if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                        console.log(uidBt + "BBBBBBBBBBBBBBBBBBBBB");
                        return Promise.resolve(uidBt);
                    }
                    else {
                        console.log(uidBt + "Nie udalo sie polaczyc booooooo oooooooo status 133");
                        return Promise.reject();
                    }
                }, function (uidBt) {
                    console.log("czekalem 2300ms na kolejna probe polaczenia przy bol");
                    Thread.sleep(7000);
                    console.log("poszedł prawdziwy reject11!!!!!" + uidBt + "       d");
                    return _this.pumpBluetoothApiService.scanAndConnect().then(function (uidBt2) {
                        if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                            console.log(uidBt2 + "BBBBBBBBBBBBBBBBBBBBB");
                            return Promise.resolve(uidBt2);
                        }
                        else {
                            console.log(uidBt2 + "Nie udalo sie polaczyc booooooo oooooooo status 133");
                            return Promise.reject();
                        }
                        console.log("XaXaXaXaXa");
                    }, function () {
                        console.log("jednak nie udalo sie za 2");
                        return Promise.reject();
                    });
                })
                    .then(function () {
                    return setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand("OK+CONN"); }, 2500);
                }, function () {
                    console.log("zatem nie wyslam ok kona");
                    return Promise.reject(console.log("adam23333333"));
                })
                    .then(function () {
                    var timeoutAlert = setTimeout(function () { return _this.errorPumpStan(); }, 63 * 1000);
                    _this.pumpBluetoothApiService.read().subscribe(function () {
                        _this.pumpBluetoothApiService.sendCommand2("a");
                        setTimeout(function () { return _this.pumpBluetoothApiService.read3()
                            .subscribe(function (dane) {
                            console.log("To jest wynik" + dane);
                            if (dane.toString().includes("uruchomiona") || dane.toString().includes("podaje")) {
                                console.log("STOP POMPA");
                                _this.pumpBluetoothApiService.sendCommand("stop");
                                setTimeout(function () { return _this.pumpBluetoothApiService.read5().subscribe(function () {
                                    _this.zone.run(function () { return appSettings.setString("pumpStan", "WZNÓW POMPĘ"); });
                                    // this.pumpBluetoothApiService.disconnect();
                                    _this.nightscoutApiService.setStopNs();
                                    clearTimeout(timeoutAlert);
                                    resolve();
                                }); }, 500);
                            }
                            else {
                                console.log("START POMPA!!!2");
                                _this.pumpBluetoothApiService.sendCommand("start");
                                setTimeout(function () { return _this.pumpBluetoothApiService.read4().subscribe(function () {
                                    _this.zone.run(function () { return appSettings.setString("pumpStan", "ZAWIEŚ POMPĘ"); });
                                    // this.pumpBluetoothApiService.disconnect();
                                    _this.nightscoutApiService.setStartNs();
                                    clearTimeout(timeoutAlert);
                                    resolve();
                                }); }, 500);
                            }
                        }, function () { return _this.errorPumpStan(); }); }, 400);
                    }, function () { return _this.errorPumpStan(); });
                }, function () {
                    console.log("zatem nie czekam na ready");
                    _this.errorPumpStan();
                    reject();
                });
            }
            catch (_a) {
                console.log("Totalna zsssajebka");
                reject();
            }
        });
    };
    DataFacadeService.prototype.scanAndConnectBOL = function (r) {
        var _this = this;
        //  this.wakeFacadeService.wakeScreenByCall();
        return new Promise(function (resolve, reject) {
            try {
                _this.pumpBluetoothApiService
                    .scanAndConnect()
                    .then(function (uidBt) {
                    if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                        console.log(uidBt + "BBBBBBBBBBBBBBBBBBBBB");
                        return Promise.resolve(uidBt);
                    }
                    else {
                        console.log(uidBt + "Nie udalo sie polaczyc booooooo oooooooo status 133");
                        return Promise.reject();
                    }
                }, function (uidBt) {
                    console.log("poszedł prawdziwy reject11!!!!!" + uidBt + "       d");
                    console.log("czekalem 2300ms na kolejna probe polaczenia przy bol");
                    Thread.sleep(7000);
                    return _this.pumpBluetoothApiService.scanAndConnect().then(function (uidBt2) {
                        if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                            console.log(uidBt2 + "BBBBBBBBBBBBBBBBBBBBB");
                            return Promise.resolve(uidBt2);
                        }
                        else {
                            console.log(uidBt2 + "Nie udalo sie polaczyc booooooo oooooooo status 133");
                            return Promise.reject();
                        }
                    }, function () {
                        console.log("jednak nie udalo sie za 2");
                        return Promise.reject();
                    });
                })
                    .then(function () {
                    return setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand("OK+CONN"); }, 2500);
                }, function () {
                    console.log("zatem nie wyslam ok kona");
                    return Promise.reject(console.log("adam23333333"));
                })
                    .then(function () {
                    var timeoutAlert = setTimeout(function () { return _this.errorPumpStan(); }, 69 * 1000);
                    _this.pumpBluetoothApiService.read().subscribe(function () {
                        _this.pumpBluetoothApiService.sendCommand2("x");
                        setTimeout(function () { return _this.pumpBluetoothApiService.read3()
                            .subscribe(function (dane) {
                            console.log("To jest wynik" + dane + "koniec danych / wyniku");
                            if (dane.toString().includes("ustaw")) {
                                console.log("Taki bolus zostal nastawiony: " + r + 'z taka data: ' + new Date().getDate().toString() + '-' + ('0' + (Number(new Date().getMonth()) + 1).toString()).slice(-2).toString());
                                _this.pumpBluetoothApiService.sendCommand("bolus  " + r);
                                setTimeout(function () { return _this.pumpBluetoothApiService.read6().subscribe(function (btdane) {
                                    console.log("btdane: !!!!!!!!!!!!!" + btdane.toString() + "koniec!!!" + new Date().getDay().toString() + '-' + new Date().getMonth().toString());
                                    var d = new Date();
                                    d.setMinutes(d.getMinutes() - 6);
                                    var bolhours = btdane.toString().match(/(\d{2}:\d{2})/);
                                    if (bolhours !== null && bolhours.length > 1) {
                                        console.log("to jest [1] " + bolhours[1] + " a to zero: " + bolhours[0] + "A to po zrzutowaniu do numbera: " + Number(bolhours[1].replace(':', '')));
                                        _this.bolhour = Number(bolhours[1].replace(':', ''));
                                        console.log("Takie cos wyszlo: " + Number(('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2)));
                                        console.log("btdane1: !!!!!!!!!!!!! " + _this.bolhour + Number(('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2)) + " koniec!!!" + new Date().getDate().toString() + '-' + ('0' + (Number(new Date().getMonth()) + 1).toString()).slice(-2).toString());
                                    }
                                    else {
                                        _this.bolhour = 9999;
                                        console.log("Takie cos wyszlo: " + Number(('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2)));
                                        console.log("btdane2 : !!!!!!!!!!!!! " + _this.bolhour + Number(('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2)) + " koniec!!!" + new Date().getDate().toString() + '-' + ('0' + (Number(new Date().getMonth()) + 1).toString()).slice(-2).toString());
                                    }
                                    //console.log(" godzina: " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + " Taki bolus zostal nastawiony: " + r + 'z taka data: ' + new Date().getDate().toString() + '-' + ('0' + (Number(new Date().getMonth()) + 1 ).toString()).slice(-2).toString());
                                    if ((btdane.includes("pompa podaje") && btdane.includes("BL: " + r.toString() + "J")) ||
                                        (btdane.includes("pompa nie podaje") && btdane.includes("BL: " + r.toString() + "J") && btdane.includes(new Date().getDate().toString() + '-' + ('0' + (Number(new Date().getMonth()) + 1).toString()).slice(-2).toString()) && _this.bolhour > Number(('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2)))) {
                                        _this.successLog(r.toString());
                                        clearTimeout(timeoutAlert);
                                    }
                                    else {
                                        var options = {
                                            title: "Odpowiedzi z pompy:",
                                            message: btdane.toString(),
                                            okButtonText: "OK"
                                        };
                                        alert(options);
                                    }
                                    _this.pumpBluetoothApiService.disconnect();
                                    clearTimeout(timeoutAlert);
                                    resolve();
                                }); }, 500);
                            }
                            else {
                                var options = {
                                    title: "Błąd odpowiedzi z pompy:",
                                    message: dane.toString(),
                                    okButtonText: "OK"
                                };
                                alert(options);
                                console.log("Poleciał bład ");
                                _this.pumpBluetoothApiService.disconnect();
                                clearTimeout(timeoutAlert);
                                resolve();
                            }
                        }, function () { return _this.errorPumpStan(); }); }, 400);
                    }, function () { return _this.errorPumpStan(); });
                }, function () {
                    console.log("zatem nie czekam na ready");
                    _this.errorPumpStan();
                    reject();
                });
            }
            catch (_a) {
                console.log("Totalna zsssajebka");
                reject();
            }
        });
    };
    DataFacadeService.prototype.getCalcData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.pumpBluetoothApiService
                    .scanAndConnect()
                    .then(function (uidBt) {
                    if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                        console.log(uidBt + "BBBBBBBBBBBBBBBBBBBBB");
                        return Promise.resolve(uidBt);
                    }
                    else {
                        console.log(uidBt + "Nie udalo sie polaczyc booooooo oooooooo status 133");
                        return Promise.reject();
                    }
                }, function (uidBt) {
                    console.log("czekalem 2300ms na kolejna probe polaczenia przy bol");
                    Thread.sleep(7000);
                    console.log("poszedł prawdziwy reject11!!!!!" + uidBt + "       d");
                    return _this.pumpBluetoothApiService.scanAndConnect().then(function (uidBt2) {
                        if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                            console.log(uidBt2 + "BBBBBBBBBBBBBBBBBBBBB");
                            return Promise.resolve(uidBt2);
                        }
                        else {
                            console.log(uidBt2 + "Nie udalo sie polaczyc booooooo oooooooo status 133");
                            return Promise.reject();
                        }
                    }, function () {
                        console.log("jednak nie udalo sie za 2");
                        return Promise.reject();
                    });
                })
                    .then(function () {
                    return setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand("OK+CONN"); }, 2500);
                }, function () {
                    console.log("zatem nie wyslam ok kona");
                    return Promise.reject(console.log("adam23333333"));
                })
                    .then(function () {
                    _this.pumpBluetoothApiService.read().subscribe(function () {
                        _this.pumpBluetoothApiService.sendCommand2("f");
                        setTimeout(function () { return _this.pumpBluetoothApiService.read()
                            .subscribe(function (dane) {
                            var matchDataww = dane.match(_this.ww);
                            var matchDataisf = dane.match(_this.isf);
                            var matchDatabgrange = dane.match(_this.bgRange);
                            console.log("WWWW2" + matchDataww[1], matchDataww.length);
                            console.log("WWWW3" + matchDataisf[1], matchDataisf.length);
                            console.log("WWWW4" + matchDatabgrange[1], matchDatabgrange.length);
                            for (var i = 0; i < Number(matchDataww.length); i++) {
                                var adam3 = _this.ww2.exec(matchDataww[i]);
                                console.log("To jest wynik:111111 " + adam3.toString());
                                var parsedDate22 = _this.rawDataService.parseData(adam3.toString());
                                _this.sendCalcToLacalDB(parsedDate22);
                            }
                            for (var i = 0; i < Number(matchDataisf.length); i++) {
                                var adam3 = _this.isf2.exec(matchDataisf[i]);
                                console.log("To jest wynik:222222 " + adam3.toString());
                                var parsedDate22 = _this.rawDataService.parseData(adam3.toString());
                                _this.sendCalcToLacalDB(parsedDate22);
                            }
                            for (var i = 0; i < Number(matchDatabgrange.length); i++) {
                                var adam3 = _this.bgRange2.exec(matchDatabgrange[i]);
                                console.log("To jest wynik:3333333 " + adam3.toString());
                                var parsedDate22 = _this.rawDataService.parseData(adam3.toString());
                                _this.sendCalcToLacalDB(parsedDate22);
                            }
                            var parsedDate2 = _this.rawDataService.parseData(dane);
                            //this.sendCalcToLacalDB(parsedDate2);
                            _this.sendCalcToLacalDbMax(parsedDate2);
                            _this.sendCalcToLacalDbstep(parsedDate2);
                            var options = {
                                title: "Ustawienia kalkulatora bolusa zostały zapisane do bazy danych",
                                message: dane.toString(),
                                okButtonText: "OK"
                            };
                            alert(options);
                            _this.getCalcfromLocalDb().subscribe(function (d) {
                                console.log(d);
                            });
                            _this.pumpBluetoothApiService.disconnect();
                            resolve();
                        }, function () { return _this.errorPumpStan(); }); }, 200);
                    }, function () { return _this.errorPumpStan(); });
                }, function () {
                    console.log("zatem nie czekam na ready");
                    _this.errorPumpStan();
                    reject();
                });
            }
            catch (_a) {
                console.log("Totalna zsssajebka");
                reject();
            }
        });
    };
    DataFacadeService.prototype.errorPumpStan = function () {
        appSettings.setBoolean("isBusy", false);
        appSettings.setString("pumpStan", "ZMIEŃ STAN POMPY");
        var options = {
            title: "Coś poszło nie tak",
            message: "Sprawdź stan pompy!",
            okButtonText: "Przyjąłem do wiadomości"
        };
        alert(options);
    };
    DataFacadeService.prototype.successLog = function (r) {
        var options = {
            title: "Brawo!",
            message: "Udało się podać bolus: " + r.toString() + " J",
            okButtonText: "OK"
        };
        alert(options);
    };
    DataFacadeService.prototype.establishConnectionWithPump = function () {
        var _this = this;
        //this.scanAndConnect();
        // setInterval(() => this.scanAndConnect(),  60 * 1000);
        this.wakeFacadeService.setAlarm();
        this.scanAndConnect();
        this.int0 = setInterval(function () { return _this.scanAndConnect(); }, 5 * 60 * 1000);
        appSettings.setNumber('int0', this.int0);
    };
    DataFacadeService.prototype.waitOnReady = function () {
        var _this = this;
        setTimeout(function () {
            _this.pumpBluetoothApiService.read().subscribe(function () { console.log("szukam ready"); }, function () { console.log("wywaliło polaczenie?"); }, function () { console.log('jak to mozliwe przeciez nie mam rea?'); _this.transferDataFromPumpThenToApi(); });
        }, 2500);
    };
    DataFacadeService.prototype.waitOnReadyStop = function () {
        var _this = this;
        this.pumpBluetoothApiService.read().subscribe(function () {
            // this.transferDataFromPumpThenToApi();
            _this.checStatusPump();
        });
    };
    DataFacadeService.prototype.checStatusPump = function () {
        var _this = this;
        setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand2("a"); }, 400);
        setTimeout(function () { return _this.pumpBluetoothApiService.read3()
            .subscribe(function (dane) {
            console.log("To jest wynik" + dane);
            if (dane.toString().includes("uruchomiona")) {
                console.log("STOP POMPA@");
                _this.pumpBluetoothApiService.sendCommand("stop");
                setTimeout(function () { return _this.pumpBluetoothApiService.read3().subscribe(function () {
                    _this.zone.run(function () { return _this.stanPump = "WYŁĄCZ POMPĘ"; });
                    _this.pumpBluetoothApiService.disconnect();
                }); }, 500);
            }
            else {
                console.log("START POMPA!!!@");
                _this.pumpBluetoothApiService.sendCommand("start");
                setTimeout(function () { return _this.pumpBluetoothApiService.read3().subscribe(function () {
                    _this.zone.run(function () { return _this.stanPump = "WŁĄCZ POMPĘ"; });
                    _this.pumpBluetoothApiService.disconnect();
                }); }, 500);
            }
        }); }, 400);
    };
    DataFacadeService.prototype.preventLowSugar = function (a, b) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (appSettings.getBoolean('auto', false) && a <= appSettings.getNumber('range', 75) && !(a === 0) && !(a.toString() === '000') && b.toLowerCase().includes('normal')) {
                console.log("AKT WOJNY" + a + b + appSettings.getBoolean('auto', false));
                _this.scanAndConnectStop().then(function () {
                    console.log("Pompa wyl");
                    resolve();
                    appSettings.setString("autostop", new Date().toString().substring(3, 21) + " UWAGA! POMPA ZATRZYMANA PRZEZ FUNKCJĘ AUTO STOP\n\n");
                    _this.nightscoutApiService.setStopNs();
                    //nie wiem czemu ale NS nie reaguje na te zmiany
                    //this.nightscoutApiService.setStopNsDs();
                }, function () { return console.log("BADD ASS nie wylaczona"); });
            }
            else {
                if (appSettings.getBoolean('auto', false) && a > appSettings.getNumber('range', 75) && !(a === 0) && !(a.toString() === '000') && b.toLowerCase().includes('suspend')) {
                    console.log("AKT WOJNY3" + a + b);
                    _this.scanAndConnectStop().then(function () {
                        console.log("Pompa wlaczona");
                        resolve();
                        appSettings.setString("autostop", new Date().toString().substring(3, 21) + " UWAGA! POMPA WZNOWIONA PRZEZ FUNKCJĘ AUTO START\n\n");
                        _this.nightscoutApiService.setStartNs();
                        console.log('wyslka danych do ns....');
                        //this.nightscoutApiService.setStartNsDs();
                    }, function () { return console.log("BADD ASS 2 nie wylaczona"); });
                }
                else {
                    console.log("Nie uzywam auto stop/start: " + a + b);
                    resolve();
                    //NA TESTY TO WYLACZYLEM:
                    //this.pumpBluetoothApiService.disconnect();
                }
            }
        });
    };
    DataFacadeService.prototype.validateSms = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var phoneNumb = appSettings.getString('phoneN', null);
            console.log("to jest numer tel:" + phoneNumb);
            if (phoneNumb !== null && phoneNumb !== 'Podaj nr tel. opiekuna') {
                _this.smsService.getInboxMessagesFromNumber().then(function () {
                    console.log("to jest tresc smsa: " + _this.smsService.message.toUpperCase());
                    //const dateM = appSettings.getString('dateMessageOld', '');
                    console.log("to jest data: " + new Date().valueOf() + "a to data smsa: " + _this.smsService.dateMessage + " a to jest data odjeta o 15 min o sysdate: " + (Number(new Date().valueOf()) - 960000));
                    if (_this.smsService.message.toUpperCase() === 'STOP' && !(_this.smsService.dateMessage === appSettings.getString('dateMessageOld', '')) && Number(_this.smsService.dateMessage) > (Number(new Date().valueOf()) - 960000)) {
                        _this.scanAndConnectStop().then(function (a) {
                            appSettings.setString('dateMessageOld', _this.smsService.dateMessage);
                            _this.smsService.sendSms();
                            resolve();
                        }, function () { return console.log("Wyslij smutnego smsa"); });
                    }
                    else {
                        console.log("Brak komendy do wykonania");
                        resolve();
                    }
                });
            }
            else {
                resolve();
            }
        });
    };
    DataFacadeService.prototype.checkSourceBeforePrevent = function (parsedDate) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (appSettings.getBoolean('bgsource', false) === true) {
                _this.nightscoutApiService.getBGfromNs().then(function (svg) {
                    console.log("TAAAAAAAAAAK2: " + JSON.stringify(svg));
                    var obj = JSON.parse(JSON.stringify(svg[0]));
                    console.log(obj.sgv, svg[0]);
                    _this.databaseService.insertBGfromNs(obj.sgv, new Date(obj.dateString), 1);
                    var d = new Date();
                    d.setMinutes(d.getMinutes() - 16);
                    if (new Date(obj.dateString) > d) {
                        _this.preventLowSugar(obj.sgv, parsedDate.statusPump.toString()).then(function () { return resolve(); });
                    }
                    else {
                        console.log("Stary cukier z NS");
                        resolve();
                    }
                });
            }
            else {
                _this.preventLowSugar(parsedDate.bloodGlucose.value, parsedDate.statusPump.toString()).then(function () { return resolve(); });
            }
        });
    };
    DataFacadeService.prototype.transferDataFromPumpThenToApi = function () {
        var _this = this;
        setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand2("s"); }, 4100);
        setTimeout(function () {
            _this.pumpBluetoothApiService.read2().subscribe(function (data) {
                console.log('TOOOOO:   ' + data.toString());
                appSettings.setBoolean('finish', true);
                appSettings.setBoolean('retry', true);
                _this.btData = data.toString();
                var parsedDate = _this.rawDataService.parseData(data);
                console.log('to jest ot miejsce !!!! : ' + parsedDate.bloodGlucose.value + 'aaa: ' + appSettings.getNumber('value', 320) + parsedDate.bloodGlucose.date.toString());
                if (parsedDate.bloodGlucose.value === appSettings.getNumber('value', 320) && parsedDate.bloodGlucose.date.toString() === appSettings.getString('dateBG', '00-00-00')) {
                    console.log('Znalazlem te same dane co wczesniej wiec ponawiam komunikacje:');
                    setTimeout(function () { return _this.transferDataFromPumpThenToApi(); }, 11000);
                }
                else {
                    appSettings.setNumber('value', parsedDate.bloodGlucose.value);
                    appSettings.setString('dateBG', parsedDate.bloodGlucose.date.toString());
                    _this.sendDataToLocalDb(parsedDate)
                        .then(function () {
                        console.log('AAAAA doszlo');
                        _this.sendDataToLocalDb2(parsedDate);
                    })
                        .then(function () { return _this.sendDataToLocalDb3(parsedDate); })
                        .then(function () { return _this.sendDataToLocalDb4(parsedDate); })
                        .then(function () { return _this.sendDatatoNightscout3(); })
                        .then(function () { return _this.databaseService.updateDS(); })
                        .then(function () { return _this.sendDatatoNightscout(); })
                        .then(function () { return _this.databaseService.updateBG(); })
                        .then(function () { return _this.sendDatatoNightscout2(); })
                        .then(function () { return _this.databaseService.updateTreatments(); })
                        .then(function () { return _this.sendDatatoNightscout4(); })
                        .then(function () { return _this.databaseService.updateTempBasal(); })
                        .then(function () { return _this.checkSourceBeforePrevent(parsedDate)
                        .then(function () { return _this.smsFacadeService.validateSms()
                        .then(function () { return _this.pumpBluetoothApiService.disconnect(); }); }); })
                        .catch(function (error) {
                        console.log(error);
                        //this.wakeFacadeService.snoozeScreenByCall()
                    });
                    //this.pumpBluetoothApiService.disconnect();
                }
            });
        }, 4200);
    };
    DataFacadeService.prototype.checkOldBg = function () {
    };
    DataFacadeService.prototype.setArrow = function (old) {
        if (Number(old) >= -5 && Number(old) <= 5) {
            old = "Flat";
        }
        if (Number(old) > 5 && Number(old) < 10) {
            old = "FortyFiveUp";
        }
        if (Number(old) >= 10) {
            old = "SingleUp";
        }
        if (Number(old) < -5 && Number(old) > -10) {
            old = "FortyFiveDown";
        }
        if (Number(old) <= -10) {
            old = "SingleDown";
        }
        return old;
    };
    DataFacadeService = __decorate([
        core_1.Injectable({
            providedIn: "root"
        }),
        __metadata("design:paramtypes", [database_service_1.DatabaseService,
            core_1.NgZone,
            sms_facade_service_1.SmsFacadeService,
            sms_service_1.SmsService,
            nightscout_api_service_1.NightscoutApiService,
            pump_bluetooth_api_service_1.PumpBluetoothApiService,
            raw_data_parse_service_1.RawDataService,
            wake_facade_service_1.WakeFacadeService])
    ], DataFacadeService);
    return DataFacadeService;
}());
exports.DataFacadeService = DataFacadeService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1mYWNhZGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtZmFjYWRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFHbEQsNENBQXFDO0FBRXJDLGtFQUFnRTtBQUNoRSx3REFBc0Q7QUFDdEQsOEVBQTJFO0FBQzNFLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsd0VBQXFFO0FBQ3JFLGtEQUFvRDtBQUNwRCxzRUFBbUU7QUFDbkUsSUFBTyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFLakM7SUFXRSwyQkFDVSxlQUFnQyxFQUNoQyxJQUFZLEVBQ1osZ0JBQWtDLEVBQ2xDLFVBQXNCLEVBQ3RCLG9CQUEwQyxFQUMxQyx1QkFBZ0QsRUFDaEQsY0FBOEIsRUFDOUIsaUJBQW9DO1FBUHBDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1oscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7UUFDMUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtRQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQWY5QyxhQUFRLEdBQVcsY0FBYyxDQUFDO1FBQ2xDLE9BQUUsR0FBRyxtRUFBbUUsQ0FBQztRQUN6RSxRQUFHLEdBQUcsa0VBQWtFLENBQUM7UUFDekUsUUFBRyxHQUFHLG1FQUFtRSxDQUFDO1FBQzFFLFNBQUksR0FBRyxrRUFBa0UsQ0FBQztRQUMxRSxZQUFPLEdBQUcscUVBQXFFLENBQUM7UUFDaEYsYUFBUSxHQUFHLG9FQUFvRSxDQUFDO1FBVzlFLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUNELG9D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LEFBOXhCRCxJQTh4QkM7QUE5eEJZLDhDQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcclxuaW1wb3J0IHsgc2V0U3RyaW5nIH0gZnJvbSAnYXBwbGljYXRpb24tc2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHsgbWFwIH0gZnJvbSBcInJ4anMvb3BlcmF0b3JzXCI7XHJcbmltcG9ydCB7IElCYXNpY1NldHRpbmdzIH0gZnJvbSBcIn4vYXBwL21vZGVsL21lZC1saW5rLm1vZGVsXCI7XHJcbmltcG9ydCB7IERhdGFiYXNlU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvZGF0YWJhc2Uuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBTbXNTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9zbXMtc2VydmljZVwiO1xyXG5pbXBvcnQgeyBOaWdodHNjb3V0QXBpU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvbmlnaHRzY291dC1hcGkuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBQdW1wQmx1ZXRvb3RoQXBpU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvcHVtcC1ibHVldG9vdGgtYXBpLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgUmF3RGF0YVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3Jhdy1kYXRhLXBhcnNlLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgV2FrZUZhY2FkZVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3dha2UtZmFjYWRlLnNlcnZpY2VcIjtcclxuaW1wb3J0ICogYXMgYXBwU2V0dGluZ3MgZnJvbSBcImFwcGxpY2F0aW9uLXNldHRpbmdzXCI7XHJcbmltcG9ydCB7IFNtc0ZhY2FkZVNlcnZpY2UgfSBmcm9tICd+L2FwcC9zaGFyZWQvc21zLWZhY2FkZS5zZXJ2aWNlJztcclxuaW1wb3J0IFRocmVhZCA9IGphdmEubGFuZy5UaHJlYWQ7XHJcblxyXG5ASW5qZWN0YWJsZSh7XHJcbiAgcHJvdmlkZWRJbjogXCJyb290XCJcclxufSlcclxuZXhwb3J0IGNsYXNzIERhdGFGYWNhZGVTZXJ2aWNlIHtcclxuICBidERhdGE6IHN0cmluZztcclxuICBib2xob3VyOiBudW1iZXI7XHJcbiAgaW50MDogbnVtYmVyO1xyXG4gIHN0YW5QdW1wOiBzdHJpbmcgPSBcIlcgVFJBS0NJRS4uLlwiO1xyXG4gIHd3ID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccyguXFxXXFxkezN9KVxcc0pcXC9XV1xcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvZztcclxuICB3dzIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzKC5cXFdcXGR7M30pXFxzSlxcL1dXXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgaXNmID0gL3pha3Jlc1xccyhcXGR7MX0pOlxcc1xccz8oXFxkezIsM30pbWcuZGxcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgaXNmMiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHNcXHM/KFxcZHsyLDN9KW1nLmRsXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgYmdSYW5nZSA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHM/KFxcZHsyLDN9LS5cXGR7MiwzfSlcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgYmdSYW5nZTIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzPyhcXGR7MiwzfS0uXFxkezIsM30pXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGRhdGFiYXNlU2VydmljZTogRGF0YWJhc2VTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUsXHJcbiAgICBwcml2YXRlIHNtc0ZhY2FkZVNlcnZpY2U6IFNtc0ZhY2FkZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHNtc1NlcnZpY2U6IFNtc1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIG5pZ2h0c2NvdXRBcGlTZXJ2aWNlOiBOaWdodHNjb3V0QXBpU2VydmljZSxcclxuICAgIHByaXZhdGUgcHVtcEJsdWV0b290aEFwaVNlcnZpY2U6IFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByYXdEYXRhU2VydmljZTogUmF3RGF0YVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHdha2VGYWNhZGVTZXJ2aWNlOiBXYWtlRmFjYWRlU2VydmljZVxyXG4gICkge1xyXG4gICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuY3JlYXRlVGFibGUoKTtcclxuICB9XHJcbiAgY2xlYXJJbnQoKSB7XHJcbiAgICBjbGVhckludGVydmFsKGFwcFNldHRpbmdzLmdldE51bWJlcignaW50MCcpKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCRyhwdW1wU3RhdHVzLmJsb29kR2x1Y29zZSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYjIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRUcmVhdG1lbnRzKHB1bXBTdGF0dXMubGFzdEJvbHVzKTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsREIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgcHVtcFN0YXR1cy5jYWxjLmlkVmFsLCBwdW1wU3RhdHVzLmNhbGMudmFsdWUsIHB1bXBTdGF0dXMuY2FsYy5ob3VycywgcHVtcFN0YXR1cy5jYWxjLmNhdGVnb3J5KTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsRGJNYXgocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgMSwgcHVtcFN0YXR1cy5tYXhpbXVtQm9sdXNTZXR0aW5nLCAnMDA6MDAnLCAnbWF4Jyk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERic3RlcChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydENhbGMobmV3IERhdGUoKS50b1N0cmluZygpLCAxLCBwdW1wU3RhdHVzLmluY3JlbWVudFN0ZXBTZXR0aW5nLCAnMDA6MDAnLCAnc3RlcCcpO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGIzKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0RGV2aWNlU3RhdHVzKFxyXG4gICAgICBwdW1wU3RhdHVzLmluc3VsaW5JblBvbXBMZWZ0LFxyXG4gICAgICBwdW1wU3RhdHVzLmJhdHRlcnlWb2x0YWdlLFxyXG4gICAgICBwdW1wU3RhdHVzLmRhdGEsXHJcbiAgICAgIHB1bXBTdGF0dXMuc3RhdHVzUHVtcFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiNChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydFRlbXBCYXNhbChcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UucGVyY2VudHNPZkJhc2VCYXNhbCxcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UudGltZUxlZnRJbk1pbnV0ZXMsXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnRpbWVzdGFtcFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYigpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlOyBvbGQ6IHN0cmluZyB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldEJHKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICB2YWx1ZTogK2FbMF0sXHJcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShhWzFdKSxcclxuICAgICAgICAgIG9sZDogdGhpcy5zZXRBcnJvdyhhWzNdKVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIyKCk6IE9ic2VydmFibGU8QXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlIH0+PiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0VHJlYXRtZW50cygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgdmFsdWU6ICthWzBdLFxyXG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoYVsxXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuICBnZXRDYWxjZnJvbUxvY2FsRGIoKTogT2JzZXJ2YWJsZTxBcnJheTx7IGlkVmFsOiBudW1iZXI7IGNhdGVnb3J5OiBzdHJpbmc7IGRhdGVTdHJpbmc6IHN0cmluZzsgdmFsdWU6IHN0cmluZzsgaG91cjogc3RyaW5nOyB9Pj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldENhbGMoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIGlkVmFsOiArYVswXSxcclxuICAgICAgICAgIGNhdGVnb3J5OiBhWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogYVsyXSxcclxuICAgICAgICAgIHZhbHVlOiBhWzNdLFxyXG4gICAgICAgICAgaG91cjogYVs0XVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIzKCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7XHJcbiAgICAgIHJlc2Vydm9pcjogbnVtYmVyO1xyXG4gICAgICB2b2x0YWdlOiBudW1iZXI7XHJcbiAgICAgIGRhdGVTdHJpbmc6IERhdGU7XHJcbiAgICAgIHBlcmNlbnQ6IG51bWJlcjtcclxuICAgICAgc3RhdHVzOiBzdHJpbmc7XHJcbiAgICB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldERTKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICByZXNlcnZvaXI6ICthWzBdLFxyXG4gICAgICAgICAgdm9sdGFnZTogK2FbMV0sXHJcbiAgICAgICAgICBkYXRlU3RyaW5nOiBuZXcgRGF0ZShhWzJdKSxcclxuICAgICAgICAgIHBlcmNlbnQ6ICthWzNdLFxyXG4gICAgICAgICAgc3RhdHVzOiBhWzRdXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYjQoKTogT2JzZXJ2YWJsZTxcclxuICAgIEFycmF5PHsgcGVyY2VudHNPZkJhc2FsOiBudW1iZXI7IG1pbnV0ZXM6IG51bWJlcjsgZGF0ZVN0cmluZzogRGF0ZSB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldFRlbXBCYXNhbCgpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgcGVyY2VudHNPZkJhc2FsOiArYVswXSxcclxuICAgICAgICAgIG1pbnV0ZXM6ICthWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogbmV3IERhdGUoYVsyXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYigpLnN1YnNjcmliZShnbHVjb3NlcyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdCRyhnbHVjb3NlcylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0MigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiMigpLnN1YnNjcmliZSh0cmVhdG1lbnRzID0+IHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2VuZE5ld0JvbCh0cmVhdG1lbnRzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGIzKCkuc3Vic2NyaWJlKGRldmljZVN0YXR1cyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdEZXZpY2VzdGF0dXMoZGV2aWNlU3RhdHVzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBnZXREYXRhRnJvbU5pZ2h0c2NvdXQoKSB7XHJcbiAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLmdldEJHZnJvbU5zKCkudGhlbihzdmcgPT4ge2NvbnNvbGUubG9nKCBcIlRBQUFBQUFBQUFBSzI6IFwiICsgSlNPTi5zdHJpbmdpZnkoc3ZnKSk7XHJcbiAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN2Z1swXSkpO1xyXG4gICAgY29uc29sZS5sb2cob2JqLnNndiwgc3ZnWzBdKTtcclxuICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHZnJvbU5zKG9iai5zZ3YsIG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSwgMSk7XHJcbiAgICAgLy8gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0QkcoSlNPTi5zdHJpbmdpZnkoc3ZnKSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGI0KCkuc3Vic2NyaWJlKHRlbXBiYXNhbCA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdUZW1wQmFzYWwodGVtcGJhc2FsKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzY2FuQW5kQ29ubmVjdCgpIHtcclxuICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oJ2ZpbmlzaCcsIGZhbHNlKTtcclxuICAgIC8vdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5CZ0NoZWNrKCk7XHJcbiAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJVZGHFgm8gcG/FgsSFY3p5xIcgc2nEmSB6OiBcIiArIHVpZEJ0KTtcclxuICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05pZSBwb2xhY3p5bCBzaWUgamVkbmFrXl4nKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvL1BvY3pla2FqIG5hIE9LK0NPTk5cclxuICAgICAgICApLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgLy9tb3puYSB0byBiZWR6aWUgdXN1bmMgamFrIHNsYXdlayB6cm9iaSBvaytjb25uIGRsYSBkYWxla2llZ28gemFzaWd1XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKCdvZGN6eXQnLCB0cnVlKTtcclxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gIHtcclxuICAgICAgICAgICAgaWYgKGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ29kY3p5dCcsIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDQoXCJPSytDT05OXCIpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ1dZU1lMQU0gTkEgV1NaRUxJIFdZUEFERUsgT0srQ09OTicpLCAoKSA9PiBjb25zb2xlLmxvZygnTklFICAhISEhICAgV1lTWUxBTSBOQSBXU1pFTEkgV1lQQURFSyBPSytDT05OJykpXHJcbiAgICAgICAgICAgIH19ICwgNTAwMCk7XHJcbiAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQ3KCkuc3Vic2NyaWJlKFxyXG4gICAgICAgICAgcmVzdWx0ID0+IHsgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbignb2Rjenl0JywgZmFsc2UpOyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kNChcIk9LK0NPTk5cIikudGhlbiggKCkgPT4gY29uc29sZS5sb2coJ2FzYUFBQUFBQUFBQUFBQUFBQUFBQUFBc3NBJykpIH0gLFxyXG4gICAgICAgICgpID0+IHsgY29uc29sZS5sb2coJ1BvbGVjaWFsIGJsYWQgd2llYyBieWxhIHR1IHByb2JhIHd5bGEuIGJ0LCA1IHNlYyAsIGkgY29ubmVjdCBhZ2FpbiAgYWxlIHRvIHNrYXNvd2FsZW0gdGVyYXogamVzdCB0eWxrbyBkaXNjb25uZWN0ICcpOyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTsgfSxcclxuICAgICAgICAoKSA9PiAgIHtcclxuICAgICAgICAgIHRoaXMudHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnQ2h5YmEgbmllIHVkYWxvIHNpZSBwb2xhY3p5YycgKTtcclxuICAgICAgICAgIC8vUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgIC8vdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIHNwcmF3ZHogY3p5IG5pZSByb3psYWN6eWxvIHBvIDEyIHNlYyB6IEJUIGkgdyByYXppZSBjbyBwb27Ds3cgcG/FgsSFY3plbmllLlxyXG4gICAgICAgICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignZmluaXNoJywgdHJ1ZSkpe1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdLb25pZWMgcHJvY2VzdSAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYnRCb29sZWFuJywgZmFsc2UpIHx8IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ3JldHJ5JywgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWtjamEgeiBwb25hd2lhbmllbSBvZHdvbGFuYScpO1xyXG4gICAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbigncmV0cnknLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3plcndhbG8gcG9sYWN6ZW5pZSB3aWVjIHBvbmF3aWFtIGplc3pjemUgcmF6IG9kIHJhenUnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oJ3JldHJ5JywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDE1ICogMTAwMCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnTk4nKTtcclxuICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZygnd2llYyBub3JtYWxuaSBzaWUga29uY3p5PycpKTtcclxuXHJcbiAgfVxyXG5cclxuICAgc2NhbkFuZENvbm5lY3RTdG9wKCkge1xyXG4gICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAudGhlbih1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImN6ZWthbGVtIDIzMDBtcyBuYSBrb2xlam5hIHByb2JlIHBvbGFjemVuaWEgcHJ6eSBib2xcIik7XHJcbiAgICAgICAgICAgIFRocmVhZC5zbGVlcCg3MDAwKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpLnRoZW4oXHJcbiAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQyICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlhhWGFYYVhhWGFcIik7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoY29uc29sZS5sb2coXCJhZGFtMjMzMzMzMzNcIikpO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRBbGVydCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCksIDYzICogMTAwMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpO1xyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpXHJcbiAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGFuZS50b1N0cmluZygpLmluY2x1ZGVzKFwidXJ1Y2hvbWlvbmFcIikgfHwgZGFuZS50b1N0cmluZygpLmluY2x1ZGVzKFwicG9kYWplXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1RPUCBQT01QQVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdG9wXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkNSgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IGFwcFNldHRpbmdzLnNldFN0cmluZyhcInB1bXBTdGFuXCIsIFwiV1pOw5NXIFBPTVDEmFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2Uuc2V0U3RvcE5zKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIFBPTVBBISEhMlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpBV0lFxZogUE9NUMSYXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5zZXRTdGFydE5zKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgLCA0MDApO1xyXG4gICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgY29uc29sZS5sb2coXCJUb3RhbG5hIHpzc3NhamVia2FcIik7XHJcbiAgICAgIHJlamVjdCgpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgfVxyXG4gIHNjYW5BbmRDb25uZWN0Qk9MKHIpIHtcclxuICAgIC8vICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLndha2VTY3JlZW5CeUNhbGwoKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcblxyXG4gICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicG9zemVkxYIgcHJhd2R6aXd5IHJlamVjdDExISEhISFcIiArIHVpZEJ0ICsgXCIgICAgICAgZFwiKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImN6ZWthbGVtIDIzMDBtcyBuYSBrb2xlam5hIHByb2JlIHBvbGFjemVuaWEgcHJ6eSBib2xcIik7XHJcbiAgICAgICAgICAgICAgVGhyZWFkLnNsZWVwKDcwMDApO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGltZW91dEFsZXJ0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSwgNjkgKiAxMDAwKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJ4XCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiICsgZGFuZSArIFwia29uaWVjIGRhbnljaCAvIHd5bmlrdVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1c3Rhd1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGFraSBib2x1cyB6b3N0YWwgbmFzdGF3aW9ueTogXCIgKyByICsgJ3ogdGFrYSBkYXRhOiAnICsgbmV3IERhdGUoKS5nZXREYXRlKCkudG9TdHJpbmcoKSArICctJyArICgnMCcgKyAoTnVtYmVyKG5ldyBEYXRlKCkuZ2V0TW9udGgoKSkgKyAxICkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiYm9sdXMgIFwiICsgcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDYoKS5zdWJzY3JpYmUoYnRkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImJ0ZGFuZTogISEhISEhISEhISEhIVwiICsgYnRkYW5lLnRvU3RyaW5nKCkgKyBcImtvbmllYyEhIVwiICsgbmV3IERhdGUoKS5nZXREYXkoKS50b1N0cmluZygpICsgJy0nICsgbmV3IERhdGUoKS5nZXRNb250aCgpLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBkLnNldE1pbnV0ZXMoZC5nZXRNaW51dGVzKCkgLSA2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBib2xob3VycyA9IGJ0ZGFuZS50b1N0cmluZygpLm1hdGNoKC8oXFxkezJ9OlxcZHsyfSkvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYm9saG91cnMgIT09IG51bGwgJiYgYm9saG91cnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IFsxXSBcIiArIGJvbGhvdXJzWzFdICsgXCIgYSB0byB6ZXJvOiBcIiArIGJvbGhvdXJzWzBdICsgXCJBIHRvIHBvIHpyenV0b3dhbml1IGRvIG51bWJlcmE6IFwiICsgTnVtYmVyKGJvbGhvdXJzWzFdLnJlcGxhY2UoJzonLCAnJykpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYm9saG91ciA9IE51bWJlcihib2xob3Vyc1sxXS5yZXBsYWNlKCc6JywgJycpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGFraWUgY29zIHd5c3psbzogXCIgKyBOdW1iZXIoKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYnRkYW5lMTogISEhISEhISEhISEhISBcIiArIHRoaXMuYm9saG91ciArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkgICsgXCIga29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJvbGhvdXIgPSA5OTk5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpZSBjb3Mgd3lzemxvOiBcIiArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJidGRhbmUyIDogISEhISEhISEhISEhISBcIiArIHRoaXMuYm9saG91ciArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkgICsgXCIga29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIiBnb2R6aW5hOiBcIiArICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIiBUYWtpIGJvbHVzIHpvc3RhbCBuYXN0YXdpb255OiBcIiArIHIgKyAneiB0YWthIGRhdGE6ICcgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEgKS50b1N0cmluZygpKS5zbGljZSgtMikudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChidGRhbmUuaW5jbHVkZXMoXCJwb21wYSBwb2RhamVcIikgJiYgIGJ0ZGFuZS5pbmNsdWRlcyhcIkJMOiBcIiArIHIudG9TdHJpbmcoKSArIFwiSlwiKSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChidGRhbmUuaW5jbHVkZXMoXCJwb21wYSBuaWUgcG9kYWplXCIpICYmICBidGRhbmUuaW5jbHVkZXMoXCJCTDogXCIgKyByLnRvU3RyaW5nKCkgKyBcIkpcIikgJiYgYnRkYW5lLmluY2x1ZGVzKG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgKyAnLScgKyAoJzAnICsgKE51bWJlcihuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpICYmIHRoaXMuYm9saG91ciA+IE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzc0xvZyhyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiT2Rwb3dpZWR6aSB6IHBvbXB5OlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBidGRhbmUudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkLFgsSFZCBvZHBvd2llZHppIHogcG9tcHk6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbGVjaWHFgiBixYJhZCBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDQwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuICBnZXRDYWxjRGF0YSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjemVrYWxlbSAyMzAwbXMgbmEga29sZWpuYSBwcm9iZSBwb2xhY3plbmlhIHByenkgYm9sXCIpO1xyXG4gICAgICAgICAgICAgIFRocmVhZC5zbGVlcCg3MDAwKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJmXCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hEYXRhd3cgPSAgZGFuZS5tYXRjaCh0aGlzLnd3KTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWlzZiA9ICBkYW5lLm1hdGNoKHRoaXMuaXNmKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWJncmFuZ2UgPSAgZGFuZS5tYXRjaCh0aGlzLmJnUmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXMlwiICsgbWF0Y2hEYXRhd3dbMV0sIG1hdGNoRGF0YXd3Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIldXV1czXCIgKyBtYXRjaERhdGFpc2ZbMV0sIG1hdGNoRGF0YWlzZi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXNFwiICsgbWF0Y2hEYXRhYmdyYW5nZVsxXSwgbWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IE51bWJlcihtYXRjaERhdGF3dy5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMud3cyLmV4ZWMobWF0Y2hEYXRhd3dbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWs6MTExMTExIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgTnVtYmVyKG1hdGNoRGF0YWlzZi5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuaXNmMi5leGVjKG1hdGNoRGF0YWlzZltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pazoyMjIyMjIgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBOdW1iZXIobWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuYmdSYW5nZTIuZXhlYyhtYXRjaERhdGFiZ3JhbmdlW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrOjMzMzMzMzMgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoZGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEYk1heChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERic3RlcChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJVc3Rhd2llbmlhIGthbGt1bGF0b3JhIGJvbHVzYSB6b3N0YcWCeSB6YXBpc2FuZSBkbyBiYXp5IGRhbnljaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYW5lLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENhbGNmcm9tTG9jYWxEYigpLnN1YnNjcmliZShkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDIwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbiAgZXJyb3JQdW1wU3Rhbigpe1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQ2/FmyBwb3N6xYJvIG5pZSB0YWtcIixcclxuICAgICAgbWVzc2FnZTogXCJTcHJhd2TFuiBzdGFuIHBvbXB5IVwiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiUHJ6eWrEhcWCZW0gZG8gd2lhZG9tb8WbY2lcIlxyXG4gICAgfTtcclxuICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gIH1cclxuICBzdWNjZXNzTG9nKHIpe1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQnJhd28hXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiVWRhxYJvIHNpxJkgcG9kYcSHIGJvbHVzOiBcIiArIHIudG9TdHJpbmcoKSArIFwiIEpcIiAsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICB9O1xyXG4gICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBlc3RhYmxpc2hDb25uZWN0aW9uV2l0aFB1bXAoKSB7XHJcbiAgICAvL3RoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgIC8vIHNldEludGVydmFsKCgpID0+IHRoaXMuc2NhbkFuZENvbm5lY3QoKSwgIDYwICogMTAwMCk7XHJcbiAgICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNldEFsYXJtKCk7XHJcbiAgICB0aGlzLnNjYW5BbmRDb25uZWN0KCk7XHJcbiAgICB0aGlzLmludDAgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksICA1ICogNjAgKiAxMDAwKTtcclxuICAgIGFwcFNldHRpbmdzLnNldE51bWJlcignaW50MCcsIHRoaXMuaW50MCk7XHJcblxyXG4gIH1cclxuXHJcblxyXG4gIHdhaXRPblJlYWR5KCkge1xyXG4gICAgc2V0VGltZW91dCggKCkgPT4geyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge2NvbnNvbGUubG9nKFwic3p1a2FtIHJlYWR5XCIpfSxcclxuICAgICAgKCkgPT4ge2NvbnNvbGUubG9nKFwid3l3YWxpxYJvIHBvbGFjemVuaWU/XCIpfSxcclxuICAgICAgKCkgPT4geyBjb25zb2xlLmxvZygnamFrIHRvIG1vemxpd2UgcHJ6ZWNpZXogbmllIG1hbSByZWE/Jyk7IHRoaXMudHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKTsgfSk7IH0sIDI1MDApXHJcbiAgfVxyXG4gIHdhaXRPblJlYWR5U3RvcCgpIHtcclxuICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgLy8gdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgICB0aGlzLmNoZWNTdGF0dXNQdW1wKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY2hlY1N0YXR1c1B1bXAoKXtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpLCA0MDApO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1cnVjaG9taW9uYVwiICkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVE9QIFBPTVBBQFwiKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0b3BcIik7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IHRoaXMuc3RhblB1bXAgPSBcIldZxYHEhENaIFBPTVDEmFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIFBPTVBBISEhQFwiKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0YXJ0XCIpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiB0aGlzLnN0YW5QdW1wID0gXCJXxYHEhENaIFBPTVDEmFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKX0pLCA1MDApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICwgNDAwKTtcclxuICB9XHJcblxyXG4gIHByZXZlbnRMb3dTdWdhcihhOiBudW1iZXIsIGI6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgaWYgKGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSkgJiYgYSA8PSBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3JhbmdlJywgNzUpICYmICEoYSA9PT0gMCkgJiYgIShhLnRvU3RyaW5nKCkgPT09ICcwMDAnKSAmJiBiLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ25vcm1hbCcpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJBS1QgV09KTllcIiArIGEgKyBiICsgYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYXV0bycsIGZhbHNlKSk7XHJcbiAgICAgICAgdGhpcy5zY2FuQW5kQ29ubmVjdFN0b3AoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUG9tcGEgd3lsXCIpO1xyXG4gICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwiYXV0b3N0b3BcIiwgbmV3IERhdGUoKS50b1N0cmluZygpLnN1YnN0cmluZygzLCAyMSkgKyBcIiBVV0FHQSEgUE9NUEEgWkFUUlpZTUFOQSBQUlpFWiBGVU5LQ0rEmCBBVVRPIFNUT1BcXG5cXG5cIik7XHJcbiAgICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLnNldFN0b3BOcygpO1xyXG4gICAgICAgICAgLy9uaWUgd2llbSBjemVtdSBhbGUgTlMgbmllIHJlYWd1amUgbmEgdGUgem1pYW55XHJcbiAgICAgICAgICAvL3RoaXMubmlnaHRzY291dEFwaVNlcnZpY2Uuc2V0U3RvcE5zRHMoKTtcclxuICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIkJBREQgQVNTIG5pZSB3eWxhY3pvbmFcIikpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpICYmIGEgPiBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3JhbmdlJywgNzUpICYmICEoYSA9PT0gMCkgJiYgIShhLnRvU3RyaW5nKCkgPT09ICcwMDAnKSAmJiBiLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3N1c3BlbmQnKSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJBS1QgV09KTlkzXCIgKyBhICsgYik7XHJcbiAgICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbXBhIHdsYWN6b25hXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EhIFBPTVBBIFdaTk9XSU9OQSBQUlpFWiBGVU5LQ0rEmCBBVVRPIFNUQVJUXFxuXFxuXCIpO1xyXG4gICAgICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLnNldFN0YXJ0TnMoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3d5c2xrYSBkYW55Y2ggZG8gbnMuLi4uJyk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5zZXRTdGFydE5zRHMoKTtcclxuICAgICAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiQkFERCBBU1MgMiBuaWUgd3lsYWN6b25hXCIpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJOaWUgdXp5d2FtIGF1dG8gc3RvcC9zdGFydDogXCIgKyBhICsgYik7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAvL05BIFRFU1RZIFRPIFdZTEFDWllMRU06XHJcbiAgICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG4gIHZhbGlkYXRlU21zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcGhvbmVOdW1iID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdwaG9uZU4nLCBudWxsKTtcclxuICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IG51bWVyIHRlbDpcIiArIHBob25lTnVtYik7XHJcbiAgICAgIGlmIChwaG9uZU51bWIgIT09IG51bGwgJiYgcGhvbmVOdW1iICE9PSAnUG9kYWogbnIgdGVsLiBvcGlla3VuYScpIHtcclxuICAgICAgICB0aGlzLnNtc1NlcnZpY2UuZ2V0SW5ib3hNZXNzYWdlc0Zyb21OdW1iZXIoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidG8gamVzdCB0cmVzYyBzbXNhOiBcIiArIHRoaXMuc21zU2VydmljZS5tZXNzYWdlLnRvVXBwZXJDYXNlKCkpO1xyXG4gICAgICAgICAgLy9jb25zdCBkYXRlTSA9IGFwcFNldHRpbmdzLmdldFN0cmluZygnZGF0ZU1lc3NhZ2VPbGQnLCAnJyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgZGF0YTogXCIgKyBuZXcgRGF0ZSgpLnZhbHVlT2YoKSArIFwiYSB0byBkYXRhIHNtc2E6IFwiICsgdGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlICsgXCIgYSB0byBqZXN0IGRhdGEgb2RqZXRhIG8gMTUgbWluIG8gc3lzZGF0ZTogXCIgKyAoTnVtYmVyKG5ldyBEYXRlKCkudmFsdWVPZigpKSAtIDk2MDAwMCkpO1xyXG4gICAgICAgICAgaWYgKHRoaXMuc21zU2VydmljZS5tZXNzYWdlLnRvVXBwZXJDYXNlKCkgPT09ICdTVE9QJyAmJiAhKHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSA9PT0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsICcnKSkgJiYgTnVtYmVyKHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSkgPiAoTnVtYmVyKG5ldyBEYXRlKCkudmFsdWVPZigpKSAtIDk2MDAwMCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zY2FuQW5kQ29ubmVjdFN0b3AoKS50aGVuKGEgPT4ge1xyXG4gICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZygnZGF0ZU1lc3NhZ2VPbGQnLCB0aGlzLnNtc1NlcnZpY2UuZGF0ZU1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgIHRoaXMuc21zU2VydmljZS5zZW5kU21zKCk7XHJcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIld5c2xpaiBzbXV0bmVnbyBzbXNhXCIpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQnJhayBrb21lbmR5IGRvIHd5a29uYW5pYVwiKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNoZWNrU291cmNlQmVmb3JlUHJldmVudChwYXJzZWREYXRlKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYmdzb3VyY2UnLCBmYWxzZSkgPT09IHRydWUpIHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLmdldEJHZnJvbU5zKCkudGhlbihzdmcgPT4ge2NvbnNvbGUubG9nKCBcIlRBQUFBQUFBQUFBSzI6IFwiICsgSlNPTi5zdHJpbmdpZnkoc3ZnKSk7XHJcbiAgICAgICAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN2Z1swXSkpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2cob2JqLnNndiwgc3ZnWzBdKTtcclxuICAgICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHZnJvbU5zKG9iai5zZ3YsIG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSwgMSk7XHJcbiAgICAgICAgICBjb25zdCBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgIGQuc2V0TWludXRlcyhkLmdldE1pbnV0ZXMoKSAtIDE2KTtcclxuICAgICAgICAgIGlmIChuZXcgRGF0ZShvYmouZGF0ZVN0cmluZykgPiBkKXtcclxuICAgICAgICAgICAgdGhpcy5wcmV2ZW50TG93U3VnYXIob2JqLnNndiwgcGFyc2VkRGF0ZS5zdGF0dXNQdW1wLnRvU3RyaW5nKCkpLnRoZW4oICgpID0+IHJlc29sdmUoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdGFyeSBjdWtpZXIgeiBOU1wiKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnByZXZlbnRMb3dTdWdhcihwYXJzZWREYXRlLmJsb29kR2x1Y29zZS52YWx1ZSwgcGFyc2VkRGF0ZS5zdGF0dXNQdW1wLnRvU3RyaW5nKCkpLnRoZW4oICgpID0+IHJlc29sdmUoKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuICB0cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpIHtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJzXCIpLCA0MTAwKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQyKCkuc3Vic2NyaWJlKGRhdGEgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdUT09PT086ICAgJyArIGRhdGEudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbignZmluaXNoJywgdHJ1ZSk7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbigncmV0cnknLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmJ0RGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBwYXJzZWREYXRlID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoZGF0YSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coICd0byBqZXN0IG90IG1pZWpzY2UgISEhISA6ICcgKyBwYXJzZWREYXRlLmJsb29kR2x1Y29zZS52YWx1ZSArICdhYWE6ICcgKyBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3ZhbHVlJywgMzIwKSArICBwYXJzZWREYXRlLmJsb29kR2x1Y29zZS5kYXRlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIGlmIChwYXJzZWREYXRlLmJsb29kR2x1Y29zZS52YWx1ZSA9PT0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCd2YWx1ZScsIDMyMCkgJiYgcGFyc2VkRGF0ZS5ibG9vZEdsdWNvc2UuZGF0ZS50b1N0cmluZygpID09PSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ2RhdGVCRycsICcwMC0wMC0wMCcpKSAge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1puYWxhemxlbSB0ZSBzYW1lIGRhbmUgY28gd2N6ZXNuaWVqIHdpZWMgcG9uYXdpYW0ga29tdW5pa2FjamU6Jyk7XHJcblxyXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnRyYW5zZmVyRGF0YUZyb21QdW1wVGhlblRvQXBpKCksIDExMDAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKCd2YWx1ZScsIHBhcnNlZERhdGUuYmxvb2RHbHVjb3NlLnZhbHVlKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZygnZGF0ZUJHJywgcGFyc2VkRGF0ZS5ibG9vZEdsdWNvc2UuZGF0ZS50b1N0cmluZygpKTtcclxuICAgICAgICAgIHRoaXMuc2VuZERhdGFUb0xvY2FsRGIocGFyc2VkRGF0ZSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FBQUFBIGRvc3psbycpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMihwYXJzZWREYXRlKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMyhwYXJzZWREYXRlKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGFUb0xvY2FsRGI0KHBhcnNlZERhdGUpKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDMoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZURTKCkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0KCkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVCRygpKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDIoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZVRyZWF0bWVudHMoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQ0KCkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVUZW1wQmFzYWwoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuY2hlY2tTb3VyY2VCZWZvcmVQcmV2ZW50KHBhcnNlZERhdGUpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc21zRmFjYWRlU2VydmljZS52YWxpZGF0ZVNtcygpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCkpKSlcclxuICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNub296ZVNjcmVlbkJ5Q2FsbCgpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICB9IH0pO1xyXG4gICAgfSwgNDIwMCk7XHJcbiAgfVxyXG4gIGNoZWNrT2xkQmcoKSB7XHJcblxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRBcnJvdyhvbGQ6IHN0cmluZykge1xyXG4gICAgaWYgKE51bWJlcihvbGQpID49IC01ICYmIE51bWJlcihvbGQpIDw9IDUpIHtcclxuICAgICAgb2xkID0gXCJGbGF0XCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPiA1ICYmIE51bWJlcihvbGQpIDwgMTApIHtcclxuICAgICAgb2xkID0gXCJGb3J0eUZpdmVVcFwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpID49IDEwKSB7XHJcbiAgICAgIG9sZCA9IFwiU2luZ2xlVXBcIjtcclxuICAgIH1cclxuICAgIGlmIChOdW1iZXIob2xkKSA8IC01ICYmIE51bWJlcihvbGQpID4gLTEwKSB7XHJcbiAgICAgIG9sZCA9IFwiRm9ydHlGaXZlRG93blwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpIDw9IC0xMCkge1xyXG4gICAgICBvbGQgPSBcIlNpbmdsZURvd25cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBvbGQ7XHJcbiAgfVxyXG59XHJcbiJdfQ==