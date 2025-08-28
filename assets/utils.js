// import * as d3 from "d3";
import * as d3 from 'https://esm.sh/d3@7';

// clears an element
export function clearElement(element) {
    element.selectAll('*').remove();
}

/*
* converts timestamp to formatted date 'YYYY-MM-DD'
* Parameters:
*   timestamp: string - a timestamp
* Return:
*   string: ISO date
*/
export function getIsoDateString(timestamp) {
    let aDate = new Date(timestamp);
    return aDate.toISOString().split('T')[0];
}

/* converts keys to readable words by:
*   1. replacing the underscore with a space, and
*   2. capitalizing the first letter of each word
* Parameters:
*   keys: list of strings - keys
* Return:
*   list of strings with spaces between words and capitalized first letters of each word
*/
export function makeKeysWords (keys) {
    return keys.map(key => {
        return key.split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    });
}