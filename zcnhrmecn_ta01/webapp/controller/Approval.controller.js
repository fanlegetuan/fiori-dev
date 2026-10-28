sap.ui.define([
	"zcnhrmecn_ta01/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
	"sap/ui/Device"
], function(BaseController, MessageToast, JSONModel, Filter, UIComponent, MessageBox, Device) {
	"use strict";

	/**
	 * Definition Area
	 */
	var oViewModel,
		oModel,
		oObject,
		oResourceBundle;

	return BaseController.extend("zcnhrmecn_ta01.controller.Approval", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-way initialization.
		 * @memberOf zcnhrmecn_ta01.view
		 */
		onInit: function() {
			oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				attachCount: ""
			});
			this.setModel(oViewModel, "approvalView");
			oModel = this.getOwnerComponent().getModel();
			this.getRouter().getRoute("approval").attachPatternMatched(this._onApproveMatched, this);
			oResourceBundle = this.getResourceBundle(); //  get binding  il8n
			
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		
		/**
		 * Event handler Action Approve Request when click the approve button
		 * @public
		 */
		onApprove: function() {
			var sPath = oViewModel.getProperty("/sApprovePath"),
				sQuestion = oResourceBundle.getText("Aprdialogtitle"),
				oIcon = MessageBox.Icon.INFORMATION,
				sCancel = oResourceBundle.getText("submitcancel"),
				sTitle = oResourceBundle.getText("RequestConfirmation");

			var fnApprove = function() {
				this._callApprove(sPath);
			}.bind(this);

			this._confirmByUser({
				question: sQuestion,
				icon: oIcon,
				title: sTitle,
				cancel: sCancel
			}, fnApprove);

		},

		/**
		 * Event handler Action reject Request when click the reject button
		 * @public
		 */

		onReject: function(sApprovePath) {
			var sPath = oViewModel.getProperty("/sApprovePath"),
				sTitle = oResourceBundle.getText("Rejdialogtitle");

			var fnAfterConfirm = function() {
				this._callReject(sPath);
			}.bind(this);

			this._onConfirmDialog({
				title: sTitle
			}, fnAfterConfirm);
		},

		/**
		 * Event handler get router master
		 * @public
		 */
		onNavMaster: function() {
			this.getRouter().navTo("master");
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the Approve path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'approve'
		 * @private
		 */
		_onApproveMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			var oReqno = oArgs.Reqno;
			//Load metadata before generate path(key)
			this.getModel().metadataLoaded().then(function() {
				var sApprovePath = this.getModel().createKey("requestApprovalSet", {
					Reqno: oReqno
				});
				this._bindView("/" + sApprovePath);
			}.bind(this));

			this._updateListItemCount(oReqno);
		},

		/**
		 * Binds the view to the approve path. Makes sure that approve view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sApprovePath path to the object to be bound to the view.
		 * @private
		 */

		_bindView: function(sApprovePath) {
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			// Bind Approve
			this.getView().bindElement({
				path: sApprovePath,
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
			//Set current path
			oViewModel.setProperty("/sApprovePath", sPath);
		},

		/**
		 * Event handler get two value the same time display the preview
		 * @function request# reqno
		 * @private
		 */

		_updateListItemCount: function(reqno) {
			var sTitle;
			// only update the counter if the length is final

			sTitle = this.getResourceBundle().getText("ApprovalInfo", [reqno]);
			oViewModel.setProperty("/title", sTitle);

		},

		/**
		 * Event handler Popup dialogs before update date  when click approve button 
		 * @function 
		 * @private
		 */

		_confirmByUser: function(oConfirmation, fnApprove) {
			// Opens the confirmation dialog
			MessageBox.show(oConfirmation.question, {
				icon: oConfirmation.icon,
				title: oConfirmation.title,
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.OK) {
						fnApprove();
					} else {
						MessageToast.show(oConfirmation.cancel);
					}
				}
			});

			var oTypeInfoId = this.getView().byId("TypeInfoId"),
				vTypeInfoId = oTypeInfoId.getText();

			if (vTypeInfoId === "200" || vTypeInfoId === "210" || vTypeInfoId === "230" || vTypeInfoId === "500" || vTypeInfoId ===
				"700" || vTypeInfoId === "600" || vTypeInfoId === "720" || vTypeInfoId === "710" || vTypeInfoId === "1700" || vTypeInfoId === "1800") {

				MessageBox.warning(oResourceBundle.getText("MessageInfo"));

			}
		},

		/**
		 * Event handler Popup dialogs before update date  when click reject button 
		 * @function 
		 * @private
		 */

		_onConfirmDialog: function(onConfirmDialog, fnAfterConfirm) {
			var dialog = new sap.m.Dialog({
				title: onConfirmDialog.title,
				type: "Message",
				content: [

					new sap.m.TextArea("confirmDialogTextarea", {
						width: "100%",
						placeholder: oResourceBundle.getText("Addnote(optional)")
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
					text: oResourceBundle.getText("Cancle"),
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

		/**
		 * Event handler call approve action update the date 
		 * @function 
		 * @private
		 */

		_callApprove: function(sPath) {
			var that = this;
			//	oViewModel.setProperty("/busy", true);

			oObject.Fcode = "F_APPROVE";
			oModel.update(sPath, oObject, {
				success: function(oResult) {
					//Release View
					oViewModel.setProperty("/busy", false);

					if (Device.system.phone) {
						that.onNavMaster();
					}

					MessageToast.show(oResourceBundle.getText("Approvedsuccessfully"));
				},
				error: function(oError) {
					//Release View
					oViewModel.setProperty("/busy", false);
					var responseText = JSON.parse(oError.responseText);
					MessageBox.error(responseText.error.message.value);

				}
			});

		},

		/**
		 * Event handler call reject action update the date 
		 * @function 
		 * @private
		 */

		_callReject: function(sPath) {
			var that = this;
			oViewModel.setProperty("/busy", true);

			var sText = sap.ui.getCore().byId("confirmDialogTextarea").getValue();
			// Get reject note text
			oObject.ZnoteApr = sText;

			//set function code
			oObject.Fcode = "F_REJECT";
			oModel.update(sPath, oObject, {
				success: function() {
					//Release View
					oViewModel.setProperty("/busy", false);

					if (Device.system.phone) {
						that.onNavMaster();
					}

					MessageToast.show(oResourceBundle.getText("Rejectsuccessfully"));
				},
				error: function(oError) {
					//Release View
					oViewModel.setProperty("busy", false);
					var responseText = JSON.parse(oError.responseText);
					MessageBox.error(responseText.error.message.value);

				}
			});

		},
		/*
		 * Update Leave Request Attachment Count
		 */
		onUpdateFinished: function(oEvent) {
			var countAll = oEvent.getParameter("total");
			oViewModel.setProperty("/attachCount", countAll);
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
		/*
		 * Format attachment icon
		 */
		_formatType:function(sFiletype) {
			if(sFiletype === "jpg" || sFiletype === "jpeg" || sFiletype === "png") {
				return "sap-icon://background";
			}else if(sFiletype === "pdf") {
				return "sap-icon://pdf-attachment";
			}else {
				return "sap-icon://attachment-text-file";
			}
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