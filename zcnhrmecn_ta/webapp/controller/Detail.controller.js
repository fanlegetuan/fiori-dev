sap.ui.define([
	"zcnhrmecn_ta/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/core/UIComponent",
	"sap/suite/ui/commons/TimelineItem",
	"sap/suite/ui/commons/Timeline",
	"sap/m/MessageBox"
], function(BaseController, MessageToast, JSONModel, Filter, UIComponent, TimelineItem, Timeline, MessageBox) {
	"use strict";
	var oViewModel,
		oModel,
		oResourceBundle,
		oObject,
		oSave;
	return BaseController.extend("zcnhrmecn_ta.controller.Detail", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// create model(bing date source)
			oModel = this.getOwnerComponent().getModel();
			oResourceBundle = this.getResourceBundle();
			this.getView().setModel(oModel);
			// get busy
			oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				Ename: "",
				linkName: "",
				attachCount: ""
			});
			this.setModel(oViewModel, "detailView");
			this.getRouter().getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
			

		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Update Leave Request Attachment Count
		 */
		onUpdateFinished: function(oEvent) {
			var countAll = oEvent.getParameter("total");
			oViewModel.setProperty("/attachCount", countAll);
		},

		/**
		 * Event handler Refresh the list when click fresh button
		 * @public
		 */
		onRefresh: function() {
			this.getView().byId("LeaverequestList").getBinding("items").refresh();
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'detail'
		 * @private
		 */

		_onDetailMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			var oReqno = oArgs.Reqno;

			//Load metadata before generate path(key)
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("attCorrHeaderSet", {
					Reqno: oReqno
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			// Bind object
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function(Args) {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function(Args) {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		/**
		 * Event handler for binding change event
		 * @function
		 * @private
		 */
		_onBindingChange: function() {
			var oView = this.getView(),
				oObjectStatus = this.getView().byId("objectStatus"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().navTo("notfound", false);
				return;
			}

			//Get current path
			var sPath = oElementBinding.getBoundContext().getPath();

			//Get object by current path
			oObject = oView.getModel().getObject(sPath);

			//Update status color
			if (oObject.Stats === "1") {
				oObjectStatus.setState("Warning");
			} else if (oObject.Stats === "2") {
				oObjectStatus.setState("Success");
			} else {
				oObjectStatus.setState("None");
			}
			oViewModel.setProperty("/sObjectPath", sPath);
		},

		/*
		 * Format name(employee)
		 */
		_formatName: function(sNachn, sVorna, sRufnm) {
			var vLang = sap.ui.getCore().getConfiguration().getLanguage();
			if (vLang === "en" || vLang === "en-US") {
				return sRufnm;
			} else if (vLang === "zh-Hans" || vLang === "zh-CN") {
				return sNachn + " " + sVorna;
			} else {
				return sRufnm;
			}
		},
		/*
		 * Format attachment icon
		 */
		_formatType: function(sFiletype) {
			if (sFiletype === "jpg" || sFiletype === "jpeg" || sFiletype === "png") {
				return "sap-icon://background";
			} else if (sFiletype === "pdf") {
				return "sap-icon://pdf-attachment";
			} else {
				return "sap-icon://attachment-text-file";
			}
		},
		/*
		 * Format the approval status text. The backend delivers the description
		 * in English only, so fall back to the i18n status text when it is empty.
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
		},
		downloadFile: function(oEvent) {
			var sSrc = oEvent.getSource().getTarget();
			$.ajax({
				type: "GET",
				url: sSrc,
				success: function(res) {
					// download;
					window.open(res,"_self");

				},
				error: function(err) {
					// error
					MessageToast.show(oResourceBundle.getText("DownloadFail"));
				}
			});
			
		}

	});

});