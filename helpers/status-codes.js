module.exports = {
    success: {
        ok            : 200,
        created       : 201,
        accepted      : 202,
        noContent     : 204,
        resetContent  : 205,
        partialContent: 206
    },

    redirect: {
        multipleChoices  : 300,
        movedPermanently : 301,
        found            : 302,
        seeOther         : 303,
        notModified      : 304,
        useProxy         : 305,
        unused           : 306,
        temporaryRedirect: 307
    },

    clientError: {
        badRequest       : 400,
        unauthorized     : 401,
        paymentRequired  : 402,
        forbidden        : 403,
        notFound         : 404,
        methodNotAllowed : 405,
        notAcceptable    : 406,
        proxyAuthRequired: 407,
        requestTimeout   : 408,
        conflict         : 409
    },

    serverError: {
        internal              : 500,
        notImplemented        : 501,
        badGateway            : 502,
        serviceUnavailable    : 503,
        gatewayTimeout        : 504,
        httpVersionNotSupporte: 505

    }
};