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
            if (appSettings.getNumber('connection', 1) === 1) {
                console.log("poszedł prawdziwy reject11!!!!!" + uidBt + "       d");
                appSettings.setNumber('connection', 2);
                setTimeout(function () { return _this.scanAndConnect(); }, 7000);
            }
            else {
                appSettings.setNumber('connection', 1);
                //appSettings.setNumber('connection', 1);
                //setTimeout(() => this.scanAndConnect(), 7000);
            }
            return Promise.reject();
        }
        //Poczekaj na OK+CONN
        ).then(function () {
            _this.pumpBluetoothApiService.read7().subscribe(function () { return _this.pumpBluetoothApiService.sendCommand4("OK+CONN").then(function () { return console.log('asaAAAAAAAAAAAAAAAAAAAAsA'); }); }, function () { console.log('Polecial blad wiec proba wyla. bt, 5 sec , i connect again '); _this.pumpBluetoothApiService.disconnect(); setTimeout(function () { return _this.scanAndConnect(); }, 5000); }, function () {
                _this.transferDataFromPumpThenToApi();
            });
        }, function () {
            console.log('Chyba nie udalo sie polaczyc');
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
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1mYWNhZGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtZmFjYWRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFHbEQsNENBQXFDO0FBRXJDLGtFQUFnRTtBQUNoRSx3REFBc0Q7QUFDdEQsOEVBQTJFO0FBQzNFLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsd0VBQXFFO0FBQ3JFLGtEQUFvRDtBQUNwRCxzRUFBbUU7QUFDbkUsSUFBTyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7QUFLakM7SUFXRSwyQkFDVSxlQUFnQyxFQUNoQyxJQUFZLEVBQ1osZ0JBQWtDLEVBQ2xDLFVBQXNCLEVBQ3RCLG9CQUEwQyxFQUMxQyx1QkFBZ0QsRUFDaEQsY0FBOEIsRUFDOUIsaUJBQW9DO1FBUHBDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1oscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7UUFDMUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtRQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQWY5QyxhQUFRLEdBQVcsY0FBYyxDQUFDO1FBQ2xDLE9BQUUsR0FBRyxtRUFBbUUsQ0FBQztRQUN6RSxRQUFHLEdBQUcsa0VBQWtFLENBQUM7UUFDekUsUUFBRyxHQUFHLG1FQUFtRSxDQUFDO1FBQzFFLFNBQUksR0FBRyxrRUFBa0UsQ0FBQztRQUMxRSxZQUFPLEdBQUcscUVBQXFFLENBQUM7UUFDaEYsYUFBUSxHQUFHLG9FQUFvRSxDQUFDO1FBVzlFLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUNELG9D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eyBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XHJcbmltcG9ydCB7IHNldFN0cmluZyB9IGZyb20gJ2FwcGxpY2F0aW9uLXNldHRpbmdzJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gXCJyeGpzL29wZXJhdG9yc1wiO1xyXG5pbXBvcnQgeyBJQmFzaWNTZXR0aW5ncyB9IGZyb20gXCJ+L2FwcC9tb2RlbC9tZWQtbGluay5tb2RlbFwiO1xyXG5pbXBvcnQgeyBEYXRhYmFzZVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL2RhdGFiYXNlLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgU21zU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvc21zLXNlcnZpY2VcIjtcclxuaW1wb3J0IHsgTmlnaHRzY291dEFwaVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL25pZ2h0c2NvdXQtYXBpLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgUHVtcEJsdWV0b290aEFwaVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3B1bXAtYmx1ZXRvb3RoLWFwaS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFJhd0RhdGFTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9yYXctZGF0YS1wYXJzZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFdha2VGYWNhZGVTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC93YWtlLWZhY2FkZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCAqIGFzIGFwcFNldHRpbmdzIGZyb20gXCJhcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xyXG5pbXBvcnQgeyBTbXNGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL3Ntcy1mYWNhZGUuc2VydmljZSc7XHJcbmltcG9ydCBUaHJlYWQgPSBqYXZhLmxhbmcuVGhyZWFkO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46IFwicm9vdFwiXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEYXRhRmFjYWRlU2VydmljZSB7XHJcbiAgYnREYXRhOiBzdHJpbmc7XHJcbiAgYm9saG91cjogbnVtYmVyO1xyXG4gIGludDA6IG51bWJlcjtcclxuICBzdGFuUHVtcDogc3RyaW5nID0gXCJXIFRSQUtDSUUuLi5cIjtcclxuICB3dyA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHMoLlxcV1xcZHszfSlcXHNKXFwvV1dcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgd3cyID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccyguXFxXXFxkezN9KVxcc0pcXC9XV1xcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvO1xyXG4gIGlzZiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHNcXHM/KFxcZHsyLDN9KW1nLmRsXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS9nO1xyXG4gIGlzZjIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzXFxzPyhcXGR7MiwzfSltZy5kbFxcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvO1xyXG4gIGJnUmFuZ2UgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzPyhcXGR7MiwzfS0uXFxkezIsM30pXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS9nO1xyXG4gIGJnUmFuZ2UyID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccz8oXFxkezIsM30tLlxcZHsyLDN9KVxcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvO1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBkYXRhYmFzZVNlcnZpY2U6IERhdGFiYXNlU2VydmljZSxcclxuICAgIHByaXZhdGUgem9uZTogTmdab25lLFxyXG4gICAgcHJpdmF0ZSBzbXNGYWNhZGVTZXJ2aWNlOiBTbXNGYWNhZGVTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBzbXNTZXJ2aWNlOiBTbXNTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBuaWdodHNjb3V0QXBpU2VydmljZTogTmlnaHRzY291dEFwaVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlOiBQdW1wQmx1ZXRvb3RoQXBpU2VydmljZSxcclxuICAgIHByaXZhdGUgcmF3RGF0YVNlcnZpY2U6IFJhd0RhdGFTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB3YWtlRmFjYWRlU2VydmljZTogV2FrZUZhY2FkZVNlcnZpY2VcclxuICApIHtcclxuICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZVRhYmxlKCk7XHJcbiAgfVxyXG4gIGNsZWFySW50KCkge1xyXG4gICAgY2xlYXJJbnRlcnZhbChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ2ludDAnKSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYihwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0QkcocHVtcFN0YXR1cy5ibG9vZEdsdWNvc2UpO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGIyKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0VHJlYXRtZW50cyhwdW1wU3RhdHVzLmxhc3RCb2x1cyk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERCKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Q2FsYyhuZXcgRGF0ZSgpLnRvU3RyaW5nKCksIHB1bXBTdGF0dXMuY2FsYy5pZFZhbCwgcHVtcFN0YXR1cy5jYWxjLnZhbHVlLCBwdW1wU3RhdHVzLmNhbGMuaG91cnMsIHB1bXBTdGF0dXMuY2FsYy5jYXRlZ29yeSk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERiTWF4KHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Q2FsYyhuZXcgRGF0ZSgpLnRvU3RyaW5nKCksIDEsIHB1bXBTdGF0dXMubWF4aW11bUJvbHVzU2V0dGluZywgJzAwOjAwJywgJ21heCcpO1xyXG4gIH1cclxuICBzZW5kQ2FsY1RvTGFjYWxEYnN0ZXAocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgMSwgcHVtcFN0YXR1cy5pbmNyZW1lbnRTdGVwU2V0dGluZywgJzAwOjAwJywgJ3N0ZXAnKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiMyhwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydERldmljZVN0YXR1cyhcclxuICAgICAgcHVtcFN0YXR1cy5pbnN1bGluSW5Qb21wTGVmdCxcclxuICAgICAgcHVtcFN0YXR1cy5iYXR0ZXJ5Vm9sdGFnZSxcclxuICAgICAgcHVtcFN0YXR1cy5kYXRhLFxyXG4gICAgICBwdW1wU3RhdHVzLnN0YXR1c1B1bXBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYjQocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRUZW1wQmFzYWwoXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnBlcmNlbnRzT2ZCYXNlQmFzYWwsXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnRpbWVMZWZ0SW5NaW51dGVzLFxyXG4gICAgICBwdW1wU3RhdHVzLnRlbXBvcmFyeUJhc2FsTWV0aG9kUGVyY2VudGFnZS50aW1lc3RhbXBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIoKTogT2JzZXJ2YWJsZTxcclxuICAgIEFycmF5PHsgdmFsdWU6IG51bWJlcjsgZGF0ZTogRGF0ZTsgb2xkOiBzdHJpbmcgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRCRygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgdmFsdWU6ICthWzBdLFxyXG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoYVsxXSksXHJcbiAgICAgICAgICBvbGQ6IHRoaXMuc2V0QXJyb3coYVszXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YWZyb21Mb2NhbERiMigpOiBPYnNlcnZhYmxlPEFycmF5PHsgdmFsdWU6IG51bWJlcjsgZGF0ZTogRGF0ZSB9Pj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldFRyZWF0bWVudHMoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIHZhbHVlOiArYVswXSxcclxuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKGFbMV0pXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbiAgZ2V0Q2FsY2Zyb21Mb2NhbERiKCk6IE9ic2VydmFibGU8QXJyYXk8eyBpZFZhbDogbnVtYmVyOyBjYXRlZ29yeTogc3RyaW5nOyBkYXRlU3RyaW5nOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmc7IGhvdXI6IHN0cmluZzsgfT4+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRDYWxjKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICBpZFZhbDogK2FbMF0sXHJcbiAgICAgICAgICBjYXRlZ29yeTogYVsxXSxcclxuICAgICAgICAgIGRhdGVTdHJpbmc6IGFbMl0sXHJcbiAgICAgICAgICB2YWx1ZTogYVszXSxcclxuICAgICAgICAgIGhvdXI6IGFbNF1cclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YWZyb21Mb2NhbERiMygpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8e1xyXG4gICAgICByZXNlcnZvaXI6IG51bWJlcjtcclxuICAgICAgdm9sdGFnZTogbnVtYmVyO1xyXG4gICAgICBkYXRlU3RyaW5nOiBEYXRlO1xyXG4gICAgICBwZXJjZW50OiBudW1iZXI7XHJcbiAgICAgIHN0YXR1czogc3RyaW5nO1xyXG4gICAgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXREUygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgcmVzZXJ2b2lyOiArYVswXSxcclxuICAgICAgICAgIHZvbHRhZ2U6ICthWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogbmV3IERhdGUoYVsyXSksXHJcbiAgICAgICAgICBwZXJjZW50OiArYVszXSxcclxuICAgICAgICAgIHN0YXR1czogYVs0XVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGI0KCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7IHBlcmNlbnRzT2ZCYXNhbDogbnVtYmVyOyBtaW51dGVzOiBudW1iZXI7IGRhdGVTdHJpbmc6IERhdGUgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRUZW1wQmFzYWwoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIHBlcmNlbnRzT2ZCYXNhbDogK2FbMF0sXHJcbiAgICAgICAgICBtaW51dGVzOiArYVsxXSxcclxuICAgICAgICAgIGRhdGVTdHJpbmc6IG5ldyBEYXRlKGFbMl0pXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGIoKS5zdWJzY3JpYmUoZ2x1Y29zZXMgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3QkcoZ2x1Y29zZXMpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgc3VjY2Vzc1ZhbHVlID0+IHJlc29sdmUoc3VjY2Vzc1ZhbHVlKSxcclxuICAgICAgICAgICAgZXJyb3JWYWx1ZSA9PiByZWplY3QoZXJyb3JWYWx1ZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YXRvTmlnaHRzY291dDIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYjIoKS5zdWJzY3JpYmUodHJlYXRtZW50cyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdCb2wodHJlYXRtZW50cylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0MygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiMygpLnN1YnNjcmliZShkZXZpY2VTdGF0dXMgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3RGV2aWNlc3RhdHVzKGRldmljZVN0YXR1cylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgZ2V0RGF0YUZyb21OaWdodHNjb3V0KCkge1xyXG4gICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5nZXRCR2Zyb21OcygpLnRoZW4oc3ZnID0+IHtjb25zb2xlLmxvZyggXCJUQUFBQUFBQUFBQUsyOiBcIiArIEpTT04uc3RyaW5naWZ5KHN2ZykpO1xyXG4gICAgY29uc3Qgb2JqID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzdmdbMF0pKTtcclxuICAgIGNvbnNvbGUubG9nKG9iai5zZ3YsIHN2Z1swXSk7XHJcbiAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCR2Zyb21OcyhvYmouc2d2LCBuZXcgRGF0ZShvYmouZGF0ZVN0cmluZyksIDEpO1xyXG4gICAgIC8vIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHKEpTT04uc3RyaW5naWZ5KHN2ZykpXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0NCgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiNCgpLnN1YnNjcmliZSh0ZW1wYmFzYWwgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3VGVtcEJhc2FsKHRlbXBiYXNhbClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2NhbkFuZENvbm5lY3QoKSB7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRCb29sZWFuKCdmaW5pc2gnLCBmYWxzZSk7XHJcbiAgICAvL3RoaXMubmlnaHRzY291dEFwaVNlcnZpY2UuQmdDaGVjaygpO1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVWRhxYJvIHBvxYLEhWN6ecSHIHNpxJkgejogXCIgKyB1aWRCdCk7XHJcbiAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdOaWUgcG9sYWN6eWwgc2llIGplZG5ha15eJyk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ2Nvbm5lY3Rpb24nLCAxKSA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldE51bWJlcignY29ubmVjdGlvbicsIDIpO1xyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zY2FuQW5kQ29ubmVjdCgpLCA3MDAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoJ2Nvbm5lY3Rpb24nLCAxKTtcclxuICAgICAgICAgICAgICAvL2FwcFNldHRpbmdzLnNldE51bWJlcignY29ubmVjdGlvbicsIDEpO1xyXG4gICAgICAgICAgICAgIC8vc2V0VGltZW91dCgoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksIDcwMDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy9Qb2N6ZWthaiBuYSBPSytDT05OXHJcbiAgICAgICAgKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDcoKS5zdWJzY3JpYmUoXHJcbiAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kNChcIk9LK0NPTk5cIikudGhlbiggKCkgPT4gY29uc29sZS5sb2coJ2FzYUFBQUFBQUFBQUFBQUFBQUFBQUFBc0EnKSkgLFxyXG4gICAgICAgICgpID0+IHsgY29uc29sZS5sb2coJ1BvbGVjaWFsIGJsYWQgd2llYyBwcm9iYSB3eWxhLiBidCwgNSBzZWMgLCBpIGNvbm5lY3QgYWdhaW4gJyk7IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpOyBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksIDUwMDApOyB9LFxyXG4gICAgICAgICgpID0+ICAge1xyXG4gICAgICAgICAgdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnQ2h5YmEgbmllIHVkYWxvIHNpZSBwb2xhY3p5YycgKTtcclxuICAgICAgICAgIC8vdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIHNwcmF3ZHogY3p5IG5pZSByb3psYWN6eWxvIHBvIDEyIHNlYyB6IEJUIGkgdyByYXppZSBjbyBwb27Ds3cgcG/FgsSFY3plbmllLlxyXG4gICAgICAgICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignZmluaXNoJywgdHJ1ZSkpe1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdLb25pZWMgcHJvY2VzdSAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYnRCb29sZWFuJywgZmFsc2UpIHx8IGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ3JldHJ5JywgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWtjamEgeiBwb25hd2lhbmllbSBvZHdvbGFuYScpO1xyXG4gICAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbigncmV0cnknLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3plcndhbG8gcG9sYWN6ZW5pZSB3aWVjIHBvbmF3aWFtIGplc3pjemUgcmF6IG9kIHJhenUnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oJ3JldHJ5JywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDE1ICogMTAwMCk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnTk4nKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgfVxyXG5cclxuICAgc2NhbkFuZENvbm5lY3RTdG9wKCkge1xyXG4gICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAudGhlbih1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImN6ZWthbGVtIDIzMDBtcyBuYSBrb2xlam5hIHByb2JlIHBvbGFjemVuaWEgcHJ6eSBib2xcIik7XHJcbiAgICAgICAgICAgIFRocmVhZC5zbGVlcCg3MDAwKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpLnRoZW4oXHJcbiAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQyICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlhhWGFYYVhhWGFcIik7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoY29uc29sZS5sb2coXCJhZGFtMjMzMzMzMzNcIikpO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRBbGVydCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCksIDYzICogMTAwMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpO1xyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpXHJcbiAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGFuZS50b1N0cmluZygpLmluY2x1ZGVzKFwidXJ1Y2hvbWlvbmFcIikgfHwgZGFuZS50b1N0cmluZygpLmluY2x1ZGVzKFwicG9kYWplXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1RPUCBQT01QQVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdG9wXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkNSgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IGFwcFNldHRpbmdzLnNldFN0cmluZyhcInB1bXBTdGFuXCIsIFwiV1pOw5NXIFBPTVDEmFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2Uuc2V0U3RvcE5zKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIFBPTVBBISEhMlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpBV0lFxZogUE9NUMSYXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5zZXRTdGFydE5zKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgLCA0MDApO1xyXG4gICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgY29uc29sZS5sb2coXCJUb3RhbG5hIHpzc3NhamVia2FcIik7XHJcbiAgICAgIHJlamVjdCgpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgfVxyXG4gIHNjYW5BbmRDb25uZWN0Qk9MKHIpIHtcclxuICAgIC8vICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLndha2VTY3JlZW5CeUNhbGwoKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcblxyXG4gICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicG9zemVkxYIgcHJhd2R6aXd5IHJlamVjdDExISEhISFcIiArIHVpZEJ0ICsgXCIgICAgICAgZFwiKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImN6ZWthbGVtIDIzMDBtcyBuYSBrb2xlam5hIHByb2JlIHBvbGFjemVuaWEgcHJ6eSBib2xcIik7XHJcbiAgICAgICAgICAgICAgVGhyZWFkLnNsZWVwKDcwMDApO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGltZW91dEFsZXJ0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSwgNjkgKiAxMDAwKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJ4XCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiICsgZGFuZSArIFwia29uaWVjIGRhbnljaCAvIHd5bmlrdVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1c3Rhd1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGFraSBib2x1cyB6b3N0YWwgbmFzdGF3aW9ueTogXCIgKyByICsgJ3ogdGFrYSBkYXRhOiAnICsgbmV3IERhdGUoKS5nZXREYXRlKCkudG9TdHJpbmcoKSArICctJyArICgnMCcgKyAoTnVtYmVyKG5ldyBEYXRlKCkuZ2V0TW9udGgoKSkgKyAxICkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiYm9sdXMgIFwiICsgcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDYoKS5zdWJzY3JpYmUoYnRkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImJ0ZGFuZTogISEhISEhISEhISEhIVwiICsgYnRkYW5lLnRvU3RyaW5nKCkgKyBcImtvbmllYyEhIVwiICsgbmV3IERhdGUoKS5nZXREYXkoKS50b1N0cmluZygpICsgJy0nICsgbmV3IERhdGUoKS5nZXRNb250aCgpLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBkLnNldE1pbnV0ZXMoZC5nZXRNaW51dGVzKCkgLSA2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBib2xob3VycyA9IGJ0ZGFuZS50b1N0cmluZygpLm1hdGNoKC8oXFxkezJ9OlxcZHsyfSkvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYm9saG91cnMgIT09IG51bGwgJiYgYm9saG91cnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IFsxXSBcIiArIGJvbGhvdXJzWzFdICsgXCIgYSB0byB6ZXJvOiBcIiArIGJvbGhvdXJzWzBdICsgXCJBIHRvIHBvIHpyenV0b3dhbml1IGRvIG51bWJlcmE6IFwiICsgTnVtYmVyKGJvbGhvdXJzWzFdLnJlcGxhY2UoJzonLCAnJykpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYm9saG91ciA9IE51bWJlcihib2xob3Vyc1sxXS5yZXBsYWNlKCc6JywgJycpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGFraWUgY29zIHd5c3psbzogXCIgKyBOdW1iZXIoKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYnRkYW5lMTogISEhISEhISEhISEhISBcIiArIHRoaXMuYm9saG91ciArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkgICsgXCIga29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJvbGhvdXIgPSA5OTk5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpZSBjb3Mgd3lzemxvOiBcIiArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJidGRhbmUyIDogISEhISEhISEhISEhISBcIiArIHRoaXMuYm9saG91ciArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkgICsgXCIga29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIiBnb2R6aW5hOiBcIiArICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIiBUYWtpIGJvbHVzIHpvc3RhbCBuYXN0YXdpb255OiBcIiArIHIgKyAneiB0YWthIGRhdGE6ICcgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEgKS50b1N0cmluZygpKS5zbGljZSgtMikudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChidGRhbmUuaW5jbHVkZXMoXCJwb21wYSBwb2RhamVcIikgJiYgIGJ0ZGFuZS5pbmNsdWRlcyhcIkJMOiBcIiArIHIudG9TdHJpbmcoKSArIFwiSlwiKSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChidGRhbmUuaW5jbHVkZXMoXCJwb21wYSBuaWUgcG9kYWplXCIpICYmICBidGRhbmUuaW5jbHVkZXMoXCJCTDogXCIgKyByLnRvU3RyaW5nKCkgKyBcIkpcIikgJiYgYnRkYW5lLmluY2x1ZGVzKG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgKyAnLScgKyAoJzAnICsgKE51bWJlcihuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpICYmIHRoaXMuYm9saG91ciA+IE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzc0xvZyhyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiT2Rwb3dpZWR6aSB6IHBvbXB5OlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBidGRhbmUudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkLFgsSFZCBvZHBvd2llZHppIHogcG9tcHk6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbGVjaWHFgiBixYJhZCBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDQwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuICBnZXRDYWxjRGF0YSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjemVrYWxlbSAyMzAwbXMgbmEga29sZWpuYSBwcm9iZSBwb2xhY3plbmlhIHByenkgYm9sXCIpO1xyXG4gICAgICAgICAgICAgIFRocmVhZC5zbGVlcCg3MDAwKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJmXCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hEYXRhd3cgPSAgZGFuZS5tYXRjaCh0aGlzLnd3KTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWlzZiA9ICBkYW5lLm1hdGNoKHRoaXMuaXNmKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWJncmFuZ2UgPSAgZGFuZS5tYXRjaCh0aGlzLmJnUmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXMlwiICsgbWF0Y2hEYXRhd3dbMV0sIG1hdGNoRGF0YXd3Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIldXV1czXCIgKyBtYXRjaERhdGFpc2ZbMV0sIG1hdGNoRGF0YWlzZi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXNFwiICsgbWF0Y2hEYXRhYmdyYW5nZVsxXSwgbWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IE51bWJlcihtYXRjaERhdGF3dy5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMud3cyLmV4ZWMobWF0Y2hEYXRhd3dbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWs6MTExMTExIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgTnVtYmVyKG1hdGNoRGF0YWlzZi5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuaXNmMi5leGVjKG1hdGNoRGF0YWlzZltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pazoyMjIyMjIgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBOdW1iZXIobWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuYmdSYW5nZTIuZXhlYyhtYXRjaERhdGFiZ3JhbmdlW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrOjMzMzMzMzMgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoZGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEYk1heChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERic3RlcChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJVc3Rhd2llbmlhIGthbGt1bGF0b3JhIGJvbHVzYSB6b3N0YcWCeSB6YXBpc2FuZSBkbyBiYXp5IGRhbnljaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYW5lLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENhbGNmcm9tTG9jYWxEYigpLnN1YnNjcmliZShkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDIwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbiAgZXJyb3JQdW1wU3Rhbigpe1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQ2/FmyBwb3N6xYJvIG5pZSB0YWtcIixcclxuICAgICAgbWVzc2FnZTogXCJTcHJhd2TFuiBzdGFuIHBvbXB5IVwiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiUHJ6eWrEhcWCZW0gZG8gd2lhZG9tb8WbY2lcIlxyXG4gICAgfTtcclxuICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gIH1cclxuICBzdWNjZXNzTG9nKHIpe1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQnJhd28hXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiVWRhxYJvIHNpxJkgcG9kYcSHIGJvbHVzOiBcIiArIHIudG9TdHJpbmcoKSArIFwiIEpcIiAsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICB9O1xyXG4gICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBlc3RhYmxpc2hDb25uZWN0aW9uV2l0aFB1bXAoKSB7XHJcbiAgICAvL3RoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgIC8vIHNldEludGVydmFsKCgpID0+IHRoaXMuc2NhbkFuZENvbm5lY3QoKSwgIDYwICogMTAwMCk7XHJcbiAgICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNldEFsYXJtKCk7XHJcbiAgICB0aGlzLnNjYW5BbmRDb25uZWN0KCk7XHJcbiAgICB0aGlzLmludDAgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksICA1ICogNjAgKiAxMDAwKTtcclxuICAgIGFwcFNldHRpbmdzLnNldE51bWJlcignaW50MCcsIHRoaXMuaW50MCk7XHJcblxyXG4gIH1cclxuXHJcblxyXG4gIHdhaXRPblJlYWR5KCkge1xyXG4gICAgc2V0VGltZW91dCggKCkgPT4geyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge2NvbnNvbGUubG9nKFwic3p1a2FtIHJlYWR5XCIpfSxcclxuICAgICAgKCkgPT4ge2NvbnNvbGUubG9nKFwid3l3YWxpxYJvIHBvbGFjemVuaWU/XCIpfSxcclxuICAgICAgKCkgPT4geyBjb25zb2xlLmxvZygnamFrIHRvIG1vemxpd2UgcHJ6ZWNpZXogbmllIG1hbSByZWE/Jyk7IHRoaXMudHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKTsgfSk7IH0sIDI1MDApXHJcbiAgfVxyXG4gIHdhaXRPblJlYWR5U3RvcCgpIHtcclxuICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgLy8gdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgICB0aGlzLmNoZWNTdGF0dXNQdW1wKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY2hlY1N0YXR1c1B1bXAoKXtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpLCA0MDApO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1cnVjaG9taW9uYVwiICkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVE9QIFBPTVBBQFwiKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0b3BcIik7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IHRoaXMuc3RhblB1bXAgPSBcIldZxYHEhENaIFBPTVDEmFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIFBPTVBBISEhQFwiKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0YXJ0XCIpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiB0aGlzLnN0YW5QdW1wID0gXCJXxYHEhENaIFBPTVDEmFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKX0pLCA1MDApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICwgNDAwKTtcclxuICB9XHJcblxyXG4gIHByZXZlbnRMb3dTdWdhcihhOiBudW1iZXIsIGI6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgaWYgKGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSkgJiYgYSA8PSBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3JhbmdlJywgNzUpICYmICEoYSA9PT0gMCkgJiYgIShhLnRvU3RyaW5nKCkgPT09ICcwMDAnKSAmJiBiLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ25vcm1hbCcpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJBS1QgV09KTllcIiArIGEgKyBiICsgYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYXV0bycsIGZhbHNlKSk7XHJcbiAgICAgICAgdGhpcy5zY2FuQW5kQ29ubmVjdFN0b3AoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiUG9tcGEgd3lsXCIpO1xyXG4gICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwiYXV0b3N0b3BcIiwgbmV3IERhdGUoKS50b1N0cmluZygpLnN1YnN0cmluZygzLCAyMSkgKyBcIiBVV0FHQSEgUE9NUEEgWkFUUlpZTUFOQSBQUlpFWiBGVU5LQ0rEmCBBVVRPIFNUT1BcXG5cXG5cIik7XHJcbiAgICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLnNldFN0b3BOcygpO1xyXG4gICAgICAgICAgLy9uaWUgd2llbSBjemVtdSBhbGUgTlMgbmllIHJlYWd1amUgbmEgdGUgem1pYW55XHJcbiAgICAgICAgICAvL3RoaXMubmlnaHRzY291dEFwaVNlcnZpY2Uuc2V0U3RvcE5zRHMoKTtcclxuICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIkJBREQgQVNTIG5pZSB3eWxhY3pvbmFcIikpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpICYmIGEgPiBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3JhbmdlJywgNzUpICYmICEoYSA9PT0gMCkgJiYgIShhLnRvU3RyaW5nKCkgPT09ICcwMDAnKSAmJiBiLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3N1c3BlbmQnKSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJBS1QgV09KTlkzXCIgKyBhICsgYik7XHJcbiAgICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbXBhIHdsYWN6b25hXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EhIFBPTVBBIFdaTk9XSU9OQSBQUlpFWiBGVU5LQ0rEmCBBVVRPIFNUQVJUXFxuXFxuXCIpO1xyXG4gICAgICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLnNldFN0YXJ0TnMoKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3d5c2xrYSBkYW55Y2ggZG8gbnMuLi4uJyk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5zZXRTdGFydE5zRHMoKTtcclxuICAgICAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiQkFERCBBU1MgMiBuaWUgd3lsYWN6b25hXCIpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJOaWUgdXp5d2FtIGF1dG8gc3RvcC9zdGFydDogXCIgKyBhICsgYik7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAvL05BIFRFU1RZIFRPIFdZTEFDWllMRU06XHJcbiAgICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG4gIHZhbGlkYXRlU21zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3QgcGhvbmVOdW1iID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdwaG9uZU4nLCBudWxsKTtcclxuICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IG51bWVyIHRlbDpcIiArIHBob25lTnVtYik7XHJcbiAgICAgIGlmIChwaG9uZU51bWIgIT09IG51bGwgJiYgcGhvbmVOdW1iICE9PSAnUG9kYWogbnIgdGVsLiBvcGlla3VuYScpIHtcclxuICAgICAgICB0aGlzLnNtc1NlcnZpY2UuZ2V0SW5ib3hNZXNzYWdlc0Zyb21OdW1iZXIoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidG8gamVzdCB0cmVzYyBzbXNhOiBcIiArIHRoaXMuc21zU2VydmljZS5tZXNzYWdlLnRvVXBwZXJDYXNlKCkpO1xyXG4gICAgICAgICAgLy9jb25zdCBkYXRlTSA9IGFwcFNldHRpbmdzLmdldFN0cmluZygnZGF0ZU1lc3NhZ2VPbGQnLCAnJyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgZGF0YTogXCIgKyBuZXcgRGF0ZSgpLnZhbHVlT2YoKSArIFwiYSB0byBkYXRhIHNtc2E6IFwiICsgdGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlICsgXCIgYSB0byBqZXN0IGRhdGEgb2RqZXRhIG8gMTUgbWluIG8gc3lzZGF0ZTogXCIgKyAoTnVtYmVyKG5ldyBEYXRlKCkudmFsdWVPZigpKSAtIDk2MDAwMCkpO1xyXG4gICAgICAgICAgaWYgKHRoaXMuc21zU2VydmljZS5tZXNzYWdlLnRvVXBwZXJDYXNlKCkgPT09ICdTVE9QJyAmJiAhKHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSA9PT0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsICcnKSkgJiYgTnVtYmVyKHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSkgPiAoTnVtYmVyKG5ldyBEYXRlKCkudmFsdWVPZigpKSAtIDk2MDAwMCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zY2FuQW5kQ29ubmVjdFN0b3AoKS50aGVuKGEgPT4ge1xyXG4gICAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZygnZGF0ZU1lc3NhZ2VPbGQnLCB0aGlzLnNtc1NlcnZpY2UuZGF0ZU1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgIHRoaXMuc21zU2VydmljZS5zZW5kU21zKCk7XHJcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIld5c2xpaiBzbXV0bmVnbyBzbXNhXCIpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQnJhayBrb21lbmR5IGRvIHd5a29uYW5pYVwiKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNoZWNrU291cmNlQmVmb3JlUHJldmVudChwYXJzZWREYXRlKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYmdzb3VyY2UnLCBmYWxzZSkgPT09IHRydWUpIHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLmdldEJHZnJvbU5zKCkudGhlbihzdmcgPT4ge2NvbnNvbGUubG9nKCBcIlRBQUFBQUFBQUFBSzI6IFwiICsgSlNPTi5zdHJpbmdpZnkoc3ZnKSk7XHJcbiAgICAgICAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN2Z1swXSkpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2cob2JqLnNndiwgc3ZnWzBdKTtcclxuICAgICAgICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHZnJvbU5zKG9iai5zZ3YsIG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSwgMSk7XHJcbiAgICAgICAgICBjb25zdCBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgIGQuc2V0TWludXRlcyhkLmdldE1pbnV0ZXMoKSAtIDE2KTtcclxuICAgICAgICAgIGlmIChuZXcgRGF0ZShvYmouZGF0ZVN0cmluZykgPiBkKXtcclxuICAgICAgICAgICAgdGhpcy5wcmV2ZW50TG93U3VnYXIob2JqLnNndiwgcGFyc2VkRGF0ZS5zdGF0dXNQdW1wLnRvU3RyaW5nKCkpLnRoZW4oICgpID0+IHJlc29sdmUoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdGFyeSBjdWtpZXIgeiBOU1wiKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnByZXZlbnRMb3dTdWdhcihwYXJzZWREYXRlLmJsb29kR2x1Y29zZS52YWx1ZSwgcGFyc2VkRGF0ZS5zdGF0dXNQdW1wLnRvU3RyaW5nKCkpLnRoZW4oICgpID0+IHJlc29sdmUoKSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuICB0cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpIHtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJzXCIpLCA0MTAwKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQyKCkuc3Vic2NyaWJlKGRhdGEgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdUT09PT086ICAgJyArIGRhdGEudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbignZmluaXNoJywgdHJ1ZSk7XHJcbiAgICAgICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbigncmV0cnknLCB0cnVlKTtcclxuICAgICAgICB0aGlzLmJ0RGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcclxuICAgICAgICBjb25zdCBwYXJzZWREYXRlID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoZGF0YSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coICd0byBqZXN0IG90IG1pZWpzY2UgISEhISA6ICcgKyBwYXJzZWREYXRlLmJsb29kR2x1Y29zZS52YWx1ZSArICdhYWE6ICcgKyBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3ZhbHVlJywgMzIwKSArICBwYXJzZWREYXRlLmJsb29kR2x1Y29zZS5kYXRlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIGlmIChwYXJzZWREYXRlLmJsb29kR2x1Y29zZS52YWx1ZSA9PT0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCd2YWx1ZScsIDMyMCkgJiYgcGFyc2VkRGF0ZS5ibG9vZEdsdWNvc2UuZGF0ZS50b1N0cmluZygpID09PSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ2RhdGVCRycsICcwMC0wMC0wMCcpKSAge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1puYWxhemxlbSB0ZSBzYW1lIGRhbmUgY28gd2N6ZXNuaWVqIHdpZWMgcG9uYXdpYW0ga29tdW5pa2FjamU6Jyk7XHJcblxyXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnRyYW5zZmVyRGF0YUZyb21QdW1wVGhlblRvQXBpKCksIDExMDAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKCd2YWx1ZScsIHBhcnNlZERhdGUuYmxvb2RHbHVjb3NlLnZhbHVlKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZygnZGF0ZUJHJywgcGFyc2VkRGF0ZS5ibG9vZEdsdWNvc2UuZGF0ZS50b1N0cmluZygpKTtcclxuICAgICAgICAgIHRoaXMuc2VuZERhdGFUb0xvY2FsRGIocGFyc2VkRGF0ZSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FBQUFBIGRvc3psbycpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMihwYXJzZWREYXRlKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMyhwYXJzZWREYXRlKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGFUb0xvY2FsRGI0KHBhcnNlZERhdGUpKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDMoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZURTKCkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0KCkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVCRygpKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDIoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZVRyZWF0bWVudHMoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQ0KCkpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVUZW1wQmFzYWwoKSlcclxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuY2hlY2tTb3VyY2VCZWZvcmVQcmV2ZW50KHBhcnNlZERhdGUpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc21zRmFjYWRlU2VydmljZS52YWxpZGF0ZVNtcygpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCkpKSlcclxuICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNub296ZVNjcmVlbkJ5Q2FsbCgpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICB9IH0pO1xyXG4gICAgfSwgNDIwMCk7XHJcbiAgfVxyXG4gIGNoZWNrT2xkQmcoKSB7XHJcblxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRBcnJvdyhvbGQ6IHN0cmluZykge1xyXG4gICAgaWYgKE51bWJlcihvbGQpID49IC01ICYmIE51bWJlcihvbGQpIDw9IDUpIHtcclxuICAgICAgb2xkID0gXCJGbGF0XCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPiA1ICYmIE51bWJlcihvbGQpIDwgMTApIHtcclxuICAgICAgb2xkID0gXCJGb3J0eUZpdmVVcFwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpID49IDEwKSB7XHJcbiAgICAgIG9sZCA9IFwiU2luZ2xlVXBcIjtcclxuICAgIH1cclxuICAgIGlmIChOdW1iZXIob2xkKSA8IC01ICYmIE51bWJlcihvbGQpID4gLTEwKSB7XHJcbiAgICAgIG9sZCA9IFwiRm9ydHlGaXZlRG93blwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpIDw9IC0xMCkge1xyXG4gICAgICBvbGQgPSBcIlNpbmdsZURvd25cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBvbGQ7XHJcbiAgfVxyXG59XHJcbiJdfQ==