//global var for all filters

var filters = {
    //all initial values in this filters object should be falsy. 
    //an empty string is falsy. 
    //an empty array is not falsy, so the map sections input must be set to null when cleared. 
    
    "mapSectionsInput": null,
    "rockTypeInput": "",
    "countyInput": "",
    "handSampleAvailabilityInput": null,
    "thinSectionAvailabilityInput": null,
    "stateInput": null,
    "notesInput": null,
    "notebookInput": null,
    "notebookPageInput": null,
    "WGNHSInput": null
};

//global var for 
var globalResultsArray = [];

var loadingPageOn = false;

$(window).on("load", function(){

    //initialize listeners for inputs and for filter removal through a click on a filter indicator
    initFiltersListeners();
    //initialize table
    initializeResultsTable();
    
    //call whenever the filters object has changed (EXCEPT map filter). 
    resetFilters();   

});

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

function initFiltersListeners(){
    //called once on load
    //set an event listener for a filter input 
    //delay helps with performance 
    $("#filters").on("input", "input", function(){
        delay(function(){
     //       console.log('time elapsed');
            resetFilters();
        }, 1000);

    }); //close #filters.on input function

	//set a listener for when the user clicks on a filter indicator... 
    $("#filterFeedback").on("click", "span", function(){
      
        console.log("clear", filters[this.getAttribute('data')]);
        //reset the filters variable. 
        filters[this.getAttribute('data')] = null;
        
        //remove the indicator. 
        this.remove();
        
        if (this.getAttribute('data') == 'mapSectionsInput'){
            console.log('clear map selection via filter feedback.'); 
            leafletMap.clearMapSelection(); //this will clear map indicators and call the queryTableForFilters function. 
            
        } else {
            //reset the value in the input / searchbar
            if (this.getAttribute('data') == 'rockTypeInput'){$("#rockTypeSearch").val('');};
            if (this.getAttribute('data') == 'countyInput'){$("#countySearch").val('');};
            if (this.getAttribute('data') == 'stateInput'){$("#stateSearch").val('');};
            if (this.getAttribute('data') == 'notesInput'){$("#notesSearch").val('');};
            if (this.getAttribute('data') == 'notebookInput'){$("#notebookSearch").val('');};
            if (this.getAttribute('data') == 'notebookPageInput'){$("#notebookPageSearch").val('');};
            if (this.getAttribute('data') == 'handSampleAvailabilityInput'){document.getElementById("handSampleCheckbox").checked = false;};
            if (this.getAttribute('data') == 'thinSectionAvailabilityInput'){$("#thinSectionNumberSearch").val('');};
            if (this.getAttribute('data') == 'WGNHSInput'){$("#WGNHSSearch").val('');};

            //resetFilters will call QueryTable. 
            resetFilters();
        }
    });

}
    
    
function resetFilters() {

    //reset for every filter that's based on an input in the #filters div (everything except the map filter). 
        filters.rockTypeInput = $("#rockTypeSearch").val();
        filters.countyInput = $("#countySearch").val(); 
        filters.stateInput = $("#stateSearch").val();
        filters.notesInput = $("#notesSearch").val();
        filters.notebookInput = $("#notebookSearch").val();
        filters.notebookPageInput = $("#notebookPageSearch").val();
        filters.thinSectionAvailabilityInput =  $("#thinSectionNumberSearch").val();
        filters.WGNHSInput =  $("#WGNHSSearch").val();
        filters.handSampleAvailabilityInput = document.getElementById("handSampleCheckbox").checked;
        
       // console.log("filters set:", filters);
        queryTableForFilters();
}
    
    
function queryTableForFilters(){
    
  //  if (loadingPageOn == false){
        $("#map").append($("<div id='loading'></div>")); //will be removed in leafletMap.js highlight function after setStyle. 
    
  //  };
  //  loadingPageOn = true;
    
    //reset the global variable of results. 
    resultsManager.clearAll();
   
    var whereString = buildSqlAndAddIndicators(); //call the function to build a SQL where clause. It will return the where clause as a string. 
    
    //set up the query, which will return only the ids of samples matching the where clause. 
    var sampleIdsQuery = L.esri.query({url:samplesTableURL}); //url to samples table
   // sampleIdsQuery.fields(["*"]);
    //sampleIdsQuery.returnGeometry(false);
    sampleIdsQuery.where(whereString);
    
    console.log("where string is:", whereString);
    
    //set the sections query where clause to the same where as the normal query.
    // sectionsQuery.where = sampleIdsQuery.where;
    
   
 
   //only try to run query if there is something to search on.
    if (sampleIdsQuery.where.length > 0){
        
        if (whereString === "1=1"){ console.log("Narrow the results by applying filters above.")};

        sampleIdsQuery.ids(function(error, result){
           //console.log("query for ids error", error);
            console.log('result for ids', result);
            //console.log("result for ids length", result.length);
            
            //result is either null or non-null. 
            if(result){
               
                //set results counter statement: 
                document.getElementById("resultCount").innerHTML = result.length;
            
            
                sliceResult(result);

                
            } else {
                //null result. no matches. 
                console.log("result is null.", result);      
                
                //set results counter statement: 
                document.getElementById("resultCount").innerHTML = 0;
                
                listResults([]);
                highlightAll();
                
            }
 
        }); //end sampleIdsQuery.ids

    } else {
        //this shouldn't happen while we're using ["1=1"] in the SQL array. 
        console.warn("query is empty.");
        
    }
} //end queryTableForFilters

function buildSqlAndAddIndicators() {
    
    //start with a search for everything. 
    var newsqlArray = ["1=1"];
    //and a blank string to contain the where clause.
    var whereString = "";
    
    //delete all filter indicators. They will be replaced. 
    $("#filterFeedback").html('');
    
    //for each truthy value in filters, build the SQL text and append a filter indicator span  
    if (filters.rockTypeInput) {
        newsqlArray.push("Upper(RockType) LIKE Upper('%"+filters.rockTypeInput+"%')");
        //adds feedback indicator
    	$("#filterFeedback").append($("<span id='rockSearchOn' class='feedbackBar' data='rockTypeInput'>description:&nbsp" + filters.rockTypeInput + "<img src='images/close.png'/></span>"));
        }; 
    if (filters.countyInput) {
        newsqlArray.push("Upper(County) LIKE Upper('%"+filters.countyInput+"%')");
    	$("#filterFeedback").append($("<span id='countySearchOn' class='feedbackBar' data = 'countyInput'>county:&nbsp" + filters.countyInput +"<img src='images/close.png' /></span>"));
        }; 
    if (filters.notesInput) {
        newsqlArray.push("Upper(Notes) LIKE Upper('%"+filters.notesInput+"%')");
        $("#filterFeedback").append($("<span id='notesSearchOn' class='feedbackBar' data = 'notesInput'>notes:&nbsp" + filters.notesInput +"<img src='images/close.png' /></span>"));
        }; 
    if (filters.notebookInput) {
        newsqlArray.push("NotebookNum LIKE '"+filters.notebookInput+"'");
    	$("#filterFeedback").append($("<span id='notebookSearchOn' class='feedbackBar' data = 'notebookInput'>notebook:&nbsp" + filters.notebookInput +"<img src='images/close.png' /></span>"));
        };
    if (filters.notebookPageInput) {
        newsqlArray.push("NotebookPage LIKE '"+filters.notebookPageInput+"'");
    	$("#filterFeedback").append($("<span id='notebookPageSearchOn' class='feedbackBar' data = 'notebookPageInput'>notebook page:&nbsp" + filters.notebookPageInput +"<img src='images/close.png' /></span>"));
        };
    if (filters.handSampleAvailabilityInput) {
        newsqlArray.push("HandSampleCount > 0");
    	$("#filterFeedback").append($("<span id='handSampleOn' class='feedbackBar' data='handSampleAvailabilityInput'>Hand&nbspsample:&nbsp" + filters.handSampleAvailabilityInput + "<img src='images/close.png' /></span>"));
        }; 
    if (filters.thinSectionAvailabilityInput) {
        newsqlArray.push("ThinsectionCount >= "+filters.thinSectionAvailabilityInput);
        $("#filterFeedback").append($("<span id='thinSectionOn' class='feedbackBar' data='thinSectionAvailabilityInput'>Thin&nbspsections:&nbsp" + filters.thinSectionAvailabilityInput + "+ <img src='images/close.png'/></span>"));
        }; 
    if (filters.mapSectionsInput) {
        newsqlArray.push("SectionId IN ("+filters.mapSectionsInput+")"); 
        $("#filterFeedback").append($("<span id='mapOn' class='feedbackBar' data='mapSectionsInput'>intersects&nbspmap&nbsppolygon <img src='images/close.png' /></span>"));
        }; 
    if (filters.stateInput){
        newsqlArray.push("Upper(State) LIKE Upper('%"+filters.stateInput+"%')");
        $("#filterFeedback").append($("<span id='stateOn' class='feedbackBar' data='stateInput'>state:&nbsp" + filters.stateInput + "<img src='images/close.png'/></span>"));
        };
    if (filters.WGNHSInput){
        //cast the integer field WgnhsId as a character string to allow the user to use % and _ as wildcards for searching for partial values. 
        newsqlArray.push("cast(WgnhsId as char(1))  LIKE '"+filters.WGNHSInput+"'");
        $("#filterFeedback").append($("<span id='WGNHSOn' class='feedbackBar' data='WGNHSInput'>WGNHS ID:&nbsp" + filters.WGNHSInput + "<img src='images/close.png'/></span>"));
        };
    
   
    //iterates through newsqlArray
   
    for (i = 0; i < newsqlArray.length; i++) {
   		//testing for a value before and after, if so, adds AND in between them
         //THIS If STATEMENT IS UNNECESSARY if we always search for everything (start with ["1=1"]) when no filters are applied. 
   		if (whereString != "" && newsqlArray[i] != "") {whereString +=  " AND " };
        
   		whereString += newsqlArray[i]; //adds the sql query to the string 
        
   	};
    

    return whereString;
}


function sliceResult(allResultOBJECTIDs){
       
    var sliceSize = 1000; //max is 1000, because that is the limit for Esri map service results. 
    
    //calculate how many pages.
    var numberOfSlices = Math.ceil(allResultOBJECTIDs.length/sliceSize);
    console.log(allResultOBJECTIDs.length, "is broken into ", numberOfSlices, "slices."); 
    
    //build a list of page limit indices. 
    var pageBreaks = [0];
    
    //the length of the results is the top page break
    pageBreaks.push(allResultOBJECTIDs.length);
    
    //all intermediate page breaks are inserted here
    for (i = 1; i < numberOfSlices; i++){
        pageBreaks.push(i*sliceSize);
    }
    
    //order the pages breaks array from smallest to largest. 
    pageBreaks.sort(function(a, b){return a-b});
    
    var sliceQueriesQueue = []
    
    //console.log("pageBreaks", pageBreaks);
    //for each page of objectIDs, call a query for that set of results. 
    for (j=1 ; j < pageBreaks.length; j++){
        
        var rangeMin = pageBreaks[j-1]; 
        var rangeMax = pageBreaks[j];
       
       // console.log("page "+j+" would be values at indices", pageBreaks[j-1], "up to (not including) ", pageBreaks[j]);
        
        var oneSliceOBJECTIDs= allResultOBJECTIDs.slice(rangeMin, rangeMax); 
        //console.log("one slice result OBJECTIDS:", oneSliceOBJECTIDs); 
        
       //add the slice query into a queue  
       sliceQueriesQueue.push(slicePromise(oneSliceOBJECTIDs)); 

    }
    
    var allQueries = Promise.all(sliceQueriesQueue).then(function(data){
       // console.log("allqueries data:", data); 
        for (i in data){
            resultsManager.add(data[i]); //concatenate each slice's results to the global var. 
        }
        
        console.log("global results: ", globalResultsArray); 
        
        var firstThousand = globalResultsArray.slice(0,1000);   
        listResults(firstThousand);
        
        highlightAll();
    });


   
} //end sliceResult function 

function slicePromise(resultSliceOBJECTIDs){
    return new Promise(function(resolve, reject){
        //SQL for the query
        var sliceWhereClause = "OBJECTID IN ("+resultSliceOBJECTIDs+")";

        //set up a query for one slice of data.
        var sliceDataQuery = L.esri.query({url:samplesTableURL}); //url to samples table
        sliceDataQuery.fields(["*"]);
//        sliceDataQuery.returnGeometry(false);
        sliceDataQuery.where(sliceWhereClause);
        
        sliceDataQuery.run(function(error, featureCollection, sliceResponse){
            if (error){
                reject("sliceDataQuery error.");
            } else {
                resolve (sliceResponse.features);
            }
        }); 
        
    }); 
}

function queryForSliceData(resultSliceOBJECTIDs, drawList){
    //resultsIds is an array of the objectIDs of one slice of results. Max length 1000. 
    //drawList is a boolean indicating whether to add the list (whether it's the last query).  
    
    //SQL for the query
    var sliceWhereClause = "OBJECTID IN ("+resultSliceOBJECTIDs+")";
    
    //set up a query for one slice of data.
    var sliceDataQuery = L.esri.query({url:samplesTableURL}); //url to samples table
    sliceDataQuery.fields(["*"]);
    sliceDataQuery.returnGeometry(false);
    sliceDataQuery.where(sliceWhereClause);
    
    
    //this can only ever return 1000 results at a time.  
    sliceDataQuery.run(function(error, result, response){
      // console.log('result of slice query', result);
     
        resultsManager.add(response.features);
        
        //console.log("global results", JSON.stringify(globalResultsArray));
        
        //response.features is an array of objects.     
        //listResults(globalResultsArray);
         if (drawList === true){ 
            console.log("please draw the list and highlight map.");
            //console.log("global results", globalResultsArray);
             
            
             var firstThousand = globalResultsArray.slice(0,1000); 
             //console.log("first thousand", firstThousand);
           
            listResults(firstThousand);
            highlightAll();  
             
            
        }
       
    });

    
} //end function queryForSliceData 

//not called anywhere yet. 
//var displayTablePage = function (pageNumber){
//    
//    var pageIndex = pageNumber-1;
//    console.log("page index", pageIndex); 
//    
//    
//}



function highlightAll(){
 
            console.log('highlight now.');
        
            //iterate through and output array of sections for the highlight function. 
            var highlightMapSections = []; 
            //iterate through  
            for (f in globalResultsArray){

                highlightMapSections.push(globalResultsArray[f].attributes.SectionId);
            }

            loadingPageOn = false;

            //accepts an array of section IDs. 
            leafletMap.highlight(highlightMapSections);

}
