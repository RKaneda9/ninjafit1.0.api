let cheerio = require('cheerio'),
    Wod     = require('../../models/workouts/wod');

module.exports = (html, datekey) => {
    let $        = cheerio.load(html),
        wod      = new Wod({ datekey: datekey }),
        workout  = null,
        parent   = $('.workout'),
        date, el, curClass, lastClass, text, ensure, parse, i;

    els  = parent.children('div');
    text = parent.prev('h2').text();

    if (text.trim()) { wod.datekey = text; }

    ensure = force => {
        if (!workout || force) {
            workout = { contents: [] };
            wod.workouts.push(workout);
        }
    };

    for (i = 0; i < els.length; i++) {
        el = els.eq(i);
        curClass = el.attr('class');

        switch (curClass) {

            case 'sectionTitle':

                // title is in the h2 element
                el = el.find('h2');

                // if the h2 element does not exist
                if (!el || !el.length) { continue; }

                // retrieve the text of that element.
                text = el.text().trim();

                // if there is no text, don't set the title.
                if (!text) { continue; }

                // ensure the current workout object exists, or create a new
                // one if it doesn't or the last element processed was an element
                // other than a title.
                ensure(lastClass != 'sectionTitle');

                // set the title.
                workout.title = text;
                break;

            case 'skillName':

                // ensure the text is filled.
                text = el.text().trim();

                // if there is no text, skip this element.
                if (!text) { continue; }

                // ensure the workout object exists, or create a new one 
                // if it doesn't.
                ensure();

                // set the subtitle.
                workout.subtitle = text;
                break;

            // these two both seem to be description objects.
            case 'skillDesc':
            case 'skillResult':

                // retrieve the text
                text = el.html().trim();

                // ensure the text is filled.
                if (!text) { continue; }

                // ensure the workout object exists, or create a new one
                // if it doesn't.
                ensure();

                // append the contents. remove any empty entries.
                workout.contents = workout.contents.concat(
                    text.split('<br>')
                        .map   (text => text.trim())
                        .filter(text => text.length)
                );
                break;
        }
    }
    
    return wod;
};