sap.ui.define([
	"zcnhrmecn_ta/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/Device",
	"sap/m/MessageToast",
	// "sap/ui/export/Spreadsheet",
	"zcnhrmecn_ta/model/formatter"

], function(BaseController, JSONModel, Filter, FilterOperator, Device, MessageToast,  formatter) {
	"use strict";
	/**
	 * Definition Area
	 */
	var oModel,
		oTable,
		oViewModel,
		oResourceBundle;

	return BaseController.extend("zcnhrmecn_ta.controller.History", {

		onInit: function() {
			oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});
			this.setModel(oViewModel, "historyView");

			oModel = this.getOwnerComponent().getModel();
			this.getView().setModel(oModel);

			oTable = this.getView().byId("TabelList");
			
			oResourceBundle = this.getResourceBundle(); // get bnding i18n on javascript

			//Filter Histroy List
			this.onFilter();

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler get router to detail view. 
		 * @function 
		 * @public
		 */

		onNavDetail: function(oEvent) {
			var oItem = oEvent.getSource();
			this._showDetail(oItem);

		},

		/**
		 * Event handler On refresh binding table. 
		 * @function 
		 * @public
		 */
		onRefresh: function() {

			oTable.getBinding("items").refresh();
		},

		/**
		 * Event handler Reset Filter Leave Type  or  Date. 
		 * @function 
		 * @public
		 */

		onReset: function() {
			var oFliterlvType = this.getView().byId("CbLeaveType"),
				oFliterlvDate = this.getView().byId("DatePicker");

			oFliterlvType.setValue();
			oFliterlvType.setSelectedKey();
			oFliterlvDate.setDateValue();

		},

		/**
		 * Event handler Filter Leave Type  or  Date. 
		 * @function 
		 * @public
		 */

		onFilter: function(oEvent) {
			var aFilters = [], // instead of array ,one carry out will reset
				// oLeave = this.getView().byId("CbLeaveType"),
				// oKey = oLeave.getSelectedKey(),
				oStas = this.getView().byId("StatusType"),
				oStaKey = oStas.getSelectedKey(),
				oDate = this.getView().byId("DatePicker"),
				vFrom = oDate.getDateValue(),
				vTo = oDate.getSecondDateValue(),
				oBinding = oTable.getBinding("items"); // bingding Table items="/leaveRequestSet"

			/**
			 * Prepare Filters
			 * 01 - Leave Type
			 * 02 - Year/Month
			 * 03 - Employee
			 * 04 - Filter Binding
			 */

			//01 - Leave Type
			// if (oKey) {
			// 	aFilters.push(new Filter("Atype", FilterOperator.EQ, oKey));
			// }
			
			// 03 - Status
			if (oStaKey) {
				aFilters.push(new Filter("Stats", FilterOperator.EQ, oStaKey));
			}

			//02 - Year Month
			if (vFrom && vTo) {
				aFilters.push(new Filter("Aedtm", FilterOperator.BT, vFrom.setMinutes(vFrom.getMinutes() - vFrom.getTimezoneOffset()), vTo.setMinutes(
					vTo.getMinutes() - vTo.getTimezoneOffset())));
			}

			//03 - Leave Type
			if (this.getOwnerComponent().vPernr) {
				aFilters.push(new Filter("Pernr", FilterOperator.EQ, this.getOwnerComponent().vPernr));
			}

			//Filter Binding Items
			oBinding.filter(aFilters);

		},
		// Add cancel function by Joni Feng on April 10, 2023
		onDelete: function(oResult) {

			var oSelectedItems = oTable.getSelectedItems(),
				oLength = oTable.getSelectedItems().length;

			if (oLength === 0) {
				MessageToast.show(oResourceBundle.getText("NoChoose")); 
				return;
			}
			var oSelectedItem = oSelectedItems[0].getBindingContext();
			var stats = oSelectedItem.getProperty("Stats");
			var level = oSelectedItem.getProperty("Zlevel");
			if(stats === "1" && level === "01") {
				// oModal.update
				// oViewModel.setProperty("/busy", true);
				// var sPath = oSelectedItem.sPath;
				// oModel.remove(sPath, {success: function(){
				// 	oViewModel.setProperty("/busy", false);
				// 		oTable.getBinding("items").refresh();
				// 		oTable.removeSelections(true);
				// }});
				var sPath = oSelectedItem.sPath,
				sTitle = oResourceBundle.getText("CancelConfirm");

				var fnAfterConfirm = function() {
					this._callSubmit(sPath);
				}.bind(this);
	
				this._onConfirmDialog({
	
					title: sTitle
	
				}, fnAfterConfirm, oResult);
			}else{
				MessageToast.show(oResourceBundle.getText("NoCancel"));
				return;
			}
		},
		createColumnConfig: function() {
			var aCols = [];

			aCols.push({
				label: oResourceBundle.getText("FullName"),
				property: ["Nachn", "Vorna"],
				type: "string",
				template: "{0} {1}"
			});

			aCols.push({
				label: oResourceBundle.getText("EmployeeNumber"),
				property: "Pernr",
				type: "string"
			});

			aCols.push({
				label: oResourceBundle.getText("Category"),
				property: "Zlvde",
				type: "string"
			});
			
			aCols.push({
				label: oResourceBundle.getText("Corr"),
				property: "Atype",
				type: "string"
			});
			
			aCols.push({
				label: oResourceBundle.getText("CorrDesc"),
				property: "AtypeDes",
				type: "string"
			});

			aCols.push({
				label: oResourceBundle.getText("StartDate"),
				property: "Begda",
				type: "date"
			});

			aCols.push({
				label: oResourceBundle.getText("EndDate"),
				property: "Endda",
				type: "date"
			});

			aCols.push({
				label: oResourceBundle.getText("StartTime"),
				property: "Beguz",
				type: "time"
			});
			aCols.push({
				label: oResourceBundle.getText("EndTime"),
				property: "Enduz",
				type: "time"
			});
			aCols.push({
				label: oResourceBundle.getText("LeaveInterval"),
				property: "Stdaz",
				type: "number"
			});
			aCols.push({
				label: oResourceBundle.getText("Status"),
				property: "StatsDes",
				type: "string"
			});
			return aCols;
		},
		onExport: function() {
			var aCols, oRowBinding, oSettings, oSheet;
			oRowBinding = oTable.getBinding("items");
			var vDateMonth = new Date(),
				eTitle;

			eTitle = "Leave Request Export_" + formatter.dateFormat(vDateMonth);

			aCols = this.createColumnConfig();

			var oRowModel = oRowBinding.getModel();
			// var aKeys = oRowBinding.aKeys;

			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: {
					type: "oData",
					dataUrl: oRowBinding.getDownloadUrl ? oRowBinding.getDownloadUrl() : null,
					serviceUrl: oRowModel.sServiceUrl,
					headers: oRowModel.getHeaders ? oRowModel.getHeaders() : null,
					count: oRowBinding.getLength ? oRowBinding.getLength() : null,
					useBatch: true,
					sizeLimit: oRowModel.iSizeLimit
				},
				fileName: eTitle,
				worker: false 
			};
			// oSheet = new Spreadsheet(oSettings);

			oSheet.build()
				.then(function() {
					//MessageToast.show("Spreadsheet export has finished");
					//Can do something here after export
				})
				.finally(function() {
					oSheet.destroy();
				});
		},
		_onConfirmDialog: function(onConfirmDialog, fnAfterConfirm, oResult) {
			var oSelectedItems = oTable.getSelectedItems(),
			oSelectedItem = oSelectedItems[0].getBindingContext();

				var dialog = new sap.m.Dialog({
					title: onConfirmDialog.title,
					type: "Message",
					styleClass: "sapUiSizeCompact",

					content: [
						new sap.ui.layout.form.SimpleForm({
							layout: "ResponsiveGridLayout",
							columnsXL: 5,
							columnsL: 5,
							columnsM: 5,
							singleContainerFullSize: false,
							content: [
								new sap.m.Text({
									text: oResourceBundle.getText("CancelConfirmText")
								})

							]
						})

					],
					beginButton: new sap.m.Button({
						text: oResourceBundle.getText("Ok"),
						press: function() {
							fnAfterConfirm();
							dialog.close();

						}
					}),
					endButton: new sap.m.Button({
						text: oResourceBundle.getText("Cancel"),
						press: function() {
							dialog.close();
						}
					}),
					afterClose: function() {
						dialog.destroy();
					}
				});

				dialog.open();
		},
		_callSubmit: function(sPath) {

			//  busy  
			oViewModel.setProperty("/busy", true);

			oModel.remove(sPath, {
				success: function(){
				oViewModel.setProperty("/busy", false);

					oTable.getBinding("items").refresh();
					oTable.removeSelections(true);
			}});

		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * get router detail meanwhile delivery get key Reqno. 
		 * @function 
		 * @private
		 */

		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("detail", {
				Reqno: encodeURIComponent(oItem.getBindingContext().getProperty("Reqno"))
			}, false);
		},

		/**
		 * Format inspection status code. 
		 * @function 
		 * @private
		 */

		_formatText: function(Stats) {
			if (Stats === "0") {
				return "None";
			} else if (Stats === "1") {
				return "Warning";
			} else if (Stats === "2") {
				return "Success";
			}else {
				return "Error";
			}
		},

		/**
		 * Format the approval status text. The backend delivers the description
		 * in English only, so fall back to the i18n status text when it is empty.
		 * @function
		 * @private
		 */
		_formatStatusText: function(sStatsDes, sStats) {
			if (sStatsDes) {
				return sStatsDes;
			}
			var oBundle = oResourceBundle || (this && this.getResourceBundle && this.getResourceBundle());
			if (!oBundle) {
				return "";
			}
			var sKey = "status_" + sStats;
			var sText = oBundle.getText(sKey);
			return (sText && sText !== sKey) ? sText : "";
		}

	});
});