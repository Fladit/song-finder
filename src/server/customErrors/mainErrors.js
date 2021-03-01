errorCodes = {
    REQUEST_LIMIT_ERROR: 1,
    SHORT_VIDEO_ERROR: 2,
    INCORRECT_VIDEO_LINK_ERROR: 3,
}

const mainErrors = {
    REQUEST_LIMIT_ERROR: {
        status: "error",
        error: {
            code: errorCodes.REQUEST_LIMIT_ERROR,
            name: "RequestLimitError",
            message: "Request limit exceeded! Not more than 3 requests per 1 minute.",
        }
    },
    SHORT_VIDEO_ERROR: {
        status: "error",
        error: {
            code: errorCodes.SHORT_VIDEO_ERROR,
            name: "ShortVideoError",
            message: "The video is too short. No less than 5 seconds.",
        }
    },
    INCORRECT_VIDEO_LINK_ERROR: {
        status: "error",
        error: {
            code: errorCodes.INCORRECT_VIDEO_LINK_ERROR,
            name: "IncorrectVideoLinkError",
            message: "Incorrect video link."
        }
    }

}

const createCustomError = (message, code = 0, name = "UnexpectedServerError") => {
    return {
        status: "error",
        error: {
            name,
            code,
            message,
        }
    }
}

module.exports = {mainErrors, createCustomError}
