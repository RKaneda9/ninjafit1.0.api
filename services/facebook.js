const http    = require('../helpers/http');
const utils   = require('../helpers/utils');
const {check} = require('../helpers/validator');
const enums   = require('../helpers/enums');
const moment  = require('moment-timezone');

class FacebookService {
    constructor (props) {
        this.storage  = {};
        this.settings = {
            apiUrl:        "https://graph.facebook.com/{id}/",
            pageUrl:       "https://www.facebook.com/{id}/",
            profileImgUrl: "https://graph.facebook.com/picture",
            hashtagUrl:    "https://www.facebook.com/hashtag/",
            fieldsExt:     "id,message,from,to,object_id,picture,link,name,description,icon,caption,type,created_time",
            postLimit:     5,
            expiration:    10
        };

        utils.extend(this.settings, props, true);

        // TODO: validation
    }

    getApiUrl     () { return this.settings.apiUrl .split('{id}').join(this.settings.pageId); }
    getProfileUrl () { return this.settings.pageUrl.split('{id}').join(this.settings.pageId); }
    getEventsUrl  () { return `${this.getApiUrl()}events?access_token=${this.settings.accessToken}`; }
    getFeedUrl    () { return `${this.getApiUrl()}posts?access_token=${this.settings.accessToken}&limit=${this.settings.postLimit}&fields=${this.settings.fieldsExt}`; }
    getHashtagUrl () { return this.settings.hashtagUrl; }

    getProfilePictureUrl () { return `${this.getApiUrl()}picture`; }

    getPictureUrl (id) { return id ? `${this.settings.apiUrl.split('{id}').join(id)}picture` : undefined; }
    getPostUrl    (id) { return `${this.getProfileUrl()}posts/${id}`; }

    getHashtags (str) {
        if (!check(str).isString().notEmpty().isValid) { return []; }

        return utils.map(str.match(/#[a-zA-Z0-9][\w-]*\b/g), piece => piece ? piece.replace('#', '') : false);
    }

    getFeedFromStorage () {
        return this.storage.retrieved && new Date() - this.storage.retrieved < 60000 * this.settings.expiration
             ? this.storage.data
             : null;
    }

    getEvents () {
        return new Promise(async (resolve, reject) => {
            try {
              const url = this.getEventsUrl();
              const tz = 'US/Eastern';
              const response = await http.get(url);
              const events   = JSON.parse(response).data;
              const days     = [];

              for (const event of events) {
                const start = moment.tz(event.start_time, tz);
                const end = moment.tz(event.end_time, tz);
                const dh = end.hours() - start.hours();
                const dm = end.minutes() - start.minutes();
                const dateKey = start.toDate().getDateKey();

                const duration =
                    (dh < 10 ? '0' : '') + dh.toString()
                  + (dm < 10 ? '0' : '') + dm.toString();

                const item = {
                  desc: event.description,
                  duration: duration,
                  title: event.name,
                  id: event.id,
                  link: `https://www.facebook.com/events/${event.id}`,
                  subtype: enums.event.subtype.unknown,
                  type: enums.event.type.event,
                  start: start.format('HHmm'),
                  end: end.format('HHmm')
                };

                let day = days.find(d => d.date == dateKey);

                if (!day) {
                  day = {
                    date: dateKey,
                    items: []
                  };

                  days.push(day);
                }

                day.items.push(item);
              }

              for (const day of days) {
                day.items.sort((a, b) =>
                  a.start === b.start
                  ? (b.end - a.end)
                  : (a.start - b.start)
                );
              }

              days.sort((a, b) => a.date - b.date);

              return resolve(days);
            } catch (e) { reject(e); }
        });
    }

    getFeed () {
        return new Promise(async (resolve, reject) => {

            try {
                let res = this.getFeedFromStorage();

                if (res) { return resolve(res); }

                let response = await http.get(this.getFeedUrl());
                let json     = JSON.parse(response);

                res = {
                    page: {
                        id:    this.settings.pageId,
                        image: this.getProfilePictureUrl(),
                        link:  this.getProfileUrl()
                    }
                };

                res.posts = utils.map(json.data, data => {

                    if (!check(data).isObject().notEmpty().isValid) { return; }

                    if (!res.page.name && data.from) {
                        res.page.name = data.from.name;
                    }

                    let postId = data.id.split('_')[1];
                    let post   = {

                        text:   data.message,
                        type:   data.type,
                        action: this.getPostUrl(postId),

                        createdKey:       new Date(data.created_time).toUtc().getDateTimeKey(),
                        hashTagPrefixUrl: this.getHashtagUrl(),
                        hashTags:         this.getHashtags  (data.message)
                    };

                    switch (data.type) {
                        case 'video':
                        case 'event':
                        case 'link':
                            post.link = {
                                type:        data.type,
                                image:       data.picture || this.getPictureUrl(data.object_id),
                                href:        data.link,
                                description: data.description,
                                title:       data.name,
                                caption:     data.caption
                            };
                            break;

                        case 'photo':
                            post.image = {
                                url:  data.picture || this.getPictureUrl(data.object_id),
                                href: data.link
                            };
                            break;

                        default: break;
                    }
                    return post;
                });

                this.save(res);
                resolve(res);
            }
            catch (e) { reject(e); }
        });
    }

    save (data) {
        this.storage.data      = data;
        this.storage.retrieved = new Date();
    }
}

const service = new FacebookService((require('../settings.json') || {}).facebook);
Object.freeze(service);

module.exports = {
    getEvents: service.getEvents.bind(service),
    getFeed: service.getFeed.bind(service)
};
