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
        this.pumpBluetoothApiService.scanAndConnect()
            .then(function (uidBt) {
            if (uidBt === "MED-LINK" || uidBt === "MED-LINK-2" || uidBt === "MED-LINK-3" || uidBt === "HMSoft") {
                console.log("Udało połączyć się z: " + uidBt);
                return Promise.resolve(uidBt);
            }
            else {
                return Promise.reject();
            }
        }, function (uidBt) {
            console.log("poszedł prawdziwy reject11!!!!!" + uidBt + "       d");
            return _this.pumpBluetoothApiService.scanAndConnect().then(function (uidBt2) {
                if (uidBt2 === "MED-LINK" || uidBt2 === "MED-LINK-2" || uidBt2 === "MED-LINK-3" || uidBt2 === "HMSoft") {
                    console.log(uidBt2 + "BBBBBBBBBBBBBBBBBBBBB");
                    return Promise.resolve(uidBt2);
                }
                else {
                    console.log(uidBt2 + "Nie udalo sie polaczyc booo status 133");
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
            _this.waitOnReady();
        }, function () {
            console.log("zatem nie czekam na ready");
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
        this.pumpBluetoothApiService.read().subscribe(function () {
            _this.transferDataFromPumpThenToApi();
        });
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
                }, function () { return console.log("BADD ASS nie wylaczona"); });
            }
            else {
                if (appSettings.getBoolean('auto', false) && a > appSettings.getNumber('range', 75) && !(a === 0) && !(a.toString() === '000') && b.toLowerCase().includes('suspend')) {
                    console.log("AKT WOJNY3" + a + b);
                    _this.scanAndConnectStop().then(function () {
                        console.log("Pompa wlaczona");
                        resolve();
                        appSettings.setString("autostop", new Date().toString().substring(3, 21) + " UWAGA! POMPA WZNOWIONA PRZEZ FUNKCJĘ AUTO START\n\n");
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
        setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand2("s"); }, 400);
        setTimeout(function () {
            _this.pumpBluetoothApiService.read2().subscribe(function (data) {
                console.log('TOOOOO:   ' + data.toString());
                _this.btData = data.toString();
                var parsedDate = _this.rawDataService.parseData(data);
                _this.sendDataToLocalDb(parsedDate)
                    .then(function () { console.log('AAAAA doszlo'); _this.sendDataToLocalDb2(parsedDate); })
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
            });
        }, 400);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1mYWNhZGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtZmFjYWRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFFbEQsNENBQXFDO0FBRXJDLGtFQUFnRTtBQUNoRSx3REFBc0Q7QUFDdEQsOEVBQTJFO0FBQzNFLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsd0VBQXFFO0FBQ3JFLGtEQUFvRDtBQUNwRCxzRUFBbUU7QUFLbkU7SUFXRSwyQkFDVSxlQUFnQyxFQUNoQyxJQUFZLEVBQ1osZ0JBQWtDLEVBQ2xDLFVBQXNCLEVBQ3RCLG9CQUEwQyxFQUMxQyx1QkFBZ0QsRUFDaEQsY0FBOEIsRUFDOUIsaUJBQW9DO1FBUHBDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1oscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7UUFDMUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtRQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQWY5QyxhQUFRLEdBQVcsY0FBYyxDQUFDO1FBQ2xDLE9BQUUsR0FBRyxtRUFBbUUsQ0FBQztRQUN6RSxRQUFHLEdBQUcsa0VBQWtFLENBQUM7UUFDekUsUUFBRyxHQUFHLG1FQUFtRSxDQUFDO1FBQzFFLFNBQUksR0FBRyxrRUFBa0UsQ0FBQztRQUMxRSxZQUFPLEdBQUcscUVBQXFFLENBQUM7UUFDaEYsYUFBUSxHQUFHLG9FQUFvRSxDQUFDO1FBVzlFLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUNELG9DQUFRLEdBQVI7UUFDRSxhQUFhLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENB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QUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtZQUN6QyxHQUFHLEdBQUcsZUFBZSxDQUFDO1NBQ3ZCO1FBQ0QsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDdEIsR0FBRyxHQUFHLFlBQVksQ0FBQztTQUNwQjtRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQTN2QlUsaUJBQWlCO1FBSDdCLGlCQUFVLENBQUM7WUFDVixVQUFVLEVBQUUsTUFBTTtTQUNuQixDQUFDO3lDQWEyQixrQ0FBZTtZQUMxQixhQUFNO1lBQ00scUNBQWdCO1lBQ3RCLHdCQUFVO1lBQ0EsNkNBQW9CO1lBQ2pCLG9EQUF1QjtZQUNoQyx1Q0FBYztZQUNYLHVDQUFpQjtPQW5CbkMsaUJBQWlCLENBNHZCN0I7SUFBRCx3QkFBQztDQUFBLEFBNXZCRCxJQTR2QkM7QUE1dkJZLDhDQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gXCJyeGpzL29wZXJhdG9yc1wiO1xyXG5pbXBvcnQgeyBJQmFzaWNTZXR0aW5ncyB9IGZyb20gXCJ+L2FwcC9tb2RlbC9tZWQtbGluay5tb2RlbFwiO1xyXG5pbXBvcnQgeyBEYXRhYmFzZVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL2RhdGFiYXNlLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgU21zU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvc21zLXNlcnZpY2VcIjtcclxuaW1wb3J0IHsgTmlnaHRzY291dEFwaVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL25pZ2h0c2NvdXQtYXBpLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgUHVtcEJsdWV0b290aEFwaVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3B1bXAtYmx1ZXRvb3RoLWFwaS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFJhd0RhdGFTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9yYXctZGF0YS1wYXJzZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFdha2VGYWNhZGVTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC93YWtlLWZhY2FkZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCAqIGFzIGFwcFNldHRpbmdzIGZyb20gXCJhcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xyXG5pbXBvcnQgeyBTbXNGYWNhZGVTZXJ2aWNlIH0gZnJvbSAnfi9hcHAvc2hhcmVkL3Ntcy1mYWNhZGUuc2VydmljZSc7XHJcblxyXG5ASW5qZWN0YWJsZSh7XHJcbiAgcHJvdmlkZWRJbjogXCJyb290XCJcclxufSlcclxuZXhwb3J0IGNsYXNzIERhdGFGYWNhZGVTZXJ2aWNlIHtcclxuICBidERhdGE6IHN0cmluZztcclxuICBib2xob3VyOiBudW1iZXI7XHJcbiAgaW50MDogbnVtYmVyO1xyXG4gIHN0YW5QdW1wOiBzdHJpbmcgPSBcIlcgVFJBS0NJRS4uLlwiO1xyXG4gIHd3ID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccyguXFxXXFxkezN9KVxcc0pcXC9XV1xcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvZztcclxuICB3dzIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzKC5cXFdcXGR7M30pXFxzSlxcL1dXXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgaXNmID0gL3pha3Jlc1xccyhcXGR7MX0pOlxcc1xccz8oXFxkezIsM30pbWcuZGxcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgaXNmMiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHNcXHM/KFxcZHsyLDN9KW1nLmRsXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgYmdSYW5nZSA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHM/KFxcZHsyLDN9LS5cXGR7MiwzfSlcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgYmdSYW5nZTIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzPyhcXGR7MiwzfS0uXFxkezIsM30pXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGRhdGFiYXNlU2VydmljZTogRGF0YWJhc2VTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUsXHJcbiAgICBwcml2YXRlIHNtc0ZhY2FkZVNlcnZpY2U6IFNtc0ZhY2FkZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHNtc1NlcnZpY2U6IFNtc1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIG5pZ2h0c2NvdXRBcGlTZXJ2aWNlOiBOaWdodHNjb3V0QXBpU2VydmljZSxcclxuICAgIHByaXZhdGUgcHVtcEJsdWV0b290aEFwaVNlcnZpY2U6IFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByYXdEYXRhU2VydmljZTogUmF3RGF0YVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHdha2VGYWNhZGVTZXJ2aWNlOiBXYWtlRmFjYWRlU2VydmljZVxyXG4gICkge1xyXG4gICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuY3JlYXRlVGFibGUoKTtcclxuICB9XHJcbiAgY2xlYXJJbnQoKSB7XHJcbiAgICBjbGVhckludGVydmFsKGFwcFNldHRpbmdzLmdldE51bWJlcignaW50MCcpKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCRyhwdW1wU3RhdHVzLmJsb29kR2x1Y29zZSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYjIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRUcmVhdG1lbnRzKHB1bXBTdGF0dXMubGFzdEJvbHVzKTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsREIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgcHVtcFN0YXR1cy5jYWxjLmlkVmFsLCBwdW1wU3RhdHVzLmNhbGMudmFsdWUsIHB1bXBTdGF0dXMuY2FsYy5ob3VycywgcHVtcFN0YXR1cy5jYWxjLmNhdGVnb3J5KTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsRGJNYXgocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgMSwgcHVtcFN0YXR1cy5tYXhpbXVtQm9sdXNTZXR0aW5nLCAnMDA6MDAnLCAnbWF4Jyk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERic3RlcChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydENhbGMobmV3IERhdGUoKS50b1N0cmluZygpLCAxLCBwdW1wU3RhdHVzLmluY3JlbWVudFN0ZXBTZXR0aW5nLCAnMDA6MDAnLCAnc3RlcCcpO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGIzKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0RGV2aWNlU3RhdHVzKFxyXG4gICAgICBwdW1wU3RhdHVzLmluc3VsaW5JblBvbXBMZWZ0LFxyXG4gICAgICBwdW1wU3RhdHVzLmJhdHRlcnlWb2x0YWdlLFxyXG4gICAgICBwdW1wU3RhdHVzLmRhdGEsXHJcbiAgICAgIHB1bXBTdGF0dXMuc3RhdHVzUHVtcFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiNChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydFRlbXBCYXNhbChcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UucGVyY2VudHNPZkJhc2VCYXNhbCxcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UudGltZUxlZnRJbk1pbnV0ZXMsXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnRpbWVzdGFtcFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYigpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlOyBvbGQ6IHN0cmluZyB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldEJHKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICB2YWx1ZTogK2FbMF0sXHJcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShhWzFdKSxcclxuICAgICAgICAgIG9sZDogdGhpcy5zZXRBcnJvdyhhWzNdKVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIyKCk6IE9ic2VydmFibGU8QXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlIH0+PiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0VHJlYXRtZW50cygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgdmFsdWU6ICthWzBdLFxyXG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoYVsxXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuICBnZXRDYWxjZnJvbUxvY2FsRGIoKTogT2JzZXJ2YWJsZTxBcnJheTx7IGlkVmFsOiBudW1iZXI7IGNhdGVnb3J5OiBzdHJpbmc7IGRhdGVTdHJpbmc6IHN0cmluZzsgdmFsdWU6IHN0cmluZzsgaG91cjogc3RyaW5nOyB9Pj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldENhbGMoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIGlkVmFsOiArYVswXSxcclxuICAgICAgICAgIGNhdGVnb3J5OiBhWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogYVsyXSxcclxuICAgICAgICAgIHZhbHVlOiBhWzNdLFxyXG4gICAgICAgICAgaG91cjogYVs0XVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIzKCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7XHJcbiAgICAgIHJlc2Vydm9pcjogbnVtYmVyO1xyXG4gICAgICB2b2x0YWdlOiBudW1iZXI7XHJcbiAgICAgIGRhdGVTdHJpbmc6IERhdGU7XHJcbiAgICAgIHBlcmNlbnQ6IG51bWJlcjtcclxuICAgICAgc3RhdHVzOiBzdHJpbmc7XHJcbiAgICB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldERTKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICByZXNlcnZvaXI6ICthWzBdLFxyXG4gICAgICAgICAgdm9sdGFnZTogK2FbMV0sXHJcbiAgICAgICAgICBkYXRlU3RyaW5nOiBuZXcgRGF0ZShhWzJdKSxcclxuICAgICAgICAgIHBlcmNlbnQ6ICthWzNdLFxyXG4gICAgICAgICAgc3RhdHVzOiBhWzRdXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYjQoKTogT2JzZXJ2YWJsZTxcclxuICAgIEFycmF5PHsgcGVyY2VudHNPZkJhc2FsOiBudW1iZXI7IG1pbnV0ZXM6IG51bWJlcjsgZGF0ZVN0cmluZzogRGF0ZSB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldFRlbXBCYXNhbCgpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgcGVyY2VudHNPZkJhc2FsOiArYVswXSxcclxuICAgICAgICAgIG1pbnV0ZXM6ICthWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogbmV3IERhdGUoYVsyXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYigpLnN1YnNjcmliZShnbHVjb3NlcyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdCRyhnbHVjb3NlcylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0MigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiMigpLnN1YnNjcmliZSh0cmVhdG1lbnRzID0+IHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2VuZE5ld0JvbCh0cmVhdG1lbnRzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGIzKCkuc3Vic2NyaWJlKGRldmljZVN0YXR1cyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdEZXZpY2VzdGF0dXMoZGV2aWNlU3RhdHVzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBnZXREYXRhRnJvbU5pZ2h0c2NvdXQoKSB7XHJcbiAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLmdldEJHZnJvbU5zKCkudGhlbihzdmcgPT4ge2NvbnNvbGUubG9nKCBcIlRBQUFBQUFBQUFBSzI6IFwiICsgSlNPTi5zdHJpbmdpZnkoc3ZnKSk7XHJcbiAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN2Z1swXSkpO1xyXG4gICAgY29uc29sZS5sb2cob2JqLnNndiwgc3ZnWzBdKTtcclxuICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHZnJvbU5zKG9iai5zZ3YsIG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSwgMSk7XHJcbiAgICAgLy8gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0QkcoSlNPTi5zdHJpbmdpZnkoc3ZnKSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGI0KCkuc3Vic2NyaWJlKHRlbXBiYXNhbCA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdUZW1wQmFzYWwodGVtcGJhc2FsKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzY2FuQW5kQ29ubmVjdCgpIHtcclxuICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVkYcWCbyBwb8WCxIVjennEhyBzacSZIHo6IFwiICsgdWlkQnQpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICB1aWRCdDIgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVpZEJ0MiA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0MiA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQyID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdDIgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQyICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vIHN0YXR1cyAxMzNcIlxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWGFYYVhhWGFYYVwiKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiamVkbmFrIG5pZSB1ZGFsbyBzaWUgemEgMlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJPSytDT05OXCIpLFxyXG4gICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLndhaXRPblJlYWR5KCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG5cclxuICB9XHJcbiAgIHNjYW5BbmRDb25uZWN0U3RvcCgpIHtcclxuICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgIC5zY2FuQW5kQ29ubmVjdCgpXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicG9zemVkxYIgcHJhd2R6aXd5IHJlamVjdDExISEhISFcIiArIHVpZEJ0ICsgXCIgICAgICAgZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJYYVhhWGFYYVhhXCIpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgMjUwMFxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSB3eXNsYW0gb2sga29uYVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0QWxlcnQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpLCA2MyAqIDEwMDApO1xyXG4gICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwiYVwiKTtcclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKVxyXG4gICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWtcIisgZGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhbmUudG9TdHJpbmcoKS5pbmNsdWRlcyhcInVydWNob21pb25hXCIpIHx8IGRhbmUudG9TdHJpbmcoKS5pbmNsdWRlcyhcInBvZGFqZVwiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUT1AgUE9NUEFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RvcFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDUoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIldaTsOTVyBQT01QxJhcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVEFSVCBQT01QQSEhITJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RhcnRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQ0KCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56b25lLnJ1biAoKCkgPT4gYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJaQVdJRcWaIFBPTVDEmFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgLCA0MDApO1xyXG4gICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgY29uc29sZS5sb2coXCJUb3RhbG5hIHpzc3NhamVia2FcIik7XHJcbiAgICAgIHJlamVjdCgpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgfVxyXG4gIHNjYW5BbmRDb25uZWN0Qk9MKHIpIHtcclxuICAgIC8vICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLndha2VTY3JlZW5CeUNhbGwoKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGltZW91dEFsZXJ0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSwgNjkgKiAxMDAwKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJ4XCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiICsgZGFuZSArIFwia29uaWVjIGRhbnljaCAvIHd5bmlrdVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1c3Rhd1wiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGFraSBib2x1cyB6b3N0YWwgbmFzdGF3aW9ueTogXCIgKyByICsgJ3ogdGFrYSBkYXRhOiAnICsgbmV3IERhdGUoKS5nZXREYXRlKCkudG9TdHJpbmcoKSArICctJyArICgnMCcgKyAoTnVtYmVyKG5ldyBEYXRlKCkuZ2V0TW9udGgoKSkgKyAxICkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiYm9sdXMgIFwiICsgcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDYoKS5zdWJzY3JpYmUoYnRkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImJ0ZGFuZTogISEhISEhISEhISEhIVwiICsgYnRkYW5lLnRvU3RyaW5nKCkgKyBcImtvbmllYyEhIVwiICsgbmV3IERhdGUoKS5nZXREYXkoKS50b1N0cmluZygpICsgJy0nICsgbmV3IERhdGUoKS5nZXRNb250aCgpLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBkLnNldE1pbnV0ZXMoZC5nZXRNaW51dGVzKCkgLSA2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBib2xob3VycyA9IGJ0ZGFuZS50b1N0cmluZygpLm1hdGNoKC8oXFxkezJ9OlxcZHsyfSkvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYm9saG91cnMgIT09IG51bGwgJiYgYm9saG91cnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IFsxXSBcIiArIGJvbGhvdXJzWzFdICsgXCIgYSB0byB6ZXJvOiBcIiArIGJvbGhvdXJzWzBdICsgXCJBIHRvIHBvIHpyenV0b3dhbml1IGRvIG51bWJlcmE6IFwiICsgTnVtYmVyKGJvbGhvdXJzWzFdLnJlcGxhY2UoJzonLCAnJykpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYm9saG91ciA9IE51bWJlcihib2xob3Vyc1sxXS5yZXBsYWNlKCc6JywgJycpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGFraWUgY29zIHd5c3psbzogXCIgKyBOdW1iZXIoKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYnRkYW5lMTogISEhISEhISEhISEhISBcIiArIHRoaXMuYm9saG91ciArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkgICsgXCIga29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJvbGhvdXIgPSA5OTk5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpZSBjb3Mgd3lzemxvOiBcIiArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJidGRhbmUyIDogISEhISEhISEhISEhISBcIiArIHRoaXMuYm9saG91ciArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkgICsgXCIga29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIiBnb2R6aW5hOiBcIiArICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIiBUYWtpIGJvbHVzIHpvc3RhbCBuYXN0YXdpb255OiBcIiArIHIgKyAneiB0YWthIGRhdGE6ICcgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEgKS50b1N0cmluZygpKS5zbGljZSgtMikudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChidGRhbmUuaW5jbHVkZXMoXCJwb21wYSBwb2RhamVcIikgJiYgIGJ0ZGFuZS5pbmNsdWRlcyhcIkJMOiBcIiArIHIudG9TdHJpbmcoKSArIFwiSlwiKSkgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChidGRhbmUuaW5jbHVkZXMoXCJwb21wYSBuaWUgcG9kYWplXCIpICYmICBidGRhbmUuaW5jbHVkZXMoXCJCTDogXCIgKyByLnRvU3RyaW5nKCkgKyBcIkpcIikgJiYgYnRkYW5lLmluY2x1ZGVzKG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgKyAnLScgKyAoJzAnICsgKE51bWJlcihuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpICYmIHRoaXMuYm9saG91ciA+IE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzc0xvZyhyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiT2Rwb3dpZWR6aSB6IHBvbXB5OlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBidGRhbmUudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkLFgsSFZCBvZHBvd2llZHppIHogcG9tcHk6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbGVjaWHFgiBixYJhZCBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDQwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuICBnZXRDYWxjRGF0YSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwiZlwiKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YXd3ID0gIGRhbmUubWF0Y2godGhpcy53dyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaERhdGFpc2YgPSAgZGFuZS5tYXRjaCh0aGlzLmlzZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaERhdGFiZ3JhbmdlID0gIGRhbmUubWF0Y2godGhpcy5iZ1JhbmdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV1dXVzJcIiArIG1hdGNoRGF0YXd3WzFdLCBtYXRjaERhdGF3dy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXM1wiICsgbWF0Y2hEYXRhaXNmWzFdLCBtYXRjaERhdGFpc2YubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV1dXVzRcIiArIG1hdGNoRGF0YWJncmFuZ2VbMV0sIG1hdGNoRGF0YWJncmFuZ2UubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBOdW1iZXIobWF0Y2hEYXRhd3cubGVuZ3RoKTsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRhbTMgPSB0aGlzLnd3Mi5leGVjKG1hdGNoRGF0YXd3W2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrOjExMTExMSBcIiArIGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWREYXRlMjIgPSB0aGlzLnJhd0RhdGFTZXJ2aWNlLnBhcnNlRGF0YShhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEQihwYXJzZWREYXRlMjIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IE51bWJlcihtYXRjaERhdGFpc2YubGVuZ3RoKTsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRhbTMgPSB0aGlzLmlzZjIuZXhlYyhtYXRjaERhdGFpc2ZbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWs6MjIyMjIyIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgTnVtYmVyKG1hdGNoRGF0YWJncmFuZ2UubGVuZ3RoKTsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRhbTMgPSB0aGlzLmJnUmFuZ2UyLmV4ZWMobWF0Y2hEYXRhYmdyYW5nZVtpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pazozMzMzMzMzIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWREYXRlMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGRhbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy90aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsRGJNYXgocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEYnN0ZXAocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiVXN0YXdpZW5pYSBrYWxrdWxhdG9yYSBib2x1c2Egem9zdGHFgnkgemFwaXNhbmUgZG8gYmF6eSBkYW55Y2hcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDYWxjZnJvbUxvY2FsRGIoKS5zdWJzY3JpYmUoZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSlcclxuICAgICAgICAgICAgICAgICAgLCAyMDApO1xyXG4gICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIGN6ZWthbSBuYSByZWFkeVwiKTtcclxuICAgICAgICAgICAgICB0aGlzLmVycm9yUHVtcFN0YW4oKTtcclxuICAgICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICB9IGNhdGNoIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRvdGFsbmEgenNzc2FqZWJrYVwiKTtcclxuICAgICAgICByZWplY3QoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4gIGVycm9yUHVtcFN0YW4oKXtcclxuICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJaTUlFxYMgU1RBTiBQT01QWVwiKTtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgIHRpdGxlOiBcIkNvxZsgcG9zesWCbyBuaWUgdGFrXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiU3ByYXdkxbogc3RhbiBwb21weSFcIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIlByenlqxIXFgmVtIGRvIHdpYWRvbW/Fm2NpXCJcclxuICAgIH07XHJcbiAgICBhbGVydChvcHRpb25zKTtcclxuICB9XHJcbiAgc3VjY2Vzc0xvZyhyKXtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgIHRpdGxlOiBcIkJyYXdvIVwiLFxyXG4gICAgICBtZXNzYWdlOiBcIlVkYcWCbyBzacSZIHBvZGHEhyBib2x1czogXCIgKyByLnRvU3RyaW5nKCkgKyBcIiBKXCIgLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgfTtcclxuICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgZXN0YWJsaXNoQ29ubmVjdGlvbldpdGhQdW1wKCkge1xyXG4gICAgLy90aGlzLnNjYW5BbmRDb25uZWN0KCk7XHJcbiAgICAvLyBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksICA2MCAqIDEwMDApO1xyXG4gICAgdGhpcy53YWtlRmFjYWRlU2VydmljZS5zZXRBbGFybSgpO1xyXG4gICAgdGhpcy5zY2FuQW5kQ29ubmVjdCgpO1xyXG4gICAgdGhpcy5pbnQwID0gc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5zY2FuQW5kQ29ubmVjdCgpLCAgNSAqIDYwICogMTAwMCk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXROdW1iZXIoJ2ludDAnLCB0aGlzLmludDApO1xyXG5cclxuICB9XHJcblxyXG5cclxuICB3YWl0T25SZWFkeSgpIHtcclxuICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgIHRoaXMudHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICB3YWl0T25SZWFkeVN0b3AoKSB7XHJcbiAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgIC8vIHRoaXMudHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKTtcclxuICAgICAgdGhpcy5jaGVjU3RhdHVzUHVtcCgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNoZWNTdGF0dXNQdW1wKCl7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwiYVwiKSwgNDAwKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpXHJcbiAgICAgICAgLnN1YnNjcmliZSggZGFuZSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWtcIisgZGFuZSk7XHJcbiAgICAgICAgICBpZiAoZGFuZS50b1N0cmluZygpLmluY2x1ZGVzKFwidXJ1Y2hvbWlvbmFcIiApKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1RPUCBQT01QQUBcIik7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdG9wXCIpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiB0aGlzLnN0YW5QdW1wID0gXCJXWcWBxIRDWiBQT01QxJhcIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgIH0pLCA1MDApO1xyXG4gICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVEFSVCBQT01QQSEhIUBcIik7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy56b25lLnJ1biAoKCkgPT4gdGhpcy5zdGFuUHVtcCA9IFwiV8WBxIRDWiBQT01QxJhcIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCl9KSwgNTAwKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAsIDQwMCk7XHJcbiAgfVxyXG5cclxuICBwcmV2ZW50TG93U3VnYXIoYTogbnVtYmVyLCBiOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpICYmIGEgPD0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCdyYW5nZScsIDc1KSAmJiAhKGEgPT09IDApICYmICEoYS50b1N0cmluZygpID09PSAnMDAwJykgJiYgYi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdub3JtYWwnKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUtUIFdPSk5ZXCIgKyBhICsgYiArIGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSkpO1xyXG4gICAgICAgIHRoaXMuc2NhbkFuZENvbm5lY3RTdG9wKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbXBhIHd5bFwiKTtcclxuICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EhIFBPTVBBIFpBVFJaWU1BTkEgUFJaRVogRlVOS0NKxJggQVVUTyBTVE9QXFxuXFxuXCIpO1xyXG4gICAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiQkFERCBBU1MgbmllIHd5bGFjem9uYVwiKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSkgJiYgYSA+IGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSkgJiYgIShhID09PSAwKSAmJiAhKGEudG9TdHJpbmcoKSA9PT0gJzAwMCcpICYmIGIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnc3VzcGVuZCcpKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkFLVCBXT0pOWTNcIiArIGEgKyBiKTtcclxuICAgICAgICAgIHRoaXMuc2NhbkFuZENvbm5lY3RTdG9wKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUG9tcGEgd2xhY3pvbmFcIik7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwiYXV0b3N0b3BcIiwgbmV3IERhdGUoKS50b1N0cmluZygpLnN1YnN0cmluZygzLCAyMSkgKyBcIiBVV0FHQSEgUE9NUEEgV1pOT1dJT05BIFBSWkVaIEZVTktDSsSYIEFVVE8gU1RBUlRcXG5cXG5cIik7XHJcbiAgICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIkJBREQgQVNTIDIgbmllIHd5bGFjem9uYVwiKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTmllIHV6eXdhbSBhdXRvIHN0b3Avc3RhcnQ6IFwiICsgYSArIGIpO1xyXG4gICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgLy9OQSBURVNUWSBUTyBXWUxBQ1pZTEVNOlxyXG4gICAgICAgICAgLy90aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuICB2YWxpZGF0ZVNtcygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHBob25lTnVtYiA9IGFwcFNldHRpbmdzLmdldFN0cmluZygncGhvbmVOJywgbnVsbCk7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwidG8gamVzdCBudW1lciB0ZWw6XCIgKyBwaG9uZU51bWIpO1xyXG4gICAgICBpZiAocGhvbmVOdW1iICE9PSBudWxsICYmIHBob25lTnVtYiAhPT0gJ1BvZGFqIG5yIHRlbC4gb3BpZWt1bmEnKSB7XHJcbiAgICAgICAgdGhpcy5zbXNTZXJ2aWNlLmdldEluYm94TWVzc2FnZXNGcm9tTnVtYmVyKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgdHJlc2Mgc21zYTogXCIgKyB0aGlzLnNtc1NlcnZpY2UubWVzc2FnZS50b1VwcGVyQ2FzZSgpKTtcclxuICAgICAgICAgIC8vY29uc3QgZGF0ZU0gPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ2RhdGVNZXNzYWdlT2xkJywgJycpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IGRhdGE6IFwiICsgbmV3IERhdGUoKS52YWx1ZU9mKCkgKyBcImEgdG8gZGF0YSBzbXNhOiBcIiArIHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSArIFwiIGEgdG8gamVzdCBkYXRhIG9kamV0YSBvIDE1IG1pbiBvIHN5c2RhdGU6IFwiICsgKE51bWJlcihuZXcgRGF0ZSgpLnZhbHVlT2YoKSkgLSA5NjAwMDApKTtcclxuICAgICAgICAgIGlmICh0aGlzLnNtc1NlcnZpY2UubWVzc2FnZS50b1VwcGVyQ2FzZSgpID09PSAnU1RPUCcgJiYgISh0aGlzLnNtc1NlcnZpY2UuZGF0ZU1lc3NhZ2UgPT09IGFwcFNldHRpbmdzLmdldFN0cmluZygnZGF0ZU1lc3NhZ2VPbGQnLCAnJykpICYmIE51bWJlcih0aGlzLnNtc1NlcnZpY2UuZGF0ZU1lc3NhZ2UpID4gKE51bWJlcihuZXcgRGF0ZSgpLnZhbHVlT2YoKSkgLSA5NjAwMDApKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2NhbkFuZENvbm5lY3RTdG9wKCkudGhlbihhID0+IHtcclxuICAgICAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoJ2RhdGVNZXNzYWdlT2xkJywgdGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlKTtcclxuICAgICAgICAgICAgICB0aGlzLnNtc1NlcnZpY2Uuc2VuZFNtcygpO1xyXG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSwgKCkgPT4gY29uc29sZS5sb2coXCJXeXNsaWogc211dG5lZ28gc21zYVwiKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkJyYWsga29tZW5keSBkbyB3eWtvbmFuaWFcIik7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuICBjaGVja1NvdXJjZUJlZm9yZVByZXZlbnQocGFyc2VkRGF0ZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgaWYgKGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2Jnc291cmNlJywgZmFsc2UpID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5nZXRCR2Zyb21OcygpLnRoZW4oc3ZnID0+IHtjb25zb2xlLmxvZyggXCJUQUFBQUFBQUFBQUsyOiBcIiArIEpTT04uc3RyaW5naWZ5KHN2ZykpO1xyXG4gICAgICAgICAgY29uc3Qgb2JqID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzdmdbMF0pKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKG9iai5zZ3YsIHN2Z1swXSk7XHJcbiAgICAgICAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCR2Zyb21OcyhvYmouc2d2LCBuZXcgRGF0ZShvYmouZGF0ZVN0cmluZyksIDEpO1xyXG4gICAgICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICBkLnNldE1pbnV0ZXMoZC5nZXRNaW51dGVzKCkgLSAxNik7XHJcbiAgICAgICAgICBpZiAobmV3IERhdGUob2JqLmRhdGVTdHJpbmcpID4gZCl7XHJcbiAgICAgICAgICAgIHRoaXMucHJldmVudExvd1N1Z2FyKG9iai5zZ3YsIHBhcnNlZERhdGUuc3RhdHVzUHVtcC50b1N0cmluZygpKS50aGVuKCAoKSA9PiByZXNvbHZlKCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3RhcnkgY3VraWVyIHogTlNcIik7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5wcmV2ZW50TG93U3VnYXIocGFyc2VkRGF0ZS5ibG9vZEdsdWNvc2UudmFsdWUsIHBhcnNlZERhdGUuc3RhdHVzUHVtcC50b1N0cmluZygpKS50aGVuKCAoKSA9PiByZXNvbHZlKCkpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbiAgdHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKSB7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwic1wiKSwgNDAwKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQyKCkuc3Vic2NyaWJlKGRhdGEgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdUT09PT086ICAgJyArIGRhdGEudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgdGhpcy5idERhdGEgPSBkYXRhLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgY29uc3QgcGFyc2VkRGF0ZSA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGRhdGEpO1xyXG4gICAgICAgICAgdGhpcy5zZW5kRGF0YVRvTG9jYWxEYihwYXJzZWREYXRlKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7IGNvbnNvbGUubG9nKCdBQUFBQSBkb3N6bG8nKTsgdGhpcy5zZW5kRGF0YVRvTG9jYWxEYjIocGFyc2VkRGF0ZSk7IH0pXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGFUb0xvY2FsRGIzKHBhcnNlZERhdGUpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhVG9Mb2NhbERiNChwYXJzZWREYXRlKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDMoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlRFMoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dCgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVCRygpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0MigpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVUcmVhdG1lbnRzKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQ0KCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZVRlbXBCYXNhbCgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiAgdGhpcy5jaGVja1NvdXJjZUJlZm9yZVByZXZlbnQocGFyc2VkRGF0ZSlcclxuICAgICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNtc0ZhY2FkZVNlcnZpY2UudmFsaWRhdGVTbXMoKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCkpKSlcclxuICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNub296ZVNjcmVlbkJ5Q2FsbCgpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sIDQwMCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldEFycm93KG9sZDogc3RyaW5nKSB7XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPj0gLTUgJiYgTnVtYmVyKG9sZCkgPD0gNSkge1xyXG4gICAgICBvbGQgPSBcIkZsYXRcIjtcclxuICAgIH1cclxuICAgIGlmIChOdW1iZXIob2xkKSA+IDUgJiYgTnVtYmVyKG9sZCkgPCAxMCkge1xyXG4gICAgICBvbGQgPSBcIkZvcnR5Rml2ZVVwXCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPj0gMTApIHtcclxuICAgICAgb2xkID0gXCJTaW5nbGVVcFwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpIDwgLTUgJiYgTnVtYmVyKG9sZCkgPiAtMTApIHtcclxuICAgICAgb2xkID0gXCJGb3J0eUZpdmVEb3duXCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPD0gLTEwKSB7XHJcbiAgICAgIG9sZCA9IFwiU2luZ2xlRG93blwiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9sZDtcclxuICB9XHJcbn1cclxuIl19