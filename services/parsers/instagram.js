module.exports = html => {
    let searchStart = "window._sharedData =";
    let searchEnd   = ";</script>";

    let startIndex = html.indexOf(searchStart);

    if (startIndex < 0) { throw `Could no find data on page. "${searchStart}" was missing.`; }

    html = html.substr(startIndex + searchStart.length);

    let endIndex = html.indexOf(searchEnd);

    if (endIndex < 0) { throw `Could no find data on page. "${searchEnd}" was missing.`; }

    html = html.substr(0, endIndex);

    return JSON.parse(html);
};