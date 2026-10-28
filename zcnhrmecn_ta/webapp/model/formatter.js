sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat"
], function(DateFormat, NumberFormat) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		//Date conversion
		dateFormat: function(sValue) {
			if (!sValue) {
				return "";
			}

			var dateFormat = DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});

			return dateFormat.format(sValue);
		},
		
		//EdmDateTime conversion
		dateFormatEdm: function(sValue) {
			if (!sValue) {
				return "";
			}

			var dateFormat = DateFormat.getDateInstance({
				pattern: "yyyy-MM-ddThh:mm:ss"
			});

			return dateFormat.format(sValue);
		},
		
		//Time conversion
		timeFormat: function(sValue) {
			if (!sValue) {
				return "";
			}

			// var timeFormat = DateFormat.getDateInstance({
			// 	pattern : "PTHH'H'mm'M'ss'S'"
			// });
			var aTime = sValue.split(":");
			var sHours = aTime[0].padStart(2, "0");
			var sMinutes = (aTime[1] || "00").padStart(2, "0");
			var sStr = "PT" + sHours + "H" + sMinutes + "M" + "00S";
			return sStr;
		},
		
		// Time disploy
				//Time conversion
		timeFormat1: function(sValue) {
			if (!sValue) {
				return "";
			}

			var timeFormat1 = DateFormat.getDateInstance({
				pattern : "HH:mm"
			});

			return timeFormat1.format(sValue);
		},
        
        //Int conversion
				/**
		 * Display 日分配 / DALLF: show +/-, else em dash when backend has no value yet.
		 * @public
		 */
		formatDayAssign: function(sValue) {
			if (sValue === "+" || sValue === "-") {
				return sValue;
			}
			return "—";
		},

		intFormat: function(sValue) {
			if (!sValue) {
				return "";
			}

			var oNumberFormat = NumberFormat.getInstance();

			return oNumberFormat.format(sValue);
		}
	};

});