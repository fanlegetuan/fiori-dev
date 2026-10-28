sap.ui.define([
	"zcnhrmecn_ta/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox"

], function(BaseController, MessageToast, JSONModel, UIComponent, MessageBox) {
	"use strict";
	var oModel,
		oViewModel,
		oUser,
		msgCode,
		regExp,
		oResourceBundle,
		oTimer;

	return BaseController.extend("zcnhrmecn_ta.controller.Master", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			oModel = this.getOwnerComponent().getModel();
			this.getView().setModel(oModel);
			// get busy
			oViewModel = new JSONModel({
				delay: 0,
				valueState: "None",
				valueState1: "None",
				labelVisiblevd: false,
				pernr: "",
				showPernr: false,
				validatecode: "",
				buttonenabled: false,
				labelenabled: false
			});

			var oRootPath = jQuery.sap.getModulePath("zcnhrmecn_ta"); // your resource root
			var oImageModel = new JSONModel({
				path: oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			this.setModel(oViewModel, "masterView");
			oResourceBundle = this.getResourceBundle(); // get bnding i18n on javascript
			oUser = (sap.ushell && sap.ushell.Container)
				? sap.ushell.Container.getService("UserInfo").getUser().getId()
				: "LOCAL_PREVIEW"; // standalone preview fallback when FLP Container is missing
			// LOCAL_PREVIEW_DEMO: make Master list visibly populated without FLP startup params / login
			if (oUser === "LOCAL_PREVIEW" && !this.getOwnerComponent().vPernr) {
				this.getOwnerComponent().vPernr = "LOCAL";
				oViewModel.setProperty("/pernr", "LOCAL");
				oViewModel.setProperty("/showPernr", true);
			}
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			//Reset Timer Before NavHome
			this._resetTimer();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		//  onInit dialog Login on 	
		onAfterRendering: function() {

			if (this.getOwnerComponent().vPernr === "" && oUser === "MECN_EHR") {
				var oView = this.getView();
				var oDialog = oView.byId("Msgdialog");
				oViewModel.setProperty("/validatecode", oResourceBundle.getText("GetValidate")); //get validation code
				oViewModel.setProperty("/buttonenabled", true); // set the send code enabled is true

				// create dialog lazily
				if (!oDialog) {
					// create dialog fragment phone message
					oDialog = sap.ui.xmlfragment(oView.getId(), "zcnhrmecn_ta.view.Login", this);
					// connect dialog to view (dialog)
					oView.addDependent(oDialog);
				}
				oDialog.open();
			}
		},

		/*
		 * Generate Validation Code
		 * @returns
		 */
		onCreateCode: function() {

			var oInputPhone = this.getView().byId("InputPhone"),
				vPhone = oInputPhone.getValue(),
				olabelMsg = this.getView().byId("labelMsg"),
				that = this,
				time = 60;

			if (!this._validatePhone()) //validate phone null or format
			{
				return;
			}

			msgCode = "";
			for (var i = 0; i < 4; i++) {
				msgCode += Math.floor(Math.random() * 10);

			}

			var oNewEntry = {
				Pernr: "",
				Phone: null, //Selected Leave Type text
				Code: null //Selected start Calendar FromDate
			};

			oNewEntry.Phone = vPhone; // get phone number
			oNewEntry.Code = msgCode; // get phone number
			var sPath = "/validationCodeSet";

			oViewModel.setProperty("/busyCode", true); //set validation code is busy
			oViewModel.setProperty("/buttonenabled", false); // set the send code enabled is false
			// Commit submit operation
			oModel.create(sPath, oNewEntry, {
				success: function(oResult) {

					oViewModel.setProperty("/pernr", oResult.Pernr);
					that.getOwnerComponent().vPernr = oResult.Pernr;
					oViewModel.setProperty("/busyCode", false); //set validation code is not busy
					olabelMsg.setText(oResourceBundle.getText("SendMsg")); //send Msg validate to remind  
					oViewModel.setProperty("/labelenabled", true); // set the enter button enabled is true

					//set timer for countdown 60s
					oTimer = setInterval(function() {

						oViewModel.setProperty("/validatecode", time + oResourceBundle.getText("resend")); //get validation code
						time--;

						if (time === 0) {
							that._resetTimer();
						}

					}, 1000);

				},
				error: function(oError) {
					var responseText = JSON.parse(oError.responseText);
					MessageBox.error(responseText.error.message.value);
					olabelMsg.setText(); // set successly send code  is null
					oViewModel.setProperty("/valueState1", "None"); //The input box does not change
					oViewModel.setProperty("/busyCode", false); //set validation code is not busy
					oViewModel.setProperty("/buttonenabled", true); // set the send code enabled is false
				}
			});

		},

		/* 
		 * Verify SMS Code
		 * @returns
		 */
		onValidate: function() {
			var oInputVid = this.getView().byId("InputVid"),
				vInputVid = oInputVid.getValue(),
				olabelMsg = this.getView().byId("labelMsg");

			olabelMsg.setText(""); // set the labelMsg to null 
			oViewModel.setProperty("/valueState1", "None"); //The input box does not change

			if (!this._validatePhone()) //validate phone null or format
			{
				return;
			}

			if (msgCode === vInputVid) {
				this.getView().byId("Msgdialog").close();
				oViewModel.setProperty("/showPernr", true); // set emlpoyee id is visible
			} else {
				oViewModel.setProperty("/valueState1", "Error"); //The input box turned red
				olabelMsg.setText(oResourceBundle.getText("ValidateMatch")); //Prompt the validate does noe match
			}

		},

		/***
		 * CrossApplication Navigation
		 * Navigate to My People Profile 
		 */
		onNavMyProfile: function() {
			if (!(sap.ushell && sap.ushell.Container)) { return; }
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: "EmployeeInfo",
					action: "display"
				},
				params: {
					"pernr": this.getOwnerComponent().vPernr
				}
			})) || "";

			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});
		},

		/*
		 * Event handler get router to submit view. 
		 * @function 
		 * @public
		 */
		onSubmit: function(oEvent) {
			this.getRouter().navTo("submit");
		},

		/*
		 * Event handler get router to history view. 
		 * @function 
		 * @public
		 */
		onHistory: function(oEvent) {
			this.getRouter().navTo("history");
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		// validate the mobile phone numbeir is null or format error
		_validatePhone: function() {
			var oInputPhone = this.getView().byId("InputPhone"),
				vPhone = oInputPhone.getValue(),
				olabelMsg = this.getView().byId("labelMsg"),
				oLabelPhone = this.getView().byId("labelPhone");

			regExp = /^1\d{10}$/;
			if (vPhone === "") {
				oViewModel.setProperty("/valueState", "Error"); //The input box turned red
				oLabelPhone.setText(oResourceBundle.getText("Phone")); //Prompt the phone number cannot be empty
				olabelMsg.setText(); //Prompt the validate does noe match

				return false;
			} else {

				if (!regExp.test(vPhone)) {
					oViewModel.setProperty("/valueState", "Error"); //The input box turned red
					oLabelPhone.setText(oResourceBundle.getText("PhoneFormat")); //Prompt the phone number format is error 

					return false;
				} else {
					oViewModel.setProperty("/valueState", "None"); //The input box does not change
					oLabelPhone.setText(""); //Set the label is null

					return true;
				}

			}

		},

				_onMasterMatched: function(oEvent) {
			// get Startup params from Owner Component (safe for standalone / local FLP sandbox)
			var oComponentData = (this.getOwnerComponent().getComponentData && this.getOwnerComponent().getComponentData()) || {};
			var startupParameters = oComponentData.startupParameters || {};
			if (startupParameters.pernr && startupParameters.pernr[0]) {
				this.getOwnerComponent().vPernr = startupParameters.pernr[0];

				//Set Employee Number
				oViewModel.setProperty("/pernr", this.getOwnerComponent().vPernr);
				oViewModel.setProperty("/showPernr", true);
			}

		},


		_resetTimer: function() {
			if (oTimer) {
				clearInterval(oTimer);
				oViewModel.setProperty("/buttonenabled", true); // set the send code enabled is true
				oViewModel.setProperty("/validatecode", oResourceBundle.getText("GetValidate")); //get validation code
			}
		}

	});

});