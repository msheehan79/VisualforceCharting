// Define some various global vars here
// Holds the totals row on the table
var footer=[];
// Used as a lookup array of custom fields and IDs for URL building
var fieldIds;

// Basic ajax call to obtain Report metadata from the API
function getReportInfo(sessionId, reportId) {
	// Fetch the JSON data representing the report
	var reportData = JSON.parse($.ajax({
    	type:'GET',
        //url: '/services/data/v29.0/analytics/reports/{!$CurrentPage.parameters.id}/describe',
        url: '/services/data/v29.0/analytics/reports/' + reportId + '/describe',
		//beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', 'Bearer {!$Api.Session_ID}');},
        beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', 'Bearer ' + sessionId);},
        dataType:'json',
        contentType: 'application/json; charset=utf-8',
        async: false
    }).responseText);
    console.log(reportData);
    return reportData;
}

function getCustomFieldIds(sessionId) {
	// Fetch the JSON data representing the report
	var request = $.ajax({
        type:'GET',
        cache: true,
        url: '/services/data/v32.0/tooling/query/?q=SELECT+id,fullName+FROM+CustomField',
		beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', 'Bearer ' + sessionId);},
        dataType:'json',
        contentType: 'application/json; charset=utf-8',
        async: true
	});
    request.done(function(){
        $('#runreport').css('display', '');
        fieldIds = request.responseJSON;
    });
}

// User function not currently in use
function getFieldData(field) {
	$('#output').html('<div class="loading">Loading...</div>');
    //var weeks = new Array();
    Visualforce.remoting.Manager.invokeAction(
       	'{!$RemoteAction.VFChartingHelper.getFieldMetaData}',
        field,
        function(result,event) {
        	result = result.replace(/&(lt|gt|quot);/g, '"');
            var parsedResult = jQuery.parseJSON(result);  
            console.log(parsedResult);
            //weeks = result;    
    });
}

// Helper function to subtotal a column in the dataTable
function getSum(data, column) {
	var total = 0;
	for (i = 0; i < data.getNumberOfRows(); i++)
		total = total + data.getValue(i, column);
	return total;
}

// Looks up a key in a collection of Objects
function getObjects(obj, key, val) {
	var objects = [];
	for (var i in obj) {
   		if (!obj.hasOwnProperty(i)) continue;
   			if (typeof obj[i] == 'object') {
       			objects = objects.concat(getObjects(obj[i], key, val));
   			} else if (i == key && obj[key] == val) {
       			objects.push(obj);
  		}
    }
	return objects;
}

// Applies currency formatting as needed
function formatCurrency(jsonData, data) {
	var formatter = new google.visualization.NumberFormat({
		prefix: '$',
        negativeColor: 'red', 
        negativeParens: true
	});                                   
    $.each(jsonData.reportMetadata.aggregates, function(index, value) {
   		if (jsonData.reportExtendedMetadata.aggregateColumnInfo[value].dataType === "currency") {
			formatter.format(data, index + 1);
		}
    });
	return data;            
}

// Adds the totals row to the bottom of the table and keeps it from being sorted
function addFooter() {
    try {
		if (document.getElementById('google-visualization-table-summaryFooter')) return;
		var tables = $('#table table'); 
        // Parent container element of table. To find exact table
		for (i = 0; i < tables.length; i++) {
			if (tables[i].className == 'google-visualization-table-table') {
				var r = tables[i].insertRow(tables[i].rows.length);
				r.id = 'google-visualization-table-summaryFooter' // This ID should be same as in the IF condition of the first line of this //function
				var c;
				r.className = 'google-visualization-table-tr-head';
				for (j = 0; j < footer.length; j++) {
					c = r.insertCell(j);
					c.className = 'google-visualization-table-th gradient';
					c.style.textAlign = (j == 0) ? 'start' : 'right';
					c.innerHTML = footer[j][0];
					c.colSpan = footer[j][1];
				}                      
			}
		}
    } catch (ex) {
		// Exception Logging
	}
}

