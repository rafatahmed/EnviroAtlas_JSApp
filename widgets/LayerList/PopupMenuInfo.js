///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/promise/all',
  'jimu/portalUrlUtils',
  'jimu/WidgetManager',
  'jimu/PanelManager',
  'esri/lang',
  'esri/graphicsUtils',
  './NlsStrings',
  'dijit/Dialog'
], function(declare, array, lang, Deferred, all, portalUrlUtils, WidgetManager, PanelManager, esriLang,
  graphicsUtils, NlsStrings,Dialog) {
  var mapDescriptionStr = "";
  var xmlPath = "";
  var uncheckRelatedCheckbox = function (chkboxLayerId){
    	var chkSimpleSearch = document.getElementById(window.chkSelectableLayer + chkboxLayerId);
    	if((chkSimpleSearch != null) && (chkSimpleSearch.checked == true)){	
    		chkSimpleSearch.checked = false;    		
    	}
   };
   var loadJSON = function(callback){   

        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        //xobj.open('GET', 'widgets/LocalLayer/config.json', true); // Replace 'my_data' with the path to your file
        xobj.open('GET', xmlPath, true); 

        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
              }
        };
        xobj.send(null);  
    };
  var clazz = declare([], {

    _candidateMenuItems: null,
    //_deniedItems: null,
    _displayItems: null,
    _layerInfo: null,
    _layerType: null,
    _appConfig: null,

    constructor: function(layerInfo, displayItemInfos, layerType, layerListWidget) {
      this.nls = NlsStrings.value;
      this._layerInfo = layerInfo;
      this._layerType = layerType;
      this.layerListWidget = layerListWidget;
      this._initCandidateMenuItems();
      this._initDisplayItems(displayItemInfos);
    },

    _getATagLabel: function() {
      var url;
      var label;
      var itemLayerId = this._layerInfo.isItemLayer && this._layerInfo.isItemLayer();
      var layerUrl = this._layerInfo.getUrl();

      if (itemLayerId) {
        url = this._getItemDetailsPageUrl() || layerUrl;
        label = this.nls.itemShowItemDetails;
      } else if (layerUrl &&
        (this._layerType === "CSVLayer" || this._layerType === "KMLLayer")) {
        url = layerUrl;
        label = this.nls.itemDownload;
      } else if (layerUrl && this._layerType === "WMSLayer") {
        url = layerUrl + (layerUrl.indexOf("?") > -1 ? "&" : "?") + "SERVICE=WMS&REQUEST=GetCapabilities";
        label = this.nls.itemDesc;
      } else if (layerUrl && this._layerType === "WFSLayer") {
        url = layerUrl + (layerUrl.indexOf("?") > -1 ? "&" : "?") + "SERVICE=WFS&REQUEST=GetCapabilities";
        label = this.nls.itemDesc;
      } else if (layerUrl) {
        url = layerUrl;
        label = this.nls.itemDesc;
      } else {
        url = '';
        label = this.nls.itemDesc;
      }

      return '<a class="menu-item-description" target="_blank" href="' +
        url + '">' + label + '</a>';
    },

    _getItemDetailsPageUrl: function() {
      var itemUrl = "";
      var portalUrl;
      var appConfig = this.layerListWidget.appConfig;
      var itemLayerInfo = lang.getObject("_wabProperties.itemLayerInfo", false, this._layerInfo.layerObject);
      if(this._layerInfo.originOperLayer.itemId) {
        portalUrl = portalUrlUtils.getStandardPortalUrl(appConfig.map.portalUrl || appConfig.portalUrl);
        itemUrl = portalUrlUtils.getItemDetailsPageUrl(portalUrl, this._layerInfo.originOperLayer.itemId);
      } else if(itemLayerInfo && itemLayerInfo.portalUrl && itemLayerInfo.itemId){
        portalUrl = portalUrlUtils.getStandardPortalUrl(itemLayerInfo.portalUrl);
        itemUrl = portalUrlUtils.getItemDetailsPageUrl(portalUrl, itemLayerInfo.itemId);
      }
      return itemUrl;
    },

    _initCandidateMenuItems: function() {
      //descriptionTitle: NlsStrings.value.itemDesc,
      // var layerObjectUrl = (this._layerInfo.layerObject && this._layerInfo.layerObject.url) ?
      //                       this._layerInfo.layerObject.url :
      //                       '';
      this._candidateMenuItems = [{
        key: 'separator',
        label: ''
      }, {
        key: 'empty',
        label: this.nls.empty
      }, {
        key: 'mapDescription',
        label: this.nls.itemMapDescription
      }, {
        key: 'dataFactSheet',
        label: this.nls.itemDataFactSheet
      }, {
        key: 'metadataDownload',
        label: this.nls.itemMetadataDownload
      }, {
        key: 'changeSymbology',
        label: this.nls.itemChangeSymbology
      },{
        key: 'remove',
        label: this.nls.itemRemove
      }, {
        key: 'movetotop',
        label: this.nls.itemMovetoTop
      }, {
        key: 'transparency',
        label: this.nls.itemTransparency
      }, {
        key: 'moveup',
        label: this.nls.itemMoveUp
      }, {
        key: 'movedown',
        label: this.nls.itemMoveDown
      }, {
        key: 'table',
        label: this.nls.itemToAttributeTable
      }, {
        key: 'controlPopup',
        label: this.nls.removePopup
      }, {
        key: 'controlLabels',
        label: this.nls.showLabels
      }, {
        key: 'url',
        label: this._getATagLabel()
      }];
    },

    _initDisplayItems: function(displayItemInfos) {
      this._displayItems = [];
      // according to candidate itmes to init displayItems
      array.forEach(displayItemInfos, function(itemInfo) {
        array.forEach(this._candidateMenuItems, function(item) {
          if (itemInfo.key === item.key) {
            this._displayItems.push(lang.clone(item));
            if (itemInfo.onClick) {
              this._displayItem.onClick = itemInfo.onClick;
            }
          }
        }, this);
      }, this);
    },

    _isSupportedByAT: function() {
      return true;
    },

    _isSupportedByAT_bk: function(attributeTableWidget, supportTableInfo) {
      var isSupportedByAT;
      var isLayerHasBeenConfigedInAT;
      var ATConfig = attributeTableWidget.config;

      if(ATConfig.layerInfos.length === 0) {
        isLayerHasBeenConfigedInAT = true;
      } else {
        isLayerHasBeenConfigedInAT = array.some(ATConfig.layerInfos, function(layerInfo) {
          if(layerInfo.id === this._layerInfo.id && layerInfo.show) {
            return true;
          }
        }, this);
      }
      if (!supportTableInfo.isSupportedLayer ||
          !supportTableInfo.isSupportQuery ||
          supportTableInfo.otherReasonCanNotSupport ||
          !isLayerHasBeenConfigedInAT) {
        isSupportedByAT = false;
      } else {
        isSupportedByAT = true;
      }
      return isSupportedByAT;
    },

    getDeniedItems: function() {
      // summary:
      //    the items that will be denied.
      // description:
      //    return Object = [{
      //   key: String, popupMenuInfo key,
      //   denyType: String, "disable" or "hidden"
      // }]
      var defRet = new Deferred();
      var dynamicDeniedItems = [];

      if (this.layerListWidget.layerListView.isFirstDisplayedLayerInfo(this._layerInfo)) {
        dynamicDeniedItems.push({
          'key': 'moveup',
          'denyType': 'disable'
        });
      }
      if (this.layerListWidget.layerListView.isLastDisplayedLayerInfo(this._layerInfo)) {
        dynamicDeniedItems.push({
          'key': 'movedown',
          'denyType': 'disable'
        });
      }

      if (!this._layerInfo.getUrl()) {
        dynamicDeniedItems.push({
          'key': 'url',
          'denyType': 'disable'
        });
      }

      // deny controlLabels
      if (!this._layerInfo.canShowLabel()) {
        dynamicDeniedItems.push({
          'key': 'controlLabels',
          'denyType': 'hidden'
        });
      }

      var loadInfoTemplateDef = this._layerInfo.loadInfoTemplate();
      var getSupportTableInfoDef = this._layerInfo.getSupportTableInfo();

      all({
        infoTemplate: loadInfoTemplateDef,
        supportTableInfo: getSupportTableInfoDef
      }).then(lang.hitch(this, function(result) {

        // deny controlPopup
        if (!result.infoTemplate) {
          dynamicDeniedItems.push({
            'key': 'controlPopup',
            'denyType': 'disable'
          });
        }

        // deny table.
        var supportTableInfo = result.supportTableInfo;
        var attributeTableWidget =
              this.layerListWidget.appConfig.getConfigElementsByName("AttributeTable")[0];

        if (!attributeTableWidget || !attributeTableWidget.visible) {
          dynamicDeniedItems.push({
            'key': 'table',
            'denyType': 'hidden'
          });
        } else if (!this._isSupportedByAT(attributeTableWidget, supportTableInfo)) {
          if(this._layerInfo.parentLayerInfo &&
             this._layerInfo.parentLayerInfo.isMapNotesLayerInfo()) {
            dynamicDeniedItems.push({
              'key': 'table',
              'denyType': 'hidden'
            });
          } else {
            dynamicDeniedItems.push({
              'key': 'table',
              'denyType': 'disable'
            });
          }

        }
        defRet.resolve(dynamicDeniedItems);
      }), function() {
        defRet.resolve(dynamicDeniedItems);
      });

      return defRet;

    },

    getDisplayItems: function() {
      return this._displayItems;
    },

    onPopupMenuClick: function(evt) {
      var result = {
        closeMenu: true
      };
      switch (evt.itemKey) {
        case 'mapDescription':
          this._onItemMapDescriptionClick(evt);
          break;
        case 'dataFactSheet':
          this._onItemDataFactSheetClick(evt);
          break;
        case 'metadataDownload':
          this._onItemMetadataDownloadClick(evt);
          break;    
        case 'changeSymbology':
          this._onItemChangeSymbologyClick(evt);
          break;                             
        case 'remove':
          this._onItemRemoveClick(evt);
          break;                            
        case 'movetotop':
          this._onMoveToTopClick(evt);
          break;
        case 'moveup' /*this.nls.itemMoveUp'Move up'*/ :
          this._onMoveUpItemClick(evt);
          break;
        case 'movedown' /*this.nls.itemMoveDown'Move down'*/ :
          this._onMoveDownItemClick(evt);
          break;
        case 'table' /*this.nls.itemToAttributeTable'Open attribute table'*/ :
          this._onTableItemClick(evt);
          break;
        case 'transparencyChanged':
          this._onTransparencyChanged(evt);
          result.closeMenu = false;
          break;
        case 'controlPopup':
          this._onControlPopup();
          break;
        case 'controlLabels':
          this._onControlLabels();
          break;

      }
      return result;
    },

    /**********************************
     * Respond events respectively.
     *
     * event format:
      // evt = {
      //   itemKey: item key
      //   extraData: estra data,
      //   layerListWidget: layerListWidget,
      //   layerListView: layerListView
      // }, result;
     **********************************/
    _onMoveToTopClick: function(evt) {
      /*jshint unused: false*/

        lyr = this._layerInfo.map.getLayer(this._layerInfo.id);
        isDynamicLayer = false;
		if(lyr){
			for (ii in window.dynamicLayerNumber) {
				eachDynamicLyrId = window.layerIdPrefix + window.dynamicLayerNumber[ii];
				if (eachDynamicLyrId == this._layerInfo.id) {
					isDynamicLayer = true;
				}
				eachDynamicLyr = this._layerInfo.map.getLayer(eachDynamicLyrId);
				if (eachDynamicLyr ){
					dynamicLayerElem = document.getElementById("map_" + eachDynamicLyrId);
					if (dynamicLayerElem != null){
						dynamicLayerElem.style.zIndex = "0";
					}
				}
		  	}
			if (isDynamicLayer == true) {
				console.log("map_" + this._layerInfo.id + " is dynamic layer");
     			document.getElementById("map_" + this._layerInfo.id).style.zIndex = "1";
	     	} 	
	     	else {
        	this._layerInfo.map.reorderLayer(lyr,this._layerInfo.map.layerIds.length);
      	}   
      	
      	}   
        lyrTiled = this._layerInfo.map.getLayer(window.layerIdTiledPrefix + this._layerInfo.id.replace(window.layerIdPrefix, "")); //bji need to be modified to accomodate tile.
	    if(lyrTiled){
       	     this._layerInfo.map.reorderLayer(lyrTiled,this._layerInfo.map.layerIds.length);
        } 
    },

    _isValidExtent: function(extent){
      var isValid = false;
      if(esriLang.isDefined(extent)){
        if(esriLang.isDefined(extent.xmin) && isFinite(extent.xmin) &&
           esriLang.isDefined(extent.ymin) && isFinite(extent.ymin) &&
           esriLang.isDefined(extent.xmax) && isFinite(extent.xmax) &&
           esriLang.isDefined(extent.ymax) && isFinite(extent.ymax)){
          isValid = true;
        }
      }
      return isValid;
    },

    _onMoveUpItemClick: function(evt) {
      if (!this._layerInfo.isFirst) {
        evt.layerListView.moveUpLayer(this._layerInfo);
      }
    },

    _onMoveDownItemClick: function(evt) {
      if (!this._layerInfo.isLast) {
        evt.layerListView.moveDownLayer(this._layerInfo);
      }
    },

    _onTableItemClick: function(evt) {
      this._layerInfo.getSupportTableInfo().then(lang.hitch(this, function(supportTableInfo) {
        var widgetManager;
        var attributeTableWidgetEle =
                    this.layerListWidget.appConfig.getConfigElementsByName("AttributeTable")[0];
        if(this._isSupportedByAT(attributeTableWidgetEle, supportTableInfo)) {
          widgetManager = WidgetManager.getInstance();
          widgetManager.triggerWidgetOpen(attributeTableWidgetEle.id)
          .then(lang.hitch(this, function() {
            evt.layerListWidget.publishData({
              'target': 'AttributeTable',
              'layer': this._layerInfo
            });
          }));
        }
      }));
    },

    _onItemMapDescriptionClick: function(evt) {
        layerId = this._layerInfo.id;

        var clickedURL = this._layerInfo.layerObject.url;
        var bMapDescriptionAvailale = false;
        var strLayerPrefix = "";
        if ((layerId.indexOf(window.layerIdPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdPrefix;
			xmlPath = "widgets/LocalLayer/config.json";
        }
        else if ((layerId.indexOf(window.layerIdPBSPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdPBSPrefix;
       		xmlPath = "widgets/PeopleAndBuildSpaces/config.json";
        } 
        else if ((layerId.indexOf(window.layerIdBndrPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdBndrPrefix;
       		xmlPath = "widgets/BoundaryLayer/config.json";
        }  
        loadJSON(function(response) {
	        var localLayerConfig = JSON.parse(response);
	        var urlInConfig = "";
	        
	        var arrLayers = localLayerConfig.layers.layer;
	        for (index = 0, len = arrLayers.length; index < len; ++index) {
	            layer = arrLayers[index];
	            if(layer.hasOwnProperty('eaID')){
			        if(layer.hasOwnProperty('eaLyrNum')){
			            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
			        }                	
	                if ((layerId === (strLayerPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) {
	                    if(layer.hasOwnProperty('eaDescription')){
					    	var mapDescription = new Dialog({
						        title: layer.name,
						        style: "width: 300px",    
					    	});
					        mapDescription.show();
					        mapDescription.set("content", layer.eaDescription);
					        bMapDescriptionAvailale = true;
	                        break;
	                    }
	                }
	            }
	        }
	        if (!bMapDescriptionAvailale){
	        	alert("Map description is not available for this layer");
	        }
      });   
    },
    _onItemDataFactSheetClick: function(evt) {
        layerId = this._layerInfo.id;
        var clickedURL = this._layerInfo.layerObject.url;
        var bDataFactSheetAvailale = false;
        var strLayerPrefix = "";
        if ((layerId.indexOf(window.layerIdPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdPrefix;
			xmlPath = "widgets/LocalLayer/config.json";
        }
        else if ((layerId.indexOf(window.layerIdPBSPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdPBSPrefix;
       		xmlPath = "widgets/PeopleAndBuildSpaces/config.json";
        } 
        else if ((layerId.indexOf(window.layerIdBndrPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdBndrPrefix;
       		xmlPath = "widgets/BoundaryLayer/config.json";
        } 
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            
            var urlInConfig = "";
            
            var arrLayers = localLayerConfig.layers.layer;           
            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];
                if(layer.hasOwnProperty('eaID')){
			        if(layer.hasOwnProperty('eaLyrNum')){
			            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
			        }                	
                    if ((layerId === (strLayerPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) {      
                        if(layer.hasOwnProperty('eaDfsLink')){
                        	if (layer.eaDfsLink.trim() != ""){
                            window.open(window.dataFactSheet + layer.eaDfsLink);
					        bDataFactSheetAvailale = true;
                            break;
                        	}
                        }
                    }
                }
            }
            if (!bDataFactSheetAvailale){
            	alert("Data fact sheet is not available for this layer");
            }

        });
    },
    _onItemChangeSymbologyClick: function(evt) {
      layerId = this._layerInfo.id;
      lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
	  if(lyrTiled){
		       		lyrTiled.setVisibility(false);
	  }
      this.layerListWidget.publishData({
        message: layerId
      }, true);

      var widgets = this.layerListWidget.appConfig.getConfigElementsByName('DynamicSymbology');

      var pm = PanelManager.getInstance();

      if(widgets[0].visible){
        pm.closePanel(widgets[0].id + "_panel");
      }
      pm.showPanel(widgets[0]);
      //var widgetId = widgets[0].id;
      //this.layerListWidget.openWidgetById(widgetId);
      //console.log(widgets);
      console.log('Open Dynamic Symbology');
    },    
    _onItemMetadataDownloadClick: function(evt) {
        layerId = this._layerInfo.id;
        var clickedURL = this._layerInfo.layerObject.url;
        var bMetadataAvailale = false;
        var strLayerPrefix = "";
        if ((layerId.indexOf(window.layerIdPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdPrefix;
			xmlPath = "widgets/LocalLayer/config.json";
        }
        else if ((layerId.indexOf(window.layerIdPBSPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdPBSPrefix;
       		xmlPath = "widgets/PeopleAndBuildSpaces/config.json";
        } 
        else if ((layerId.indexOf(window.layerIdBndrPrefix)) >= 0) {
        	strLayerPrefix = window.layerIdBndrPrefix;
       		xmlPath = "widgets/BoundaryLayer/config.json";
        }  
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            
            var urlInConfig = "";
            
            var arrLayers = localLayerConfig.layers.layer;           
            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];
                if(layer.hasOwnProperty('eaID')){
			        if(layer.hasOwnProperty('eaLyrNum')){
			            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
			        }                	
                    if ((layerId === (strLayerPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) { 
                    	if(layer.hasOwnProperty('eaMetadata')){
	                    	if (layer.hasOwnProperty('eaScale') &&  (layer.eaScale == "NATIONAL")) {
	                        	metaDataID = window.nationalMetadataDic[layer.eaMetadata];
	                            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");
						        bMetadataAvailale = true;                    		
	                    	} else {
	                    		if (window.communitySelected == window.strAllCommunity){
		                            window.open(window.communityMetadataDic[layer.eaMetadata][window.communitySelected]);
							        bMetadataAvailale = true;		                    			
	                    		} else {
	                        	metaDataID = window.communityMetadataDic[layer.eaMetadata][window.communitySelected];
	                            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");
						        bMetadataAvailale = true;	                    		
	                    		}
	                    	}     		

					    }                      
                        
                        break;
                    }
                }
            }
            if (!bMetadataAvailale){
            	alert("Matadata is not available for this layer");
            }

        });
        

    },    
    _onItemRemoveClick: function(evt) {
        layerId = this._layerInfo.id;
		lyr = this._layerInfo.map.getLayer(layerId);
		if(lyr){
        	this._layerInfo.map.removeLayer(lyr);
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdPrefix, ""));
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdBndrPrefix, ""));
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdPBSPrefix, ""));
      	}          
		lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
		if(lyrTiled){
       		this._layerInfo.map.removeLayer(lyrTiled);
      	}        	
    },    
    _onTransparencyChanged: function(evt) {
      this._layerInfo.setOpacity(1 - evt.extraData.newTransValue);
      layerId = this._layerInfo.id;
	  lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
	  if(lyrTiled){
       	  lyrTiled.setOpacity(1 - evt.extraData.newTransValue);
      }        
    },

    _onControlPopup: function(evt) {
      /*jshint unused: false*/
      if (this._layerInfo.controlPopupInfo.enablePopup) {
        this._layerInfo.disablePopup();
      } else {
        this._layerInfo.enablePopup();
      }
      this._layerInfo.map.infoWindow.hide();
    },

    _onControlLabels: function(evt) {
      /*jshint unused: false*/
      if(this._layerInfo.canShowLabel()) {
        if(this._layerInfo.isShowLabels()) {
          this._layerInfo.hideLabels();
        } else {
          this._layerInfo.showLabels();
        }
      }
    }
  });

  clazz.create = function(layerInfo, layerListWidget) {
    var retDef = new Deferred();
    var isRootLayer = layerInfo.isRootLayer();
    var defaultItemInfos = [{
      key: 'url',
      onClick: null
    }];

    var itemInfoCategoreList = {
      'RootLayer': [
      {
        key: 'transparency'
      }, {
        key: 'movetotop'
      }, {
        key: 'remove'
      },{
        key: 'separator'
      }, {
        key: 'mapDescription'
      }, {
        key: 'url'
      }, {
        key: 'separator'
      }, {
        key: 'moveup'
      }, {
        key: 'movedown'
      } ],
      'RootLayerAndFeatureLayer': [
      {
        key: 'transparency'
      }, {
        key: 'movetotop'
      }, {
        key: 'changeSymbology'
      }, /*{
        key: 'controlPopup'
      },*/ {
        key: 'remove'
      }, {
        key: 'separator'
      },  {
        key: 'mapDescription'
      }, {
        key: 'dataFactSheet'
      }, {
        key: 'url'
      }, {
        key: 'metadataDownload'
      }, {
        key: 'separator'
      }, {
        key: 'table'
      }, {
        key: 'separator'
      }, {
        key: 'moveup'
      }, {
        key: 'movedown'
      }],
      'FeatureLayer': [/*{
        key: 'controlPopup'
      }, */{
        key: 'separator'
      }, {
        key: 'table'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'GroupLayer': [{
        key: 'url'
      }],
      'Table': [{
        key: 'table'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'default': defaultItemInfos
    };

    layerInfo.getLayerType().then(lang.hitch(this, function(layerType) {
      var itemInfoCategory = "";
      if (isRootLayer &&
          (layerType === "FeatureLayer" ||
            layerType === "CSVLayer" ||
            layerType === "ArcGISImageServiceLayer" ||
            layerType === "StreamLayer" ||
            layerType === "ArcGISImageServiceVectorLayer")) {
        itemInfoCategory = "RootLayerAndFeatureLayer";
      } else if (isRootLayer) {
        itemInfoCategory = "RootLayer";
      } else if (layerType === "FeatureLayer" || layerType === "CSVLayer") {
        itemInfoCategory = "FeatureLayer";
      } else if (layerType === "GroupLayer") {
        itemInfoCategory = "GroupLayer";
      } else if (layerType === "Table") {
        itemInfoCategory = "Table";
      } else {
        //default condition
        itemInfoCategory = "default";
      }
      retDef.resolve(new clazz(layerInfo,
        itemInfoCategoreList[itemInfoCategory],
        layerType,
        layerListWidget));
    }), lang.hitch(this, function() {
      //return default popupmenu info.
      retDef.resolve(new clazz(layerInfo, [{
        key: 'empty'
      }]));
    }));
    return retDef;
  };


  return clazz;
});
