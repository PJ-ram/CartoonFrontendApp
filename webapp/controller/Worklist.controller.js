sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "../model/qrcode"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageBox, Fragment, UIColumn, Column, Label, ColumnListItem, qrcode) {
    "use strict";

    return BaseController.extend("com.tolaram.app.pp.zppcartoncreat.controller.Worklist", {

        formatter: formatter,
        QRCode: qrcode,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText: this.getResourceBundle().getText("tableNoDataText")
            });
            this.setModel(oViewModel, "worklistView");

            this._ApplicationModel = this.getOwnerComponent().getModel("appModel");
            this._PrintModel = this.getOwnerComponent().getModel("printModel");

            this.bCompact = !!this.getView().$().closest("sapUiSizeCompact").length;
            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);
            this.getView().setModel(this._oMessageManager.getMessageModel(), "message");
            this._resourceInput = this.getView().byId("resourceInpId");
            this._processOrderInput = this.getView().byId("processInpId");
            this._printButton = this.getView().byId("printBTN");
            //this._rePrintButton = this.getView().byId("rePrintBTN");
            this._oMainScreenPage = this.getView().byId("objectpage")

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },
        onPrint: function () {
            this._printButton.setEnabled(false);
            this._validatePrint();
        },
        onRePrint: function () {
            this._validateRePrint();
        },        
        _ErrorHandler: function (oData) {
            //this._oMessageManager.getMessageModel().setData(this._oMessageManager.getMessageModel().getData().push(oData.Message));
            this._saveMessage(oData, "Error");
            this._oMainScreenPage.setShowFooter(true);
            this.getView().setBusy(false);
            MessageBox.error(
                this.getResourceBundle().getText("ErrorEncountered"), { styleClass: this._bCompact ? "sapUiSizeCompact" : "" }
            );
        },
        _SuccessMessageDisplay: function (oData) {
            //this._oMessageManager.getMessageModel().setData(this._oMessageManager.getMessageModel().getData().push(oData.Message));
            this._saveMessage(oData, "Success");
            this._oMainScreenPage.setShowFooter(true);
            this.getView().setBusy(false);
            /*MessageBox.error(
                this.getResourceBundle().getText("ErrorEncountered"), { styleClass: this._bCompact ? "sapUiSizeCompact" : "" }
            );*/
        },
        _ErrorMessageDisplay: function (oData) {
            //this._oMessageManager.getMessageModel().setData(this._oMessageManager.getMessageModel().getData().push(oData.Message));
            this._saveMessage(oData, "Error");
            this._oMainScreenPage.setShowFooter(true);
            this.getView().setBusy(false);
            /*MessageBox.error(
                this.getResourceBundle().getText("ErrorEncountered"), { styleClass: this._bCompact ? "sapUiSizeCompact" : "" }
            );*/
        },
        _getUniqueMessage: function (aMessage) {
            var aSeen = {}, aUniqueMessage = [], iCounter = 0, item;
            for (var i = 0; i < aMessage.length; i++) {
                var item = aMessage[i];
                if (aSeen[item] !== 1) {
                    aSeen[item] = 1;
                    aUniqueMessage[iCounter++] = item;
                }
            }
        },
        _saveMessage: function (oData, oType) {
            var existingData = [];
            var dataLength = this._oMessageManager.getMessageModel().getData().length;
            if (dataLength > 0) {
                existingData = this._oMessageManager.getMessageModel().getData();
                existingData.push({
                    "message": oData.Message,
                    "type": oType
                });
                this._oMessageManager.getMessageModel().setData(existingData);
            } else {
                existingData = [];
                existingData.push({
                    "message": oData.Message,
                    "type": oType
                });
                this._oMessageManager.getMessageModel().setData(existingData);
            }

        },
        onResourceValidateChange: function (oEvent) {            
            var oResourceIDScanned = oEvent.getSource().getValue();
            if(oResourceIDScanned.length === 8){
                this._ApplicationModel.setProperty("/ResourceID", oResourceIDScanned);
                var data = {
                    "ResourceID": oResourceIDScanned,
                    "ConsumedAt": ""
                };
                this._validateResource(data);
            }else{

            }
            
        },
        onResourceValidatePress: function (oEvent) {
            
            var oResourceIDEntered = oEvent.getSource().getValue();
            this._ApplicationModel.setProperty("/ResourceID", oResourceIDEntered);
            var data = {
                "ResourceID": oResourceIDEntered,
                "ConsumedAt": ""
            };
            this._validateResource(data);
        },
        _validateResourceId: function () {
            var data = {
                "ResourceID": this._ApplicationModel.getData().ResourceID,
                "ConsumedAt": this._ApplicationModel.getData().Plant
            };
            this._validateResource(data);

        },
        _validateResource: function (data) {
            this.getView().setBusy(true);
            this.getOwnerComponent().getModel().create("/ResourceSet", data, {
                "success": this._SuccessHandlerResource.bind(this),
                "error": this._ErrorHandler.bind(this)
            })
        },
        _SuccessHandlerResource: function (oData, oResponse) {
            if (oData.ResourceID === this._ApplicationModel.getData().ResourceID) {
                if (oData.Statusid === "S") {
                    this._resourceInput.setEnabled(false);
                    this._processOrderInput.setEnabled(true);
                    this._SuccessMessageDisplay(oData);
                    $.sap.delayedCall(500,this,function(){
                        this._processOrderInput.focus();
                        this._processOrderInput.getDomRef().scrollIntoView();
                    })
                    
                }
                else if (oData.Statusid === "E") {
                    this._ErrorMessageDisplay(oData);
                }
            } else {
                this._ErrorHandler.bind(this);
            }
            this.getView().setBusy(false);
        },
        onProcessValidatePress: function (oEvent) {
            
            var oProcessIDEntered = oEvent.getSource().getValue();
            var data = {
                "Processorder": oProcessIDEntered,
                "Resource": this._ApplicationModel.getData().ResourceID
            };
            this._validateProcess(data);
        },
        _validateProcessId: function () {   

            var data = {
                "Processorder": this._ApplicationModel.getData().Processorder,
                "Resource": this._ApplicationModel.getData().ResourceID
            };
            this._validateProcess(data);

        },
        _validateProcess: function (data) {
            this.getView().setBusy(true);
            this.onClearDetails();
            this.removeInnerHTMLForm()
            this.hideForm();
            this._printButton.setEnabled(false);
            this.getOwnerComponent().getModel().create("/ProcessSet", data, {
                "success": this._SuccessHandlerProcess.bind(this),
                "error": this._ErrorHandler.bind(this)
            });
        },
        _SuccessHandlerProcess: function (oData, oResponse) {
            if (oData.Statusid === "S") {
                this._printButton.setEnabled(true);
                //this._rePrintButton.setEnabled(false);
                this._SuccessMessageDisplay(oData);
                this._printData(oData);
                this.__onFormCreate()
                this.displayForm();
            } else if (oData.Statusid === "P") {
                this._printButton.setEnabled(false);
                //this._rePrintButton.setEnabled(true);
                this._SuccessMessageDisplay(oData);
            }
            else if (oData.Statusid === "E") {
                this._ErrorMessageDisplay(oData);
            }
            else {
                this._ErrorHandler.bind(this);
            }
            this.getView().setBusy(false);
        },
        _printData: function (oData) {
            this._PrintModel.setProperty("/ResourceID", this._ApplicationModel.getData().ResourceID)
            this._PrintModel.setProperty("/Plant", this._ApplicationModel.getData().Plant)
            this._PrintModel.setProperty("/Processorder", this._ApplicationModel.getData().Processorder)
            this._PrintModel.setProperty("/PostingDate", this._ApplicationModel.getData().PostingDate);
            this._PrintModel.setProperty("/Material", oData.Material);
            this._PrintModel.setProperty("/MaterialName", oData.Materialtext);
            this._PrintModel.setProperty("/TargetQuantity", oData.TargetQuantity);
            this._PrintModel.setProperty("/Unit", oData.Unit);
            this._PrintModel.setProperty("/Batch", oData.Batch);
            this._PrintModel.setProperty("/CartonId", oData.Cartonid);
            this._PrintModel.setProperty("/Statusid", oData.Statusid);
            this._PrintModel.setProperty("/Normt", oData.Normt);
            this._PrintModel.setProperty("/Loanz", oData.Loanz);
            this._PrintModel.setProperty("/PrintDate", oData.PrintDate);
        },
        onClearInput:function(){
            this._resourceInput.setValue("");
            this._processOrderInput.setValue("");
        },
        onClearDetails(){
            this._PrintModel.setProperty("/ResourceID", "")
            this._PrintModel.setProperty("/Plant", "")
            this._PrintModel.setProperty("/Processorder", "")
            this._PrintModel.setProperty("/PostingDate", "");
            this._PrintModel.setProperty("/Material", "");
            this._PrintModel.setProperty("/MaterialName", "");
            this._PrintModel.setProperty("/TargetQuantity", "");
            this._PrintModel.setProperty("/Unit", "");
            this._PrintModel.setProperty("/Batch", "");
            this._PrintModel.setProperty("/CartonId", "");
            this._PrintModel.setProperty("/Statusid", "");
            this._PrintModel.setProperty("/Normt", "");
            this._PrintModel.setProperty("/Loanz", "");
            this._PrintModel.setProperty("/PrintDate", "");
        },
        onClear: function () {           
            this.onClearInput();
            this.onClearDetails();
            this.removeInnerHTMLForm();
            this.hideForm();
            this._printButton.setEnabled(false);
            this._resourceInput.setEnabled(true);
            this._processOrderInput.setEnabled(false);
        },
        displayForm: function () {
            document.getElementById("form").style.display = "block";
            //document.getElementById("btn").style.display = "block";
            //document.getElementById("span").style.display = "block";
        },
        hideForm: function () {
            document.getElementById("form").style.display = "none";
            //document.getElementById("btn").style.display = "none";
            //document.getElementById("span").style.display = "none";
        },
        removeInnerHTMLForm: function () {
            document.getElementById("form").innerHTML = "";
        },
        _validatePrint: function () {
            this.getView().setBusy(true);
            var data = {
                "Downlaod": "X",
                "Statusid": this._PrintModel.getData().Statusid,
                "Processorder": this._PrintModel.getData().Processorder,
                "Resource": this._PrintModel.getData().ResourceID,
                "ConsumedAt": this._PrintModel.getData().Plant,
                "Cartonid": this._PrintModel.getData().CartonId
            };
            this.getOwnerComponent().getModel().create("/ProcessSet", data, {
                "success": this._SuccessHandlerPrint.bind(this),
                "error": this._ErrorHandler.bind(this)
            })

        },
        _validateRePrint: function () {
            this.getView().setBusy(false);
            var data = {
                "Downlaod": "X",
                "Statusid": this._PrintModel.getData().Statusid,
                "Processorder": this._PrintModel.getData().Processorder,
                "Resource": this._PrintModel.getData().ResourceID,
                "ConsumedAt": this._PrintModel.getData().Plant,
                "Cartonid": this._PrintModel.getData().CartonId
            };
            this.getOwnerComponent().getModel().create("/ProcessSet", data, {
                "success": this._SuccessHandlerRePrint.bind(this),
                "error": this._ErrorHandler.bind(this)
            })

        },
        _SuccessHandlerPrint: function (oData, oResponse) {

            //this.__onFormPrint()
            //this.displayForm();
            if (oData.Statusid === "S") {
                this._printButton.setEnabled(true);
                //this._rePrintButton.setEnabled(false);
            } else if (oData.Statusid === "P") {
                this._printButton.setEnabled(false);
                //this._rePrintButton.setEnabled(true);
            }
            this._printData(oData);
            this.onClear();
            this.getView().setBusy(false);
        },
        _SuccessHandlerRePrint: function (oData, oResponse) {
            if (oData.Statusid === "S") {
                this._printButton.setEnabled(true);
                //this._rePrintButton.setEnabled(false);
            } else if (oData.Statusid === "P") {
                this._printButton.setEnabled(false);
                //this._rePrintButton.setEnabled(true);
            }
            else if (oData.Statusid === "E") {

            }
            this._printData(oData);
            this.getView().setBusy(false);
        },
        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },


        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any main list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("Material", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/ProcessSet".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },
        onResourceVHRequest: function () {
            var aCols = {
                "cols": [{
                    "label": this.getResourceBundle().getText("ResourceTableText"),
                    "template": "Resource Machine"
                }]
            };

            var oColModel = new JSONModel();
            oColModel.setData(aCols);

            Fragment.load({
                id: "searchResourceDialog",
                name: "com.tolaram.app.pp.zppcartoncreat.fragments.SearchResourceDialog",
                controller: this
            }).then(function name(oFragment) {
                this._oResourceVHDialog = oFragment;
                this.getView().addDependent(this._oResourceVHDialog);

                var oFilterBar = this._oResourceVHDialog.getFilterBar();
                oFilterBar.setFilterBarExpanded(true);

                this._oResourceVHDialog.getTableAsync().then(function (oTable) {
                    this._oResourceVHTable = oTable;
                    if (oTable.bindRows) {
                        oTable.addColumn(new UIColumn({
                            label: this.getResourceBundle().getText("Plant"),
                            template: "ConsumedAt"
                        }));
                        oTable.addColumn(new UIColumn({
                            label: this.getResourceBundle().getText("ResourceID"),
                            template: "ResourceID"
                        }));
                        oTable.bindAggregation("rows", {
                            path: "/ZC_ResourceListVH",
                            events: {
                                dataReceived: function (data, error) {
                                    //console.log(data)
                                }
                            }
                        });
                    }
                    if (oTable.bindItems) {
                        oTable.addColumn(new Column({
                            header: new Label({
                                text: this.getResourceBundle().getText("Plant")
                            })
                        }))
                        oTable.addColumn(new Column({
                            header: new Label({
                                text: this.getResourceBundle().getText("ResourceID")
                            })
                        }))
                    }
                    this._oResourceVHDialog.update();
                }.bind(this));
                this._oResourceVHDialog.open();
            }.bind(this));
        },
        onProcessIdVHRequest: function () {
            var aCols = {
                "cols": [{
                    "label": this.getResourceBundle().getText("ResourceTableText"),
                    "template": "Processorder"
                }]
            };

            var oColModel = new JSONModel();
            oColModel.setData(aCols);

            Fragment.load({
                id: "searchProcessIdDialog",
                name: "com.tolaram.app.pp.zppcartoncreat.fragments.SearchProcessOrderDialog",
                controller: this
            }).then(function name(oFragment) {
                this._oProcessVHDialog = oFragment;
                this.getView().addDependent(this._oProcessVHDialog);

                var oFilterBar = this._oProcessVHDialog.getFilterBar();
                oFilterBar.setFilterBarExpanded(true);

                this._oProcessVHDialog.getTableAsync().then(function (oTable) {
                    this._oProcessIdVHTable = oTable;
                    if (oTable.bindRows) {
                        oTable.addColumn(new UIColumn({
                            label: this.getResourceBundle().getText("ManufacturingOrder"),
                            template: "Processorder"
                        }));
                        oTable.addColumn(new UIColumn({
                            label: this.getResourceBundle().getText("PostingDate"),
                            template: "PostingDate"
                        }));
                        oTable.addColumn(new UIColumn({
                            label: this.getResourceBundle().getText("Material"),
                            template: "Material"
                        }));
                        oTable.addColumn(new UIColumn({
                            label: this.getResourceBundle().getText("MaterialName"),
                            template: "MaterialName"
                        }));
                        oTable.bindAggregation("rows", {
                            path: "/ZC_ProductListVH",
                            events: {
                                dataReceived: function (data, error) {
                                    //console.log(data)
                                }
                            }
                        });
                    }
                    if (oTable.bindItems) {
                        oTable.addColumn(new Column({
                            header: new Label({
                                text: this.getResourceBundle().getText("ManufacturingOrder")
                            })
                        }));
                        oTable.addColumn(new Column({
                            header: new Label({
                                text: this.getResourceBundle().getText("PostingDate")
                            })
                        }));
                        oTable.addColumn(new Column({
                            header: new Label({
                                text: this.getResourceBundle().getText("Material")
                            })
                        }));
                        oTable.addColumn(new Column({
                            header: new Label({
                                text: this.getResourceBundle().getText("MaterialName")
                            })
                        }));
                    }
                    this._oProcessVHDialog.update();
                }.bind(this));
                this._oProcessVHDialog.open();
            }.bind(this));
        },
        onResourceSearchOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            this._ApplicationModel.setProperty("/Plant", aTokens[0].getCustomData()[0].getValue().ConsumedAt)
            this._ApplicationModel.setProperty("/ResourceID", aTokens[0].getCustomData()[0].getValue().ResourceID);
            this._oResourceVHDialog.close();
            this._validateResourceId();
        },
        onProcessIdSearchOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            this._ApplicationModel.setProperty("/Processorder", aTokens[0].getCustomData()[0].getValue().Processorder)
            this._ApplicationModel.setProperty("/PostingDate", aTokens[0].getCustomData()[0].getValue().PostingDate);
            this._ApplicationModel.setProperty("/Material", aTokens[0].getCustomData()[0].getValue().Material);
            this._ApplicationModel.setProperty("/MaterialName", aTokens[0].getCustomData()[0].getValue().MaterialName);
            this._oProcessVHDialog.close();
            this._validateProcessId();
        },
        onResourceSearchCancelPress: function () {
            this._oResourceVHDialog.close();
        },
        onProcessIdSearchCancelPress: function () {
            this._oProcessVHDialog.close();
        },
        onResourceSearchAfterClose: function () {
            this._oResourceVHDialog.destroy();
        },
        onProcessIdSearchAfterClose: function () {
            this._oProcessVHDialog.destroy();
        },
        onResourceFilterSearch: function (oEvent) {
            var that = this;
            var aSelectionSet = oEvent.getParameter("selectionSet");
            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                if (oControl.getName() === "ResourceID") {
                    if (oControl.getValue() === "") {
                        oControl.setValueState(sap.ui.core.ValueState.Error);
                        MessageBox.error(that._oI18nModel.getResourceBundle().getText("PleaseEnterResourceIdFirst"), {
                            styleClass: that._bCompact ? "sapUiSizeCompact" : ""
                        });
                        return;
                    }
                }
                return aResult;
            }, []);

            this._filterResourceTable(aFilters);
        },
        onProcessIdFilterSearch: function (oEvent) {
            var that = this;
            var aSelectionSet = oEvent.getParameter("selectionSet");
            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }

                if (oControl.getName() === "Processorder") {
                    if (oControl.getValue() === "") {
                        oControl.setValueState(sap.ui.core.ValueState.Error);
                        MessageBox.error(that._oI18nModel.getResourceBundle().getText("PleaseEnterProcessIdFirst"), {
                            styleClass: that._bCompact ? "sapUiSizeCompact" : ""
                        });
                        return;
                    }
                }
                return aResult;
            }, []);

            this._filterProcessIdTable(aFilters);
        },
        _filterResourceTable: function (oFilter) {
            var oValueHelpDialog = this._oResourceVHDialog;
            var aCols = {
                "cols": [{
                    "label": this.getView().getModel("i18n").getResourceBundle().getText("Plant"),
                    "template": "ConsumedAt"
                }, {
                    "label": this.getView().getModel("i18n").getResourceBundle().getText("ResourceID"),
                    "template": "ResourceID"
                }]
            };

            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    if (oTable.getBinding("rows") === undefined) {
                        oTable.bindAggregation("rows", {
                            path: "/ZC_ResourceListVH",
                            filters: oFilter
                        });
                    } else {
                        oTable.getBinding("rows").filter(oFilter, "Application");
                    }
                }

                if (oTable.bindItems) {
                    if (oTable.getBinding("items") === undefined) {
                        oTable.bindAggregation("items", {
                            path: "/ZC_ResourceListVH",
                            filters: oFilter,
                            template: new ColumnListItem({
                                cells: aCols.cols.map(function (column) {
                                    return new Text({
                                        text: "{" + column.template + "}"
                                    }, {
                                        wrapping: true
                                    });
                                })
                            })
                        });
                    } else {
                        oTable.getBinding("items").filter(oFilter, "Application");
                    }
                }

                oValueHelpDialog.update();
            });
        },
        onMessagePopoverPress: function (oEvent) {
            var oSourceControl = oEvent.getSource();
            this._getMessagePopover().then(function (oMessagePopover) {
                oMessagePopover.openBy(oSourceControl);
            });
        },
        _getMessagePopover: function () {
            var oView = this.getView();

            // create popover lazily (singleton)
            if (!this._pMessagePopover) {
                this._pMessagePopover = Fragment.load({
                    id: oView.getId(),
                    name: "com.tolaram.app.pp.zppcartoncreat.fragments.MessagePopover"
                }).then(function (oMessagePopover) {
                    oView.addDependent(oMessagePopover);
                    return oMessagePopover;
                });
            }
            return this._pMessagePopover;
        },
        _filterProcessIdTable: function (oFilter) {
            var oValueHelpDialog = this._oProcessVHDialog;
            var aCols = {
                "cols": [{
                    "label": this.getView().getModel("i18n").getResourceBundle().getText("ManufacturingOrder"),
                    "template": "Processorder"
                }, {
                    "label": this.getView().getModel("i18n").getResourceBundle().getText("PostingDate"),
                    "template": "PostingDate"
                }, {
                    "label": this.getView().getModel("i18n").getResourceBundle().getText("Material"),
                    "template": "Material"
                }, {
                    "label": this.getView().getModel("i18n").getResourceBundle().getText("MaterialName"),
                    "template": "MaterialName"
                }]
            };

            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    if (oTable.getBinding("rows") === undefined) {
                        oTable.bindAggregation("rows", {
                            path: "/ZC_ProductListVH",
                            filters: oFilter
                        });
                    } else {
                        oTable.getBinding("rows").filter(oFilter, "Application");
                    }
                }

                if (oTable.bindItems) {
                    if (oTable.getBinding("items") === undefined) {
                        oTable.bindAggregation("items", {
                            path: "/ZC_ProductListVH",
                            filters: oFilter,
                            template: new ColumnListItem({
                                cells: aCols.cols.map(function (column) {
                                    return new Text({
                                        text: "{" + column.template + "}"
                                    }, {
                                        wrapping: true
                                    });
                                })
                            })
                        });
                    } else {
                        oTable.getBinding("items").filter(oFilter, "Application");
                    }
                }

                oValueHelpDialog.update();
            });
        },
        getInnerHTML: function () {
            var oPrintData = this.getOwnerComponent().getModel("printModel").getData();
            var sResourceId = oPrintData.ResourceID;
            var sProcessorder = oPrintData.Processorder;
            var sPostingDate = oPrintData.PostingDate;
            var sMaterial = oPrintData.Material;
            var sMaterialName = oPrintData.MaterialName;
            var sTargetQuantity = oPrintData.TargetQuantity;
            var sUnit = oPrintData.Unit;
            var sProcessorder = oPrintData.Processorder;
            var sBatch = oPrintData.Batch
            var sCartonid = oPrintData.CartonId;
            var sNormt = oPrintData.Normt;
            var sLoanz = oPrintData.Loanz;
            var sPrintDate = oPrintData.PrintDate;   
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "dd/MM/YYYY" });   
            var sPrintDateFormatted = dateFormat.format(sPrintDate);
            var detailCode = "Hello Tolaram, QR Code is not generated correctly";
            if (sCartonid !== "") {
                var code = sCartonid;
                detailCode = code.replace(/[/:]/g, "");
            }
            var qrCodeUrl = "https://chart.googleapis.com/chart?cht=qr&chl=" + detailCode + "&chs=160x160&chld=L|0";
            var stringHTML = `<!DOCTYPE html>
            <html lang="en">
               <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <link rel="stylesheet" href="style.css" />
                  <title>Carton print</title>
                  <style>
                     .cntrBox {
                     text-align: center;
                     border: 1px solid black;
                     !margin: 15px;
                     }
                     .textsizeNo {
                     font-size: 11rem;
                     font-weight: bold;
                     padding-top:4rem;
                     }
                     .headertext {
                     font-family: sans-serif;
                     font-size: 20px;
                     font-weight: bold;
                     display: inline-block;
                     }
                     #container {
                     text-align: center;
                     border: 1px solid black;
                     margin: 15px;
                     overflow: hidden;
                     !width: 359px;
                     !height:359px;
                     width: 700px;
                     height:300px;
                     }
                     #inner {
                     overflow: hidden;
                     width: 100%;
                     !margin: 20px;
                     }
                     .childInner{
                     padding-top:50px;
                     }
                     .child {
                     float: left;
                     width: 55%;
                     height: 100%;
                     }
                     .child2 {
                     float: left;
                     width: 45%;
                     height: 100%;
                     }
                  </style>
               </head>                   
               <body>
                  <div id="main">
                     <div id="container">
                        <div id="inner">
                           <div class="child">
                              <div class="childInner">
                                 <div class="headertext">${sMaterialName}</div>
                                 <div class="headertext">P.D:&nbsp;${sPrintDateFormatted}</div><div class="headertext">&nbsp;&nbsp;${sBatch}</div><div class="headertext" >&nbsp;&nbsp;${sLoanz}</div>
                                 <div >
                                    <img id="newQrcode" src='${qrCodeUrl}'/>
                                 </div>
                                 <div class="headertext">${sCartonid}</div>
                              </div>
                           </div>
                           <div class="child2">
                              <div class="textsizeNo">${sNormt}</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </body>
            </html>`;

            return stringHTML;
        },
        __onFormCreate: function (oEvent) {

            var stringHTML = this.getInnerHTML()

            //var pageHeader = document.getElementById("span");
            /*console.log(pageHeader);*/
            //pageHeader.innerText = `Form Print`;
            document.getElementById("form").innerHTML = stringHTML;


        },
        __onFormPrint: function (oEvent) {

            var ctrlString = "width=380px,height=380px";
            var wind = window.open("", "PrintWindow", ctrlString);

            if (wind !== undefined) {
                wind.document.write(document.getElementById("form").innerHTML);
            }
            // Creating a small time delay so that the layout renders
            setTimeout(function () {
                wind.print();
                wind.close();

            }, 2000);

        }
    });
});
