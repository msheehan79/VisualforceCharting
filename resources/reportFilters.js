// Define some various global vars here
// Holds the currently implemented filters on the given page
var filtersArray = [];
// List of fields we want to offer as filters
var filterFields = ['ACCOUNT_OWNER', 'ACCOUNT_NAME', 'CLOSE_DATE', 'ACCOUNT_TYPE', 'FAMILY', 'Product2.Series__c', 'Product2.Model_Number__c', 'RECORDTYPE'];

// Builds the picklist filters based on available filters provided by the reportData JSON and also the filterFields array
function createFilters(reportData) {
    // Create associated filters
    var html = '';
    var buttonsHtml = '';
    $.each(filterFields, function(index, value) {
        $.each(reportData.reportTypeMetadata.categories, function(i, category) {
	        var filter = category.columns[value];
            var operatorMap = reportData.reportTypeMetadata.dataTypeFilterOperatorMap;
            if (filter != null) {
                // Create the HTML button to show/hide each filter
                buttonsHtml += createFilterButton(filter, value);
                // Add container div then choose appropriate HTML based on filter type
                html += '<div class="filter" id="filterContainer_' + value + '" style="display: none">';
                switch(filter.dataType) {
                    case "picklist": 
                    case "reference":
                    case "boolean":
						html += createPicklistFilter(filter, value, operatorMap);
                        break;
                    case "date":
						html += createDateFilter(filter, value, operatorMap);
                        break;
                    case "string":
                    case "int":
                    case "currency":
                    case "double":
                    case "percent":
						html += createTextFilter(filter, value, operatorMap);
                        break;
        		}
                html += '</div>';
            }
    	});
	});
    
    // Add the filters to the page
    $('#filtersList').html(buttonsHtml);
    $('#filters').html(html);                
    
	// Add JS functionality to the show/hide buttons and date filters
    addShowHideFilterButtons();
    addDateFilterFormatting();
}

/**
 * Adds jQuery show/hide functionality to the filter buttons
 **/
function addShowHideFilterButtons() {
 	$('.filterButton').each(function(i){
        $(this).button().click(function() {
            $('div[id="filterContainer_' + this.id + '"]').toggle( "drop", { direction: "down" }, "slow" );
        });
    });    	    
}

/**
 * Adds functionality to Date filters to either choose a date literal 
 * or the Custom date field which will add 2 x datepicker inputs
 **/
function addDateFilterFormatting() {
    $.each($('div.dateLiterals'), function(k, v) { 
		$(this).children('.value').change(function() {
            var fieldName = this.id.substring(14);
            if(this.value == 'CUSTOM') {
              $('#dateCustom_' + fieldName).show( "drop", { direction: "down" }, "slow" );
            } else {
              $('#dateCustom_' + fieldName).hide( "drop", { direction: "down" }, "slow" );
            }
		});
    });
    
    $.each($('div.dateCustom input'), function(k, v) { 
		$(this).datepicker({
			dateFormat: "yy-mm-dd"
		});
    });     
}

/**
 * Create an HTML button for each filter
 **/
function createFilterButton(filter, value) {
    var html = '<button id="' + value + '" class="filterButton">' + filter.label + '</button>';;
    return html;
}


/**
 * Create an HTML select with the appropriate logic operators based on provided dataType
 * dataType string
 * operatorMap object
 **/
function createOperators(dataType, operatorMap) {
	var html = '';
    html += '<select class="operator">';
	$.each(operatorMap[dataType], function(index, value) {
    	html += '	<option value="' + value.name + '">' + value.label + '</option>';
    });    
    html += '</select>';
	return html;    
}

/**
 * Create HTML select for Boolean and Picklist filters
 **/
function createPicklistFilter(filter, value, operatorMap) {
    var html = '';
    html += '<label for="filterOptions_' + value + '">' + filter.label + ': </label>';
    html += createOperators(filter.dataType, operatorMap);
    html += '<select multiple="multiple" size="6" id="filterOptions_' + value + '" class="value">';
	html += '	<option value="">--Select a value--</option>';
	$.each(filter.filterValues, function(index, value) {
    	html += '	<option value="' + value.name + '">' + value.label + '</option>';
    });
    html += '</select>';    
    return html;
}

/**
 * Create HTML text input for Text and similar filters
 **/
function createTextFilter(filter, value, operatorMap) {
	var html = '';
    html += '<label for="filterOptions_' + value + '">' + filter.label + ': </label>';
    html += createOperators(filter.dataType, operatorMap);
    html += '<input id="filterOptions_' + value + '" type="text" class="value" />';    
    return html;
}

/**
 * Create HTML select and Date Input for Date filters
 **/
function createDateFilter(filter, value, operatorMap) {
    var html = '';
    html += '<div id="dateLiterals_' + value + '" class="dateLiterals">';
    // Date literals
    html += '  <label for="filterOptions_' + value + '">' + filter.label + ': </label>';
    html += createOperators(filter.dataType, operatorMap);                      
	html += '  <select id="filterOptions_' + value + '" class="value">';
	html += '      <option value="">--Select a value--</option>';
	html += '      <option value="THIS_YEAR">Current CY</option>';
	html += '      <option value="LAST_YEAR">Previous CY</option>';
	html += '      <option value="THIS_FISCAL_YEAR">Current FY</option>';
	html += '      <option value="LAST_FISCAL_YEAR">Previous FY</option>';
    html += '      <option value="CUSTOM">Custom</option>';
	html += '  </select>';
    html += '</div>';
    
    // Custom date ranges
    html += '<div id="dateCustom_' + value + '" class="dateCustom" style="display: none">';
    html += '	<div class="filter">';
    html += '		<label for="filterOption1_' + value + '">From: </label>';
	html += '		<select class="operator" style="display: none">';
    html += '    		<option value="greaterOrEqual" selected="selected">From</option>';
    html += '		</select>';
    html += '		<input id="filterOption1_' + value + '" type="text" class="value" />';                    
    html += '	</div>';
    
    html += '	<div class="filter">';
    html += '		<label for="filterOption2_' + value + '">To: </label>';
	  html += '		<select class="operator" style="display: none">';
    html += '		    <option value="lessOrEqual" selected="selected">To</option>';
    html += '		</select>';
    html += '		<input id="filterOption2_' + value + '" type="text" class="value" />';                    
    html += '	</div>';       
    html += '</div>';
    
    return html;
}

// Builds the picklist select to choose the output field(s) based on available aggregate fields provided
function createValueSelect(aggregateInfo, aggregates) {
    // Create select to choose output field(s)
    var aggregateHtml = '<h3>Select Data</h3>';
    aggregateHtml += '<select id="reportDataField">';
    $.each(aggregates, function(index, value) {
        aggregateHtml += '<option value="' + index + '">' + aggregateInfo[value].label + '</option>';
    });
    aggregateHtml += '</select>';
    // Add the select to the page
    $('#values').html(aggregateHtml);
}
