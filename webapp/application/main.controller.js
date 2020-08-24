sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(
	oController,
	JSONModel
) {
	"use strict";

	const SERVICE_URL = "https://sandbox.api.sap.com/ml/ocr/ocr";

	return oController.extend("app.application.main", {

		onInit() {
			this.getView().setModel(new JSONModel({
				apiKey: localStorage.getItem("ocr-apiKey"),
				service: SERVICE_URL,
				loading: false,
				language: "en",
				outputType: "txt"
			}));
			this.getView().setModel(new JSONModel(), "parsed");
		},

		saveAPIKey() {
			const sKey = this.getView().getModel().getProperty("/apiKey");
			localStorage.setItem("ocr-apiKey", sKey);
		},

		submit() {
			this.getView().getModel().setProperty("/loading", true);
			const oFileUploader = this.getView().byId("fileUploader");
			oFileUploader.FUEl.name = "files";
			oFileUploader.upload();
		},

		getOptions(sLanguage, sOutputType) {
			return JSON.stringify({
				outputType: sOutputType,
				lang: sLanguage
			});
		},

		handleUploadComplete(oEvent) {
			const oResponse = JSON.parse(oEvent.getParameter("responseRaw"));
			if (oResponse.error) {
				throw Error(oResponse.error.message);
			}
			else if (oResponse.predictions) {
				this.getView().getModel().setProperty("/predictedText", oResponse.predictions[0].trim());
				this.getView().getModel("parsed").setData(this.parsePredictions(oResponse.predictions[0]));
			}
			this.getView().getModel().setProperty("/loading", false);
			sap.m.MessageToast.show("The image was successfully and parsed");
		},

		parsePredictions(sPredictions) {
			return {
				contractNumber: this.parseProperty(sPredictions, "Contract Number"),
				conditionType: this.parseProperty(sPredictions, "Condition Type"),
				conditionValue: this.parseProperty(sPredictions, "Condition Value", true),
				article: this.parseProperty(sPredictions, "Article"),
				referenceBase: this.parseProperty(sPredictions, "Reference Base", true),
				netAmount: this.parseProperty(sPredictions, "Net Amount", true),
				currencyCode: "EUR",
				agrmtUnit: "%"
			};
		},

		parseProperty(sPredictions, sProperty, bNumber, sExpression) {
			sExpression = sExpression ? sExpression : `${sProperty}( |\n*)(.*?)( |\n)`;
			const aMatches = new RegExp(sExpression).exec(sPredictions);
			if (aMatches && aMatches.length > 2) {
				let sValue = aMatches[2];
				if (bNumber) {
					sValue = sValue.replace(/\./g, "").replace(',', ".");
					sValue = parseFloat(sValue);
				}
				return sValue;
			}
		}

	});
});