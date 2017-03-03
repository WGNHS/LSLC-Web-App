console.log("this version")
require([
   //ALSO INCLUDE THESE IN THE FUNCTION PARAMETERS BELOW!
 //  "esri/tasks/Locator",
   "esri/map",
 //  "esri/views/MapView", 
//    "esri/InfoTemplate", //causes script error?
   "esri/layers/FeatureLayer",
  // "esri/dijit/FeatureTable",
   "esri/symbols/SimpleFillSymbol",
//    "esri/PopupTemplate",   
//    "esri/tasks/IdentifyTask",
//   "esri/tasks/IdentifyParameters", //causes scripterror?
   "esri/tasks/query",
   "esri/tasks/QueryTask",
   "esri/toolbars/draw", 
 //  "esri/Color",
//    "esri/layers/ArcGISDynamicMapServiceLayer",
 //  "esri/layers/VectorTileLayer",
    "dojo/dom", 
   "dojo/on",
   "dojo/_base/array",
   "dojo/parser",   //I don't know what this does. 
   "dojo/domReady!" 
   
], function (Map, FeatureLayer, SimpleFillSymbol, Query, QueryTask, Draw, dom, on, arrayUtil, parser, rockTypeSearchKey){
   // console.log("a: ",Map, "b: ",MapView, "c: ",FeatureLayer, "d: ",VectorTileLayer);
   parser.parse(); //I don't know what this does. 
   
   // /********* MAP **********/   
   var map = new Map('map', {
      basemap: 'topo', 
      center: [-90, 47],
       zoom: 7, 
       sliderPosition: "top-right"
   });

   //defines selection tool as global variable
   var selectionTool;

   //passes on-load event to anonymous function
   map.on("load", function(e){

    initMapButtons(e); //function is in map.js
    resetFilters();
    //call the initialize function. This sets an event listener for inputs. 
    initSearchBars();
    removeFilters();

   });

   
   
    
   
   // /********* POLYGON STYLES **********/
   //polygon selection style 
    var highlightSymbol = new SimpleFillSymbol({
            "type": 'esriSFS',
            "style":'esriSFSSolid', 
            "color": [24,132,111, 191], //rgba 0-255 //green 
            "outline": {
              "type": "esriSLS", 
              "style": "esriSLSSolid",
              "color": [24,132,111,255], //rgba 0-255 //green 
              "width": 1
            }
      });
   
   
   // /********* LAYERS **********/
   //add vector tile layer (Modern Antique)
     // var vectorTiles = new VectorTileLayer('https://www.arcgis.com/sharing/rest/content/items/996d9e7a3aac4514bb692ce7a990f1c1/resources/styles/root.json');
   
   //add map sections feature layer through Esri API. I can style. 
   fl = new FeatureLayer('http://geodata.wgnhs.uwex.edu/arcgis/rest/services/lslc/lslc/MapServer/0', {mode: FeatureLayer.MODE_ONDEMAND, outFields: ["*"]});
   
    //don't want this symbol applied to sections when they have been selected for the map filter. 
   fl.setSelectionSymbol(highlightSymbol); //var selectedSymbol is an object declared above 
   
    map.addLayer(fl);
    
 
//initSearchBars();

// function initSearchBar(){
//   var rockTypeSearchBar = document.getElementById('rockTypeSearch')
//   console.log(rockTypeSearchBar.value)
//   var rockTypeSearchKey = rockTypeSearchBar.value
// }

function initMapButtons(event){
    
    //selectionTool is a global variable
    selectionTool = new Draw(event.map); 
    
    //set up event listener for DrawEnd
    //when the selection tool has finished drawing a box, 
    // create a new selection in the feature layer (fl) 
    on(selectionTool, "DrawEnd", function(geometry){
      console.log('draw end.');
        selectionTool.deactivate();
        
        //construct a new query using the DrawEnd geometry. 
        var mapFilter = new Query();
        mapFilter.geometry = geometry;
        
        //create a new selection using the query
        var mapSelection = fl.selectFeatures(mapFilter, fl.SELECTION_NEW);
        //console.log(mapSelection);
        //assign the selection's results array to a variable.
        var mapSelectionResults = mapSelection.results[0][0];
        
        var selectedSections= [];
        for (j in mapSelectionResults){
            //isolate the section's UID attribute and push it to the selectedSections array. 
            var selectedSectionId = mapSelectionResults[j].attributes.UID;
            selectedSections.push(selectedSectionId);
        }
      //  console.log("filter based on these sections:", selectedSections);
        filterForSections(selectedSections, fl);
       
    });

  utilizeButtons(); //calls funtion that has jquery onclick functions
} 

    
/********** SELECTION/CLEAR FUNCTIONALITY **********/
function utilizeButtons(){

   $("#mapFilterButton").on( "click", function(){

       //console.log(selectionTool);
       selectionTool.activate(Draw.EXTENT);
       
   });
   
   $("#mapClearButton").on("click", function () {
       console.log("clear map sections from SQL query.");
       //set filter. 
       filters.mapSectionsInput = null;
       //clear map. 
        fl.clearSelection();
       resetFilters();
         
    });

} //end function utilizeButtons

    
   
    
function resetFilters() {
        filters.rockTypeInput = $("#rockTypeSearch").val();
        filters.countyInput = $("#countySearch").val(); 
        filters.stateInput = $("#stateSearch").val();
        filters.thinSectionAvailabilityInput =  document.getElementById("thinSectionCheckbox").checked;
        filters.handSampleAvailabilityInput = document.getElementById("handSampleCheckbox").checked;
        
        console.log("filters set:", filters);
        queryTableForFilters();
}

//function utilizes the search bars
function initSearchBars(){
    
    
    $("#filters").on("input", "input", function(){
        resetFilters();

    }); //close #filters.on input function
 
} //end initSearchBars function


    
function queryTableForFilters(){
   
    var newsqlArray = ["1=1"];
    
    //delete all filter indicators. They will be replaced. 
    $("#filterFeedback").html('');
    
    if (filters.rockTypeInput) {
        newsqlArray.push("Upper(RockType) LIKE Upper('%"+filters.rockTypeInput+"%')");
        //adds feedback indicator
      //$("#rockSearchOn").remove();
      $("#filterFeedback").append($("<span id='rockSearchOn' class='feedbackBar' data='rockTypeInput'>rock:&nbsp" + filters.rockTypeInput + "<img src='images/close.png' style = 'height: 21px; margin-bottom: -5px;'/></span>"));
        }; 
    if (filters.countyInput) {
        newsqlArray.push("Upper(County) LIKE Upper('%"+filters.countyInput+"%')");
       // $("#countySearchOn").remove();
      $("#filterFeedback").append($("<span id='countySearchOn' class='feedbackBar' data = 'countyInput'>county:&nbsp" + filters.countyInput +"<img src='images/close.png' style = 'height: 21px; margin-bottom: -5px;'/></span>"));
        }; 
    if (filters.handSampleAvailabilityInput) {
        newsqlArray.push("HandSampleCount > 0");
       // $("#handSampleOn").remove();
      $("#filterFeedback").append($("<span id='handSampleOn' class='feedbackBar' data='handSampleAvailabilityInput'>Hand&nbspsample:&nbsp" + filters.handSampleAvailabilityInput + "<img src='images/close.png' style = 'height: 21px; margin-bottom: -5px;'/></span>"));
        }; 
    if (filters.thinSectionAvailabilityInput) {
        newsqlArray.push("ThinsectionCount > 0");
        $("#filterFeedback").append($("<span id='thinSectionOn' class='feedbackBar' data='thinSectionAvailabilityInput'>Thin&nbspsection:&nbsp" + filters.thinSectionAvailabilityInput + "<img src='images/close.png' style = 'height: 21px; margin-bottom: -5px;'/></span>"));
        }; 
    if (filters.mapSectionsInput) {newsqlArray.push("SectionId IN ("+filters.mapSectionsInput+")");}; 
    if (filters.stateInput){
        newsqlArray.push("Upper(State) LIKE Upper('%"+filters.stateInput+"%')");
        $("#filterFeedback").append($("<span id='stateOn' class='feedbackBar' data='stateInput'>state:&nbsp" + filters.stateInput + "<img src='images/close.png' style = 'height: 21px; margin-bottom: -5px;'/></span>"));
        };
    
    //console.log ("new SQL array:", newsqlArray);
    
    
    //same lines from QueryTable() 
    var query = new Query(); 
    query.outFields = ["*"];
    query.returnGeometry = false;
    query.where = ""; // assigns empty string to where statement
    
     //same lines from QueryTable() 
    var sectionsQuery = new Query(); 
    sectionsQuery.outFields = ["SectionId"];
    sectionsQuery.returnGeometry = false;
    sectionsQuery.where = ""; // assigns empty string to where statement

    
    //iterates through newsqlArray
    //THIS IS UNNECESSARY if we always search for everything when no filters are applied. 
    for (i = 0; i < newsqlArray.length; i++) {
      //testing for a value before and after, if so, adds AND in between them
      if (query.where != "" && newsqlArray[i] != "") {query.where +=  " AND " };
      query.where += newsqlArray[i]; //adds the sql query to the string 
        
    };
    
    console.log("query.where is:", query.where);
     //set the sections query where clause to the same where as the normal query. 
    sectionsQuery.where = query.where;
    
   //only try to send queryTask if there is something to search on.
    if (query.where.length > 0){
        if (query.where === "1=1"){ console.log("Narrow the results by applying filters above.");}
               
   //url to samples table
    var queryTask = new QueryTask("http://geodata.wgnhs.uwex.edu/arcgis/rest/services/lslc/lslc/MapServer/1");

    queryTask.execute( query, function(samplesResult){listResults(samplesResult);}  );
    queryTask.execute( sectionsQuery, function(sectionsQueryResult){
       // console.log("sections query result:", sectionqueryResult.features);
        var highlightMapSections = []; 
        //iterate through  
        for (f in sectionsQueryResult.features){
           // console.log("f attributes sectionId", sectionqueryResult.features[f].attributes.SectionId);
            highlightMapSections.push(sectionsQueryResult.features[f].attributes.SectionId);
        }
        
        highlightMap(highlightMapSections, Query, fl);
    });

  // queryTask.executeForIds(query, queryCallback);

  //calls remove filters
   // removeFilters(rockTypeSearchKey, countySearchKey, thinSectionChecked, handSampleChecked);
    } else {
        //if query.where is empty, query for everything! 
        console.log("query is empty.");
        
    }
}

function removeFilters(){
    
  //when the user clicks on a filter indicator... 
    $("#filterFeedback").on("click", "span", function(){
      
        console.log("clear", filters[this.getAttribute('data')]);
        //reset the filters variable. 
        filters[this.getAttribute('data')] = null;
        
        this.remove();
        //reset the value in the input / searchbar
        if (this.getAttribute('data') == 'rockTypeInput'){console.log("clear rock type."); $("#rockTypeSearch").val('');};
        if (this.getAttribute('data') == 'countyInput'){console.log("clear county"); $("#countySearch").val('');};
        if (this.getAttribute('data') == 'stateInput'){console.log("clear state"); $("#stateSearch").val('');};
        if (this.getAttribute('data') == 'handSampleAvailabilityInput'){console.log("clear handsample"); document.getElementById("handSampleCheckbox").checked = false;};
        if (this.getAttribute('data') == 'thinSectionAvailabilityInput'){console.log("clear thin section"); document.getElementById("thinSectionCheckbox").checked = false;};
        
        //resetFilters will call QueryTable. 
        resetFilters();
    });
    
  
}


function filterForSections(array){
    console.log("filter for sections.", array);
    
    filters.mapSectionsInput = array; 
    queryTableForFilters();
}
    
function highlightMap(array, Query, fl){
    console.log("highlight the map sections", array);
    //set the symbol to the variable highlightSymbol (an object defined above)

    //filters out redundant section ids 
    var sortedArray = array.sort(function(a,b){return a-b});
    var filteredSections = []

    for (i = 0; i < sortedArray.length; i++){
      if (sortedArray[i] != sortedArray[i-1]) {
        filteredSections.push(sortedArray[i])
      }
    }

    
   

        var mapHighlight = new Query();
        mapHighlight.where = ('UID IN ('+filteredSections+')');

        fl.selectFeatures(mapHighlight, fl.SELECTION_NEW); 
        //zoom to the extent of the filter results.

        //CHOROPLETH
        var choroplethStructureArray = [];
        for (i = 0; i < sortedArray.length; i++){
          
        } 
        
 
    
}

}); //end map-constructing function beginning with require...