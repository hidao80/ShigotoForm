/**
 * Copyright (c) 2023 hidao80
 * Released under the MIT license
 * https://opensource.org/licenses/mit-license.php
*/
/**
 * Returns a new element with the given tag name.
 * @param {string} tagName
 * @returns {T} New element
 */
export function $$new<T extends Element>(tagName: string): T {
    return (document.createElement(tagName) as unknown) as T
}

/**
 * Suppress debug printing.
 */
export function $$disableConsole() {
    ["log", "debug", "warn", "info", "error", "table"].forEach(v => {
        (window.console as unknown as Record<string, () => void>)[v] = () => { }
    })
}

/**
 * Returns an element with the given selector name.
 * @param {string} selector
 * @returns {T|null} Element with the given selector name
 */
export function $$one<T extends Element>(selector: string): T | null {
    return document.querySelector(selector)
}

/**
 * Returns elements with the given selector name.
 * @param {string} selector
 * @returns {T|null} Elements with the given selector name
 */
export function $$all<T extends Element>(selector: string): T[] | null {
    return Array.from(document.querySelectorAll(selector))
}

/**
 * Returns a calendar that goes back the specified number of days
 * from the specified last day or today as an array of strings.
 * @param {?string} lastDate Last day of this calendar. e.g.) "YYYY/MM/DD". If null, today is used. Default is null.
 * @param {number} days Number of days to go back. Default is 28.
 * @returns {string[]} Array of strings representing the calendar for one month
 */
export function getDaysArray(lastDate: string | null = null, days: number = 28): string[] {
    const date = lastDate ? new Date(lastDate) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = date.getDate();
    const daysArray = [];
    for (let offset = 0; offset < days; offset++) {
        const day = new Date(year, month, today - offset);
        const YYYY_MM_DD = year + "/" + ("0" + (day.getMonth() + 1)).slice(-2) + "/" + ("0" + day.getDate()).slice(-2);
        daysArray.push(YYYY_MM_DD);
    }

    // Reverse the array to display the calendar in ascending order.
    return daysArray.reverse();
}