let http    = require('../helpers/http'),
    utils   = require('../helpers/utils'),
    {check} = require('../helpers/validator'),
    log     = require('../helpers/logger'),
    parse   = require('./parsers/instagram'); // using a parser until I switch to their api.

class InstagramService {
    constructor(props) {
        this.storage  = {};
        this.settings = {
            pageUrl:      "https://www.instagram.com/{id}/",
            mediaLinkUrl: "https://www.instagram.com/p/{mediaCode}/?taken-by={userName}",
            mediaLimit:   5,
            expiration:   10
        };

        utils.extend(this.settings, props, true);

        // TODO: validation
    }

    getFeedUrl () { return this.settings.pageUrl.split('{id}').join(this.settings.pageId); }

    getMediaUrl (code, username) { 
        return this.settings.mediaLinkUrl
            .split('{mediaCode}').join(code)
            .split('{userName}') .join(username); 
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
                let data     = parse(response).entry_data.ProfilePage[0].user;

                res = {};

                res.meta = {
                    pageId:     data.id,
                    pageName:   data.full_name,
                    userName:   data.username,
                    bio:        data.biography,
                    followedBy: data.followed_by ? data.followed_by.count : 0,
                    following:  data.follows     ? data.follows    .count : 0,
                    postCount:  data.media.count,
                    profilePic: data.profile_pic_url
                };

                res.media = utils.map(data.media.nodes, props => {

                    let uploaded = new Date(props.date * 1000).toUtc();

                    try {
                        return {
                            mediaId:         props.id,
                            caption:         props.caption,
                            thumbnailUrl:    props.thumbnail_src,
                            displayUrl:      props.display_src,
                            linkUrl:         this.getMediaUrl(props.code, res.meta.userName),
                            isVideo:         props.is_video,
                            videoViews:      props.video_views,
                            commentCount:    props.comments ? props.comments.count : 0,
                            likeCount:       props.likes    ? props.likes   .count : 0,
                            uploadedTimeKey: new Date(props.date * 1000).toUtc().getDateTimeKey(),
                        }
                    }
                    catch (e) { log.error(e); }
                });

                this.save(res);
                resolve(res);
            }
            catch (e) { reject(e); }
        });
    }

    save(data) {
        this.storage.data      = data;
        this.storage.retrieved = new Date();
    }
}


const service = new InstagramService((require('../settings.json') || {}).instagram);
Object.freeze(service);

module.exports = { 
    getFeed: service.getFeed.bind(service)
};