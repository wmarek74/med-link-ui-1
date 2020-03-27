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
                                    if ((btdane.includes("pompa podaje") && btdane.includes("BL: " + r.toString() + "J")) ||
                                        (btdane.includes("pompa nie podaje") && btdane.includes("BL: " + r.toString() + "J") && btdane.includes(new Date().getDate().toString() + '-' + ('0' + (Number(new Date().getMonth()) + 1).toString()).slice(-2).toString()))) {
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
                    .then(function () { return _this.checkSourceBeforePrevent(parsedDate).then(function () { return _this.validateSms().then(function () { return _this.pumpBluetoothApiService.disconnect(); }); }); })
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
            sms_service_1.SmsService,
            nightscout_api_service_1.NightscoutApiService,
            pump_bluetooth_api_service_1.PumpBluetoothApiService,
            raw_data_parse_service_1.RawDataService,
            wake_facade_service_1.WakeFacadeService])
    ], DataFacadeService);
    return DataFacadeService;
}());
exports.DataFacadeService = DataFacadeService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1mYWNhZGUuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtZmFjYWRlLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0Q7QUFFbEQsNENBQXFDO0FBRXJDLGtFQUFnRTtBQUNoRSx3REFBc0Q7QUFDdEQsOEVBQTJFO0FBQzNFLHNGQUFrRjtBQUNsRiw4RUFBcUU7QUFDckUsd0VBQXFFO0FBQ3JFLGtEQUFvRDtBQUtwRDtJQVVFLDJCQUNVLGVBQWdDLEVBQ2hDLElBQVksRUFDWixVQUFzQixFQUN0QixvQkFBMEMsRUFDMUMsdUJBQWdELEVBQ2hELGNBQThCLEVBQzlCLGlCQUFvQztRQU5wQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDaEMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtRQUMxQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1FBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtRQUM5QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1FBZDlDLGFBQVEsR0FBVyxjQUFjLENBQUM7UUFDbEMsT0FBRSxHQUFHLG1FQUFtRSxDQUFDO1FBQ3pFLFFBQUcsR0FBRyxrRUFBa0UsQ0FBQztRQUN6RSxRQUFHLEdBQUcsbUVBQW1FLENBQUM7UUFDMUUsU0FBSSxHQUFHLGtFQUFrRSxDQUFDO1FBQzFFLFlBQU8sR0FBRyxxRUFBcUUsQ0FBQztRQUNoRixhQUFRLEdBQUcsb0VBQW9FLENBQUM7UUFVOUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBQ0Qsb0NBQVEsR0FBUjtRQUNFLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELDZDQUFpQixHQUFqQixVQUFrQixVQUEwQjtRQUN4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LENBa3ZCN0I7SUFBRCx3QkFBQztDQUFBLEFBbHZCRCxJQWt2QkM7QUFsdkJZLDhDQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gXCJyeGpzL29wZXJhdG9yc1wiO1xyXG5pbXBvcnQgeyBJQmFzaWNTZXR0aW5ncyB9IGZyb20gXCJ+L2FwcC9tb2RlbC9tZWQtbGluay5tb2RlbFwiO1xyXG5pbXBvcnQgeyBEYXRhYmFzZVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL2RhdGFiYXNlLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgU21zU2VydmljZSB9IGZyb20gXCJ+L2FwcC9zaGFyZWQvc21zLXNlcnZpY2VcIjtcclxuaW1wb3J0IHsgTmlnaHRzY291dEFwaVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL25pZ2h0c2NvdXQtYXBpLnNlcnZpY2VcIjtcclxuaW1wb3J0IHsgUHVtcEJsdWV0b290aEFwaVNlcnZpY2UgfSBmcm9tIFwifi9hcHAvc2hhcmVkL3B1bXAtYmx1ZXRvb3RoLWFwaS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFJhd0RhdGFTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC9yYXctZGF0YS1wYXJzZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCB7IFdha2VGYWNhZGVTZXJ2aWNlIH0gZnJvbSBcIn4vYXBwL3NoYXJlZC93YWtlLWZhY2FkZS5zZXJ2aWNlXCI7XHJcbmltcG9ydCAqIGFzIGFwcFNldHRpbmdzIGZyb20gXCJhcHBsaWNhdGlvbi1zZXR0aW5nc1wiO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46IFwicm9vdFwiXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBEYXRhRmFjYWRlU2VydmljZSB7XHJcbiAgYnREYXRhOiBzdHJpbmc7XHJcbiAgaW50MDogbnVtYmVyO1xyXG4gIHN0YW5QdW1wOiBzdHJpbmcgPSBcIlcgVFJBS0NJRS4uLlwiO1xyXG4gIHd3ID0gL3pha3Jlc1xccyhcXGR7MX0pOlxccyguXFxXXFxkezN9KVxcc0pcXC9XV1xcc3N0YXJ0XFxzZ29kei5cXHMoXFxkezJ9OlxcZHsyfSkvZztcclxuICB3dzIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzKC5cXFdcXGR7M30pXFxzSlxcL1dXXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgaXNmID0gL3pha3Jlc1xccyhcXGR7MX0pOlxcc1xccz8oXFxkezIsM30pbWcuZGxcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgaXNmMiA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHNcXHM/KFxcZHsyLDN9KW1nLmRsXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgYmdSYW5nZSA9IC96YWtyZXNcXHMoXFxkezF9KTpcXHM/KFxcZHsyLDN9LS5cXGR7MiwzfSlcXHNzdGFydFxcc2dvZHouXFxzKFxcZHsyfTpcXGR7Mn0pL2c7XHJcbiAgYmdSYW5nZTIgPSAvemFrcmVzXFxzKFxcZHsxfSk6XFxzPyhcXGR7MiwzfS0uXFxkezIsM30pXFxzc3RhcnRcXHNnb2R6LlxccyhcXGR7Mn06XFxkezJ9KS87XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGRhdGFiYXNlU2VydmljZTogRGF0YWJhc2VTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUsXHJcbiAgICBwcml2YXRlIHNtc1NlcnZpY2U6IFNtc1NlcnZpY2UsXHJcbiAgICBwcml2YXRlIG5pZ2h0c2NvdXRBcGlTZXJ2aWNlOiBOaWdodHNjb3V0QXBpU2VydmljZSxcclxuICAgIHByaXZhdGUgcHVtcEJsdWV0b290aEFwaVNlcnZpY2U6IFB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByYXdEYXRhU2VydmljZTogUmF3RGF0YVNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHdha2VGYWNhZGVTZXJ2aWNlOiBXYWtlRmFjYWRlU2VydmljZVxyXG4gICkge1xyXG4gICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuY3JlYXRlVGFibGUoKTtcclxuICB9XHJcbiAgY2xlYXJJbnQoKSB7XHJcbiAgICBjbGVhckludGVydmFsKGFwcFNldHRpbmdzLmdldE51bWJlcignaW50MCcpKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRCRyhwdW1wU3RhdHVzLmJsb29kR2x1Y29zZSk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YVRvTG9jYWxEYjIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRUcmVhdG1lbnRzKHB1bXBTdGF0dXMubGFzdEJvbHVzKTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsREIocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgcHVtcFN0YXR1cy5jYWxjLmlkVmFsLCBwdW1wU3RhdHVzLmNhbGMudmFsdWUsIHB1bXBTdGF0dXMuY2FsYy5ob3VycywgcHVtcFN0YXR1cy5jYWxjLmNhdGVnb3J5KTtcclxuICB9XHJcbiAgc2VuZENhbGNUb0xhY2FsRGJNYXgocHVtcFN0YXR1czogSUJhc2ljU2V0dGluZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGFiYXNlU2VydmljZS5pbnNlcnRDYWxjKG5ldyBEYXRlKCkudG9TdHJpbmcoKSwgMSwgcHVtcFN0YXR1cy5tYXhpbXVtQm9sdXNTZXR0aW5nLCAnMDA6MDAnLCAnbWF4Jyk7XHJcbiAgfVxyXG4gIHNlbmRDYWxjVG9MYWNhbERic3RlcChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydENhbGMobmV3IERhdGUoKS50b1N0cmluZygpLCAxLCBwdW1wU3RhdHVzLmluY3JlbWVudFN0ZXBTZXR0aW5nLCAnMDA6MDAnLCAnc3RlcCcpO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFUb0xvY2FsRGIzKHB1bXBTdGF0dXM6IElCYXNpY1NldHRpbmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0RGV2aWNlU3RhdHVzKFxyXG4gICAgICBwdW1wU3RhdHVzLmluc3VsaW5JblBvbXBMZWZ0LFxyXG4gICAgICBwdW1wU3RhdHVzLmJhdHRlcnlWb2x0YWdlLFxyXG4gICAgICBwdW1wU3RhdHVzLmRhdGEsXHJcbiAgICAgIHB1bXBTdGF0dXMuc3RhdHVzUHVtcFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhVG9Mb2NhbERiNChwdW1wU3RhdHVzOiBJQmFzaWNTZXR0aW5ncykge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydFRlbXBCYXNhbChcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UucGVyY2VudHNPZkJhc2VCYXNhbCxcclxuICAgICAgcHVtcFN0YXR1cy50ZW1wb3JhcnlCYXNhbE1ldGhvZFBlcmNlbnRhZ2UudGltZUxlZnRJbk1pbnV0ZXMsXHJcbiAgICAgIHB1bXBTdGF0dXMudGVtcG9yYXJ5QmFzYWxNZXRob2RQZXJjZW50YWdlLnRpbWVzdGFtcFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYigpOiBPYnNlcnZhYmxlPFxyXG4gICAgQXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlOyBvbGQ6IHN0cmluZyB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldEJHKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICB2YWx1ZTogK2FbMF0sXHJcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShhWzFdKSxcclxuICAgICAgICAgIG9sZDogdGhpcy5zZXRBcnJvdyhhWzNdKVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIyKCk6IE9ic2VydmFibGU8QXJyYXk8eyB2YWx1ZTogbnVtYmVyOyBkYXRlOiBEYXRlIH0+PiB7XHJcbiAgICByZXR1cm4gdGhpcy5kYXRhYmFzZVNlcnZpY2UuZ2V0VHJlYXRtZW50cygpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgdmFsdWU6ICthWzBdLFxyXG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoYVsxXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuICBnZXRDYWxjZnJvbUxvY2FsRGIoKTogT2JzZXJ2YWJsZTxBcnJheTx7IGlkVmFsOiBudW1iZXI7IGNhdGVnb3J5OiBzdHJpbmc7IGRhdGVTdHJpbmc6IHN0cmluZzsgdmFsdWU6IHN0cmluZzsgaG91cjogc3RyaW5nOyB9Pj4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldENhbGMoKS5waXBlKFxyXG4gICAgICBtYXAocm93cyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJvd3MubWFwKGEgPT4gKHtcclxuICAgICAgICAgIGlkVmFsOiArYVswXSxcclxuICAgICAgICAgIGNhdGVnb3J5OiBhWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogYVsyXSxcclxuICAgICAgICAgIHZhbHVlOiBhWzNdLFxyXG4gICAgICAgICAgaG91cjogYVs0XVxyXG4gICAgICAgIH0pKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhZnJvbUxvY2FsRGIzKCk6IE9ic2VydmFibGU8XHJcbiAgICBBcnJheTx7XHJcbiAgICAgIHJlc2Vydm9pcjogbnVtYmVyO1xyXG4gICAgICB2b2x0YWdlOiBudW1iZXI7XHJcbiAgICAgIGRhdGVTdHJpbmc6IERhdGU7XHJcbiAgICAgIHBlcmNlbnQ6IG51bWJlcjtcclxuICAgICAgc3RhdHVzOiBzdHJpbmc7XHJcbiAgICB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldERTKCkucGlwZShcclxuICAgICAgbWFwKHJvd3MgPT4ge1xyXG4gICAgICAgIHJldHVybiByb3dzLm1hcChhID0+ICh7XHJcbiAgICAgICAgICByZXNlcnZvaXI6ICthWzBdLFxyXG4gICAgICAgICAgdm9sdGFnZTogK2FbMV0sXHJcbiAgICAgICAgICBkYXRlU3RyaW5nOiBuZXcgRGF0ZShhWzJdKSxcclxuICAgICAgICAgIHBlcmNlbnQ6ICthWzNdLFxyXG4gICAgICAgICAgc3RhdHVzOiBhWzRdXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGdldERhdGFmcm9tTG9jYWxEYjQoKTogT2JzZXJ2YWJsZTxcclxuICAgIEFycmF5PHsgcGVyY2VudHNPZkJhc2FsOiBudW1iZXI7IG1pbnV0ZXM6IG51bWJlcjsgZGF0ZVN0cmluZzogRGF0ZSB9PlxyXG4gID4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmdldFRlbXBCYXNhbCgpLnBpcGUoXHJcbiAgICAgIG1hcChyb3dzID0+IHtcclxuICAgICAgICByZXR1cm4gcm93cy5tYXAoYSA9PiAoe1xyXG4gICAgICAgICAgcGVyY2VudHNPZkJhc2FsOiArYVswXSxcclxuICAgICAgICAgIG1pbnV0ZXM6ICthWzFdLFxyXG4gICAgICAgICAgZGF0ZVN0cmluZzogbmV3IERhdGUoYVsyXSlcclxuICAgICAgICB9KSk7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmdldERhdGFmcm9tTG9jYWxEYigpLnN1YnNjcmliZShnbHVjb3NlcyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdCRyhnbHVjb3NlcylcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICBzdWNjZXNzVmFsdWUgPT4gcmVzb2x2ZShzdWNjZXNzVmFsdWUpLFxyXG4gICAgICAgICAgICBlcnJvclZhbHVlID0+IHJlamVjdChlcnJvclZhbHVlKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhdG9OaWdodHNjb3V0MigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuZ2V0RGF0YWZyb21Mb2NhbERiMigpLnN1YnNjcmliZSh0cmVhdG1lbnRzID0+IHtcclxuICAgICAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2VuZE5ld0JvbCh0cmVhdG1lbnRzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGIzKCkuc3Vic2NyaWJlKGRldmljZVN0YXR1cyA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdEZXZpY2VzdGF0dXMoZGV2aWNlU3RhdHVzKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuICBnZXREYXRhRnJvbU5pZ2h0c2NvdXQoKSB7XHJcbiAgICB0aGlzLm5pZ2h0c2NvdXRBcGlTZXJ2aWNlLmdldEJHZnJvbU5zKCkudGhlbihzdmcgPT4ge2NvbnNvbGUubG9nKCBcIlRBQUFBQUFBQUFBSzI6IFwiICsgSlNPTi5zdHJpbmdpZnkoc3ZnKSk7XHJcbiAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN2Z1swXSkpO1xyXG4gICAgY29uc29sZS5sb2cob2JqLnNndiwgc3ZnWzBdKTtcclxuICAgIHRoaXMuZGF0YWJhc2VTZXJ2aWNlLmluc2VydEJHZnJvbU5zKG9iai5zZ3YsIG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSwgMSk7XHJcbiAgICAgLy8gdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0QkcoSlNPTi5zdHJpbmdpZnkoc3ZnKSlcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGF0b05pZ2h0c2NvdXQ0KCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5nZXREYXRhZnJvbUxvY2FsRGI0KCkuc3Vic2NyaWJlKHRlbXBiYXNhbCA9PiB7XHJcbiAgICAgICAgdGhpcy5uaWdodHNjb3V0QXBpU2VydmljZVxyXG4gICAgICAgICAgLnNlbmROZXdUZW1wQmFzYWwodGVtcGJhc2FsKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NWYWx1ZSA9PiByZXNvbHZlKHN1Y2Nlc3NWYWx1ZSksXHJcbiAgICAgICAgICAgIGVycm9yVmFsdWUgPT4gcmVqZWN0KGVycm9yVmFsdWUpXHJcbiAgICAgICAgICApO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzY2FuQW5kQ29ubmVjdCgpIHtcclxuICAgIC8vdGhpcy53YWtlRmFjYWRlU2VydmljZS53YWtlU2NyZWVuQnlDYWxsKCk7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgLnNjYW5BbmRDb25uZWN0KClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgaWYgKHVpZEJ0ID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstMlwiIHx8IHVpZEJ0ID09PSBcIk1FRC1MSU5LLTNcIiB8fCB1aWRCdCA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVWRhxYJvIHBvxYLEhWN6ecSHIHNpxJkgejogXCIgKyB1aWRCdCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB1aWRCdCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicG9zemVkxYIgcHJhd2R6aXd5IHJlamVjdDExISEhISFcIiArIHVpZEJ0ICsgXCIgICAgICAgZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgIHVpZEJ0MiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodWlkQnQyID09PSBcIk1FRC1MSU5LXCIgfHwgdWlkQnQyID09PSBcIk1FRC1MSU5LLTJcIiB8fCB1aWRCdDIgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0MiA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdDIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgdWlkQnQyICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb28gc3RhdHVzIDEzM1wiXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJYYVhhWGFYYVhhXCIpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJqZWRuYWsgbmllIHVkYWxvIHNpZSB6YSAyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcIk9LK0NPTk5cIiksXHJcbiAgICAgICAgICAgICAgMjUwMFxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSB3eXNsYW0gb2sga29uYVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMud2FpdE9uUmVhZHkoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIGN6ZWthbSBuYSByZWFkeVwiKTtcclxuICAgICAgICAgICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNub296ZVNjcmVlbkJ5Q2FsbCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5sb2coXCJlcnJvcjogXCIsIGVycm9yKSk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgY29uc29sZS5sb2coXCJUb3RhbG5hIHpzc3NhamVia2FcIik7XHJcbiAgICB9XHJcbiAgICAvL2NvbnN0IGVzdGltYXRlZFRpbWVUb0VuZFRhc2sgPSAzMCAqIDEwMDA7XHJcbiAgICAvL3NldFRpbWVvdXQoKCkgPT4gdGhpcy53YWtlRmFjYWRlU2VydmljZS5zbm9vemVTY3JlZW5CeUNhbGwoKSwgZXN0aW1hdGVkVGltZVRvRW5kVGFzayk7XHJcbiAgfVxyXG4gICBzY2FuQW5kQ29ubmVjdFN0b3AoKSB7XHJcbiAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2VcclxuICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2codWlkQnQgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVpZEJ0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCIpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdWlkQnQgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNjYW5BbmRDb25uZWN0KCkudGhlbihcclxuICAgICAgICAgICAgICB1aWRCdDIgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVpZEJ0MiA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdDIgKyBcIkJCQkJCQkJCQkJCQkJCQkJCQkJCQlwiKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdDIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICAgICAgdWlkQnQyICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIlxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWGFYYVhhWGFYYVwiKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiamVkbmFrIG5pZSB1ZGFsbyBzaWUgemEgMlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJPSytDT05OXCIpLFxyXG4gICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChjb25zb2xlLmxvZyhcImFkYW0yMzMzMzMzM1wiKSk7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICAudGhlbihcclxuICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdGltZW91dEFsZXJ0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSwgNjMgKiAxMDAwKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcImFcIik7XHJcbiAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSggZGFuZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrXCIrIGRhbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1cnVjaG9taW9uYVwiKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUT1AgUE9NUEFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RvcFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDUoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIldaTsOTVyBQT01QxJhcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVEFSVCBQT01QQSEhIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuICgoKSA9PiBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpBV0lFxZogUE9NUMSYXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRBbGVydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0pLCA1MDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpXHJcbiAgICAgICAgICAgICAgICAsIDQwMCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiemF0ZW0gbmllIGN6ZWthbSBuYSByZWFkeVwiKTtcclxuICAgICAgICAgICAgdGhpcy5lcnJvclB1bXBTdGFuKCk7XHJcbiAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlRvdGFsbmEgenNzc2FqZWJrYVwiKTtcclxuICAgICAgcmVqZWN0KCk7XHJcbiAgICB9XHJcbiAgfSlcclxuICB9XHJcbiAgc2NhbkFuZENvbm5lY3RCT0wocikge1xyXG4gICAgLy8gIHRoaXMud2FrZUZhY2FkZVNlcnZpY2Uud2FrZVNjcmVlbkJ5Q2FsbCgpO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHVpZEJ0MiA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCB0aW1lb3V0QWxlcnQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpLCA2OSAqIDEwMDApO1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcInhcIik7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrXCIgKyBkYW5lICsgXCJrb25pZWMgZGFueWNoIC8gd3luaWt1XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGRhbmUudG9TdHJpbmcoKS5pbmNsdWRlcyhcInVzdGF3XCIpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUYWtpIGJvbHVzIHpvc3RhbCBuYXN0YXdpb255OiBcIiArIHIgKyAneiB0YWthIGRhdGE6ICcgKyBuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEgKS50b1N0cmluZygpKS5zbGljZSgtMikudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2VuZENvbW1hbmQoXCJib2x1cyAgXCIgKyByKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkNigpLnN1YnNjcmliZShidGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYnRkYW5lOiAhISEhISEhISEhISEhXCIgKyBidGRhbmUudG9TdHJpbmcoKSArIFwia29uaWVjISEhXCIgKyBuZXcgRGF0ZSgpLmdldERheSgpLnRvU3RyaW5nKCkgKyAnLScgKyBuZXcgRGF0ZSgpLmdldE1vbnRoKCkudG9TdHJpbmcoKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoYnRkYW5lLmluY2x1ZGVzKFwicG9tcGEgcG9kYWplXCIpICYmICBidGRhbmUuaW5jbHVkZXMoXCJCTDogXCIgKyByLnRvU3RyaW5nKCkgKyBcIkpcIikpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYnRkYW5lLmluY2x1ZGVzKFwicG9tcGEgbmllIHBvZGFqZVwiKSAmJiAgYnRkYW5lLmluY2x1ZGVzKFwiQkw6IFwiICsgci50b1N0cmluZygpICsgXCJKXCIpICYmIGJ0ZGFuZS5pbmNsdWRlcyhuZXcgRGF0ZSgpLmdldERhdGUoKS50b1N0cmluZygpICsgJy0nICsgKCcwJyArIChOdW1iZXIobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpLnRvU3RyaW5nKCkpLnNsaWNlKC0yKS50b1N0cmluZygpKSkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWNjZXNzTG9nKHIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJPZHBvd2llZHppIHogcG9tcHk6XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGJ0ZGFuZS50b1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBva0J1dHRvblRleHQ6IFwiT0tcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEFsZXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLCA1MDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiQsWCxIVkIG9kcG93aWVkemkgeiBwb21weTpcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYW5lLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb2tCdXR0b25UZXh0OiBcIk9LXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUG9sZWNpYcWCIGLFgmFkIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0QWxlcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpXHJcbiAgICAgICAgICAgICAgICAgICwgNDAwKTtcclxuICAgICAgICAgICAgICB9LCAoKSA9PiB0aGlzLmVycm9yUHVtcFN0YW4oKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInphdGVtIG5pZSBjemVrYW0gbmEgcmVhZHlcIik7XHJcbiAgICAgICAgICAgICAgdGhpcy5lcnJvclB1bXBTdGFuKCk7XHJcbiAgICAgICAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJUb3RhbG5hIHpzc3NhamVia2FcIik7XHJcbiAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG4gIGdldENhbGNEYXRhKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlXHJcbiAgICAgICAgICAuc2NhbkFuZENvbm5lY3QoKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBpZiAodWlkQnQgPT09IFwiTUVELUxJTktcIiB8fCB1aWRCdCA9PT0gXCJNRUQtTElOSy0yXCIgfHwgdWlkQnQgPT09IFwiTUVELUxJTkstM1wiIHx8IHVpZEJ0ID09PSBcIkhNU29mdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh1aWRCdCArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1aWRCdCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0ICsgXCJOaWUgdWRhbG8gc2llIHBvbGFjenljIGJvb29vb29vIG9vb29vb29vIHN0YXR1cyAxMzNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHVpZEJ0ID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3plZMWCIHByYXdkeml3eSByZWplY3QxMSEhISEhXCIgKyB1aWRCdCArIFwiICAgICAgIGRcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2Uuc2NhbkFuZENvbm5lY3QoKS50aGVuKFxyXG4gICAgICAgICAgICAgICAgdWlkQnQyID0+IHtcclxuICAgICAgICAgICAgICAgICAgaWYgKHVpZEJ0MiA9PT0gXCJITVNvZnRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVpZEJ0MiArIFwiQkJCQkJCQkJCQkJCQkJCQkJCQkJCXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodWlkQnQyKTtcclxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHVpZEJ0MiArIFwiTmllIHVkYWxvIHNpZSBwb2xhY3p5YyBib29vb29vbyBvb29vb29vbyBzdGF0dXMgMTMzXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImplZG5hayBuaWUgdWRhbG8gc2llIHphIDJcIik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIClcclxuICAgICAgICAgIC50aGVuKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwiT0srQ09OTlwiKSxcclxuICAgICAgICAgICAgICAgIDI1MDBcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgd3lzbGFtIG9rIGtvbmFcIik7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGNvbnNvbGUubG9nKFwiYWRhbTIzMzMzMzMzXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgICAgLnRoZW4oXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJmXCIpO1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoIGRhbmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hEYXRhd3cgPSAgZGFuZS5tYXRjaCh0aGlzLnd3KTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWlzZiA9ICBkYW5lLm1hdGNoKHRoaXMuaXNmKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoRGF0YWJncmFuZ2UgPSAgZGFuZS5tYXRjaCh0aGlzLmJnUmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXMlwiICsgbWF0Y2hEYXRhd3dbMV0sIG1hdGNoRGF0YXd3Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIldXV1czXCIgKyBtYXRjaERhdGFpc2ZbMV0sIG1hdGNoRGF0YWlzZi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dXNFwiICsgbWF0Y2hEYXRhYmdyYW5nZVsxXSwgbWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IE51bWJlcihtYXRjaERhdGF3dy5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMud3cyLmV4ZWMobWF0Y2hEYXRhd3dbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvIGplc3Qgd3luaWs6MTExMTExIFwiICsgYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyMiA9IHRoaXMucmF3RGF0YVNlcnZpY2UucGFyc2VEYXRhKGFkYW0zLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERCKHBhcnNlZERhdGUyMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgTnVtYmVyKG1hdGNoRGF0YWlzZi5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuaXNmMi5leGVjKG1hdGNoRGF0YWlzZltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pazoyMjIyMjIgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBOdW1iZXIobWF0Y2hEYXRhYmdyYW5nZS5sZW5ndGgpOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhZGFtMyA9IHRoaXMuYmdSYW5nZTIuZXhlYyhtYXRjaERhdGFiZ3JhbmdlW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUbyBqZXN0IHd5bmlrOjMzMzMzMzMgXCIgKyBhZGFtMy50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0ZTIyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoYWRhbTMudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIyKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZERhdGUyID0gdGhpcy5yYXdEYXRhU2VydmljZS5wYXJzZURhdGEoZGFuZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvL3RoaXMuc2VuZENhbGNUb0xhY2FsREIocGFyc2VkRGF0ZTIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQ2FsY1RvTGFjYWxEYk1heChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRDYWxjVG9MYWNhbERic3RlcChwYXJzZWREYXRlMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJVc3Rhd2llbmlhIGthbGt1bGF0b3JhIGJvbHVzYSB6b3N0YcWCeSB6YXBpc2FuZSBkbyBiYXp5IGRhbnljaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBkYW5lLnRvU3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldENhbGNmcm9tTG9jYWxEYigpLnN1YnNjcmliZShkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHRoaXMuZXJyb3JQdW1wU3RhbigpKVxyXG4gICAgICAgICAgICAgICAgICAsIDIwMCk7XHJcbiAgICAgICAgICAgICAgfSwgKCkgPT4gdGhpcy5lcnJvclB1bXBTdGFuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6YXRlbSBuaWUgY3pla2FtIG5hIHJlYWR5XCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JQdW1wU3RhbigpO1xyXG4gICAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICApXHJcbiAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiVG90YWxuYSB6c3NzYWplYmthXCIpO1xyXG4gICAgICAgIHJlamVjdCgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbiAgZXJyb3JQdW1wU3Rhbigpe1xyXG4gICAgYXBwU2V0dGluZ3Muc2V0Qm9vbGVhbihcImlzQnVzeVwiLCBmYWxzZSk7XHJcbiAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJwdW1wU3RhblwiLCBcIlpNSUXFgyBTVEFOIFBPTVBZXCIpO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQ2/FmyBwb3N6xYJvIG5pZSB0YWtcIixcclxuICAgICAgbWVzc2FnZTogXCJTcHJhd2TFuiBzdGFuIHBvbXB5IVwiLFxyXG4gICAgICBva0J1dHRvblRleHQ6IFwiUHJ6eWrEhcWCZW0gZG8gd2lhZG9tb8WbY2lcIlxyXG4gICAgfTtcclxuICAgIGFsZXJ0KG9wdGlvbnMpO1xyXG4gIH1cclxuICBzdWNjZXNzTG9nKHIpe1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgdGl0bGU6IFwiQnJhd28hXCIsXHJcbiAgICAgIG1lc3NhZ2U6IFwiVWRhxYJvIHNpxJkgcG9kYcSHIGJvbHVzOiBcIiArIHIudG9TdHJpbmcoKSArIFwiIEpcIiAsXHJcbiAgICAgIG9rQnV0dG9uVGV4dDogXCJPS1wiXHJcbiAgICB9O1xyXG4gICAgYWxlcnQob3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICBlc3RhYmxpc2hDb25uZWN0aW9uV2l0aFB1bXAoKSB7XHJcbiAgICAvL3RoaXMuc2NhbkFuZENvbm5lY3QoKTtcclxuICAgIC8vIHNldEludGVydmFsKCgpID0+IHRoaXMuc2NhbkFuZENvbm5lY3QoKSwgIDYwICogMTAwMCk7XHJcbiAgICB0aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNldEFsYXJtKCk7XHJcbiAgICB0aGlzLnNjYW5BbmRDb25uZWN0KCk7XHJcbiAgICB0aGlzLmludDAgPSBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLnNjYW5BbmRDb25uZWN0KCksICA1ICogNjAgKiAxMDAwKTtcclxuICAgIGFwcFNldHRpbmdzLnNldE51bWJlcignaW50MCcsIHRoaXMuaW50MCk7XHJcblxyXG4gIH1cclxuXHJcblxyXG4gIHdhaXRPblJlYWR5KCkge1xyXG4gICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkKCkuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHdhaXRPblJlYWR5U3RvcCgpIHtcclxuICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZCgpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgLy8gdGhpcy50cmFuc2ZlckRhdGFGcm9tUHVtcFRoZW5Ub0FwaSgpO1xyXG4gICAgICB0aGlzLmNoZWNTdGF0dXNQdW1wKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY2hlY1N0YXR1c1B1bXAoKXtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZDIoXCJhXCIpLCA0MDApO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnJlYWQzKClcclxuICAgICAgICAuc3Vic2NyaWJlKCBkYW5lID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVG8gamVzdCB3eW5pa1wiKyBkYW5lKTtcclxuICAgICAgICAgIGlmIChkYW5lLnRvU3RyaW5nKCkuaW5jbHVkZXMoXCJ1cnVjaG9taW9uYVwiKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1RPUCBQT01QQVwiKTtcclxuICAgICAgICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5zZW5kQ29tbWFuZChcInN0b3BcIik7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IHRoaXMuc3RhblB1bXAgPSBcIldZxYHEhENaIFBPTVDEmFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgfSksIDUwMCk7XHJcbiAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNUQVJUIFBPTVBBISEhXCIpO1xyXG4gICAgICAgICAgICB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kKFwic3RhcnRcIik7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UucmVhZDMoKS5zdWJzY3JpYmUoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4gKCgpID0+IHRoaXMuc3RhblB1bXAgPSBcIlfFgcSEQ1ogUE9NUMSYXCIpO1xyXG4gICAgICAgICAgICAgIHRoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpfSksIDUwMCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgLCA0MDApO1xyXG4gIH1cclxuXHJcbiAgcHJldmVudExvd1N1Z2FyKGE6IG51bWJlciwgYjogc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBpZiAoYXBwU2V0dGluZ3MuZ2V0Qm9vbGVhbignYXV0bycsIGZhbHNlKSAmJiBhIDw9IGFwcFNldHRpbmdzLmdldE51bWJlcigncmFuZ2UnLCA3NSkgJiYgIShhID09PSAwKSAmJiAhKGEudG9TdHJpbmcoKSA9PT0gJzAwMCcpICYmIGIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbm9ybWFsJykpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkFLVCBXT0pOWVwiICsgYSArIGIgKyBhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpKTtcclxuICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJQb21wYSB3eWxcIik7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICBhcHBTZXR0aW5ncy5zZXRTdHJpbmcoXCJhdXRvc3RvcFwiLCBuZXcgRGF0ZSgpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDMsIDIxKSArIFwiIFVXQUdBISBQT01QQSBaQVRSWllNQU5BIFBSWkVaIEZVTktDSsSYIEFVVE8gU1RPUFxcblxcblwiKTtcclxuICAgICAgICB9LCAoKSA9PiBjb25zb2xlLmxvZyhcIkJBREQgQVNTIG5pZSB3eWxhY3pvbmFcIikpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdhdXRvJywgZmFsc2UpICYmIGEgPiBhcHBTZXR0aW5ncy5nZXROdW1iZXIoJ3JhbmdlJywgNzUpICYmICEoYSA9PT0gMCkgJiYgIShhLnRvU3RyaW5nKCkgPT09ICcwMDAnKSAmJiBiLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ3N1c3BlbmQnKSkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJBS1QgV09KTlkzXCIgKyBhICsgYik7XHJcbiAgICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBvbXBhIHdsYWN6b25hXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIGFwcFNldHRpbmdzLnNldFN0cmluZyhcImF1dG9zdG9wXCIsIG5ldyBEYXRlKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMywgMjEpICsgXCIgVVdBR0EhIFBPTVBBIFdaTk9XSU9OQSBQUlpFWiBGVU5LQ0rEmCBBVVRPIFNUQVJUXFxuXFxuXCIpO1xyXG4gICAgICAgICAgfSwgKCkgPT4gY29uc29sZS5sb2coXCJCQUREIEFTUyAyIG5pZSB3eWxhY3pvbmFcIikpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIk5pZSB1enl3YW0gYXV0byBzdG9wL3N0YXJ0OiBcIiArIGEgKyBiKTtcclxuICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIC8vTkEgVEVTVFkgVE8gV1lMQUNaWUxFTTpcclxuICAgICAgICAgIC8vdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgdmFsaWRhdGVTbXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCBwaG9uZU51bWIgPSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ3Bob25lTicsIG51bGwpO1xyXG4gICAgICBjb25zb2xlLmxvZyhcInRvIGplc3QgbnVtZXIgdGVsOlwiICsgcGhvbmVOdW1iKTtcclxuICAgICAgaWYgKHBob25lTnVtYiAhPT0gbnVsbCAmJiBwaG9uZU51bWIgIT09ICdQb2RhaiBuciB0ZWwuIG9waWVrdW5hJykge1xyXG4gICAgICAgIHRoaXMuc21zU2VydmljZS5nZXRJbmJveE1lc3NhZ2VzRnJvbU51bWJlcigpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJ0byBqZXN0IHRyZXNjIHNtc2E6IFwiICsgdGhpcy5zbXNTZXJ2aWNlLm1lc3NhZ2UudG9VcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAvL2NvbnN0IGRhdGVNID0gYXBwU2V0dGluZ3MuZ2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsICcnKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwidG8gamVzdCBkYXRhOiBcIiArIG5ldyBEYXRlKCkudmFsdWVPZigpICsgXCJhIHRvIGRhdGEgc21zYTogXCIgKyB0aGlzLnNtc1NlcnZpY2UuZGF0ZU1lc3NhZ2UgKyBcIiBhIHRvIGplc3QgZGF0YSBvZGpldGEgbyAxNSBtaW4gbyBzeXNkYXRlOiBcIiArIChOdW1iZXIobmV3IERhdGUoKS52YWx1ZU9mKCkpIC0gOTYwMDAwKSk7XHJcbiAgICAgICAgICBpZiAodGhpcy5zbXNTZXJ2aWNlLm1lc3NhZ2UudG9VcHBlckNhc2UoKSA9PT0gJ1NUT1AnICYmICEodGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlID09PSBhcHBTZXR0aW5ncy5nZXRTdHJpbmcoJ2RhdGVNZXNzYWdlT2xkJywgJycpKSAmJiBOdW1iZXIodGhpcy5zbXNTZXJ2aWNlLmRhdGVNZXNzYWdlKSA+IChOdW1iZXIobmV3IERhdGUoKS52YWx1ZU9mKCkpIC0gOTYwMDAwKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNjYW5BbmRDb25uZWN0U3RvcCgpLnRoZW4oYSA9PiB7XHJcbiAgICAgICAgICAgICAgYXBwU2V0dGluZ3Muc2V0U3RyaW5nKCdkYXRlTWVzc2FnZU9sZCcsIHRoaXMuc21zU2VydmljZS5kYXRlTWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5zbXNTZXJ2aWNlLnNlbmRTbXMoKTtcclxuICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0sICgpID0+IGNvbnNvbGUubG9nKFwiV3lzbGlqIHNtdXRuZWdvIHNtc2FcIikpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCcmFrIGtvbWVuZHkgZG8gd3lrb25hbmlhXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY2hlY2tTb3VyY2VCZWZvcmVQcmV2ZW50KHBhcnNlZERhdGUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmIChhcHBTZXR0aW5ncy5nZXRCb29sZWFuKCdiZ3NvdXJjZScsIGZhbHNlKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMubmlnaHRzY291dEFwaVNlcnZpY2UuZ2V0Qkdmcm9tTnMoKS50aGVuKHN2ZyA9PiB7Y29uc29sZS5sb2coIFwiVEFBQUFBQUFBQUFLMjogXCIgKyBKU09OLnN0cmluZ2lmeShzdmcpKTtcclxuICAgICAgICAgIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3ZnWzBdKSk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhvYmouc2d2LCBzdmdbMF0pO1xyXG4gICAgICAgICAgdGhpcy5kYXRhYmFzZVNlcnZpY2UuaW5zZXJ0Qkdmcm9tTnMob2JqLnNndiwgbmV3IERhdGUob2JqLmRhdGVTdHJpbmcpLCAxKTtcclxuICAgICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgZC5zZXRNaW51dGVzKGQuZ2V0TWludXRlcygpIC0gMTYpO1xyXG4gICAgICAgICAgaWYgKG5ldyBEYXRlKG9iai5kYXRlU3RyaW5nKSA+IGQpe1xyXG4gICAgICAgICAgICB0aGlzLnByZXZlbnRMb3dTdWdhcihvYmouc2d2LCBwYXJzZWREYXRlLnN0YXR1c1B1bXAudG9TdHJpbmcoKSkudGhlbiggKCkgPT4gcmVzb2x2ZSgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN0YXJ5IGN1a2llciB6IE5TXCIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMucHJldmVudExvd1N1Z2FyKHBhcnNlZERhdGUuYmxvb2RHbHVjb3NlLnZhbHVlLCBwYXJzZWREYXRlLnN0YXR1c1B1bXAudG9TdHJpbmcoKSkudGhlbiggKCkgPT4gcmVzb2x2ZSgpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHRyYW5zZmVyRGF0YUZyb21QdW1wVGhlblRvQXBpKCkge1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnB1bXBCbHVldG9vdGhBcGlTZXJ2aWNlLnNlbmRDb21tYW5kMihcInNcIiksIDQwMCk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5yZWFkMigpLnN1YnNjcmliZShkYXRhID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnVE9PT09POiAgICcgKyBkYXRhLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIHRoaXMuYnREYXRhID0gZGF0YS50b1N0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IHBhcnNlZERhdGUgPSB0aGlzLnJhd0RhdGFTZXJ2aWNlLnBhcnNlRGF0YShkYXRhKTtcclxuICAgICAgICAgIHRoaXMuc2VuZERhdGFUb0xvY2FsRGIocGFyc2VkRGF0ZSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4geyBjb25zb2xlLmxvZygnQUFBQUEgZG9zemxvJyk7IHRoaXMuc2VuZERhdGFUb0xvY2FsRGIyKHBhcnNlZERhdGUpOyB9KVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhVG9Mb2NhbERiMyhwYXJzZWREYXRlKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YVRvTG9jYWxEYjQocGFyc2VkRGF0ZSkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQzKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZGF0YWJhc2VTZXJ2aWNlLnVwZGF0ZURTKCkpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuc2VuZERhdGF0b05pZ2h0c2NvdXQoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlQkcoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5zZW5kRGF0YXRvTmlnaHRzY291dDIoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kYXRhYmFzZVNlcnZpY2UudXBkYXRlVHJlYXRtZW50cygpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLnNlbmREYXRhdG9OaWdodHNjb3V0NCgpKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmRhdGFiYXNlU2VydmljZS51cGRhdGVUZW1wQmFzYWwoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gIHRoaXMuY2hlY2tTb3VyY2VCZWZvcmVQcmV2ZW50KHBhcnNlZERhdGUpLnRoZW4oKCkgPT4gdGhpcy52YWxpZGF0ZVNtcygpLnRoZW4oKCkgPT4gdGhpcy5wdW1wQmx1ZXRvb3RoQXBpU2VydmljZS5kaXNjb25uZWN0KCkpKSlcclxuICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgLy90aGlzLndha2VGYWNhZGVTZXJ2aWNlLnNub296ZVNjcmVlbkJ5Q2FsbCgpXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAvL3RoaXMucHVtcEJsdWV0b290aEFwaVNlcnZpY2UuZGlzY29ubmVjdCgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sIDQwMCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldEFycm93KG9sZDogc3RyaW5nKSB7XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPj0gLTUgJiYgTnVtYmVyKG9sZCkgPD0gNSkge1xyXG4gICAgICBvbGQgPSBcIkZsYXRcIjtcclxuICAgIH1cclxuICAgIGlmIChOdW1iZXIob2xkKSA+IDUgJiYgTnVtYmVyKG9sZCkgPCAxMCkge1xyXG4gICAgICBvbGQgPSBcIkZvcnR5Rml2ZVVwXCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPj0gMTApIHtcclxuICAgICAgb2xkID0gXCJTaW5nbGVVcFwiO1xyXG4gICAgfVxyXG4gICAgaWYgKE51bWJlcihvbGQpIDwgLTUgJiYgTnVtYmVyKG9sZCkgPiAtMTApIHtcclxuICAgICAgb2xkID0gXCJGb3J0eUZpdmVEb3duXCI7XHJcbiAgICB9XHJcbiAgICBpZiAoTnVtYmVyKG9sZCkgPD0gLTEwKSB7XHJcbiAgICAgIG9sZCA9IFwiU2luZ2xlRG93blwiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9sZDtcclxuICB9XHJcbn1cclxuIl19