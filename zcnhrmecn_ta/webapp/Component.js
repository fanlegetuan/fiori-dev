sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"zcnhrmecn_ta/model/models"
], function(UIComponent, Device, models) {
	"use strict";
	var oTimerLogout,
		oTimerCountDown;

	return UIComponent.extend("zcnhrmecn_ta.Component", {

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

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// set the FLP model
			//this.setModel(models.createFLPModel(), "FLP");
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// Feature flag: send 日分配 as OData Dallf (P2011-DALLF). Default false until Gateway exposes property.
			var oUi5Config = this.getManifestEntry("/sap.ui5/config") || {};
			this._bSendDallf = oUi5Config.sendDallf === true;
			// getrouter
			this.getRouter().initialize();
		},
		//  get router press
				/**
		 * @public
		 * @returns {boolean} true only when manifest sap.ui5/config/sendDallf is true
		 */
		isSendDallfEnabled: function() {
			return !!this._bSendDallf;
		},

		destroy: function() {
			// 5 miniutes to remind log out
			if (this.oTimerLogout) {
				clearInterval(this.oTimerLogout);
			}
			// 10 seconds log out
			if (this.oTimerCountDown) {
				clearInterval(this.oTimerCountDown);
			}

			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);

		}
	});
});