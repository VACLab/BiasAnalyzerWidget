// import * as d3 from "d3";
import * as d3 from 'https://esm.sh/d3@7';
/*
* draws a search box
* Parameters:
*   containerId: type: string - prepended id of container where the control is to be rendered.
*   dispatch: d3.dispatch instance - user input event handler
*   label: type: string - label for the control
*   width: type: string - the width of the input box in pixels
*   data: type: list of objects - each object should have the keys display (string),
*                                        and data (anything needed to handle the selection
*   handleSearch: type: function - callback
* Return:
*   div: DOM div element containing input box
*/
export function SearchBox(dispatch, label='Search', width=300) {
    let div = d3.create("xhtml:div")
        .attr("xmlns", "http://www.w3.org/1999/xhtml")
        .style("padding", "10px");

    let input = div.append('input')
        .attr('type', 'text')
        .attr('placeholder', label);

    input.on('input', function (event) {
        dispatch.call('filter', this, event.target.value);  // dispatch filter event

    // const options = [
    //     { value: "ratio", text: "Actual Values" },
    //     { value: "percent", text: "Percentages" }
    // ];
    //
    // // create <select> element
    // const select = $("<select></select>")
    //     .on("change", function () {
    //         dispatch.call('filter', this, event.target.value);  // dispatch filter event
    //         $("#selected-value").text($(this).val());
    //     });
    //
    // // Append options
    // options.forEach(opt => {
    //     $select.append($("<option></option>")
    //         .attr("value", opt.value)
    //         .text(opt.text));
    // });
    //
    // // Add to page
    // div.append(select);
    //
    //

    });

    return div;
}