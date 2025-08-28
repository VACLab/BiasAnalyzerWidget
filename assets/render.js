// import * as d3 from "d3";
import * as d3 from 'https://esm.sh/d3@7';
import * as controls from './controls.js';
import * as barcharts from './barcharts.js';
import * as tables from './tables.js';

export function drawVis(concepts1, race_stats1, gender_dist1, age_dist1,
                        concepts2, race_stats2, gender_dist2, age_dist2){

    // DISPATCHERS

    // for handling searching the concepts table
    let conceptsTableDispatcher = d3.dispatch('filter','sort');

    // PAGE LAYOUT

    // overall container
    // let vis_container = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    let vis_container = document.createElement('div');
    vis_container.setAttribute('class', 'vis-container');

    // for testing
    // vis_container.appendChild(document.createElement('p')).innerHTML = 'Hello World!';
    // vis_container.appendChild(document.createElement('p')).innerHTML = JSON.stringify(race_stats);

    // demographics container row
    let demographics_row = vis_container.appendChild(document.createElement('div'));
    demographics_row.setAttribute('class', 'row-container');
    // gender container
    let div_gender = demographics_row.appendChild(document.createElement('div'));
    div_gender.setAttribute('class', 'col-container');
    // race container
    let div_race = demographics_row.appendChild(document.createElement('div'));
    div_race.setAttribute('class', 'col-container');
    // age container
    let div_age = demographics_row.appendChild(document.createElement('div'));
    div_age.setAttribute('class', 'col-container');

    // concepts container row
    let concepts_row = vis_container.appendChild(document.createElement('div'));
    concepts_row.setAttribute('class', 'row-container concepts-row');
    // concepts container
    let div_concepts_container = concepts_row.appendChild(document.createElement('div'));
    div_concepts_container.setAttribute('class', 'col-container');

    // INSERT THE VISUALIZATIONS

    // draw the gender barchart
    div_gender.appendChild(
        barcharts.VerticalBarChart({data: gender_dist1},
            {series2: {data: gender_dist2}, dimensions: {xlabel: 'Gender'}}).node());

    // draw the race barchart
    div_race.appendChild(
        barcharts.VerticalBarChart({data: race_stats1},
                            {series2: {data: race_stats2}, dimensions: {xlabel: 'Race'}}).node());

    // draw the age barchart
    div_age.appendChild(
        barcharts.VerticalBarChart({data: age_dist1},
                            {series2: {data: age_dist2}, dimensions: {xlabel: 'Age'}}).node());

    // draw the concepts table search box
    div_concepts_container.appendChild(
        controls.SearchBox(conceptsTableDispatcher).node());

    // if there is only one set of concepts, draw a single cohort concepts table
    if(Object.keys(concepts2).length === 0) {
        // draw the concepts table
        div_concepts_container.appendChild(
            tables.ConceptsTable(concepts1, conceptsTableDispatcher).node());
    }
    else{
        div_concepts_container.appendChild(
            tables.ConceptsTable(concepts1, conceptsTableDispatcher,{data2: concepts2}).node());
    }

    return vis_container;
}
