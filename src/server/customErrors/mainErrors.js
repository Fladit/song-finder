const mainErrors = {
    REQUEST_LIMIT_ERROR: {
        name: "RequestLimitError",
        message: "Request limit exceeded! Not more than 3 requests per 1 minute."
    },
    SHORT_VIDEO_ERROR: {
        name: "ShortVideoError",
        message: "The video is too short. No less than 5 seconds."
    },
    INCORRECT_VIDEO_LINK_ERROR: {
        name: "IncorrectVideoLinkError",
        message: "Incorrect video link."
    }

}

module.exports = mainErrors
