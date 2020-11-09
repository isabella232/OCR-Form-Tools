// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { FieldFormat, ITag } from "../../../../models/applicationState";
import "./predictResult.scss";
import { getPrimaryGreenTheme } from "../../../../common/themes";
import { FontIcon, PrimaryButton } from "@fluentui/react";
import PredictModelInfo from './predictModelInfo';
import { strings } from "../../../../common/strings";

export interface IAnalyzeModelInfo {
    docType: string,
    modelId: string,
    docTypeConfidence: number,
}

export interface ITableResultItem {
    displayOrder: number,
    fieldName: string,
    type: string,
    values: {},
    rowKeys?: [],
    columnKeys: [],
}

export interface IResultItem {
    boundingBox: [],
    confidence: number,
    displayOrder: number,
    elements: [],
    fieldName: string,
    page: number,
    text: string,
    type: string,
    valueString: string,
}

export interface IPredictResultProps {
    predictions: { [key: string]: any };
    analyzeResult: {};
    analyzeModelInfo: IAnalyzeModelInfo;
    page: number;
    tags: ITag[];
    downloadResultLabel: string;
    onAddAssetToProject?: () => void;
    onPredictionClick?: (item: IResultItem) => void;
    onTablePredictionClick?: (item: ITableResultItem, tagColor: string) => void;
    onPredictionMouseEnter?: (item: any) => void;
    onPredictionMouseLeave?: (item: any) => void;
}

export interface IPredictResultState { }

export default class PredictResult extends React.Component<IPredictResultProps, IPredictResultState> {
    public render() {
        const { tags, predictions, analyzeModelInfo } = this.props;
        const tagsDisplayOrder = tags.map((tag) => tag.name);
        for (const name of Object.keys(predictions)) {
            const prediction = predictions[name];
            if (prediction != null) {
                prediction.fieldName = name;
                prediction.displayOrder = tagsDisplayOrder.indexOf(name);
            }
        }
        // not sure if we decide to filter item by the page
        const items = Object.values(predictions).filter(Boolean).sort((p1, p2) => p1.displayOrder - p2.displayOrder);

        return (
            <div>
                <div className="container-items-center container-space-between results-container">
                    <h5 className="results-header">Prediction results</h5>

                </div>
                <div className="container-items-center container-space-between">
                    <PrimaryButton
                        theme={getPrimaryGreenTheme()}
                        onClick={this.onAddAssetToProject}
                        text={strings.predict.editAndUploadToTrainingSet} />
                    <PrimaryButton
                        className="align-self-end keep-button-80px"
                        theme={getPrimaryGreenTheme()}
                        text="Download"
                        allowDisabledFocus
                        autoFocus={true}
                        onClick={this.triggerDownload}
                    />
                </div>
                <PredictModelInfo modelInfo={analyzeModelInfo} />
                <div className="prediction-field-header">
                    <h6 className="prediction-field-header-field"> Page # / Field name / Value</h6>
                    <h6 className="prediction-field-header-confidence"> Confidence</h6>
                </div>
                <div className="prediction-header-clear"></div>

                {items.map((item: any, key) => this.renderItem(item, key))}
            </div>
        );
    }

    private renderItem = (item: any, key: number) => {
        const postProcessedValue = this.getPostProcessedValue(item);
        const style: any = {
            marginLeft: "0px",
            marginRight: "0px",
            background: this.getTagColor(item.fieldName),
        };

        if (this.isTableTag(item)) {
            const firstRow = item.values[Object.keys(item.values)[0]];
            const pageNumber = firstRow[Object.keys(firstRow)[0]].page;

            return (
                <div key={key}
                    onClick={() => this.onTablePredictionClick(item, this.getTagColor(item.fieldName))}
                    onMouseEnter={() => this.onPredictionMouseEnter(item)}
                    onMouseLeave={() => this.onPredictionMouseLeave(item)}>
                    <li className="predictiontag-item" style={style}>
                        <div className={"predictiontag-color"}>
                            <span>{pageNumber}</span>
                        </div>
                        <div className={"predictiontag-content"}>
                        {this.getPredictionTagContent(item)}
                        </div>
                    </li>
                    <li className="predictiontag-item-label mt-0 mb-1">
                        <FontIcon className="pr-1 pl-1" iconName="Table" />
                        <span style={{color: "rgba(255, 255, 255, 0.75)"}}>Click to view analyzed table</span>
                </li>
                </div>)
        } else {
            return (
                <div key={key}
                onClick={() => this.onPredictionClick(item)}
                onMouseEnter={() => this.onPredictionMouseEnter(item)}
                onMouseLeave={() => this.onPredictionMouseLeave(item)}>
                <li className="predictiontag-item" style={style}>
                    <div className={"predictiontag-color"}>
                        <span>{item.page}</span>
                    </div>
                    <div className={"predictiontag-content"}>
                        {this.getPredictionTagContent(item)}
                    </div>
                </li>
                <li className={postProcessedValue ? "predictiontag-item-label mt-0" : "predictiontag-item-label mt-0 mb-1"}>
                    {postProcessedValue ? "text: " + item.text : item.text}
                </li>
                {postProcessedValue &&
                    <li className="predictiontag-item-label mb-1">
                        {postProcessedValue}
                    </li>
                }
                </div>
            );
        }
    }

    private getTagColor = (name: string): string => {
        const tag: ITag = this.props.tags.find((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase());
        if (tag) {
            return tag.color;
        }
        return "#999999";
    }

    private isTableTag(item) : boolean{
        return (item.type === FieldFormat.RowDynamic || item.type === FieldFormat.Fixed);
    }

    private getPredictionTagContent = (item: any) => {
        return (
            <div className={"predictiontag-name-container"}>
                <div className="predictiontag-name-body">
                    {
                        <span title={item.fieldName} className="predictiontag-name-text px-2">
                            {item.fieldName}
                        </span>
                    }
                </div>
                {item.confidence && <div className={"predictiontag-confidence"}>
                    <span>{(item.confidence * 100).toFixed(2) + "%"}</span>
                </div>}
            </div>
        );
    }

    // Helper: Sanitizes the results of prediction in order to align it with API from the service
    private sanitizeData = (data: any): void => {
        if (data.hasOwnProperty("analyzeResult")) {
            const fields: {} = data.analyzeResult.documentResults[0].fields;
            for (const key in fields) {
                if (fields[key] !== null) {
                    if (fields[key].hasOwnProperty("displayOrder")) {
                        delete fields[key].displayOrder;
                    }
                    if (fields[key].hasOwnProperty("fieldName")) {
                        delete fields[key].fieldName;
                    }
                }
            }
        }
        return data;
    }

    private onAddAssetToProject = async () => {
        if (this.props.onAddAssetToProject) {
            this.props.onAddAssetToProject();
        }
    }
    private triggerDownload = (): void => {
        const { analyzeResult } = this.props;
        const predictionData = JSON.stringify(this.sanitizeData(analyzeResult));
        const fileURL = window.URL.createObjectURL(new Blob([predictionData]));
        const fileLink = document.createElement("a");
        const fileBaseName = this.props.downloadResultLabel.split(".")[0];
        const downloadFileName = "Result-" + fileBaseName + ".json";

        fileLink.href = fileURL;
        fileLink.setAttribute("download", downloadFileName);
        document.body.appendChild(fileLink);
        fileLink.click();
    }

    private toPercentage = (x: number): string => {
        return (100 * x).toFixed(1) + "%";
    }

    private onPredictionClick = (prediction: any) => {
        if (this.props.onPredictionClick) {
            this.props.onPredictionClick(prediction);
        }
    }
    private onTablePredictionClick = (prediction: any, tagColor) => {
        if (this.props.onTablePredictionClick) {
            this.props.onTablePredictionClick(prediction, tagColor);
        }
    }

    private onPredictionMouseEnter = (prediction: any) => {
        if (this.props.onPredictionMouseEnter) {
            this.props.onPredictionMouseEnter(prediction);
        }
    }

    private onPredictionMouseLeave = (prediction: any) => {
        if (this.props.onPredictionMouseLeave) {
            this.props.onPredictionMouseLeave(prediction);
        }
    }

    private getPostProcessedValue = (prediction: any) => {
        if (!prediction.type || !prediction.text) {
            return null;
        }
        const predictionType = prediction.type;
        const predictionText = prediction.text;
        let postProcessedValue;
        let valueType;
        switch (predictionType) {
            case "string":
                valueType = "valueString";
                postProcessedValue = prediction.valueString;
                break;
            case "date":
                valueType = "valueDate";
                postProcessedValue = prediction.valueDate;
                break;
            case "number":
                valueType = "valueNumber";
                postProcessedValue = prediction.valueNumber?.toString();
                break;
            case "integer":
                valueType = "valueInteger";
                postProcessedValue = prediction.valueInteger?.toString();
                break;
            case "time":
                valueType = "valueTime";
                postProcessedValue = prediction.valueTime;
                break;
            default:
                return null;
        }
        if (typeof postProcessedValue === "string" && predictionText !== postProcessedValue) {
            return valueType + ": " + postProcessedValue;
        } else {
            return null;
        }
    }
}
