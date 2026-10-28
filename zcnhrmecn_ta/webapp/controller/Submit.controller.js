sap.ui.define([
	"zcnhrmecn_ta/controller/BaseController",
	"sap/ui/unified/DateRange",
	"zcnhrmecn_ta/model/formatter",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/UploadCollectionParameter"
	// "jquery.sap.global"

], function(BaseController, DateRange, formatter, UIComponent, JSONModel, MessageToast, MessageBox, UploadCollectionParameter) {
	"use strict";
	/**
	 * Definition Area
	 */
	var oModel,
		oViewModel,
		oResourceBundle,
		oChangeFiles;

	return BaseController.extend("zcnhrmecn_ta.controller.Submit", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {

			// create model(default binding date source)
			oModel = this.getOwnerComponent().getModel();
			oResourceBundle = this.getResourceBundle(); // get bnding i18n on javascript

			this.getView().setModel(oModel);

			//oViewModel   set view busy  /  enabled  function
			oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				enabled: false,
				intervalBusy: false,
				buttonEnabled: false,
				visible: false,
				newAttendCorrection: []
			});
			this.setModel(oViewModel, "submitView");
			// this._oAppModel = this.getView().getModel("appModel");
			oChangeFiles = [];

		},
		_openAddNewRecord: function() {
			// _ValidateGauge

			// var sVal = oViewModel.getData().NewAttendCorrection.length;
			// var sVal = oViewModel.setProperty("/NewAttendCorrection");
			// var errMsg = oResourceBundle.getText('MsgRecordCount');
			// if (sVal <= 0 ) {
			// 	MessageBox.error(errMsg, {
			// 		title: "",
			// 		styleClass: 'clsMsgError'
			// 	});
			// 	return;
			// } else {
			oViewModel.getData().newAttendCorrection.push(this._createNewCorrectionRow());
			oViewModel.refresh();
			oViewModel.setProperty("/buttonEnabled", true);
			// }

		},
		onDelTblRow: function(oEvent) {
			var oSrc = oEvent.getSource();
			// var sSource = oEvent.getSource().getId().split("--").pop().split("-").shift();
			var sIdx = oSrc.getBindingContext("submitView").getPath().split("/").pop();
			oSrc.getModel("submitView").getProperty("/newAttendCorrection").splice(sIdx, 1);
			oSrc.getModel("submitView").refresh(true);
			var sVal = oSrc.getModel("submitView").getProperty("/newAttendCorrection").length;
			if (sVal <= 0) {
				oViewModel.setProperty("/buttonEnabled", false);
			}

		},
		_openShiftHelp: function(oEvent) {

		},
		/**
		 * Event handler (submit) for the view submit button. submit the selected item. 
		 * @function 
		 * @public
		 */

		onSubmit: function(oResult) {
			oViewModel.setProperty("/buttonEnabled", true);

			var oNewAppointment = [],
				oTable = this.getView().byId("idNewAttendTab"),
				oClockInTime = "",
				oClockOutTime = "";

			// Validate
			var oList = oViewModel.getData().newAttendCorrection;
			for (var i = 0; i < oList.length; i++) {
				if (!oList[i].corrDesc) {
					MessageToast.show(oResourceBundle.getText("MsgCorrDesc"));
					return;
				}
				if (!oList[i].corrDate) {
					MessageToast.show(oResourceBundle.getText("MsgCorrDate"));
					return;
				} else {
					var oSelectedDate = new Date(oList[i].corrDate);
					var oToday = new Date();
					oSelectedDate.setHours(0, 0, 0, 0);
					oToday.setHours(0, 0, 0, 0);
					if (oSelectedDate > oToday) {
						MessageToast.show(oResourceBundle.getText("MsgMaxDate"));
						return;
					}
				}
				if (!oList[i].corrShift) {
					MessageToast.show(oResourceBundle.getText("MsgCorrShift"));
					return;
				}
				if (oList[i].corrDesc === "0" && (!oList[i].clockInTime || !oList[i].clockOutTime)) {
					MessageToast.show(oResourceBundle.getText("MsgCorrTime"));
					return;
				} else {

				}

				if (oList[i].corrDesc === "1" && !oList[i].clockInTime) {
					MessageToast.show(oResourceBundle.getText("MsgCorrTime"));
					return;
				}
				if (oList[i].corrDesc === "2" && !oList[i].clockOutTime) {
					MessageToast.show(oResourceBundle.getText("MsgCorrTime"));
					return;
				}

				// Harden / validate 日分配 (P2011-DALLF) — local until Gateway exposes Dallf
				this._applyDayAssignRules(oList[i]);
				if (!oList[i].dayAssign || (oList[i].dayAssign !== "+" && oList[i].dayAssign !== "-")) {
					MessageToast.show(oResourceBundle.getText("MsgDayAssign"));
					return;
				}
				if (oList[i].dayAssign === "-" && !oList[i].dayAssignAllowMinus) {
					MessageBox.error(oResourceBundle.getText("MsgDayAssignInvalid"));
					return;
				}

				oNewAppointment.push(this._buildItemPayload(oList[i]));

			}

			// 检测重复申请补卡的日期 
			var aBegda = [];
			var bRepeat = false;
			var sRepeatValue = "";

			// 循环数组，检查重复
			for (var i = 0; i < oNewAppointment.length; i++) {
				var sBegda = oNewAppointment[i].Begda;

				if (aBegda.indexOf(sBegda) > -1) {
					// 找到重复
					bRepeat = true;
					sRepeatValue = sBegda;
					break;
				}
				aBegda.push(sBegda);
			}

			// 提示
			if (bRepeat) {
				var dateInfo = sRepeatValue.slice(0, 10);
				MessageToast.show(oResourceBundle.getText("MsgDuplDate", [dateInfo]));
				return;
			}

			var oDeep = {
				Pernr: this.getOwnerComponent().vPernr,
				headerToItem: oNewAppointment
					// HeaderToItem: []
			};
			// var sPath = "/attendCorrectSet";
			// this._callSubmit(sPath, ODeep);
			oViewModel.setProperty("/busy", true);
			oModel.create("/attCorrHeaderSet", oDeep, {
				success: function(oResult) {
					oNewAppointment = [];
					oViewModel.setProperty("/busy", false);
					//refresh model after create successlly
					MessageBox.success(oResourceBundle.getText("SuccessToast"));
					// oTable.getBinding("items").refresh();
					// that.rebindTable(that.oReadOnlyTemplate, "Navigation");
				},
				error: function(oError) {
					oNewAppointment = [];
					//Release View
					oViewModel.setProperty("/busy", false);
					var responseText = JSON.parse(oError.responseText);
					MessageBox.error(responseText.error.message.value);

				}
			});
		},

		/**
		 * Event handler (Reset) for the view Reset button. Reset the selected item. 
		 * @function
		 * @public
		 */
		onReset: function() {
			this._resetValue();
		},

		/**
		 * call reset function return null diaplay preview when click reset button.
		 * @function
		 * @param
		 * @private
		 */

		_resetValue: function() {

			oViewModel.setProperty("/newAttendCorrection", []);

			//invisible the MessageStrip 
			oViewModel.setProperty("/visible", false);

			oViewModel.setProperty("/buttonEnabled", false); // get interval value before disenabled submit button

		},
		
		/**
		 * Create a new attendance-correction row with day-assignment defaults.
		 * UI field 日分配 maps to ABAP P2011-DALLF (data element DALLF), but Gateway
		 * service ZCNHRMECN_ADC_SRV entity attCorrItem does NOT expose property Dallf/DALLF yet.
		 * Value lives in submitView>dayAssign; OData send is gated by manifest sap.ui5/config/sendDallf (default false).
		 * @private
		 * @returns {object}
		 */
		/**
		 * Build one attCorrItem deep-create object.
		 * Includes Dallf only when Component.isSendDallfEnabled() (manifest sap.ui5/config/sendDallf).
		 * @private
		 * @param {object} oRow submitView row
		 * @returns {object}
		 */
		_buildItemPayload: function(oRow) {
			var oItem = {
				Pernr: this.getOwnerComponent().vPernr,
				Atype: oRow.corrDesc,
				Begda: formatter.dateFormatEdm(oRow.corrDate),
				Tprog: oRow.corrShift,
				Znote: oRow.corrRemarks
			};
			if (oItem.Atype === "1") {
				oItem.Beguz = formatter.timeFormat(oRow.clockInTime);
			} else if (oItem.Atype === "2") {
				oItem.Enduz = formatter.timeFormat(oRow.clockOutTime);
			} else {
				oItem.Beguz = formatter.timeFormat(oRow.clockInTime);
				oItem.Enduz = formatter.timeFormat(oRow.clockOutTime);
			}
			// Map UI dayAssign → OData Dallf (P2011-DALLF) only when feature flag is on
			if (this.getOwnerComponent().isSendDallfEnabled && this.getOwnerComponent().isSendDallfEnabled()) {
				oItem.Dallf = oRow.dayAssign || "+";
			}
			return oItem;
		},
		_createNewCorrectionRow: function() {
			return this._applyDayAssignRules({
				corrDesc: "",
				corrDate: null,
				corrShift: "",
				clockInTime: "",
				clockOutTime: "",
				corrRemarks: "",
				dayAssign: "+"
			});
		},

		/**
		 * Rules (mapped to ComboBox corrDesc keys):
		 *  "0" 更正上下班时间 / clock-in&out → only +, default +
		 *  "1" 更正上班时间 / clock-in      → only +, default +
		 *  "2" 更正下班时间 / clock-out     → + or - (单个下班卡), default +
		 *  empty / unknown                  → only +, default +
		 * @private
		 * @param {object} oRow
		 * @returns {object}
		 */
		_applyDayAssignRules: function(oRow) {
			var sType = oRow && oRow.corrDesc != null ? String(oRow.corrDesc) : "";
			var bAllowMinus = (sType === "2");
			oRow.dayAssignAllowMinus = bAllowMinus;
			oRow.dayAssignItems = bAllowMinus
				? [{ key: "+", text: "+" }, { key: "-", text: "-" }]
				: [{ key: "+", text: "+" }];
			if (!oRow.dayAssign || (!bAllowMinus && oRow.dayAssign === "-")) {
				oRow.dayAssign = "+";
			}
			return oRow;
		},

		/**
		 * When 更正内容描述 changes, refresh allowed 日分配 values and default.
		 * @public
		 */
		onCorrDescChange: function(oEvent) {
			var oSrc = oEvent.getSource();
			var oCtx = oSrc.getBindingContext("submitView");
			if (!oCtx) {
				return;
			}
			var sPath = oCtx.getPath();
			var oRow = oViewModel.getProperty(sPath) || {};
			oRow.corrDesc = oSrc.getSelectedKey();
			this._applyDayAssignRules(oRow);
			oViewModel.setProperty(sPath, oRow);
			this._syncDayAssignSelectEnabled(oSrc, oRow);
		},

		/**
		 * Enable/disable "-" option on the row's 日分配 Select based on correction type.
		 * @private
		 */
		_syncDayAssignSelectEnabled: function(oCorrCombo, oRow) {
			var oItem = oCorrCombo.getParent && oCorrCombo.getParent(); // ColumnListItem
			if (!oItem || !oItem.getCells) {
				return;
			}
			var aCells = oItem.getCells();
			var oSelect = null;
			for (var i = 0; i < aCells.length; i++) {
				if (aCells[i].isA && aCells[i].isA("sap.m.Select")) {
					oSelect = aCells[i];
					break;
				}
			}
			if (!oSelect) {
				return;
			}
			var oMinus = oSelect.getItemByKey("-");
			if (oMinus && oMinus.setEnabled) {
				oMinus.setEnabled(!!oRow.dayAssignAllowMinus);
			}
			oSelect.setSelectedKey(oRow.dayAssign || "+");
		},

		/**
		 * Guard: if type disallows "-", force back to "+".
		 * @public
		 */
		onDayAssignChange: function(oEvent) {
			var oSrc = oEvent.getSource();
			var oCtx = oSrc.getBindingContext("submitView");
			if (!oCtx) {
				return;
			}
			var sPath = oCtx.getPath();
			var oRow = oViewModel.getProperty(sPath) || {};
			var sKey = oSrc.getSelectedKey();
			if (sKey === "-" && !oRow.dayAssignAllowMinus) {
				oRow.dayAssign = "+";
				oViewModel.setProperty(sPath + "/dayAssign", "+");
				oSrc.setSelectedKey("+");
			} else {
				oRow.dayAssign = sKey || "+";
				oViewModel.setProperty(sPath + "/dayAssign", oRow.dayAssign);
			}
		},

		handleDateChangeEvent: function(oEvent) {
			var oSrc = oEvent.getSource(),
				sValue = oSrc.getDateValue();
			var sIdx = oSrc.getBindingContext("submitView").getPath().split("/").pop();
			oViewModel.getData().newAttendCorrection[sIdx].corrDate = sValue;
		}

	});
});