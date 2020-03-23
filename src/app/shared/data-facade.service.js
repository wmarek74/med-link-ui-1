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
var DataFacadeService = /** @class */ (function () {
    function DataFacadeService(databaseService, zone, smsService, nightscoutApiService, pumpBluetoothApiService, rawDataService, wakeFacadeService) {
        this.databaseService = databaseService;
        this.zone = zone;
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
        //this.wakeFacadeService.wakeScreenByCall();
        try {
            this.pumpBluetoothApiService
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
                    if (uidBt2 === "HMSoft") {
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
                return setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand("OK+CONN"); }, 4500);
            }, function () {
                console.log("zatem nie wyslam ok kona");
                return Promise.reject(console.log("adam23333333"));
            })
                .then(function () {
                _this.waitOnReady();
            }, function () {
                console.log("zatem nie czekam na ready");
                //this.wakeFacadeService.snoozeScreenByCall();
            })
                .catch(function (error) { return console.log("error: ", error); });
        }
        catch (_a) {
            console.log("Totalna zsssajebka");
        }
        //const estimatedTimeToEndTask = 30 * 1000;
        //setTimeout(() => this.wakeFacadeService.snoozeScreenByCall(), estimatedTimeToEndTask);
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
                        if (uidBt2 === "HMSoft") {
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
                                    _this.zone.run(function () { return appSettings.setString("pumpStan", "WZNOW POMPE"); });
                                    _this.pumpBluetoothApiService.disconnect();
                                    clearTimeout(timeoutAlert);
                                    resolve();
                                }); }, 500);
                            }
                            else {
                                console.log("START POMPA!!!");
                                _this.pumpBluetoothApiService.sendCommand("start");
                                setTimeout(function () { return _this.pumpBluetoothApiService.read4().subscribe(function () {
                                    _this.zone.run(function () { return appSettings.setString("pumpStan", "ZAWIES POMPE"); });
                                    _this.pumpBluetoothApiService.disconnect();
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
                        if (uidBt2 === "HMSoft") {
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
                    var timeoutAlert = setTimeout(function () { return _this.errorPumpStan(); }, 68 * 1000);
                    _this.pumpBluetoothApiService.read().subscribe(function () {
                        _this.pumpBluetoothApiService.sendCommand2("x");
                        setTimeout(function () { return _this.pumpBluetoothApiService.read3()
                            .subscribe(function (dane) {
                            console.log("To jest wynik" + dane);
                            if (dane.toString().includes("ustaw")) {
                                console.log("Taki bolus zostal nastawiony" + r);
                                _this.pumpBluetoothApiService.sendCommand("bolus  " + r);
                                setTimeout(function () { return _this.pumpBluetoothApiService.read5().subscribe(function (btdane) {
                                    console.log("btdane: !!!!!!!!!!!!!!!f!!!!!!!$%RSFD#WEF: //n" + btdane.toString());
                                    if (btdane.includes("pompa podaje") && btdane.includes("BL: " + r.toString() + "J")) {
                                        _this.successLog();
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
                        if (uidBt2 === "HMSoft") {
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
        appSettings.setString("pumpStan", "ZMIEN STAN POMPY");
        var options = {
            title: "Cos poszło nie tak",
            message: "Sprawdz stan pompy!",
            okButtonText: "Przyjąłem do wiadomości"
        };
        alert(options);
    };
    DataFacadeService.prototype.successLog = function () {
        var options = {
            title: "Hurreeey!! :)",
            message: "Udało się podać bolus!",
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
                    _this.zone.run(function () { return _this.stanPump = "WYLACZ POMPE"; });
                    _this.pumpBluetoothApiService.disconnect();
                }); }, 500);
            }
            else {
                console.log("START POMPA!!!");
                _this.pumpBluetoothApiService.sendCommand("start");
                setTimeout(function () { return _this.pumpBluetoothApiService.read3().subscribe(function () {
                    _this.zone.run(function () { return _this.stanPump = "WLACZ POMPE"; });
                    _this.pumpBluetoothApiService.disconnect();
                }); }, 500);
            }
        }); }, 400);
    };
    DataFacadeService.prototype.preventLowSugar = function (a, b) {
        if (appSettings.getBoolean('auto', false) && a <= appSettings.getNumber('range', 75) && !(a === 0) && !(a.toString() === '000') && b.toLowerCase().includes('normal')) {
            console.log("AKT WOJNY" + a + b + appSettings.getBoolean('auto', false));
            this.scanAndConnectStop().then(function () {
                console.log("Pompa wyl");
                appSettings.setString("autostop", new Date().toString().substring(3, 21) + " UWAGA POMPA ZATRZYMANA PRZEZ FUNKCJE AUTO STOP\n\n");
            }, function () { return console.log("BADD ASS nie wylaczona"); });
        }
        else {
            if (appSettings.getBoolean('auto', false) && a > appSettings.getNumber('range', 75) && !(a === 0) && !(a.toString() === '000') && b.toLowerCase().includes('suspend')) {
                console.log("AKT WOJNY3" + a + b);
                this.scanAndConnectStop().then(function () {
                    console.log("Pompa wlaczona");
                    appSettings.setString("autostop", new Date().toString().substring(3, 21) + " UWAGA POMPA WZNOWIONA PRZEZ FUNKCJE AUTO START\n\n");
                }, function () { return console.log("BADD ASS 2 nie wylaczona"); });
            }
            else {
                console.log("Nie uzywam auto stop/start" + a + b);
                //NA TESTY TO WYLACZYLEM:
                //this.pumpBluetoothApiService.disconnect();
            }
        }
    };
    DataFacadeService.prototype.validateSms = function () {
        var _this = this;
        this.smsService.getInboxMessagesFromNumber().then(function () {
            console.log("to jest tresc smsa: " + _this.smsService.message.toUpperCase() + _this.smsService.message.toUpperCase().match(/STOP/));
            //const dateM = appSettings.getString('dateMessageOld', '');
            if (_this.smsService.message.toUpperCase().match(/STOP/) && !(_this.smsService.dateMessage === appSettings.getString('dateMessageOld', ''))) {
                appSettings.setString('dateMessageOld', _this.smsService.dateMessage);
                _this.scanAndConnectStop().then(function (a) { return _this.smsService.sendSms(); }, function () { return console.log("Wyslij smutnego smsa"); });
            }
            else {
                console.log("Brak komendy do wykonania");
            }
        });
    };
    DataFacadeService.prototype.transferDataFromPumpThenToApi = function () {
        var _this = this;
        setTimeout(function () { return _this.pumpBluetoothApiService.sendCommand2("s"); }, 3600);
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
                    .then(function () {
                    _this.validateSms();
                    if (appSettings.getBoolean('bgsource', false) === true) {
                        _this.nightscoutApiService.getBGfromNs().then(function (svg) {
                            console.log("TAAAAAAAAAAK2: " + JSON.stringify(svg));
                            var obj = JSON.parse(JSON.stringify(svg[0]));
                            console.log(obj.sgv, svg[0]);
                            _this.databaseService.insertBGfromNs(obj.sgv, new Date(obj.dateString), 1);
                            var d = new Date();
                            d.setMinutes(d.getMinutes() - 16);
                            if (new Date(obj.dateString) > d) {
                                _this.preventLowSugar(obj.sgv, parsedDate.statusPump.toString());
                            }
                            else {
                                console.log("Stary cukier z NS");
                            }
                            // this.databaseService.insertBG(JSON.stringify(svg))
                        });
                    }
                    else {
                        _this.preventLowSugar(parsedDate.bloodGlucose.value, parsedDate.statusPump.toString());
                    }
                })
                    //.then(() => this.wakeFacadeService.snoozeScreenByCall())
                    .catch(function (error) {
                    console.log(error);
                    //this.wakeFacadeService.snoozeScreenByCall()
                });
                //this.pumpBluetoothApiService.disconnect();
            });
        }, 3900);
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
            sms_service_1.SmsService,
            nightscout_api_service_1.NightscoutApiService,
            pump_bluetooth_api_service_1.PumpBluetoothApiService,
            raw_data_parse_service_1.RawDataService,
            wake_facade_service_1.WakeFacadeService])
    ], DataFacadeService);
    return DataFacadeService;
}());
exports.DataFacadeService = DataFacadeService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1mYWNhZGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtZmFjYWRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFFbEQsNENBQXFDO0FBRXJDLGtFQUFnRTtBQUNoRSx3REFBc0Q7QUFDdEQsOEVBQTJFO0FBQzNFLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsd0VBQXFFO0FBQ3JFLGtEQUFvRDtBQUtwRDtJQVVFLDJCQUNVLGVBQWdDLEVBQ2hDLElBQVksRUFDWixVQUFzQixFQUN0QixvQkFBMEMsRUFDMUMsdUJBQWdELEVBQ2hELGNBQThCLEVBQzlCLGlCQUFvQztRQU5wQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtRQUMxQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1FBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtRQUM5QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1FBZDlDLGFBQVEsR0FBVyxjQUFjLENBQUM7UUFDbEMsT0FBRSxHQUFHLG1FQUFtRSxDQUFDO1FBQ3pFLFFBQUcsR0FBRyxrRUFBa0UsQ0FBQztRQUN6RSxRQUFHLEdBQUcsbUVBQW1FLENBQUM7UUFDMUUsU0FBSSxHQUFHLGtFQUFrRSxDQUFDO1FBQzFFLFlBQU8sR0FBRyxxRUFBcUUsQ0FBQztRQUNoRixhQUFRLEdBQUcsb0VBQW9FLENBQUM7UUFVOUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBQ0Qsb0NBQVEsR0FBUjtRQUNFLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELDZDQUFpQixHQUFqQixVQUFrQixVQUEwQjtRQUN4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aUIsQ0FtdUI3QjtJQUFELHdCQUFDO0NBQUEsQUFudUJELElBbXVCQztBQW51QlksOENBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHsgbWFwIH0gZnJvbSBcInJ4anMvb3BlcmF0b3JzXCI7XHJcbmltcG9ydCB7IElCYXNpY1NldHRpbmdzIH0gZnJvbSBcIn4vYXBwL21vZGVsL21lZC1saW5rLm1vZGVsXCI7XHJcbmltcG9ydCB7IERhdGFiYXNlU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvZGF0YWJhc2Uuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBTbXNTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9zbXMtc2VydmljZVwiO1xyXG5pbXBvcnQgeyBOaWdodHNjb3V0QXBpU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvbmlnaHRzY291dC1hcGkuc2VydmljZVwiO1xyXG5pbXBvcnQgeyBQdW1wQmx1ZXRvb3RoQXBpU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvcHVtcC1ibHVldG9vdGgtYXBpLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgUmF3RGF0YVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3Jhdy1kYXRhLXBhcnNlLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgV2FrZUZhY2FkZVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3dha2UtZmFjYWRlLnNlcnZpY2VcIjtcclxuaW1wb3J0ICogYXMgYXBwU2V0dGluZ3MgZnJvbSBcImFwcGxpY2F0aW9uLXNldHRpbmdzXCI7XHJcblxyXG5ASW5qZWN0YWJsZSh7XHJcbiAgcHJvdmlkZWRJbjogXCJyb290XCJcclxufSlcclxuZXhwb3J0IGNsYXNzIERhdGFGYWNhZGVTZXJ2aWNlIHtcclxuICBidERhdGE6IHN0cmluZztcclxuICBpbnQwOiBudW1iZXI7XHJcbiAgc3RhblB1bXA6IHN0cmluZyA9IFwiVyBUUkFLQ0lFLi4uXCI7XHJcbiAgd3cgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzKC5cXFdcXGR7M30pXFxzSlxcL1dXXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS9nO1xyXG4gIHd3MiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHMoLlxcV1xcZHszfSlcXHNKXFwvV1dcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pLztcclxuICBpc2YgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzXFxzPyhcXGR7MiwzfSltZy5kbFxcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvZztcclxuICBpc2YyID0gL3pha3Jlc1xccyhcXGR7MX0pOlxcc1xccz8oXFxkezIsM30pbWcuZGxcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pLztcclxuICBiZ1JhbmdlID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccz8oXFxkezIsM30tLlxcZHsyLDN9KVxcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvZztcclxuICBiZ1JhbmdlMiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHM/KFxcZHsyLDN9LS5cXGR7MiwzfSlcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pLztcclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZGF0YWJhc2VTZXJ2aWNlOiBEYXRhYmFzZVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZSxcclxuICAgIHByaXZhdGUgc21zU2VydmljZTogU21zU2VydmljZSxcclxuICAgIHByaXZhdGUgbmlnaHRzY291dEFwaVNlcnZpY2U6IE5pZ2h0c2NvdXRBcGlTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBwdW1wQmx1ZXRvb3RoQXBpU2VydmljZTogUHVtcEJsdWV0b290aEFwaVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJhd0RhdGFTZXJ2aWNlOiBSYXdEYXRhU2VydmljZSxcclxuICAgIHByaXZhdGUgd2FrZUZhY2FkZVNlcnZpY2U6IFdha2VGYWNhZGVTZXJ2aWNlXHJcbiAgKSB7XHJcbiAgICB0aGlzLmRhdGFiYXNlU2VydmljZS5jcmVhdGVUYWJsZSgpO1xyXG4gIH1cclxuICBjbGVhckludCgpIHtcclxuICAgIGNsZWFySW50ZXJ2YWwoYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCdpbnQwJykpO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHKHB1bXBTdGF0dXMuYmxvb2RHbHVjb3NlKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiMihwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydFRyZWF0bWVudHMocHVtcFN0YXR1cy5sYXN0Qm9sdXMpO1xyXG4gIH1cclxuICBzZW5kQ2FsY1RvTGFjYWxEQihwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydENhbGMobmV3IERhdGUoKS50b1N0cmluZygpLCBwdW1wU3RhdHVzLmNhbGMuaWRWYWwsIHB1bXBTdGF0dXMuY2FsYy52YWx1ZSwgcHVtcFN0YXR1cy5jYWxjLmhvdXJzLCBwdW1wU3RhdHVzLmNhbGMuY2F0ZWdvcnkpO1xyXG4gIH1cclxuICBzZW5kQ2FsY1RvTGFjYWxEYk1heChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydENhbGMobmV3IERhdGUoKS50b1N0cmluZygpLCAxLCBwdW1wU3RhdHVzLm1heGltdW1Cb2x1c1NldHRpbmcsICcwMDowMCcsICdtYXgnKTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsRGJzdGVwKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Q2FsYyhuZXcgRGF0ZSgpLnRvU3RyaW5nKCksIDEsIHB1bXBTdGF0dXMuaW5jcmVtZW50U3RlcFNldHRpbmcsICcwMDowMCcsICdzdGVwJyk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYjMocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnREZXZpY2VTdGF0dXMoXHJcbiAgICAgIHB1bXBTdGF0dXMuaW5zdWxpbkluUG9tcExlZnQsXHJcbiAgICAgIHB1bXBTdGF0dXMuYmF0dGVyeVZvbHRhZ2UsXHJcbiAgICAgIHB1bXBTdGF0dXMuZGF0YSxcclxuICAgICAgcHVtcFN0YXR1cy5zdGF0dXNQdW1wXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGI0KHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0VGVtcEJhc2FsKFxyXG4gICAgICBwdW1wU3RhdHVzLnRlbXBvcmFyeUJhc2FsTWV0aG9kUGVyY2VudGFnZS5wZXJjZW50c09mQmFzZUJhc2FsLFxyXG4gICAgICBwdW1wU3RhdHVzLnRlbXBvcmFyeUJhc2FsTWV0aG9kUGVyY2VudGFnZS50aW1lTGVmdEluTWludXRlcyxcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UudGltZXN0YW1wXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YWZyb21Mb2NhbERiKCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7IHZhbHVlOiBudW1iZXI7IGRhdGU6IERhdGU7IG9sZDogc3RyaW5nIH0+XHJcbiAgPiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0QkcoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIHZhbHVlOiArYVswXSxcclxuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKGFbMV0pLFxyXG4gICAgICAgICAgb2xkOiB0aGlzLnNldEFycm93KGFbM10pXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYjIoKTogT2JzZXJ2YWJsZTxBcnJheTx7IHZhbHVlOiBudW1iZXI7IGRhdGU6IERhdGUgfT4+IHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5nZXRUcmVhdG1lbnRzKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICB2YWx1ZTogK2FbMF0sXHJcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShhWzFdKVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG4gIGdldENhbGNmcm9tTG9jYWxEYigpOiBPYnNlcnZhYmxlPEFycmF5PHsgaWRWYWw6IG51bWJlcjsgY2F0ZWdvcnk6IHN0cmluZzsgZGF0ZVN0cmluZzogc3RyaW5nOyB2YWx1ZTogc3RyaW5nOyBob3VyOiBzdHJpbmc7IH0+PiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0Q2FsYygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgaWRWYWw6ICthWzBdLFxyXG4gICAgICAgICAgY2F0ZWdvcnk6IGFbMV0sXHJcbiAgICAgICAgICBkYXRlU3RyaW5nOiBhWzJdLFxyXG4gICAgICAgICAgdmFsdWU6IGFbM10sXHJcbiAgICAgICAgICBob3VyOiBhWzRdXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYjMoKTogT2JzZXJ2YWJsZTxcclxuICAgIEFycmF5PHtcclxuICAgICAgcmVzZXJ2b2lyOiBudW1iZXI7XHJcbiAgICAgIHZvbHRhZ2U6IG51bWJlcjtcclxuICAgICAgZGF0ZVN0cmluZzogRGF0ZTtcclxuICAgICAgcGVyY2VudDogbnVtYmVyO1xyXG4gICAgICBzdGF0dXM6IHN0cmluZztcclxuICAgIH0+XHJcbiAgPiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0RFMoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIHJlc2Vydm9pcjogK2FbMF0sXHJcbiAgICAgICAgICB2b2x0YWdlOiArYVsxXSxcclxuICAgICAgICAgIGRhdGVTdHJpbmc6IG5ldyBEYXRlKGFbMl0pLFxyXG4gICAgICAgICAgcGVyY2VudDogK2FbM10sXHJcbiAgICAgICAgICBzdGF0dXM6IGFbNF1cclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YWZyb21Mb2NhbERiNCgpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8eyBwZXJjZW50c09mQmFzYWw6IG51bWJlcjsgbWludXRlczogbnVtYmVyOyBkYXRlU3RyaW5nOiBEYXRlIH0+XHJcbiAgPiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0VGVtcEJhc2FsKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICBwZXJjZW50c09mQmFzYWw6ICthWzBdLFxyXG4gICAgICAgICAgbWludXRlczogK2FbMV0sXHJcbiAgICAgICAgICBkYXRlU3RyaW5nOiBuZXcgRGF0ZShhWzJdKVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YXRvTmlnaHRzY291dCgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiKCkuc3Vic2NyaWJlKGdsdWNvc2VzID0+IHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2VuZE5ld0JHKGdsdWNvc2VzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQyKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGIyKCkuc3Vic2NyaWJlKHRyZWF0bWVudHMgPT4ge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zZW5kTmV3Qm9sKHRyZWF0bWVudHMpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgc3VjY2Vzc1ZhbHVlID0+IHJlc29sdmUoc3VjY2Vzc1ZhbHVlKSxcclxuICAgICAgICAgICAgZXJyb3JWYWx1ZSA9PiByZWplY3QoZXJyb3JWYWx1ZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YXRvTmlnaHRzY291dDMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYjMoKS5zdWJzY3JpYmUoZGV2aWNlU3RhdHVzID0+IHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2VuZE5ld0RldmljZXN0YXR1cyhkZXZpY2VTdGF0dXMpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgc3VjY2Vzc1ZhbHVlID0+IHJlc29sdmUoc3VjY2Vzc1ZhbHVlKSxcclxuICAgICAgICAgICAgZXJyb3JWYWx1ZSA9PiByZWplY3QoZXJyb3JWYWx1ZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGdldERhdGFGcm9tTmlnaHRzY291dCgpIHtcclxuICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2UuZ2V0Qkdmcm9tTnMoKS50aGVuKHN2ZyA9PiB7Y29uc29sZS5sb2coIFwiVEFBQUFBQUFBQUFLMjogXCIgKyBKU09OLnN0cmluZ2lmeShzdmcpKTtcclxuICAgIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3ZnWzBdKSk7XHJcbiAgICBjb25zb2xlLmxvZyhvYmouc2d2LCBzdmdbMF0pO1xyXG4gICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Qkdmcm9tTnMob2JqLnNndiwgbmV3IERhdGUob2JqLmRhdGVTdHJpbmcpLCAxKTtcclxuICAgICAvLyB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCRyhKU09OLnN0cmluZ2lmeShzdmcpKVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YXRvTmlnaHRzY291dDQoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYjQoKS5zdWJzY3JpYmUodGVtcGJhc2FsID0+IHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2VuZE5ld1RlbXBCYXNhbCh0ZW1wYmFzYWwpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgc3VjY2Vzc1ZhbHVlID0+IHJlc29sdmUoc3VjY2Vzc1ZhbHVlKSxcclxuICAgICAgICAgICAgZXJyb3JWYWx1ZSA9PiByZWplY3QoZXJyb3JWYWx1ZSlcclxuICAgICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNjYW5BbmRDb25uZWN0KCkge1xyXG4gICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLndha2VTY3JlZW5CeUNhbGwoKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2VcclxuICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICB1aWRCdDIgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVpZEJ0MiA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdDIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgdWlkQnQyICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIlxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWGFYYVhhWGFYYVwiKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiamVkbmFrIG5pZSB1ZGFsbyBzaWUgemEgMlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJPSytDT05OXCIpLFxyXG4gICAgICAgICAgICAgIDQ1MDBcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLndhaXRPblJlYWR5KCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICAgIC8vdGhpcy53YWtlRmFjYWRlU2VydmljZS5zbm9vemVTY3JlZW5CeUNhbGwoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLmNhdGNoKGVycm9yID0+IGNvbnNvbGUubG9nKFwiZXJyb3I6IFwiLCBlcnJvcikpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgfVxyXG4gICAgLy9jb25zdCBlc3RpbWF0ZWRUaW1lVG9FbmRUYXNrID0gMzAgKiAxMDAwO1xyXG4gICAgLy9zZXRUaW1lb3V0KCgpID0+IHRoaXMud2FrZUZhY2FkZVNlcnZpY2Uuc25vb3plU2NyZWVuQnlDYWxsKCksIGVzdGltYXRlZFRpbWVUb0VuZFRhc2spO1xyXG4gIH1cclxuICAgc2NhbkFuZENvbm5lY3RTdG9wKCkge1xyXG4gICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpLnRoZW4oXHJcbiAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh1aWRCdDIgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQyICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlhhWGFYYVhhWGFcIik7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoY29uc29sZS5sb2coXCJhZGFtMjMzMzMzMzNcIikpO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRBbGVydCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCksIDYzICogMTAwMCk7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpO1xyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpXHJcbiAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGFuZS50b1N0cmluZygpLmluY2x1ZGVzKFwidXJ1Y2hvbWlvbmFcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVE9QIFBPTVBBXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0b3BcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQ1KCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56b25lLnJ1biAoKCkgPT4gYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJXWk5PVyBQT01QRVwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVEFSVCBQT01QQSEhIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpBV0lFUyBQT01QRVwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSlcclxuICAgICAgICAgICAgICAgICwgNDAwKTtcclxuICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICB0aGlzLmVycm9yUHVtcFN0YW4oKTtcclxuICAgICAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICByZWplY3QoKTtcclxuICAgIH1cclxuICB9KVxyXG4gIH1cclxuICBzY2FuQW5kQ29ubmVjdEJPTChyKSB7XHJcbiAgICAvLyAgdGhpcy53YWtlRmFjYWRlU2VydmljZS53YWtlU2NyZWVuQnlDYWxsKCk7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2VcclxuICAgICAgICAgIC5zY2FuQW5kQ29ubmVjdCgpXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICAgIGlmICh1aWRCdCA9PT0gXCJNRUQtTElOS1wiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0zXCIgfHwgdWlkQnQgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicG9zemVkxYIgcHJhd2R6aXd5IHJlamVjdDExISEhISFcIiArIHVpZEJ0ICsgXCIgICAgICAgZFwiKTtcclxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zY2FuQW5kQ29ubmVjdCgpLnRoZW4oXHJcbiAgICAgICAgICAgICAgICB1aWRCdDIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBpZiAodWlkQnQyID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQyICsgXCJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdDIpO1xyXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgdWlkQnQyICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiamVkbmFrIG5pZSB1ZGFsbyBzaWUgemEgMlwiKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJPSytDT05OXCIpLFxyXG4gICAgICAgICAgICAgICAgMjUwMFxyXG4gICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSB3eXNsYW0gb2sga29uYVwiKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoY29uc29sZS5sb2coXCJhZGFtMjMzMzMzMzNcIikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHRpbWVvdXRBbGVydCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCksIDY4ICogMTAwMCk7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwieFwiKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSggZGFuZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWtcIiArIGRhbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGRhbmUudG9TdHJpbmcoKS5pbmNsdWRlcyhcInVzdGF3XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpIGJvbHVzIHpvc3RhbCBuYXN0YXdpb255XCIgKyByKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcImJvbHVzICBcIiArIHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQ1KCkuc3Vic2NyaWJlKGJ0ZGFuZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJidGRhbmU6ICEhISEhISEhISEhISEhIWYhISEhISEhJCVSU0ZEI1dFRjogLy9uXCIgKyBidGRhbmUudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ0ZGFuZS5pbmNsdWRlcyhcInBvbXBhIHBvZGFqZVwiKSAmJiAgYnRkYW5lLmluY2x1ZGVzKFwiQkw6IFwiICsgci50b1N0cmluZygpICsgXCJKXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VjY2Vzc0xvZygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiT2Rwb3dpZWR6aSB6IHBvbXB5OlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBidGRhbmUudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIkLFgsSFZCBvZHBvd2llZHppIHogcG9tcHk6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbGVjaWHFgiBixYJhZCBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDQwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuICBnZXRDYWxjRGF0YSgpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZVxyXG4gICAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwb3N6ZWTFgiBwcmF3ZHppd3kgcmVqZWN0MTEhISEhIVwiICsgdWlkQnQgKyBcIiAgICAgICBkXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh1aWRCdDIgPT09IFwiSE1Tb2Z0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0Mik7XHJcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgICB1aWRCdDIgKyBcIk5pZSB1ZGFsbyBzaWUgcG9sYWN6eWMgYm9vb29vb28gb29vb29vb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgICAgICAudGhlbihcclxuICAgICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgICAyNTAwXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIHd5c2xhbSBvayBrb25hXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwiZlwiKTtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKClcclxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YXd3ID0gIGRhbmUubWF0Y2godGhpcy53dyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaERhdGFpc2YgPSAgZGFuZS5tYXRjaCh0aGlzLmlzZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaERhdGFiZ3JhbmdlID0gIGRhbmUubWF0Y2godGhpcy5iZ1JhbmdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV1dXVzJcIiArIG1hdGNoRGF0YXd3WzFdLCBtYXRjaERhdGF3dy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXM1wiICsgbWF0Y2hEYXRhaXNmWzFdLCBtYXRjaERhdGFpc2YubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV1dXVzRcIiArIG1hdGNoRGF0YWJncmFuZ2VbMV0sIG1hdGNoRGF0YWJncmFuZ2UubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBOdW1iZXIobWF0Y2hEYXRhd3cubGVuZ3RoKTsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRhbTMgPSB0aGlzLnd3Mi5leGVjKG1hdGNoRGF0YXd3W2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrOjExMTExMSBcIiArIGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWREYXRlMjIgPSB0aGlzLnJhd0RhdGFTZXJ2aWNlLnBhcnNlRGF0YShhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEQihwYXJzZWREYXRlMjIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IE51bWJlcihtYXRjaERhdGFpc2YubGVuZ3RoKTsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRhbTMgPSB0aGlzLmlzZjIuZXhlYyhtYXRjaERhdGFpc2ZbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWs6MjIyMjIyIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgTnVtYmVyKG1hdGNoRGF0YWJncmFuZ2UubGVuZ3RoKTsgaSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRhbTMgPSB0aGlzLmJnUmFuZ2UyLmV4ZWMobWF0Y2hEYXRhYmdyYW5nZVtpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pazozMzMzMzMzIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJzZWREYXRlMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGRhbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy90aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsRGJNYXgocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEYnN0ZXAocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiVXN0YXdpZW5pYSBrYWxrdWxhdG9yYSBib2x1c2Egem9zdGHFgnkgemFwaXNhbmUgZG8gYmF6eSBkYW55Y2hcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRDYWxjZnJvbUxvY2FsRGIoKS5zdWJzY3JpYmUoZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSlcclxuICAgICAgICAgICAgICAgICAgLCAyMDApO1xyXG4gICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIGN6ZWthbSBuYSByZWFkeVwiKTtcclxuICAgICAgICAgICAgICB0aGlzLmVycm9yUHVtcFN0YW4oKTtcclxuICAgICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICB9IGNhdGNoIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRvdGFsbmEgenNzc2FqZWJrYVwiKTtcclxuICAgICAgICByZWplY3QoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4gIGVycm9yUHVtcFN0YW4oKXtcclxuICAgIGFwcFNldHRpbmdzLnNldEJvb2xlYW4oXCJpc0J1c3lcIiwgZmFsc2UpO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKFwicHVtcFN0YW5cIiwgXCJaTUlFTiBTVEFOIFBPTVBZXCIpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQ29zIHBvc3rFgm8gbmllIHRha1wiLFxyXG4gICAgICBtZXNzYWdlOiBcIlNwcmF3ZHogc3RhbiBwb21weSFcIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIlByenlqxIXFgmVtIGRvIHdpYWRvbW/Fm2NpXCJcclxuICAgIH07XHJcbiAgICBhbGVydChvcHRpb25zKTtcclxuICB9XHJcbiAgc3VjY2Vzc0xvZygpe1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiSHVycmVlZXkhISA6KVwiLFxyXG4gICAgICBtZXNzYWdlOiBcIlVkYcWCbyBzacSZIHBvZGHEhyBib2x1cyFcIixcclxuICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgIH07XHJcbiAgICBhbGVydChvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIGVzdGFibGlzaENvbm5lY3Rpb25XaXRoUHVtcCgpIHtcclxuICAgIC8vdGhpcy5zY2FuQW5kQ29ubmVjdCgpO1xyXG4gICAgLy8gc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5zY2FuQW5kQ29ubmVjdCgpLCAgNjAgKiAxMDAwKTtcclxuICAgIHRoaXMud2FrZUZhY2FkZVNlcnZpY2Uuc2V0QWxhcm0oKTtcclxuICAgIHRoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgIHRoaXMuaW50MCA9IHNldEludGVydmFsKCgpID0+IHRoaXMuc2NhbkFuZENvbm5lY3QoKSwgIDUgKiA2MCAqIDEwMDApO1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0TnVtYmVyKCdpbnQwJywgdGhpcy5pbnQwKTtcclxuXHJcbiAgfVxyXG5cclxuXHJcbiAgd2FpdE9uUmVhZHkoKSB7XHJcbiAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICB0aGlzLnRyYW5zZmVyRGF0YUZyb21QdW1wVGhlblRvQXBpKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgd2FpdE9uUmVhZHlTdG9wKCkge1xyXG4gICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAvLyB0aGlzLnRyYW5zZmVyRGF0YUZyb21QdW1wVGhlblRvQXBpKCk7XHJcbiAgICAgIHRoaXMuY2hlY1N0YXR1c1B1bXAoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBjaGVjU3RhdHVzUHVtcCgpe1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcImFcIiksIDQwMCk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKVxyXG4gICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrXCIrIGRhbmUpO1xyXG4gICAgICAgICAgaWYgKGRhbmUudG9TdHJpbmcoKS5pbmNsdWRlcyhcInVydWNob21pb25hXCIpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVE9QIFBPTVBBXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RvcFwiKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy56b25lLnJ1biAoKCkgPT4gdGhpcy5zdGFuUHVtcCA9IFwiV1lMQUNaIFBPTVBFXCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICB9KSwgNTAwKTtcclxuICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1RBUlQgUE9NUEEhISFcIik7XHJcbiAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMygpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdGhpcy56b25lLnJ1biAoKCkgPT4gdGhpcy5zdGFuUHVtcCA9IFwiV0xBQ1ogUE9NUEVcIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCl9KSwgNTAwKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAsIDQwMCk7XHJcbiAgfVxyXG5cclxuICBwcmV2ZW50TG93U3VnYXIoYTogbnVtYmVyLCBiOiBzdHJpbmcpIHtcclxuICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpICYmIGEgPD0gYXBwU2V0dGluZ3MuZ2V0TnVtYmVyKCdyYW5nZScsIDc1KSAmJiAhKGEgPT09IDApICYmICEoYS50b1N0cmluZygpID09PSAnMDAwJykgJiYgYi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdub3JtYWwnKSl7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiQUtUIFdPSk5ZXCIgKyBhICsgYiArIGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSkpO1xyXG4gICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiUG9tcGEgd3lsXCIpO1xyXG4gICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EgUE9NUEEgWkFUUlpZTUFOQSBQUlpFWiBGVU5LQ0pFIEFVVE8gU1RPUFxcblxcblwiICk7XHJcbiAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiQkFERCBBU1MgbmllIHd5bGFjem9uYVwiKSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKGFwcFNldHRpbmdzLmdldEJvb2xlYW4oJ2F1dG8nLCBmYWxzZSkgJiYgYSA+IGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSkgJiYgIShhID09PSAwKSAmJiAhKGEudG9TdHJpbmcoKSA9PT0gJzAwMCcpICYmIGIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnc3VzcGVuZCcpKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFLVCBXT0pOWTNcIiArIGEgKyBiKTtcclxuICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJQb21wYSB3bGFjem9uYVwiKTtcclxuICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EgUE9NUEEgV1pOT1dJT05BIFBSWkVaIEZVTktDSkUgQVVUTyBTVEFSVFxcblxcblwiKTtcclxuICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIkJBREQgQVNTIDIgbmllIHd5bGFjem9uYVwiKSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJOaWUgdXp5d2FtIGF1dG8gc3RvcC9zdGFydFwiICsgYSArIGIpO1xyXG4gICAgICAgIC8vTkEgVEVTVFkgVE8gV1lMQUNaWUxFTTpcclxuICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9XHJcbiAgdmFsaWRhdGVTbXMoKSB7XHJcbiAgICB0aGlzLnNtc1NlcnZpY2UuZ2V0SW5ib3hNZXNzYWdlc0Zyb21OdW1iZXIoKS50aGVuKCAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgdHJlc2Mgc21zYTogXCIgKyB0aGlzLnNtc1NlcnZpY2UubWVzc2FnZS50b1VwcGVyQ2FzZSgpICsgdGhpcy5zbXNTZXJ2aWNlLm1lc3NhZ2UudG9VcHBlckNhc2UoKS5tYXRjaCgvU1RPUC8pKTtcclxuICAgIC8vY29uc3QgZGF0ZU0gPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ2RhdGVNZXNzYWdlT2xkJywgJycpO1xyXG4gICAgaWYgKHRoaXMuc21zU2VydmljZS5tZXNzYWdlLnRvVXBwZXJDYXNlKCkubWF0Y2goL1NUT1AvKSAmJiAhKHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSA9PT0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsICcnKSkpIHtcclxuICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsIHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSk7XHJcbiAgICAgIHRoaXMuc2NhbkFuZENvbm5lY3RTdG9wKCkudGhlbihhID0+IHRoaXMuc21zU2VydmljZS5zZW5kU21zKCksICgpID0+IGNvbnNvbGUubG9nKFwiV3lzbGlqIHNtdXRuZWdvIHNtc2FcIikpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiQnJhayBrb21lbmR5IGRvIHd5a29uYW5pYVwiKTtcclxuICAgIH19KTtcclxuICB9XHJcbiAgdHJhbnNmZXJEYXRhRnJvbVB1bXBUaGVuVG9BcGkoKSB7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQyKFwic1wiKSwgMzYwMCk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMigpLnN1YnNjcmliZShkYXRhID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnVE9PT09POiAgICcgKyBkYXRhLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIHRoaXMuYnREYXRhID0gZGF0YS50b1N0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IHBhcnNlZERhdGUgPSB0aGlzLnJhd0RhdGFTZXJ2aWNlLnBhcnNlRGF0YShkYXRhKTtcclxuICAgICAgICAgIHRoaXMuc2VuZERhdGFUb0xvY2FsRGIocGFyc2VkRGF0ZSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4geyBjb25zb2xlLmxvZygnQUFBQUEgZG9zemxvJyk7IHRoaXMuc2VuZERhdGFUb0xvY2FsRGIyKHBhcnNlZERhdGUpOyB9KVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMyhwYXJzZWREYXRlKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YVRvTG9jYWxEYjQocGFyc2VkRGF0ZSkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQzKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZURTKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlQkcoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDIoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlVHJlYXRtZW50cygpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0NCgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVUZW1wQmFzYWwoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMudmFsaWRhdGVTbXMoKTtcclxuICAgICAgICAgICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYmdzb3VyY2UnLCBmYWxzZSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2UuZ2V0Qkdmcm9tTnMoKS50aGVuKHN2ZyA9PiB7Y29uc29sZS5sb2coIFwiVEFBQUFBQUFBQUFLMjogXCIgKyBKU09OLnN0cmluZ2lmeShzdmcpKTtcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzdmdbMF0pKTtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cob2JqLnNndiwgc3ZnWzBdKTtcclxuICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Qkdmcm9tTnMob2JqLnNndiwgbmV3IERhdGUob2JqLmRhdGVTdHJpbmcpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgIGQuc2V0TWludXRlcyhkLmdldE1pbnV0ZXMoKSAtIDE2KTtcclxuICAgICAgICAgICAgICAgICAgaWYgKG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSA+IGQpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJldmVudExvd1N1Z2FyKG9iai5zZ3YsIHBhcnNlZERhdGUuc3RhdHVzUHVtcC50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3RhcnkgY3VraWVyIHogTlNcIik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHKEpTT04uc3RyaW5naWZ5KHN2ZykpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJldmVudExvd1N1Z2FyKHBhcnNlZERhdGUuYmxvb2RHbHVjb3NlLnZhbHVlLCBwYXJzZWREYXRlLnN0YXR1c1B1bXAudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC8vLnRoZW4oKCkgPT4gdGhpcy53YWtlRmFjYWRlU2VydmljZS5zbm9vemVTY3JlZW5CeUNhbGwoKSlcclxuICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNub296ZVNjcmVlbkJ5Q2FsbCgpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sIDM5MDApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRBcnJvdyhvbGQ6IHN0cmluZykge1xyXG4gICAgaWYgKE51bWJlcihvbGQpID49IC01ICYmIE51bWJlcihvbGQpIDw9IDUpIHtcclxuICAgICAgb2xkID0gXCJGbGF0XCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPiA1ICYmIE51bWJlcihvbGQpIDwgMTApIHtcclxuICAgICAgb2xkID0gXCJGb3J0eUZpdmVVcFwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpID49IDEwKSB7XHJcbiAgICAgIG9sZCA9IFwiU2luZ2xlVXBcIjtcclxuICAgIH1cclxuICAgIGlmIChOdW1iZXIob2xkKSA8IC01ICYmIE51bWJlcihvbGQpID4gLTEwKSB7XHJcbiAgICAgIG9sZCA9IFwiRm9ydHlGaXZlRG93blwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpIDw9IC0xMCkge1xyXG4gICAgICBvbGQgPSBcIlNpbmdsZURvd25cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBvbGQ7XHJcbiAgfVxyXG59XHJcbiJdfQ==