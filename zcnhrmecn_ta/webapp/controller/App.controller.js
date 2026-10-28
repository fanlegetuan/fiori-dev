sap.ui.define([
	"zcnhrmecn_ta/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function(BaseController, MessageToast, JSONModel, MessageBox) {
	"use strict";
	var oResourceBundle;

	return BaseController.extend("zcnhrmecn_ta.controller.App", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {

			var that = this;
			oResourceBundle = this.getResourceBundle(); //  get binding  il8n
			// this.getOwnerComponent().oTimerLogout = setInterval(function() {

			// 	// Opens the confirmation dialog
			// 	MessageBox.show(oResourceBundle.getText("AppMsgTitle"), {
			// 		icon: MessageBox.Icon.WARNING,
			// 		title: oResourceBundle.getText("AppConfirm"),
			// 		actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			// 		onClose: function(oAction) {
			// 			if (oAction) {
			// 				if (oAction === MessageBox.Action.OK) {
			// 					clearInterval(that.getOwnerComponent().oTimerCountDown);
			// 				} else {
			// 					clearInterval(that.getOwnerComponent().oTimerLogout);
			// 					clearInterval(that.getOwnerComponent().oTimerCountDown);
			// 					that.onNavHome();

			// 				}
			// 			}

			// 		}
			// 	});
			// 	that.getOwnerComponent().oTimerCountDown = setInterval(function() {
			// 		clearInterval(that.getOwnerComponent().oTimerLogout);
			// 		clearInterval(that.getOwnerComponent().oTimerCountDown);
			// 		that.onNavHome();

			// 	}, 10000);

			// }, 300000);

		}

	});
});