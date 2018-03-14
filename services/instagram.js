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
                let data     = parse(response).entry_data.ProfilePage[0].graphql.user;

                res = {};

                res.meta = {
                    pageId:     data.id,
                    pageName:   data.full_name,
                    userName:   data.username,
                    bio:        data.biography,
                    followedBy: data.edge_followed_by ? data.edge_followed_by.count : 0,
                    following:  data.edge_follow      ? data.edge_follow     .count : 0,
                    postCount:  data.edge_owner_to_timeline_media.count,
                    profilePic: data.profile_pic_url
                };

                res.media = utils.map(data.edge_owner_to_timeline_media.edges, post => {
                    const props = post.node;

                    try {
                        return {
                            mediaId:         props.id,
                            caption:         props.edge_media_to_caption && props.edge_media_to_caption.edges.length ? props.edge_media_to_caption.edges[0].node.text : null,
                            thumbnailUrl:    props.thumbnail_src,
                            displayUrl:      props.display_url,
                            linkUrl:         this.getMediaUrl(props.shortcode, res.meta.userName),
                            isVideo:         props.is_video,
                            videoViews:      props.video_view_count,
                            commentCount:    props.edge_media_to_comment ? props.edge_media_to_comment.count : 0,
                            likeCount:       props.edge_liked_by         ? props.edge_liked_by        .count : 0,
                            uploadedTimeKey: new Date(props.taken_at_timestamp * 1000).toUtc().getDateTimeKey(),
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
