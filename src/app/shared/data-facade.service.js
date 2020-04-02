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
                            if (dane.toString().includes("uruchomiona")) {
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
                                console.log("START POMPA!!!");
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
                console.log("STOP POMPA");
                _this.pumpBluetoothApiService.sendCommand("stop");
                setTimeout(function () { return _this.pumpBluetoothApiService.read3().subscribe(function () {
                    _this.zone.run(function () { return _this.stanPump = "WYŁĄCZ POMPĘ"; });
                    _this.pumpBluetoothApiService.disconnect();
                }); }, 500);
            }
            else {
                console.log("START POMPA!!!");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1mYWNhZGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtZmFjYWRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFFbEQsNENBQXFDO0FBRXJDLGtFQUFnRTtBQUNoRSx3REFBc0Q7QUFDdEQsOEVBQTJFO0FBQzNFLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsd0VBQXFFO0FBQ3JFLGtEQUFvRDtBQUNwRCxzRUFBbUU7QUFLbkU7SUFXRSwyQkFDVSxlQUFnQyxFQUNoQyxJQUFZLEVBQ1osZ0JBQWtDLEVBQ2xDLFVBQXNCLEVBQ3RCLG9CQUEwQyxFQUMxQyx1QkFBZ0QsRUFDaEQsY0FBOEIsRUFDOUIsaUJBQW9DO1FBUHBDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1oscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUNsQyxlQUFVLEdBQVYsVUFBVSxDQUFZO1FBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7UUFDMUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtRQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQWY5QyxhQUFRLEdBQVcsY0FBYyxDQUFDO1FBQ2xDLE9BQUUsR0FBRyxtRUFBbUUsQ0FBQztRQUN6RSxRQUFHLEdBQUcsa0VBQWtFLENBQUM7UUFDekUsUUFBRyxHQUFHLG1FQUFtRSxDQUFDO1FBQzFFLFNBQUksR0FBRyxrRUFBa0UsQ0FBQztRQUMxRSxZQUFPLEdBQUcscUVBQXFFLENBQUM7UUFDaEYsYUFBUSxHQUFHLG9FQUFvRSxDQUFDO1FBVzlFLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUNELG9DQUFRLEdBQVI7UUFDRSxhQUFhLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENB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QUcsQ0FBQyxFQUFFLEVBQUU7WUFDekMsR0FBRyxHQUFHLGVBQWUsQ0FBQztTQUN2QjtRQUNELElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ3RCLEdBQUcsR0FBRyxZQUFZLENBQUM7U0FDcEI7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUEzdkJVLGlCQUFpQjtRQUg3QixpQkFBVSxDQUFDO1lBQ1YsVUFBVSxFQUFFLE1BQU07U0FDbkIsQ0FBQzt5Q0FhMkIsa0NBQWU7WUFDMUIsYUFBTTtZQUNNLHFDQUFnQjtZQUN0Qix3QkFBVTtZQUNBLDZDQUFvQjtZQUNqQixvREFBdUI7WUFDaEMsdUNBQWM7WUFDWCx1Q0FBaUI7T0FuQm5DLGlCQUFpQixDQTR2QjdCO0lBQUQsd0JBQUM7Q0FBQSxBQTV2QkQsSUE0dkJDO0FBNXZCWSw4Q0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XHJcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xyXG5pbXBvcnQgeyBtYXAgfSBmcm9tIFwicnhqcy9vcGVyYXRvcnNcIjtcclxuaW1wb3J0IHsgSUJhc2ljU2V0dGluZ3MgfSBmcm9tIFwifi9hcHAvbW9kZWwvbWVkLWxpbmsubW9kZWxcIjtcclxuaW1wb3J0IHsgRGF0YWJhc2VTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9kYXRhYmFzZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFNtc1NlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3Ntcy1zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IE5pZ2h0c2NvdXRBcGlTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9uaWdodHNjb3V0LWFwaS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9wdW1wLWJsdWV0b290aC1hcGkuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBSYXdEYXRhU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvcmF3LWRhdGEtcGFyc2Uuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBXYWtlRmFjYWRlU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvd2FrZS1mYWNhZGUuc2VydmljZVwiO1xyXG5pbXBvcnQgKiBhcyBhcHBTZXR0aW5ncyBmcm9tIFwiYXBwbGljYXRpb24tc2V0dGluZ3NcIjtcclxuaW1wb3J0IHsgU21zRmFjYWRlU2VydmljZSB9IGZyb20gJ34vYXBwL3NoYXJlZC9zbXMtZmFjYWRlLnNlcnZpY2UnO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46IFwicm9vdFwiXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEYXRhRmFjYWRlU2VydmljZSB7XHJcbiAgYnREYXRhOiBzdHJpbmc7XHJcbiAgYm9saG91cjogbnVtYmVyO1xyXG4gIGludDA6IG51bWJlcjtcclxuICBzdGFuUHVtcDogc3RyaW5nID0gXCJXIFRSQUtDSUUuLi5cIjtcclxuICB3dyA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHMoLlxcV1xcZHszfSlcXHNKXFwvV1dcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgd3cyID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccyguXFxXXFxkezN9KVxcc0pcXC9XV1xcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvO1xyXG4gIGlzZiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHNcXHM/KFxcZHsyLDN9KW1nLmRsXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS9nO1xyXG4gIGlzZjIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzXFxzPyhcXGR7MiwzfSltZy5kbFxcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvO1xyXG4gIGJnUmFuZ2UgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzPyhcXGR7MiwzfS0uXFxkezIsM30pXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS9nO1xyXG4gIGJnUmFuZ2UyID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccz8oXFxkezIsM30tLlxcZHsyLDN9KVxcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvO1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBkYXRhYmFzZVNlcnZpY2U6IERhdGFiYXNlU2VydmljZSxcclxuICAgIHByaXZhdGUgem9uZTogTmdab25lLFxyXG4gICAgcHJpdmF0ZSBzbXNGYWNhZGVTZXJ2aWNlOiBTbXNGYWNhZGVTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBzbXNTZXJ2aWNlOiBTbXNTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBuaWdodHNjb3V0QXBpU2VydmljZTogTmlnaHRzY291dEFwaVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlOiBQdW1wQmx1ZXRvb3RoQXBpU2VydmljZSxcclxuICAgIHByaXZhdGUgcmF3RGF0YVNlcnZpY2U6IFJhd0RhdGFTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB3YWtlRmFjYWRlU2VydmljZTogV2FrZUZhY2FkZVNlcnZpY2VcclxuICApIHtcclxuICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZVRhYmxlKCk7XHJcbiAgfVxyXG4gIGNsZWFySW50KCkge1xyXG4gICAgY2xlYXJJbnRlcnZhbChhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ2ludDAnKSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYihwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0QkcocHVtcFN0YXR1cy5ibG9vZEdsdWNvc2UpO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGIyKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0VHJlYXRtZW50cyhwdW1wU3RhdHVzLmxhc3RCb2x1cyk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERCKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Q2FsYyhuZXcgRGF0ZSgpLnRvU3RyaW5nKCksIHB1bXBTdGF0dXMuY2FsYy5pZFZhbCwgcHVtcFN0YXR1cy5jYWxjLnZhbHVlLCBwdW1wU3RhdHVzLmNhbGMuaG91cnMsIHB1bXBTdGF0dXMuY2FsYy5jYXRlZ29yeSk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERiTWF4KHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Q2FsYyhuZXcgRGF0ZSgpLnRvU3RyaW5nKCksIDEsIHB1bXBTdGF0dXMubWF4aW11bUJvbHVzU2V0dGluZywgJzAwOjAwJywgJ21heCcpO1xyXG4gIH1cclxuICBzZW5kQ2FsY1RvTGFjYWxEYnN0ZXAocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgMSwgcHVtcFN0YXR1cy5pbmNyZW1lbnRTdGVwU2V0dGluZywgJzAwOjAwJywgJ3N0ZXAnKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiMyhwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydERldmljZVN0YXR1cyhcclxuICAgICAgcHVtcFN0YXR1cy5pbnN1bGluSW5Qb21wTGVmdCxcclxuICAgICAgcHVtcFN0YXR1cy5iYXR0ZXJ5Vm9sdGFnZSxcclxuICAgICAgcHVtcFN0YXR1cy5kYXRhLFxyXG4gICAgICBwdW1wU3RhdHVzLnN0YXR1c1B1bXBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYjQocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRUZW1wQmFzYWwoXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnBlcmNlbnRzT2ZCYXNlQmFzYWwsXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnRpbWVMZWZ0SW5NaW51dGVzLFxyXG4gICAgICBwdW1wU3RhdHVzLnRlbXBvcmFyeUJhc2FsTWV0aG9kUGVyY2VudGFnZS50aW1lc3RhbXBcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIoKTogT2JzZXJ2YWJsZTxcclxuICAgIEFycmF5PHsgdmFsdWU6IG51bWJlcjsgZGF0ZTogRGF0ZTsgb2xkOiBzdHJpbmcgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRCRygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgdmFsdWU6ICthWzBdLFxyXG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoYVsxXSksXHJcbiAgICAgICAgICBvbGQ6IHRoaXMuc2V0QXJyb3coYVszXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YWZyb21Mb2NhbERiMigpOiBPYnNlcnZhYmxlPEFycmF5PHsgdmFsdWU6IG51bWJlcjsgZGF0ZTogRGF0ZSB9Pj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldFRyZWF0bWVudHMoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIHZhbHVlOiArYVswXSxcclxuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKGFbMV0pXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbiAgZ2V0Q2FsY2Zyb21Mb2NhbERiKCk6IE9ic2VydmFibGU8QXJyYXk8eyBpZFZhbDogbnVtYmVyOyBjYXRlZ29yeTogc3RyaW5nOyBkYXRlU3RyaW5nOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmc7IGhvdXI6IHN0cmluZzsgfT4+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRDYWxjKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICBpZFZhbDogK2FbMF0sXHJcbiAgICAgICAgICBjYXRlZ29yeTogYVsxXSxcclxuICAgICAgICAgIGRhdGVTdHJpbmc6IGFbMl0sXHJcbiAgICAgICAgICB2YWx1ZTogYVszXSxcclxuICAgICAgICAgIGhvdXI6IGFbNF1cclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YWZyb21Mb2NhbERiMygpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8e1xyXG4gICAgICByZXNlcnZvaXI6IG51bWJlcjtcclxuICAgICAgdm9sdGFnZTogbnVtYmVyO1xyXG4gICAgICBkYXRlU3RyaW5nOiBEYXRlO1xyXG4gICAgICBwZXJjZW50OiBudW1iZXI7XHJcbiAgICAgIHN0YXR1czogc3RyaW5nO1xyXG4gICAgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXREUygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgcmVzZXJ2b2lyOiArYVswXSxcclxuICAgICAgICAgIHZvbHRhZ2U6ICthWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogbmV3IERhdGUoYVsyXSksXHJcbiAgICAgICAgICBwZXJjZW50OiArYVszXSxcclxuICAgICAgICAgIHN0YXR1czogYVs0XVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGI0KCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7IHBlcmNlbnRzT2ZCYXNhbDogbnVtYmVyOyBtaW51dGVzOiBudW1iZXI7IGRhdGVTdHJpbmc6IERhdGUgfT5cclxuICA+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRUZW1wQmFzYWwoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIHBlcmNlbnRzT2ZCYXNhbDogK2FbMF0sXHJcbiAgICAgICAgICBtaW51dGVzOiArYVsxXSxcclxuICAgICAgICAgIGRhdGVTdHJpbmc6IG5ldyBEYXRlKGFbMl0pXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGIoKS5zdWJzY3JpYmUoZ2x1Y29zZXMgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3QkcoZ2x1Y29zZXMpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgc3VjY2Vzc1ZhbHVlID0+IHJlc29sdmUoc3VjY2Vzc1ZhbHVlKSxcclxuICAgICAgICAgICAgZXJyb3JWYWx1ZSA9PiByZWplY3QoZXJyb3JWYWx1ZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YXRvTmlnaHRzY291dDIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYjIoKS5zdWJzY3JpYmUodHJlYXRtZW50cyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdCb2wodHJlYXRtZW50cylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0MygpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiMygpLnN1YnNjcmliZShkZXZpY2VTdGF0dXMgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3RGV2aWNlc3RhdHVzKGRldmljZVN0YXR1cylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgZ2V0RGF0YUZyb21OaWdodHNjb3V0KCkge1xyXG4gICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZS5nZXRCR2Zyb21OcygpLnRoZW4oc3ZnID0+IHtjb25zb2xlLmxvZyggXCJUQUFBQUFBQUFBQUsyOiBcIiArIEpTT04uc3RyaW5naWZ5KHN2ZykpO1xyXG4gICAgY29uc3Qgb2JqID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzdmdbMF0pKTtcclxuICAgIGNvbnNvbGUubG9nKG9iai5zZ3YsIHN2Z1swXSk7XHJcbiAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCR2Zyb21OcyhvYmouc2d2LCBuZXcgRGF0ZShvYmouZGF0ZVN0cmluZyksIDEpO1xyXG4gICAgIC8vIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHKEpTT04uc3RyaW5naWZ5KHN2ZykpXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0NCgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiNCgpLnN1YnNjcmliZSh0ZW1wYmFzYWwgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3VGVtcEJhc2FsKHRlbXBiYXNhbClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2NhbkFuZENvbm5lY3QoKSB7XHJcbiAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJVZGHFgm8gcG/FgsSFY3p5xIcgc2nEmSB6OiBcIiArIHVpZEJ0KTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpLnRoZW4oXHJcbiAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh1aWRCdDIgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdDIgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0MiA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQyID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlhhWGFYYVhhWGFcIik7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoY29uc29sZS5sb2coXCJhZGFtMjMzMzMzMzNcIikpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy53YWl0T25SZWFkeSgpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuXHJcbiAgfVxyXG4gICBzY2FuQW5kQ29ubmVjdFN0b3AoKSB7XHJcbiAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2VcclxuICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICB1aWRCdDIgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdDIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgdWlkQnQyICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIlxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWGFYYVhhWGFYYVwiKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiamVkbmFrIG5pZSB1ZGFsbyBzaWUgemEgMlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJPSytDT05OXCIpLFxyXG4gICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdGltZW91dEFsZXJ0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSwgNjMgKiAxMDAwKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcImFcIik7XHJcbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSggZGFuZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrXCIrIGRhbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1cnVjaG9taW9uYVwiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUT1AgUE9NUEFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RvcFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDUoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIldaTsOTVyBQT01QxJhcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVEFSVCBQT01QQSEhIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpBV0lFxZogUE9NUMSYXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0pLCA1MDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpXHJcbiAgICAgICAgICAgICAgICAsIDQwMCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIGN6ZWthbSBuYSByZWFkeVwiKTtcclxuICAgICAgICAgICAgdGhpcy5lcnJvclB1bXBTdGFuKCk7XHJcbiAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlRvdGFsbmEgenNzc2FqZWJrYVwiKTtcclxuICAgICAgcmVqZWN0KCk7XHJcbiAgICB9XHJcbiAgfSlcclxuICB9XHJcbiAgc2NhbkFuZENvbm5lY3RCT0wocikge1xyXG4gICAgLy8gIHRoaXMud2FrZUZhY2FkZVNlcnZpY2Uud2FrZVNjcmVlbkJ5Q2FsbCgpO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCB0aW1lb3V0QWxlcnQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpLCA2OSAqIDEwMDApO1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcInhcIik7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrXCIgKyBkYW5lICsgXCJrb25pZWMgZGFueWNoIC8gd3luaWt1XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGRhbmUudG9TdHJpbmcoKS5pbmNsdWRlcyhcInVzdGF3XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpIGJvbHVzIHpvc3RhbCBuYXN0YXdpb255OiBcIiArIHIgKyAneiB0YWthIGRhdGE6ICcgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEgKS50b1N0cmluZygpKS5zbGljZSgtMikudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJib2x1cyAgXCIgKyByKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkNigpLnN1YnNjcmliZShidGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYnRkYW5lOiAhISEhISEhISEhISEhXCIgKyBidGRhbmUudG9TdHJpbmcoKSArIFwia29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERheSgpLnRvU3RyaW5nKCkgKyAnLScgKyBuZXcgRGF0ZSgpLmdldE1vbnRoKCkudG9TdHJpbmcoKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGQuc2V0TWludXRlcyhkLmdldE1pbnV0ZXMoKSAtIDYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJvbGhvdXJzID0gYnRkYW5lLnRvU3RyaW5nKCkubWF0Y2goLyhcXGR7Mn06XFxkezJ9KS8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChib2xob3VycyAhPT0gbnVsbCAmJiBib2xob3Vycy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgWzFdIFwiICsgYm9saG91cnNbMV0gKyBcIiBhIHRvIHplcm86IFwiICsgYm9saG91cnNbMF0gKyBcIkEgdG8gcG8genJ6dXRvd2FuaXUgZG8gbnVtYmVyYTogXCIgKyBOdW1iZXIoYm9saG91cnNbMV0ucmVwbGFjZSgnOicsICcnKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ib2xob3VyID0gTnVtYmVyKGJvbGhvdXJzWzFdLnJlcGxhY2UoJzonLCAnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpZSBjb3Mgd3lzemxvOiBcIiArIE51bWJlcigoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJidGRhbmUxOiAhISEhISEhISEhISEhIFwiICsgdGhpcy5ib2xob3VyICsgTnVtYmVyKCgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpKSAgKyBcIiBrb25pZWMhISFcIiArIG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgKyAnLScgKyAoJzAnICsgKE51bWJlcihuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYm9saG91ciA9IDk5OTk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRha2llIGNvcyB3eXN6bG86IFwiICsgTnVtYmVyKCgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImJ0ZGFuZTIgOiAhISEhISEhISEhISEhIFwiICsgdGhpcy5ib2xob3VyICsgTnVtYmVyKCgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpKSAgKyBcIiBrb25pZWMhISFcIiArIG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgKyAnLScgKyAoJzAnICsgKE51bWJlcihuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSkudG9TdHJpbmcoKSkuc2xpY2UoLTIpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiIGdvZHppbmE6IFwiICsgKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSArIFwiIFRha2kgYm9sdXMgem9zdGFsIG5hc3Rhd2lvbnk6IFwiICsgciArICd6IHRha2EgZGF0YTogJyArIG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgKyAnLScgKyAoJzAnICsgKE51bWJlcihuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSApLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGJ0ZGFuZS5pbmNsdWRlcyhcInBvbXBhIHBvZGFqZVwiKSAmJiAgYnRkYW5lLmluY2x1ZGVzKFwiQkw6IFwiICsgci50b1N0cmluZygpICsgXCJKXCIpKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJ0ZGFuZS5pbmNsdWRlcyhcInBvbXBhIG5pZSBwb2RhamVcIikgJiYgIGJ0ZGFuZS5pbmNsdWRlcyhcIkJMOiBcIiArIHIudG9TdHJpbmcoKSArIFwiSlwiKSAmJiBidGRhbmUuaW5jbHVkZXMobmV3IERhdGUoKS5nZXREYXRlKCkudG9TdHJpbmcoKSArICctJyArICgnMCcgKyAoTnVtYmVyKG5ldyBEYXRlKCkuZ2V0TW9udGgoKSkgKyAxKS50b1N0cmluZygpKS5zbGljZSgtMikudG9TdHJpbmcoKSkgJiYgdGhpcy5ib2xob3VyID4gTnVtYmVyKCgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpKSkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWNjZXNzTG9nKHIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJPZHBvd2llZHppIHogcG9tcHk6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGJ0ZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLCA1MDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQsWCxIVkIG9kcG93aWVkemkgeiBwb21weTpcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYW5lLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUG9sZWNpYcWCIGLFgmFkIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpXHJcbiAgICAgICAgICAgICAgICAgICwgNDAwKTtcclxuICAgICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5lcnJvclB1bXBTdGFuKCk7XHJcbiAgICAgICAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUb3RhbG5hIHpzc3NhamVia2FcIik7XHJcbiAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG4gIGdldENhbGNEYXRhKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJmXCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hEYXRhd3cgPSAgZGFuZS5tYXRjaCh0aGlzLnd3KTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWlzZiA9ICBkYW5lLm1hdGNoKHRoaXMuaXNmKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWJncmFuZ2UgPSAgZGFuZS5tYXRjaCh0aGlzLmJnUmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXMlwiICsgbWF0Y2hEYXRhd3dbMV0sIG1hdGNoRGF0YXd3Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIldXV1czXCIgKyBtYXRjaERhdGFpc2ZbMV0sIG1hdGNoRGF0YWlzZi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXNFwiICsgbWF0Y2hEYXRhYmdyYW5nZVsxXSwgbWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IE51bWJlcihtYXRjaERhdGF3dy5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMud3cyLmV4ZWMobWF0Y2hEYXRhd3dbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWs6MTExMTExIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgTnVtYmVyKG1hdGNoRGF0YWlzZi5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuaXNmMi5leGVjKG1hdGNoRGF0YWlzZltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pazoyMjIyMjIgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBOdW1iZXIobWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuYmdSYW5nZTIuZXhlYyhtYXRjaERhdGFiZ3JhbmdlW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrOjMzMzMzMzMgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoZGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEYk1heChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERic3RlcChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJVc3Rhd2llbmlhIGthbGt1bGF0b3JhIGJvbHVzYSB6b3N0YcWCeSB6YXBpc2FuZSBkbyBiYXp5IGRhbnljaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYW5lLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENhbGNmcm9tTG9jYWxEYigpLnN1YnNjcmliZShkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDIwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbiAgZXJyb3JQdW1wU3Rhbigpe1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQ2/FmyBwb3N6xYJvIG5pZSB0YWtcIixcclxuICAgICAgbWVzc2FnZTogXCJTcHJhd2TFuiBzdGFuIHBvbXB5IVwiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiUHJ6eWrEhcWCZW0gZG8gd2lhZG9tb8WbY2lcIlxyXG4gICAgfTtcclxuICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gIH1cclxuICBzdWNjZXNzTG9nKHIpe1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQnJhd28hXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiVWRhxYJvIHNpxJkgcG9kYcSHIGJvbHVzOiBcIiArIHIudG9TdHJpbmcoKSArIFwiIEpcIiAsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICB9O1xyXG4gICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBlc3RhYmxpc2hDb25uZWN0aW9uV2l0aFB1bXAoKSB7XHJcbiAgICAvL3RoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgIC8vIHNldEludGVydmFsKCgpID0+IHRoaXMuc2NhbkFuZENvbm5lY3QoKSwgIDYwICogMTAwMCk7XHJcbiAgICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNldEFsYXJtKCk7XHJcbiAgICB0aGlzLnNjYW5BbmRDb25uZWN0KCk7XHJcbiAgICB0aGlzLmludDAgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksICA1ICogNjAgKiAxMDAwKTtcclxuICAgIGFwcFNldHRpbmdzLnNldE51bWJlcignaW50MCcsIHRoaXMuaW50MCk7XHJcblxyXG4gIH1cclxuXHJcblxyXG4gIHdhaXRPblJlYWR5KCkge1xyXG4gICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHdhaXRPblJlYWR5U3RvcCgpIHtcclxuICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgLy8gdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgICB0aGlzLmNoZWNTdGF0dXNQdW1wKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY2hlY1N0YXR1c1B1bXAoKXtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpLCA0MDApO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1cnVjaG9taW9uYVwiKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1RPUCBQT01QQVwiKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0b3BcIik7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IHRoaXMuc3RhblB1bXAgPSBcIldZxYHEhENaIFBPTVDEmFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIFBPTVBBISEhXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RhcnRcIik7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IHRoaXMuc3RhblB1bXAgPSBcIlfFgcSEQ1ogUE9NUMSYXCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpfSksIDUwMCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgLCA0MDApO1xyXG4gIH1cclxuXHJcbiAgcHJldmVudExvd1N1Z2FyKGE6IG51bWJlciwgYjogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYXV0bycsIGZhbHNlKSAmJiBhIDw9IGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSkgJiYgIShhID09PSAwKSAmJiAhKGEudG9TdHJpbmcoKSA9PT0gJzAwMCcpICYmIGIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbm9ybWFsJykpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFLVCBXT0pOWVwiICsgYSArIGIgKyBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpKTtcclxuICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJQb21wYSB3eWxcIik7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJhdXRvc3RvcFwiLCBuZXcgRGF0ZSgpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDMsIDIxKSArIFwiIFVXQUdBISBQT01QQSBaQVRSWllNQU5BIFBSWkVaIEZVTktDSsSYIEFVVE8gU1RPUFxcblxcblwiKTtcclxuICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIkJBREQgQVNTIG5pZSB3eWxhY3pvbmFcIikpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpICYmIGEgPiBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3JhbmdlJywgNzUpICYmICEoYSA9PT0gMCkgJiYgIShhLnRvU3RyaW5nKCkgPT09ICcwMDAnKSAmJiBiLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3N1c3BlbmQnKSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJBS1QgV09KTlkzXCIgKyBhICsgYik7XHJcbiAgICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbXBhIHdsYWN6b25hXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EhIFBPTVBBIFdaTk9XSU9OQSBQUlpFWiBGVU5LQ0rEmCBBVVRPIFNUQVJUXFxuXFxuXCIpO1xyXG4gICAgICAgICAgfSwgKCkgPT4gY29uc29sZS5sb2coXCJCQUREIEFTUyAyIG5pZSB3eWxhY3pvbmFcIikpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIk5pZSB1enl3YW0gYXV0byBzdG9wL3N0YXJ0OiBcIiArIGEgKyBiKTtcclxuICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIC8vTkEgVEVTVFkgVE8gV1lMQUNaWUxFTTpcclxuICAgICAgICAgIC8vdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgdmFsaWRhdGVTbXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBwaG9uZU51bWIgPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ3Bob25lTicsIG51bGwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgbnVtZXIgdGVsOlwiICsgcGhvbmVOdW1iKTtcclxuICAgICAgaWYgKHBob25lTnVtYiAhPT0gbnVsbCAmJiBwaG9uZU51bWIgIT09ICdQb2RhaiBuciB0ZWwuIG9waWVrdW5hJykge1xyXG4gICAgICAgIHRoaXMuc21zU2VydmljZS5nZXRJbmJveE1lc3NhZ2VzRnJvbU51bWJlcigpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IHRyZXNjIHNtc2E6IFwiICsgdGhpcy5zbXNTZXJ2aWNlLm1lc3NhZ2UudG9VcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAvL2NvbnN0IGRhdGVNID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsICcnKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidG8gamVzdCBkYXRhOiBcIiArIG5ldyBEYXRlKCkudmFsdWVPZigpICsgXCJhIHRvIGRhdGEgc21zYTogXCIgKyB0aGlzLnNtc1NlcnZpY2UuZGF0ZU1lc3NhZ2UgKyBcIiBhIHRvIGplc3QgZGF0YSBvZGpldGEgbyAxNSBtaW4gbyBzeXNkYXRlOiBcIiArIChOdW1iZXIobmV3IERhdGUoKS52YWx1ZU9mKCkpIC0gOTYwMDAwKSk7XHJcbiAgICAgICAgICBpZiAodGhpcy5zbXNTZXJ2aWNlLm1lc3NhZ2UudG9VcHBlckNhc2UoKSA9PT0gJ1NUT1AnICYmICEodGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlID09PSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ2RhdGVNZXNzYWdlT2xkJywgJycpKSAmJiBOdW1iZXIodGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlKSA+IChOdW1iZXIobmV3IERhdGUoKS52YWx1ZU9mKCkpIC0gOTYwMDAwKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oYSA9PiB7XHJcbiAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsIHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5zbXNTZXJ2aWNlLnNlbmRTbXMoKTtcclxuICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiV3lzbGlqIHNtdXRuZWdvIHNtc2FcIikpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCcmFrIGtvbWVuZHkgZG8gd3lrb25hbmlhXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY2hlY2tTb3VyY2VCZWZvcmVQcmV2ZW50KHBhcnNlZERhdGUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdiZ3NvdXJjZScsIGZhbHNlKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2UuZ2V0Qkdmcm9tTnMoKS50aGVuKHN2ZyA9PiB7Y29uc29sZS5sb2coIFwiVEFBQUFBQUFBQUFLMjogXCIgKyBKU09OLnN0cmluZ2lmeShzdmcpKTtcclxuICAgICAgICAgIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3ZnWzBdKSk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhvYmouc2d2LCBzdmdbMF0pO1xyXG4gICAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Qkdmcm9tTnMob2JqLnNndiwgbmV3IERhdGUob2JqLmRhdGVTdHJpbmcpLCAxKTtcclxuICAgICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgZC5zZXRNaW51dGVzKGQuZ2V0TWludXRlcygpIC0gMTYpO1xyXG4gICAgICAgICAgaWYgKG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSA+IGQpe1xyXG4gICAgICAgICAgICB0aGlzLnByZXZlbnRMb3dTdWdhcihvYmouc2d2LCBwYXJzZWREYXRlLnN0YXR1c1B1bXAudG9TdHJpbmcoKSkudGhlbiggKCkgPT4gcmVzb2x2ZSgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN0YXJ5IGN1a2llciB6IE5TXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucHJldmVudExvd1N1Z2FyKHBhcnNlZERhdGUuYmxvb2RHbHVjb3NlLnZhbHVlLCBwYXJzZWREYXRlLnN0YXR1c1B1bXAudG9TdHJpbmcoKSkudGhlbiggKCkgPT4gcmVzb2x2ZSgpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHRyYW5zZmVyRGF0YUZyb21QdW1wVGhlblRvQXBpKCkge1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcInNcIiksIDQwMCk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMigpLnN1YnNjcmliZShkYXRhID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnVE9PT09POiAgICcgKyBkYXRhLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIHRoaXMuYnREYXRhID0gZGF0YS50b1N0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IHBhcnNlZERhdGUgPSB0aGlzLnJhd0RhdGFTZXJ2aWNlLnBhcnNlRGF0YShkYXRhKTtcclxuICAgICAgICAgIHRoaXMuc2VuZERhdGFUb0xvY2FsRGIocGFyc2VkRGF0ZSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4geyBjb25zb2xlLmxvZygnQUFBQUEgZG9zemxvJyk7IHRoaXMuc2VuZERhdGFUb0xvY2FsRGIyKHBhcnNlZERhdGUpOyB9KVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMyhwYXJzZWREYXRlKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YVRvTG9jYWxEYjQocGFyc2VkRGF0ZSkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQzKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZURTKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlQkcoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDIoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlVHJlYXRtZW50cygpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0NCgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVUZW1wQmFzYWwoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gIHRoaXMuY2hlY2tTb3VyY2VCZWZvcmVQcmV2ZW50KHBhcnNlZERhdGUpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zbXNGYWNhZGVTZXJ2aWNlLnZhbGlkYXRlU21zKClcclxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpKSkpXHJcbiAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICAgIC8vdGhpcy53YWtlRmFjYWRlU2VydmljZS5zbm9vemVTY3JlZW5CeUNhbGwoKVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgLy90aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LCA0MDApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRBcnJvdyhvbGQ6IHN0cmluZykge1xyXG4gICAgaWYgKE51bWJlcihvbGQpID49IC01ICYmIE51bWJlcihvbGQpIDw9IDUpIHtcclxuICAgICAgb2xkID0gXCJGbGF0XCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPiA1ICYmIE51bWJlcihvbGQpIDwgMTApIHtcclxuICAgICAgb2xkID0gXCJGb3J0eUZpdmVVcFwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpID49IDEwKSB7XHJcbiAgICAgIG9sZCA9IFwiU2luZ2xlVXBcIjtcclxuICAgIH1cclxuICAgIGlmIChOdW1iZXIob2xkKSA8IC01ICYmIE51bWJlcihvbGQpID4gLTEwKSB7XHJcbiAgICAgIG9sZCA9IFwiRm9ydHlGaXZlRG93blwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpIDw9IC0xMCkge1xyXG4gICAgICBvbGQgPSBcIlNpbmdsZURvd25cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBvbGQ7XHJcbiAgfVxyXG59XHJcbiJdfQ==