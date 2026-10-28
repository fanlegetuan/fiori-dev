sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"zcnhrmecn_ta01/model/models",
	"zcnhrmecn_ta01/model/ListSelector",
	"sap/ui/core/routing/HashChanger"
], function(UIComponent, Device, models, ListSelector, HashChanger) {
	"use strict";

	return UIComponent.extend("zcnhrmecn_ta01.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * Always return an object so local preview / missing FLP startup params do not crash.
		 * @override
		 * @returns {object}
		 */
		getComponentData: function() {
			var oData = UIComponent.prototype.getComponentData.apply(this, arguments);
			if (!oData) {
				return {
					startupParameters: {}
				};
			}
			if (!oData.startupParameters) {
				oData.startupParameters = {};
			}
			return oData;
		},


		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {

			//Define Employee Number
			this.vPernr = "";
			// reset the routing hash
			HashChanger.getInstance().replaceHash("");

			this.oListSelector = new ListSelector();
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// getrouter
			this.getRouter().initialize();
		},
		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			this.oListSelector.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
			
			
		}
	});
});