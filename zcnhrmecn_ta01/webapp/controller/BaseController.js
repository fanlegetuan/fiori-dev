/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function(Controller, History) {
	"use strict";

	return Controller.extend("zcnhrmecn_ta01.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */

		//  get Router 
		getRouter: function() {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */

		// get Model odata 
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */

		//return the last view 
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("master", {}, bReplace);
			}
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page
		 * @override
		 * @public
		 */
		
		/**
		 * Safe access to intent startup parameters (empty object when missing).
		 * @public
		 * @returns {object}
		 */
		getStartupParameters: function() {
			var oComponent = this.getOwnerComponent();
			var oData = oComponent && oComponent.getComponentData && oComponent.getComponentData();
			return (oData && oData.startupParameters) || {};
		},
		onNavHome: function() {
			if (!(sap.ushell && sap.ushell.Container)) { window.history.go(-1); return; }
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			// Navigate back to FLP home
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#Shell-home"
				}
			});

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

	});

});