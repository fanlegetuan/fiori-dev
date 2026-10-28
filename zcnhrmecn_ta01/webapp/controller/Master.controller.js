sap.ui.define([
	"zcnhrmecn_ta01/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/UIComponent",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/Device",
	"sap/m/MessageBox"

], function(BaseController, MessageToast, JSONModel, UIComponent, Filter, FilterOperator, Device, MessageBox) {
	"use strict";

	//* Start Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400	
	// var oViewModel,
	// oModel,
	// oResourceBundle;

	var oModel,
		oViewModel,
		oUser,
		msgCode,
		regExp,
		oResourceBundle,
		oDialog,
		oTimer;

	//* End Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400

	return BaseController.extend("zcnhrmecn_ta01.controller.Master", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function() {
			var oList = this.byId("List");
			this._oListSelector = this.getOwnerComponent().oListSelector; // default diaplay the first single value&nbsp;
			this._oList = oList;
			// //Get SplitApp
			// this._oSplitApp = this.getOwnerComponent().oSplitApp;

			//* Start Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400		
			// oModel = this.getOwnerComponent().getModel();
			// oViewModel = new JSONModel({
			// 	busy: false,
			// 	delay: 0
			// });
			oModel = this.getOwnerComponent().getModel();
			this.getView().setModel(oModel);
			// get busy
			oViewModel = new JSONModel({
				delay: 0,
				valueState: "None",
				valueState1: "None",
				labelVisiblevd: false,
				pernr: "",
				validatecode: "",
				buttonenabled: false,
				labelenabled: false

			});
			// Validation Code Img
			var oRootPath = jQuery.sap.getModulePath("zcnhrmecn_ta01"); // your resource root
			var oImageModel = new JSONModel({
				path: oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			oResourceBundle = this.getResourceBundle(); //  get binding i18n&nbsp;
			oUser = (sap.ushell && sap.ushell.Container)
				? sap.ushell.Container.getService("UserInfo").getUser().getId()
				: "LOCAL_PREVIEW"; // standalone preview fallback when FLP Container is missing
			// LOCAL_PREVIEW_DEMO: visible local identity without FLP login
			if (oUser === "LOCAL_PREVIEW" && !this.getOwnerComponent().vPernr) {
				this.getOwnerComponent().vPernr = "LOCAL";
				oViewModel.setProperty("/pernr", "LOCAL");
			}
			//* End Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400

			this.setModel(oViewModel, "masterView");

			// Start Changed By Summer Li Date:2020.01.14 CR: DESK9A01X7  OTRS:9901575
			// Start Changed By Summer Li Date:2019.01.14 CR: DESK9A01X7  OTRS:9901400
			//Bind oListSelector & oList(List)
			//Start changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
			// this.getView().addEventDelegate({
			// 	onBeforeFirstShow: function() {
			// 		this._oListSelector.setBoundMasterList(oList);
			// 	}.bind(this)
			// });
			//Reset Timer Before NavHome
			this._resetTimer();
			//End changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
			//End Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400
			//End Changed By Summer Li Date:2020.01.14 CR: DESK9A01X7 OTRS:9901575

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		//* Start Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400
		//  onInit dialog Login on 	
		//Start changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account
		onAfterRendering: function() {
			//Start changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
			if (oUser === "MECN_EHR") {
				var oView = this.getView();
				oDialog = oView.byId("Msgdialog");
				oViewModel.setProperty("/validatecode", oResourceBundle.getText("GetValidate")); //get validation code
				oViewModel.setProperty("/buttonenabled", true); // set the send code enabled is true

				// create dialog lazily
				if (!oDialog) {
					// create dialog fragment phone message
					oDialog = sap.ui.xmlfragment(oView.getId(), "zcnhrmecn_ta01.view.Login", this);
					// connect dialog to view (dialog)
					oView.addDependent(oDialog);
				}
				oDialog.open();
			} else {
				//manually binding datesets
				this._BindItemsManually();
				//default selected first items
				this._onBeforeFirstShow();
			}
			// 	// Start Changed By Summer Li Date:2020.01.14 CR: DESK9A01X7  OTRS:9901575
			// } else {
			// 	// 	/*
			// 	// 	 * manually bind data when account is not mecn_ehr&nbsp;
			// 	// 	 * @returns
			// 	// 	 */

			// 	// 	// //creat templete for manually bind&nbsp;
			// 	// 	var oList = this.getView().byId("List"),
			// 	// 		that = this,
			// 	// 		objectTemplate = new sap.m.ObjectListItem({
			// 	// 			title: {
			// 	// 				parts: ["Nachn", "Vorna", "Rufnm"],
			// 	// 				formatter: function(sNachn, sVorna, sRufnm) {
			// 	// 					var vLang = sap.ui.getCore().getConfiguration().getLanguage();
			// 	// 					if (vLang === "en" || vLang === "en-US") {
			// 	// 						return sRufnm;
			// 	// 					} else if (vLang === "zh-Hans") {
			// 	// 						return sNachn + " " + sVorna;
			// 	// 					} else {
			// 	// 						return sRufnm;
			// 	// 					}
			// 	// 				}
			// 	// 			},
			// 	// 			number: "{Stdaz}",
			// 	// 			numberUnit: "{i18n>Hours}",
			// 	// 			type: "{= ${device>/system/phone} ? 'Active' : 'Inactive'}",
			// 	// 			press: function(oEvent) {
			// 	// 				var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			// 	// 				that.getRouter().navTo("approval", {
			// 	// 					Reqno: encodeURIComponent(oItem.getBindingContext().getProperty("Reqno"))
			// 	// 				}, false);
			// 	// 			},

			// 	// 			firstStatus: new sap.m.ObjectStatus({
			// 	// 				text: "{StatsDes}",
			// 	// 				state: {
			// 	// 					parts: ["Stats"],
			// 	// 					formatter: function(Stats) {
			// 	// 						if (Stats === "0") {
			// 	// 							return "Error";
			// 	// 						} else if (Stats === "1") {
			// 	// 							return "Warning";
			// 	// 						} else if (Stats === "2") {
			// 	// 							return "Success";
			// 	// 						}
			// 	// 					}
			// 	// 				}
			// 	// 			}),

			// 	// 			attributes: [new sap.m.ObjectAttribute({
			// 	// 					text: "{Zlvde}"
			// 	// 				}),
			// 	// 				new sap.m.ObjectAttribute({
			// 	// 					text: "{path: 'Begda', type: 'sap.ui.model.type.Date', formatOptions: { pattern : 'yyyy.MM.dd' }} - {path: 'Endda', type: 'sap.ui.model.type.Date', formatOptions: { pattern : 'yyyy.MM.dd' }}"
			// 	// 				}),
			// 	// 				new sap.m.ObjectAttribute({
			// 	// 					text: "{path: 'Beguz', type: 'sap.ui.model.odata.type.Time', formatOptions: { pattern : 'HH:mm:ss' }} - {path: 'Enduz', type: 'sap.ui.model.odata.type.Time', formatOptions: { pattern : 'HH:mm:ss' }}"
			// 	// 				})
			// 	// 			]

			// 	// 		});

			// 	// 	// manually Bind DateSet 	
			// 	// 	oList.bindAggregation("items", {
			// 	// 		path: "/leaveRequestSet",
			// 	// 		template: objectTemplate
			// 	// 	});
			// 	// 	//default selected first items
			// 	// 	this._onBeforeFirstShow();

			// 	// }
			// 	//End Changed By Summer Li Date:2020.01.14 CR: DESK9A01X7 OTRS:9901575
		}, //End changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account

		//start changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
		// /*
		//  * Generate Validation Code
		//  * @returns
		//  */
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
					olabelMsg.setText(oResourceBundle.getText("SendMsg")); //send Msg validate to remind&nbsp;&nbsp;
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

		/*&nbsp;
		 * Verify SMS Code
		 * @returns
		 */
		onValidate: function(oEvent) {
			var oInputVid = this.getView().byId("InputVid"),
				vInputVid = oInputVid.getValue(),
				olabelMsg = this.getView().byId("labelMsg");

			olabelMsg.setText(""); // set the labelMsg to null&nbsp;
			oViewModel.setProperty("/valueState1", "None"); //The input box does not change

			if (!this._validatePhone()) //validate phone null or format
			{
				return;
			}

			if (msgCode === vInputVid) {
				this.getView().byId("Msgdialog").close();
				//manually bingding when phone message successfully validate
				var oList = this.getView().byId("List");
				this._oListSelector = this.getOwnerComponent().oListSelector; // default diaplay the first single value&nbsp;
				this.oList = oList;
				//manually binding datesets
				this._BindItemsManually();

				//default selected first items
				this._onBeforeFirstShow();

			} else {
				oViewModel.setProperty("/valueState1", "Error"); //The input box turned red
				olabelMsg.setText(oResourceBundle.getText("ValidateMatch")); //Prompt the validate does noe match
			}

		},
		//End changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
		//End changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account
		//End Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {

			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();

			//Find first item and display, if no item found, display notfound (if not phone mode)
			if (!Device.system.phone) {
				this._findItem();
			}
		},

		/*
		 * search function by the key Pernr,&nbsp;
		 * @param&nbsp;
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var aFilters = [], // instead of array ,one carry out will reset
				sQuery = oEvent.getSource().getValue(),
				oList = this.getView().byId("List"),
				oBinding = oList.getBinding("items"); //get list binding&nbsp;
			//Start changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account
			//if account = mecn_ehr ,first filter field zaper to get approval recored
			// if (oUser === "MECN_EHR") {
			// 	aFilters.push(new Filter("Zaper", FilterOperator.EQ, this.getOwnerComponent().vPernr));
			// }
			//End changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account
			//Start changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
			if (this.getOwnerComponent().vPernr) {
				aFilters.push(new Filter("Zaper", FilterOperator.EQ, this.getOwnerComponent().vPernr));
			}
			//End changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account

			if (sQuery) {
				var filter = new Filter("Pernr", FilterOperator.EQ, sQuery);
				aFilters.push(filter);
			}

			oBinding.filter(aFilters, "Application");

		},

		/**
		 * Event handler for refresh event. Keeps refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list onNavApprove event
		 * @public
		 */
		onNavApprove: function(oEvent) {
			// Show detail under "None"and "SingleSelectMaster"
			if (this._oList.getMode() === "None" || this._oList.getMode() === "SingleSelectMaster") {
				//show approval view
				var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
				this._showApprove(oItem);
			}

		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page
		 * @override
		 * @public
		 */
		onNavHome: function() {
			if (!(sap.ushell && sap.ushell.Container)) { return; }
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			// Navigate back to FLP home
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#Shell-home"
				}
			});
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/*
		 * Format inspection status code.
		 * @function change the stats color&nbsp;
		 * @param&nbsp;&nbsp;
		 * @private
		 */
		_formatText: function(Stats) {
			if (Stats === "0") {
				return "Error";
			} else if (Stats === "1") {
				return "Warning";
			} else if (Stats === "2") {
				return "Success";
			}
		},

		/*
		 * default display the first value view.
		 * @function if not found ,default display notfound view&nbsp;&nbsp;
		 * @param&nbsp;&nbsp;
		 * @private
		 */
		_findItem: function() {
			var sPath = "",
				oItem = this._oListSelector.findFirstItem();

			if (oItem) {
				sPath = oItem.getBindingContext().getPath();
			} else {
				this.getRouter().navTo("notfound", this);
				return;
			}

			this._oListSelector.selectAListItem(sPath);
			this._showApprove(oItem);
		},

		/**
		 * Shows the selected item on the approval page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showApprove: function(oItem) {

			this.getRouter().navTo("approval", {
				Reqno: encodeURIComponent(oItem.getBindingContext().getProperty("Reqno"))
			}, false);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
			oViewModel.setProperty("/title", sTitle);

		},

		/*
		 * Format name
		 */
		_formatName: function(sNachn, sVorna, sRufnm) {
			var vLang = sap.ui.getCore().getConfiguration().getLanguage();
			if (vLang === "en" || vLang === "en-US") {
				return sRufnm;
			} else if (vLang === "zh-Hans") {
				return sNachn + " " + sVorna;
			} else {
				return sRufnm;
			}
		},
		//Start Changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
		// Start Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400
		//Start changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account
		_BindItemsManually: function() {
			var that = this;
			var oList = this.getView().byId("List"),
				objectTemplate = new sap.m.ObjectListItem({
					title: {
						parts: ["Nachn", "Vorna", "Rufnm"],
						formatter: function(sNachn, sVorna, sRufnm) {
							var vLang = sap.ui.getCore().getConfiguration().getLanguage();
							if (vLang === "en" || vLang === "en-US") {
								return sRufnm;
							} else if (vLang === "zh-Hans") {
								return sNachn + " " + sVorna;
							} else {
								return sRufnm;
							}
						}
					},
					number: "{Stdaz}",
					numberUnit: "{i18n>Hours}",
					type: "{= ${device>/system/phone} ? 'Active' : 'Inactive'}",
					press: function(oEvent) {
						var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
						that.getRouter().navTo("approval", {
							Reqno: encodeURIComponent(oItem.getBindingContext().getProperty("Reqno"))
						}, false);
					},

					firstStatus: new sap.m.ObjectStatus({
						text: "{StatsDes}",
						state: {
							parts: ["Stats"],
							formatter: function(Stats) {
								if (Stats === "0") {
									return "Error";
								} else if (Stats === "1") {
									return "Warning";
								} else if (Stats === "2") {
									return "Success";
								}
							}
						}
					}),

					attributes: [new sap.m.ObjectAttribute({
							text: "{Zlvde}"
						}),
						new sap.m.ObjectAttribute({
							text: "{path: 'Begda', type: 'sap.ui.model.type.Date', formatOptions: { pattern : 'yyyy.MM.dd' }} - {path: 'Endda', type: 'sap.ui.model.type.Date', formatOptions: { pattern : 'yyyy.MM.dd' }}"
						}),
						new sap.m.ObjectAttribute({
							text: "{path: 'Beguz', type: 'sap.ui.model.odata.type.Time', formatOptions: { pattern : 'HH:mm:ss' }} - {path: 'Enduz', type: 'sap.ui.model.odata.type.Time', formatOptions: { pattern : 'HH:mm:ss' }}"
						})
					]

				});
			// Bingding DateSet manually 	
			oList.bindAggregation("items", {
				path: "/requestApprovalSet",
				filters: [new Filter("Zaper", FilterOperator.EQ, this.getOwnerComponent().vPernr)],
				template: objectTemplate
			});
		},
		//End changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account
		//End Changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account

		//Display default select first items after bingding items manually
		_onBeforeFirstShow: function() {
			var oList = this.getView().byId("List");
			this._oListSelector.setBoundMasterList(oList);
		},

		//Start Changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account
		//Start changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account 
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
				olabelMsg.setText(); //Prompt the validate code does not match

				return false;
			} else {

				if (!regExp.test(vPhone)) {
					oViewModel.setProperty("/valueState", "Error"); //The input box turned red
					oLabelPhone.setText(oResourceBundle.getText("PhoneFormat")); //Prompt the phone number format is error&nbsp;

					return false;
				} else {
					oViewModel.setProperty("/valueState", "None"); //The input box does not change
					oLabelPhone.setText(""); //Set the label is null

					return true;
				}

			}

		},
		_resetTimer: function() {
				if (oTimer) {
					clearInterval(oTimer);
					oViewModel.setProperty("/buttonenabled", true); // set the send code enabled is true
					oViewModel.setProperty("/validatecode", oResourceBundle.getText("GetValidate")); //get validation code
				}
			}
			//End changed by Summer Li 2021.08.20 DESK9A0HMY Desc Remove the EHR account 
			//* End Changed By Summer Li Date:2019.05.14 CR: DESK996318 OTRS:9901400
			//End Changed by Summer Li 2021.08.30 DESK9A0HRW desc：Add e-HR public account

	});

});