let http    = require('../helpers/http'),
    utils   = require('../helpers/utils'),
    {check} = require('../helpers/validator');

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
    getProfileUrl () { return this.settings.pageUrl.split('{id}').join(this.settings.pageId);; }
    getFeedUrl    () { return `${this.getApiUrl()}posts?access_token=${this.settings.accessToken}&limit=${this.settings.postLimit}&fields=${this.settings.fieldsExt}`; }
    getHashtagUrl () { return this.settings.hashtagUrl; }

    getProfilePictureUrl () { return `${this.getApiUrl()}picture`; }

    getPictureUrl (id) { return id ? `${this.settings.apiUrl.split('{id}').join(id)}picture` : undefined; }
    getPostUrl    (id) { return `${this.settings.pageUrl}posts/${id}`; }

    getHashtags (str) {
        if (!check(str).isString().notEmpty().isValid) { return []; }

        return utils.map(str.match(/#[a-zA-Z0-9][\w-]*\b/g), piece => piece ? piece.replace('#', '') : false);
    }

    getFeedFromStorage () {
        return this.storage.retrieved && new Date() - this.storage.retrieved < 60000 * this.settings.expiration
             ? this.storage.data
             : null;
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
                                image:       this.getPictureUrl(data.object_id) || data.picture,
                                href:        data.link,
                                description: data.description,
                                title:       data.name,
                                caption:     data.caption
                            };
                            break;

                        case 'photo':
                            post.image = {
                                url:  this.getPictureUrl(data.object_id),
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
    getFeed: service.getFeed.bind(service)
};